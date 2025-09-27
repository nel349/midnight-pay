import { type Ledger, ledger } from '../managed/pay/contract/index.cjs';
import { Contract, type PaymentPrivateState, createPaymentPrivateState, paymentWitnesses } from '../index.js';
import {
  CircuitContext,
  constructorContext,
  sampleContractAddress,
  QueryContext,
} from '@midnight-ntwrk/compact-runtime';

// Local transaction record for payments (user maintains this separately)
interface PaymentTransactionRecord {
  type: 'register_merchant' | 'create_subscription' | 'pause_subscription' | 'resume_subscription' | 'cancel_subscription' | 'process_payment';
  amount?: bigint;
  timestamp: Date;
  merchantId?: string;
  customerId?: string;
  subscriptionId?: string;
  frequency?: number;
}

// Test setup class for payment gateway contract
export class PaymentTestSetup {
  private contract: Contract<PaymentPrivateState, typeof paymentWitnesses>;
  private turnContext: CircuitContext<PaymentPrivateState>;
  private contractAddress: string;
  private localTransactionLogs: Map<string, PaymentTransactionRecord[]> = new Map();

  constructor() {
    // Initialize payment contract with witnesses
    this.contract = new Contract(paymentWitnesses);
    this.contractAddress = sampleContractAddress();

    // Initialize with empty payment private state
    const initialPrivateState = createPaymentPrivateState();

    // Get initial state from contract
    const { currentPrivateState, currentContractState, currentZswapLocalState } = this.contract.initialState(
      constructorContext(initialPrivateState, '0'.repeat(64))
    );

    // Set up turn context
    this.turnContext = {
      currentPrivateState,
      currentZswapLocalState,
      originalState: currentContractState,
      transactionContext: new QueryContext(currentContractState.data, sampleContractAddress()),
    };

    console.log('💳 Payment Gateway initialized with empty state');
  }

  // Helper to convert string to Bytes<32>
  private stringToBytes32(str: string): Uint8Array {
    const bytes = new Uint8Array(32);
    const encoder = new TextEncoder();
    const encoded = encoder.encode(str);
    bytes.set(encoded.slice(0, Math.min(encoded.length, 32)));
    return bytes;
  }

  // Helper to convert string to Bytes<64> for business names
  private stringToBytes64(str: string): Uint8Array {
    const bytes = new Uint8Array(64);
    const encoder = new TextEncoder();
    const encoded = encoder.encode(str);
    bytes.set(encoded.slice(0, Math.min(encoded.length, 64)));
    return bytes;
  }

  // Helper to update state and get ledger
  private updateStateAndGetLedger(circuitResults: any): Ledger {
    this.turnContext = circuitResults.context;
    return ledger(this.turnContext.transactionContext.state);
  }

  // Helper to record transaction
  private recordTransaction(entityId: string, record: PaymentTransactionRecord): void {
    if (!this.localTransactionLogs.has(entityId)) {
      this.localTransactionLogs.set(entityId, []);
    }
    this.localTransactionLogs.get(entityId)!.push(record);
  }

  // Test method: Register merchant
  registerMerchant(merchantId: string, businessName: string): Ledger {
    console.log(`🏪 Registering merchant ${merchantId} with business name: ${businessName}`);

    const merchantIdBytes = this.stringToBytes32(merchantId);
    const businessNameBytes = this.stringToBytes64(businessName);

    const results = this.contract.impureCircuits.register_merchant(this.turnContext, merchantIdBytes, businessNameBytes);
    const ledger = this.updateStateAndGetLedger(results);

    this.recordTransaction(merchantId, {
      type: 'register_merchant',
      timestamp: new Date(),
      merchantId: merchantId
    });

    return ledger;
  }

