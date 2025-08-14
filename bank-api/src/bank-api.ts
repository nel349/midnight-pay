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

  deposit(pin: string, amount: string): Promise<void>;
  withdraw(pin: string, amount: string): Promise<void>;
  transferToUser(pin: string, recipientUserId: string, amount: string): Promise<void>;
  authenticateBalanceAccess(pin: string): Promise<void>;
  verifyAccountStatus(pin: string): Promise<void>;
  getAuthorizedContacts(): Promise<Array<{ userId: string; maxAmount: bigint }>>;
  
  // Zelle-like Authorization System
  requestTransferAuthorization(pin: string, recipientUserId: string): Promise<void>;
  approveTransferAuthorization(pin: string, senderUserId: string, maxAmount: string): Promise<void>;
  sendToAuthorizedUser(pin: string, recipientUserId: string, amount: string): Promise<void>;
  claimAuthorizedTransfer(pin: string, senderUserId: string): Promise<void>;
  getPendingClaims(pin: string): Promise<Array<{ senderUserId: string; amount: bigint }>>
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
    const stateKey = this.accountId;
    const currentState = await this.providers.privateStateProvider.get(stateKey) ?? createBankPrivateState();
    
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
      userTransactionHistories: newUserHistories,
      pendingTransferAmounts: new Map(currentState.pendingTransferAmounts ?? new Map()),
    };
    
    // Persist and notify observers
    await this.providers.privateStateProvider.set(stateKey, updatedState);
    this.privateStates$.next(updatedState);
  }

  // Helper to ensure user exists in shared private state (for transfers)
  private async ensureUserInPrivateState(userId: string, pin: string, balance: bigint): Promise<void> {
    const stateKey = this.accountId;
    const currentState = await this.providers.privateStateProvider.get(stateKey) ?? createBankPrivateState();
    
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
      userTransactionHistories: newUserHistories,
      pendingTransferAmounts: new Map(currentState.pendingTransferAmounts ?? new Map()),
    };
    
    // Persist and notify observers
    await this.providers.privateStateProvider.set(stateKey, updatedState);
    this.privateStates$.next(updatedState);
  }

  // Helper to get current user balance from shared private state
  private async getCurrentUserBalance(): Promise<bigint> {
    const stateKey = this.accountId;
    const currentState = await this.providers.privateStateProvider.get(stateKey) ?? createBankPrivateState();
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
    const stateKey = this.accountId;
    const currentState = await this.providers.privateStateProvider.get(stateKey) ?? createBankPrivateState();
    this.privateStates$.next(currentState);
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
      // Ensure the user exists in shared private state before invoking witness-dependent circuit
      const startingBalance = await this.getCurrentUserBalance();
      await this.ensureUserInPrivateState(this.userId, pin, startingBalance);
      
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
      
      // Force refresh of private state for all observers (contract already updated it)
      await this.refreshSharedPrivateState();

      await this.appendDetailedLog({
        type: 'deposit',
        amount: utils.parseAmount(amount),
        balanceAfter: await this.getCurrentUserBalance(),
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
      // Ensure the user exists in shared private state before invoking witness-dependent circuit
      const startingBalance = await this.getCurrentUserBalance();
      await this.ensureUserInPrivateState(this.userId, pin, startingBalance);
      
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
      
      // Force refresh of private state for all observers (contract already updated it)
      await this.refreshSharedPrivateState();

      await this.appendDetailedLog({
        type: 'withdraw',
        amount: utils.parseAmount(amount),
        balanceAfter: await this.getCurrentUserBalance(),
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

    // Ensure user's private entry exists and reflects current balance
    await this.updateUserPrivateState(pin, balance);

    await this.appendDetailedLog({
      type: 'auth',
      balanceAfter: balance,
      timestamp: new Date(),
    });

    // Ensure subscribers get the latest shared private state snapshot
    await this.refreshSharedPrivateState();
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

  async getAuthorizedContacts(): Promise<Array<{ userId: string; maxAmount: bigint }>> {
    const state = await this.providers.publicDataProvider.queryContractState(this.deployedContractAddress);
    if (!state) return [];
    const l = ledger(state.data);
    const normalizedUserId = this.normalizeUserId(this.userId);
    const userIdBytes = this.stringToBytes32(normalizedUserId);
    if (!l.user_as_recipient_auths.member(userIdBytes)) return [];
    const authVector = l.user_as_recipient_auths.lookup(userIdBytes) as Uint8Array[];
    const isZeroBytes = (b: Uint8Array): boolean => b.every((x) => x === 0);
    const decoder = new TextDecoder();
    const contacts: Array<{ userId: string; maxAmount: bigint }> = [];
    for (const authId of authVector) {
      if (!authId || isZeroBytes(authId)) continue;
      if (!l.active_authorizations.member(authId)) continue;
      const auth = l.active_authorizations.lookup(authId);
      const senderId = decoder.decode(auth.sender_id).replace(/\0/g, '');
      const max = BigInt(auth.max_amount);
      contacts.push({ userId: senderId, maxAmount: max });
    }
    return contacts;
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
    
    // Ensure the sender exists in shared private state before invoking witness-dependent circuit
    const startingBalance = await this.getCurrentUserBalance();
    await this.ensureUserInPrivateState(this.userId, pin, startingBalance);
    
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
    
    // Force refresh of private state for all observers (contract already updated it)
    await this.refreshSharedPrivateState();

    await this.appendDetailedLog({
      type: 'auth_transfer',
      amount: utils.parseAmount(amount),
      balanceAfter: await this.getCurrentUserBalance(),
      timestamp: new Date(),
      counterparty: recipientUserId,
    });
  }

  async claimAuthorizedTransfer(pin: string, senderUserId: string): Promise<void> {
    this.logger?.info({ claimAuthorizedTransfer: { recipient: this.userId, sender: senderUserId } });
    
    const userIdBytes = this.stringToBytes32(this.userId);
    const normalizedSenderId = this.normalizeUserId(senderUserId);
    const senderIdBytes = this.stringToBytes32(normalizedSenderId);
    
    // Ensure the recipient exists in shared private state before invoking witness-dependent circuit
    const startingBalance = await this.getCurrentUserBalance();
    await this.ensureUserInPrivateState(this.userId, pin, startingBalance);
    
    const pinBytes = this.stringToBytes32(pin);
    const txData = await this.deployedContract.callTx.claim_authorized_transfer(
      userIdBytes,
      senderIdBytes,
      pinBytes
    );
    
    this.logger?.trace({
      transferClaimed: {
        recipient: this.userId,
        sender: senderUserId,
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
    
    // Force refresh of private state for all observers (contract already updated it)
    await this.refreshSharedPrivateState();
    const newBalance = await this.getCurrentUserBalance();
    const claimedAmount = newBalance > startingBalance ? (newBalance - startingBalance) : 0n;

    await this.appendDetailedLog({
      type: 'claim_transfer',
      amount: claimedAmount,
      balanceAfter: await this.getCurrentUserBalance(),
      timestamp: new Date(),
      counterparty: senderUserId,
    });
  }

  async getPendingClaims(pin: string): Promise<Array<{ senderUserId: string; amount: bigint }>> {
    const state = await this.providers.publicDataProvider.queryContractState(this.deployedContractAddress);
    if (!state) return [];
    
    const l = ledger(state.data);
    const normalizedUserId = this.normalizeUserId(this.userId);
    const userIdBytes = this.stringToBytes32(normalizedUserId);
    
    if (!l.user_as_recipient_auths.member(userIdBytes)) return [];
    
    const authVector = l.user_as_recipient_auths.lookup(userIdBytes) as Uint8Array[];
    const isZeroBytes = (b: Uint8Array): boolean => b.every((x) => x === 0);
    const decoder = new TextDecoder();
    const claims: Array<{ senderUserId: string; amount: bigint }> = [];
    
    for (const authId of authVector) {
      if (!authId || isZeroBytes(authId)) continue;
      if (!l.active_authorizations.member(authId)) continue;
      if (!l.encrypted_balances.member(authId)) continue;
      
      const auth = l.active_authorizations.lookup(authId);
      const encryptedAmount = l.encrypted_balances.lookup(authId);
      const senderId = decoder.decode(auth.sender_id).replace(/\0/g, '');

      // Resolve exact amount using public mapping written by contract
      if (l.encrypted_amount_mappings.member(encryptedAmount)) {
        const amt = BigInt(l.encrypted_amount_mappings.lookup(encryptedAmount));
        if (amt > 0n) {
          claims.push({ senderUserId: senderId, amount: amt });
        }
      }
    }
    
    return claims;
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
    providers: BankProviders,
    logger: Logger,
  ): Promise<ContractAddress> {
    logger.info({ deployBankContract: {} });
    // Deploys can occasionally fail transiently if the node/indexer/proof server
    // are not fully ready at the very start of the test run. Add a short
    // retry-with-backoff to make the tests more robust.
    const maxAttempts = 3;
    let lastError: unknown;
    let deployedBankContract: DeployedBankContract | undefined;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        deployedBankContract = await deployContract(providers, {
          privateStateId: 'deploy' as AccountId, // Neutral state for deployment
          contract: bankContract,
          initialPrivateState: createBankPrivateState(), // Empty initial state for this user
        });
        break;
      } catch (err) {
        lastError = err;
        const backoffMs = attempt === maxAttempts ? 0 : 1000 * Math.pow(2, attempt - 1);
        logger.warn({
          deployRetry: {
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
        finalizedDeployTxData: deployedBankContract.deployTxData.public,
      },
    });

    return deployedBankContract.deployTxData.public.contractAddress;
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

    // Normalize userId to ensure private state key matches any statically-seeded state
    const encoder = new TextEncoder();
    const encoded = encoder.encode(userId);
    const normalizedUserId = encoded.length <= 32 ? userId : new TextDecoder().decode(encoded.slice(0, 32));
    const stateKey = normalizedUserId as AccountId;

    // Preserve any existing private state for this user; don't overwrite with a fresh empty state
    const existingPrivateState = (await providers.privateStateProvider.get(stateKey)) ?? createBankPrivateState();
    const deployedBankContract = await findDeployedContract(providers, {
      contractAddress,
      contract: bankContract,
      privateStateId: stateKey, // Each user has their own private state (normalized)
      initialPrivateState: existingPrivateState,
    });

    logger.trace({
      bankContractSubscribed: {
        userId,
        finalizedDeployTxData: deployedBankContract.deployTxData.public,
      },
    });

    const bankAPI = new BankAPI(stateKey, userId, deployedBankContract, providers, logger);
    await bankAPI.syncUserToSharedState();
    
    return bankAPI;
  }

  // Create a user account before subscribing (user-scoped, no streams yet)
  static async createAccount(
    providers: BankProviders,
    contractAddress: ContractAddress,
    userId: string,
    pin: string,
    initialDeposit: string,
    logger: Logger,
  ): Promise<void> {
    const normalizedUserId = (() => {
      const enc = new TextEncoder();
      const bytes = enc.encode(userId);
      if (bytes.length <= 32) return userId;
      return new TextDecoder().decode(bytes.slice(0, 32));
    })();

    const userIdBytes = (() => {
      const out = new Uint8Array(32);
      const enc = new TextEncoder();
      const data = enc.encode(normalizedUserId);
      out.set(data.slice(0, Math.min(data.length, 32)));
      return out;
    })();
    const pinBytes = (() => {
      const out = new Uint8Array(32);
      const enc = new TextEncoder();
      const data = enc.encode(pin);
      out.set(data.slice(0, Math.min(data.length, 32)));
      return out;
    })();

    const deployed = await findDeployedContract(providers, {
      contractAddress,
      contract: bankContract,
      privateStateId: normalizedUserId as AccountId,
      initialPrivateState: createBankPrivateState(),
    });

    const txData = await deployed.callTx.create_account(
      userIdBytes,
      pinBytes,
      utils.parseAmount(initialDeposit),
    );

    logger?.trace({
      createAccount: {
        userId: normalizedUserId,
        initialDeposit,
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });

    // Seed private state for immediate UX
    const sharedKey = normalizedUserId as AccountId;
    const currentState = (await providers.privateStateProvider.get(sharedKey)) ?? createBankPrivateState();
    const pinHash = hashPin(pin);
    const newUserPinHashes = new Map(currentState.userPinHashes);
    const newUserBalances = new Map(currentState.userBalances);
    const newUserHistories = new Map(currentState.userTransactionHistories);
    newUserPinHashes.set(normalizedUserId, pinHash);
    newUserBalances.set(normalizedUserId, utils.parseAmount(initialDeposit));
    if (!newUserHistories.has(normalizedUserId)) {
      newUserHistories.set(normalizedUserId, Array(10).fill(new Uint8Array(32)));
    }
    await providers.privateStateProvider.set(sharedKey, {
      userPinHashes: newUserPinHashes,
      userBalances: newUserBalances,
      userTransactionHistories: newUserHistories,
      pendingTransferAmounts: new Map(currentState.pendingTransferAmounts ?? new Map()),
    });

    // Write initial detailed log entry for account creation under the same normalized key
    try {
      const dlogKey = `${normalizedUserId}:dlog` as AccountId;
      const existingLog = (await providers.privateStateProvider.get(dlogKey)) as unknown as DetailedTransaction[] | null;
      const updatedLog: DetailedTransaction[] = [...(existingLog ?? []), {
        type: 'create',
        amount: utils.parseAmount(initialDeposit),
        balanceAfter: utils.parseAmount(initialDeposit),
        timestamp: new Date(),
      }];
      await providers.privateStateProvider.set(dlogKey, updatedLog as unknown as BankPrivateState);
    } catch {}
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