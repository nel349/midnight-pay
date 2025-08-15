import { type Config, StandaloneConfig } from './config.js';
import {
  DockerComposeEnvironment,
  type StartedDockerComposeEnvironment,
  Wait,
} from 'testcontainers';
import path from 'path';
import * as Rx from 'rxjs';
import { type CoinInfo, nativeToken, Transaction, type TransactionId } from '@midnight-ntwrk/ledger';
import type { Logger } from 'pino';
import type { Wallet } from '@midnight-ntwrk/wallet-api';
import { type Resource, WalletBuilder } from '@midnight-ntwrk/wallet';
import {
  type BalancedTransaction,
  createBalancedTx,
  type MidnightProvider,
  type MidnightProviders,
  type UnbalancedTransaction,
  type WalletProvider,
} from '@midnight-ntwrk/midnight-js-types';
import { Transaction as ZswapTransaction } from '@midnight-ntwrk/zswap';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { getLedgerNetworkId, getZswapNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { inMemoryPrivateStateProvider } from './in-memory-private-state-provider.js';
import type { FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import { type BankPrivateState } from '@midnight-bank/bank-contract';
import { expect } from 'vitest';

export const GENESIS_MINT_WALLET_SEED = '0000000000000000000000000000000000000000000000000000000000000001';

export type BankCircuitKeys = 'create_account' | 'deposit' | 'withdraw' | 'get_token_balance' | 'verify_account_status';

export type BankProviders = MidnightProviders<BankCircuitKeys, string, BankPrivateState>;

export interface TestConfiguration {
  seed: string;
  dappConfig: Config;
  psMode: string;
}

export class LocalTestConfig implements TestConfiguration {
  seed = GENESIS_MINT_WALLET_SEED;
  dappConfig = new StandaloneConfig();
  psMode = 'undeployed';
}

export class TestEnvironment {
  private readonly logger: Logger;
  private env: StartedDockerComposeEnvironment | undefined;
  private testConfig: TestConfiguration;
  private testWallet1: TestWallet | undefined;

  constructor(logger: Logger) {
    this.logger = logger;
    this.testConfig = new LocalTestConfig();
  }

  start = async (): Promise<TestConfiguration> => {
    this.testConfig = new LocalTestConfig();
    if (process.env.RUN_STANDALONE === 'true') {
      this.logger.info('Running tests against an existing standalone stack...');
      return this.testConfig;
    }

    this.logger.info('Test containers starting...');
    const composeFile = process.env.COMPOSE_FILE ?? 'standalone.yml';
    this.logger.info(`Using compose file: ${composeFile}`);
    const rootDir = path.resolve(new URL(import.meta.url).pathname, '..', '..');
    this.env = await new DockerComposeEnvironment(rootDir, composeFile)
      .withWaitStrategy('bank-api-proof-server', Wait.forLogMessage('Actix runtime found; starting in Actix runtime', 1))
      .withWaitStrategy('bank-api-indexer', Wait.forLogMessage(/starting indexing/, 1))
      .withWaitStrategy('bank-api-node', Wait.forLogMessage(/Running JSON-RPC server/, 1))
      .up();

    this.testConfig.dappConfig = {
      ...this.testConfig.dappConfig,
      indexer: TestEnvironment.mapContainerPort(this.env, this.testConfig.dappConfig.indexer, 'bank-api-indexer'),
      indexerWS: TestEnvironment.mapContainerPort(this.env, this.testConfig.dappConfig.indexerWS, 'bank-api-indexer'),
      node: TestEnvironment.mapContainerPort(this.env, this.testConfig.dappConfig.node, 'bank-api-node'),
      proofServer: TestEnvironment.mapContainerPort(this.env, this.testConfig.dappConfig.proofServer, 'bank-api-proof-server'),
    };

    this.logger.info({ event: 'config', config: this.testConfig });
    this.logger.info('Test containers started');
    return this.testConfig;
  };

  static mapContainerPort = (env: StartedDockerComposeEnvironment, url: string, containerName: string) => {
    const mappedUrl = new URL(url);
    const container = env.getContainer(containerName);
    mappedUrl.port = String(container.getFirstMappedPort());
    return mappedUrl.toString().replace(/\/+$/, '');
  };

  shutdown = async () => {
    if (this.testWallet1 !== undefined) {
      await this.testWallet1.close();
    }
    if (this.env !== undefined) {
      this.logger.info('Test containers closing');
      await this.env.down();
    }
  };

  getWallet1 = async () => {
    this.testWallet1 = new TestWallet(this.logger);
    return await this.testWallet1.setup(this.testConfig);
  };
}

export class TestWallet {
  private wallet: (Wallet & Resource) | undefined;
  logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  setup = async (testConfiguration: TestConfiguration) => {
    this.logger.info('Setting up wallet');
    this.wallet = await this.buildWalletAndWaitForFunds(testConfiguration.dappConfig, testConfiguration.seed);
    expect(this.wallet).not.toBeNull();
    const state = await Rx.firstValueFrom(this.wallet.state());
    expect(state.balances[nativeToken()].valueOf()).toBeGreaterThan(BigInt(0));
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
    this.logger.info({ event: 'wallet', seed, address: state.address });
    let balance = state.balances[nativeToken()];
    if (balance === undefined || balance === 0n) {
      this.logger.info({ event: 'wallet_wait_for_funds' });
      balance = await this.waitForFunds(wallet);
    }
    this.logger.info({ event: 'wallet_balance', balance: balance?.toString() });
    return wallet;
  };

  close = async () => {
    if (this.wallet !== undefined) {
      await this.wallet.close();
    }
  };
}

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

  configureBankProviders = async (wallet: Wallet & Resource, config: Config) => {
    const walletAndMidnightProvider = await this.createWalletAndMidnightProvider(wallet);
    const inMemory = inMemoryPrivateStateProvider<string, BankPrivateState>();
    return {
      privateStateProvider: inMemory,
      publicDataProvider: indexerPublicDataProvider(config.indexer, config.indexerWS),
      zkConfigProvider: new NodeZkConfigProvider<BankCircuitKeys>(config.bankZkConfigPath),
      proofProvider: httpClientProofProvider(config.proofServer),
      walletProvider: walletAndMidnightProvider,
      midnightProvider: walletAndMidnightProvider,
    } satisfies BankProviders;
  };
}


