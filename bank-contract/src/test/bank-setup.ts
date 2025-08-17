import { type Ledger, ledger } from '../managed/bank/contract/index.cjs';
import { Contract, type BankPrivateState, createBankPrivateState, addUserToPrivateState, hashPin, bankWitnesses } from '../index.js';
import { 
  CircuitContext, 
  constructorContext,
  sampleContractAddress,
  QueryContext,
} from '@midnight-ntwrk/compact-runtime';

// Local transaction record (user maintains this separately)
interface TransactionRecord {
  type: 'create' | 'deposit' | 'withdraw' | 'balance_check' | 'verify' | 'transfer_out' | 'transfer_in' | 'auth_request' | 'auth_approve' | 'auth_transfer' | 'claim_transfer';
  amount?: bigint;
  timestamp: Date;
  balanceAfter: bigint;
  pin: string; // In real app, this would be encrypted/hashed
  counterparty?: string; // For transfers, the other user_id
  maxAmount?: bigint; // For authorization approval
}

// Test setup class for shared bank contract architecture
export class BankTestSetup {
  private contract: Contract<BankPrivateState, typeof bankWitnesses>;
  private turnContext: CircuitContext<BankPrivateState>;
  private contractAddress: string;
  private localTransactionLogs: Map<string, TransactionRecord[]> = new Map(); // Per-user transaction logs
  
  constructor() {
    // Initialize shared contract with witnesses
    this.contract = new Contract(bankWitnesses);
    this.contractAddress = sampleContractAddress();
    
    // Initialize with empty shared private state
    const initialPrivateState = createBankPrivateState();
    
    // Get initial state from contract (empty shared bank)
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
    
    console.log('🏦 Shared Bank initialized with empty state');
  }

  // Helper to convert string to Bytes<32>
  private stringToBytes32(str: string): Uint8Array {
    const bytes = new Uint8Array(32);
    const encoder = new TextEncoder();
    const encoded = encoder.encode(str);
    bytes.set(encoded.slice(0, Math.min(encoded.length, 32)));
    return bytes;
  }

  // Helper to update state and get ledger
  private updateStateAndGetLedger(circuitResults: any): Ledger {
    // Update the turn context with circuit results
    this.turnContext = circuitResults.context;
    
    return ledger(this.turnContext.transactionContext.state);
  }

  // Helper to record transaction in user's local log
  private recordTransaction(userId: string, record: TransactionRecord): void {
    if (!this.localTransactionLogs.has(userId)) {
      this.localTransactionLogs.set(userId, []);
    }
    this.localTransactionLogs.get(userId)!.push(record);
  }

  // Test method: Create Account in Shared Bank
  createAccount(userId: string, pin: string, initialDeposit: bigint): Ledger {
    console.log(`🔑 Creating account for user ${userId} with PIN and initial deposit: $${initialDeposit}`);
    
    // Track the PIN for balance verification
    this.testPins.set(userId, pin);
    
    const userIdBytes = this.stringToBytes32(userId);
    const pinBytes = this.stringToBytes32(pin);
    
    const results = this.contract.impureCircuits.create_account(this.turnContext, userIdBytes, pinBytes, initialDeposit);
    const ledger = this.updateStateAndGetLedger(results);
    
    // Record detailed transaction locally (user's private log)
    this.recordTransaction(userId, {
      type: 'create',
      amount: initialDeposit,
      timestamp: new Date(),
      balanceAfter: this.getUserBalance(userId),
      pin: pin
    });
    
    return ledger;
  }

  // Test method: Deposit funds
  deposit(userId: string, pin: string, amount: bigint): Ledger {
    console.log(`💰 User ${userId} depositing $${amount}`);
    
    const userIdBytes = this.stringToBytes32(userId);
    const pinBytes = this.stringToBytes32(pin);
    
    const results = this.contract.impureCircuits.deposit(this.turnContext, userIdBytes, pinBytes, amount);
    const ledger = this.updateStateAndGetLedger(results);
    
    // Record detailed transaction locally
    this.recordTransaction(userId, {
      type: 'deposit',
      amount: amount,
      timestamp: new Date(),
      balanceAfter: this.getUserBalance(userId),
      pin: pin
    });
    
    return ledger;
  }

  // Test method: Withdraw funds
  withdraw(userId: string, pin: string, amount: bigint): Ledger {
    console.log(`💸 User ${userId} withdrawing $${amount}`);
    
    const userIdBytes = this.stringToBytes32(userId);
    const pinBytes = this.stringToBytes32(pin);
    
    const results = this.contract.impureCircuits.withdraw(this.turnContext, userIdBytes, pinBytes, amount);
    const ledger = this.updateStateAndGetLedger(results);
    
    // Record detailed transaction locally
    this.recordTransaction(userId, {
      type: 'withdraw',
      amount: amount,
      timestamp: new Date(),
      balanceAfter: this.getUserBalance(userId),
      pin: pin
    });
    
    return ledger;
  }


