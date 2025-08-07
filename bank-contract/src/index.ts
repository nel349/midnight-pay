import { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import type { Contract as ContractType, Witnesses } from './managed/bank/contract/index.cjs';
import ContractModule, { Ledger } from './managed/bank/contract/index.cjs';

// Re-export contract types and functions
export * from './managed/bank/contract/index.cjs';
export const ledger = ContractModule.ledger;
export const pureCircuits = ContractModule.pureCircuits;
export const { Contract } = ContractModule;
export type Contract<T, W extends Witnesses<T> = Witnesses<T>> = ContractType<T, W>;

// Bank Private State - stored locally in browser, never revealed publicly
export type BankPrivateState = {
  readonly accountPinHash: Uint8Array;         // Hashed PIN for authentication
  readonly accountBalance: bigint;             // Current balance (secret!)
  readonly transactionHistory: Uint8Array[];  // Array of transaction hashes (private)
};

// Create initial private state for new account
export const createBankPrivateState = (
  pinHash: Uint8Array, 
  initialBalance: bigint
): BankPrivateState => ({
  accountPinHash: pinHash,
  accountBalance: initialBalance,
  transactionHistory: [new Uint8Array(32)] // Start with one empty transaction
});

// Witness Functions - provide private data to circuits
// These functions are called when circuits need private inputs
export const bankWitnesses = {
  // Witness 1: Provides account PIN hash for authentication
  account_pin_hash: ({ 
    privateState 
  }: WitnessContext<Ledger, BankPrivateState>): [BankPrivateState, Uint8Array] => [
    privateState,
    privateState.accountPinHash
  ],

  // Witness 2: Provides current account balance (never revealed publicly)
  account_balance: ({ 
    privateState 
  }: WitnessContext<Ledger, BankPrivateState>): [BankPrivateState, bigint] => [
    privateState,
    privateState.accountBalance
  ],

  // Witness 3: Provides transaction history (private)
  transaction_history: ({ 
    privateState 
  }: WitnessContext<Ledger, BankPrivateState>): [BankPrivateState, Uint8Array[]] => [
    privateState,
    privateState.transactionHistory || [new Uint8Array(32)]
  ],

  // Witness 4: Updates account balance in private state
  set_account_balance: (
    { privateState }: WitnessContext<Ledger, BankPrivateState>,
    newBalance: bigint
  ): [BankPrivateState, []] => [
    {
      ...privateState,
      accountBalance: newBalance
    },
    []
  ],

  // Witness 5: Updates transaction history in private state
  set_transaction_history: (
    { privateState }: WitnessContext<Ledger, BankPrivateState>,
    newHistory: Uint8Array[]
  ): [BankPrivateState, []] => [
    {
      ...privateState,
      transactionHistory: newHistory
    },
    []
  ]
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
  return 'ACC' + Math.random().toString(36).substr(2, 9).toUpperCase();
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