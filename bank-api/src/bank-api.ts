import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { type Logger } from 'pino';
import {
  type BankContract,
  type BankDerivedState,
  type BankProviders,
  type DeployedBankContract,
  emptyBankState,
  type UserAction,
  type AccountId,
  ACCOUNT_STATE
} from './common-types.js';
import {
  type BankPrivateState,
  Contract,
  createBankPrivateState,
  ledger,
  pureCircuits,
  bankWitnesses,
  TransactionType,
  hashPin,
} from '@midnight-bank/bank-contract';
import * as utils from './utils/index.js';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { combineLatest, concat, defer, firstValueFrom, from, map, type Observable, of, retry, scan, Subject } from 'rxjs';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';
import type { PrivateStateProvider } from '@midnight-ntwrk/midnight-js-types/dist/private-state-provider';
import type { DetailedTransaction } from './common-types.js';

const bankContract: BankContract = new Contract(bankWitnesses);

export interface DeployedBankAPI {
  readonly deployedContractAddress: ContractAddress;
  readonly state$: Observable<BankDerivedState>;
  readonly userId: string;

  createAccount(userId: string, pin: string, initialDeposit: string): Promise<void>;
  deposit(pin: string, amount: string): Promise<void>;
  withdraw(pin: string, amount: string): Promise<void>;
  transferToUser(pin: string, recipientUserId: string, amount: string): Promise<void>;
  authenticateBalanceAccess(pin: string): Promise<void>;
  verifyAccountStatus(pin: string): Promise<void>;
  
  // Zelle-like Authorization System
  requestTransferAuthorization(pin: string, recipientUserId: string): Promise<void>;
  approveTransferAuthorization(pin: string, senderUserId: string, maxAmount: string): Promise<void>;
  sendToAuthorizedUser(pin: string, recipientUserId: string, amount: string): Promise<void>;
}

export class BankAPI implements DeployedBankAPI {
  private constructor(
    public readonly accountId: AccountId,
    public readonly userId: string, // User ID for shared contract
    public readonly deployedContract: DeployedBankContract,
    public readonly providers: BankProviders,
    private readonly logger: Logger,
  ) {
    const combine = (acc: BankDerivedState, value: BankDerivedState): BankDerivedState => {
      return {
        accountExists: value.accountExists,
        accountOwner: value.accountOwner ?? acc.accountOwner,
        accountStatus: value.accountStatus,
        transactionCount: value.transactionCount,
        lastTransactionHash: value.lastTransactionHash,
        whoami: value.whoami,
        balance: value.balance ?? acc.balance,
        transactionHistory: value.transactionHistory ?? acc.transactionHistory,
        lastTransaction: value.lastTransaction,
        lastCancelledTransaction: value.lastCancelledTransaction,
      };
    };

    this.deployedContractAddress = deployedContract.deployTxData.public.contractAddress;
    this.transactions$ = new Subject<UserAction>();
    this.privateStates$ = new Subject<BankPrivateState>();
    this.state$ = combineLatest(
      [
        providers.publicDataProvider
          .contractStateObservable(this.deployedContractAddress, { type: 'all' })
          .pipe(map((contractState) => ledger(contractState.data))),
        concat(
          from(defer(() => providers.privateStateProvider.get(this.accountId) as Promise<BankPrivateState>)),
          this.privateStates$,
        ),
        concat(of<UserAction>({ transaction: undefined, cancelledTransaction: undefined }), this.transactions$),
      ],
      (ledgerState, privateState, userActions) => {
        // For shared contract: check if this user has an account
        const normalizedUserId = this.normalizeUserId(this.userId);
        const userIdBytes = this.stringToBytes32(normalizedUserId);
        const accountExists = ledgerState.all_accounts.member(userIdBytes);
        const userAccount = accountExists ? ledgerState.all_accounts.lookup(userIdBytes) : undefined;
        
        // Get user-specific private data (use normalized userId)
        const userBalance = privateState.userBalances.get(normalizedUserId) ?? 0n;
        const userPinHash = privateState.userPinHashes.get(normalizedUserId) ?? new Uint8Array(32);
        const userTxHistory = privateState.userTransactionHistories.get(normalizedUserId) ?? [];
        
        // Debug logging
        if (userBalance === 0n && accountExists) {
          console.log(`DEBUG: User ${this.userId} has account but balance is 0. Private state users:`, Array.from(privateState.userBalances.keys()));
          console.log(`DEBUG: Private state balances:`, Object.fromEntries(privateState.userBalances));
        }
        
        const whoami = pureCircuits.public_key ? pureCircuits.public_key(userPinHash) : new Uint8Array(32);
        const result: BankDerivedState = {
          accountExists,
          accountOwner: userAccount?.owner_hash ? toHex(userAccount.owner_hash) : undefined,
          accountStatus: userAccount ? this.mapAccountStatus(userAccount.status) : ACCOUNT_STATE.inactive,
          transactionCount: userAccount?.transaction_count ?? 0n,
          lastTransactionHash: userAccount ? toHex(userAccount.last_transaction) : '',
          whoami: toHex(whoami),
          balance: userBalance,
          transactionHistory: userTxHistory,
          lastTransaction: userActions.transaction,
          lastCancelledTransaction: userActions.cancelledTransaction,
        };
        return result;
      },
    ).pipe(
      scan(combine, emptyBankState),
      retry({
        delay: 500,
      }),
    );

    // Build convenience observable for hex-encoded history
    this.transactionHistoryHex$ = this.state$.pipe(map((s) => s.transactionHistory.map(toHex)));
    this.detailedLogKey = `${this.accountId}:dlog`;
  }

