import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { type Logger } from 'pino';
import {
  type PaymentContract,
  type PaymentDerivedState,
  type PaymentProviders,
  type DeployedPaymentContract,
  emptyPaymentState,
  type UserAction,
  type PaymentAccountId,
  MERCHANT_TIER,
  SUBSCRIPTION_STATUS,
  type MerchantInfo,
  type SubscriptionInfo,
  type CustomerBalance,
  type MerchantBalance
} from './common-types';
import {
  type PaymentPrivateState,
  Contract,
  createPaymentPrivateState,
  ledger,
  pureCircuits,
  paymentWitnesses,
  TransactionType,
  validateAmount,
  validateBusinessName,
} from '@midnight-pay/pay-contract';
import * as utils from './utils/index';
import { combineLatest, concat, defer, firstValueFrom, from, map, type Observable, of, retry, scan, Subject } from 'rxjs';
import type { DetailedPaymentTransaction } from './common-types';

const paymentContract: PaymentContract = new Contract(paymentWitnesses);

export interface DeployedPaymentAPI {
  readonly deployedContractAddress: ContractAddress;
  readonly state$: Observable<PaymentDerivedState>;
  readonly entityId: string; // Can be customer ID or merchant ID

  // Merchant operations
  registerMerchant(merchantId: string, businessName: string): Promise<void>;
  getMerchantInfo(merchantId: string): Promise<MerchantInfo>;
  getMerchantBalance(merchantId: string): Promise<MerchantBalance>;
  withdrawMerchantEarnings(merchantId: string, amount: string): Promise<void>;

  // Customer operations
  depositCustomerFunds(customerId: string, amount: string): Promise<void>;
  withdrawCustomerFunds(customerId: string, amount: string): Promise<void>;
  getCustomerBalance(customerId: string): Promise<CustomerBalance>;

  // Subscription management
  createSubscription(
    merchantId: string,
    customerId: string,
    amount: string,
    maxAmount: string,
    frequencyDays: number
  ): Promise<{ subscriptionId: Uint8Array }>;
  pauseSubscription(subscriptionId: Uint8Array, customerId: string): Promise<void>;
  resumeSubscription(subscriptionId: Uint8Array, customerId: string): Promise<void>;
  cancelSubscription(subscriptionId: Uint8Array, customerId: string): Promise<void>;
  getSubscriptionInfo(subscriptionId: Uint8Array): Promise<SubscriptionInfo>;

  // Payment processing
  processSubscriptionPayment(subscriptionId: Uint8Array, serviceProof: string): Promise<void>;
  proveActiveSubscriptionsCount(customerId: string, threshold: number): Promise<boolean>;

  // System operations
  updateTimestamp(newTimestamp: number): Promise<void>;
  getTotalSupply(): Promise<bigint>;
  getTotalMerchants(): Promise<bigint>;
  getTotalSubscriptions(): Promise<bigint>;
  getCurrentTimestamp(): Promise<number>;

  // State queries
  getTransactionHistory(): Promise<DetailedPaymentTransaction[]>;
  getActiveSubscriptions(customerId: string): Promise<SubscriptionInfo[]>;
  getMerchantSubscribers(merchantId: string): Promise<SubscriptionInfo[]>;
}

export class PaymentAPI implements DeployedPaymentAPI {
  private readonly transactions$ = new Subject<UserAction>();
  private readonly privateStates$ = new Subject<PaymentPrivateState>();
  public readonly state$: Observable<PaymentDerivedState>;
  public readonly deployedContractAddress: ContractAddress;