  // Test method: Get token balance
  getTokenBalance(userId: string, pin: string): Ledger {
    console.log(`👁️ User ${userId} checking token balance`);
    
    const userIdBytes = this.stringToBytes32(userId);
    const pinBytes = this.stringToBytes32(pin);
    
    const results = this.contract.impureCircuits.get_token_balance(this.turnContext, userIdBytes, pinBytes);
    return this.updateStateAndGetLedger(results);
  }

  // Test method: Verify account status
  verifyAccountStatus(userId: string, pin: string): Ledger {
    console.log(`✅ Verifying account status for user ${userId}`);
    
    const userIdBytes = this.stringToBytes32(userId);
    const pinBytes = this.stringToBytes32(pin);
    
    const results = this.contract.impureCircuits.verify_account_status(this.turnContext, userIdBytes, pinBytes);
    return this.updateStateAndGetLedger(results);
  }

  // Test method: Request Transfer Authorization (NEW!)
  requestTransferAuthorization(senderId: string, recipientId: string, pin: string): Ledger {
    console.log(`🔑 User ${senderId} requesting transfer authorization from ${recipientId}`);
    
    const senderIdBytes = this.stringToBytes32(senderId);
    const recipientIdBytes = this.stringToBytes32(recipientId);
    const pinBytes = this.stringToBytes32(pin);
    
    const results = this.contract.impureCircuits.request_transfer_authorization(this.turnContext, senderIdBytes, recipientIdBytes, pinBytes);
    const ledger = this.updateStateAndGetLedger(results);
    
    // Record transaction locally
    this.recordTransaction(senderId, {
      type: 'auth_request',
      timestamp: new Date(),
      balanceAfter: this.getUserBalance(senderId),
      pin: pin,
      counterparty: recipientId
    });
    
    return ledger;
  }

  // Test method: Approve Transfer Authorization (NEW!)
  approveTransferAuthorization(recipientId: string, senderId: string, pin: string, maxAmount: bigint): Ledger {
    console.log(`✅ User ${recipientId} approving transfer authorization for ${senderId} (max: $${maxAmount})`);
    
    const recipientIdBytes = this.stringToBytes32(recipientId);
    const senderIdBytes = this.stringToBytes32(senderId);
    const pinBytes = this.stringToBytes32(pin);
    
    const results = this.contract.impureCircuits.approve_transfer_authorization(this.turnContext, recipientIdBytes, senderIdBytes, pinBytes, maxAmount);
    const ledger = this.updateStateAndGetLedger(results);
    
    // Record transaction locally
    this.recordTransaction(recipientId, {
      type: 'auth_approve',
      maxAmount: maxAmount,
      timestamp: new Date(),
      balanceAfter: this.getUserBalance(recipientId),
      pin: pin,
      counterparty: senderId
    });
    
    return ledger;
  }

  // Test method: Send to Authorized User (NEW!)
  sendToAuthorizedUser(senderId: string, recipientId: string, amount: bigint, pin: string): Ledger {
    console.log(`💸 User ${senderId} sending $${amount} to authorized user ${recipientId}`);
    
    const senderIdBytes = this.stringToBytes32(senderId);
    const recipientIdBytes = this.stringToBytes32(recipientId);
    const pinBytes = this.stringToBytes32(pin);
    
    const results = this.contract.impureCircuits.send_to_authorized_user(this.turnContext, senderIdBytes, recipientIdBytes, amount, pinBytes);
    const ledger = this.updateStateAndGetLedger(results);
    
    // Track pending transfer for claim calculation
    const transferKey = `${recipientId}:${senderId}`;
    const existingPending = this.pendingTransfers.get(transferKey) || 0n;
    this.pendingTransfers.set(transferKey, existingPending + amount);
    
    // Record transaction locally for sender
    this.recordTransaction(senderId, {
      type: 'auth_transfer',
      amount: amount,
      timestamp: new Date(),
      balanceAfter: 0n, // Will be calculated from history
      pin: pin,
      counterparty: recipientId
    });
    
    return ledger;
  }