  // Test method: Create subscription
  createSubscription(
    merchantId: string,
    customerId: string,
    amount: bigint,
    maxAmount: bigint,
    frequencyDays: number
  ): { ledger: Ledger, subscriptionId: Uint8Array } {
    console.log(`📝 Creating subscription: customer ${customerId} → merchant ${merchantId}, $${amount} every ${frequencyDays} days`);

    const merchantIdBytes = this.stringToBytes32(merchantId);
    const customerIdBytes = this.stringToBytes32(customerId);
    const frequencyDaysBigInt = BigInt(frequencyDays);

    const results = this.contract.impureCircuits.create_subscription(
      this.turnContext,
      merchantIdBytes,
      customerIdBytes,
      amount,
      maxAmount,
      frequencyDaysBigInt
    );

    const ledger = this.updateStateAndGetLedger(results);
    const subscriptionId = results.result;

    // Convert subscriptionId to string for logging
    let subscriptionIdStr = 'unknown';
    if (subscriptionId && typeof subscriptionId.slice === 'function') {
      subscriptionIdStr = Array.from(subscriptionId.slice(0, 8))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } else if (subscriptionId) {
      subscriptionIdStr = 'output_exists_but_no_slice';
    }

    this.recordTransaction(customerId, {
      type: 'create_subscription',
      amount: amount,
      timestamp: new Date(),
      merchantId: merchantId,
      customerId: customerId,
      subscriptionId: subscriptionIdStr,
      frequency: frequencyDays
    });

    return { ledger, subscriptionId };
  }

  // Test method: Pause subscription
  pauseSubscription(subscriptionId: Uint8Array, customerId: string): Ledger {
    console.log(`⏸️ Customer ${customerId} pausing subscription`);

    const customerIdBytes = this.stringToBytes32(customerId);

    const results = this.contract.impureCircuits.pause_subscription(this.turnContext, subscriptionId, customerIdBytes);
    const ledger = this.updateStateAndGetLedger(results);

    const subscriptionIdStr = subscriptionId && typeof subscriptionId.slice === 'function'
      ? Array.from(subscriptionId.slice(0, 8))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
      : 'unknown';

    this.recordTransaction(customerId, {
      type: 'pause_subscription',
      timestamp: new Date(),
      customerId: customerId,
      subscriptionId: subscriptionIdStr
    });

    return ledger;
  }

  // Test method: Resume subscription
  resumeSubscription(subscriptionId: Uint8Array, customerId: string): Ledger {
    console.log(`▶️ Customer ${customerId} resuming subscription`);

    const customerIdBytes = this.stringToBytes32(customerId);

    const results = this.contract.impureCircuits.resume_subscription(this.turnContext, subscriptionId, customerIdBytes);
    const ledger = this.updateStateAndGetLedger(results);

    const subscriptionIdStr = subscriptionId && typeof subscriptionId.slice === 'function'
      ? Array.from(subscriptionId.slice(0, 8))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
      : 'unknown';

    this.recordTransaction(customerId, {
      type: 'resume_subscription',
      timestamp: new Date(),
      customerId: customerId,
      subscriptionId: subscriptionIdStr
    });

    return ledger;
  }

  // Test method: Cancel subscription
  cancelSubscription(subscriptionId: Uint8Array, customerId: string): Ledger {
    console.log(`❌ Customer ${customerId} cancelling subscription`);

    const customerIdBytes = this.stringToBytes32(customerId);

    const results = this.contract.impureCircuits.cancel_subscription(this.turnContext, subscriptionId, customerIdBytes);
    const ledger = this.updateStateAndGetLedger(results);

    const subscriptionIdStr = subscriptionId && typeof subscriptionId.slice === 'function'
      ? Array.from(subscriptionId.slice(0, 8))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
      : 'unknown';

    this.recordTransaction(customerId, {
      type: 'cancel_subscription',
      timestamp: new Date(),
      customerId: customerId,
      subscriptionId: subscriptionIdStr
    });

    return ledger;
  }

  // Test method: Process subscription payment
  processSubscriptionPayment(subscriptionId: Uint8Array, serviceProof: string): Ledger {
    console.log(`💰 Processing subscription payment`);

    const serviceProofBytes = this.stringToBytes32(serviceProof);

    const results = this.contract.impureCircuits.process_subscription_payment(this.turnContext, subscriptionId, serviceProofBytes);
    const ledger = this.updateStateAndGetLedger(results);

    const subscriptionIdStr = subscriptionId && typeof subscriptionId.slice === 'function'
      ? Array.from(subscriptionId.slice(0, 8))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
      : 'unknown';

    this.recordTransaction('system', {
      type: 'process_payment',
      timestamp: new Date(),
      subscriptionId: subscriptionIdStr
    });

    return ledger;
  }