  readonly deployedContractAddress: ContractAddress;

  readonly state$: Observable<BankDerivedState>;

  readonly transactions$: Subject<UserAction>;

  readonly privateStates$: Subject<BankPrivateState>;

  // Convenience stream of transaction history as hex-encoded strings
  readonly transactionHistoryHex$!: Observable<string[]>;

  // Client-owned detailed log key
  private readonly detailedLogKey: string = '';

  // Helper to convert string to Bytes<32> for shared contract
  private stringToBytes32(str: string): Uint8Array {
    const bytes = new Uint8Array(32);
    const encoder = new TextEncoder();
    const encoded = encoder.encode(str);
    bytes.set(encoded.slice(0, Math.min(encoded.length, 32)));
    return bytes;
  }

  // Helper to ensure consistent userId handling (truncated to 32 bytes)
  private normalizeUserId(userId: string): string {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(userId);
    if (encoded.length <= 32) {
      return userId;
    }
    // Truncate to 32 bytes and decode back to string
    const truncated = encoded.slice(0, 32);
    return new TextDecoder().decode(truncated);
  }

  // Helper to update user-specific private state in shared contract
  private async updateUserPrivateState(pin: string, newBalance: bigint): Promise<void> {
    const sharedStateKey = 'shared-bank-contract' as AccountId;
    const currentState = await this.providers.privateStateProvider.get(sharedStateKey) ?? createBankPrivateState();
    
    // Update this user's data in the shared private state
    const normalizedUserId = this.normalizeUserId(this.userId);
    const pinHash = hashPin(pin);
    const newUserPinHashes = new Map(currentState.userPinHashes);
    const newUserBalances = new Map(currentState.userBalances);
    const newUserHistories = new Map(currentState.userTransactionHistories);
    
    newUserPinHashes.set(normalizedUserId, pinHash);
    newUserBalances.set(normalizedUserId, newBalance);
    
    // Only update transaction history if user doesn't have one yet
    if (!newUserHistories.has(normalizedUserId)) {
      newUserHistories.set(normalizedUserId, Array(10).fill(new Uint8Array(32)));
    }
    
    const updatedState: BankPrivateState = {
      userPinHashes: newUserPinHashes,
      userBalances: newUserBalances,
      userTransactionHistories: newUserHistories
    };
    
    // Persist and notify observers
    await this.providers.privateStateProvider.set(sharedStateKey, updatedState);
    this.privateStates$.next(updatedState);
  }