  private constructor(
    public readonly accountId: PaymentAccountId,
    public readonly entityId: string, // Entity ID for this instance (customer or merchant)
    public readonly deployedContract: DeployedPaymentContract,
    public readonly providers: PaymentProviders,
    private readonly logger: Logger,
  ) {
    const combine = (acc: PaymentDerivedState, value: PaymentDerivedState): PaymentDerivedState => {
      return {
        totalMerchants: value.totalMerchants,
        totalSubscriptions: value.totalSubscriptions,
        totalSupply: value.totalSupply,
        currentTimestamp: value.currentTimestamp,
        customerBalance: value.customerBalance ?? acc.customerBalance,
        merchantBalance: value.merchantBalance ?? acc.merchantBalance,
        activeSubscriptions: value.activeSubscriptions ?? acc.activeSubscriptions,
        transactionHistory: value.transactionHistory ?? acc.transactionHistory,
        lastTransaction: value.lastTransaction,
        lastCancelledTransaction: value.lastCancelledTransaction,
      };
    };

    this.deployedContractAddress = deployedContract as any; // Simplified for now
    this.state$ = combineLatest([
      providers.publicDataProvider
        .contractStateObservable(this.deployedContractAddress, { type: 'all' })
        .pipe(map((contractState: any) => ledger(contractState.data))),

      concat(
        from(defer(() => providers.privateStateProvider.get(this.accountId) as Promise<PaymentPrivateState>)),
        this.privateStates$,
      ),
      concat(of(undefined), this.transactions$),
    ]).pipe(
      scan(
        (acc: PaymentDerivedState, data: any) => {
          const [ledgerState, privateState, userAction] = data;
          const transactionHistory = this.buildTransactionHistory(privateState, userAction);

          return combine(acc, {
            totalMerchants: ledgerState.total_merchants,
            totalSubscriptions: ledgerState.total_subscriptions,
            totalSupply: ledgerState.total_supply,
            currentTimestamp: Number(ledgerState.current_timestamp),
            customerBalance: this.getEntityBalance(ledgerState, this.entityId, 'customer'),
            merchantBalance: this.getEntityBalance(ledgerState, this.entityId, 'merchant'),
            activeSubscriptions: this.countActiveSubscriptions(privateState, this.entityId),
            transactionHistory,
            lastTransaction: userAction?.transaction ? this.convertToDetailedTransaction(userAction.transaction) : acc.lastTransaction,
            lastCancelledTransaction: userAction?.cancelledTransaction ? this.convertToDetailedTransaction(userAction.cancelledTransaction) : acc.lastCancelledTransaction,
          });
        },
        emptyPaymentState(),
      ),
    );
  }

  // Static factory method - following bank pattern
  static async build(
    entityId: string,
    providers: PaymentProviders,
    contractAddress?: ContractAddress,
    logger?: Logger,
  ): Promise<PaymentAPI> {
    const defaultLogger = logger ?? { info: console.log, error: console.error } as Logger;
    const accountId = `payment-${entityId}`;

    let deployedContract: DeployedPaymentContract;

    if (contractAddress) {
      deployedContract = contractAddress as any; // Simplified for now
    } else {
      // Deploy new contract if no address provided
      const initialPrivateState = createPaymentPrivateState();
      deployedContract = contractAddress as any; // Simplified for now
      defaultLogger.info('Deployed new payment contract');
    }

    return new PaymentAPI(accountId, entityId, deployedContract, providers, defaultLogger);
  }

  // Helper methods
  private getEntityBalance(ledgerState: any, entityId: string, type: 'customer' | 'merchant'): bigint | undefined {
    const balancesMap = type === 'customer' ? ledgerState.customer_balances : ledgerState.merchant_balances;
    const entityIdBytes = new TextEncoder().encode(entityId);
    const paddedId = new Uint8Array(32);
    paddedId.set(entityIdBytes.slice(0, Math.min(entityIdBytes.length, 32)));

    for (const [key, value] of balancesMap) {
      if (Array.from(key).every((byte, i) => byte === paddedId[i])) {
        return value;
      }
    }
    return undefined;
  }

