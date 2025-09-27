import { describe, test, expect, beforeEach } from 'vitest';
import { PaymentTestSetup } from './pay-setup.js';

describe('MidnightPay Payment Gateway Tests', () => {
  let paymentGateway: PaymentTestSetup;

  beforeEach(() => {
    paymentGateway = new PaymentTestSetup();
    console.log('\n🔄 Test setup initialized\n');
  });

  describe('Merchant Operations', () => {
    test('should register a new merchant successfully', () => {
      // Arrange
      const merchantId = 'merchant_001';
      const businessName = 'Coffee Shop Inc';

      // Act
      const ledger = paymentGateway.registerMerchant(merchantId, businessName);

      // Assert
      expect(paymentGateway.getTotalMerchants()).toBe(1n);

      // Verify merchant exists in the ledger
      const merchantsMap = ledger.all_merchants;
      expect(merchantsMap.size()).toBe(1n);

      // Print state for debugging
      paymentGateway.printPaymentGatewayState();
      paymentGateway.printEntityDetailedHistory(merchantId);

      console.log('✅ Merchant registration test passed');
    });

    test('should prevent duplicate merchant registration', () => {
      // Arrange
      const merchantId = 'merchant_002';
      const businessName = 'Tech Store LLC';

      // Act - register merchant first time
      paymentGateway.registerMerchant(merchantId, businessName);

      // Assert - second registration should fail
      expect(() => {
        paymentGateway.registerMerchant(merchantId, businessName);
      }).toThrow('Merchant already exists');

      // Verify only one merchant was created
      expect(paymentGateway.getTotalMerchants()).toBe(1n);

      console.log('✅ Duplicate merchant prevention test passed');
    });
  });

  describe('Subscription Operations', () => {
    test('should create subscription for registered merchant', () => {
      // Arrange
      const merchantId = 'merchant_003';
      const customerId = 'customer_001';
      const businessName = 'Streaming Service';
      const amount = 999n; // $9.99 in cents
      const maxAmount = 1999n; // $19.99 max
      const frequencyDays = 30;

      // Register merchant first
      paymentGateway.registerMerchant(merchantId, businessName);

      // Act
      const { ledger, subscriptionId } = paymentGateway.createSubscription(
        merchantId,
        customerId,
        amount,
        maxAmount,
        frequencyDays
      );

      // Assert
      expect(paymentGateway.getTotalSubscriptions()).toBe(1n);
      expect(paymentGateway.getCustomerActiveCount(customerId)).toBe(1n);
      expect(subscriptionId).toBeDefined();
      expect(subscriptionId.length).toBe(32); // Bytes<32>

      // Verify subscription exists in the ledger
      const subscriptionsMap = ledger.all_subscriptions;
      expect(subscriptionsMap.size()).toBe(1n);

      // Print state for debugging
      paymentGateway.printPaymentGatewayState();
      paymentGateway.printEntityDetailedHistory(customerId);

      console.log('✅ Subscription creation test passed');
    });

    test('should manage subscription lifecycle (pause, resume, cancel)', () => {
      // Arrange
      const merchantId = 'merchant_004';
      const customerId = 'customer_002';
      const businessName = 'Gym Membership';
      const amount = 2999n; // $29.99
      const maxAmount = 4999n; // $49.99 max
      const frequencyDays = 30;

      // Register merchant and create subscription
      paymentGateway.registerMerchant(merchantId, businessName);
      const { subscriptionId } = paymentGateway.createSubscription(
        merchantId,
        customerId,
        amount,
        maxAmount,
        frequencyDays
      );

      // Act & Assert - Pause subscription
      paymentGateway.pauseSubscription(subscriptionId, customerId);
      expect(paymentGateway.getCustomerActiveCount(customerId)).toBe(0n); // Paused = not active

      // Act & Assert - Resume subscription
      paymentGateway.resumeSubscription(subscriptionId, customerId);
      expect(paymentGateway.getCustomerActiveCount(customerId)).toBe(1n); // Active again

      // Act & Assert - Cancel subscription
      paymentGateway.cancelSubscription(subscriptionId, customerId);
      expect(paymentGateway.getCustomerActiveCount(customerId)).toBe(0n); // Cancelled = not active

      // Print state for debugging
      paymentGateway.printPaymentGatewayState();
      paymentGateway.printEntityDetailedHistory(customerId);

      console.log('✅ Subscription lifecycle test passed');
    });
  });

  describe('Subscription Count Proofs', () => {
    test('should prove customer has sufficient active subscriptions', () => {
      // Arrange
      const merchantId1 = 'merchant_005';
      const merchantId2 = 'merchant_006';
      const customerId = 'customer_003';
      const amount = 999n;
      const maxAmount = 1999n;
      const frequencyDays = 30;

      // Register merchants
      paymentGateway.registerMerchant(merchantId1, 'Service A');
      paymentGateway.registerMerchant(merchantId2, 'Service B');

      // Create multiple subscriptions for same customer
      paymentGateway.createSubscription(merchantId1, customerId, amount, maxAmount, frequencyDays);
      paymentGateway.createSubscription(merchantId2, customerId, amount, maxAmount, frequencyDays);

      // Act & Assert
      expect(paymentGateway.getCustomerActiveCount(customerId)).toBe(2n);

      // Test threshold proofs
      expect(paymentGateway.proveActiveSubscriptionsCount(customerId, 1)).toBe(true); // Has >= 1
      expect(paymentGateway.proveActiveSubscriptionsCount(customerId, 2)).toBe(true); // Has >= 2
      expect(paymentGateway.proveActiveSubscriptionsCount(customerId, 3)).toBe(false); // Does not have >= 3

      // Print state for debugging
      paymentGateway.printPaymentGatewayState();
      paymentGateway.printEntityDetailedHistory(customerId);

      console.log('✅ Subscription count proof test passed');
    });
  });
});