import React, { createContext, useContext, useMemo } from 'react';
import { BehaviorSubject, type Observable } from 'rxjs';
import type { Logger } from 'pino';
import { useBankWallet } from '../components/BankWallet';
import { BankAPI, type BankProviders } from '@midnight-bank/bank-api';
import type { ContractAddress } from '@midnight-ntwrk/compact-runtime';

export interface InProgressAccountDeployment { status: 'in-progress'; address?: ContractAddress }
export interface DeployedAccount { status: 'deployed'; api: BankAPI; address: ContractAddress }
export interface FailedAccountDeployment { status: 'failed'; error: Error; address?: ContractAddress }
export type AccountDeployment = InProgressAccountDeployment | DeployedAccount | FailedAccountDeployment;

export interface AccountItem { observable: BehaviorSubject<AccountDeployment>; address?: ContractAddress }

interface DeployedAccountAPIProvider {
  readonly accountDeployments$: Observable<AccountItem[]>;
  readonly addAccount: (providers: BankProviders, contractAddress: ContractAddress, userId?: string) => AccountItem;
  readonly deployAndAddAccount: (providers: BankProviders) => Promise<AccountItem>;
}

const DeployedAccountContext = createContext<DeployedAccountAPIProvider | null>(null);

export const useDeployedAccountContext = (): DeployedAccountAPIProvider => {
  const ctx = useContext(DeployedAccountContext);
  if (!ctx) throw new Error('DeployedAccountProvider not loaded');
  return ctx;
};

class Manager implements DeployedAccountAPIProvider {
  #subject: BehaviorSubject<AccountItem[]> = new BehaviorSubject<AccountItem[]>([]);
  constructor(private readonly logger: Logger) {}
  get accountDeployments$(): Observable<AccountItem[]> { return this.#subject }

  addAccount = (providers: BankProviders, contractAddress: ContractAddress, userId?: string): AccountItem => {
    const deployment = new BehaviorSubject<AccountDeployment>({ status: 'in-progress', address: contractAddress });
    const item: AccountItem = { observable: deployment, address: contractAddress };
    this.#subject.next([...this.#subject.value, item]);
    void this.#join(providers, deployment, contractAddress, userId);
    return item;
  }

  deployAndAddAccount = async (providers: BankProviders): Promise<AccountItem> => {
    const deployment = new BehaviorSubject<AccountDeployment>({ status: 'in-progress' });
    const item: AccountItem = { observable: deployment };
    this.#subject.next([...this.#subject.value, item]);
    await this.#deploy(providers, deployment);
    return item;
  }

  async #deploy(providers: BankProviders, deployment: BehaviorSubject<AccountDeployment>): Promise<void> {
    try {
      const uuid = crypto.randomUUID();
      const address = await BankAPI.deploy(providers, this.logger);
      const api = await BankAPI.subscribe(uuid, providers, address, this.logger);
      deployment.next({ status: 'deployed', api, address });
    } catch (e) {
      this.logger.error(e);
      deployment.next({ status: 'failed', error: e instanceof Error ? e : new Error(String(e)) });
    }
  }

  async #join(
    providers: BankProviders,
    deployment: BehaviorSubject<AccountDeployment>,
    contractAddress: ContractAddress,
    userId?: string,
  ): Promise<void> {
    try {
      const privateStateId = userId ?? crypto.randomUUID();
      const api = await BankAPI.subscribe(privateStateId, providers, contractAddress, this.logger);
      deployment.next({ status: 'deployed', api, address: contractAddress });
    } catch (e) {
      this.logger.error(e);
      deployment.next({ status: 'failed', error: e instanceof Error ? e : new Error(String(e)), address: contractAddress });
    }
  }
}

export const DeployedAccountProvider: React.FC<{ children: React.ReactNode; logger: Logger }>= ({ children, logger }) => {
  const mgr = useMemo(() => new Manager(logger), [logger]);
  return <DeployedAccountContext.Provider value={mgr}>{children}</DeployedAccountContext.Provider>;
};