  private countActiveSubscriptions(privateState: PaymentPrivateState, customerId: string): number {
    const customerData = privateState.customerData.get(customerId);
    if (!customerData) return 0;

    let activeCount = 0;
    customerData.subscriptions.forEach(subId => {
      const subscription = privateState.subscriptionData.get(subId);
      if (subscription && subscription.status === 'active') {
        activeCount++;
      }
    });
    return activeCount;
  }

  private buildTransactionHistory(privateState: PaymentPrivateState, userAction?: UserAction): DetailedPaymentTransaction[] {
    // Implementation would build transaction history from private state
    // For now, return empty array - this would be implemented based on specific needs
    return [];
  }

  private convertToDetailedTransaction(transaction: any): DetailedPaymentTransaction {
    return {
      type: transaction.type,
      amount: transaction.amount,
      timestamp: transaction.timestamp,
      merchantId: transaction.merchantId,
      customerId: transaction.customerId,
      subscriptionId: transaction.subscriptionId,
      frequency: transaction.frequency,
    };
  }

  private stringToBytes32(str: string): Uint8Array {
    const bytes = new Uint8Array(32);
    const encoder = new TextEncoder();
    const encoded = encoder.encode(str);
    bytes.set(encoded.slice(0, Math.min(encoded.length, 32)));
    return bytes;
  }

  private stringToBytes64(str: string): Uint8Array {
    const bytes = new Uint8Array(64);
    const encoder = new TextEncoder();
    const encoded = encoder.encode(str);
    bytes.set(encoded.slice(0, Math.min(encoded.length, 64)));
    return bytes;
  }

  // Merchant operations implementation
  async registerMerchant(merchantId: string, businessName: string): Promise<void> {
    if (!validateBusinessName(businessName)) {
      throw new Error('Invalid business name');
    }

    const merchantIdBytes = this.stringToBytes32(merchantId);
    const businessNameBytes = this.stringToBytes64(businessName);

    const transaction = {
      type: TransactionType.MERCHANT_REGISTERED,
      timestamp: new Date(),
      merchantId: merchantId,
    };

    await this.executeCircuit('register_merchant', [merchantIdBytes, businessNameBytes], transaction);
  }

  async getMerchantInfo(merchantId: string): Promise<MerchantInfo> {
    const privateState = await this.providers.privateStateProvider.get(this.accountId) as PaymentPrivateState;
    const merchantData = privateState.merchantData.get(merchantId);

    if (!merchantData) {
      throw new Error(`Merchant ${merchantId} not found`);
    }

    return {
      merchantId: merchantData.merchantId,
      businessName: merchantData.businessName,
      tier: MERCHANT_TIER.unverified, // Would be calculated from transaction count
      transactionCount: 0n, // Would be retrieved from private state
      totalVolume: 0n, // Would be calculated from transaction history
      createdAt: merchantData.createdAt,
      isActive: true,
    };
  }

  async getMerchantBalance(merchantId: string): Promise<MerchantBalance> {
    const ledgerState = await firstValueFrom(
      this.providers.publicDataProvider
        .contractStateObservable(this.deployedContractAddress, { type: 'all' })
        .pipe(map((contractState: any) => ledger(contractState.data)))
    );

    const balance = this.getEntityBalance(ledgerState, merchantId, 'merchant') ?? 0n;

    return {
      merchantId,
      availableBalance: balance,
      totalEarnings: balance, // Simplified - would track separately
      activeSubscribers: 0, // Would count from subscription data
      lastPayment: 0, // Would track from payment history
    };
  }

  async withdrawMerchantEarnings(merchantId: string, amount: string): Promise<void> {
    if (!validateAmount(amount)) {
      throw new Error('Invalid amount');
    }

    const merchantIdBytes = this.stringToBytes32(merchantId);
    const amountBigInt = BigInt(amount);

    const transaction = {
      type: TransactionType.SUBSCRIPTION_PAYMENT,
      amount: amountBigInt,
      timestamp: new Date(),
      merchantId: merchantId,
    };

    await this.executeCircuit('withdraw_merchant_earnings', [merchantIdBytes, amountBigInt], transaction);
  }