  // Helper to ensure user exists in shared private state (for transfers)
  private async ensureUserInPrivateState(userId: string, pin: string, balance: bigint): Promise<void> {
    const sharedStateKey = 'shared-bank-contract' as AccountId;
    const currentState = await this.providers.privateStateProvider.get(sharedStateKey) ?? createBankPrivateState();
    
    const normalizedUserId = this.normalizeUserId(userId);
    console.log(`DEBUG: ensureUserInPrivateState called for ${userId} (normalized: ${normalizedUserId}) with balance ${balance}`);
    console.log(`DEBUG: Current state has users:`, Array.from(currentState.userBalances.keys()));
    
    // Check if user already exists
    if (currentState.userBalances.has(normalizedUserId)) {
      console.log(`DEBUG: User ${normalizedUserId} already exists in private state`);
      return; // User already exists, nothing to do
    }
    
    // Add the user to shared private state
    const pinHash = hashPin(pin);
    const newUserPinHashes = new Map(currentState.userPinHashes);
    const newUserBalances = new Map(currentState.userBalances);
    const newUserHistories = new Map(currentState.userTransactionHistories);
    
    newUserPinHashes.set(normalizedUserId, pinHash);
    newUserBalances.set(normalizedUserId, balance);
    newUserHistories.set(normalizedUserId, Array(10).fill(new Uint8Array(32)));
    
    const updatedState: BankPrivateState = {
      userPinHashes: newUserPinHashes,
      userBalances: newUserBalances,
      userTransactionHistories: newUserHistories
    };
    
    // Persist and notify observers
    await this.providers.privateStateProvider.set(sharedStateKey, updatedState);
    this.privateStates$.next(updatedState);
  }

  // Helper to get current user balance from shared private state
  private async getCurrentUserBalance(): Promise<bigint> {
    const sharedStateKey = 'shared-bank-contract' as AccountId;
    const currentState = await this.providers.privateStateProvider.get(sharedStateKey) ?? createBankPrivateState();
    const normalizedUserId = this.normalizeUserId(this.userId);
    return currentState.userBalances.get(normalizedUserId) ?? 0n;
  }

  // Sync user data to shared private state (called when subscribing)
  private async syncUserToSharedState(): Promise<void> {
    try {
      // Check if this user has an account on the shared contract
      const normalizedUserId = this.normalizeUserId(this.userId);
      const userIdBytes = this.stringToBytes32(normalizedUserId);
      const state = await this.providers.publicDataProvider.queryContractState(this.deployedContractAddress);
      
      if (!state) return; // Contract doesn't exist yet
      
      const ledgerState = ledger(state.data);
      const userHasAccount = ledgerState.all_accounts.member(userIdBytes);
      
      if (!userHasAccount) return; // User doesn't have an account yet
      
      // Check if user is already in shared private state
      const sharedStateKey = 'shared-bank-contract' as AccountId;
      const currentPrivateState = await this.providers.privateStateProvider.get(sharedStateKey) ?? createBankPrivateState();
      
      if (currentPrivateState.userBalances.has(normalizedUserId)) {
        return; // User already in private state
      }
      
      // User has account but not in private state - this happens when:
      // 1. User created account in a different session
      // 2. User is subscribing to existing contract
      
      // We need to initialize with default values - the actual balance will be synced during operations
      // Note: We can't know the actual PIN hash or balance from public state (that's the point of privacy!)
      // The user will need to perform an operation (like authenticate) to sync their private data
      
      this.logger?.info({ syncUserToSharedState: { userId: this.userId, message: 'User has account but not in private state - will sync on first operation' } });
      
    } catch (error) {
      this.logger?.warn({ syncUserToSharedState: { userId: this.userId, error: error instanceof Error ? error.message : 'Unknown error' } });
      // Don't throw - this is a best-effort sync
    }
  }

  // Force refresh of shared private state for all observers
  private async refreshSharedPrivateState(): Promise<void> {
    const sharedStateKey = 'shared-bank-contract' as AccountId;
    const currentState = await this.providers.privateStateProvider.get(sharedStateKey) ?? createBankPrivateState();
    this.privateStates$.next(currentState);
  }

