import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { type Logger } from 'pino';
import {
  type BankContract,
  type BankDerivedState,
  type BankProviders,
  type DeployedBankContract,
  emptyBankState,
  type UserAction,
  type AccountId,
  ACCOUNT_STATE
} from './common-types.js';
import {
  type BankPrivateState,
  Contract,
  createBankPrivateState,
  ledger,
  pureCircuits,
  bankWitnesses,
  TransactionType,
  hashPin,
} from '@midnight-bank/bank-contract';
import * as utils from './utils/index.js';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { combineLatest, concat, defer, from, map, type Observable, of, retry, scan, Subject } from 'rxjs';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';
import type { PrivateStateProvider } from '@midnight-ntwrk/midnight-js-types/dist/private-state-provider';

const bankContract: BankContract = new Contract(bankWitnesses);

export interface DeployedBankAPI {
  readonly deployedContractAddress: ContractAddress;
  readonly state$: Observable<BankDerivedState>;

  createAccount(pin: string, initialDeposit: string): Promise<void>;
  deposit(pin: string, amount: string): Promise<void>;
  withdraw(pin: string, amount: string): Promise<void>;
  authenticateBalanceAccess(pin: string): Promise<void>;
  verifyAccountStatus(pin: string): Promise<void>;
}

export class BankAPI implements DeployedBankAPI {
  private constructor(
    public readonly accountId: AccountId,
    public readonly deployedContract: DeployedBankContract,
    public readonly providers: BankProviders,
    private readonly logger: Logger,
  ) {
    const combine = (acc: BankDerivedState, value: BankDerivedState): BankDerivedState => {
      return {
        accountExists: value.accountExists,
        accountOwner: value.accountOwner ?? acc.accountOwner,
        accountStatus: value.accountStatus,
        transactionCount: value.transactionCount,
        lastTransactionHash: value.lastTransactionHash,
        whoami: value.whoami,
        balance: value.balance ?? acc.balance,
        transactionHistory: value.transactionHistory ?? acc.transactionHistory,
        lastTransaction: value.lastTransaction,
        lastCancelledTransaction: value.lastCancelledTransaction,
      };
    };

    this.deployedContractAddress = deployedContract.deployTxData.public.contractAddress;
    this.transactions$ = new Subject<UserAction>();
    this.privateStates$ = new Subject<BankPrivateState>();
    this.state$ = combineLatest(
      [
        providers.publicDataProvider
          .contractStateObservable(this.deployedContractAddress, { type: 'all' })
          .pipe(map((contractState) => ledger(contractState.data))),
        concat(
          from(defer(() => providers.privateStateProvider.get(accountId) as Promise<BankPrivateState>)),
          this.privateStates$,
        ),
        concat(of<UserAction>({ transaction: undefined, cancelledTransaction: undefined }), this.transactions$),
      ],
      (ledgerState, privateState, userActions) => {
        const whoami = pureCircuits.public_key ? pureCircuits.public_key(privateState.accountPinHash) : new Uint8Array(32);
        const result: BankDerivedState = {
          accountExists: ledgerState.account_exists,
          accountOwner: ledgerState.account_owner.is_some ? toHex(ledgerState.account_owner.value) : undefined,
          accountStatus: this.mapAccountStatus(ledgerState.account_status),
          transactionCount: ledgerState.transaction_count,
          lastTransactionHash: toHex(ledgerState.last_transaction),
          whoami: toHex(whoami),
          balance: privateState.accountBalance,
          transactionHistory: privateState.transactionHistory,
          lastTransaction: userActions.transaction,
          lastCancelledTransaction: userActions.cancelledTransaction,
        };
        return result;
      },
    ).pipe(
      scan(combine, emptyBankState),
      retry({
        delay: 500,
      }),
    );
  }

  readonly deployedContractAddress: ContractAddress;

  readonly state$: Observable<BankDerivedState>;

  readonly transactions$: Subject<UserAction>;

  readonly privateStates$: Subject<BankPrivateState>;

  async createAccount(pin: string, initialDeposit: string): Promise<void> {
    this.logger?.info({ createAccount: { initialDeposit } });
    this.transactions$.next({
      transaction: {
        type: TransactionType.ACCOUNT_CREATED,
        amount: utils.parseAmount(initialDeposit),
        timestamp: new Date(),
        pin,
      },
      cancelledTransaction: undefined,
    });

    try {
      const txData = await this.deployedContract.callTx.create_account(
        utils.pad(pin, 32),
        utils.parseAmount(initialDeposit)
      );
      this.logger?.trace({
        accountCreated: {
          initialDeposit,
          txHash: txData.public.txHash,
          blockHeight: txData.public.blockHeight,
        },
      });
    } catch (e) {
      this.transactions$.next({
        cancelledTransaction: {
          type: TransactionType.ACCOUNT_CREATED,
          amount: utils.parseAmount(initialDeposit),
          timestamp: new Date(),
          pin,
        },
        transaction: undefined,
      });
      throw e;
    }
  }

  async deposit(pin: string, amount: string): Promise<void> {
    this.logger?.info({ deposit: { amount } });
    this.transactions$.next({
      transaction: {
        type: TransactionType.DEPOSIT,
        amount: utils.parseAmount(amount),
        timestamp: new Date(),
        pin,
      },
      cancelledTransaction: undefined,
    });

    try {
      const txData = await this.deployedContract.callTx.deposit(
        utils.pad(pin, 32),
        utils.parseAmount(amount)
      );
      this.logger?.trace({
        depositMade: {
          amount,
          txHash: txData.public.txHash,
          blockHeight: txData.public.blockHeight,
        },
      });
    } catch (e) {
      this.transactions$.next({
        cancelledTransaction: {
          type: TransactionType.DEPOSIT,
          amount: utils.parseAmount(amount),
          timestamp: new Date(),
          pin,
        },
        transaction: undefined,
      });
      throw e;
    }
  }

