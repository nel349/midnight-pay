import { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import type { Contract as ContractType, Witnesses } from './managed/pay/contract/index.cjs';
import * as ContractModule from './managed/pay/contract/index.cjs';
type Ledger = ContractModule.Ledger;

// Define PaymentCommons types locally (since .compact files aren't TS modules)
export interface PC_MerchantInfo {
  merchant_id: Uint8Array;
  business_name: Uint8Array;
  tier: number;
  transaction_count: bigint;
  total_volume: bigint;
  created_at: bigint;
  is_active: boolean;
}

export interface PC_Subscription {
  subscription_id: Uint8Array;
  merchant_id: Uint8Array;
  customer_id: Uint8Array;
  amount: bigint;
  max_amount: bigint;
  frequency_days: bigint;
  status: number;
  last_payment: bigint;
  next_payment: bigint;
  payment_count: bigint;
}

// Re-export contract types and functions
export * from './managed/pay/contract/index.cjs';
export const ledger = ContractModule.ledger;
export const pureCircuits = ContractModule.pureCircuits;
export const { Contract } = ContractModule;
export type Contract<T, W extends Witnesses<T> = Witnesses<T>> = ContractType<T, W>;

// Payment Gateway Private State - simplified for modular contract
export type PaymentPrivateState = {
  readonly merchantData: Map<string, MerchantData>;
  readonly customerData: Map<string, CustomerData>;
  readonly subscriptionData: Map<string, SubscriptionData>;
};

export interface MerchantData {
  merchantId: string;
  businessName: string;
  createdAt: number;
}

export interface CustomerData {
  customerId: string;
  subscriptions: string[];
}

export interface SubscriptionData {
  subscriptionId: string;
  merchantId: string;
  customerId: string;
  amount: bigint;
  maxAmount: bigint;
  frequencyDays: number;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  lastPayment: number;
  nextPayment: number;
  paymentCount: number;
}

// Create initial private state for payment gateway
export const createPaymentPrivateState = (): PaymentPrivateState => ({
  merchantData: new Map(),
  customerData: new Map(),
  subscriptionData: new Map()
});

// Helper functions for managing private state
export const addMerchantData = (
  state: PaymentPrivateState,
  merchantData: MerchantData
): PaymentPrivateState => ({
  ...state,
  merchantData: new Map(state.merchantData).set(merchantData.merchantId, merchantData)
});

export const addCustomerData = (
  state: PaymentPrivateState,
  customerData: CustomerData
): PaymentPrivateState => ({
  ...state,
  customerData: new Map(state.customerData).set(customerData.customerId, customerData)
});

export const addSubscriptionData = (
  state: PaymentPrivateState,
  subscriptionData: SubscriptionData
): PaymentPrivateState => ({
  ...state,
  subscriptionData: new Map(state.subscriptionData).set(subscriptionData.subscriptionId, subscriptionData)
});

// Privacy-preserving witness functions (payment-specific)
export const paymentWitnesses = {
  // Witness 1: Provides merchant info from private state
  merchant_info: ({
    privateState
  }: WitnessContext<Ledger, PaymentPrivateState>,
    merchantId: Uint8Array
  ): [PaymentPrivateState, PC_MerchantInfo] => {
    const merchantIdStr = new TextDecoder().decode(merchantId).replace(/\0/g, '');
    const merchantData = privateState.merchantData.get(merchantIdStr);
    if (!merchantData) {
      throw new Error(`Merchant ${merchantIdStr} not found in private state`);
    }

    // Convert local type to contract type, properly padding bytes
    const merchantIdBytes = new Uint8Array(32);
    const merchantIdEncoded = new TextEncoder().encode(merchantData.merchantId);
    merchantIdBytes.set(merchantIdEncoded.slice(0, Math.min(merchantIdEncoded.length, 32)));

    const businessNameBytes = new Uint8Array(64);
    const businessNameEncoded = new TextEncoder().encode(merchantData.businessName);
    businessNameBytes.set(businessNameEncoded.slice(0, Math.min(businessNameEncoded.length, 64)));

    const contractMerchantInfo: PC_MerchantInfo = {
      merchant_id: merchantIdBytes,
      business_name: businessNameBytes,
      tier: 0, // MERCHANT_TIER.unverified
      transaction_count: 0n,
      total_volume: 0n,
      created_at: BigInt(merchantData.createdAt),
      is_active: true
    };
    return [privateState, contractMerchantInfo];
  },

  // Witness 2: Updates merchant info in private state
  set_merchant_info: (
    { privateState }: WitnessContext<Ledger, PaymentPrivateState>,
    merchantId: Uint8Array,
    merchantInfo: PC_MerchantInfo
  ): [PaymentPrivateState, []] => {
    const merchantIdStr = new TextDecoder().decode(merchantId).replace(/\0/g, '');
    const updatedMerchantData = new Map(privateState.merchantData);

    // Convert contract type back to local type
    const localMerchantData: MerchantData = {
      merchantId: merchantIdStr,
      businessName: new TextDecoder().decode(merchantInfo.business_name).replace(/\0/g, ''),
      createdAt: Number(merchantInfo.created_at)
    };

    updatedMerchantData.set(merchantIdStr, localMerchantData);

    return [{
      ...privateState,
      merchantData: updatedMerchantData
    }, []];
  },

  // Witness 3: Get customer subscription count
  customer_subscription_count: ({
    privateState
  }: WitnessContext<Ledger, PaymentPrivateState>,
    customerId: Uint8Array
  ): [PaymentPrivateState, bigint] => {
    const customerIdStr = new TextDecoder().decode(customerId).replace(/\0/g, '');
    const customerData = privateState.customerData.get(customerIdStr);

    if (!customerData) {
      return [privateState, 0n];
    }

    // Count active subscriptions
    let activeCount = 0;
    customerData.subscriptions.forEach(subId => {
      const subscription = privateState.subscriptionData.get(subId);
      if (subscription && subscription.status === 'active') {
        activeCount++;
      }
    });

    return [privateState, BigInt(activeCount)];
  },

  // Witness 4: Set customer subscription count
  set_customer_subscription_count: (
    { privateState }: WitnessContext<Ledger, PaymentPrivateState>,
    customerId: Uint8Array,
    count: bigint
  ): [PaymentPrivateState, []] => {
    // For this simplified implementation, we don't need to store the count separately
    // as it's calculated from the actual subscription data
    return [privateState, []];
  },

  // Witness 5: Get subscription info from private state
  subscription_info: ({
    privateState
  }: WitnessContext<Ledger, PaymentPrivateState>,
    subscriptionId: Uint8Array
  ): [PaymentPrivateState, PC_Subscription] => {
    const subscriptionIdStr = new TextDecoder().decode(subscriptionId).replace(/\0/g, '');
    const subscriptionData = privateState.subscriptionData.get(subscriptionIdStr);
    if (!subscriptionData) {
      throw new Error(`Subscription ${subscriptionIdStr} not found in private state`);
    }

    // Convert local type to contract type, properly padding bytes
    const subscriptionIdBytes = new Uint8Array(32);
    const subscriptionIdEncoded = new TextEncoder().encode(subscriptionData.subscriptionId);
    subscriptionIdBytes.set(subscriptionIdEncoded.slice(0, Math.min(subscriptionIdEncoded.length, 32)));

    const merchantIdBytes = new Uint8Array(32);
    const merchantIdEncoded = new TextEncoder().encode(subscriptionData.merchantId);
    merchantIdBytes.set(merchantIdEncoded.slice(0, Math.min(merchantIdEncoded.length, 32)));

    const customerIdBytes = new Uint8Array(32);
    const customerIdEncoded = new TextEncoder().encode(subscriptionData.customerId);
    customerIdBytes.set(customerIdEncoded.slice(0, Math.min(customerIdEncoded.length, 32)));

    const contractSubscription: PC_Subscription = {
      subscription_id: subscriptionIdBytes,
      merchant_id: merchantIdBytes,
      customer_id: customerIdBytes,
      amount: subscriptionData.amount,
      max_amount: subscriptionData.maxAmount,
      frequency_days: BigInt(subscriptionData.frequencyDays),
      status: subscriptionData.status === 'active' ? 0 : subscriptionData.status === 'paused' ? 1 : subscriptionData.status === 'cancelled' ? 2 : 3,
      last_payment: BigInt(subscriptionData.lastPayment),
      next_payment: BigInt(subscriptionData.nextPayment),
      payment_count: BigInt(subscriptionData.paymentCount)
    };

    return [privateState, contractSubscription];
  },

  // Witness 6: Set subscription info in private state
  set_subscription_info: (
    { privateState }: WitnessContext<Ledger, PaymentPrivateState>,
    subscriptionId: Uint8Array,
    subscription: PC_Subscription
  ): [PaymentPrivateState, []] => {
    const subscriptionIdStr = new TextDecoder().decode(subscriptionId).replace(/\0/g, '');
    const updatedSubscriptionData = new Map(privateState.subscriptionData);

    // Convert contract type back to local type
    const localSubscriptionData: SubscriptionData = {
      subscriptionId: subscriptionIdStr,
      merchantId: new TextDecoder().decode(subscription.merchant_id).replace(/\0/g, ''),
      customerId: new TextDecoder().decode(subscription.customer_id).replace(/\0/g, ''),
      amount: subscription.amount,
      maxAmount: subscription.max_amount,
      frequencyDays: Number(subscription.frequency_days),
      status: subscription.status === 0 ? 'active' : subscription.status === 1 ? 'paused' : subscription.status === 2 ? 'cancelled' : 'expired',
      lastPayment: Number(subscription.last_payment),
      nextPayment: Number(subscription.next_payment),
      paymentCount: Number(subscription.payment_count)
    };

    updatedSubscriptionData.set(subscriptionIdStr, localSubscriptionData);

    // Also update customer data to include this subscription
    const customerId = localSubscriptionData.customerId;
    const updatedCustomerData = new Map(privateState.customerData);
    const existingCustomerData = updatedCustomerData.get(customerId) || {
      customerId: customerId,
      subscriptions: []
    };

    if (!existingCustomerData.subscriptions.includes(subscriptionIdStr)) {
      existingCustomerData.subscriptions.push(subscriptionIdStr);
    }
    updatedCustomerData.set(customerId, existingCustomerData);

    return [{
      ...privateState,
      subscriptionData: updatedSubscriptionData,
      customerData: updatedCustomerData
    }, []];
  },

  // Witness 7: Calculate percentage-based fee (computed off-chain)
  calculate_percentage_fee: (
    { privateState }: WitnessContext<Ledger, PaymentPrivateState>,
    amount: bigint,
    feeBasisPoints: bigint
  ): [PaymentPrivateState, bigint] => {
    // Calculate percentage-based fee: (amount * fee_basis_points) / 10000
    // Using BigInt arithmetic with division
    const fee = (amount * feeBasisPoints) / 10000n;

    // Ensure fee doesn't exceed the amount
    const finalFee = fee > amount ? amount : fee;

    return [privateState, finalFee];
  }
};

// Utility functions
export function generateMerchantId(): string {
  return 'MCH' + Math.random().toString(36).substring(2, 11).toUpperCase();
}

export function generateSubscriptionId(): string {
  return 'SUB' + Math.random().toString(36).substring(2, 11).toUpperCase();
}

// Transaction types
export enum TransactionType {
  MERCHANT_REGISTERED = 'merchant_registered',
  SUBSCRIPTION_CREATED = 'subscription_created',
  SUBSCRIPTION_PAYMENT = 'subscription_payment',
  SUBSCRIPTION_PAUSED = 'subscription_paused',
  SUBSCRIPTION_RESUMED = 'subscription_resumed',
  SUBSCRIPTION_CANCELLED = 'subscription_cancelled'
}

export interface TransactionInfo {
  type: TransactionType;
  timestamp: Date;
  hash: Uint8Array;
}

// Validation helpers
export function validateAmount(amount: string): boolean {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num <= 1000000;
}

export function validateBusinessName(name: string): boolean {
  return name.length >= 3 && name.length <= 50;
}

export default {
  Contract,
  ledger,
  pureCircuits,
  paymentWitnesses,
  createPaymentPrivateState,
  addMerchantData,
  addCustomerData,
  addSubscriptionData,
  validateAmount,
  validateBusinessName,
  TransactionType
};