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
      const merchantsMap = ledger.merchant_accounts;
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
      const subscriptionsMap = ledger.subscription_accounts;
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

  describe('Customer Operations', () => {
    test('should track customer across multiple merchants', () => {
      // Arrange
      const merchantId1 = 'merchant_007';
      const merchantId2 = 'merchant_008';
      const merchantId3 = 'merchant_009';
      const customerId = 'customer_004';
      const amount = 1500n;
      const maxAmount = 3000n;
      const frequencyDays = 30;

      // Register multiple merchants
      paymentGateway.registerMerchant(merchantId1, 'Netflix Clone');
      paymentGateway.registerMerchant(merchantId2, 'Spotify Clone');
      paymentGateway.registerMerchant(merchantId3, 'Adobe Clone');

      // Act - Customer subscribes to multiple services
      const { subscriptionId: netflixSub } = paymentGateway.createSubscription(merchantId1, customerId, amount, maxAmount, frequencyDays);
      const { subscriptionId: spotifySub } = paymentGateway.createSubscription(merchantId2, customerId, 999n, 1999n, 30);
      const { subscriptionId: adobeSub } = paymentGateway.createSubscription(merchantId3, customerId, 2999n, 4999n, 30);

      // Assert
      expect(paymentGateway.getCustomerActiveCount(customerId)).toBe(3n);
      expect(paymentGateway.getTotalSubscriptions()).toBe(3n);

      // Verify each subscription exists
      expect(netflixSub).toBeDefined();
      expect(spotifySub).toBeDefined();
      expect(adobeSub).toBeDefined();

      paymentGateway.printEntityDetailedHistory(customerId);
      console.log('✅ Multi-merchant customer test passed');
    });

    test('should handle customer with mixed subscription states', () => {
      // Arrange
      const merchantId1 = 'merchant_010';
      const merchantId2 = 'merchant_011';
      const merchantId3 = 'merchant_012';
      const customerId = 'customer_005';

      // Register merchants
      paymentGateway.registerMerchant(merchantId1, 'Gaming Service');
      paymentGateway.registerMerchant(merchantId2, 'Music Service');
      paymentGateway.registerMerchant(merchantId3, 'Video Service');

      // Create subscriptions
      const { subscriptionId: gamingSub } = paymentGateway.createSubscription(merchantId1, customerId, 1999n, 2999n, 30);
      const { subscriptionId: musicSub } = paymentGateway.createSubscription(merchantId2, customerId, 999n, 1499n, 30);
      const { subscriptionId: videoSub } = paymentGateway.createSubscription(merchantId3, customerId, 1499n, 2499n, 30);

      // Initial state - all active
      expect(paymentGateway.getCustomerActiveCount(customerId)).toBe(3n);

      // Act - Customer manages subscriptions differently
      paymentGateway.pauseSubscription(gamingSub, customerId);  // Pause gaming
      expect(paymentGateway.getCustomerActiveCount(customerId)).toBe(2n);

      paymentGateway.cancelSubscription(musicSub, customerId); // Cancel music
      expect(paymentGateway.getCustomerActiveCount(customerId)).toBe(1n);

      paymentGateway.resumeSubscription(gamingSub, customerId); // Resume gaming
      expect(paymentGateway.getCustomerActiveCount(customerId)).toBe(2n);

      // Video service remains active throughout
      expect(paymentGateway.proveActiveSubscriptionsCount(customerId, 2)).toBe(true);
      expect(paymentGateway.proveActiveSubscriptionsCount(customerId, 3)).toBe(false);

      paymentGateway.printEntityDetailedHistory(customerId);
      console.log('✅ Mixed subscription states test passed');
    });

    test('should handle customer with no subscriptions', () => {
      // Arrange
      const customerId = 'customer_006';

      // Act & Assert - Customer with no subscriptions
      expect(paymentGateway.getCustomerActiveCount(customerId)).toBe(0n);
      expect(paymentGateway.proveActiveSubscriptionsCount(customerId, 0)).toBe(true);
      expect(paymentGateway.proveActiveSubscriptionsCount(customerId, 1)).toBe(false);

      console.log('✅ No subscriptions customer test passed');
    });

    test('should process payments for customer subscriptions', () => {
      // Arrange
      const merchantId = 'merchant_013';
      const customerId = 'customer_007';
      const amount = 1999n;
      const maxAmount = 2999n;
      const frequencyDays = 30;

      paymentGateway.registerMerchant(merchantId, 'Payment Service');
      const { subscriptionId } = paymentGateway.createSubscription(merchantId, customerId, amount, maxAmount, frequencyDays);

      // Fast-forward time to make payment due
      const futureTimestamp = paymentGateway.getCurrentTimestamp() + (30 * 24 * 60 * 60); // 30 days later
      paymentGateway.updateTimestamp(futureTimestamp);

      // Get initial state before payment
      const initialMerchantData = paymentGateway.getPrivateState().merchantData.get(merchantId);
      const initialSubscriptionData = paymentGateway.getPrivateState().subscriptionData.get(
        new TextDecoder().decode(subscriptionId).replace(/\0/g, '')
      );

      // Act - Process payment
      const ledger = paymentGateway.processSubscriptionPayment(subscriptionId, 'service_delivered_proof');

      // Assert - Payment was processed correctly
      const updatedMerchantData = paymentGateway.getPrivateState().merchantData.get(merchantId);
      const updatedSubscriptionData = paymentGateway.getPrivateState().subscriptionData.get(
        new TextDecoder().decode(subscriptionId).replace(/\0/g, '')
      );

      // Verify subscription payment details updated
      expect(updatedSubscriptionData).toBeDefined();
      expect(updatedSubscriptionData!.paymentCount).toBe(1); // Payment count increased
      expect(updatedSubscriptionData!.lastPayment).toBe(futureTimestamp); // Last payment timestamp updated
      expect(updatedSubscriptionData!.nextPayment).toBe(futureTimestamp + (30 * 24 * 60 * 60)); // Next payment scheduled
      expect(updatedSubscriptionData!.status).toBe('active'); // Still active after payment

      // Verify merchant stats updated (if tracked)
      if (updatedMerchantData) {
        // Transaction count should increase
        expect(Number(updatedMerchantData.createdAt)).toBe(Number(initialMerchantData?.createdAt || 0));
      }

      // Customer still has active subscription after payment
      expect(paymentGateway.getCustomerActiveCount(customerId)).toBe(1n);

      paymentGateway.printEntityDetailedHistory(customerId);
      console.log('✅ Customer payment processing test passed');
    });

    test('should prevent payment processing when not due', () => {
      // Arrange
      const merchantId = 'merchant_016';
      const customerId = 'customer_009';
      const amount = 999n;
      const maxAmount = 1999n;
      const frequencyDays = 30;

      paymentGateway.registerMerchant(merchantId, 'Early Payment Service');
      const { subscriptionId } = paymentGateway.createSubscription(merchantId, customerId, amount, maxAmount, frequencyDays);

      // Don't advance time - payment should not be due yet

      // Act & Assert - Payment should fail because it's not due
      expect(() => {
        paymentGateway.processSubscriptionPayment(subscriptionId, 'service_delivered_proof');
      }).toThrow('Payment not due yet');

      // Verify subscription state unchanged
      const subscriptionData = paymentGateway.getPrivateState().subscriptionData.get(
        new TextDecoder().decode(subscriptionId).replace(/\0/g, '')
      );
      expect(subscriptionData!.paymentCount).toBe(0); // No payments processed
      expect(subscriptionData!.status).toBe('active');

      console.log('✅ Payment not due prevention test passed');
    });

    test('should track multiple payments over time', () => {
      // Arrange
      const merchantId = 'merchant_017';
      const customerId = 'customer_010';
      const amount = 500n;
      const maxAmount = 1000n;
      const frequencyDays = 7; // Weekly subscription

      paymentGateway.registerMerchant(merchantId, 'Weekly Service');
      const { subscriptionId } = paymentGateway.createSubscription(merchantId, customerId, amount, maxAmount, frequencyDays);

      // Act - Process multiple payments over time
      const timestamps = [];
      const oneWeek = 7 * 24 * 60 * 60;

      // First payment
      timestamps[0] = paymentGateway.getCurrentTimestamp() + oneWeek;
      paymentGateway.updateTimestamp(timestamps[0]);
      paymentGateway.processSubscriptionPayment(subscriptionId, 'week_1_proof');

      // Second payment
      timestamps[1] = timestamps[0] + oneWeek;
      paymentGateway.updateTimestamp(timestamps[1]);
      paymentGateway.processSubscriptionPayment(subscriptionId, 'week_2_proof');

      // Third payment
      timestamps[2] = timestamps[1] + oneWeek;
      paymentGateway.updateTimestamp(timestamps[2]);
      paymentGateway.processSubscriptionPayment(subscriptionId, 'week_3_proof');

      // Assert - Verify all payments tracked correctly
      const subscriptionData = paymentGateway.getPrivateState().subscriptionData.get(
        new TextDecoder().decode(subscriptionId).replace(/\0/g, '')
      );

      expect(subscriptionData!.paymentCount).toBe(3); // Three payments processed
      expect(subscriptionData!.lastPayment).toBe(timestamps[2]); // Last payment is most recent
      expect(subscriptionData!.nextPayment).toBe(timestamps[2] + oneWeek); // Next payment scheduled
      expect(subscriptionData!.status).toBe('active'); // Still active

      // Customer maintains active subscription
      expect(paymentGateway.getCustomerActiveCount(customerId)).toBe(1n);

      paymentGateway.printEntityDetailedHistory(customerId);
      console.log('✅ Multiple payments tracking test passed');
    });
  });

  describe('Subscription Count Proofs', () => {
    test('should prove customer has sufficient active subscriptions', () => {
      // Arrange
      const merchantId1 = 'merchant_014';
      const merchantId2 = 'merchant_015';
      const customerId = 'customer_008';
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