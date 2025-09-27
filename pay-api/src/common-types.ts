// Following bank pattern for provider types
import {
  type PaymentPrivateState,
  type Contract,
  type paymentWitnesses,
  TransactionType
} from '@midnight-pay/pay-contract';
import { type MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { type FoundContract } from '@midnight-ntwrk/midnight-js-contracts';

export type PaymentAccountId = string;

export type PaymentContract = Contract<PaymentPrivateState, typeof paymentWitnesses>;

export type PaymentCircuitKeys = Exclude<keyof PaymentContract['impureCircuits'], number | symbol>;

// Proper provider types following bank pattern
export type PaymentProviders = MidnightProviders<PaymentCircuitKeys, PaymentAccountId, PaymentPrivateState>;

export type DeployedPaymentContract = FoundContract<PaymentContract>;

export type PaymentTransaction = {
  type: TransactionType;
  amount?: bigint;
  timestamp: Date;
  merchantId?: string;
  customerId?: string;
  subscriptionId?: string;
  frequency?: number;
};

export type DetailedPaymentTransaction = {
  readonly type: 'register_merchant' | 'create_subscription' | 'pause_subscription' | 'resume_subscription' | 'cancel_subscription' | 'process_payment' | 'deposit_funds' | 'withdraw_funds';
  readonly amount?: bigint;
  readonly timestamp: Date;
  readonly merchantId?: string;
  readonly customerId?: string;
  readonly subscriptionId?: string;
  readonly frequency?: number;
  readonly balanceAfter?: bigint;
  readonly merchantBalance?: bigint;
  readonly feeAmount?: bigint;
};

export type UserAction = {
  transaction: PaymentTransaction | undefined;
  cancelledTransaction: PaymentTransaction | undefined;
};

export enum MERCHANT_TIER {
  unverified = 0,
  basic = 1,
  verified = 2,
  premium = 3
}

export enum SUBSCRIPTION_STATUS {
  active = 0,
  paused = 1,
  cancelled = 2,
  expired = 3
}

export type PaymentDerivedState = {
  readonly totalMerchants: bigint;
  readonly totalSubscriptions: bigint;
  readonly totalSupply: bigint;
  readonly currentTimestamp: number;
  readonly customerBalance?: bigint;
  readonly merchantBalance?: bigint;
  readonly activeSubscriptions?: number;
  readonly transactionHistory?: DetailedPaymentTransaction[];
  readonly lastTransaction?: DetailedPaymentTransaction;
  readonly lastCancelledTransaction?: DetailedPaymentTransaction;
};

export const emptyPaymentState = (): PaymentDerivedState => ({
  totalMerchants: 0n,
  totalSubscriptions: 0n,
  totalSupply: 0n,
  currentTimestamp: 0,
  activeSubscriptions: 0,
  transactionHistory: [],
});

// Merchant information
export type MerchantInfo = {
  readonly merchantId: string;
  readonly businessName: string;
  readonly tier: MERCHANT_TIER;
  readonly transactionCount: bigint;
  readonly totalVolume: bigint;
  readonly createdAt: number;
  readonly isActive: boolean;
};

// Subscription information
export type SubscriptionInfo = {
  readonly subscriptionId: string;
  readonly merchantId: string;
  readonly customerId: string;
  readonly amount: bigint;
  readonly maxAmount: bigint;
  readonly frequencyDays: number;
  readonly status: SUBSCRIPTION_STATUS;
  readonly lastPayment: number;
  readonly nextPayment: number;
  readonly paymentCount: number;
};

// Customer balance info
export type CustomerBalance = {
  readonly customerId: string;
  readonly availableBalance: bigint;
  readonly activeSubscriptions: number;
  readonly totalSpent: bigint;
  readonly lastActivity: number;
};

// Merchant balance info
export type MerchantBalance = {
  readonly merchantId: string;
  readonly availableBalance: bigint;
  readonly totalEarnings: bigint;
  readonly activeSubscribers: number;
  readonly lastPayment: number;
};