  // Test method: Claim Authorized Transfer (NEW!)
  claimAuthorizedTransfer(recipientId: string, senderId: string, pin: string): Ledger {
    console.log(`💰 User ${recipientId} claiming transfer from ${senderId}`);
    
    const recipientIdBytes = this.stringToBytes32(recipientId);
    const senderIdBytes = this.stringToBytes32(senderId);
    const pinBytes = this.stringToBytes32(pin);
    
    // Get the pending transfer amount before claiming
    const pendingAmount = this.getPendingTransferAmount(recipientId, senderId);
    
    const results = this.contract.impureCircuits.claim_authorized_transfer(this.turnContext, recipientIdBytes, senderIdBytes, pinBytes);
    const ledger = this.updateStateAndGetLedger(results);
    
    // Record transaction locally for recipient with the pending amount
    this.recordTransaction(recipientId, {
      type: 'claim_transfer',
      amount: pendingAmount,
      timestamp: new Date(),
      balanceAfter: 0n, // Will be calculated from history
      pin: pin,
      counterparty: senderId
    });
    
    return ledger;
  }

  // Test method: Grant Disclosure Permission (NEW! - Direct, no request needed)
  grantDisclosurePermission(userId: string, requesterId: string, pin: string, permissionType: number, thresholdAmount: bigint, expiresInHours: number): Ledger {
    const permissionTypeName = permissionType === 1 ? 'threshold' : 'exact';
    console.log(`✅ User ${userId} granting ${permissionTypeName} disclosure to ${requesterId} (threshold: $${thresholdAmount}, expires: ${expiresInHours}h)`);
    
    const userIdBytes = this.stringToBytes32(userId);
    const requesterIdBytes = this.stringToBytes32(requesterId);
    const pinBytes = this.stringToBytes32(pin);
    
    // Convert JavaScript number to BigInt for Compact Uint<8> type
    const permissionTypeBigInt = BigInt(permissionType);
    const expiresInHoursBigInt = BigInt(expiresInHours);
    
    const results = this.contract.impureCircuits.grant_disclosure_permission(this.turnContext, userIdBytes, requesterIdBytes, pinBytes, permissionTypeBigInt, thresholdAmount, expiresInHoursBigInt);
    const ledger = this.updateStateAndGetLedger(results);
    
    // Record transaction locally
    this.recordTransaction(userId, {
      type: 'auth_approve', // Reuse auth_approve type for disclosure grants
      maxAmount: thresholdAmount,
      timestamp: new Date(),
      balanceAfter: this.getUserBalance(userId),
      pin: pin,
      counterparty: requesterId
    });
    
    return ledger;
  }

  // Test helper: Advance time by hours (for testing expiration)
  advanceTimeBySeconds(seconds: number): void {
    console.log(`⏰ Advancing time by ${seconds} seconds`);
    
    const currentTime = this.getCurrentTimestamp();
    
    const results = this.contract.impureCircuits.set_timestamp(this.turnContext, BigInt(currentTime + seconds));
    this.updateStateAndGetLedger(results);
    
    const newTime = this.getCurrentTimestamp();
    console.log(`⏰ Time advanced from ${currentTime} to ${newTime} (${seconds} seconds)`);
  }

  // Test helper: Get current timestamp
  getCurrentTimestamp(): number {
    return Number(this.getLedgerState().current_timestamp);
  }

  // Getter methods for state inspection
  getLedgerState(): Ledger {
    return ledger(this.turnContext.transactionContext.state);
  }

  getPrivateState(): BankPrivateState {
    return this.turnContext.currentPrivateState;
  }

  // Helper: Get user's current token balance (from encrypted balance system)
  // Note: In the encrypted system, balances are private and can't be read directly
  // from the public ledger. This helper would need the user's PIN to decrypt the balance.
  getUserBalance(userId: string): bigint {
    // For testing, we need to call get_token_balance circuit with the user's PIN
    // In a real test environment, we'd track the PINs used in test setup
    
    // Check if we have the user's PIN from our test data
    const pin = this.testPins.get(userId);
    if (!pin) {
      console.warn(`getUserBalance: No PIN available for user ${userId} - returning 0`);
      return 0n;
    }
    
    try {
      // Call the get_token_balance circuit with proper authentication
      this.getTokenBalance(userId, pin);
      // The balance check happens in the circuit, but we can't easily return the value
      // For testing purposes, we'll simulate based on transaction history
      return this.calculateBalanceFromHistory(userId);
    } catch (error) {
      console.warn(`getUserBalance: Failed to get balance for ${userId}:`, error);
      return 0n;
    }
  }
  
  // Track test PINs for balance verification
  private testPins = new Map<string, string>();
  
  // Track pending transfers for testing claim amounts
  private pendingTransfers = new Map<string, bigint>(); // "recipient:sender" -> amount
  
