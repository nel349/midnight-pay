// Main API exports - following bank pattern
export {
  PaymentAPI,
  type DeployedPaymentAPI,
  type PaymentDerivedState,
  type PaymentProviders,
  type PaymentCircuitKeys,
  type PaymentAccountId,
  type UserAction,
  type PaymentTransaction,
  MERCHANT_TIER,
  SUBSCRIPTION_STATUS,
  emptyPaymentState,
  type MerchantInfo,
  type SubscriptionInfo,
  type CustomerBalance,
  type MerchantBalance,
} from './pay-api';

// Re-export useful contract types and utilities
export {
  TransactionType,
  type PaymentPrivateState,
  validateAmount,
  validateBusinessName,
  generateMerchantId,
  generateSubscriptionId,
} from '@midnight-pay/pay-contract';

// Re-export common types
export {
  type PaymentContract,
  type DeployedPaymentContract,
  type DetailedPaymentTransaction,
} from './common-types';

// Re-export utilities
export * as utils from './utils/index';

// Default export
export { PaymentAPI as default } from './pay-api';