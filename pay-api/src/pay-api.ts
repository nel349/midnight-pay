import { type ContractAddress, StateValue, CostModel } from '@midnight-ntwrk/compact-runtime';
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
  type Ledger,
  pureCircuits,
  paymentWitnesses,
  TransactionType,
  validateAmount,
  validateBusinessName,
} from '@midnight-pay/pay-contract';
import * as utils from './utils/index';
import { parseDecimalAmount } from './utils/index.js';
import { combineLatest, concat, defer, firstValueFrom, from, map, type Observable, of, retry, scan, Subject, timeout } from 'rxjs';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
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
  getCurrentTimestamp(): Promise<bigint>;

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
  private readonly detailedLogKey: string;

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

    this.deployedContractAddress = deployedContract.deployTxData.public.contractAddress;
    // Use shared transaction log key for all instances of the same contract
    this.detailedLogKey = `${this.deployedContractAddress}:shared:dlog`;

    // Initialize transaction history cache
    this.updateTransactionHistoryCache();
    this.state$ = combineLatest([
      providers.publicDataProvider
        .contractStateObservable(this.deployedContractAddress, { type: 'all' })
        .pipe(map((contractState) => ledger(contractState.data))),

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

  // Static deploy method - following bank pattern
  static async deploy(
    providers: PaymentProviders,
    logger?: Logger,
  ): Promise<ContractAddress> {
    const defaultLogger = logger ?? { info: console.log, error: console.error } as Logger;
    defaultLogger.info('🚀 Payment contract deployment started');

    // Use neutral state ID for deployment like bank contract
    const deployedContract = await deployContract(providers, {
      privateStateId: 'deploy' as PaymentAccountId,
      contract: paymentContract,
      initialPrivateState: createPaymentPrivateState(),
    });

    const contractAddress = deployedContract.deployTxData.public.contractAddress;
    defaultLogger.info(`🎉 Payment contract deployed at ${contractAddress}`);

    return contractAddress;
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
      // Connect to existing contract
      const initialPrivateState = createPaymentPrivateState();
      deployedContract = await findDeployedContract(providers, {
        contractAddress,
        contract: paymentContract,
        privateStateId: accountId,
        initialPrivateState,
      });
      defaultLogger.info(`Connected to existing payment contract at ${contractAddress}`);
    } else {
      // Deploy new contract if no address provided
      const initialPrivateState = createPaymentPrivateState();
      deployedContract = await deployContract(providers, {
        privateStateId: accountId,
        contract: paymentContract,
        initialPrivateState,
      });
      defaultLogger.info(`Deployed new payment contract at ${deployedContract.deployTxData.public.contractAddress}`);
    }

    return new PaymentAPI(accountId, entityId, deployedContract, providers, defaultLogger);
  }

  // Helper methods
  private getEntityBalance(ledgerState: Ledger, entityId: string, type: 'customer' | 'merchant'): bigint | undefined {
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
    // Return cached transaction history (this will be loaded asynchronously)
    return this.cachedTransactionHistory || [];
  }

  private async updateTransactionHistoryCache(): Promise<void> {
    try {
      this.cachedTransactionHistory = await this.getDetailedTransactionHistory();
    } catch (error) {
      console.error('Failed to update transaction history cache:', error);
    }
  }

  private cachedTransactionHistory: DetailedPaymentTransaction[] = [];

  private convertToDetailedTransaction(transaction: any): DetailedPaymentTransaction {
    // Map TransactionType enum to DetailedPaymentTransaction string types
    let type: DetailedPaymentTransaction['type'];
    switch (transaction.type) {
      case TransactionType.MERCHANT_REGISTERED:
        type = 'register_merchant';
        break;
      case TransactionType.SUBSCRIPTION_CREATED:
        type = 'create_subscription';
        break;
      case TransactionType.SUBSCRIPTION_PAUSED:
        type = 'pause_subscription';
        break;
      case TransactionType.SUBSCRIPTION_RESUMED:
        type = 'resume_subscription';
        break;
      case TransactionType.SUBSCRIPTION_CANCELLED:
        type = 'cancel_subscription';
        break;
      case TransactionType.SUBSCRIPTION_PAYMENT:
        type = 'process_subscription_payment';
        break;
      default:
        type = 'deposit_funds'; // fallback
    }

    return {
      type,
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

  private calculateTotalSpent(transactionHistory: DetailedPaymentTransaction[], customerId: string): bigint {
    return transactionHistory
      .filter(tx =>
        tx.customerId === customerId &&
        tx.type === 'process_subscription_payment' &&
        tx.amount !== undefined
      )
      .reduce((total, tx) => total + (tx.amount || 0n), 0n);
  }

  // Transaction history persistence following bank API pattern
  private async getDetailedTransactionHistory(): Promise<DetailedPaymentTransaction[]> {
    try {
      const raw = await this.providers.privateStateProvider.get(this.detailedLogKey as unknown as PaymentAccountId);
      return (raw as unknown as DetailedPaymentTransaction[]) ?? [];
    } catch {
      return [];
    }
  }

  private async appendDetailedLog(entry: DetailedPaymentTransaction): Promise<void> {
    try {
      const current = await this.getDetailedTransactionHistory();
      console.log('Current transaction history length:', current.length);
      const updated = [...current, entry].slice(-100); // Keep last 100 transactions
      console.log('Updated transaction history length:', updated.length);
      await this.providers.privateStateProvider.set(
        this.detailedLogKey as unknown as PaymentAccountId,
        updated as unknown as PaymentPrivateState,
      );
      console.log('Successfully saved transaction history');
    } catch (error) {
      console.error('Failed to append detailed log:', error);
    }
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
        .pipe(map((contractState) => ledger(contractState.data)))
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
    const amountBigInt = parseDecimalAmount(amount);

    const transaction = {
      type: TransactionType.SUBSCRIPTION_PAYMENT, // Reuse existing type for withdrawals
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
    const amountBigInt = parseDecimalAmount(amount);

    // Deposit is just a balance update, no transaction tracking needed
    await this.executeCircuit('deposit_customer_funds', [customerIdBytes, amountBigInt]);
  }

  async withdrawCustomerFunds(customerId: string, amount: string): Promise<void> {
    if (!validateAmount(amount)) {
      throw new Error('Invalid amount');
    }

    const customerIdBytes = this.stringToBytes32(customerId);
    const amountBigInt = parseDecimalAmount(amount);

    // Withdrawal is just a balance update, no transaction tracking needed
    await this.executeCircuit('withdraw_customer_funds', [customerIdBytes, amountBigInt]);
  }

  async getCustomerBalance(customerId: string): Promise<CustomerBalance> {
    const ledgerState = await firstValueFrom(
      this.providers.publicDataProvider
        .contractStateObservable(this.deployedContractAddress, { type: 'all' })
        .pipe(map((contractState) => ledger(contractState.data)))
    );

    const balance = this.getEntityBalance(ledgerState, customerId, 'customer') ?? 0n;
    const privateState = await this.providers.privateStateProvider.get(this.accountId) as PaymentPrivateState;
    const activeSubscriptions = this.countActiveSubscriptions(privateState, customerId);

    // Calculate total spent from fresh transaction history (for shared storage consistency)
    const transactionHistory = await this.getDetailedTransactionHistory();
    const totalSpent = this.calculateTotalSpent(transactionHistory, customerId);

    return {
      customerId,
      availableBalance: balance,
      activeSubscriptions,
      totalSpent,
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
    const amountBigInt = parseDecimalAmount(amount);
    const maxAmountBigInt = parseDecimalAmount(maxAmount);
    const frequencyBigInt = BigInt(frequencyDays);

    const transaction = {
      type: TransactionType.SUBSCRIPTION_CREATED,
      amount: amountBigInt,
      timestamp: new Date(),
      merchantId: merchantId,
      customerId: customerId,
      frequency: frequencyDays,
    };

    try {
      // Call the circuit directly like the bank API does - this preserves the return value
      const txData = await this.deployedContract.callTx.create_subscription(
        merchantIdBytes,
        customerIdBytes,
        amountBigInt,
        maxAmountBigInt,
        frequencyBigInt
      );

      // The subscription ID is in txData.private.result
      const subscriptionId = txData.private.result as Uint8Array;


      // Emit transaction
      if (transaction) {
        this.transactions$.next({ transaction, cancelledTransaction: undefined });
      }

      if (!subscriptionId || !(subscriptionId instanceof Uint8Array)) {
        throw new Error(`Invalid subscription ID returned: ${typeof subscriptionId}`);
      }

      return { subscriptionId };
    } catch (error) {
      this.logger.error('create_subscription failed:', error);

      if (transaction) {
        this.transactions$.next({ transaction: undefined, cancelledTransaction: transaction });
      }

      throw error;
    }
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

    // Ensure subscriptionId is a valid Uint8Array
    if (!subscriptionId || !(subscriptionId instanceof Uint8Array)) {
      throw new Error('Invalid subscription ID: must be a Uint8Array');
    }

    // Convert Uint8Array to string for lookup
    let subscriptionIdStr: string;
    try {
      subscriptionIdStr = new TextDecoder().decode(subscriptionId).replace(/\0/g, '');
    } catch (error) {
      // If TextDecoder fails, try to convert using Array.from
      subscriptionIdStr = Array.from(subscriptionId, byte => String.fromCharCode(byte)).join('').replace(/\0/g, '');
    }

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
    // Ensure subscriptionId is a proper Uint8Array
    if (!subscriptionId || !(subscriptionId instanceof Uint8Array)) {
      throw new Error('Invalid subscription ID: must be a Uint8Array');
    }

    // Ensure it's exactly 32 bytes for Bytes<32>
    let subscriptionIdBytes: Uint8Array;
    if (subscriptionId.length === 32) {
      subscriptionIdBytes = subscriptionId;
    } else {
      // Pad or truncate to 32 bytes
      subscriptionIdBytes = new Uint8Array(32);
      subscriptionIdBytes.set(subscriptionId.slice(0, 32));
    }

    const serviceProofBytes = this.stringToBytes32(serviceProof);

    // Get subscription details to include in transaction
    const subscriptionInfo = await this.getSubscriptionInfo(subscriptionId);

    const transaction = {
      type: TransactionType.SUBSCRIPTION_PAYMENT,
      amount: subscriptionInfo.amount,
      timestamp: new Date(),
      customerId: subscriptionInfo.customerId,
      merchantId: subscriptionInfo.merchantId,
      subscriptionId: subscriptionInfo.subscriptionId,
    };

    await this.executeCircuit('process_subscription_payment', [subscriptionIdBytes, serviceProofBytes], transaction);
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
        .pipe(
          map((contractState) => ledger(contractState.data)),
          timeout(10000) // 10 second timeout
        )
    );
    return ledgerState.total_supply;
  }

  async getTotalMerchants(): Promise<bigint> {
    const ledgerState = await firstValueFrom(
      this.providers.publicDataProvider
        .contractStateObservable(this.deployedContractAddress, { type: 'all' })
        .pipe(
          map((contractState) => ledger(contractState.data)),
          timeout(10000) // 10 second timeout
        )
    );
    return ledgerState.total_merchants;
  }

  async getTotalSubscriptions(): Promise<bigint> {
    const ledgerState = await firstValueFrom(
      this.providers.publicDataProvider
        .contractStateObservable(this.deployedContractAddress, { type: 'all' })
        .pipe(
          map((contractState) => ledger(contractState.data)),
          timeout(10000) // 10 second timeout
        )
    );
    return ledgerState.total_subscriptions;
  }

  async getCurrentTimestamp(): Promise<bigint> {
    const ledgerState = await firstValueFrom(
      this.providers.publicDataProvider
        .contractStateObservable(this.deployedContractAddress, { type: 'all' })
        .pipe(
          map((contractState) => ledger(contractState.data)),
          timeout(10000) // 10 second timeout
        )
    );
    return ledgerState.current_timestamp;
  }

  // State queries implementation
  async getTransactionHistory(): Promise<DetailedPaymentTransaction[]> {
    const history = await this.getDetailedTransactionHistory();
    this.cachedTransactionHistory = history; // Update cache
    return history;
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

      // Execute the circuit - callTx handles context automatically
      const txData = await (this.deployedContract.callTx as any)[circuitName](...args);

      // Update private state if needed
      if (txData.privateState) {
        await this.providers.privateStateProvider.set(this.accountId, txData.privateState);
        this.privateStates$.next(txData.privateState);
      }

      // Emit transaction
      if (transaction) {
        this.transactions$.next({ transaction, cancelledTransaction: undefined });

        // Persist transaction to detailed log after successful execution
        const detailedTx = this.convertToDetailedTransaction(transaction);
        await this.appendDetailedLog(detailedTx);

        // Update cache after persistence
        await this.updateTransactionHistoryCache();
      }

      return txData;
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