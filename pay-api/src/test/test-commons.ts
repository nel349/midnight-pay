// Test commons for payment API - following bank pattern
import path from 'path';
import type { Logger } from 'pino';
import type { Wallet } from '@midnight-ntwrk/wallet-api';
import { type Resource, WalletBuilder } from '@midnight-ntwrk/wallet';
import {
  type BalancedTransaction,
  createBalancedTx,
  type MidnightProvider,
  type UnbalancedTransaction,
  type WalletProvider,
  type PrivateStateProvider,
} from '@midnight-ntwrk/midnight-js-types';
import { Transaction as ZswapTransaction } from '@midnight-ntwrk/zswap';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { getLedgerNetworkId, getZswapNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { NetworkId, setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { type CoinInfo, nativeToken, Transaction, type TransactionId } from '@midnight-ntwrk/ledger';
import type { ContractAddress, SigningKey } from '@midnight-ntwrk/compact-runtime';
import * as Rx from 'rxjs';
import { type PaymentProviders, type PaymentAccountId } from '../common-types.js';
import { type PaymentPrivateState } from '@midnight-pay/pay-contract';

export const GENESIS_MINT_WALLET_SEED = '0000000000000000000000000000000000000000000000000000000000000001';

// Payment circuit keys - following bank pattern
export type PaymentCircuitKeys =
  | 'register_merchant'
  | 'deposit_customer_funds'
  | 'withdraw_customer_funds'
  | 'create_subscription'
  | 'pause_subscription'
  | 'resume_subscription'
  | 'cancel_subscription'
  | 'process_subscription_payment'
  | 'withdraw_merchant_earnings'
  | 'prove_active_subscriptions_count';

// Test configuration interface
export interface Config {
  readonly privateStateStoreName: string;
  readonly logDir: string;
  readonly paymentZkConfigPath: string;
  readonly indexer: string;
  readonly indexerWS: string;
  readonly node: string;
  readonly proofServer: string;
}

export interface TestConfiguration {
  seed: string;
  dappConfig: Config;
  psMode: string;
}

export const currentDir = path.resolve(new URL(import.meta.url).pathname, '..');

export class StandaloneConfig implements Config {
  privateStateStoreName = 'payment-private-state';
  logDir = path.resolve(currentDir, '..', 'logs', 'standalone', `${new Date().toISOString()}.log`);
  paymentZkConfigPath = path.resolve(currentDir, '..', '..', '..', 'pay-contract', 'src', 'managed', 'pay');
  indexer = 'http://127.0.0.1:8088/api/v1/graphql';
  indexerWS = 'ws://127.0.0.1:8088/api/v1/graphql/ws';
  node = 'http://127.0.0.1:9944';
  proofServer = 'http://127.0.0.1:6300';

  constructor() {
    setNetworkId(NetworkId.Undeployed);
  }
}

export class LocalTestConfig implements TestConfiguration {
  seed = GENESIS_MINT_WALLET_SEED;
  dappConfig = new StandaloneConfig();
  psMode = 'undeployed';
}

// In-memory private state provider for testing
export function inMemoryPrivateStateProvider<PSI extends string = string, PS = any>(): PrivateStateProvider<PSI, PS> {
  const stateStore = new Map<PSI, PS>();
  const signingKeys = new Map<ContractAddress, SigningKey>();

  return {
    async set(privateStateId: PSI, state: PS): Promise<void> {
      stateStore.set(privateStateId, state);
    },

    async get(privateStateId: PSI): Promise<PS | null> {
      return stateStore.has(privateStateId) ? stateStore.get(privateStateId)! : null;
    },

    async remove(privateStateId: PSI): Promise<void> {
      stateStore.delete(privateStateId);
    },

    async clear(): Promise<void> {
      stateStore.clear();
    },

    async setSigningKey(address: ContractAddress, signingKey: SigningKey): Promise<void> {
      signingKeys.set(address, signingKey);
    },

    async getSigningKey(address: ContractAddress): Promise<SigningKey | null> {
      return signingKeys.has(address) ? signingKeys.get(address)! : null;
    },

    async removeSigningKey(address: ContractAddress): Promise<void> {
      signingKeys.delete(address);
    },

    async clearSigningKeys(): Promise<void> {
      signingKeys.clear();
    },
  };
}

// Test environment class - following bank pattern
export class TestEnvironment {
  private readonly logger: Logger;
  private testConfig: TestConfiguration;
  private testWallet1: TestWallet | undefined;

  constructor(logger: Logger) {
    this.logger = logger;
    this.testConfig = new LocalTestConfig();
  }

  start = async (): Promise<TestConfiguration> => {
    this.testConfig = new LocalTestConfig();
    if (process.env.RUN_STANDALONE === 'true') {
      this.logger.info('Running payment tests against an existing standalone stack...');
      return this.testConfig;
    }

    // TODO: Add Docker Compose setup when payment infrastructure is ready
    this.logger.info('Payment test containers would start here...');
    // For now, use standalone configuration
    return this.testConfig;
  };

  shutdown = async () => {
    if (this.testWallet1 !== undefined) {
      await this.testWallet1.close();
    }
    // TODO: Add environment cleanup when docker compose is added
  };

  getWallet1 = async () => {
    this.testWallet1 = new TestWallet(this.logger);
    return await this.testWallet1.setup(this.testConfig);
  };
}

// Test wallet class - following bank pattern
export class TestWallet {
  private wallet: (Wallet & Resource) | undefined;
  logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  setup = async (testConfiguration: TestConfiguration) => {
    this.logger.info('Setting up payment test wallet');
    this.wallet = await this.buildWalletAndWaitForFunds(testConfiguration.dappConfig, testConfiguration.seed);
    const state = await Rx.firstValueFrom(this.wallet.state());
    return this.wallet;
  };

  waitForFunds = (wallet: Wallet) =>
    Rx.firstValueFrom(
      wallet.state().pipe(
        Rx.throttleTime(10_000),
        Rx.map((s) => s.balances[nativeToken()] ?? 0n),
        Rx.filter((balance) => balance > 0n),
      ),
    );

  buildWalletAndWaitForFunds = async (
    { indexer, indexerWS, node, proofServer }: Config,
    seed: string,
  ): Promise<Wallet & Resource> => {
    const wallet = await WalletBuilder.buildFromSeed(
      indexer,
      indexerWS,
      proofServer,
      node,
      seed,
      getZswapNetworkId(),
      'warn',
    );
    wallet.start();
    const state = await Rx.firstValueFrom(wallet.state());
    this.logger.info({ event: 'payment_wallet', seed, address: state.address });
    let balance = state.balances[nativeToken()];
    if (balance === undefined || balance === 0n) {
      this.logger.info({ event: 'payment_wallet_wait_for_funds' });
      balance = await this.waitForFunds(wallet);
    }
    this.logger.info({ event: 'payment_wallet_balance', balance: balance?.toString() });
    return wallet;
  };

  close = async () => {
    if (this.wallet !== undefined) {
      await this.wallet.close();
    }
  };
}

// Test providers class - following bank pattern
export class TestProviders {
  createWalletAndMidnightProvider = async (wallet: Wallet): Promise<WalletProvider & MidnightProvider> => {
    const state = await Rx.firstValueFrom(wallet.state());
    return {
      encryptionPublicKey: state.encryptionPublicKey,
      coinPublicKey: state.coinPublicKey,
      balanceTx(tx: UnbalancedTransaction, newCoins: CoinInfo[]): Promise<BalancedTransaction> {
        return wallet
          .balanceTransaction(
            ZswapTransaction.deserialize(tx.serialize(getZswapNetworkId()), getZswapNetworkId()),
            newCoins,
          )
          .then((tx) => wallet.proveTransaction(tx))
          .then((zswapTx) => Transaction.deserialize(zswapTx.serialize(getZswapNetworkId()), getLedgerNetworkId()))
          .then(createBalancedTx);
      },
      submitTx(tx: BalancedTransaction): Promise<TransactionId> {
        return wallet.submitTransaction(tx);
      },
    };
  };

  configurePaymentProviders = async (wallet: Wallet & Resource, config: Config): Promise<PaymentProviders> => {
    const walletAndMidnightProvider = await this.createWalletAndMidnightProvider(wallet);
    const inMemory = inMemoryPrivateStateProvider<PaymentAccountId, PaymentPrivateState>();

    return {
      privateStateProvider: inMemory,
      publicDataProvider: indexerPublicDataProvider(config.indexer, config.indexerWS),
      zkConfigProvider: new NodeZkConfigProvider<PaymentCircuitKeys>(config.paymentZkConfigPath),
      proofProvider: httpClientProofProvider(config.proofServer),
      walletProvider: walletAndMidnightProvider,
      midnightProvider: walletAndMidnightProvider,
    } satisfies PaymentProviders;
  };
}