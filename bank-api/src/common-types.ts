import { type MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { type FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import {
  type BankPrivateState,
  type Contract,
  type bankWitnesses,
  TransactionType
} from '@midnight-bank/bank-contract';

export type AccountId = string;

export type BankContract = Contract<BankPrivateState, typeof bankWitnesses>;

export type BankCircuitKeys = Exclude<keyof BankContract['impureCircuits'], number | symbol>;

export type BankProviders = MidnightProviders<BankCircuitKeys, AccountId, BankPrivateState>;

export type DeployedBankContract = FoundContract<BankContract>;

export type BankTransaction = {
  type: TransactionType;
  amount?: bigint;
  timestamp: Date;
  pin: string;
};

export type DetailedTransaction = {
  readonly type: 'create' | 'deposit' | 'withdraw' | 'auth' | 'verify' | 'transfer_out' | 'transfer_in' | 'auth_request' | 'auth_approve' | 'auth_transfer';
  readonly amount?: bigint;
  readonly balanceAfter: bigint;
  readonly timestamp: Date;
  readonly counterparty?: string; // For transfers, the other user_id
  readonly maxAmount?: bigint; // For authorization approval
};

export type UserAction = {
  transaction: BankTransaction | undefined;
  cancelledTransaction: BankTransaction | undefined;
};

export enum ACCOUNT_STATE {
  inactive = 0,
  active = 1,
  verified = 2,
  suspended = 3
}

export type BankDerivedState = {
  readonly accountExists: boolean;
  readonly accountOwner?: string;
  readonly accountStatus: ACCOUNT_STATE;
  readonly transactionCount: bigint;
  readonly lastTransactionHash: string;
  readonly whoami: string;
  readonly balance: bigint; // From private state
  readonly transactionHistory: Uint8Array[]; // From private state
  readonly lastTransaction?: BankTransaction;
  readonly lastCancelledTransaction?: BankTransaction;
};

export const emptyBankState: BankDerivedState = {
  accountExists: false,
  accountOwner: undefined,
  accountStatus: ACCOUNT_STATE.inactive,
  transactionCount: 0n,
  lastTransactionHash: '',
  whoami: 'unknown',
  balance: 0n,
  transactionHistory: [],
  lastTransaction: undefined,
  lastCancelledTransaction: undefined,
};

export type BankAccountInfo = {
  address: string;
  owner: string | undefined;
  balance: bigint;
  status: ACCOUNT_STATE;
};