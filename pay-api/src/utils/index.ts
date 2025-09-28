// Utility functions for payment API

export const formatAmount = (amount: bigint): string => {
  return amount.toString();
};

export const parseAmount = (amount: string): bigint => {
  const parsed = BigInt(amount);
  if (parsed < 0n) {
    throw new Error('Amount cannot be negative');
  }
  return parsed;
};

export const parseDecimalAmount = (amount: string): bigint => {
  // Convert decimal amount (e.g., "100.00") to cents as BigInt
  const parsed = parseFloat(amount);
  if (isNaN(parsed) || parsed < 0) {
    throw new Error('Invalid amount');
  }
  // Convert to cents and ensure it's an integer
  const amountInCents = Math.floor(parsed * 100);
  return BigInt(amountInCents);
};

export const formatMerchantId = (merchantId: string): string => {
  return merchantId.startsWith('MCH') ? merchantId : `MCH${merchantId}`;
};

export const formatCustomerId = (customerId: string): string => {
  return customerId.startsWith('CUST') ? customerId : `CUST${customerId}`;
};

export const validateMerchantId = (merchantId: string): boolean => {
  return typeof merchantId === 'string' && merchantId.length >= 3 && merchantId.length <= 32;
};

export const validateCustomerId = (customerId: string): boolean => {
  return typeof customerId === 'string' && customerId.length >= 3 && customerId.length <= 32;
};

export const formatSubscriptionId = (subscriptionId: Uint8Array): string => {
  return Array.from(subscriptionId.slice(0, 8))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

export const calculateFeeAmount = (amount: bigint, basisPoints: number): bigint => {
  return (amount * BigInt(basisPoints)) / 10000n;
};

export const calculateNetAmount = (amount: bigint, fee: bigint): bigint => {
  return amount > fee ? amount - fee : 0n;
};

export const isValidFrequency = (frequencyDays: number): boolean => {
  return Number.isInteger(frequencyDays) && frequencyDays > 0 && frequencyDays <= 365;
};

export const calculateNextPayment = (lastPayment: number, frequencyDays: number): number => {
  return lastPayment + (frequencyDays * 24 * 60 * 60);
};

export const isPaymentDue = (nextPayment: number, currentTimestamp: number): boolean => {
  return currentTimestamp >= nextPayment;
};

export const formatTimestamp = (timestamp: number): Date => {
  return new Date(timestamp * 1000);
};

export const formatPercentage = (basisPoints: number): string => {
  return `${(basisPoints / 100).toFixed(2)}%`;
};

export const generatePaymentReference = (): string => {
  return `PAY${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
};

export const maskSensitiveData = (data: string): string => {
  if (data.length <= 4) return data;
  return `${data.substring(0, 2)}${'*'.repeat(data.length - 4)}${data.substring(data.length - 2)}`;
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const retry = async <T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await sleep(delay);
      return retry(fn, retries - 1, delay);
    }
    throw error;
  }
};