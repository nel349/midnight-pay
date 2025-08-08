import { type Ledger, ledger } from '../managed/bank/contract/index.cjs';
import { Contract, type BankPrivateState, createBankPrivateState, hashPin, bankWitnesses } from '../index.js';
import { 
  CircuitContext, 
  constructorContext,
  sampleContractAddress,
  QueryContext,
} from '@midnight-ntwrk/compact-runtime';

// Local transaction record (user maintains this separately)
interface TransactionRecord {
  type: 'create' | 'deposit' | 'withdraw' | 'balance_check' | 'verify';
  amount?: bigint;
  timestamp: Date;
  balanceAfter: bigint;
  pin: string; // In real app, this would be encrypted/hashed
}

// Test setup class similar to battleship setup
export class BankTestSetup {
  private contract: Contract<BankPrivateState, typeof bankWitnesses>;
  private turnContext: CircuitContext<BankPrivateState>;
  private contractAddress: string;
  private localTransactionLog: TransactionRecord[] = []; // User's private detailed log
  
  constructor() {
    // Initialize contract with witnesses
    this.contract = new Contract(bankWitnesses);
    this.contractAddress = sampleContractAddress();
    
    // Initialize with empty private state
    const initialPin = hashPin('1234');
    const initialPrivateState = createBankPrivateState(initialPin, 0n);
    
    // Get initial state from contract
    const { currentPrivateState, currentContractState, currentZswapLocalState } = this.contract.initialState(
      constructorContext(initialPrivateState, '0'.repeat(64)),
    );
    
    // Set up turn context
    this.turnContext = {
      currentPrivateState,
      currentZswapLocalState,
      originalState: currentContractState,
      transactionContext: new QueryContext(currentContractState.data, sampleContractAddress()),
    };
    
    console.log('🏦 Bank initialized with empty state');
  }

  // Helper to update state and get ledger
  private updateStateAndGetLedger(circuitResults: any): Ledger {
    // Update the turn context with circuit results
    this.turnContext = circuitResults.context;
    
    return ledger(this.turnContext.transactionContext.state);
  }

  // Test method: Create Account
  createAccount(pin: string, initialDeposit: bigint): Ledger {
    console.log(`🔑 Creating account with PIN and initial deposit: $${initialDeposit}`);
    
    // Convert PIN to Bytes<32> (simplified for testing)
    const pinBytes = new Uint8Array(32);
    const encoder = new TextEncoder();
    const encoded = encoder.encode(pin);
    pinBytes.set(encoded.slice(0, Math.min(encoded.length, 32)));
    
    const results = this.contract.impureCircuits.create_account(this.turnContext, pinBytes, initialDeposit);
    const ledger = this.updateStateAndGetLedger(results);
    
    // Record detailed transaction locally (user's private log)
    this.localTransactionLog.push({
      type: 'create',
      amount: initialDeposit,
      timestamp: new Date(),
      balanceAfter: this.getCurrentBalance(),
      pin: pin // In real app: encrypted/hashed
    });
    
    return ledger;
  }

  // Test method: Deposit funds
  deposit(pin: string, amount: bigint): Ledger {
    console.log(`💰 Depositing $${amount}`);
    
    // Convert PIN to Bytes<32>
    const pinBytes = new Uint8Array(32);
    const encoder = new TextEncoder();
    const encoded = encoder.encode(pin);
    pinBytes.set(encoded.slice(0, Math.min(encoded.length, 32)));
    
    const results = this.contract.impureCircuits.deposit(this.turnContext, pinBytes, amount);
    const ledger = this.updateStateAndGetLedger(results);
    
    // Record detailed transaction locally
    this.localTransactionLog.push({
      type: 'deposit',
      amount: amount,
      timestamp: new Date(),
      balanceAfter: this.getCurrentBalance(),
      pin: pin
    });
    
    return ledger;
  }

  // Test method: Authenticate balance access
  authenticateBalanceAccess(pin: string): Ledger {
    console.log(`👁️ Checking balance access`);
    
    // Convert PIN to Bytes<32>
    const pinBytes = new Uint8Array(32);
    const encoder = new TextEncoder();
    const encoded = encoder.encode(pin);
    pinBytes.set(encoded.slice(0, Math.min(encoded.length, 32)));
    
    const results = this.contract.impureCircuits.authenticate_balance_access(this.turnContext, pinBytes);
    return this.updateStateAndGetLedger(results);
  }

  // Test method: Verify account status
  verifyAccountStatus(pin: string): Ledger {
    console.log(`✅ Verifying account status`);
    
    // Convert PIN to Bytes<32>
    const pinBytes = new Uint8Array(32);
    const encoder = new TextEncoder();
    const encoded = encoder.encode(pin);
    pinBytes.set(encoded.slice(0, Math.min(encoded.length, 32)));
    
    const results = this.contract.impureCircuits.verify_account_status(this.turnContext, pinBytes);
    return this.updateStateAndGetLedger(results);
  }

