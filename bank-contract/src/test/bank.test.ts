import { describe, test, expect, beforeEach } from 'vitest';
import { BankTestSetup } from './bank-setup.js';

describe('Midnight Bank Contract Tests', () => {
  let bank: BankTestSetup;

  beforeEach(() => {
    bank = new BankTestSetup();
  });

  describe('Account Creation', () => {
    test('should create account successfully with valid PIN and deposit', () => {
      // Initially no account exists
      expect(bank.isAccountCreated()).toBe(false);
      expect(bank.getCurrentBalance()).toBe(0n);
      expect(bank.getTransactionCount()).toBe(0n);

      // Create account with $100 initial deposit
      bank.createAccount('1234', 100n);

      // Verify account was created
      expect(bank.isAccountCreated()).toBe(true);
      expect(bank.getCurrentBalance()).toBe(100n);
      expect(bank.getTransactionCount()).toBe(1n);
      expect(bank.getAccountStatus()).toBe('active');
      expect(bank.getLastTransaction()).toBeTruthy(); // Transaction hash should exist

      bank.printState();
    });

    test('should fail to create account with insufficient deposit', () => {
      // Try to create account with $5 (below minimum of $10)
      expect(() => {
        bank.createAccount('1234', 5n);
      }).toThrow(); // Should fail assertion in circuit
    });

    test('should fail to create account twice', () => {
      // First account creation should succeed
      bank.createAccount('1234', 50n);
      expect(bank.isAccountCreated()).toBe(true);

      // Second attempt should fail
      expect(() => {
        bank.createAccount('5678', 100n);
      }).toThrow(); // Should fail "Account already exists" assertion
    });
  });

  describe('Deposits', () => {
    beforeEach(() => {
      // Create account before each deposit test
      bank.createAccount('1234', 50n);
    });

    test('should deposit funds successfully', () => {
      const initialBalance = bank.getCurrentBalance();
      const initialTxCount = bank.getTransactionCount();

      // Deposit $25
      bank.deposit('1234', 25n);

      // Verify deposit was processed
      expect(bank.getCurrentBalance()).toBe(initialBalance + 25n);
      expect(bank.getTransactionCount()).toBe(initialTxCount + 1n);
      expect(bank.getLastTransaction()).toBeTruthy(); // Transaction hash should exist

      bank.printState();
    });

    test('should fail deposit with wrong PIN', () => {
      expect(() => {
        bank.deposit('wrong', 25n); // Wrong PIN
      }).toThrow(); // Should fail authentication
    });

    test('should fail deposit with zero amount', () => {
      expect(() => {
        bank.deposit('1234', 0n); // Zero amount
      }).toThrow(); // Should fail "amount must be positive" assertion
    });

    test('should handle multiple deposits correctly', () => {
      const initialBalance = bank.getCurrentBalance(); // $50

      // Make three deposits
      bank.deposit('1234', 10n); // $60
      bank.deposit('1234', 20n); // $80  
      bank.deposit('1234', 15n); // $95

      expect(bank.getCurrentBalance()).toBe(initialBalance + 45n);
      expect(bank.getTransactionCount()).toBe(4n); // 1 create + 3 deposits

      bank.printState();
    });
  });

  describe('Balance Authentication', () => {
    beforeEach(() => {
      bank.createAccount('1234', 100n);
      bank.deposit('1234', 50n); // Balance: $150
    });

    test('should authenticate balance access with correct PIN', () => {
      // Current count should be 2 (create + deposit)
      expect(bank.getTransactionCount()).toBe(2n);

      // Authenticate balance access
      bank.authenticateBalanceAccess('1234');

      // Verify authentication was logged - count stays same but last_transaction updates
      expect(bank.getTransactionCount()).toBe(2n); // Counter not incremented in this circuit
      expect(bank.getLastTransaction()).toBeTruthy(); // Transaction hash should exist
      
      // Balance should remain unchanged
      expect(bank.getCurrentBalance()).toBe(150n);

      bank.printState();
    });

    test('should fail balance authentication with wrong PIN', () => {
      expect(() => {
        bank.authenticateBalanceAccess('wrong');
      }).toThrow(); // Should fail authentication
    });

    test('should fail balance authentication on non-existent account', () => {
      const freshBank = new BankTestSetup(); // No account created
      
      expect(() => {
        freshBank.authenticateBalanceAccess('1234');
      }).toThrow(); // Should fail "Account does not exist" assertion
    });
  });

  describe('Account Verification', () => {
    test('should verify account status for healthy account', () => {
      // Create account with sufficient balance ($20 > $5 minimum)
      bank.createAccount('1234', 20n);

      // Verify account status
      bank.verifyAccountStatus('1234');

      expect(bank.getAccountStatus()).toBe('verified');
      expect(bank.getCurrentBalance()).toBe(20n); // Balance unchanged

      bank.printState();
    });

    test('should fail verification for low balance account', () => {
      // Create account with minimum deposit ($10) but withdraw to make it insufficient for verification
      bank.createAccount('1234', 10n);
      bank.withdraw('1234', 8n); // Balance now $2, below $5 verification minimum

      expect(() => {
        bank.verifyAccountStatus('1234');
      }).toThrow(); // Should fail "Account balance too low for verification"
    });

    test('should fail verification with wrong PIN', () => {
      bank.createAccount('1234', 50n);

      expect(() => {
        bank.verifyAccountStatus('wrong');
      }).toThrow(); // Should fail authentication
    });

    test('should verify account with transaction history', () => {
      // Create account and make some transactions
      bank.createAccount('1234', 50n);
      bank.deposit('1234', 25n);
      bank.deposit('1234', 10n);

      // Should pass both balance and transaction count requirements
      bank.verifyAccountStatus('1234');

      expect(bank.getAccountStatus()).toBe('verified');
      expect(bank.getTransactionCount()).toBe(3n); // create + 2 deposits (verify doesn't increment)

      bank.printState();
    });
  });

  describe('Withdrawals', () => {
    beforeEach(() => {
      bank.createAccount('1234', 100n);
    });

    test('should withdraw funds successfully', () => {
      const initialBalance = bank.getCurrentBalance();
      const initialTxCount = bank.getTransactionCount();

      // Withdraw $30
      bank.withdraw('1234', 30n);

      // Verify withdrawal was processed
      expect(bank.getCurrentBalance()).toBe(initialBalance - 30n);
      expect(bank.getTransactionCount()).toBe(initialTxCount + 1n);
      expect(bank.getLastTransaction()).toBeTruthy(); // Transaction hash should exist

      bank.printState();
    });

    test('should fail withdrawal with insufficient funds', () => {
      // Try to withdraw more than balance ($150 > $100)
      expect(() => {
        bank.withdraw('1234', 150n);
      }).toThrow(); // Should fail "Insufficient funds" assertion
    });

    test('should fail withdrawal with wrong PIN', () => {
      expect(() => {
        bank.withdraw('wrong', 30n);
      }).toThrow(); // Should fail authentication
    });

    test('should fail withdrawal with zero amount', () => {
      expect(() => {
        bank.withdraw('1234', 0n);
      }).toThrow(); // Should fail "amount must be positive" assertion
    });

    test('should handle exact balance withdrawal', () => {
      // Withdraw entire balance
      bank.withdraw('1234', 100n);

      expect(bank.getCurrentBalance()).toBe(0n);
      expect(bank.getTransactionCount()).toBe(2n); // create + withdraw

      bank.printState();
    });
  });

  describe('Privacy Properties', () => {
    test('should maintain transaction history in private state', () => {
      bank.createAccount('1234', 100n);
      bank.deposit('1234', 50n);
      bank.withdraw('1234', 25n);

      const privateState = bank.getPrivateState();

      // Private state should contain transaction history (10 slots)
      expect(privateState.transactionHistory).toHaveLength(10);
      
      // First entry should be most recent transaction (withdrawal)
      expect(privateState.transactionHistory[0]).not.toEqual(new Uint8Array(32));
      
      // Should have account balance
      expect(privateState.accountBalance).toBe(125n);
      
      // Should have PIN hash
      expect(privateState.accountPinHash).toBeTruthy();
    });

    test('should handle full transaction history (10+ transactions)', () => {
      // Create account (1 transaction)
      bank.createAccount('1234', 1000n);
      
      // Add 9 more transactions to fill the history buffer
      bank.deposit('1234', 100n);    // 2nd transaction
      bank.withdraw('1234', 50n);    // 3rd transaction  
      bank.deposit('1234', 200n);    // 4th transaction
      bank.withdraw('1234', 75n);    // 5th transaction
      bank.deposit('1234', 150n);    // 6th transaction
      bank.withdraw('1234', 25n);    // 7th transaction
      bank.deposit('1234', 300n);    // 8th transaction
      bank.withdraw('1234', 100n);   // 9th transaction
      bank.deposit('1234', 250n);    // 10th transaction

      const privateState1 = bank.getPrivateState();
      
      // Should have exactly 10 transactions in history
      expect(privateState1.transactionHistory).toHaveLength(10);
      
      // All 10 slots should be filled (no empty transactions)
      const emptyTx = new Uint8Array(32);
      const nonEmptyCount = privateState1.transactionHistory.filter(tx => 
        !tx.every((byte, index) => byte === emptyTx[index])
      ).length;
      expect(nonEmptyCount).toBe(10);
      
      // Add one more transaction - should push oldest out
      bank.withdraw('1234', 50n);    // 11th transaction
      
      const privateState2 = bank.getPrivateState();
      
      // Still should have exactly 10 transactions
      expect(privateState2.transactionHistory).toHaveLength(10);
      
      // Latest transaction should be different from before (new withdrawal)
      expect(privateState2.transactionHistory[0]).not.toEqual(privateState1.transactionHistory[0]);
      
      // Second transaction should be what was first before (shifted right)
      expect(privateState2.transactionHistory[1]).toEqual(privateState1.transactionHistory[0]);
      
      // Final balance should be correct: 1000 + 100 - 50 + 200 - 75 + 150 - 25 + 300 - 100 + 250 - 50 = 1700
      expect(bank.getCurrentBalance()).toBe(1700n);
      expect(bank.getTransactionCount()).toBe(11n); // 11 total transactions
      
      bank.printState();
    });

    test('should store correct transaction hashes in history', () => {
      // Perform transactions in known order and capture state after each
      bank.createAccount('1234', 100n);  
      const stateAfterCreate = bank.getPrivateState();
      const createHash = stateAfterCreate.transactionHistory[0]; // Account creation hash

      bank.deposit('1234', 50n);         
      const stateAfterDeposit = bank.getPrivateState();
      const depositHash = stateAfterDeposit.transactionHistory[0]; // Deposit hash

      bank.withdraw('1234', 25n);        
      const finalState = bank.getPrivateState();
      const withdrawalHash = finalState.transactionHistory[0]; // Withdrawal hash

      // History should be: [withdrawal, deposit, account_created, empty, empty, ...]
      expect(finalState.transactionHistory[0]).toEqual(withdrawalHash);  // Most recent
      expect(finalState.transactionHistory[1]).toEqual(depositHash);     // Second most recent  
      expect(finalState.transactionHistory[2]).toEqual(createHash);      // First transaction

      // Verify transactions are different (each has unique hash)
      expect(withdrawalHash).not.toEqual(depositHash);
      expect(depositHash).not.toEqual(createHash);
      expect(withdrawalHash).not.toEqual(createHash);

      // Remaining slots should be empty
      const emptyTx = new Uint8Array(32);
      for (let i = 3; i < 10; i++) {
        expect(finalState.transactionHistory[i]).toEqual(emptyTx);
      }

      // Verify none of the transaction hashes are empty
      expect(withdrawalHash).not.toEqual(emptyTx);
      expect(depositHash).not.toEqual(emptyTx);  
      expect(createHash).not.toEqual(emptyTx);

      console.log('🔍 Transaction History Verification:');
      console.log('├─ [0] Latest (withdrawal):', Array.from(finalState.transactionHistory[0].slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(''));
      console.log('├─ [1] Deposit:', Array.from(finalState.transactionHistory[1].slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(''));
      console.log('└─ [2] Account created:', Array.from(finalState.transactionHistory[2].slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(''));
    });

    test('should access specific transaction details from user\'s local log', () => {
      // User wants to track specific transaction details
      bank.createAccount('1234', 1000n);     // $1000 initial
      bank.deposit('1234', 250n);            // +$250 = $1250  
      bank.withdraw('1234', 75n);            // -$75 = $1175
      bank.deposit('1234', 500n);            // +$500 = $1675

      // User can access their detailed transaction history
      const detailedHistory = bank.getDetailedTransactionHistory();
      
      // Verify specific transaction details
      expect(detailedHistory).toHaveLength(4);
      
      // Test first transaction (account creation)
      const createTx = detailedHistory[0];
      expect(createTx.type).toBe('create');
      expect(createTx.amount).toBe(1000n);
      expect(createTx.balanceAfter).toBe(1000n);
      
      // Test second transaction (first deposit)
      const depositTx1 = detailedHistory[1];
      expect(depositTx1.type).toBe('deposit');
      expect(depositTx1.amount).toBe(250n);
      expect(depositTx1.balanceAfter).toBe(1250n);
      
      // Test third transaction (withdrawal)
      const withdrawTx = detailedHistory[2];
      expect(withdrawTx.type).toBe('withdraw');
      expect(withdrawTx.amount).toBe(75n);
      expect(withdrawTx.balanceAfter).toBe(1175n);
      
      // Test fourth transaction (second deposit)
      const depositTx2 = detailedHistory[3];
      expect(depositTx2.type).toBe('deposit');
      expect(depositTx2.amount).toBe(500n);
      expect(depositTx2.balanceAfter).toBe(1675n);
      
      // User can filter by transaction type
      const deposits = bank.getTransactionsByType('deposit');
      expect(deposits).toHaveLength(2);
      expect(deposits[0].amount).toBe(250n);
      expect(deposits[1].amount).toBe(500n);
      
      // User can get total amounts by type
      const totalDeposited = bank.getTotalAmountByType('deposit');
      const totalWithdrawn = bank.getTotalAmountByType('withdraw');
      expect(totalDeposited).toBe(750n); // 250 + 500
      expect(totalWithdrawn).toBe(75n);
      
      // User can access specific transaction details
      const specificTx = bank.getTransactionDetails(2); // withdrawal
      expect(specificTx?.type).toBe('withdraw');
      expect(specificTx?.amount).toBe(75n);
      
      // Print detailed history for user
      bank.printDetailedHistory();
      
      console.log('💡 Key Insight: Users maintain their own detailed log while contract only stores privacy-preserving hashes!');
    });

    test('should keep balance private in ledger state', () => {
        bank.createAccount('1234', 100n);
      bank.deposit('1234', 50n);

      const ledger = bank.getLedgerState();

      // Public ledger should NOT contain actual balance
      expect(ledger).not.toHaveProperty('balance');
      expect(ledger).not.toHaveProperty('accountBalance');

      // But private state should contain balance
      expect(bank.getCurrentBalance()).toBe(150n);
    });

    test('should keep PIN private in ledger state', () => {
      bank.createAccount('1234', 100n);

      const ledger = bank.getLedgerState();

      // Public ledger should NOT contain actual PIN
      expect(ledger).not.toHaveProperty('pin');
      expect(ledger).not.toHaveProperty('accountPin');

      // Only hashed owner ID should be public
      expect(ledger.account_owner).toBeDefined();
    });

    test('should only reveal transaction metadata', () => {
      bank.createAccount('1234', 100n);
      bank.deposit('1234', 50n);
      bank.withdraw('1234', 25n);

      const ledger = bank.getLedgerState();

      // Should have transaction count but not amounts
      expect(ledger.transaction_count).toBe(3n);
      expect(ledger.last_transaction).toBeDefined();

      // Should not reveal transaction amounts
      expect(ledger).not.toHaveProperty('depositAmount');
      expect(ledger).not.toHaveProperty('withdrawAmount');
    });
  });

  describe('Error Handling', () => {
    test('should handle operations on non-existent account', () => {
      const freshBank = new BankTestSetup();

      // All operations should fail on non-existent account
      expect(() => freshBank.deposit('1234', 50n)).toThrow();
      expect(() => freshBank.withdraw('1234', 50n)).toThrow();
      expect(() => freshBank.authenticateBalanceAccess('1234')).toThrow();
      expect(() => freshBank.verifyAccountStatus('1234')).toThrow();
    });

    test('should maintain state consistency after failed operations', () => {
      bank.createAccount('1234', 100n);
      const initialBalance = bank.getCurrentBalance();
      const initialTxCount = bank.getTransactionCount();

      // Try invalid operations
      try { bank.withdraw('1234', 200n); } catch {}  // Insufficient funds
      try { bank.deposit('wrong', 50n); } catch {}   // Wrong PIN

      // State should be unchanged
      expect(bank.getCurrentBalance()).toBe(initialBalance);
      expect(bank.getTransactionCount()).toBe(initialTxCount);

      bank.printState();
    });
  });
});