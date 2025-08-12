import { describe, test, expect, beforeEach } from 'vitest';
import { BankTestSetup } from './bank-setup.js';

describe('Midnight Shared Bank Contract Tests', () => {
  let bank: BankTestSetup;

  beforeEach(() => {
    bank = new BankTestSetup();
  });

  describe('Shared Bank Architecture', () => {
    test('should initialize empty shared bank', () => {
      expect(bank.getTotalAccounts()).toBe(0n);
      expect(bank.getAllUsers()).toHaveLength(0);
      
      bank.printSharedBankState();
    });

    test('should track multiple users in same contract', () => {
      // Create accounts for multiple users
      bank.createAccount('alice', '1111', 100n);
      bank.createAccount('bob', '2222', 200n);
      bank.createAccount('charlie', '3333', 150n);

      // Verify shared contract state
      expect(bank.getTotalAccounts()).toBe(3n);
      expect(bank.getAllUsers()).toHaveLength(3);
      expect(bank.getAllUsers()).toContain('alice');
      expect(bank.getAllUsers()).toContain('bob');
      expect(bank.getAllUsers()).toContain('charlie');

      bank.printAllUsersOverview();
    });
  });

  describe('Account Creation (Shared Contract)', () => {
    test('should create account for user alice successfully', () => {
      // Create account for alice
      bank.createAccount('alice', '1234', 100n);

      // Verify alice's account
      expect(bank.hasAccount('alice')).toBe(true);
      expect(bank.getUserBalance('alice')).toBe(100n);
      expect(bank.getTotalAccounts()).toBe(1n);

      bank.printUserState('alice');
    });

    test('should create multiple user accounts', () => {
      // Create accounts for different users
      bank.createAccount('alice', '1111', 50n);
      bank.createAccount('bob', '2222', 75n);

      // Verify both accounts exist
      expect(bank.hasAccount('alice')).toBe(true);
      expect(bank.hasAccount('bob')).toBe(true);
      expect(bank.getUserBalance('alice')).toBe(50n);
      expect(bank.getUserBalance('bob')).toBe(75n);
      expect(bank.getTotalAccounts()).toBe(2n);

      bank.printAllUsersOverview();
    });

    test('should fail to create account with insufficient deposit', () => {
      expect(() => {
        bank.createAccount('alice', '1234', 5n); // Below minimum of 10
      }).toThrow();
    });

    test('should fail to create duplicate account for same user', () => {
      // First account creation should succeed
      bank.createAccount('alice', '1234', 50n);
      expect(bank.hasAccount('alice')).toBe(true);

      // Second attempt for same user should fail
      expect(() => {
        bank.createAccount('alice', '5678', 100n);
      }).toThrow(); // Should fail "Account already exists" assertion
    });
  });

  describe('Individual User Operations', () => {
    beforeEach(() => {
      // Setup multiple users
      bank.createAccount('alice', '1111', 100n);
      bank.createAccount('bob', '2222', 200n);
    });

    test('should handle deposits for specific users', () => {
      // Alice deposits
      bank.deposit('alice', '1111', 50n);
      expect(bank.getUserBalance('alice')).toBe(150n);
      expect(bank.getUserBalance('bob')).toBe(200n); // Bob unchanged

      // Bob deposits  
      bank.deposit('bob', '2222', 25n);
      expect(bank.getUserBalance('alice')).toBe(150n); // Alice unchanged
      expect(bank.getUserBalance('bob')).toBe(225n);

      bank.printAllUsersOverview();
    });

    test('should handle withdrawals for specific users', () => {
      // Alice withdraws
      bank.withdraw('alice', '1111', 30n);
      expect(bank.getUserBalance('alice')).toBe(70n);
      expect(bank.getUserBalance('bob')).toBe(200n); // Bob unchanged

      // Bob withdraws
      bank.withdraw('bob', '2222', 50n);
      expect(bank.getUserBalance('alice')).toBe(70n); // Alice unchanged
      expect(bank.getUserBalance('bob')).toBe(150n);

      bank.printAllUsersOverview();
    });

    test('should fail operations with wrong PIN', () => {
      // Alice tries to deposit with Bob's PIN
      expect(() => {
        bank.deposit('alice', '2222', 50n); // Wrong PIN
      }).toThrow();

      // Bob tries to withdraw with Alice's PIN
      expect(() => {
        bank.withdraw('bob', '1111', 25n); // Wrong PIN
      }).toThrow();
    });

    test('should authenticate balance access per user', () => {
      // Each user can authenticate their own balance
      expect(() => {
        bank.authenticateBalanceAccess('alice', '1111');
      }).not.toThrow();

      expect(() => {
        bank.authenticateBalanceAccess('bob', '2222');
      }).not.toThrow();

      // Users cannot authenticate with wrong PIN
      expect(() => {
        bank.authenticateBalanceAccess('alice', '2222'); // Wrong PIN
      }).toThrow();
    });
  });

  describe('Inter-User Transfers (NEW FEATURE)', () => {
    beforeEach(() => {
      // Setup users with initial balances
      bank.createAccount('alice', '1111', 100n);
      bank.createAccount('bob', '2222', 50n);
      bank.createAccount('charlie', '3333', 200n);
    });

    test('should transfer funds between users successfully', () => {
      const initialAliceBalance = bank.getUserBalance('alice');
      const initialBobBalance = bank.getUserBalance('bob');

      // Alice transfers $30 to Bob
      bank.transferBetweenUsers('alice', '1111', 'bob', 30n);

      // Verify balances updated correctly
      expect(bank.getUserBalance('alice')).toBe(initialAliceBalance - 30n); // 70
      expect(bank.getUserBalance('bob')).toBe(initialBobBalance + 30n);     // 80

      // Check transaction histories
      const aliceHistory = bank.getUserTransactionHistory('alice');
      const bobHistory = bank.getUserTransactionHistory('bob');

      // Alice should have transfer_out record
      const aliceTransfer = aliceHistory.find(tx => tx.type === 'transfer_out');
      expect(aliceTransfer).toBeDefined();
      expect(aliceTransfer?.amount).toBe(30n);
      expect(aliceTransfer?.counterparty).toBe('bob');

      // Bob should have transfer_in record
      const bobTransfer = bobHistory.find(tx => tx.type === 'transfer_in');
      expect(bobTransfer).toBeDefined();
      expect(bobTransfer?.amount).toBe(30n);
      expect(bobTransfer?.counterparty).toBe('alice');

      bank.printAllUsersOverview();
    });

    test('should handle multiple transfers correctly', () => {
      // Alice -> Bob: $25
      bank.transferBetweenUsers('alice', '1111', 'bob', 25n);
      
      // Bob -> Charlie: $30  
      bank.transferBetweenUsers('bob', '2222', 'charlie', 30n);
      
      // Charlie -> Alice: $50
      bank.transferBetweenUsers('charlie', '3333', 'alice', 50n);

      // Final balances: Alice: 100 - 25 + 50 = 125, Bob: 50 + 25 - 30 = 45, Charlie: 200 + 30 - 50 = 180
      expect(bank.getUserBalance('alice')).toBe(125n);
      expect(bank.getUserBalance('bob')).toBe(45n);
      expect(bank.getUserBalance('charlie')).toBe(180n);

      // Print detailed histories
      bank.printUserDetailedHistory('alice');
      bank.printUserDetailedHistory('bob');
      bank.printUserDetailedHistory('charlie');
    });

    test('should fail transfer with insufficient funds', () => {
      // Alice tries to transfer more than her balance ($150 > $100)
      expect(() => {
        bank.transferBetweenUsers('alice', '1111', 'bob', 150n);
      }).toThrow(); // Should fail "Insufficient funds for transfer"
    });

    test('should fail transfer with wrong PIN', () => {
      expect(() => {
        bank.transferBetweenUsers('alice', '2222', 'bob', 30n); // Wrong PIN
      }).toThrow(); // Should fail authentication
    });

    test('should fail transfer to non-existent user', () => {
      expect(() => {
        bank.transferBetweenUsers('alice', '1111', 'david', 30n); // David doesn't exist
      }).toThrow(); // Should fail "Recipient account does not exist"
    });

    test('should fail transfer from non-existent user', () => {
      expect(() => {
        bank.transferBetweenUsers('david', '1111', 'bob', 30n); // David doesn't exist
      }).toThrow(); // Should fail "Sender account does not exist"
    });

    test('should fail self-transfer', () => {
      expect(() => {
        bank.transferBetweenUsers('alice', '1111', 'alice', 30n); // Self-transfer
      }).toThrow(); // Should fail "Cannot transfer to yourself"
    });

    test('should fail transfer with zero amount', () => {
      expect(() => {
        bank.transferBetweenUsers('alice', '1111', 'bob', 0n); // Zero amount
      }).toThrow(); // Should fail "Transfer amount must be positive"
    });

    test('should track transfer statistics per user', () => {
      // Setup some transfers
      bank.transferBetweenUsers('alice', '1111', 'bob', 30n);     // Alice sends $30
      bank.transferBetweenUsers('charlie', '3333', 'alice', 40n); // Alice receives $40
      bank.transferBetweenUsers('alice', '1111', 'charlie', 20n); // Alice sends $20

      // Check Alice's transfer statistics
      const aliceTransfersOut = bank.getUserTransactionsByType('alice', 'transfer_out');
      const aliceTransfersIn = bank.getUserTransactionsByType('alice', 'transfer_in');
      
      expect(aliceTransfersOut).toHaveLength(2); // 2 outgoing transfers
      expect(aliceTransfersIn).toHaveLength(1);  // 1 incoming transfer

      const totalSent = bank.getUserTotalAmountByType('alice', 'transfer_out');
      const totalReceived = bank.getUserTotalAmountByType('alice', 'transfer_in');
      
      expect(totalSent).toBe(50n);  // 30 + 20
      expect(totalReceived).toBe(40n); // 40

      // Alice's final balance: 100 - 30 + 40 - 20 = 90
      expect(bank.getUserBalance('alice')).toBe(90n);

      console.log('💸 Alice Transfer Summary:');
      console.log('├─ Total Sent: $' + totalSent.toString());
      console.log('├─ Total Received: $' + totalReceived.toString());
      console.log('└─ Net Transfer: $' + (totalReceived - totalSent).toString());
    });
  });

  describe('Privacy and Security (Shared Contract)', () => {
    beforeEach(() => {
      bank.createAccount('alice', '1111', 100n);
      bank.createAccount('bob', '2222', 200n);
    });

    test('should maintain user isolation', () => {
      // Alice makes transactions
      bank.deposit('alice', '1111', 50n);
      bank.withdraw('alice', '1111', 25n);

      // Bob makes transactions  
      bank.deposit('bob', '2222', 30n);

      // Each user should only see their own transaction history
      const aliceHistory = bank.getUserTransactionHistory('alice');
      const bobHistory = bank.getUserTransactionHistory('bob');

      expect(aliceHistory).toHaveLength(3); // create + deposit + withdraw
      expect(bobHistory).toHaveLength(2);   // create + deposit

      // Alice's history should not contain Bob's transactions
      const aliceTransactionTypes = aliceHistory.map(tx => tx.type);
      expect(aliceTransactionTypes).toEqual(['create', 'deposit', 'withdraw']);

      const bobTransactionTypes = bobHistory.map(tx => tx.type);
      expect(bobTransactionTypes).toEqual(['create', 'deposit']);
    });

    test('should keep individual balances private', () => {
      // Users can only access their own balances
      expect(bank.getUserBalance('alice')).toBe(100n);
      expect(bank.getUserBalance('bob')).toBe(200n);

      // After Alice's transaction, only her balance changes
      bank.deposit('alice', '1111', 75n);
      expect(bank.getUserBalance('alice')).toBe(175n);
      expect(bank.getUserBalance('bob')).toBe(200n); // Unchanged
    });

    test('should require PIN authentication per user', () => {
      // Each user must use their own PIN
      expect(() => {
        bank.withdraw('alice', '2222', 25n); // Alice using Bob's PIN
      }).toThrow();

      expect(() => {
        bank.deposit('bob', '1111', 30n); // Bob using Alice's PIN
      }).toThrow();

      // Correct PINs work
      expect(() => {
        bank.deposit('alice', '1111', 25n);
        bank.withdraw('bob', '2222', 30n);
      }).not.toThrow();
    });
  });

  describe('Advanced Transfer Scenarios', () => {
    beforeEach(() => {
      // Setup multiple users with different balances
      bank.createAccount('alice', '1111', 1000n);
      bank.createAccount('bob', '2222', 500n);
      bank.createAccount('charlie', '3333', 750n);
      bank.createAccount('diana', '4444', 300n);
    });

    test('should handle round-robin transfers', () => {
      // Each person sends $100 to the next person in sequence
      bank.transferBetweenUsers('alice', '1111', 'bob', 100n);      // Alice -> Bob
      bank.transferBetweenUsers('bob', '2222', 'charlie', 100n);    // Bob -> Charlie  
      bank.transferBetweenUsers('charlie', '3333', 'diana', 100n);  // Charlie -> Diana
      bank.transferBetweenUsers('diana', '4444', 'alice', 100n);    // Diana -> Alice

      // Final balances should be same as initial (net zero transfers)
      expect(bank.getUserBalance('alice')).toBe(1000n);   // 1000 - 100 + 100 = 1000
      expect(bank.getUserBalance('bob')).toBe(500n);      // 500 + 100 - 100 = 500
      expect(bank.getUserBalance('charlie')).toBe(750n);  // 750 + 100 - 100 = 750
      expect(bank.getUserBalance('diana')).toBe(300n);    // 300 + 100 - 100 = 300

      bank.printAllUsersOverview();
    });

    test('should handle payment splitting scenario', () => {
      // Alice pays for dinner and others split the cost
      const dinnerCost = 240n; // $240 total
      const perPersonCost = 60n; // $60 each (4 people)

      // Everyone pays Alice their share
      bank.transferBetweenUsers('bob', '2222', 'alice', perPersonCost);
      bank.transferBetweenUsers('charlie', '3333', 'alice', perPersonCost);
      bank.transferBetweenUsers('diana', '4444', 'alice', perPersonCost);

      // Alice's balance: 1000 + 60 + 60 + 60 - 240 (for dinner) = 940
      // But we're not deducting the dinner cost since that's external
      expect(bank.getUserBalance('alice')).toBe(1180n); // 1000 + 3*60

      // Others' balances
      expect(bank.getUserBalance('bob')).toBe(440n);     // 500 - 60
      expect(bank.getUserBalance('charlie')).toBe(690n); // 750 - 60  
      expect(bank.getUserBalance('diana')).toBe(240n);   // 300 - 60

      console.log('🍽️ Dinner Payment Split Complete:');
      bank.printAllUsersOverview();
    });

    test('should handle gradual savings transfer', () => {
      // Alice gradually transfers savings to a shared account (Charlie acts as savings)
      const weeklyTransfer = 50n;
      
      // 4 weeks of transfers
      for (let week = 1; week <= 4; week++) {
        bank.transferBetweenUsers('alice', '1111', 'charlie', weeklyTransfer);
        console.log(`Week ${week}: Alice transferred $${weeklyTransfer} to savings`);
      }

      // Alice's balance: 1000 - 4*50 = 800
      expect(bank.getUserBalance('alice')).toBe(800n);
      
      // Charlie's balance (acting as savings): 750 + 4*50 = 950
      expect(bank.getUserBalance('charlie')).toBe(950n);

      // Check Alice has 4 transfer_out transactions
      const aliceTransfers = bank.getUserTransactionsByType('alice', 'transfer_out');
      expect(aliceTransfers).toHaveLength(4);
      expect(bank.getUserTotalAmountByType('alice', 'transfer_out')).toBe(200n);

      bank.printUserDetailedHistory('alice');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    beforeEach(() => {
      bank.createAccount('alice', '1111', 100n);
      bank.createAccount('bob', '2222', 50n);
    });

    test('should maintain state consistency after failed operations', () => {
      const initialAliceBalance = bank.getUserBalance('alice');
      const initialBobBalance = bank.getUserBalance('bob');

      // Try invalid operations
      try { bank.transferBetweenUsers('alice', '1111', 'bob', 200n); } catch {} // Insufficient funds
      try { bank.transferBetweenUsers('alice', '2222', 'bob', 30n); } catch {}  // Wrong PIN
      try { bank.withdraw('alice', '1111', 150n); } catch {}                   // Insufficient funds
      try { bank.deposit('bob', '1111', 25n); } catch {}                       // Wrong PIN

      // Balances should be unchanged
      expect(bank.getUserBalance('alice')).toBe(initialAliceBalance);
      expect(bank.getUserBalance('bob')).toBe(initialBobBalance);

      bank.printAllUsersOverview();
    });

    test('should handle operations on non-existent users', () => {
      // All operations should fail on non-existent users
      expect(() => bank.deposit('charlie', '3333', 50n)).toThrow();
      expect(() => bank.withdraw('charlie', '3333', 50n)).toThrow();
      expect(() => bank.authenticateBalanceAccess('charlie', '3333')).toThrow();
      expect(() => bank.verifyAccountStatus('charlie', '3333')).toThrow();
      expect(() => bank.transferBetweenUsers('charlie', '3333', 'alice', 50n)).toThrow();
      expect(() => bank.transferBetweenUsers('alice', '1111', 'charlie', 50n)).toThrow();
    });

    test('should verify account status per user', () => {
      // Create accounts with sufficient balances
      bank.createAccount('eve', '5555', 20n); // Above $5 minimum for verification

      // Each user can verify their own account
      expect(() => {
        bank.verifyAccountStatus('alice', '1111');
        bank.verifyAccountStatus('bob', '2222');
        bank.verifyAccountStatus('eve', '5555');
      }).not.toThrow();

      // Users cannot verify with wrong PIN
      expect(() => {
        bank.verifyAccountStatus('alice', '2222'); // Wrong PIN
      }).toThrow();
    });
  });

  describe('Global Bank Statistics', () => {
    test('should track global bank metrics', () => {
      // Start with empty bank
      expect(bank.getTotalAccounts()).toBe(0n);

      // Add multiple users
      bank.createAccount('alice', '1111', 100n);
      expect(bank.getTotalAccounts()).toBe(1n);

      bank.createAccount('bob', '2222', 200n);
      expect(bank.getTotalAccounts()).toBe(2n);

      bank.createAccount('charlie', '3333', 150n);
      expect(bank.getTotalAccounts()).toBe(3n);

      // Verify global state
      expect(bank.getAllUsers()).toHaveLength(3);
      expect(bank.getLastGlobalTransaction()).toBeTruthy();

      bank.printSharedBankState();
    });

    test('should demonstrate shared contract efficiency', () => {
      console.log('\n🎯 Shared Contract Benefits:');
      console.log('├─ Single deployment for all users');
      console.log('├─ Atomic transfers between users');
      console.log('├─ Global state consistency');
      console.log('├─ Reduced gas costs per user');
      console.log('└─ Simplified state management');

      // Create multiple users and do transfers
      bank.createAccount('alice', '1111', 1000n);
      bank.createAccount('bob', '2222', 500n);
      bank.createAccount('charlie', '3333', 250n);

      // Perform atomic transfer
      bank.transferBetweenUsers('alice', '1111', 'bob', 100n);

      console.log('\n💡 Transfer completed atomically in single contract!');
      bank.printAllUsersOverview();
    });
  });
});