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

// Simplified witness functions (no witnesses needed for this contract)
export const paymentWitnesses = {};

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
  addMerchantData,
  addCustomerData,
  addSubscriptionData,
  hashPin,
  validatePin,
  validateAmount,
  validateBusinessName,
  TransactionType
};