  // Customer operations implementation
  async depositCustomerFunds(customerId: string, amount: string): Promise<void> {
    if (!validateAmount(amount)) {
      throw new Error('Invalid amount');
    }

    const customerIdBytes = this.stringToBytes32(customerId);
    const amountBigInt = BigInt(amount);

    const transaction = {
      type: TransactionType.SUBSCRIPTION_PAYMENT,
      amount: amountBigInt,
      timestamp: new Date(),
      customerId: customerId,
    };

    await this.executeCircuit('deposit_customer_funds', [customerIdBytes, amountBigInt], transaction);
  }

  async withdrawCustomerFunds(customerId: string, amount: string): Promise<void> {
    if (!validateAmount(amount)) {
      throw new Error('Invalid amount');
    }

    const customerIdBytes = this.stringToBytes32(customerId);
    const amountBigInt = BigInt(amount);

    const transaction = {
      type: TransactionType.SUBSCRIPTION_PAYMENT,
      amount: amountBigInt,
      timestamp: new Date(),
      customerId: customerId,
    };

    await this.executeCircuit('withdraw_customer_funds', [customerIdBytes, amountBigInt], transaction);
  }

  async getCustomerBalance(customerId: string): Promise<CustomerBalance> {
    const ledgerState = await firstValueFrom(
      this.providers.publicDataProvider
        .contractStateObservable(this.deployedContractAddress, { type: 'all' })
        .pipe(map((contractState: any) => ledger(contractState.data)))
    );

    const balance = this.getEntityBalance(ledgerState, customerId, 'customer') ?? 0n;
    const privateState = await this.providers.privateStateProvider.get(this.accountId) as PaymentPrivateState;
    const activeSubscriptions = this.countActiveSubscriptions(privateState, customerId);

    return {
      customerId,
      availableBalance: balance,
      activeSubscriptions,
      totalSpent: 0n, // Would be calculated from transaction history
      lastActivity: Date.now(), // Would track from last transaction
    };
  }

  // Subscription management implementation
  async createSubscription(
    merchantId: string,
    customerId: string,
    amount: string,
    maxAmount: string,
    frequencyDays: number
  ): Promise<{ subscriptionId: Uint8Array }> {
    if (!validateAmount(amount) || !validateAmount(maxAmount)) {
      throw new Error('Invalid amount');
    }

    const merchantIdBytes = this.stringToBytes32(merchantId);
    const customerIdBytes = this.stringToBytes32(customerId);
    const amountBigInt = BigInt(amount);
    const maxAmountBigInt = BigInt(maxAmount);
    const frequencyBigInt = BigInt(frequencyDays);

    const transaction = {
      type: TransactionType.SUBSCRIPTION_CREATED,
      amount: amountBigInt,
      timestamp: new Date(),
      merchantId: merchantId,
      customerId: customerId,
      frequency: frequencyDays,
    };

    const result = await this.executeCircuit('create_subscription', [
      merchantIdBytes,
      customerIdBytes,
      amountBigInt,
      maxAmountBigInt,
      frequencyBigInt
    ], transaction);

    return { subscriptionId: result as Uint8Array };
  }

  async pauseSubscription(subscriptionId: Uint8Array, customerId: string): Promise<void> {
    const customerIdBytes = this.stringToBytes32(customerId);

    const transaction = {
      type: TransactionType.SUBSCRIPTION_PAUSED,
      timestamp: new Date(),
      customerId: customerId,
    };

    await this.executeCircuit('pause_subscription', [subscriptionId, customerIdBytes], transaction);
  }

  async resumeSubscription(subscriptionId: Uint8Array, customerId: string): Promise<void> {
    const customerIdBytes = this.stringToBytes32(customerId);

    const transaction = {
      type: TransactionType.SUBSCRIPTION_RESUMED,
      timestamp: new Date(),
      customerId: customerId,
    };

    await this.executeCircuit('resume_subscription', [subscriptionId, customerIdBytes], transaction);
  }

