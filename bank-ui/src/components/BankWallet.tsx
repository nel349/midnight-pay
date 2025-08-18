import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Logger } from 'pino';
import { useRuntimeConfiguration } from '../config/RuntimeConfiguration';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import type { BankProviders, BankCircuitKeys } from '@midnight-bank/bank-api';
import type { BankPrivateState } from '@midnight-bank/bank-contract';
import type { PrivateStateProvider } from '@midnight-ntwrk/midnight-js-types/dist/private-state-provider';
import type { PublicDataProvider } from '@midnight-ntwrk/midnight-js-types/dist/public-data-provider';
import type { ProofProvider } from '@midnight-ntwrk/midnight-js-types/dist/proof-provider';
import type { ZKConfigProvider } from '@midnight-ntwrk/midnight-js-types/dist/zk-config-provider';
import type { WalletProvider } from '@midnight-ntwrk/midnight-js-types/dist/wallet-provider';
import type { MidnightProvider } from '@midnight-ntwrk/midnight-js-types/dist/midnight-provider';
import { connectToWallet } from './connectToWallet';
import { Transaction as ZswapTransaction } from '@midnight-ntwrk/zswap';
import { Transaction, type CoinInfo, type TransactionId } from '@midnight-ntwrk/ledger';
import { createBalancedTx, type BalancedTransaction, type UnbalancedTransaction } from '@midnight-ntwrk/midnight-js-types';
import { getLedgerNetworkId, getZswapNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { proofClient } from './proofClient';

type AccountId = string;

interface BankWalletState {
  isConnected: boolean;
  widget?: React.ReactNode;
  providers: BankProviders;
  connect: () => Promise<void>;
}

const BankWalletContext = createContext<BankWalletState | null>(null);

export const useBankWallet = (): BankWalletState => {
  const s = useContext(BankWalletContext);
  if (!s) throw new Error('BankWallet not loaded');
  return s;
};

export const BankWalletProvider: React.FC<{ logger: Logger; children: React.ReactNode }>= ({ logger, children }) => {
  const config = useRuntimeConfiguration();

  // Providers (readonly baseline; connect Lace later to replace wallet/midnight providers)
  const privateStateProvider: PrivateStateProvider<AccountId, BankPrivateState> = useMemo(
    () => levelPrivateStateProvider({ privateStateStoreName: 'bank-private-state' }),
    [],
  );
  const publicDataProvider: PublicDataProvider = useMemo(
    () => indexerPublicDataProvider(config.INDEXER_URI, config.INDEXER_WS_URI),
    [config.INDEXER_URI, config.INDEXER_WS_URI],
  );
  const zkConfigProvider: ZKConfigProvider<BankCircuitKeys> = useMemo(
    () => new FetchZkConfigProvider(window.location.origin, fetch.bind(window)),
    [],
  );
  const proofProvider: ProofProvider<BankCircuitKeys> = useMemo(
    () => proofClient(config.PROOF_SERVER_URL ?? 'http://127.0.0.1:6300', () => {}),
    [config.PROOF_SERVER_URL],
  );

  const [isConnected, setIsConnected] = useState(false);
  const [walletProvider, setWalletProvider] = useState<WalletProvider>({
    coinPublicKey: '',
    encryptionPublicKey: '',
    balanceTx: async () => Promise.reject(new Error('readonly')),
  });
  const [midnightProvider, setMidnightProvider] = useState<MidnightProvider>({
    submitTx: async () => Promise.reject(new Error('readonly')),
  });

  const connect = useMemo(
    () =>
      async () => {
        const { wallet, uris } = await connectToWallet(logger);
        const state = await wallet.state();
        setWalletProvider({
          coinPublicKey: state.coinPublicKey,
          encryptionPublicKey: state.encryptionPublicKey,
          balanceTx(tx: UnbalancedTransaction, newCoins: CoinInfo[]): Promise<BalancedTransaction> {
            return wallet
              .balanceAndProveTransaction(
                ZswapTransaction.deserialize(tx.serialize(getLedgerNetworkId()), getZswapNetworkId()),
                newCoins,
              )
              .then((zswapTx) => Transaction.deserialize(zswapTx.serialize(getZswapNetworkId()), getLedgerNetworkId()))
              .then(createBalancedTx);
          },
        });
        setMidnightProvider({
          submitTx(tx: BalancedTransaction): Promise<TransactionId> {
            return wallet.submitTransaction(tx);
          },
        });
        setIsConnected(true);
        logger.info(`lace_connected coin=${state.coinPublicKey.slice(0,8)}...`);
      },
    [logger],
  );

  const bankProviders: BankProviders = useMemo(
    () => ({ privateStateProvider, publicDataProvider, zkConfigProvider, proofProvider, walletProvider, midnightProvider }),
    [privateStateProvider, publicDataProvider, zkConfigProvider, proofProvider, walletProvider, midnightProvider],
  );

  const state: BankWalletState = { isConnected, providers: bankProviders, widget: undefined, connect };

  useEffect(() => {
    logger.info('bank_wallet_provider_ready');
  }, [logger]);

  // Auto-connect silently if Lace previously authorized this origin
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const api: any = (window as any)?.midnight?.mnLace;
        if (api && typeof api.isEnabled === 'function') {
          const enabled = await api.isEnabled();
          if (enabled && !cancelled && !isConnected) {
            await connect();
          }
        }
      } catch (err) {
        logger.warn(`lace_auto_connect_failed: ${(err as Error)?.message}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [connect, isConnected, logger]);

  return <BankWalletContext.Provider value={state}>{children}</BankWalletContext.Provider>;
};