  // Test method: Withdraw funds
  withdraw(pin: string, amount: bigint): Ledger {
    console.log(`💸 Withdrawing $${amount}`);
    
    // Convert PIN to Bytes<32>
    const pinBytes = new Uint8Array(32);
    const encoder = new TextEncoder();
    const encoded = encoder.encode(pin);
    pinBytes.set(encoded.slice(0, Math.min(encoded.length, 32)));
    
    const results = this.contract.impureCircuits.withdraw(this.turnContext, pinBytes, amount);
    const ledger = this.updateStateAndGetLedger(results);
    
    // Record detailed transaction locally
    this.localTransactionLog.push({
      type: 'withdraw',
      amount: amount,
      timestamp: new Date(),
      balanceAfter: this.getCurrentBalance(),
      pin: pin
    });
    
    return ledger;
  }

  // Getter methods for state inspection
  getLedgerState(): Ledger {
    return ledger(this.turnContext.transactionContext.state);
  }

  getPrivateState(): BankPrivateState {
    return this.turnContext.currentPrivateState;
  }

  // Helper: Get current balance (directly from private state)
  getCurrentBalance(): bigint {
    return this.turnContext.currentPrivateState.accountBalance;
  }

  // Helper: Check if account exists
  isAccountCreated(): boolean {
    return this.getLedgerState().account_exists;
  }

  // Helper: Get transaction count
  getTransactionCount(): bigint {
    return this.getLedgerState().transaction_count;
  }

  // Helper: Get account status
  getAccountStatus(): string {
    // Convert Bytes<32> to string for readability
    const decoder = new TextDecoder();
    return decoder.decode(this.getLedgerState().account_status).replace(/\0/g, '');
  }

  // Helper: Get last transaction type
  getLastTransaction(): string {
    const txBytes = this.getLedgerState().last_transaction;
    if (!txBytes) return '';
    
    try {
      // Try to decode as UTF-8, handling null bytes
      const decoder = new TextDecoder('utf-8', { ignoreBOM: true });
      const decoded = decoder.decode(txBytes);
      // Clean up null bytes and non-printable characters
      return decoded.replace(/\0+/g, '').replace(/[^\x20-\x7E]/g, '');
    } catch {
      // If decoding fails, return a hash representation
      return `tx_${Array.from(txBytes.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join('')}`;
    }
  }

  // Debug helper: Print current state
  printState(): void {
    console.log('\n📊 Current Bank State:');
    console.log('├─ Account Exists:', this.isAccountCreated());
    console.log('├─ Private Balance: $' + this.getCurrentBalance().toString());
    console.log('├─ Transaction Count:', this.getTransactionCount().toString());
    console.log('├─ Account Status:', this.getAccountStatus());
    console.log('└─ Last Transaction:', this.getLastTransaction());
    console.log('');
  }

  // Helper: Get detailed transaction history (user's private log)
  getDetailedTransactionHistory(): TransactionRecord[] {
    return [...this.localTransactionLog]; // Return copy to prevent modification
  }

  // Helper: Get specific transaction details
  getTransactionDetails(index: number): TransactionRecord | undefined {
    return this.localTransactionLog[index];
  }

  // Helper: Search transactions by type
  getTransactionsByType(type: TransactionRecord['type']): TransactionRecord[] {
    return this.localTransactionLog.filter(tx => tx.type === type);
  }

  // Helper: Get total amount for transaction type
  getTotalAmountByType(type: TransactionRecord['type']): bigint {
    return this.localTransactionLog
      .filter(tx => tx.type === type && tx.amount !== undefined)
      .reduce((total, tx) => total + (tx.amount || 0n), 0n);
  }

  // Helper: Calculate expected transaction hash (matches contract logic)
  calculateTransactionHash(transactionType: string): Uint8Array {
    // This should match the persistentHash calculation in the contract
    // For now, we'll use a simplified approach since we can't easily access the exact persistentHash function
    const encoder = new TextEncoder();
    const typeBytes = encoder.encode(transactionType);
    
    // Create a 32-byte hash by padding and simple transformation
    const hash = new Uint8Array(32);
    for (let i = 0; i < Math.min(typeBytes.length, 32); i++) {
      hash[i] = typeBytes[i] ^ (i + 1); // Simple XOR transformation
    }
    
    // Add some additional entropy based on transaction type
    const typeCode = transactionType === 'account_created' ? 0x01 :
                    transactionType === 'deposit' ? 0x02 :
                    transactionType === 'withdrawal' ? 0x03 : 0x00;
    hash[31] = typeCode; // Set last byte as type identifier
    
    return hash;
  }

  // Helper: Print detailed transaction history
  printDetailedHistory(): void {
    console.log('\n📜 Detailed Transaction History (User\'s Private Log):');
    this.localTransactionLog.forEach((tx, index) => {
      const amountStr = tx.amount ? `$${tx.amount}` : 'N/A';
      console.log(`├─ [${index}] ${tx.type.toUpperCase()}: ${amountStr} → Balance: $${tx.balanceAfter} (${tx.timestamp.toLocaleTimeString()})`);
    });
    console.log('');
  }
}