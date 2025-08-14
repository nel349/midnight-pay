import { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import type { Contract as ContractType, Witnesses } from './managed/bank/contract/index.cjs';
import * as ContractModule from './managed/bank/contract/index.cjs';
type Ledger = ContractModule.Ledger;

// Re-export contract types and functions
export * from './managed/bank/contract/index.cjs';
export const ledger = ContractModule.ledger;
export const pureCircuits = ContractModule.pureCircuits;
export const { Contract } = ContractModule;
export type Contract<T, W extends Witnesses<T> = Witnesses<T>> = ContractType<T, W>;

// Bank Private State - stored locally in browser, never revealed publicly
// For shared contract: Maps user_id -> user's private data
export type BankPrivateState = {
  readonly userPinHashes: Map<string, Uint8Array>;        // user_id -> PIN hash
  readonly userBalances: Map<string, bigint>;             // user_id -> balance
  readonly userTransactionHistories: Map<string, Uint8Array[]>; // user_id -> transaction history
  readonly pendingTransferAmounts: Map<string, bigint>;   // auth_id -> actual amount (for demo decryption)
};

// Create initial private state for shared bank (empty)
export const createBankPrivateState = (): BankPrivateState => ({
  userPinHashes: new Map(),
  userBalances: new Map(),
  userTransactionHistories: new Map(),
  pendingTransferAmounts: new Map()
});

// Helper to add a new user to private state
export const addUserToPrivateState = (
  state: BankPrivateState,
  userId: string,
  pinHash: Uint8Array,
  initialBalance: bigint
): BankPrivateState => ({
  userPinHashes: new Map(state.userPinHashes).set(userId, pinHash),
  userBalances: new Map(state.userBalances).set(userId, initialBalance),
  userTransactionHistories: new Map(state.userTransactionHistories).set(userId, Array(10).fill(new Uint8Array(32))),
  pendingTransferAmounts: new Map(state.pendingTransferAmounts || new Map())
});

// Witness Functions - provide private data to circuits (Proper Multi-User Implementation)
// These functions are called when circuits need private inputs
export const bankWitnesses = {
  // Witness 1: Provides user's PIN hash for authentication (user-specific)
  user_pin_hash: ({ 
    privateState 
  }: WitnessContext<Ledger, BankPrivateState>, 
    userId: Uint8Array
  ): [BankPrivateState, Uint8Array] => {
    const userIdStr = new TextDecoder().decode(userId).replace(/\0/g, '');
    const pinHash = privateState.userPinHashes.get(userIdStr);
    if (!pinHash) {
      throw new Error(`User ${userIdStr} not found in private state`);
    }
    return [privateState, pinHash];
  },

  // Witness 2: Provides user's current balance (user-specific, never revealed publicly)
  user_balance: ({ 
    privateState 
  }: WitnessContext<Ledger, BankPrivateState>, 
    userId: Uint8Array
  ): [BankPrivateState, bigint] => {
    const userIdStr = new TextDecoder().decode(userId).replace(/\0/g, '');
    const balance = privateState.userBalances.get(userIdStr);
    return [privateState, balance ?? 0n];
  },

  // Witness 3: Provides user's transaction history (user-specific, private) - exactly 10 entries
  user_transaction_history: ({ 
    privateState 
  }: WitnessContext<Ledger, BankPrivateState>, 
    userId: Uint8Array
  ): [BankPrivateState, Uint8Array[]] => {
    const userIdStr = new TextDecoder().decode(userId).replace(/\0/g, '');
    const history = privateState.userTransactionHistories.get(userIdStr);
    if (!history) {
      throw new Error(`User ${userIdStr} transaction history not found in private state`);
    }
    return [privateState, history.length === 10 ? history : Array(10).fill(new Uint8Array(32))];
  },

  // Witness 4: Updates user's balance in private state (user-specific)
  set_user_balance: (
    { privateState }: WitnessContext<Ledger, BankPrivateState>,
    userId: Uint8Array,
    newBalance: bigint
  ): [BankPrivateState, []] => {
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

  // Witness 5: Updates user's transaction history in private state (user-specific, exactly 10 entries)
  set_user_transaction_history: (
    { privateState }: WitnessContext<Ledger, BankPrivateState>,
    userId: Uint8Array,
    newHistory: Uint8Array[]
  ): [BankPrivateState, []] => {
    const userIdStr = new TextDecoder().decode(userId).replace(/\0/g, '');
    const newUserHistories = new Map(privateState.userTransactionHistories);
    newUserHistories.set(userIdStr, newHistory.slice(0, 10)); // Ensure max 10 entries
    
    return [
      {
        ...privateState,
        userTransactionHistories: newUserHistories
      },
      []
    ];
  },

  // Note: store_pending_amount and decrypt_balance_witness removed - using public ledger instead
};

// Utility functions for PIN handling
export function hashPin(pin: string): Uint8Array {
  // Simple hash function for demo - in production use proper cryptographic hash
  const encoder = new TextEncoder();
  const pinBytes = encoder.encode(pin);
  const hash = new Uint8Array(32);
  
  // Simple XOR-based hash for demo purposes
  for (let i = 0; i < pinBytes.length && i < 32; i++) {
    hash[i] = pinBytes[i] ^ (i + 1);
  }
  
  return hash;
}

export function generateAccountId(): string {
  // Generate a unique account ID
  return 'ACC' + Math.random().toString(36).substring(2, 11).toUpperCase();
}

// Transaction types for better UX
export enum TransactionType {
  ACCOUNT_CREATED = 'account_created',
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  BALANCE_CHECK = 'balance_check',
  VERIFICATION = 'verification'
}

export interface TransactionInfo {
  type: TransactionType;
  timestamp: Date;
  hash: Uint8Array;
  // Note: amount is NOT included for privacy
}

// Validation helpers
export function validatePin(pin: string): boolean {
  // Basic PIN validation - in production this would be more robust
  return pin.length >= 4 && pin.length <= 8 && /^\d+$/.test(pin);
}

export function validateAmount(amount: string): boolean {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num <= 1000000; // Max 1M for demo
}

// Privacy utility functions
export function maskBalance(balance: bigint, showBalance: boolean): string {
  if (showBalance) {
    return `$${balance.toString()}`;
  }
  return '****';
}

export function maskPin(pin: string): string {
  return '*'.repeat(pin.length);
}

// Demo data for testing
export const DEMO_PIN = '1234';
export const DEMO_INITIAL_DEPOSIT = 100n;

export default {
  Contract,
  ledger,
  pureCircuits,
  bankWitnesses,
  createBankPrivateState,
  hashPin,
  validatePin,
  validateAmount,
  TransactionType
};