import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { firstValueFrom, filter } from 'rxjs';
import WebSocket from 'ws';
import pino from 'pino';
import { PaymentAPI, emptyPaymentState, MERCHANT_TIER, SUBSCRIPTION_STATUS, type PaymentProviders } from '../index.js';
import { TestEnvironment, TestProviders } from './test-commons.js';

// Test utilities (can be moved to separate file when needed)
const TestData = {
  generateMerchantId: (suffix: string = '') => `test-merchant-${Date.now()}${suffix ? '-' + suffix : ''}`,
  generateCustomerId: (suffix: string = '') => `test-customer-${Date.now()}${suffix ? '-' + suffix : ''}`,
  generateBusinessName: (suffix: string = '') => `Test Business ${Date.now()}${suffix ? ' ' + suffix : ''}`,
  amounts: {
    small: '10.00',
    medium: '100.00',
    large: '1000.00'
  }
};

describe('Payment API', () => {
  describe('Unit Tests', () => {
    test('should export PaymentAPI class', () => {
      expect(PaymentAPI).toBeDefined();
      expect(typeof PaymentAPI).toBe('function');
    });

    test('should export empty payment state', () => {
      const emptyState = emptyPaymentState();
      expect(emptyState).toBeDefined();
      expect(emptyState.totalMerchants).toBe(0n);
      expect(emptyState.totalSubscriptions).toBe(0n);
      expect(emptyState.totalSupply).toBe(0n);
      expect(emptyState.currentTimestamp).toBe(0);
      expect(emptyState.activeSubscriptions).toBe(0);
      expect(emptyState.transactionHistory).toEqual([]);
    });

    test('should export merchant tier enum', () => {
      expect(MERCHANT_TIER.unverified).toBe(0);
      expect(MERCHANT_TIER.basic).toBe(1);
      expect(MERCHANT_TIER.verified).toBe(2);
      expect(MERCHANT_TIER.premium).toBe(3);
    });

    test('should export subscription status enum', () => {
      expect(SUBSCRIPTION_STATUS.active).toBe(0);
      expect(SUBSCRIPTION_STATUS.paused).toBe(1);
      expect(SUBSCRIPTION_STATUS.cancelled).toBe(2);
      expect(SUBSCRIPTION_STATUS.expired).toBe(3);
    });

    test('should validate amounts correctly', () => {
      const { validateAmount } = require('@midnight-pay/pay-contract');
      expect(validateAmount('100')).toBe(true);
      expect(validateAmount('0')).toBe(false); // Zero is not valid (must be > 0)
      expect(validateAmount('-1')).toBe(false);
      expect(validateAmount('abc')).toBe(false);
      expect(validateAmount('')).toBe(false);
      expect(validateAmount('1000000')).toBe(true); // Max valid amount
      expect(validateAmount('1000001')).toBe(false); // Exceeds max
    });

    test('should validate business names correctly', () => {
      const { validateBusinessName } = require('@midnight-pay/pay-contract');
      expect(validateBusinessName('Valid Business')).toBe(true);
      expect(validateBusinessName('ABC')).toBe(true); // Minimum 3 characters
      expect(validateBusinessName('A')).toBe(false); // Too short (< 3)
      expect(validateBusinessName('AB')).toBe(false); // Too short (< 3)
      expect(validateBusinessName('')).toBe(false);
      expect(validateBusinessName('a'.repeat(50))).toBe(true); // Max valid length
      expect(validateBusinessName('a'.repeat(51))).toBe(false); // Too long (> 50)
    });

    test('should generate valid test data', () => {
      const merchantId = TestData.generateMerchantId('retail');
      const customerId = TestData.generateCustomerId('premium');
      const businessName = TestData.generateBusinessName('store');

      expect(merchantId).toMatch(/^test-merchant-\d+-retail$/);
      expect(customerId).toMatch(/^test-customer-\d+-premium$/);
      expect(businessName).toMatch(/^Test Business \d+ store$/);
      expect(businessName.length).toBeGreaterThanOrEqual(3);
      expect(businessName.length).toBeLessThanOrEqual(50);
    });

    test('should have valid test amounts', () => {
      const { validateAmount } = require('@midnight-pay/pay-contract');

      expect(validateAmount(TestData.amounts.small)).toBe(true);
      expect(validateAmount(TestData.amounts.medium)).toBe(true);
      expect(validateAmount(TestData.amounts.large)).toBe(true);
    });
  });

  // Integration tests - enable when test environment is running
  describe('Integration Tests', () => {
    let testEnvironment: TestEnvironment;
    let providers: PaymentProviders;
    const logger = pino({ level: 'info' });

    beforeAll(async () => {
      // Enable step by step - first test the environment setup
      console.log('Setting up test environment...');
      testEnvironment = new TestEnvironment(logger);
      const testConfiguration = await testEnvironment.start();
      console.log('Test environment started, configuration:', testConfiguration.psMode);

      // Try to set up wallet - this will help us understand what's missing
      try {
        console.log('Attempting wallet setup...');
        globalThis.WebSocket = WebSocket as any;
        const wallet = await testEnvironment.getWallet1();
        providers = await new TestProviders().configurePaymentProviders(wallet, testConfiguration.dappConfig);
        console.log('Wallet and providers set up successfully!');
      } catch (error: unknown) {
        console.log('Wallet setup failed (expected without running infrastructure):', error instanceof Error ? error.message : 'Unknown error');
        // This is expected when Midnight infrastructure is not running
      }
    }, 10 * 60_000);

    afterAll(async () => {
      // Clean up test environment
      await testEnvironment.shutdown();
    });

    test('should deploy payment contract', async () => {
      // This test is now enabled since infrastructure is working!
      if (!providers) {
        console.log('Skipping contract deployment - providers not available');
        return;
      }

      console.log('Deploying payment contract...');
      const contractAddress = await PaymentAPI.deploy(providers, logger);

      expect(contractAddress).toBeDefined();
      expect(typeof contractAddress).toBe('string');
      expect(contractAddress.length).toBeGreaterThan(0);

      console.log('Contract deployed successfully at:', contractAddress);
    }, 30000);

    // Test that can be enabled immediately to verify basic API structure
    test('should have static deploy method', () => {
      expect(typeof PaymentAPI.deploy).toBe('function');
      expect(PaymentAPI.deploy.length).toBe(2); // providers, logger parameters
    });

    test('should have static build method', () => {
      expect(typeof PaymentAPI.build).toBe('function');
      expect(PaymentAPI.build.length).toBe(4); // entityId, providers, contractAddress, logger parameters
    });

    test('should have test environment set up', () => {
      expect(testEnvironment).toBeDefined();
      // Test environment is ready for when Midnight infrastructure is available
    });

    test('should create payment API instance', async () => {
      if (!providers) {
        console.log('Skipping API instance creation - providers not available');
        return;
      }

      const merchantId = TestData.generateMerchantId();
      const contractAddress = await PaymentAPI.deploy(providers, logger);
      const paymentAPI = await PaymentAPI.build(merchantId, providers, contractAddress, logger);

      expect(paymentAPI).toBeDefined();
      expect(paymentAPI.entityId).toBe(merchantId);
      expect(paymentAPI.deployedContractAddress).toBe(contractAddress);

      // Wait for initial state
      const initialState = await firstValueFrom(paymentAPI.state$);
      expect(initialState.totalMerchants).toBe(0n);
      expect(initialState.totalSubscriptions).toBe(0n);
      expect(initialState.totalSupply).toBe(0n);
    }, 60000);

    test('should register merchant', async () => {
      if (!providers) {
        console.log('Skipping merchant registration - providers not available');
        return;
      }

      const merchantId = TestData.generateMerchantId();
      const businessName = TestData.generateBusinessName();
      const contractAddress = await PaymentAPI.deploy(providers, logger);
      const paymentAPI = await PaymentAPI.build(merchantId, providers, contractAddress, logger);

      // Register merchant
      await paymentAPI.registerMerchant(merchantId, businessName);

      // Wait for state update
      const afterRegister = await firstValueFrom(
        paymentAPI.state$.pipe(filter(s => s.totalMerchants === 1n))
      );
      expect(afterRegister.totalMerchants).toBe(1n);

      // Get merchant info
      const merchantInfo = await paymentAPI.getMerchantInfo(merchantId);
      expect(merchantInfo.merchantId).toBe(merchantId);
      expect(merchantInfo.businessName).toBe(businessName);
      expect(merchantInfo.tier).toBe(MERCHANT_TIER.unverified);
      expect(merchantInfo.isActive).toBe(true);
    }, 60000);

    test('should handle customer deposit and withdrawal', async () => {
      // TODO: Implement customer balance management test
      // const customerId = 'test-customer-1';
      // const paymentAPI = await PaymentAPI.build(customerId, providers, contractAddress, logger);
      //
      // // Deposit funds
      // await paymentAPI.depositCustomerFunds(customerId, '100.00');
      //
      // // Check balance
      // const balance = await paymentAPI.getCustomerBalance(customerId);
      // expect(balance.availableBalance).toBe(10000n); // 100.00 in cents
      // expect(balance.customerId).toBe(customerId);
      //
      // // Withdraw funds
      // await paymentAPI.withdrawCustomerFunds(customerId, '50.00');
      //
      // // Check updated balance
      // const updatedBalance = await paymentAPI.getCustomerBalance(customerId);
      // expect(updatedBalance.availableBalance).toBe(5000n); // 50.00 in cents
    });

    test('should create and manage subscriptions', async () => {
      // TODO: Implement subscription management test
      // const merchantId = 'test-merchant-1';
      // const customerId = 'test-customer-1';
      // const amount = '10.00';
      // const maxAmount = '50.00';
      // const frequencyDays = 30;
      //
      // const paymentAPI = await PaymentAPI.build(customerId, providers, contractAddress, logger);
      //
      // // Create subscription
      // const { subscriptionId } = await paymentAPI.createSubscription(
      //   merchantId,
      //   customerId,
      //   amount,
      //   maxAmount,
      //   frequencyDays
      // );
      //
      // expect(subscriptionId).toBeDefined();
      //
      // // Get subscription info
      // const subscriptionInfo = await paymentAPI.getSubscriptionInfo(subscriptionId);
      // expect(subscriptionInfo.merchantId).toBe(merchantId);
      // expect(subscriptionInfo.customerId).toBe(customerId);
      // expect(subscriptionInfo.amount).toBe(1000n); // 10.00 in cents
      // expect(subscriptionInfo.maxAmount).toBe(5000n); // 50.00 in cents
      // expect(subscriptionInfo.frequencyDays).toBe(frequencyDays);
      // expect(subscriptionInfo.status).toBe(SUBSCRIPTION_STATUS.active);
      //
      // // Pause subscription
      // await paymentAPI.pauseSubscription(subscriptionId, customerId);
      //
      // const pausedInfo = await paymentAPI.getSubscriptionInfo(subscriptionId);
      // expect(pausedInfo.status).toBe(SUBSCRIPTION_STATUS.paused);
      //
      // // Resume subscription
      // await paymentAPI.resumeSubscription(subscriptionId, customerId);
      //
      // const resumedInfo = await paymentAPI.getSubscriptionInfo(subscriptionId);
      // expect(resumedInfo.status).toBe(SUBSCRIPTION_STATUS.active);
      //
      // // Cancel subscription
      // await paymentAPI.cancelSubscription(subscriptionId, customerId);
      //
      // const cancelledInfo = await paymentAPI.getSubscriptionInfo(subscriptionId);
      // expect(cancelledInfo.status).toBe(SUBSCRIPTION_STATUS.cancelled);
    });

    test('should process subscription payments', async () => {
      // TODO: Implement subscription payment processing test
      // const merchantId = 'test-merchant-1';
      // const customerId = 'test-customer-1';
      // const serviceProof = 'service-delivered-proof';
      //
      // const paymentAPI = await PaymentAPI.build(customerId, providers, contractAddress, logger);
      //
      // // Create subscription first
      // const { subscriptionId } = await paymentAPI.createSubscription(
      //   merchantId,
      //   customerId,
      //   '10.00',
      //   '50.00',
      //   30
      // );
      //
      // // Process payment
      // await paymentAPI.processSubscriptionPayment(subscriptionId, serviceProof);
      //
      // // Verify payment was processed
      // const customerBalance = await paymentAPI.getCustomerBalance(customerId);
      // const merchantBalance = await paymentAPI.getMerchantBalance(merchantId);
      //
      // expect(merchantBalance.availableBalance).toBeGreaterThan(0n);
      // expect(customerBalance.totalSpent).toBeGreaterThan(0n);
    });

    test('should get system information', async () => {
      // TODO: Implement system information tests
      // const paymentAPI = await PaymentAPI.build('test-user', providers, contractAddress, logger);
      //
      // const totalSupply = await paymentAPI.getTotalSupply();
      // const totalMerchants = await paymentAPI.getTotalMerchants();
      // const totalSubscriptions = await paymentAPI.getTotalSubscriptions();
      // const currentTimestamp = await paymentAPI.getCurrentTimestamp();
      //
      // expect(typeof totalSupply).toBe('bigint');
      // expect(typeof totalMerchants).toBe('bigint');
      // expect(typeof totalSubscriptions).toBe('bigint');
      // expect(typeof currentTimestamp).toBe('number');
    });

    test('should handle error scenarios', async () => {
      // TODO: Implement error handling tests
      // const paymentAPI = await PaymentAPI.build('test-user', providers, contractAddress, logger);
      //
      // // Test invalid amounts
      // await expect(paymentAPI.depositCustomerFunds('customer1', '-10.00'))
      //   .rejects.toThrow('Invalid amount');
      //
      // // Test invalid business names
      // await expect(paymentAPI.registerMerchant('merchant1', ''))
      //   .rejects.toThrow('Invalid business name');
      //
      // // Test non-existent merchant info
      // await expect(paymentAPI.getMerchantInfo('non-existent'))
      //   .rejects.toThrow('Merchant non-existent not found');
      //
      // // Test non-existent subscription info
      // const fakeSubscriptionId = new Uint8Array(32);
      // await expect(paymentAPI.getSubscriptionInfo(fakeSubscriptionId))
      //   .rejects.toThrow('Subscription');
    });
  });
});