  async createAccount(userId: string, pin: string, initialDeposit: string): Promise<void> {
    this.logger?.info({
      event: 'createAccount',
      userId: userId,
      initialDeposit: initialDeposit.toString(),
    });
    this.transactions$.next({
      transaction: {
        type: TransactionType.ACCOUNT_CREATED,
        amount: utils.parseAmount(initialDeposit),
        timestamp: new Date(),
        pin,
      },
      cancelledTransaction: undefined,
    });

    try {
      const normalizedUserId = this.normalizeUserId(userId);
      const userIdBytes = this.stringToBytes32(normalizedUserId);
      const pinBytes = this.stringToBytes32(pin);
      
      const txData = await this.deployedContract.callTx.create_account(userIdBytes, pinBytes, utils.parseAmount(initialDeposit));
      this.logger?.trace({
        accountCreated: {
          userId: userId,
          initialDeposit,
          txHash: txData.public.txHash,
          blockHeight: txData.public.blockHeight,
        },
      });

      // Add user to shared private state
      await this.ensureUserInPrivateState(userId, pin, utils.parseAmount(initialDeposit));
      
      await this.refreshSharedPrivateState();
    } catch (error) {
      this.logger?.error(error, `createAccount failed for ${userId}`);
      throw error;
    }
  }


  async deposit(pin: string, amount: string): Promise<void> {
    this.logger?.info({ deposit: { userId: this.userId, amount } });
    this.transactions$.next({
      transaction: {
        type: TransactionType.DEPOSIT,
        amount: utils.parseAmount(amount),
        timestamp: new Date(),
        pin,
      },
      cancelledTransaction: undefined,
    });

    try {
      const normalizedUserId = this.normalizeUserId(this.userId);
      const userIdBytes = this.stringToBytes32(normalizedUserId);
      const pinBytes = this.stringToBytes32(pin);
      
      const txData = await this.deployedContract.callTx.deposit(
        userIdBytes,
        pinBytes,
        utils.parseAmount(amount)
      );
      this.logger?.trace({
        depositMade: {
          userId: this.userId,
          amount,
          txHash: txData.public.txHash,
          blockHeight: txData.public.blockHeight,
        },
      });
      
      // Get current user balance and update
      const currentBalance = await this.getCurrentUserBalance();
      const newBalance = currentBalance + utils.parseAmount(amount);
      await this.updateUserPrivateState(pin, newBalance);
      
      // Force refresh of private state for all observers
      await this.refreshSharedPrivateState();
      
      await this.appendDetailedLog({
        type: 'deposit',
        amount: utils.parseAmount(amount),
        balanceAfter: newBalance,
        timestamp: new Date(),
      });
    } catch (e) {
      this.transactions$.next({
        cancelledTransaction: {
          type: TransactionType.DEPOSIT,
          amount: utils.parseAmount(amount),
          timestamp: new Date(),
          pin,
        },
        transaction: undefined,
      });
      throw e;
    }
  }

  async withdraw(pin: string, amount: string): Promise<void> {
    this.logger?.info({ withdraw: { userId: this.userId, amount } });
    this.transactions$.next({
      transaction: {
        type: TransactionType.WITHDRAWAL,
        amount: utils.parseAmount(amount),
        timestamp: new Date(),
        pin,
      },
      cancelledTransaction: undefined,
    });

    try {
      const normalizedUserId = this.normalizeUserId(this.userId);
      const userIdBytes = this.stringToBytes32(normalizedUserId);
      const pinBytes = this.stringToBytes32(pin);
      
      const txData = await this.deployedContract.callTx.withdraw(
        userIdBytes,
        pinBytes,
        utils.parseAmount(amount)
      );
      this.logger?.trace({
        withdrawalMade: {
          userId: this.userId,
          amount,
          txHash: txData.public.txHash,
          blockHeight: txData.public.blockHeight,
        },
      });
      
      // Get current user balance and update
      const currentBalance = await this.getCurrentUserBalance();
      const newBalance = currentBalance - utils.parseAmount(amount);
      await this.updateUserPrivateState(pin, newBalance);
      
      // Force refresh of private state for all observers
      await this.refreshSharedPrivateState();
      
      await this.appendDetailedLog({
        type: 'withdraw',
        amount: utils.parseAmount(amount),
        balanceAfter: newBalance,
        timestamp: new Date(),
      });
    } catch (e) {
      this.transactions$.next({
        cancelledTransaction: {
          type: TransactionType.WITHDRAWAL,
          amount: utils.parseAmount(amount),
          timestamp: new Date(),
          pin,
        },
        transaction: undefined,
      });
      throw e;
    }
  }