  // Test method: Prove active subscriptions count
  proveActiveSubscriptionsCount(customerId: string, threshold: number): boolean {
    console.log(`🔍 Checking if customer ${customerId} has at least ${threshold} active subscriptions`);

    const customerIdBytes = this.stringToBytes32(customerId);
    const thresholdBigInt = BigInt(threshold);

    const results = this.contract.impureCircuits.prove_active_subscriptions_count(this.turnContext, customerIdBytes, thresholdBigInt);
    this.updateStateAndGetLedger(results);

    return results.result;
  }

  // Test method: Update timestamp
  updateTimestamp(newTimestamp: number): Ledger {
    console.log(`⏰ Updating timestamp to ${newTimestamp}`);

    const results = this.contract.impureCircuits.update_timestamp(this.turnContext, BigInt(newTimestamp));
    return this.updateStateAndGetLedger(results);
  }

  // Getter methods for state inspection
  getLedgerState(): Ledger {
    return ledger(this.turnContext.transactionContext.state);
  }

  getPrivateState(): PaymentPrivateState {
    return this.turnContext.currentPrivateState;
  }

  // Helper: Get current timestamp
  getCurrentTimestamp(): number {
    return Number(this.getLedgerState().current_timestamp);
  }

  // Helper: Get total merchants
  getTotalMerchants(): bigint {
    return this.getLedgerState().total_merchants;
  }

  // Helper: Get total subscriptions
  getTotalSubscriptions(): bigint {
    return this.getLedgerState().total_subscriptions;
  }

  // Helper: Get customer active subscription count
  getCustomerActiveCount(customerId: string): bigint {
    const customerData = this.turnContext.currentPrivateState.customerData.get(customerId);

    if (!customerData) {
      return 0n;
    }

    // Count active subscriptions
    let activeCount = 0;
    customerData.subscriptions.forEach(subId => {
      const subscription = this.turnContext.currentPrivateState.subscriptionData.get(subId);
      if (subscription && subscription.status === 'active') {
        activeCount++;
      }
    });

    return BigInt(activeCount);
  }

  // Debug helper: Print current payment gateway state
  printPaymentGatewayState(): void {
    console.log('\n📊 Payment Gateway State:');
    console.log('├─ Total Merchants:', this.getTotalMerchants().toString());
    console.log('├─ Total Subscriptions:', this.getTotalSubscriptions().toString());
    console.log('├─ Current Timestamp:', this.getCurrentTimestamp());
    console.log('└─ Active Entities:', Array.from(this.localTransactionLogs.keys()).join(', '));
    console.log('');
  }

  // Helper: Get entity transaction history
  getEntityTransactionHistory(entityId: string): PaymentTransactionRecord[] {
    return [...(this.localTransactionLogs.get(entityId) || [])];
  }

  // Helper: Print entity's detailed transaction history
  printEntityDetailedHistory(entityId: string): void {
    const history = this.localTransactionLogs.get(entityId) || [];
    console.log(`\n📜 ${entityId} Transaction History:`);
    history.forEach((tx, index) => {
      const amountStr = tx.amount ? `$${tx.amount}` : 'N/A';
      const details = [];
      if (tx.merchantId) details.push(`merchant: ${tx.merchantId}`);
      if (tx.customerId) details.push(`customer: ${tx.customerId}`);
      if (tx.frequency) details.push(`frequency: ${tx.frequency}d`);
      const detailsStr = details.length > 0 ? ` (${details.join(', ')})` : '';
      console.log(`├─ [${index}] ${tx.type.toUpperCase()}: ${amountStr}${detailsStr} (${tx.timestamp.toLocaleTimeString()})`);
    });
    console.log('');
  }

  // Helper: Get all entities with transaction history
  getAllEntities(): string[] {
    return Array.from(this.localTransactionLogs.keys());
  }
}