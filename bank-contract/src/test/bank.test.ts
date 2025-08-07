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