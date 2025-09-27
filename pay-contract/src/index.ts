import { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import type { Contract as ContractType, Witnesses } from './managed/pay/contract/index.cjs';
import * as ContractModule from './managed/pay/contract/index.cjs';
type Ledger = ContractModule.Ledger;

// Re-export contract types and functions
export * from './managed/pay/contract/index.cjs';
export const ledger = ContractModule.ledger;
export const pureCircuits = ContractModule.pureCircuits;
export const { Contract } = ContractModule;
export type Contract<T, W extends Witnesses<T> = Witnesses<T>> = ContractType<T, W>;

// Payment Gateway Private State - stored locally, never revealed publicly
export type PaymentPrivateState = {
  readonly userPinHashes: Map<string, Uint8Array>;        // user_id -> PIN hash
  readonly userBalances: Map<string, bigint>;             // user_id -> balance
  readonly merchantSecrets: Map<string, Uint8Array>;      // merchant_id -> merchant secret
  readonly pendingTransferAmounts: Map<string, bigint>;   // auth_id -> actual amount
};

// Create initial private state for payment gateway
export const createPaymentPrivateState = (): PaymentPrivateState => ({
  userPinHashes: new Map(),
  userBalances: new Map(),
  merchantSecrets: new Map(),
  pendingTransferAmounts: new Map()
});

// Helper to add a new user to private state
export const addUserToPrivateState = (
  state: PaymentPrivateState,
  userId: string,
  pinHash: Uint8Array,
  initialBalance: bigint
): PaymentPrivateState => ({
  userPinHashes: new Map(state.userPinHashes).set(userId, pinHash),
  userBalances: new Map(state.userBalances).set(userId, initialBalance),
  merchantSecrets: new Map(state.merchantSecrets),
  pendingTransferAmounts: new Map(state.pendingTransferAmounts)
});

// Helper to add a new merchant to private state
export const addMerchantToPrivateState = (
  state: PaymentPrivateState,
  merchantId: string,
  pinHash: Uint8Array,
  secret: Uint8Array,
  initialBalance: bigint
): PaymentPrivateState => ({
  userPinHashes: new Map(state.userPinHashes).set(merchantId, pinHash),
  userBalances: new Map(state.userBalances).set(merchantId, initialBalance),
  merchantSecrets: new Map(state.merchantSecrets).set(merchantId, secret),
  pendingTransferAmounts: new Map(state.pendingTransferAmounts)
});

// Witness Functions - provide private data to circuits
export const paymentWitnesses = {
  // Witness 1: Provides user's PIN hash for authentication
  user_pin_hash: ({
    privateState
  }: WitnessContext<Ledger, PaymentPrivateState>,
    userId: Uint8Array
  ): [PaymentPrivateState, Uint8Array] => {
    const userIdStr = new TextDecoder().decode(userId).replace(/\0/g, '');
    const pinHash = privateState.userPinHashes.get(userIdStr);
    if (!pinHash) {
      throw new Error(`User ${userIdStr} not found in private state`);
    }
    return [privateState, pinHash];
  },

  // Witness 2: Provides user's current balance
  user_balance: ({
    privateState
  }: WitnessContext<Ledger, PaymentPrivateState>,
    userId: Uint8Array
  ): [PaymentPrivateState, bigint] => {
    const userIdStr = new TextDecoder().decode(userId).replace(/\0/g, '');
    const balance = privateState.userBalances.get(userIdStr);
    return [privateState, balance ?? 0n];
  },

  // Witness 3: Updates user's balance in private state
  set_user_balance: (
    { privateState }: WitnessContext<Ledger, PaymentPrivateState>,
    userId: Uint8Array,
    newBalance: bigint
  ): [PaymentPrivateState, []] => {
    const userIdStr = new TextDecoder().decode(userId).replace(/\0/g, '');
    const newUserBalances = new Map(privateState.userBalances);
    newUserBalances.set(userIdStr, newBalance);

    return [
      {
        ...privateState,
        userBalances: newUserBalances
      },
      []
    ];
  },

  // Witness 4: Provides merchant's secret for verification
  merchant_secret: ({
    privateState
  }: WitnessContext<Ledger, PaymentPrivateState>,
    merchantId: Uint8Array
  ): [PaymentPrivateState, Uint8Array] => {
    const merchantIdStr = new TextDecoder().decode(merchantId).replace(/\0/g, '');
    const secret = privateState.merchantSecrets.get(merchantIdStr);
    if (!secret) {
      throw new Error(`Merchant ${merchantIdStr} not found in private state`);
    }
    return [privateState, secret];
  }
};

// Utility functions
export function hashPin(pin: string): Uint8Array {
  const encoder = new TextEncoder();
  const pinBytes = encoder.encode(pin);
  const hash = new Uint8Array(32);

  for (let i = 0; i < pinBytes.length && i < 32; i++) {
    hash[i] = pinBytes[i] ^ (i + 1);
  }

  return hash;
}

export function generateAccountId(): string {
  return 'ACC' + Math.random().toString(36).substring(2, 11).toUpperCase();
}

export function generateMerchantId(): string {
  return 'MCH' + Math.random().toString(36).substring(2, 11).toUpperCase();
}

export function generateSubscriptionId(): string {
  return 'SUB' + Math.random().toString(36).substring(2, 11).toUpperCase();
}

// Transaction types
export enum TransactionType {
  ACCOUNT_CREATED = 'account_created',
  MERCHANT_REGISTERED = 'merchant_registered',
  SUBSCRIPTION_CREATED = 'subscription_created',
  SUBSCRIPTION_PAYMENT = 'subscription_payment',
  SUBSCRIPTION_PAUSED = 'subscription_paused',
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal'
}

export interface TransactionInfo {
  type: TransactionType;
  timestamp: Date;
  hash: Uint8Array;
}

// Validation helpers
export function validatePin(pin: string): boolean {
  return pin.length >= 4 && pin.length <= 8 && /^\d+$/.test(pin);
}

export function validateAmount(amount: string): boolean {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num <= 1000000;
}

export function validateBusinessName(name: string): boolean {
  return name.length >= 3 && name.length <= 50;
}

// Demo data for testing
export const DEMO_CUSTOMER_PIN = '1234';
export const DEMO_MERCHANT_PIN = '5678';
export const DEMO_INITIAL_DEPOSIT = 1000n;

export default {
  Contract,
  ledger,
  pureCircuits,
  paymentWitnesses,
  createPaymentPrivateState,
  addUserToPrivateState,
  addMerchantToPrivateState,
  hashPin,
  validatePin,
  validateAmount,
  validateBusinessName,
  TransactionType
};