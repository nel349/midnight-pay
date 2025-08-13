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


  describe('Error Handling and Edge Cases', () => {
    beforeEach(() => {
      bank.createAccount('alice', '1111', 100n);
      bank.createAccount('bob', '2222', 50n);
    });

    test('should maintain state consistency after failed operations', () => {
      const initialAliceBalance = bank.getUserBalance('alice');
      const initialBobBalance = bank.getUserBalance('bob');

      // Try invalid operations
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
      expect(() => bank.requestTransferAuthorization('charlie', 'alice', '3333')).toThrow();
      expect(() => bank.sendToAuthorizedUser('alice', 'charlie', 50n, '1111')).toThrow();
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

  describe('Zelle-like Authorization System (NEW FEATURE)', () => {
    beforeEach(() => {
      // Setup users for authorization testing
      bank.createAccount('alice', '1111', 500n);
      bank.createAccount('bob', '2222', 300n);
      bank.createAccount('charlie', '3333', 400n);
    });

    test('should complete full authorization workflow successfully', () => {
      // Step 1: Alice requests authorization to send to Bob
      expect(() => {
        bank.requestTransferAuthorization('alice', 'bob', '1111');
      }).not.toThrow();

      // Step 2: Bob approves Alice's request with a $100 limit
      expect(() => {
        bank.approveTransferAuthorization('bob', 'alice', '2222', 100n);
      }).not.toThrow();

      // Step 3: Alice can now send to Bob (within limit)
      const initialAliceBalance = bank.getUserBalance('alice');
      const initialBobBalance = bank.getUserBalance('bob');

      expect(() => {
        bank.sendToAuthorizedUser('alice', 'bob', 50n, '1111');
      }).not.toThrow();

      // Verify balances (Alice's balance reduced, but note: recipient balance update is lazy)
      expect(bank.getUserBalance('alice')).toBe(initialAliceBalance - 50n);
      
      // Check transaction history
      const aliceHistory = bank.getUserTransactionHistory('alice');
      const aliceAuthRequest = aliceHistory.find(tx => tx.type === 'auth_request');
      const aliceAuthTransfer = aliceHistory.find(tx => tx.type === 'auth_transfer');
      
      expect(aliceAuthRequest).toBeDefined();
      expect(aliceAuthRequest?.counterparty).toBe('bob');
      expect(aliceAuthTransfer).toBeDefined();
      expect(aliceAuthTransfer?.amount).toBe(50n);
      expect(aliceAuthTransfer?.counterparty).toBe('bob');

      const bobHistory = bank.getUserTransactionHistory('bob');
      const bobAuthApproval = bobHistory.find(tx => tx.type === 'auth_approve');
      
      expect(bobAuthApproval).toBeDefined();
      expect(bobAuthApproval?.counterparty).toBe('alice');
      expect(bobAuthApproval?.maxAmount).toBe(100n);

      bank.printAllUsersOverview();
      console.log('✅ Authorization workflow completed successfully!');
    });

    test('should allow multiple transfers within authorization limit', () => {
      // Setup authorization: Bob allows Alice to send up to $150
      bank.requestTransferAuthorization('alice', 'bob', '1111');
      bank.approveTransferAuthorization('bob', 'alice', '2222', 150n);

      const initialAliceBalance = bank.getUserBalance('alice');

      // Alice makes multiple transfers within limit
      bank.sendToAuthorizedUser('alice', 'bob', 30n, '1111');  // Total: $30
      bank.sendToAuthorizedUser('alice', 'bob', 40n, '1111');  // Total: $70
      bank.sendToAuthorizedUser('alice', 'bob', 50n, '1111');  // Total: $120

      // Verify Alice's balance reduced by total amount
      expect(bank.getUserBalance('alice')).toBe(initialAliceBalance - 120n);

      // Check Alice has 3 auth_transfer transactions
      const aliceAuthTransfers = bank.getUserTransactionsByType('alice', 'auth_transfer');
      expect(aliceAuthTransfers).toHaveLength(3);
      expect(bank.getUserTotalAmountByType('alice', 'auth_transfer')).toBe(120n);

      bank.printUserDetailedHistory('alice');
    });

    test('should fail transfer exceeding authorization limit', () => {
      // Setup authorization: Bob allows Alice to send up to $75
      bank.requestTransferAuthorization('alice', 'bob', '1111');
      bank.approveTransferAuthorization('bob', 'alice', '2222', 75n);

      // Alice tries to send more than authorized limit
      expect(() => {
        bank.sendToAuthorizedUser('alice', 'bob', 100n, '1111'); // Exceeds $75 limit
      }).toThrow(); // Should fail "Amount exceeds authorized limit"
    });

    test('should fail transfer without authorization', () => {
      // Alice tries to send to Bob without authorization
      expect(() => {
        bank.sendToAuthorizedUser('alice', 'bob', 50n, '1111');
      }).toThrow(); // Should fail "No authorization - recipient must approve first"
    });

    test('should fail authorization request with wrong PIN', () => {
      expect(() => {
        bank.requestTransferAuthorization('alice', 'bob', '2222'); // Wrong PIN
      }).toThrow(); // Should fail authentication
    });

    test('should fail authorization approval with wrong PIN', () => {
      // Alice requests authorization
      bank.requestTransferAuthorization('alice', 'bob', '1111');

      // Bob tries to approve with wrong PIN
      expect(() => {
        bank.approveTransferAuthorization('bob', 'alice', '1111', 100n); // Wrong PIN
      }).toThrow(); // Should fail authentication
    });

    test('should fail self-authorization', () => {
      expect(() => {
        bank.requestTransferAuthorization('alice', 'alice', '1111'); // Self-authorization
      }).toThrow(); // Should fail "Cannot authorize yourself"
    });

    test('should fail authorization to non-existent user', () => {
      expect(() => {
        bank.requestTransferAuthorization('alice', 'david', '1111'); // David doesn't exist
      }).toThrow(); // Should fail "Recipient account does not exist"
    });

    test('should fail authorization approval without pending request', () => {
      // Bob tries to approve Alice without a pending request
      expect(() => {
        bank.approveTransferAuthorization('bob', 'alice', '2222', 100n);
      }).toThrow(); // Should fail "No pending authorization request"
    });

    test('should handle bidirectional authorization', () => {
      // Alice authorizes Bob AND Bob authorizes Alice
      
      // Alice -> Bob authorization
      bank.requestTransferAuthorization('alice', 'bob', '1111');
      bank.approveTransferAuthorization('bob', 'alice', '2222', 80n);
      
      // Bob -> Alice authorization  
      bank.requestTransferAuthorization('bob', 'alice', '2222');
      bank.approveTransferAuthorization('alice', 'bob', '1111', 120n);

      const initialAliceBalance = bank.getUserBalance('alice');
      const initialBobBalance = bank.getUserBalance('bob');

      // Both users can now send to each other
      bank.sendToAuthorizedUser('alice', 'bob', 60n, '1111');   // Alice -> Bob: $60
      bank.sendToAuthorizedUser('bob', 'alice', 90n, '2222');   // Bob -> Alice: $90

      // Verify balances
      expect(bank.getUserBalance('alice')).toBe(initialAliceBalance - 60n);
      expect(bank.getUserBalance('bob')).toBe(initialBobBalance - 90n);

      // Check transaction counts
      const aliceAuthTransfers = bank.getUserTransactionsByType('alice', 'auth_transfer');
      const bobAuthTransfers = bank.getUserTransactionsByType('bob', 'auth_transfer');
      
      expect(aliceAuthTransfers).toHaveLength(1);
      expect(bobAuthTransfers).toHaveLength(1);

      console.log('🔄 Bidirectional authorization completed!');
      bank.printAllUsersOverview();
    });

    test('should support multiple authorization relationships', () => {
      // Create a network of authorizations:
      // Alice can send to Bob ($100) and Charlie ($150)  
      // Bob can send to Charlie ($75)

      // Alice -> Bob
      bank.requestTransferAuthorization('alice', 'bob', '1111');
      bank.approveTransferAuthorization('bob', 'alice', '2222', 100n);

      // Alice -> Charlie
      bank.requestTransferAuthorization('alice', 'charlie', '1111');
      bank.approveTransferAuthorization('charlie', 'alice', '3333', 150n);

      // Bob -> Charlie
      bank.requestTransferAuthorization('bob', 'charlie', '2222');
      bank.approveTransferAuthorization('charlie', 'bob', '3333', 75n);

      // Execute transfers
      bank.sendToAuthorizedUser('alice', 'bob', 80n, '1111');      // Alice -> Bob: $80
      bank.sendToAuthorizedUser('alice', 'charlie', 120n, '1111'); // Alice -> Charlie: $120
      bank.sendToAuthorizedUser('bob', 'charlie', 60n, '2222');    // Bob -> Charlie: $60

      // Final balances: Alice: 500-80-120=300, Bob: 300-60=240
      expect(bank.getUserBalance('alice')).toBe(300n);
      expect(bank.getUserBalance('bob')).toBe(240n);

      // Verify each user has correct number of auth transfers
      expect(bank.getUserTransactionsByType('alice', 'auth_transfer')).toHaveLength(2);
      expect(bank.getUserTransactionsByType('bob', 'auth_transfer')).toHaveLength(1);
      expect(bank.getUserTransactionsByType('charlie', 'auth_transfer')).toHaveLength(0);

      console.log('🌐 Multi-user authorization network completed!');
      bank.printAllUsersOverview();
    });

    test('should track authorization statistics', () => {
      // Setup multiple authorizations
      bank.requestTransferAuthorization('alice', 'bob', '1111');
      bank.approveTransferAuthorization('bob', 'alice', '2222', 200n);
      
      bank.requestTransferAuthorization('alice', 'charlie', '1111');
      bank.approveTransferAuthorization('charlie', 'alice', '3333', 300n);

      // Make transfers
      bank.sendToAuthorizedUser('alice', 'bob', 50n, '1111');
      bank.sendToAuthorizedUser('alice', 'bob', 30n, '1111');
      bank.sendToAuthorizedUser('alice', 'charlie', 100n, '1111');

      // Analyze Alice's authorization activity
      const aliceAuthRequests = bank.getUserTransactionsByType('alice', 'auth_request');
      const aliceAuthTransfers = bank.getUserTransactionsByType('alice', 'auth_transfer');
      const totalAuthTransferAmount = bank.getUserTotalAmountByType('alice', 'auth_transfer');

      expect(aliceAuthRequests).toHaveLength(2);   // 2 authorization requests
      expect(aliceAuthTransfers).toHaveLength(3);  // 3 authorized transfers
      expect(totalAuthTransferAmount).toBe(180n);  // $50 + $30 + $100

      console.log('📊 Authorization Statistics:');
      console.log('├─ Alice made', aliceAuthRequests.length, 'authorization requests');
      console.log('├─ Alice made', aliceAuthTransfers.length, 'authorized transfers');
      console.log('└─ Total amount transferred: $' + totalAuthTransferAmount.toString());

      bank.printUserDetailedHistory('alice');
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
      console.log('├─ Zelle-like authorization system');
      console.log('├─ Global state consistency');
      console.log('├─ Reduced gas costs per user');
      console.log('└─ Simplified state management');

      // Create multiple users and demonstrate authorization
      bank.createAccount('alice', '1111', 1000n);
      bank.createAccount('bob', '2222', 500n);
      bank.createAccount('charlie', '3333', 250n);

      console.log('\n💡 Shared contract supports multiple users with authorization system!');
      bank.printAllUsersOverview();
    });

    test('should demonstrate Zelle-like authorization benefits', () => {
      console.log('\n🎯 Zelle-like Authorization Benefits:');
      console.log('├─ One-time setup, multiple transfers');
      console.log('├─ Recipient controls maximum amounts');
      console.log('├─ Privacy-preserving with encryption');
      console.log('├─ Lazy updates for gas efficiency');
      console.log('└─ Secure authorization workflows');

      // Create users and demonstrate the full workflow
      bank.createAccount('alice', '1111', 1000n);
      bank.createAccount('bob', '2222', 500n);

      // One-time authorization setup
      bank.requestTransferAuthorization('alice', 'bob', '1111');
      bank.approveTransferAuthorization('bob', 'alice', '2222', 200n);

      // Multiple transfers without re-authorization
      bank.sendToAuthorizedUser('alice', 'bob', 50n, '1111');
      bank.sendToAuthorizedUser('alice', 'bob', 75n, '1111');
      bank.sendToAuthorizedUser('alice', 'bob', 25n, '1111');

      console.log('\n💡 Alice made 3 transfers with single authorization!');
      bank.printAllUsersOverview();
    });
  });
});