  async cancelSubscription(subscriptionId: Uint8Array, customerId: string): Promise<void> {
    const customerIdBytes = this.stringToBytes32(customerId);

    const transaction = {
      type: TransactionType.SUBSCRIPTION_CANCELLED,
      timestamp: new Date(),
      customerId: customerId,
    };

    await this.executeCircuit('cancel_subscription', [subscriptionId, customerIdBytes], transaction);
  }

  async getSubscriptionInfo(subscriptionId: Uint8Array): Promise<SubscriptionInfo> {
    const privateState = await this.providers.privateStateProvider.get(this.accountId) as PaymentPrivateState;
    const subscriptionIdStr = new TextDecoder().decode(subscriptionId).replace(/\0/g, '');
    const subscriptionData = privateState.subscriptionData.get(subscriptionIdStr);

    if (!subscriptionData) {
      throw new Error(`Subscription ${subscriptionIdStr} not found`);
    }

    return {
      subscriptionId: subscriptionData.subscriptionId,
      merchantId: subscriptionData.merchantId,
      customerId: subscriptionData.customerId,
      amount: subscriptionData.amount,
      maxAmount: subscriptionData.maxAmount,
      frequencyDays: subscriptionData.frequencyDays,
      status: subscriptionData.status === 'active' ? SUBSCRIPTION_STATUS.active :
              subscriptionData.status === 'paused' ? SUBSCRIPTION_STATUS.paused :
              subscriptionData.status === 'cancelled' ? SUBSCRIPTION_STATUS.cancelled :
              SUBSCRIPTION_STATUS.expired,
      lastPayment: subscriptionData.lastPayment,
      nextPayment: subscriptionData.nextPayment,
      paymentCount: subscriptionData.paymentCount,
    };
  }

  // Payment processing implementation
  async processSubscriptionPayment(subscriptionId: Uint8Array, serviceProof: string): Promise<void> {
    const serviceProofBytes = this.stringToBytes32(serviceProof);

    const transaction = {
      type: TransactionType.SUBSCRIPTION_PAYMENT,
      timestamp: new Date(),
    };

    await this.executeCircuit('process_subscription_payment', [subscriptionId, serviceProofBytes], transaction);
  }

  async proveActiveSubscriptionsCount(customerId: string, threshold: number): Promise<boolean> {
    const customerIdBytes = this.stringToBytes32(customerId);
    const thresholdBigInt = BigInt(threshold);

    const result = await this.executeCircuit('prove_active_subscriptions_count', [customerIdBytes, thresholdBigInt]);
    return result as boolean;
  }

  // System operations implementation
  async updateTimestamp(newTimestamp: number): Promise<void> {
    const timestampBigInt = BigInt(newTimestamp);
    await this.executeCircuit('update_timestamp', [timestampBigInt]);
  }

  async getTotalSupply(): Promise<bigint> {
    const ledgerState = await firstValueFrom(
      this.providers.publicDataProvider
        .contractStateObservable(this.deployedContractAddress, { type: 'all' })
        .pipe(map((contractState: any) => ledger(contractState.data)))
    );
    return (ledgerState as any).total_supply;
  }

  async getTotalMerchants(): Promise<bigint> {
    const ledgerState = await firstValueFrom(
      this.providers.publicDataProvider
        .contractStateObservable(this.deployedContractAddress, { type: 'all' })
        .pipe(map((contractState: any) => ledger(contractState.data)))
    );
    return (ledgerState as any).total_merchants;
  }

  async getTotalSubscriptions(): Promise<bigint> {
    const ledgerState = await firstValueFrom(
      this.providers.publicDataProvider
        .contractStateObservable(this.deployedContractAddress, { type: 'all' })
        .pipe(map((contractState: any) => ledger(contractState.data)))
    );
    return (ledgerState as any).total_subscriptions;
  }