  async transferToUser(pin: string, recipientUserId: string, amount: string): Promise<void> {
    // Legacy method - now uses the authorization system
    // For compatibility, this method will attempt to send to an authorized user
    // If no authorization exists, it will throw an error with a helpful message
    this.logger?.info({ transferToUser: { sender: this.userId, recipient: recipientUserId, amount, note: 'Using authorization system' } });
    
    try {
      await this.sendToAuthorizedUser(pin, recipientUserId, amount);
    } catch (error) {
      // If the error is about no authorization, provide a helpful message
      if (error instanceof Error && error.message.includes('No authorization')) {
        throw new Error(
          `Transfer failed: No authorization exists. Please use the authorization system: ` +
          `1) Call requestTransferAuthorization() to request permission, ` +
          `2) Wait for recipient to call approveTransferAuthorization(), ` +
          `3) Then use sendToAuthorizedUser() for transfers.`
        );
      }
      throw error;
    }
  }

  async authenticateBalanceAccess(pin: string): Promise<void> {
    this.logger?.info({ authenticateBalanceAccess: { userId: this.userId } });
    
    const userIdBytes = this.stringToBytes32(this.userId);
    const pinBytes = this.stringToBytes32(pin);
    
    const txData = await this.deployedContract.callTx.authenticate_balance_access(
      userIdBytes,
      pinBytes
    );
        
    this.logger?.trace({
      balanceAccessAuthenticated: {
        userId: this.userId,
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });

    const balance = await this.getCurrentUserBalance();
    this.logger?.info(`balanceAccessAuthenticated for ${this.userId}: ${balance}`);
    
    await this.appendDetailedLog({
      type: 'auth',
      balanceAfter: balance,
      timestamp: new Date(),
    });
  }

  async verifyAccountStatus(pin: string): Promise<void> {
    this.logger?.info({ verifyAccountStatus: { userId: this.userId } });
    
    const userIdBytes = this.stringToBytes32(this.userId);
    const pinBytes = this.stringToBytes32(pin);
    
    const txData = await this.deployedContract.callTx.verify_account_status(
      userIdBytes,
      pinBytes
    );
    this.logger?.trace({
      accountStatusVerified: {
        userId: this.userId,
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
    
    const balance = await this.getCurrentUserBalance();
    await this.appendDetailedLog({
      type: 'verify',
      balanceAfter: balance,
      timestamp: new Date(),
    });
  }

  async requestTransferAuthorization(pin: string, recipientUserId: string): Promise<void> {
    this.logger?.info({ requestTransferAuthorization: { sender: this.userId, recipient: recipientUserId } });
    
    const userIdBytes = this.stringToBytes32(this.userId);
    const normalizedRecipientId = this.normalizeUserId(recipientUserId);
    const recipientIdBytes = this.stringToBytes32(normalizedRecipientId);
    const pinBytes = this.stringToBytes32(pin);
    
    const txData = await this.deployedContract.callTx.request_transfer_authorization(
      userIdBytes,
      recipientIdBytes,
      pinBytes
    );
    
    this.logger?.trace({
      authorizationRequested: {
        sender: this.userId,
        recipient: recipientUserId,
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
    
    const balance = await this.getCurrentUserBalance();
    await this.appendDetailedLog({
      type: 'auth_request',
      balanceAfter: balance,
      timestamp: new Date(),
      counterparty: recipientUserId,
    });
  }

  async approveTransferAuthorization(pin: string, senderUserId: string, maxAmount: string): Promise<void> {
    this.logger?.info({ approveTransferAuthorization: { recipient: this.userId, sender: senderUserId, maxAmount } });
    
    const normalizedUserId = this.normalizeUserId(this.userId);
    const userIdBytes = this.stringToBytes32(normalizedUserId);
    const normalizedSenderId = this.normalizeUserId(senderUserId);
    const senderIdBytes = this.stringToBytes32(normalizedSenderId);
    const pinBytes = this.stringToBytes32(pin);
    
    const txData = await this.deployedContract.callTx.approve_transfer_authorization(
      userIdBytes,
      senderIdBytes,
      pinBytes,
      utils.parseAmount(maxAmount)
    );
    
    this.logger?.trace({
      authorizationApproved: {
        recipient: this.userId,
        sender: senderUserId,
        maxAmount,
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
    
    const balance = await this.getCurrentUserBalance();
    await this.appendDetailedLog({
      type: 'auth_approve',
      balanceAfter: balance,
      timestamp: new Date(),
      counterparty: senderUserId,
      maxAmount: utils.parseAmount(maxAmount),
    });
  }

  async sendToAuthorizedUser(pin: string, recipientUserId: string, amount: string): Promise<void> {
    this.logger?.info({ sendToAuthorizedUser: { sender: this.userId, recipient: recipientUserId, amount } });
    
    const userIdBytes = this.stringToBytes32(this.userId);
    const normalizedRecipientId = this.normalizeUserId(recipientUserId);
    const recipientIdBytes = this.stringToBytes32(normalizedRecipientId);
    const pinBytes = this.stringToBytes32(pin);
    
    const txData = await this.deployedContract.callTx.send_to_authorized_user(
      userIdBytes,
      recipientIdBytes,
      utils.parseAmount(amount),
      pinBytes
    );
    
    this.logger?.trace({
      authorizedTransferSent: {
        sender: this.userId,
        recipient: recipientUserId,
        amount,
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
    
    // Update sender's balance in shared private state
    const currentSenderBalance = await this.getCurrentUserBalance();
    const newSenderBalance = currentSenderBalance - utils.parseAmount(amount);
    await this.updateUserPrivateState(pin, newSenderBalance);
    
    // Force refresh of private state for all observers
    await this.refreshSharedPrivateState();
    
    await this.appendDetailedLog({
      type: 'auth_transfer',
      amount: utils.parseAmount(amount),
      balanceAfter: newSenderBalance,
      timestamp: new Date(),
      counterparty: recipientUserId,
    });
  }

  async getTransactionHistoryHex(): Promise<string[]> {
    return await firstValueFrom(this.transactionHistoryHex$);
  }

  // Client-owned detailed log (persisted via privateStateProvider)
  async getDetailedTransactionHistory(): Promise<DetailedTransaction[]> {
    const raw = await this.providers.privateStateProvider.get(this.detailedLogKey as unknown as AccountId);
    return (raw as unknown as DetailedTransaction[]) ?? [];
  }

  private async appendDetailedLog(entry: DetailedTransaction): Promise<void> {
    try {
      const current = await this.getDetailedTransactionHistory();
      const updated = [...current, entry].slice(-100);
      await this.providers.privateStateProvider.set(
        this.detailedLogKey as unknown as AccountId,
        updated as unknown as BankPrivateState,
      );
    } catch {}
  }


  static async deploy(
    userId: string,
    providers: BankProviders,
    logger: Logger,
  ): Promise<BankAPI> {
    logger.info({
      deployBankContract: {
        userId,
      },
    });
    // Deploys can occasionally fail transiently if the node/indexer/proof server
    // are not fully ready at the very start of the test run. Add a short
    // retry-with-backoff to make the tests more robust.
    const maxAttempts = 3;
    let lastError: unknown;
    let deployedBankContract: DeployedBankContract | undefined;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        deployedBankContract = await deployContract(providers, {
          privateStateId: userId as AccountId, // Each user has their own private state
          contract: bankContract,
          initialPrivateState: createBankPrivateState(), // Empty initial state for this user
        });
        break;
      } catch (err) {
        lastError = err;
        const backoffMs = attempt === maxAttempts ? 0 : 1000 * Math.pow(2, attempt - 1);
        logger.warn({
          deployRetry: {
            userId,
            attempt,
            maxAttempts,
            backoffMs,
            error: err instanceof Error ? err.message : 'unknown error',
          },
        });
        if (backoffMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }
      }
    }
    if (deployedBankContract === undefined) {
      throw lastError instanceof Error ? lastError : new Error('Unknown deploy error');
    }

    logger.trace({
      bankContractDeployed: {
        userId,
        finalizedDeployTxData: deployedBankContract.deployTxData.public,
      },
    });

    return new BankAPI(userId as AccountId, userId, deployedBankContract, providers, logger);
  }

  static async subscribe(
    userId: string,
    providers: BankProviders,
    contractAddress: ContractAddress,
    logger: Logger,
  ): Promise<BankAPI> {
    logger.info({
      subscribeBankContract: {
        userId,
        contractAddress,
      },
    });

    const deployedBankContract = await findDeployedContract(providers, {
      contractAddress,
      contract: bankContract,
      privateStateId: userId as AccountId, // Each user has their own private state
      initialPrivateState: createBankPrivateState(), // Empty initial state for this user
    });

    logger.trace({
      bankContractSubscribed: {
        userId,
        finalizedDeployTxData: deployedBankContract.deployTxData.public,
      },
    });

    const bankAPI = new BankAPI(userId as AccountId, userId, deployedBankContract, providers, logger);
    
    // When subscribing, ensure this user is in the shared private state
    // This is important for transfers where the contract needs access to all user balances
    await bankAPI.syncUserToSharedState();
    
    return bankAPI;
  }

  static async getSharedPrivateState(
    contractAddress: ContractAddress,
    privateStateProvider: PrivateStateProvider<AccountId, BankPrivateState>,
  ): Promise<BankPrivateState> {
    // Use consistent shared private state key for all users of this contract
    const sharedStateKey = 'shared-bank-contract' as AccountId;
    let state = await privateStateProvider.get(sharedStateKey);
    if (state === null) {
      state = createBankPrivateState(); // Empty shared state
      await privateStateProvider.set(sharedStateKey, state);
    }
    return state;
  }

  static async contractExists(providers: BankProviders, contractAddress: ContractAddress): Promise<boolean> {
    try {
      const state = await providers.publicDataProvider.queryContractState(contractAddress);
      if (state === null) {
        return false;
      }
      void ledger(state.data); // try to parse it
      return true;
    } catch (e) {
      return false;
    }
  }

  static async userHasAccount(providers: BankProviders, contractAddress: ContractAddress, userId: string): Promise<boolean> {
    try {
      const state = await providers.publicDataProvider.queryContractState(contractAddress);
      if (state === null) {
        return false;
      }
      const ledgerState = ledger(state.data);
      const userIdBytes = new Uint8Array(32);
      const encoder = new TextEncoder();
      const encoded = encoder.encode(userId);
      userIdBytes.set(encoded.slice(0, Math.min(encoded.length, 32)));
      return ledgerState.all_accounts.member(userIdBytes);
    } catch (e) {
      return false;
    }
  }

  private mapAccountStatus(statusBytes: Uint8Array): ACCOUNT_STATE {
    try {
      const decoder = new TextDecoder();
      const status = decoder.decode(statusBytes).replace(/\0/g, '');
      switch (status) {
        case 'active': return ACCOUNT_STATE.active;
        case 'verified': return ACCOUNT_STATE.verified;
        case 'suspended': return ACCOUNT_STATE.suspended;
        default: return ACCOUNT_STATE.inactive;
      }
    } catch {
      return ACCOUNT_STATE.inactive;
    }
  }
}

export * as utils from './utils/index.js';
export * from './common-types.js';