  async withdraw(pin: string, amount: string): Promise<void> {
    this.logger?.info({ withdraw: { amount } });
    this.transactions$.next({
      transaction: {
        type: TransactionType.WITHDRAWAL,
        amount: utils.parseAmount(amount),
        timestamp: new Date(),
        pin,
      },
      cancelledTransaction: undefined,
    });

    try {
      const txData = await this.deployedContract.callTx.withdraw(
        utils.pad(pin, 32),
        utils.parseAmount(amount)
      );
      this.logger?.trace({
        withdrawalMade: {
          amount,
          txHash: txData.public.txHash,
          blockHeight: txData.public.blockHeight,
        },
      });
    } catch (e) {
      this.transactions$.next({
        cancelledTransaction: {
          type: TransactionType.WITHDRAWAL,
          amount: utils.parseAmount(amount),
          timestamp: new Date(),
          pin,
        },
        transaction: undefined,
      });
      throw e;
    }
  }

  async authenticateBalanceAccess(pin: string): Promise<void> {
    this.logger?.info('authenticateBalanceAccess');
    const txData = await this.deployedContract.callTx.authenticate_balance_access(
      utils.pad(pin, 32)
    );
    this.logger?.trace({
      balanceAccessAuthenticated: {
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
  }

  async verifyAccountStatus(pin: string): Promise<void> {
    this.logger?.info('verifyAccountStatus');
    const txData = await this.deployedContract.callTx.verify_account_status(
      utils.pad(pin, 32)
    );
    this.logger?.trace({
      accountStatusVerified: {
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
  }

  static async deploy(
    accountId: AccountId,
    providers: BankProviders,
    logger: Logger,
  ): Promise<BankAPI> {
    logger.info({
      deployBankContract: {
        accountId,
      },
    });
    const deployedBankContract = await deployContract(providers, {
      privateStateId: accountId,
      contract: bankContract,
      initialPrivateState: await BankAPI.getPrivateState(accountId, providers.privateStateProvider),
    });

    logger.trace({
      bankContractDeployed: {
        accountId,
        finalizedDeployTxData: deployedBankContract.deployTxData.public,
      },
    });

    return new BankAPI(accountId, deployedBankContract, providers, logger);
  }

  static async subscribe(
    accountId: AccountId,
    providers: BankProviders,
    contractAddress: ContractAddress,
    logger: Logger,
  ): Promise<BankAPI> {
    logger.info({
      subscribeBankContract: {
        accountId,
        contractAddress,
      },
    });

    const deployedBankContract = await findDeployedContract(providers, {
      contractAddress,
      contract: bankContract,
      privateStateId: accountId,
      initialPrivateState: await BankAPI.getPrivateState(accountId, providers.privateStateProvider),
    });

    logger.trace({
      bankContractSubscribed: {
        accountId,
        finalizedDeployTxData: deployedBankContract.deployTxData.public,
      },
    });

    return new BankAPI(accountId, deployedBankContract, providers, logger);
  }

  static async getOrCreateInitialPrivateState(
    privateStateProvider: PrivateStateProvider<AccountId, BankPrivateState>,
  ): Promise<BankPrivateState> {
    let state = await privateStateProvider.get('initial');
    if (state === null) {
      state = this.createPrivateState(utils.randomBytes(32));
      await privateStateProvider.set('initial', state);
    }
    return state;
  }

  static async accountExists(providers: BankProviders, contractAddress: ContractAddress): Promise<boolean> {
    try {
      const state = await providers.publicDataProvider.queryContractState(contractAddress);
      if (state === null) {
        return false;
      }
      void ledger(state.data); // try to parse it
      return true;
    } catch (e) {
      return false;
    }
  }

  static async getPublicKey(providers: BankProviders): Promise<Uint8Array> {
    const state = await this.getOrCreateInitialPrivateState(providers.privateStateProvider);
    return pureCircuits.public_key ? pureCircuits.public_key(state.accountPinHash) : new Uint8Array(32);
  }

  private static async getPrivateState(
    accountId: AccountId,
    providers: PrivateStateProvider<AccountId, BankPrivateState>,
  ): Promise<BankPrivateState> {
    const existingPrivateState = await providers.get(accountId);
    const initialState = await this.getOrCreateInitialPrivateState(providers);
    return existingPrivateState ?? this.createPrivateState(initialState.accountPinHash);
  }

  private static createPrivateState(pinHash: Uint8Array): BankPrivateState {
    return createBankPrivateState(pinHash, 0n);
  }

  private mapAccountStatus(statusBytes: Uint8Array): ACCOUNT_STATE {
    try {
      const decoder = new TextDecoder();
      const status = decoder.decode(statusBytes).replace(/\0/g, '');
      switch (status) {
        case 'active': return ACCOUNT_STATE.active;
        case 'verified': return ACCOUNT_STATE.verified;
        case 'suspended': return ACCOUNT_STATE.suspended;
        default: return ACCOUNT_STATE.inactive;
      }
    } catch {
      return ACCOUNT_STATE.inactive;
    }
  }
}

export * as utils from './utils/index.js';
export * from './common-types.js';