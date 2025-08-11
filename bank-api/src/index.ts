// Main API exports - following battleship pattern
export {
  BankAPI,
  type DeployedBankAPI,
  type BankDerivedState,
  type BankProviders,
  type BankCircuitKeys,
  type AccountId,
  type UserAction,
  type BankTransaction,
  ACCOUNT_STATE,
  emptyBankState,
  utils
} from './bank-api.js';

// Re-export useful contract types and utilities
export {
  TransactionType,
  type BankPrivateState,
  validatePin,
  validateAmount,
  hashPin,
  generateAccountId,
  maskBalance,
  maskPin
} from '@midnight-bank/bank-contract';

// Default export
export { BankAPI as default } from './bank-api.js';