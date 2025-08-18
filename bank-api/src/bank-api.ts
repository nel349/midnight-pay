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
  getTokenBalance(pin: string): Promise<void>;
  verifyAccountStatus(pin: string): Promise<void>;
  getAuthorizedContacts(): Promise<Array<{ userId: string; maxAmount: bigint }>>;
  getIncomingAuthorizations(): Promise<Array<{ userId: string; maxAmount: bigint }>>;
  
  // Zelle-like Authorization System
  requestTransferAuthorization(pin: string, recipientUserId: string): Promise<void>;
  approveTransferAuthorization(pin: string, senderUserId: string, maxAmount: string): Promise<void>;
  sendToAuthorizedUser(pin: string, recipientUserId: string, amount: string): Promise<void>;
  claimAuthorizedTransfer(pin: string, senderUserId: string): Promise<void>;
  getPendingClaims(pin: string): Promise<Array<{ senderUserId: string; amount: bigint }>>;
  
  // Selective Balance Disclosure System (NEW!)
  grantDisclosurePermission(pin: string, requesterId: string, permissionType: 'threshold' | 'exact', thresholdAmount: string, expiresInHours: number): Promise<void>;
  grantDisclosurePermissionUntil(pin: string, requesterId: string, permissionType: 'threshold' | 'exact', thresholdAmount: string, expiresAt: Date): Promise<void>;
  verifyBalanceThreshold(pin: string, targetUserId: string, thresholdAmount: string): Promise<boolean>;
  getDisclosedBalance(pin: string, targetUserId: string): Promise<bigint>;
  getDisclosurePermissions(pin: string): Promise<Array<{ requesterId: string; permissionType: 'threshold' | 'exact'; thresholdAmount: bigint; expiresAt: Date | null }>>;
  revokeDisclosurePermission(pin: string, requesterId: string): Promise<void>;
  
  // Real-time communication methods
  getPendingAuthRequests(): Promise<Array<{ senderUserId: string; requestedAt: number }>>;
  getOutgoingAuthRequests(): Promise<Array<{ recipientUserId: string; requestedAt: number; status: number }>>
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
        
        // Get user-specific data
        // Token balance is now encrypted and private - cannot be read directly from ledger
        // Balance will be null until user authenticates with PIN via get_token_balance circuit
        let userTokenBalance: bigint | null = null;
        
        // If user has authenticated (PIN hash exists), calculate balance from transaction history
        const userPinHash = privateState.userPinHashes.get(normalizedUserId) ?? new Uint8Array(32);
        const hasAuthenticated = privateState.userPinHashes.has(normalizedUserId);
        
        if (hasAuthenticated && accountExists) {
          // Calculate balance from transaction history since user has authenticated
          const history = this.getDetailedTransactionHistorySync();
          let balance = 0n;
          
          for (const tx of history) {
            switch (tx.type) {
              case 'create':
              case 'deposit':
                balance += BigInt(tx.amount || 0);
                break;
              case 'withdraw':
              case 'auth_transfer':
                balance -= BigInt(tx.amount || 0);
                break;
              case 'claim_transfer':
                balance += BigInt(tx.amount || 0);
                break;
            }
          }
          
          userTokenBalance = balance;
        }
        
        // Debug logging
        if (accountExists) {
          console.log(`DEBUG: User ${this.userId} has account with encrypted balance system.`);
        }
        
        const whoami = pureCircuits.public_key ? pureCircuits.public_key(userPinHash) : new Uint8Array(32);
        const result: BankDerivedState = {
          accountExists,
          accountOwner: userAccount?.owner_hash ? toHex(userAccount.owner_hash) : undefined,
          accountStatus: userAccount ? this.mapAccountStatus(userAccount.status) : ACCOUNT_STATE.inactive,
          transactionCount: userAccount?.transaction_count ?? 0n,
          lastTransactionHash: userAccount ? toHex(userAccount.last_transaction) : '',
          whoami: toHex(whoami),
          balance: userTokenBalance,
          transactionHistory: [], // Use getDetailedTransactionHistory() for transaction history
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

    this.detailedLogKey = `${this.accountId}:dlog`;
    
    // Initialize transaction history cache
    this.updateTransactionHistoryCache().catch(() => {
      // Ignore cache initialization errors
    });
  }

  readonly deployedContractAddress: ContractAddress;

  readonly state$: Observable<BankDerivedState>;

  readonly transactions$: Subject<UserAction>;

  readonly privateStates$: Subject<BankPrivateState>;


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

  // Helper to update user-specific private state in shared contract (for encrypted balance system)
  // Note: With encrypted balances, we don't store the actual balance in private state
  // Instead, we just ensure the user's PIN hash is available for authentication
  private async updateUserPrivateState(pin: string, newBalance: bigint): Promise<void> {
    const stateKey = this.accountId;
    const currentState = await this.providers.privateStateProvider.get(stateKey) ?? createBankPrivateState();
    
    // Update this user's PIN hash for authentication (balance is encrypted on-chain)
    const normalizedUserId = this.normalizeUserId(this.userId);
    const pinHash = hashPin(pin);
    const newUserPinHashes = new Map(currentState.userPinHashes);
    
    newUserPinHashes.set(normalizedUserId, pinHash);
    
    // Note: We don't store userBalances anymore since they're encrypted on-chain
    // The balance parameter is ignored in the encrypted system
    const updatedState: BankPrivateState = {
      userPinHashes: newUserPinHashes,
      userBalances: new Map(), // Empty - balances are encrypted on-chain
      pendingTransferAmounts: new Map(currentState.pendingTransferAmounts ?? new Map()),
    };
    
    // Persist and notify observers
    await this.providers.privateStateProvider.set(stateKey, updatedState);
    this.privateStates$.next(updatedState);
  }

  // Helper to ensure user exists in shared private state (for encrypted balance system)
  // Note: With encrypted balances, we only need to ensure the PIN hash is stored
  private async ensureUserInPrivateState(userId: string, pin: string, balance: bigint): Promise<void> {
    const stateKey = this.accountId;
    const currentState = await this.providers.privateStateProvider.get(stateKey) ?? createBankPrivateState();
    
    const normalizedUserId = this.normalizeUserId(userId);
    console.log(`DEBUG: ensureUserInPrivateState called for ${userId} (normalized: ${normalizedUserId})`);
    console.log(`DEBUG: Current state has users:`, Array.from(currentState.userPinHashes.keys()));
    
    // Check if user already has PIN hash stored
    if (currentState.userPinHashes.has(normalizedUserId)) {
      console.log(`DEBUG: User ${normalizedUserId} already exists in private state`);
      return; // User already exists, nothing to do
    }
    
    // Add the user's PIN hash to shared private state
    const pinHash = hashPin(pin);
    const newUserPinHashes = new Map(currentState.userPinHashes);
    
    newUserPinHashes.set(normalizedUserId, pinHash);
    
    // Note: We don't store userBalances since they're encrypted on-chain
    const updatedState: BankPrivateState = {
      userPinHashes: newUserPinHashes,
      userBalances: new Map(), // Empty - balances are encrypted on-chain
      pendingTransferAmounts: new Map(currentState.pendingTransferAmounts ?? new Map()),
    };
    
    // Persist and notify observers
    await this.providers.privateStateProvider.set(stateKey, updatedState);
    this.privateStates$.next(updatedState);
  }

  // Helper to get current user balance from encrypted balance system
  // Note: This cannot decrypt the actual balance without the user's PIN
  // This helper calculates balance from transaction history stored in detailed log
  private async getCurrentUserBalance(): Promise<bigint> {
    try {
      // Since balances are encrypted and we don't have the PIN here,
      // we calculate the balance from the transaction history
      const history = await this.getDetailedTransactionHistory();
      let balance = 0n;
      
      for (const tx of history) {
        switch (tx.type) {
          case 'create':
          case 'deposit':
            balance += BigInt(tx.amount || 0);
            break;
          case 'withdraw':
          case 'auth_transfer':
            balance -= BigInt(tx.amount || 0);
            break;
          case 'claim_transfer':
            balance += BigInt(tx.amount || 0);
            break;
        }
      }
      
      return balance;
    } catch (error) {
      // If we can't read transaction history, return 0
      // In a real app, we'd need the user to authenticate to get actual balance
      return 0n;
    }
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
      
      if (currentPrivateState.userPinHashes.has(normalizedUserId)) {
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

  async getTokenBalance(pin: string): Promise<void> {
    this.logger?.info({ authenticateBalanceAccess: { userId: this.userId } });
    
    const userIdBytes = this.stringToBytes32(this.userId);
    
    const pinBytes = this.stringToBytes32(pin);
    const txData = await this.deployedContract.callTx.get_token_balance(
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

    // Update user's private state with authenticated balance
    await this.updateUserPrivateState(pin, balance);

    await this.appendDetailedLog({
      type: 'auth',
      balanceAfter: balance,
      timestamp: new Date(),
    });

    // Force refresh of private state for all observers with the authenticated balance
    await this.refreshSharedPrivateState();
    
    // Emit a user action to trigger balance update in state observable
    this.transactions$.next({
      transaction: {
        type: TransactionType.DEPOSIT, // Use existing type for balance authentication
        amount: 0n, // No amount change for balance check
        timestamp: new Date(),
        pin,
      },
      cancelledTransaction: undefined,
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

  // this should be setting to a particular timestamp.
  async setContractTime(timestamp: number): Promise<void> {
    this.logger?.info({ setContractTime: { timestamp } });
    
    const txData = await this.deployedContract.callTx.set_timestamp(
      BigInt(timestamp)
    );
    
    this.logger?.trace({
      contractTimeSet: {
        timestamp,
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
  }

  async getAuthorizedContacts(): Promise<Array<{ userId: string; maxAmount: bigint }>> {
    // Return the list of RECIPIENTS that the current user (sender) is authorized to send to
    const state = await this.providers.publicDataProvider.queryContractState(this.deployedContractAddress);
    if (!state) return [];
    const l = ledger(state.data);
    const normalizedUserId = this.normalizeUserId(this.userId);
    const decoder = new TextDecoder();
    const isZeroBytes = (b: Uint8Array): boolean => b.every((x) => x === 0);

    const recipientToMax = new Map<string, bigint>();

    // Scan all recipient auth lists and collect auths where sender == current user
    for (const [recipientKey, authVector] of l.user_as_recipient_auths) {
      const recipientId = decoder.decode(recipientKey).replace(/\0/g, '');
      for (const authId of authVector as Uint8Array[]) {
        if (!authId || isZeroBytes(authId)) continue;
        if (!l.active_authorizations.member(authId)) continue;
        const auth = l.active_authorizations.lookup(authId);
        const senderId = decoder.decode(auth.sender_id).replace(/\0/g, '');
        if (senderId !== normalizedUserId) continue;
        
        // Only include transfer permissions (permission_type == 0), not disclosure permissions
        const permissionType = Number(auth.permission_type);
        if (permissionType !== 0) continue;
        
        const max = BigInt(auth.max_amount);
        const current = recipientToMax.get(recipientId) ?? 0n;
        if (max > current) recipientToMax.set(recipientId, max);
      }
    }

    return Array.from(recipientToMax.entries()).map(([userId, maxAmount]) => ({ userId, maxAmount }));
  }

  async getIncomingAuthorizations(): Promise<Array<{ userId: string; maxAmount: bigint }>> {
    // Return the list of SENDERS that are authorized to send to the current user (recipient)
    const state = await this.providers.publicDataProvider.queryContractState(this.deployedContractAddress);
    if (!state) return [];
    const l = ledger(state.data);
    const normalizedUserId = this.normalizeUserId(this.userId);
    const decoder = new TextDecoder();
    const isZeroBytes = (b: Uint8Array): boolean => b.every((x) => x === 0);

    const senderToMax = new Map<string, bigint>();

    // Look at current user's recipient auth list
    const userIdBytes = new TextEncoder().encode(normalizedUserId.padEnd(32, '\0'));
    if (!l.user_as_recipient_auths.member(userIdBytes)) return [];

    const authVector = l.user_as_recipient_auths.lookup(userIdBytes) as Uint8Array[];
    for (const authId of authVector) {
      if (!authId || isZeroBytes(authId)) continue;
      if (!l.active_authorizations.member(authId)) continue;
      const auth = l.active_authorizations.lookup(authId);
      
      // Only include transfer permissions (permission_type == 0), not disclosure permissions
      const permissionType = Number(auth.permission_type);
      if (permissionType !== 0) continue;
      
      const senderId = decoder.decode(auth.sender_id).replace(/\0/g, '');
      const max = BigInt(auth.max_amount);
      const current = senderToMax.get(senderId) ?? 0n;
      if (max > current) senderToMax.set(senderId, max);
    }

    return Array.from(senderToMax.entries()).map(([userId, maxAmount]) => ({ userId, maxAmount }));
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
    
    // Get the pending claim amount BEFORE claiming it
    const pendingClaims = await this.getPendingClaims();
    const claimForSender = pendingClaims.find(claim => this.normalizeUserId(claim.senderUserId) === normalizedSenderId);
    const expectedClaimAmount = claimForSender?.amount ?? 0n;
    
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
        claimedAmount: expectedClaimAmount,
      },
    });
    
    // Update the private state balance manually since the contract updated it
    const newBalance = startingBalance + expectedClaimAmount;
    await this.updateUserPrivateState(pin, newBalance);
    
    // Force refresh of private state for all observers 
    await this.refreshSharedPrivateState();

    await this.appendDetailedLog({
      type: 'claim_transfer',
      amount: expectedClaimAmount,
      balanceAfter: newBalance,
      timestamp: new Date(),
      counterparty: senderUserId,
    });
  }

  // Selective Balance Disclosure System (NEW!)
  async grantDisclosurePermissionUntil(pin: string, requesterId: string, permissionType: 'threshold' | 'exact', thresholdAmount: string, expiresAt: Date): Promise<void> {
    // Convert absolute date to relative seconds
    const now = new Date();
    const millisecondsFromNow = expiresAt.getTime() - now.getTime();
    
    if (millisecondsFromNow <= 0) {
      throw new Error('Expiration date must be in the future');
    }
    
    const secondsFromNow = Math.ceil(millisecondsFromNow / 1000);
    
    this.logger?.info({ 
      grantDisclosurePermissionUntil: { 
        grantor: this.userId, 
        requester: requesterId, 
        type: permissionType, 
        threshold: thresholdAmount, 
        expiresAt: expiresAt.toISOString(),
        calculatedSeconds: secondsFromNow 
      } 
    });
    
    // Call the existing relative-time method
    return this.grantDisclosurePermission(pin, requesterId, permissionType, thresholdAmount, secondsFromNow);
  }

  async grantDisclosurePermission(pin: string, requesterId: string, permissionType: 'threshold' | 'exact', thresholdAmount: string, expiresInSeconds: number): Promise<void> {
    this.logger?.info({ grantDisclosurePermission: { grantor: this.userId, requester: requesterId, type: permissionType, threshold: thresholdAmount, expires: expiresInSeconds } });
    
    const userIdBytes = this.stringToBytes32(this.userId);
    const normalizedRequesterId = this.normalizeUserId(requesterId);
    const requesterIdBytes = this.stringToBytes32(normalizedRequesterId);
    
    const permissionTypeValue = permissionType === 'threshold' ? 1 : 2; // 1=THRESHOLD_DISCLOSURE, 2=EXACT_DISCLOSURE
    
    console.log(`DEBUG: Granting disclosure permission:`);
    console.log(`  Grantor: ${this.userId} -> bytes: ${Array.from(userIdBytes).map(b => b.toString(16).padStart(2, '0')).join('')}`);
    console.log(`  Requester: ${normalizedRequesterId} -> bytes: ${Array.from(requesterIdBytes).map(b => b.toString(16).padStart(2, '0')).join('')}`);
    console.log(`  Permission type: ${permissionType} (${permissionTypeValue})`);
    console.log(`  Threshold amount: ${thresholdAmount} -> parsed: ${utils.parseAmount(thresholdAmount)}`);
    console.log(`  Expires in seconds: ${expiresInSeconds}`);
    
    const pinBytes = this.stringToBytes32(pin);
    const txData = await this.deployedContract.callTx.grant_disclosure_permission(
      userIdBytes,
      requesterIdBytes,
      pinBytes,
      BigInt(permissionTypeValue),
      utils.parseAmount(thresholdAmount),
      BigInt(expiresInSeconds)
    );
    
    this.logger?.info({
      disclosurePermissionGranted: {
        grantor: this.userId,
        requester: requesterId,
        permissionType: permissionType,
        thresholdAmount: thresholdAmount,
        expiresInSeconds: expiresInSeconds,
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
        success: true
      },
    });
    
    // Debug: Verify the permission was stored correctly in the ledger
    await this.verifyDisclosurePermissionStoredCorrectly(normalizedRequesterId);
  }
  
  // Helper method to verify disclosure permission was stored correctly
  private async verifyDisclosurePermissionStoredCorrectly(requesterId: string): Promise<void> {
    try {
      // Wait a moment for the transaction to be included
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const state = await this.providers.publicDataProvider.queryContractState(this.deployedContractAddress);
      if (!state) {
        console.log('DEBUG: Contract state not available for verification');
        return;
      }
      
      const l = ledger(state.data);
      const normalizedTargetId = this.normalizeUserId(this.userId); // grantor is the target
      const targetIdBytes = this.stringToBytes32(normalizedTargetId);
      const decoder = new TextDecoder();
      
      console.log(`DEBUG: Verifying disclosure permission storage:`);
      console.log(`  Target (grantor): ${normalizedTargetId}`);
      console.log(`  Requester: ${requesterId}`);
      
      // Check if target user has any recipient authorizations
      if (!l.user_as_recipient_auths.member(targetIdBytes)) {
        console.log('ERROR: Target user has no recipient authorizations after granting permission!');
        return;
      }
      
      const authVector = l.user_as_recipient_auths.lookup(targetIdBytes) as Uint8Array[];
      console.log(`DEBUG: Target has ${authVector.length} recipient authorizations`);
      
      // Look for the specific disclosure permission
      const isZeroBytes = (b: Uint8Array): boolean => b.every((x) => x === 0);
      let found = false;
      
      for (const authId of authVector) {
        if (!authId || isZeroBytes(authId)) continue;
        
        const authIdHex = Array.from(authId).map(b => b.toString(16).padStart(2, '0')).join('');
        console.log(`DEBUG: Checking auth ID: ${authIdHex}`);
        
        if (!l.active_authorizations.member(authId)) {
          console.log(`  - Auth ID not in active_authorizations`);
          continue;
        }
        
        const auth = l.active_authorizations.lookup(authId);
        const senderId = decoder.decode(auth.sender_id).replace(/\0/g, '');
        const permissionType = Number(auth.permission_type);
        const maxAmount = BigInt(auth.max_amount);
        const expiresAt = Number(auth.expires_at);
        
        console.log(`  - Sender: ${senderId}`);
        console.log(`  - Permission type: ${permissionType}`);
        console.log(`  - Max amount: ${maxAmount}`);
        console.log(`  - Expires at: ${expiresAt}`);
        
        if (senderId === requesterId && (permissionType === 1 || permissionType === 2)) {
          console.log(`  ✅ Found matching disclosure permission!`);
          
          // Check expiration
          const currentTimestamp = Number(l.current_timestamp);
          const isExpired = expiresAt !== 0 && currentTimestamp >= expiresAt;
          console.log(`  - Current timestamp: ${currentTimestamp}`);
          console.log(`  - Permission expires at: ${expiresAt} (0 = never)`);
          console.log(`  - Is expired: ${isExpired}`);
          
          if (isExpired) {
            console.log(`  ❌ Permission has expired!`);
            throw new Error('Disclosure permission has expired');
          }
          
          found = true;
          
          // Check shared balance access
          if (l.shared_balance_access.member(authId)) {
            console.log(`  ✅ Shared balance access exists for this auth ID`);
            const sharedEncrypted = l.shared_balance_access.lookup(authId);
            console.log(`  - Encrypted balance: ${Array.from(sharedEncrypted).map(b => b.toString(16).padStart(2, '0')).join('')}`);
          } else {
            console.log(`  ❌ No shared balance access for this auth ID`);
          }
        }
      }
      
      if (!found) {
        console.log(`ERROR: Could not find disclosure permission for requester ${requesterId}`);
      }
      
    } catch (error) {
      console.log('DEBUG: Error verifying disclosure permission storage:', error);
    }
  }

  async verifyBalanceThreshold(pin: string, targetUserId: string, thresholdAmount: string): Promise<boolean> {
    this.logger?.info({ verifyBalanceThreshold: { requester: this.userId, target: targetUserId, threshold: thresholdAmount } });
    
    try {
      const state = await this.providers.publicDataProvider.queryContractState(this.deployedContractAddress);
      if (!state) return false;
      
      const l = ledger(state.data);
      const normalizedTargetId = this.normalizeUserId(targetUserId);
      const targetIdBytes = this.stringToBytes32(normalizedTargetId);
      const normalizedRequesterId = this.normalizeUserId(this.userId);
      
      // Find the disclosure permission in user_as_recipient_auths for the target user
      if (!l.user_as_recipient_auths.member(targetIdBytes)) {
        this.logger?.warn({ disclosureDebug: { message: 'Target user has no recipient authorizations', target: targetUserId } });
        throw new Error('Target user has no recipient authorizations');
      }
      
      const authVector = l.user_as_recipient_auths.lookup(targetIdBytes) as Uint8Array[];
      const isZeroBytes = (b: Uint8Array): boolean => b.every((x) => x === 0);
      const decoder = new TextDecoder();
      
      let foundAuthId: Uint8Array | null = null;
      
      // Search through the target's authorizations to find our disclosure permission
      for (const authId of authVector) {
        if (!authId || isZeroBytes(authId)) continue;
        if (!l.active_authorizations.member(authId)) continue;
        
        const auth = l.active_authorizations.lookup(authId);
        const senderId = decoder.decode(auth.sender_id).replace(/\0/g, '');
        const permissionType = Number(auth.permission_type);
        
      // Check if this is our disclosure permission (sender matches requester and it's threshold(1) or exact(2))
        if (senderId === normalizedRequesterId && (permissionType === 1 || permissionType === 2)) {
          // Check expiration first
          const expiresAt = Number(auth.expires_at);
          const currentTimestamp = Number(l.current_timestamp);
          const isExpired = expiresAt !== 0 && currentTimestamp >= expiresAt;
          
          if (isExpired) {
            this.logger?.info({ disclosureExpired: { requester: this.userId, target: targetUserId, expiresAt, currentTimestamp } });
            throw new Error(`Disclosure permission has expired. Please request a new permission from ${targetUserId}.`);
          }
          
          // For threshold permissions, validate that the requested threshold doesn't exceed the authorized maximum
          if (permissionType === 1) { // threshold permission
            const authorizedMaxAmount = BigInt(auth.max_amount);
            const requestedThreshold = utils.parseAmount(thresholdAmount);
            if (requestedThreshold > authorizedMaxAmount) {
              throw new Error(`Threshold amount ${thresholdAmount} exceeds authorized maximum ${utils.formatBalance(authorizedMaxAmount)}`);
            }
          }
          foundAuthId = authId;
          break;
        }
      }
      
      if (!foundAuthId) {
        this.logger?.warn({ disclosureDebug: { message: 'No disclosure permission found', requester: normalizedRequesterId, target: targetUserId } });
        console.log(`DEBUG: No disclosure permission found for requester ${normalizedRequesterId} to target ${targetUserId}`);
        throw new Error(`No disclosure permission found. ${targetUserId} has not granted you access to verify their balance.`);
      }
      
      console.log(`DEBUG: Found disclosure auth ID:`, Array.from(foundAuthId).map(b => b.toString(16).padStart(2, '0')).join(''));
      
      // Check if we have shared balance access for this authorization
      if (!l.shared_balance_access.member(foundAuthId)) {
        this.logger?.warn({ disclosureDebug: { message: 'No shared balance access found for disclosure permission' } });
        console.log(`DEBUG: No shared balance access found for auth ID`);
        console.log(`DEBUG: Available shared_balance_access keys:`, Array.from(l.shared_balance_access).map(([key, _]) => 
          Array.from(key).map(b => b.toString(16).padStart(2, '0')).join('')
        ));
        throw new Error('Disclosure permission exists but balance access is not properly configured.');
      }
      
      // Get the encrypted balance from shared access
      const sharedEncrypted = l.shared_balance_access.lookup(foundAuthId);
      console.log(`DEBUG: Found shared encrypted balance:`, Array.from(sharedEncrypted).map(b => b.toString(16).padStart(2, '0')).join(''));
      
      // Decrypt the balance
      const targetBalance = await this.decryptSharedBalance(sharedEncrypted);
      console.log(`DEBUG: Decrypted target balance:`, targetBalance.toString());
      
      const thresholdAmountBig = utils.parseAmount(thresholdAmount);
      console.log(`DEBUG: Threshold amount:`, thresholdAmountBig.toString());
      
      const meetsThreshold = targetBalance >= thresholdAmountBig;
      console.log(`DEBUG: Meets threshold:`, meetsThreshold);
      
      this.logger?.info({
        thresholdCheckCompleted: {
          requester: this.userId,
          target: targetUserId,
          threshold: thresholdAmount,
          targetBalance: targetBalance.toString(),
          result: meetsThreshold
        }
      });
      
      return meetsThreshold;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger?.warn({ thresholdCheckFailed: { requester: this.userId, target: targetUserId, error: errorMessage } });
      throw error;
    }
  }

  async getDisclosedBalance(pin: string, targetUserId: string): Promise<bigint> {
    this.logger?.info({ getDisclosedBalance: { requester: this.userId, target: targetUserId } });
    
    try {
      const state = await this.providers.publicDataProvider.queryContractState(this.deployedContractAddress);
      if (!state) throw new Error('Contract state not available');
      
      const l = ledger(state.data);
      const normalizedTargetId = this.normalizeUserId(targetUserId);
      const targetIdBytes = this.stringToBytes32(normalizedTargetId);
      const normalizedRequesterId = this.normalizeUserId(this.userId);
      
      // Find the disclosure permission in user_as_recipient_auths for the target user
      if (!l.user_as_recipient_auths.member(targetIdBytes)) {
        throw new Error('Target user has no recipient authorizations');
      }
      
      const authVector = l.user_as_recipient_auths.lookup(targetIdBytes) as Uint8Array[];
      const isZeroBytes = (b: Uint8Array): boolean => b.every((x) => x === 0);
      const decoder = new TextDecoder();
      
      let foundAuthId: Uint8Array | null = null;
      
      // Search through the target's authorizations to find our exact disclosure permission
      for (const authId of authVector) {
        if (!authId || isZeroBytes(authId)) continue;
        if (!l.active_authorizations.member(authId)) continue;
        
        const auth = l.active_authorizations.lookup(authId);
        const senderId = decoder.decode(auth.sender_id).replace(/\0/g, '');
        const permissionType = Number(auth.permission_type);
        
        // Check if this is our exact disclosure permission (sender matches requester and it's exact(2))
        if (senderId === normalizedRequesterId && permissionType === 2) {
          // Check expiration
          const expiresAt = Number(auth.expires_at);
          const currentTimestamp = Number(l.current_timestamp);
          const isExpired = expiresAt !== 0 && currentTimestamp >= expiresAt;
          
          if (isExpired) {
            throw new Error('Disclosure permission has expired');
          }
          
          foundAuthId = authId;
          break;
        }
      }
      
      if (!foundAuthId) {
        throw new Error('No exact disclosure permission found');
      }
      
      // Check if we have shared balance access for this authorization
      if (!l.shared_balance_access.member(foundAuthId)) {
        throw new Error('No shared balance access found for disclosure permission');
      }
      
      // Get the encrypted balance from shared access
      const sharedEncrypted = l.shared_balance_access.lookup(foundAuthId);
      
      // Decrypt the balance
      const targetBalance = await this.decryptSharedBalance(sharedEncrypted);
      
      this.logger?.info({
        exactBalanceDisclosed: {
          requester: this.userId,
          target: targetUserId,
          disclosedBalance: targetBalance.toString()
        }
      });
      
      return targetBalance;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger?.warn({ exactDisclosureFailed: { requester: this.userId, target: targetUserId, error: errorMessage } });
      throw error;
    }
  }

  // Helper methods for disclosure system
  private calculateDisclosureId(requesterId: string, targetUserId: string): Uint8Array {
    // This should match the contract's disclosure_id calculation:
    // persistentHash<Vector<3, Bytes<32>>>([requester_id, user_id, pad(32, "disclosure")])
    const requesterBytes = this.stringToBytes32(requesterId);
    const targetBytes = this.stringToBytes32(targetUserId);
    const disclosureBytes = this.stringToBytes32('disclosure');
    
    // Simplified hash - in production would use proper hash function
    const combined = new Uint8Array(96);
    combined.set(requesterBytes, 0);
    combined.set(targetBytes, 32);
    combined.set(disclosureBytes, 64);
    
    // Return first 32 bytes as ID (simplified)
    return combined.slice(0, 32);
  }

  private async decryptSharedBalance(encryptedBalance: Uint8Array): Promise<bigint> {
    // Simplified decryption helper - tries to resolve the encrypted balance to a bigint
    // In the new approach, we skip complex key derivation and use ledger mappings directly
    
    const state = await this.providers.publicDataProvider.queryContractState(this.deployedContractAddress);
    if (!state) return 0n;
    
    const l = ledger(state.data);
    
    // Debug: Log all available mappings
    console.log(`DEBUG: Checking balance mappings for encrypted balance:`, Array.from(encryptedBalance).map(b => b.toString(16).padStart(2, '0')).join(''));
    console.log(`DEBUG: Available user_balance_mappings keys (${Array.from(l.user_balance_mappings).length}):`);
    Array.from(l.user_balance_mappings).slice(0, 5).forEach(([key, value], i) => {
      console.log(`  ${i}: ${Array.from(key).map(b => b.toString(16).padStart(2, '0')).join('')} -> ${value}`);
    });
    console.log(`DEBUG: Available encrypted_amount_mappings keys (${Array.from(l.encrypted_amount_mappings).length}):`);
    Array.from(l.encrypted_amount_mappings).slice(0, 5).forEach(([key, value], i) => {
      console.log(`  ${i}: ${Array.from(key).map(b => b.toString(16).padStart(2, '0')).join('')} -> ${value}`);
    });
    
    // Try to find the balance in user_balance_mappings first
    if (l.user_balance_mappings.member(encryptedBalance)) {
      const balance = l.user_balance_mappings.lookup(encryptedBalance);
      this.logger?.info({ decryptSharedBalance: { method: 'user_balance_mappings', balance: balance.toString() } });
      return balance;
    }
    
    // Try encrypted_amount_mappings as fallback
    if (l.encrypted_amount_mappings.member(encryptedBalance)) {
      const balance = BigInt(l.encrypted_amount_mappings.lookup(encryptedBalance));
      this.logger?.info({ decryptSharedBalance: { method: 'encrypted_amount_mappings', balance: balance.toString() } });
      return balance;
    }
    
    // If no mapping found, return 0
    console.log(`DEBUG: No mapping found - the encrypted balance may not have been properly stored during permission granting`);
    this.logger?.warn({ decryptSharedBalance: { method: 'failed', message: 'No mapping found for encrypted balance' } });
    return 0n;
  }
  
  async getDisclosurePermissions(pin: string): Promise<Array<{ requesterId: string; permissionType: 'threshold' | 'exact'; thresholdAmount: bigint; expiresAt: Date | null }>> {
    this.logger?.info({ getDisclosurePermissions: { grantor: this.userId } });
    
    const state = await this.providers.publicDataProvider.queryContractState(this.deployedContractAddress);
    if (!state) return [];
    
    const l = ledger(state.data);
    const normalizedUserId = this.normalizeUserId(this.userId);
    const userIdBytes = this.stringToBytes32(normalizedUserId);
    const decoder = new TextDecoder();
    const permissions: Array<{ requesterId: string; permissionType: 'threshold' | 'exact'; thresholdAmount: bigint; expiresAt: Date | null }> = [];
    
    // Look at current user's granted permissions (as recipient)
    if (!l.user_as_recipient_auths.member(userIdBytes)) return [];
    
    const authVector = l.user_as_recipient_auths.lookup(userIdBytes) as Uint8Array[];
    const isZeroBytes = (b: Uint8Array): boolean => b.every((x) => x === 0);
    
    for (const authId of authVector) {
      if (!authId || isZeroBytes(authId)) continue;
      if (!l.active_authorizations.member(authId)) continue;
      
      const auth = l.active_authorizations.lookup(authId);
      const permissionType = Number(auth.permission_type);
      
      // Only include disclosure permissions (not transfer permissions)
      if (permissionType === 1 || permissionType === 2) {
        const requesterId = decoder.decode(auth.sender_id).replace(/\0/g, '');
        const thresholdAmount = BigInt(auth.max_amount);
        const expiresAtTimestamp = Number(auth.expires_at);
        
        // Debug logging to see what permission types we're getting
        console.log(`DEBUG: Permission for ${requesterId} - raw type: ${permissionType}, interpreted as: ${permissionType === 1 ? 'threshold' : 'exact'}`);
        
        // Convert timestamp to Date (0 = never expires)
        // Contract stores expires_at as seconds, convert to milliseconds for JavaScript Date
        const expiresAt = expiresAtTimestamp === 0 ? null : new Date(expiresAtTimestamp * 1000);
        
        permissions.push({
          requesterId,
          permissionType: permissionType === 1 ? 'threshold' : 'exact',
          thresholdAmount,
          expiresAt
        });
      }
    }
    
    return permissions;
  }

  async revokeDisclosurePermission(pin: string, requesterId: string): Promise<void> {
    this.logger?.info({ revokeDisclosurePermission: { grantor: this.userId, requester: requesterId } });
    
    // Note: In current contract implementation, there's no specific revoke circuit
    // To revoke, we would grant a new permission with expires_at = current_timestamp (immediate expiry)
    // or implement a dedicated revoke_disclosure_permission circuit
    
    // For now, we'll grant a permission that expires immediately (1 second)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 1000); // 1 second from now
    
    try {
      // Since we now have unique IDs for different permission types, we need to revoke both
      // Grant "dummy" permissions that expire immediately for both threshold and exact types
      await this.grantDisclosurePermissionUntil(pin, requesterId, 'threshold', '0', expiresAt);
      await this.grantDisclosurePermissionUntil(pin, requesterId, 'exact', '0', expiresAt);
      
      this.logger?.trace({
        disclosurePermissionRevoked: {
          grantor: this.userId,
          requester: requesterId,
          method: 'immediate_expiry_both_types'
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger?.warn({ revokeDisclosureFailed: { grantor: this.userId, requester: requesterId, error: errorMessage } });
      throw new Error(`Failed to revoke disclosure permission: ${errorMessage}`);
    }
  }

  // Client-owned detailed log (persisted via privateStateProvider)
  async getDetailedTransactionHistory(): Promise<DetailedTransaction[]> {
    const raw = await this.providers.privateStateProvider.get(this.detailedLogKey as unknown as AccountId);
    return (raw as unknown as DetailedTransaction[]) ?? [];
  }

  // Synchronous version for use in observables (cached)
  private cachedTransactionHistory: DetailedTransaction[] = [];
  
  private getDetailedTransactionHistorySync(): DetailedTransaction[] {
    return this.cachedTransactionHistory;
  }
  
  private async updateTransactionHistoryCache(): Promise<void> {
    try {
      this.cachedTransactionHistory = await this.getDetailedTransactionHistory();
    } catch {
      // Keep existing cache if read fails
    }
  }

  private async appendDetailedLog(entry: DetailedTransaction): Promise<void> {
    try {
      const current = await this.getDetailedTransactionHistory();
      const updated = [...current, entry].slice(-100);
      await this.providers.privateStateProvider.set(
        this.detailedLogKey as unknown as AccountId,
        updated as unknown as BankPrivateState,
      );
      
      // Update cache to reflect the new transaction
      this.cachedTransactionHistory = updated;
    } catch {}
  }

  // Get pending authorization requests (Bob checks what Alice requested)
  async getPendingAuthRequests(): Promise<Array<{ senderUserId: string; requestedAt: number }>> {
    const state = await this.providers.publicDataProvider.queryContractState(this.deployedContractAddress);
    if (!state) return [];
    
    const l = ledger(state.data);
    const normalizedUserId = this.normalizeUserId(this.userId);
    
    const requests: Array<{ senderUserId: string; requestedAt: number }> = [];
    const decoder = new TextDecoder();
    
    // Scan all pending_auth_requests for requests TO this user
    for (const [requestIdBytes, request] of l.pending_auth_requests) {
      const recipientId = decoder.decode(request.recipient_id).replace(/\0/g, '');
      
      if (recipientId === normalizedUserId) {
        const senderId = decoder.decode(request.sender_id).replace(/\0/g, '');
        requests.push({
          senderUserId: senderId,
          requestedAt: Number(request.requested_at)
        });
      }
    }
    
    return requests;
  }

  // Get outgoing authorization requests (Alice checks what she requested)
  async getOutgoingAuthRequests(): Promise<Array<{ recipientUserId: string; requestedAt: number; status: number }>> {
    const state = await this.providers.publicDataProvider.queryContractState(this.deployedContractAddress);
    if (!state) return [];
    
    const l = ledger(state.data);
    const normalizedUserId = this.normalizeUserId(this.userId);
    
    const requests: Array<{ recipientUserId: string; requestedAt: number; status: number }> = [];
    const decoder = new TextDecoder();
    
    // Scan all pending_auth_requests for requests FROM this user
    for (const [requestIdBytes, request] of l.pending_auth_requests) {
      const senderId = decoder.decode(request.sender_id).replace(/\0/g, '');
      
      if (senderId === normalizedUserId) {
        const recipientId = decoder.decode(request.recipient_id).replace(/\0/g, '');
        requests.push({
          recipientUserId: recipientId,
          requestedAt: Number(request.requested_at),
          status: Number(request.status)
        });
      }
    }
    
    return requests;
  }

  async getPendingClaims(): Promise<Array<{ senderUserId: string; amount: bigint }>> {
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
      
      if (l.encrypted_amount_mappings.member(encryptedAmount)) {
        const actual = BigInt(l.encrypted_amount_mappings.lookup(encryptedAmount));
        if (actual > 0n) {
          claims.push({ senderUserId: senderId, amount: actual });
        }
      }
    }
    
    return claims;
  }

  static async deploy(
    providers: BankProviders,
    logger: Logger,
  ): Promise<ContractAddress> {
    console.log('🚀 [DEBUG DEPLOY] Bank deploy started');
    logger.info({ deployBankContract: {} });
    // Deploys can occasionally fail transiently if the node/indexer/proof server
    // are not fully ready at the very start of the test run. Add a short
    // retry-with-backoff to make the tests more robust.
    // However, do NOT retry on user rejections!
    const maxAttempts = 5;
    let lastError: unknown;
    let deployedBankContract: DeployedBankContract | undefined;
    
    // Helper function to check if error is a user rejection or insufficient balance
    const isNonRetryableError = (error: any): boolean => {
      if (!error) return false;
      
      // Check for common user rejection patterns
      const errorString = error.toString?.() || String(error);
      const message = error.message || '';
      const code = error.code || '';
      const reason = error.reason || '';
      
      // User rejection patterns
      const isUserRejection = (
        code === 'Rejected' ||
        reason === 'User rejects transaction' ||
        message.includes('User reject') ||
        message.includes('user reject') ||
        message.includes('User denied') ||
        message.includes('user denied') ||
        message.includes('Transaction rejected') ||
        message.includes('transaction rejected') ||
        errorString.includes('User reject') ||
        errorString.includes('user reject')
      );
      
      // Insufficient balance patterns
      const isInsufficientBalance = (
        reason?.includes('Insufficient balance') ||
        message?.includes('Insufficient balance') ||
        errorString?.includes('Insufficient balance') ||
        code === 'InvalidRequest' && reason?.includes('Insufficient balance')
      );
      
      // Timeout patterns - don't retry timeouts
      const isTimeout = (
        message?.includes('timeout') ||
        message?.includes('Timeout') ||
        message?.includes('TIMEOUT') ||
        errorString?.includes('timeout') ||
        code === 'TIMEOUT'
      );
      
      return isUserRejection || isInsufficientBalance || isTimeout;
    };
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`🔄 [DEBUG DEPLOY] Attempt ${attempt}/${maxAttempts} - calling deployContract...`);
        
        // Add timeout wrapper to prevent hanging
        const deployTimeout = 120000; // 2 minutes timeout
        const deployPromise = deployContract(providers, {
          privateStateId: 'deploy' as AccountId, // Neutral state for deployment
          contract: bankContract,
          initialPrivateState: createBankPrivateState(), // Empty initial state for this user
        });
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Deployment timeout after ${deployTimeout / 1000} seconds. This might be due to proof server being unavailable, network issues, or waiting for user confirmation in Lace wallet.`));
          }, deployTimeout);
        });
        
        deployedBankContract = await Promise.race([deployPromise, timeoutPromise]) as DeployedBankContract;
        console.log('✅ [DEBUG DEPLOY] deployContract succeeded');
        break;
      } catch (err) {
        lastError = err;
        console.log(`❌ [DEBUG DEPLOY] Attempt ${attempt} failed:`, err instanceof Error ? err.message : err);
        console.log(`📊 [DEBUG DEPLOY] Error details:`, {
          message: err instanceof Error ? err.message : 'unknown error',
          stack: err instanceof Error ? err.stack : undefined,
          type: typeof err,
          code: (err as any)?.code,
          reason: (err as any)?.reason
        });
        
        // Check if this is a non-retryable error (user rejection or insufficient balance)
        if (isNonRetryableError(err)) {
          const errorType = (err as any)?.reason?.includes('Insufficient balance') ? 'insufficient balance' : 'user rejection';
          console.log(`🚫 [DEBUG DEPLOY] ${errorType} error - not retrying`);
          break; // Exit the retry loop immediately
        }
        
        const backoffMs = attempt === maxAttempts ? 0 : 1000 * Math.pow(2, attempt - 1);
        logger.warn({
          deployRetry: {
            attempt,
            maxAttempts,
            backoffMs,
            error: err instanceof Error ? err.message : 'unknown error',
            isNonRetryableError: isNonRetryableError(err),
          },
        });
        if (backoffMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }
      }
    }
    if (deployedBankContract === undefined) {
      console.log('💥 [DEBUG DEPLOY] All deployment attempts failed');
      console.log('💥 [DEBUG DEPLOY] Final error:', lastError);
      throw lastError instanceof Error ? lastError : new Error('Unknown deploy error');
    }

    console.log('🎉 [DEBUG DEPLOY] Bank deployment successful!');
    console.log('📋 [DEBUG DEPLOY] Contract address:', deployedBankContract.deployTxData.public.contractAddress);

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
    console.log('🚀 [DEBUG] createAccount called with:', { userId, pin: '***', initialDeposit, contractAddress });
    const normalizedUserId = (() => {
      const enc = new TextEncoder();
      const bytes = enc.encode(userId);
      if (bytes.length <= 32) return userId;
      return new TextDecoder().decode(bytes.slice(0, 32));
    })();
    console.log('🔧 [DEBUG] Normalized userId:', normalizedUserId);

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

    console.log('🔍 [DEBUG] Finding deployed contract...');
    const deployed = await findDeployedContract(providers, {
      contractAddress,
      contract: bankContract,
      privateStateId: normalizedUserId as AccountId,
      initialPrivateState: createBankPrivateState(),
    });
    console.log('✅ [DEBUG] Deployed contract found');

    console.log('📝 [DEBUG] Calling create_account circuit with:', {
      userIdLength: userIdBytes.length,
      pinLength: pinBytes.length,
      amount: utils.parseAmount(initialDeposit)
    });
    
    console.log('⏳ [DEBUG] Waiting for Lace signing...');
    const txData = await deployed.callTx.create_account(
      userIdBytes,
      pinBytes,
      utils.parseAmount(initialDeposit),
    );
    console.log('✅ [DEBUG] Transaction signed and submitted:', txData.public.txHash);

    console.log('🎯 [DEBUG] Account creation successful!');
    logger?.trace({
      createAccount: {
        userId: normalizedUserId,
        initialDeposit,
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });

    // Seed private state for immediate UX (encrypted balance system)
    const sharedKey = normalizedUserId as AccountId;
    const currentState = (await providers.privateStateProvider.get(sharedKey)) ?? createBankPrivateState();
    const pinHash = hashPin(pin);
    const newUserPinHashes = new Map(currentState.userPinHashes);
    newUserPinHashes.set(normalizedUserId, pinHash);
    
    // Note: We don't store userBalances since they're encrypted on-chain
    await providers.privateStateProvider.set(sharedKey, {
      userPinHashes: newUserPinHashes,
      userBalances: new Map(), // Empty - balances are encrypted on-chain
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
    } catch (error) {
      console.log('⚠️ [DEBUG] Error saving detailed transaction log:', error);
    }
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