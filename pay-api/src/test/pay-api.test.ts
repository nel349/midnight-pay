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
      if (!providers) {
        console.log('Skipping customer balance test - providers not available');
        return;
      }

      const customerId = TestData.generateCustomerId();
      const contractAddress = await PaymentAPI.deploy(providers, logger);
      const paymentAPI = await PaymentAPI.build(customerId, providers, contractAddress, logger);

      // Deposit funds
      await paymentAPI.depositCustomerFunds(customerId, '100.00');

      // Wait for state update and check balance
      await new Promise(resolve => setTimeout(resolve, 2000)); // Allow time for state update
      const balance = await paymentAPI.getCustomerBalance(customerId);
      expect(balance.availableBalance).toBe(10000n); // 100.00 in cents
      expect(balance.customerId).toBe(customerId);

      // Withdraw funds
      await paymentAPI.withdrawCustomerFunds(customerId, '50.00');

      // Wait and check updated balance
      await new Promise(resolve => setTimeout(resolve, 2000));
      const updatedBalance = await paymentAPI.getCustomerBalance(customerId);
      expect(updatedBalance.availableBalance).toBe(5000n); // 50.00 in cents
    }, 90000);

    test('should create and manage subscriptions', async () => {
      if (!providers) {
        console.log('Skipping subscription test - providers not available');
        return;
      }

      const merchantId = TestData.generateMerchantId();
      const customerId = TestData.generateCustomerId();
      const businessName = TestData.generateBusinessName();
      const amount = '10.00';
      const maxAmount = '50.00';
      const frequencyDays = 30;

      const contractAddress = await PaymentAPI.deploy(providers, logger);

      // Setup merchant first
      const merchantAPI = await PaymentAPI.build(merchantId, providers, contractAddress, logger);
      await merchantAPI.registerMerchant(merchantId, businessName);

      // Setup customer with funds
      const customerAPI = await PaymentAPI.build(customerId, providers, contractAddress, logger);
      await customerAPI.depositCustomerFunds(customerId, '100.00');

      // Create subscription
      const { subscriptionId } = await customerAPI.createSubscription(
        merchantId,
        customerId,
        amount,
        maxAmount,
        frequencyDays
      );

      expect(subscriptionId).toBeDefined();

      // Wait for state update
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get subscription info
      const subscriptionInfo = await customerAPI.getSubscriptionInfo(subscriptionId);
      expect(subscriptionInfo.merchantId).toBe(merchantId);
      expect(subscriptionInfo.customerId).toBe(customerId);
      expect(subscriptionInfo.amount).toBe(1000n); // 10.00 in cents
      expect(subscriptionInfo.maxAmount).toBe(5000n); // 50.00 in cents
      expect(subscriptionInfo.frequencyDays).toBe(BigInt(frequencyDays));
      expect(subscriptionInfo.status).toBe(SUBSCRIPTION_STATUS.active);

      // Pause subscription
      await customerAPI.pauseSubscription(subscriptionId, customerId);
      await new Promise(resolve => setTimeout(resolve, 2000));

      const pausedInfo = await customerAPI.getSubscriptionInfo(subscriptionId);
      expect(pausedInfo.status).toBe(SUBSCRIPTION_STATUS.paused);

      // Resume subscription
      await customerAPI.resumeSubscription(subscriptionId, customerId);
      await new Promise(resolve => setTimeout(resolve, 2000));

      const resumedInfo = await customerAPI.getSubscriptionInfo(subscriptionId);
      expect(resumedInfo.status).toBe(SUBSCRIPTION_STATUS.active);

      // Cancel subscription
      await customerAPI.cancelSubscription(subscriptionId, customerId);
      await new Promise(resolve => setTimeout(resolve, 2000));

      const cancelledInfo = await customerAPI.getSubscriptionInfo(subscriptionId);
      expect(cancelledInfo.status).toBe(SUBSCRIPTION_STATUS.cancelled);
    }, 120000);

    test('should process subscription payments', async () => {
      if (!providers) {
        console.log('Skipping payment processing test - providers not available');
        return;
      }

      const merchantId = TestData.generateMerchantId();
      const customerId = TestData.generateCustomerId();
      const businessName = TestData.generateBusinessName();
      const serviceProof = 'service-delivered-proof-' + Date.now();

      const contractAddress = await PaymentAPI.deploy(providers, logger);

      // Setup merchant
      const merchantAPI = await PaymentAPI.build(merchantId, providers, contractAddress, logger);
      await merchantAPI.registerMerchant(merchantId, businessName);

      // Setup customer with funds
      const customerAPI = await PaymentAPI.build(customerId, providers, contractAddress, logger);
      await customerAPI.depositCustomerFunds(customerId, '100.00');

      // Create subscription
      const { subscriptionId } = await customerAPI.createSubscription(
        merchantId,
        customerId,
        '10.00',
        '50.00',
        30
      );

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get initial balances
      const initialCustomerBalance = await customerAPI.getCustomerBalance(customerId);
      const initialMerchantBalance = await merchantAPI.getMerchantBalance(merchantId);

      // Process payment (merchant processes the payment)
      await merchantAPI.processSubscriptionPayment(subscriptionId, serviceProof);

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify payment was processed
      const finalCustomerBalance = await customerAPI.getCustomerBalance(customerId);
      const finalMerchantBalance = await merchantAPI.getMerchantBalance(merchantId);

      // Customer should have 10.00 less (payment amount)
      expect(finalCustomerBalance.availableBalance).toBe(initialCustomerBalance.availableBalance - 1000n);

      // Merchant should have received the payment (minus any fees)
      expect(finalMerchantBalance.availableBalance).toBeGreaterThan(initialMerchantBalance.availableBalance);

      // Customer's total spent should increase
      expect(finalCustomerBalance.totalSpent).toBe(1000n);
    }, 120000);

    test('should get system information', async () => {
      if (!providers) {
        console.log('Skipping system info test - providers not available');
        return;
      }

      const contractAddress = await PaymentAPI.deploy(providers, logger);
      const paymentAPI = await PaymentAPI.build('test-user-' + Date.now(), providers, contractAddress, logger);

      // Register some test data
      const merchantId = TestData.generateMerchantId();
      const customerId = TestData.generateCustomerId();

      await paymentAPI.registerMerchant(merchantId, TestData.generateBusinessName());
      await paymentAPI.depositCustomerFunds(customerId, '100.00');

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get system information
      const totalSupply = await paymentAPI.getTotalSupply();
      const totalMerchants = await paymentAPI.getTotalMerchants();
      const totalSubscriptions = await paymentAPI.getTotalSubscriptions();
      const currentTimestamp = await paymentAPI.getCurrentTimestamp();

      // Verify types and basic values
      expect(typeof totalSupply).toBe('bigint');
      expect(typeof totalMerchants).toBe('bigint');
      expect(typeof totalSubscriptions).toBe('bigint');
      expect(typeof currentTimestamp).toBe('bigint');

      expect(totalSupply).toBeGreaterThanOrEqual(10000n); // At least the deposited amount
      expect(totalMerchants).toBe(1n); // We registered one merchant
      expect(totalSubscriptions).toBeGreaterThanOrEqual(0n);
      expect(currentTimestamp).toBeGreaterThan(0n);
    }, 60000);

    test('should handle error scenarios', async () => {
      if (!providers) {
        console.log('Skipping error scenarios test - providers not available');
        return;
      }

      const contractAddress = await PaymentAPI.deploy(providers, logger);
      const paymentAPI = await PaymentAPI.build('test-user-' + Date.now(), providers, contractAddress, logger);

      // Test invalid amounts
      await expect(paymentAPI.depositCustomerFunds('customer1', '-10.00'))
        .rejects.toThrow('Invalid amount');

      await expect(paymentAPI.depositCustomerFunds('customer1', '0'))
        .rejects.toThrow('Invalid amount');

      await expect(paymentAPI.depositCustomerFunds('customer1', 'abc'))
        .rejects.toThrow('Invalid amount');

      await expect(paymentAPI.depositCustomerFunds('customer1', '1000001'))
        .rejects.toThrow('Invalid amount');

      // Test invalid business names
      await expect(paymentAPI.registerMerchant('merchant1', ''))
        .rejects.toThrow('Invalid business name');

      await expect(paymentAPI.registerMerchant('merchant1', 'AB'))
        .rejects.toThrow('Invalid business name');

      await expect(paymentAPI.registerMerchant('merchant1', 'a'.repeat(51)))
        .rejects.toThrow('Invalid business name');

      // Test non-existent merchant info
      await expect(paymentAPI.getMerchantInfo('non-existent-merchant'))
        .rejects.toThrow('Merchant non-existent-merchant not found');

      // Test non-existent subscription info
      const fakeSubscriptionId = new Uint8Array(32);
      fakeSubscriptionId.fill(0);
      await expect(paymentAPI.getSubscriptionInfo(fakeSubscriptionId))
        .rejects.toThrow('Subscription');

      // Test withdrawal without balance
      await expect(paymentAPI.withdrawCustomerFunds('customer-no-balance', '10.00'))
        .rejects.toThrow();

      // Test subscription without merchant
      await expect(paymentAPI.createSubscription(
        'non-existent-merchant',
        'customer1',
        '10.00',
        '50.00',
        30
      )).rejects.toThrow();
    }, 60000);
  });
});