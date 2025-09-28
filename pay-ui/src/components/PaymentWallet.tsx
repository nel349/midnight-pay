import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Logger } from 'pino';
import { useRuntimeConfiguration } from '../config/RuntimeConfiguration';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import type { PaymentProviders, PaymentCircuitKeys } from '@midnight-pay/pay-api';
import type { PaymentPrivateState } from '@midnight-pay/pay-contract';
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

type PaymentAccountId = string;

interface PaymentWalletState {
  isConnected: boolean;
  widget?: React.ReactNode;
  providers: PaymentProviders;
  connect: () => Promise<void>;
}

const PaymentWalletContext = createContext<PaymentWalletState | null>(null);

export const usePaymentWallet = (): PaymentWalletState => {
  const s = useContext(PaymentWalletContext);
  if (!s) throw new Error('PaymentWallet not loaded');
  return s;
};

export const PaymentWalletProvider: React.FC<{ logger: Logger; children: React.ReactNode }>= ({ logger, children }) => {
  const config = useRuntimeConfiguration();

  // Providers (readonly baseline; connect Lace later to replace wallet/midnight providers)
  const privateStateProvider: PrivateStateProvider<PaymentAccountId, PaymentPrivateState> = useMemo(
    () => levelPrivateStateProvider({ privateStateStoreName: 'payment-private-state' }),
    [],
  );
  const publicDataProvider: PublicDataProvider = useMemo(
    () => indexerPublicDataProvider(config.INDEXER_URI, config.INDEXER_WS_URI),
    [config.INDEXER_URI, config.INDEXER_WS_URI],
  );
  const zkConfigProvider: ZKConfigProvider<PaymentCircuitKeys> = useMemo(
    () => new FetchZkConfigProvider(window.location.origin, fetch.bind(window)),
    [],
  );

  const [isConnected, setIsConnected] = useState(false);
  const [walletAPI, setWalletAPI] = useState<any>(null);

  const proofProvider: ProofProvider<PaymentCircuitKeys> = useMemo(() => {
    // Priority 1: Use proof server from Lace wallet (best CORS compatibility)
    if (walletAPI?.uris?.proverServerUri) {
      logger.info(`🔧 [PaymentProofProvider] Using Lace wallet proof server: ${walletAPI.uris.proverServerUri}`);
      return proofClient(walletAPI.uris.proverServerUri, () => {});
    }

    // Priority 2: Use configured proof server from config
    if (config.PROOF_SERVER_URL) {
      logger.info(`🔧 [PaymentProofProvider] Using configured proof server: ${config.PROOF_SERVER_URL}`);
      return proofClient(config.PROOF_SERVER_URL, () => {});
    }

    // Priority 3: Fallback to localhost
    logger.info(`🔧 [PaymentProofProvider] Using localhost fallback proof server`);
    return proofClient('http://127.0.0.1:6300', () => {});
  }, [walletAPI?.uris?.proverServerUri, config.PROOF_SERVER_URL, logger]);

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

        // Store wallet API with URIs for proof provider
        setWalletAPI({ wallet, uris });
        logger.info(`🔧 [PaymentWalletAPI] Connected with URIs:`, uris);

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
        logger.info(`payment_lace_connected coin=${state.coinPublicKey.slice(0,8)}...`);
      },
    [logger],
  );

  const paymentProviders: PaymentProviders = useMemo(
    () => ({ privateStateProvider, publicDataProvider, zkConfigProvider, proofProvider, walletProvider, midnightProvider }),
    [privateStateProvider, publicDataProvider, zkConfigProvider, proofProvider, walletProvider, midnightProvider],
  );

  const state: PaymentWalletState = { isConnected, providers: paymentProviders, widget: undefined, connect };

  useEffect(() => {
    logger.info('payment_wallet_provider_ready');
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
        logger.warn(`payment_lace_auto_connect_failed: ${(err as Error)?.message}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [connect, isConnected, logger]);

  return <PaymentWalletContext.Provider value={state}>{children}</PaymentWalletContext.Provider>;
};