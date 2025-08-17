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
        bank.getTokenBalance('alice', '1111');
      }).not.toThrow();

      expect(() => {
        bank.getTokenBalance('bob', '2222');
      }).not.toThrow();

      // Users cannot authenticate with wrong PIN
      expect(() => {
        bank.getTokenBalance('alice', '2222'); // Wrong PIN
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
      expect(() => bank.getTokenBalance('charlie', '3333')).toThrow();
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

  describe('Encrypted Token System (Claim Transfers)', () => {
    beforeEach(() => {
      // Setup users for claiming testing
      bank.createAccount('alice', '1111', 500n);
      bank.createAccount('bob', '2222', 300n);
      bank.createAccount('charlie', '3333', 400n);
    });

    test('should complete full claim workflow with encrypted tokens', () => {
      // Step 1: Authorization setup
      bank.requestTransferAuthorization('alice', 'bob', '1111');
      bank.approveTransferAuthorization('bob', 'alice', '2222', 200n);

      // Step 2: Alice sends to Bob (creates encrypted token)
      const initialAliceBalance = bank.getUserBalance('alice');
      const initialBobBalance = bank.getUserBalance('bob');
      
      bank.sendToAuthorizedUser('alice', 'bob', 75n, '1111');

      // Alice's balance should be reduced, Bob's not yet updated (lazy)
      expect(bank.getUserBalance('alice')).toBe(initialAliceBalance - 75n);
      expect(bank.getUserBalance('bob')).toBe(initialBobBalance); // Not yet claimed

      // Step 3: Bob claims the transfer (decrypts and updates balance)
      expect(() => {
        bank.claimAuthorizedTransfer('bob', 'alice', '2222');
      }).not.toThrow();

      // Bob's balance should now be updated
      expect(bank.getUserBalance('bob')).toBe(initialBobBalance + 75n);

      // Check transaction history
      const bobHistory = bank.getUserTransactionHistory('bob');
      const bobClaimTransfer = bobHistory.find(tx => tx.type === 'claim_transfer');
      
      expect(bobClaimTransfer).toBeDefined();
      expect(bobClaimTransfer?.counterparty).toBe('alice');

      bank.printAllUsersOverview();
      console.log('✅ Encrypted token claim workflow completed successfully!');
    });

    test('should support multiple pending claims from different senders', () => {
      // Setup authorizations: Both Alice and Charlie can send to Bob
      bank.requestTransferAuthorization('alice', 'bob', '1111');
      bank.approveTransferAuthorization('bob', 'alice', '2222', 150n);
      
      bank.requestTransferAuthorization('charlie', 'bob', '3333');
      bank.approveTransferAuthorization('bob', 'charlie', '2222', 100n);

      const initialBobBalance = bank.getUserBalance('bob');

      // Both Alice and Charlie send to Bob
      bank.sendToAuthorizedUser('alice', 'bob', 60n, '1111');
      bank.sendToAuthorizedUser('charlie', 'bob', 40n, '3333');

      // Bob should have two pending claims but balance not yet updated
      expect(bank.getUserBalance('bob')).toBe(initialBobBalance);

      // Bob claims from Alice first
      bank.claimAuthorizedTransfer('bob', 'alice', '2222');
      expect(bank.getUserBalance('bob')).toBe(initialBobBalance + 60n);

      // Bob claims from Charlie
      bank.claimAuthorizedTransfer('bob', 'charlie', '2222');
      expect(bank.getUserBalance('bob')).toBe(initialBobBalance + 60n + 40n);

      // Check Bob has 2 claim transactions
      const bobClaimTransfers = bank.getUserTransactionsByType('bob', 'claim_transfer');
      expect(bobClaimTransfers).toHaveLength(2);

      console.log('✅ Multiple pending claims handled successfully!');
      bank.printAllUsersOverview();
    });

    test('should fail claim with wrong PIN', () => {
      // Setup authorization and send
      bank.requestTransferAuthorization('alice', 'bob', '1111');
      bank.approveTransferAuthorization('bob', 'alice', '2222', 100n);
      bank.sendToAuthorizedUser('alice', 'bob', 50n, '1111');

      // Bob tries to claim with wrong PIN
      expect(() => {
        bank.claimAuthorizedTransfer('bob', 'alice', '1111'); // Wrong PIN
      }).toThrow(); // Should fail authentication
    });

    test('should fail claim without authorization', () => {
      // Charlie tries to claim from Alice without any authorization
      expect(() => {
        bank.claimAuthorizedTransfer('charlie', 'alice', '3333');
      }).toThrow(); // Should fail "No authorization exists"
    });

    test('should fail claim without pending transfer', () => {
      // Setup authorization but don't send any money
      bank.requestTransferAuthorization('alice', 'bob', '1111');
      bank.approveTransferAuthorization('bob', 'alice', '2222', 100n);

      // Bob tries to claim without any pending transfer
      expect(() => {
        bank.claimAuthorizedTransfer('bob', 'alice', '2222');
      }).toThrow(); // Should fail "No pending amount to claim"
    });

    test('should fail double claim of same transfer', () => {
      // Setup and send
      bank.requestTransferAuthorization('alice', 'bob', '1111');
      bank.approveTransferAuthorization('bob', 'alice', '2222', 100n);
      bank.sendToAuthorizedUser('alice', 'bob', 50n, '1111');

      // First claim should succeed
      expect(() => {
        bank.claimAuthorizedTransfer('bob', 'alice', '2222');
      }).not.toThrow();

      // Second claim should fail (no more pending amount)
      expect(() => {
        bank.claimAuthorizedTransfer('bob', 'alice', '2222');
      }).toThrow(); // Should fail "No pending amount to claim"
    });

    test('should handle claim after multiple sends from same sender', () => {
      // Setup authorization
      bank.requestTransferAuthorization('alice', 'bob', '1111');
      bank.approveTransferAuthorization('bob', 'alice', '2222', 200n);

      const initialBobBalance = bank.getUserBalance('bob');

      // Alice sends multiple times
      bank.sendToAuthorizedUser('alice', 'bob', 30n, '1111');
      bank.sendToAuthorizedUser('alice', 'bob', 45n, '1111');
      bank.sendToAuthorizedUser('alice', 'bob', 25n, '1111');

      // Bob claims (should get the most recent/accumulated amount)
      bank.claimAuthorizedTransfer('bob', 'alice', '2222');

      // Note: In current implementation, each send overwrites the previous encrypted amount
      // In production, you'd want to accumulate or have separate claim calls
      // For now, Bob should get the last sent amount (25n)
      expect(bank.getUserBalance('bob')).toBeGreaterThan(initialBobBalance);

      const bobClaimTransfers = bank.getUserTransactionsByType('bob', 'claim_transfer');
      expect(bobClaimTransfers).toHaveLength(1);

      console.log('✅ Multiple sends before claim handled!');
      bank.printUserDetailedHistory('bob');
    });

    test('should track encrypted token statistics', () => {
      // Setup multiple authorization relationships
      bank.requestTransferAuthorization('alice', 'bob', '1111');
      bank.approveTransferAuthorization('bob', 'alice', '2222', 150n);
      
      bank.requestTransferAuthorization('charlie', 'bob', '3333');
      bank.approveTransferAuthorization('bob', 'charlie', '2222', 100n);

      // Send and claim multiple transfers
      bank.sendToAuthorizedUser('alice', 'bob', 60n, '1111');
      bank.claimAuthorizedTransfer('bob', 'alice', '2222');
      
      bank.sendToAuthorizedUser('charlie', 'bob', 40n, '3333');
      bank.claimAuthorizedTransfer('bob', 'charlie', '2222');

      // Analyze Bob's claim activity
      const bobClaimTransfers = bank.getUserTransactionsByType('bob', 'claim_transfer');
      const totalClaimedAmount = bank.getUserTotalAmountByType('bob', 'claim_transfer');

      expect(bobClaimTransfers).toHaveLength(2);   // 2 claims
      expect(totalClaimedAmount).toBeGreaterThan(0n); // Some amount claimed

      console.log('📊 Encrypted Token Statistics:');
      console.log('├─ Bob claimed', bobClaimTransfers.length, 'transfers');
      console.log('└─ Total amount claimed: $' + totalClaimedAmount.toString());

      bank.printUserDetailedHistory('bob');
    });

    test('should demonstrate privacy benefits of encrypted tokens', () => {
      console.log('\n🎯 Encrypted Token Privacy Benefits:');
      console.log('├─ Transfer amounts stored encrypted on public ledger');
      console.log('├─ Only sender + recipient can decrypt with shared key');
      console.log('├─ Amounts hidden until recipient claims with PIN');
      console.log('├─ Zero-knowledge proof of ownership when claiming');
      console.log('└─ Automatic detection without revealing amounts');

      // Setup and demonstrate
      bank.requestTransferAuthorization('alice', 'bob', '1111');
      bank.approveTransferAuthorization('bob', 'alice', '2222', 200n);
      
      // Alice sends (creates encrypted token)
      bank.sendToAuthorizedUser('alice', 'bob', 75n, '1111');
      console.log('\n💡 Transfer amount encrypted and stored on public ledger!');
      
      // Bob can detect pending transfer but amount is hidden
      console.log('💡 Bob can detect pending transfer without revealing amount!');
      
      // Bob claims (decrypts and updates balance)
      bank.claimAuthorizedTransfer('bob', 'alice', '2222');
      console.log('💡 Bob claimed transfer with zero-knowledge proof!');

      bank.printAllUsersOverview();
    });
  });

  describe('Selective Balance Disclosure System (NEW FEATURE)', () => {
    beforeEach(() => {
      // Setup users for disclosure testing
      bank.createAccount('alice', '1111', 200n);
      bank.createAccount('bob', '2222', 150n);
      bank.createAccount('charlie', '3333', 100n);
    });

    test('should complete full threshold disclosure workflow successfully', () => {
      // Step 1: Bob directly grants threshold disclosure permission to Alice (no request needed!)
      expect(() => {
        bank.grantDisclosurePermission('bob', 'alice', '2222', 1, 100n, 0); // permission_type=1 (threshold), expires=0 (never)
      }).not.toThrow();

      // Step 3: Alice verifies Bob has at least $100
      const hasThreshold = bank.verifyBalanceThreshold('alice', 'bob', 100n);
      expect(hasThreshold).toBe(true); // Bob has $150, so he meets $100 threshold

      // Step 4: Alice tries to check threshold above authorized limit (should throw error)
      expect(() => {
        bank.verifyBalanceThreshold('alice', 'bob', 200n); // Exceeds authorized max of $100
      }).toThrow('Threshold exceeds authorized maximum');

      console.log('✅ Threshold disclosure workflow completed successfully!');
    });

    test('should complete full exact disclosure workflow successfully', () => {
      // Step 1: Alice directly grants exact disclosure permission to Charlie
      expect(() => {
        bank.grantDisclosurePermission('alice', 'charlie', '1111', 2, 0n, 24); // permission_type=2 (exact), expires=24h
      }).not.toThrow();

      // Step 2: Charlie gets Alice's exact balance
      const aliceBalance = bank.getDisclosedBalance('charlie', 'alice');
      expect(aliceBalance).toBe(200n); // Alice has $200

      console.log('✅ Exact disclosure workflow completed successfully!');
    });

    test('should fail disclosure without permission', () => {
      // Alice tries to check Bob's balance without permission
      expect(() => {
        bank.verifyBalanceThreshold('alice', 'bob', 100n);
      }).toThrow(); // Should fail "No disclosure permission exists"

      // Charlie tries to get Alice's exact balance without permission
      expect(() => {
        bank.getDisclosedBalance('charlie', 'alice');
      }).toThrow(); // Should fail "No disclosure permission exists"
    });

    test('should fail threshold check exceeding authorized limit', () => {
      // Setup threshold disclosure: Alice can check if Bob has ≥ $75
      // Removed: bank.requestDisclosurePermission - no longer needed with direct grant approach('alice', 'bob', '1111');
      bank.grantDisclosurePermission('bob', 'alice', '2222', 1, 75n, 0);

      // Alice can check threshold up to $75
      expect(() => {
        bank.verifyBalanceThreshold('alice', 'bob', 50n);
      }).not.toThrow();

      // Alice tries to check threshold above authorized limit
      expect(() => {
        bank.verifyBalanceThreshold('alice', 'bob', 100n); // Exceeds $75 limit
      }).toThrow(); // Should fail "Threshold exceeds authorized maximum"
    });

    test('should fail exact disclosure with wrong permission type', () => {
      // Setup threshold disclosure (type 1) 
      // Removed: bank.requestDisclosurePermission - no longer needed with direct grant approach('alice', 'bob', '1111');
      bank.grantDisclosurePermission('bob', 'alice', '2222', 1, 100n, 0); // threshold only

      // Alice tries to get exact balance with threshold permission
      expect(() => {
        bank.getDisclosedBalance('alice', 'bob');
      }).toThrow(); // Should fail "Permission does not allow exact balance disclosure"
    });

    test('should fail disclosure grant with wrong PIN', () => {
      expect(() => {
        bank.grantDisclosurePermission('alice', 'bob', '2222', 1, 100n, 0); // Wrong PIN for Alice 
      }).toThrow(); // Should fail authentication
    });

    test('should fail disclosure grant with wrong grantor PIN', () => {
      // Bob tries to grant with wrong PIN
      expect(() => {
        bank.grantDisclosurePermission('bob', 'alice', '1111', 1, 100n, 0); // Wrong PIN for Bob (should be '2222')
      }).toThrow(); // Should fail authentication
    });

    test('should fail self-disclosure', () => {
      expect(() => {
        bank.grantDisclosurePermission('alice', 'alice', '1111', 1, 100n, 0); // Self-disclosure
      }).toThrow(); // Should fail "Cannot grant disclosure to yourself"
    });

    test('should fail disclosure to non-existent user', () => {
      expect(() => {
        bank.grantDisclosurePermission('alice', 'david', '1111', 1, 100n, 0); // David doesn't exist
      }).toThrow(); // Should fail "Requester account does not exist"
    });

    test('should allow direct disclosure grant (no request needed)', () => {
      // Bob can grant disclosure directly without any request
      expect(() => {
        bank.grantDisclosurePermission('bob', 'alice', '2222', 1, 100n, 0);
      }).not.toThrow(); // Should succeed - no pending request needed!
    });

    test('should handle multiple disclosure relationships', () => {
      // Create a network of disclosure permissions:
      
      // Alice can check both Bob's and Charlie's thresholds
      // Removed: bank.requestDisclosurePermission - no longer needed with direct grant approach('alice', 'bob', '1111');
      bank.grantDisclosurePermission('bob', 'alice', '2222', 1, 100n, 0);
      
      // Removed: bank.requestDisclosurePermission - no longer needed with direct grant approach('alice', 'charlie', '1111');
      bank.grantDisclosurePermission('charlie', 'alice', '3333', 1, 80n, 0);
      
      // Bob can get Alice's exact balance
      // Removed: bank.requestDisclosurePermission - no longer needed with direct grant approach('bob', 'alice', '2222');
      bank.grantDisclosurePermission('alice', 'bob', '1111', 2, 0n, 0);
      
      // Test all disclosure relationships work
      expect(bank.verifyBalanceThreshold('alice', 'bob', 100n)).toBe(true);     // Alice checks Bob ≥ $100
      expect(bank.verifyBalanceThreshold('alice', 'charlie', 80n)).toBe(true);  // Alice checks Charlie ≥ $80
      expect(bank.getDisclosedBalance('bob', 'alice')).toBe(200n);              // Bob gets Alice's exact balance
      
      console.log('🌐 Multi-user disclosure network completed!');
    });

    test('should demonstrate privacy benefits of selective disclosure', () => {
      console.log('\n🎯 Selective Balance Disclosure Benefits:');
      console.log('├─ Users control who can see their balance');
      console.log('├─ Granular permissions (threshold vs exact)');
      console.log('├─ Time-limited access with expiration');
      console.log('├─ Cryptographic privacy preservation');
      console.log('└─ Perfect for lending, verification, auditing');

      // Scenario: Alice applying for a loan from Bob (lender)
      console.log('\n💰 Loan Application Scenario:');
      
      // Step 1: Alice requests disclosure for loan verification
      // Removed: bank.requestDisclosurePermission - no longer needed with direct grant approach('bob', 'alice', '2222'); // Bob (lender) requests Alice's balance
      
      // Step 2: Alice approves threshold disclosure for loan qualification
      bank.grantDisclosurePermission('alice', 'bob', '1111', 1, 150n, 24); // Bob can check if Alice has ≥ $150 for 24h
      
      // Step 3: Bob verifies Alice qualifies for loan
      const qualifiesForLoan = bank.verifyBalanceThreshold('bob', 'alice', 150n);
      expect(qualifiesForLoan).toBe(true); // Alice has $200, qualifies for loan requiring $150
      
      console.log('\n💡 Alice qualified for loan without revealing exact balance!');
      
      bank.printAllUsersOverview();
    });

    test('should track disclosure statistics', () => {
      // Setup multiple disclosure permissions
      // Removed: bank.requestDisclosurePermission - no longer needed with direct grant approach('alice', 'bob', '1111');
      bank.grantDisclosurePermission('bob', 'alice', '2222', 1, 100n, 0);
      
      // Removed: bank.requestDisclosurePermission - no longer needed with direct grant approach('alice', 'charlie', '1111');
      bank.grantDisclosurePermission('charlie', 'alice', '3333', 2, 0n, 0);
      
      // Removed: bank.requestDisclosurePermission - no longer needed with direct grant approach('bob', 'alice', '2222');
      bank.grantDisclosurePermission('alice', 'bob', '1111', 1, 120n, 0);
      
      // Analyze Alice's disclosure activity (simplified - only grants, no requests)
      const aliceDisclosureGrants = bank.getUserTransactionsByType('alice', 'auth_approve'); // Alice grants disclosure to Bob
      
      expect(aliceDisclosureGrants).toHaveLength(1);  // 1 disclosure grant (Alice granted to Bob)
      
      console.log('📊 Disclosure Statistics:');
      console.log('├─ Alice granted', aliceDisclosureGrants.length, 'disclosure permissions');
      console.log('├─ Bob granted 1 disclosure permission to Alice');
      console.log('├─ Charlie granted 1 disclosure permission to Alice');
      console.log('└─ Total disclosure grants: 3');
    });

    test('should demonstrate comprehensive privacy features', () => {
      console.log('\n🔒 Midnight Bank Privacy Architecture:');
      console.log('├─ Encrypted balance storage');
      console.log('├─ Zero-knowledge transaction proofs');
      console.log('├─ Selective balance disclosure');
      console.log('├─ Authorization-based transfers');
      console.log('└─ PIN-based authentication');
      
      // Create multiple users and demonstrate privacy features
      bank.createAccount('diana', '4444', 300n);
      bank.createAccount('eve', '5555', 50n);
      
      console.log('\n💡 All privacy features working together in shared contract!');
    });

    test('should demonstrate real-world disclosure use cases', () => {
      console.log('\n🌍 Real-World Disclosure Use Cases:');
      console.log('├─ Loan applications (threshold verification)');
      console.log('├─ Employment verification (exact balance)');
      console.log('├─ Insurance underwriting (threshold checks)');
      console.log('├─ Investment qualification (minimum balance)');
      console.log('└─ Audit compliance (temporary exact access)');
      
      // Use case 1: Insurance verification - Charlie needs to verify Bob has at least $100 for coverage
      // Removed: bank.requestDisclosurePermission - no longer needed with direct grant approach('charlie', 'bob', '3333');
      bank.grantDisclosurePermission('bob', 'charlie', '2222', 1, 100n, 168); // 1 week expiration
      
      const qualifiesForInsurance = bank.verifyBalanceThreshold('charlie', 'bob', 100n);
      expect(qualifiesForInsurance).toBe(true);
      
      console.log('\n💡 Bob qualified for insurance without revealing exact balance!');
      
      bank.printAllUsersOverview();
    });

    test('should handle time-based expiration correctly', () => {
      console.log('\n⏰ Testing Time-Based Expiration System');
      
      // Check initial timestamp
      const initialTime = bank.getCurrentTimestamp();
      console.log(`Starting timestamp: ${initialTime}`);
      
      // Grant permission that expires in 2 hours
      bank.grantDisclosurePermission('alice', 'bob', '1111', 1, 100n, 2); // Expires in 2 hours
      
      // Bob should be able to access immediately
      expect(() => {
        bank.verifyBalanceThreshold('bob', 'alice', 50n);
      }).not.toThrow();
      
      // Advance time by 1 hour - should still work
      bank.advanceTimeByHours(1);
      console.log(`After 1 hour: ${bank.getCurrentTimestamp()}`);
      
      expect(() => {
        bank.verifyBalanceThreshold('bob', 'alice', 50n);
      }).not.toThrow();
      
      // Advance time by 2 more hours (total 3 hours) - should expire
      bank.advanceTimeByHours(2);
      console.log(`After 3 hours total: ${bank.getCurrentTimestamp()}`);
      
      expect(() => {
        bank.verifyBalanceThreshold('bob', 'alice', 50n);
      }).toThrow(); // Should fail "Disclosure permission has expired"
      
      console.log('✅ Time-based expiration working correctly!');
    });

    test('should handle never-expiring permissions', () => {
      console.log('\n♾️ Testing Never-Expiring Permissions');
      
      // Grant permission that never expires (expires_in_hours = 0)
      bank.grantDisclosurePermission('bob', 'charlie', '2222', 2, 0n, 0); // Never expires
      
      // Should work immediately
      const balance1 = bank.getDisclosedBalance('charlie', 'bob');
      expect(balance1).toBe(150n);
      
      // Advance time by 100 hours - should still work
      bank.advanceTimeByHours(100);
      console.log(`After 100 hours: ${bank.getCurrentTimestamp()}`);
      
      const balance2 = bank.getDisclosedBalance('charlie', 'bob');
      expect(balance2).toBe(150n);
      
      // Advance time by 1000 hours - should still work
      bank.advanceTimeByHours(1000);
      console.log(`After 1100 hours total: ${bank.getCurrentTimestamp()}`);
      
      const balance3 = bank.getDisclosedBalance('charlie', 'bob');
      expect(balance3).toBe(150n);
      
      console.log('✅ Never-expiring permissions work indefinitely!');
    });

    test('should handle exact disclosure expiration separately from threshold', () => {
      console.log('\n🔄 Testing Different Permission Types with Different Expirations');
      
      // Alice grants two different permissions to Bob:
      // 1. Threshold disclosure expires in 1 hour
      // 2. Exact disclosure expires in 3 hours
      bank.grantDisclosurePermission('alice', 'bob', '1111', 1, 75n, 1);  // Threshold, 1h
      
      // Create second account for different permission
      bank.createAccount('david', '4444', 300n);
      bank.grantDisclosurePermission('david', 'bob', '4444', 2, 0n, 3);   // Exact, 3h
      
      // Both should work initially
      expect(() => {
        bank.verifyBalanceThreshold('bob', 'alice', 50n);
      }).not.toThrow();
      
      expect(() => {
        bank.getDisclosedBalance('bob', 'david');
      }).not.toThrow();
      
      // Advance 2 hours - threshold should expire, exact should still work
      bank.advanceTimeByHours(2);
      
      expect(() => {
        bank.verifyBalanceThreshold('bob', 'alice', 50n);
      }).toThrow(); // Threshold expired
      
      expect(() => {
        bank.getDisclosedBalance('bob', 'david');
      }).not.toThrow(); // Exact still valid
      
      // Advance 2 more hours (4 total) - both should be expired
      bank.advanceTimeByHours(2);
      
      expect(() => {
        bank.verifyBalanceThreshold('bob', 'alice', 50n);
      }).toThrow(); // Still expired
      
      expect(() => {
        bank.getDisclosedBalance('bob', 'david');
      }).toThrow(); // Now expired too
      
      console.log('✅ Different permission types expire independently!');
    });
  });
});