  // Helper to calculate balance from transaction history (for testing)
  private calculateBalanceFromHistory(userId: string): bigint {
    const history = this.getUserTransactionHistory(userId);
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
  }
  
  // Helper to get pending transfer amount for claim
  private getPendingTransferAmount(recipientId: string, senderId: string): bigint {
    const key = `${recipientId}:${senderId}`;
    const amount = this.pendingTransfers.get(key) || 0n;
    // Clear the pending transfer since it's being claimed
    this.pendingTransfers.delete(key);
    return amount;
  }

  // Helper: Check if account exists for user in shared bank
  hasAccount(userId: string): boolean {
    // In shared contract, we'd check all_accounts.member(user_id)
    // For testing, we'll check if user has transaction history
    return this.localTransactionLogs.has(userId) && this.localTransactionLogs.get(userId)!.length > 0;
  }

  // Helper: Get total accounts in shared bank
  getTotalAccounts(): bigint {
    return this.getLedgerState().total_accounts;
  }

  // Helper: Get last global transaction
  getLastGlobalTransaction(): string {
    const txBytes = this.getLedgerState().last_global_transaction;
    if (!txBytes) return '';
    
    try {
      const decoder = new TextDecoder('utf-8', { ignoreBOM: true });
      const decoded = decoder.decode(txBytes);
      return decoded.replace(/\0+/g, '').replace(/[^\x20-\x7E]/g, '');
    } catch {
      return `tx_${Array.from(txBytes.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join('')}`;
    }
  }

  // Debug helper: Print current shared bank state
  printSharedBankState(): void {
    console.log('\n📊 Shared Bank State:');
    console.log('├─ Total Accounts:', this.getTotalAccounts().toString());
    console.log('├─ Last Global Transaction:', this.getLastGlobalTransaction());
    console.log('└─ Active Users:', Array.from(this.localTransactionLogs.keys()).join(', '));
    console.log('');
  }

  // Debug helper: Print specific user state
  printUserState(userId: string): void {
    console.log(`\n📊 User ${userId} State:`);
    console.log('├─ Has Account:', this.hasAccount(userId));
    console.log('├─ Balance: $' + this.getUserBalance(userId).toString());
    console.log('├─ Transactions:', this.localTransactionLogs.get(userId)?.length || 0);
    console.log('');
  }

  // Helper: Get user's detailed transaction history
  getUserTransactionHistory(userId: string): TransactionRecord[] {
    return [...(this.localTransactionLogs.get(userId) || [])];
  }

  // Helper: Get specific user transaction details
  getUserTransactionDetails(userId: string, index: number): TransactionRecord | undefined {
    return this.localTransactionLogs.get(userId)?.[index];
  }

  // Helper: Search user transactions by type
  getUserTransactionsByType(userId: string, type: TransactionRecord['type']): TransactionRecord[] {
    return (this.localTransactionLogs.get(userId) || []).filter(tx => tx.type === type);
  }

  // Helper: Get total amount for transaction type (for specific user)
  getUserTotalAmountByType(userId: string, type: TransactionRecord['type']): bigint {
    return (this.localTransactionLogs.get(userId) || [])
      .filter(tx => tx.type === type && tx.amount !== undefined)
      .reduce((total, tx) => total + (tx.amount || 0n), 0n);
  }

  // Helper: Print user's detailed transaction history
  printUserDetailedHistory(userId: string): void {
    const history = this.localTransactionLogs.get(userId) || [];
    console.log(`\n📜 User ${userId} Transaction History:`);
    history.forEach((tx, index) => {
      const amountStr = tx.amount ? `$${tx.amount}` : 'N/A';
      const counterpartyStr = tx.counterparty ? ` (${tx.counterparty})` : '';
      console.log(`├─ [${index}] ${tx.type.toUpperCase()}: ${amountStr}${counterpartyStr} → Balance: $${tx.balanceAfter} (${tx.timestamp.toLocaleTimeString()})`);
    });
    console.log('');
  }

  // Helper: Get all users with accounts
  getAllUsers(): string[] {
    return Array.from(this.localTransactionLogs.keys());
  }

  // Helper: Print all users and their balances
  printAllUsersOverview(): void {
    console.log('\n👥 All Users Overview:');
    const users = this.getAllUsers();
    if (users.length === 0) {
      console.log('├─ No users with accounts');
    } else {
      users.forEach((userId, index) => {
        const isLast = index === users.length - 1;
        const prefix = isLast ? '└─' : '├─';
        console.log(`${prefix} ${userId}: $${this.getUserBalance(userId)} (${this.getUserTransactionHistory(userId).length} txs)`);
      });
    }
    console.log('');
  }
}