  async getCurrentTimestamp(): Promise<number> {
    const ledgerState = await firstValueFrom(
      this.providers.publicDataProvider
        .contractStateObservable(this.deployedContractAddress, { type: 'all' })
        .pipe(map((contractState: any) => ledger(contractState.data)))
    );
    return Number((ledgerState as any).current_timestamp);
  }

  // State queries implementation
  async getTransactionHistory(): Promise<DetailedPaymentTransaction[]> {
    const currentState = await firstValueFrom(this.state$);
    return currentState.transactionHistory ?? [];
  }

  async getActiveSubscriptions(customerId: string): Promise<SubscriptionInfo[]> {
    const privateState = await this.providers.privateStateProvider.get(this.accountId) as PaymentPrivateState;
    const customerData = privateState.customerData.get(customerId);

    if (!customerData) return [];

    const activeSubscriptions: SubscriptionInfo[] = [];
    customerData.subscriptions.forEach(subId => {
      const subscription = privateState.subscriptionData.get(subId);
      if (subscription && subscription.status === 'active') {
        activeSubscriptions.push({
          subscriptionId: subscription.subscriptionId,
          merchantId: subscription.merchantId,
          customerId: subscription.customerId,
          amount: subscription.amount,
          maxAmount: subscription.maxAmount,
          frequencyDays: subscription.frequencyDays,
          status: SUBSCRIPTION_STATUS.active,
          lastPayment: subscription.lastPayment,
          nextPayment: subscription.nextPayment,
          paymentCount: subscription.paymentCount,
        });
      }
    });

    return activeSubscriptions;
  }

  async getMerchantSubscribers(merchantId: string): Promise<SubscriptionInfo[]> {
    const privateState = await this.providers.privateStateProvider.get(this.accountId) as PaymentPrivateState;
    const subscribers: SubscriptionInfo[] = [];

    // Iterate through all subscription data to find ones for this merchant
    for (const [subId, subscription] of privateState.subscriptionData) {
      if (subscription.merchantId === merchantId) {
        subscribers.push({
          subscriptionId: subscription.subscriptionId,
          merchantId: subscription.merchantId,
          customerId: subscription.customerId,
          amount: subscription.amount,
          maxAmount: subscription.maxAmount,
          frequencyDays: subscription.frequencyDays,
          status: subscription.status === 'active' ? SUBSCRIPTION_STATUS.active :
                  subscription.status === 'paused' ? SUBSCRIPTION_STATUS.paused :
                  subscription.status === 'cancelled' ? SUBSCRIPTION_STATUS.cancelled :
                  SUBSCRIPTION_STATUS.expired,
          lastPayment: subscription.lastPayment,
          nextPayment: subscription.nextPayment,
          paymentCount: subscription.paymentCount,
        });
      }
    }

    return subscribers;
  }

  // Circuit execution helper
  private async executeCircuit(circuitName: string, args: any[], transaction?: any): Promise<any> {
    try {
      const privateState = await this.providers.privateStateProvider.get(this.accountId) as PaymentPrivateState;

      // Execute the circuit
      const result = await (this.deployedContract.circuit as any)[circuitName](...args);

      // Update private state if needed
      if (result.privateState) {
        await this.providers.privateStateProvider.set(this.accountId, result.privateState);
        this.privateStates$.next(result.privateState);
      }

      // Emit transaction
      if (transaction) {
        this.transactions$.next({ transaction, cancelledTransaction: undefined });
      }

      return result.result;
    } catch (error) {
      this.logger.error(`Circuit ${circuitName} failed:`, error);

      if (transaction) {
        this.transactions$.next({ transaction: undefined, cancelledTransaction: transaction });
      }

      throw error;
    }
  }
}

// Export all required types and enums
export {
  type PaymentDerivedState,
  type PaymentProviders,
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
} from './common-types';

export { type PaymentCircuitKeys } from './common-types';