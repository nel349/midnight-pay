import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { BankAPI, emptyBankState, ACCOUNT_STATE, utils, type BankProviders } from '../index.js';
import pino from 'pino';
import { firstValueFrom, filter } from 'rxjs';
import WebSocket from 'ws';
import { TestEnvironment, TestProviders } from './commons.js';
import path from 'node:path';
import fs from 'node:fs';
import { currentDir } from './config.js';

describe('BankAPI', () => {
  test('should have correct initial empty state', () => {
    expect(emptyBankState.accountExists).toBe(false);
    expect(emptyBankState.balance).toBe(0n);
    expect(emptyBankState.transactionCount).toBe(0n);
    expect(emptyBankState.whoami).toBe('unknown');
    expect(emptyBankState.accountStatus).toBe(ACCOUNT_STATE.inactive);
    expect(emptyBankState.transactionHistory).toEqual([]);
  });

  test('should export all required types and functions', () => {
    // Verify the API exports what we expect
    expect(BankAPI).toBeDefined();
    expect(emptyBankState).toBeDefined();
    expect(ACCOUNT_STATE).toBeDefined();
    expect(utils).toBeDefined();
  });

  test('should have static methods for deployment and subscription', () => {
    // Check static methods exist
    expect(typeof BankAPI.deploy).toBe('function');
    expect(typeof BankAPI.subscribe).toBe('function');
    expect(typeof BankAPI.getSharedPrivateState).toBe('function');
    expect(typeof BankAPI.contractExists).toBe('function');
    expect(typeof BankAPI.userHasAccount).toBe('function');
  });

  describe('Utils', () => {
    test('should format balance correctly', () => {
      expect(utils.formatBalance(10000n)).toBe('100.00');
      expect(utils.formatBalance(2550n)).toBe('25.50');
      expect(utils.formatBalance(0n)).toBe('0.00');
    });

    test('should parse amounts correctly', () => {
      expect(utils.parseAmount('100.00')).toBe(10000n);
      expect(utils.parseAmount('25.50')).toBe(2550n);
      expect(utils.parseAmount('0.01')).toBe(1n);
    });

    test('should handle pad function', () => {
      const result = utils.pad('test', 10);
      expect(result.length).toBe(10);
      expect(result[0]).toBe(116); // 't' in ASCII
    });

    test('should generate random bytes', () => {
      const bytes1 = utils.randomBytes(32);
      const bytes2 = utils.randomBytes(32);
      
      expect(bytes1.length).toBe(32);
      expect(bytes2.length).toBe(32);
      expect(bytes1).not.toEqual(bytes2); // Should be different
    });
  });

  describe('ACCOUNT_STATE enum', () => {
    test('should have correct values', () => {
      expect(ACCOUNT_STATE.inactive).toBe(0);
      expect(ACCOUNT_STATE.active).toBe(1);
      expect(ACCOUNT_STATE.verified).toBe(2);
      expect(ACCOUNT_STATE.suspended).toBe(3);
    });
  });

  describe('API Methods', () => {
    test('should understand accountId vs banking account difference', () => {
      // The accountId is just a private state identifier (like gameId in battleship)
      // The actual banking account is created by the create_account circuit
      
      const accountId1 = 'alice-session';
      const accountId2 = 'bob-session';
      
      // These would be two different API instances (different private state storage)
      // but they could interact with the same deployed bank contract
      // Each would maintain their own private state (PIN hash, balance, history)
      
      expect(accountId1).not.toBe(accountId2);
      expect(typeof accountId1).toBe('string');
    });
    
    test('should have correct method signatures', () => {
      // Verify the API methods have correct signatures
      // These methods would be called on a deployed BankAPI instance
      
      const createAccountMethod = BankAPI.prototype.createAccount;
      const depositMethod = BankAPI.prototype.deposit;
      const withdrawMethod = BankAPI.prototype.withdraw;
      const transferToUserMethod = BankAPI.prototype.transferToUser;
      const authenticateBalanceAccessMethod = BankAPI.prototype.authenticateBalanceAccess;
      const verifyAccountStatusMethod = BankAPI.prototype.verifyAccountStatus;
      
      // Authorization system methods
      const requestTransferAuthorizationMethod = BankAPI.prototype.requestTransferAuthorization;
      const approveTransferAuthorizationMethod = BankAPI.prototype.approveTransferAuthorization;
      const sendToAuthorizedUserMethod = BankAPI.prototype.sendToAuthorizedUser;
      
      expect(typeof createAccountMethod).toBe('function');
      expect(typeof depositMethod).toBe('function');
      expect(typeof withdrawMethod).toBe('function');
      expect(typeof transferToUserMethod).toBe('function');
      expect(typeof authenticateBalanceAccessMethod).toBe('function');
      expect(typeof verifyAccountStatusMethod).toBe('function');
      expect(typeof requestTransferAuthorizationMethod).toBe('function');
      expect(typeof approveTransferAuthorizationMethod).toBe('function');
      expect(typeof sendToAuthorizedUserMethod).toBe('function');
      
      // All methods should be async (return Promise<void>)
      expect(createAccountMethod.constructor.name).toBe('AsyncFunction');
      expect(depositMethod.constructor.name).toBe('AsyncFunction');
      expect(withdrawMethod.constructor.name).toBe('AsyncFunction');
      expect(transferToUserMethod.constructor.name).toBe('AsyncFunction');
      expect(authenticateBalanceAccessMethod.constructor.name).toBe('AsyncFunction');
      expect(verifyAccountStatusMethod.constructor.name).toBe('AsyncFunction');
      expect(requestTransferAuthorizationMethod.constructor.name).toBe('AsyncFunction');
      expect(approveTransferAuthorizationMethod.constructor.name).toBe('AsyncFunction');
      expect(sendToAuthorizedUserMethod.constructor.name).toBe('AsyncFunction');
    });
  });

  describe('Integration', () => {
    let testEnvironment: TestEnvironment;
    let providers: BankProviders;
    const logFile = path.resolve(currentDir, '..', 'logs', 'tests', `${new Date().toISOString()}.log`);
    fs.mkdirSync(path.dirname(logFile), { recursive: true });
    const logger = pino(
      { level: process.env.LOG_LEVEL ?? 'info' },
      // Write synchronously to a file so logs always persist
      pino.destination({ dest: logFile, sync: true }),
    );

    beforeAll(async () => {
      // Ensure WebSocket global is set for indexer WS
      // @ts-expect-error node global augmentation
      globalThis.WebSocket = WebSocket as unknown as typeof globalThis.WebSocket;
      testEnvironment = new TestEnvironment(logger);
      const testConfiguration = await testEnvironment.start();
      const wallet = await testEnvironment.getWallet1();
      providers = await new TestProviders().configureBankProviders(wallet, testConfiguration.dappConfig);
    }, 10 * 60_000);

    afterAll(async () => {
      await testEnvironment.shutdown();
    });

    test('should create account successfully (full integration test)', async () => {
      const userId = 'test-user-1';

      logger.info('Deploying Bank contract…');
      const bankAPI = await BankAPI.deploy(userId, providers, logger);

      logger.info('Bank contract deployed');

      let state = emptyBankState;
      const sub = bankAPI.state$.subscribe((s) => {
        state = s;
        logger.info({
          event: 'state',
          accountExists: s.accountExists,
          accountStatus: s.accountStatus,
          txCount: s.transactionCount.toString(),
          balance: s.balance.toString(),
          lastTx: s.lastTransactionHash,
        });
      });

      logger.info('Creating account…');
      await bankAPI.createAccount('test-user', '1234', '100.00');
      logger.info('Account created');

      logger.info('Waiting for account to be ready…');
      const ready = await firstValueFrom(
        bankAPI.state$.pipe(
          filter((s) => s.accountExists === true && s.balance === 10000n),
        ),
      );

      expect(ready.accountExists).toBe(true);
      expect(ready.balance).toBe(10000n);
      expect(ready.accountStatus === ACCOUNT_STATE.active || ready.accountStatus === ACCOUNT_STATE.verified).toBe(true);

      sub.unsubscribe();
    }, 10 * 60_000);

    test('should run full lifecycle: create, auth balance, deposit, withdraw, verify', async () => {
      const userId = `lifecycle-user-${Date.now()}`;

      logger.info('Deploying Bank contract for lifecycle test…');
      const bankAPI = await BankAPI.deploy(userId, providers, logger);

      let state = emptyBankState;
      const sub = bankAPI.state$.subscribe((s) => {
        state = s;
        logger.info({
          event: 'state',
          accountExists: s.accountExists,
          status: s.accountStatus,
          txCount: s.transactionCount.toString(),
          balance: s.balance.toString(),
        });
      });

      // Create account with $50.00
      await bankAPI.createAccount('test-user', '1234', '50.00');
      const afterCreate = await firstValueFrom(
        bankAPI.state$.pipe(filter((s) => s.accountExists === true && s.balance === 5000n)),
      );
      expect(afterCreate.accountExists).toBe(true);
      expect(afterCreate.balance).toBe(5000n);

      // Authenticate balance access (no state changes expected)
      await bankAPI.authenticateBalanceAccess('1234');

      // Deposit $25.00 -> 7500
      await bankAPI.deposit('1234', '25.00');
      const afterDeposit = await firstValueFrom(
        bankAPI.state$.pipe(filter((s) => s.balance === 7500n)),
      );
      expect(afterDeposit.balance).toBe(7500n);

      // Withdraw $10.00 -> 6500
      await bankAPI.withdraw('1234', '10.00');
      const afterWithdraw = await firstValueFrom(
        bankAPI.state$.pipe(filter((s) => s.balance === 6500n)),
      );
      expect(afterWithdraw.balance).toBe(6500n);

      // Verify account status -> should become verified
      await bankAPI.verifyAccountStatus('1234');
      const afterVerify = await firstValueFrom(
        bankAPI.state$.pipe(filter((s) => s.accountStatus === ACCOUNT_STATE.verified)),
      );
      expect(afterVerify.accountStatus).toBe(ACCOUNT_STATE.verified);

      logger.info('Fetching hex-encoded transaction history…');
      // Fetch hex-encoded transaction history from convenience API
      const historyHex = await bankAPI.getTransactionHistoryHex();
      logger.info({ event: 'historyHex', recent: historyHex.slice(0, 3) });
      expect(Array.isArray(historyHex)).toBe(true);
      expect(historyHex.length).toBe(10);

      logger.info('Fetching detailed transaction history…');
      // Assert detailed client-side log order and fields
      const detailed = await bankAPI.getDetailedTransactionHistory();
      expect(Array.isArray(detailed)).toBe(true);
      expect(detailed.length).toBeGreaterThanOrEqual(5);
      const last5 = detailed.slice(-5);
      expect(last5.map((d) => d.type)).toEqual(['create', 'auth', 'deposit', 'withdraw', 'verify']);

      logger.info('Checking detailed transaction history…');
      // Amount presence
      expect(last5[0].amount).toBeDefined(); // create
      expect(last5[1].amount).toBeUndefined(); // auth
      expect(last5[2].amount).toBeDefined(); // deposit
      expect(last5[3].amount).toBeDefined(); // withdraw
      expect(last5[4].amount).toBeUndefined(); // verify
      // Amount values (in cents)
      expect(last5[0].amount).toBe(5000n); // create $50.00
      expect(last5[2].amount).toBe(2500n); // deposit $25.00
      expect(last5[3].amount).toBe(1000n); // withdraw $10.00
      // balanceAfter recorded as bigint
      expect(typeof last5[0].balanceAfter).toBe('bigint');

      sub.unsubscribe();
    }, 10 * 60_000);


    test('should fail transfer with insufficient funds', async () => {
      const aliceUserId = `alice-insufficient-${Date.now()}`;
      const bobUserId = `bob-insufficient-${Date.now()}`;

      logger.info('Testing insufficient funds transfer…');
      const aliceBankAPI = await BankAPI.deploy(aliceUserId, providers, logger);
      const bobBankAPI = await BankAPI.subscribe(bobUserId, providers, aliceBankAPI.deployedContractAddress, logger);

      // Alice creates account with only $20.00
      await aliceBankAPI.createAccount('test-user', '1111', '20.00');
      await firstValueFrom(
        aliceBankAPI.state$.pipe(filter((s) => s.accountExists === true && s.balance === 2000n)),
      );

      // Bob creates account
      await bobBankAPI.createAccount('test-user', '2222', '10.00');
      await firstValueFrom(
        bobBankAPI.state$.pipe(filter((s) => s.accountExists === true)),
      );

      // Alice tries to transfer $50.00 (more than her $20.00 balance)
      await expect(async () => {
        await aliceBankAPI.transferToUser('1111', bobUserId, '50.00');
      }).rejects.toThrow(); // Should fail with "Insufficient funds for transfer"
      
      logger.info('Insufficient funds test completed');
    }, 10 * 60_000);

    test('should fail transfer with wrong PIN', async () => {
      const aliceUserId = `alice-wrongpin-${Date.now()}`;
      const bobUserId = `bob-wrongpin-${Date.now()}`;

      const aliceBankAPI = await BankAPI.deploy(aliceUserId, providers, logger);
      const bobBankAPI = await BankAPI.subscribe(bobUserId, providers, aliceBankAPI.deployedContractAddress, logger);

      // Setup accounts
      await aliceBankAPI.createAccount('test-user', '1111', '100.00');
      await bobBankAPI.createAccount('test-user', '2222', '50.00');
      
      await firstValueFrom(aliceBankAPI.state$.pipe(filter((s) => s.accountExists === true)));
      await firstValueFrom(bobBankAPI.state$.pipe(filter((s) => s.accountExists === true)));

      // Alice tries to transfer with wrong PIN
      await expect(async () => {
        await aliceBankAPI.transferToUser('9999', bobUserId, '30.00'); // Wrong PIN
      }).rejects.toThrow(); // Should fail authentication
      
      logger.info('Wrong PIN test completed');
    }, 10 * 60_000);


    // Zelle-like Authorization System Tests
    describe('Authorization System', () => {
      test('should complete full authorization workflow successfully', async () => {
        const aliceUserId = `alice-auth-${Date.now()}`;
        const bobUserId = `bob-auth-${Date.now()}`;

        logger.info('Testing full authorization workflow…');
        const aliceBankAPI = await BankAPI.deploy(aliceUserId, providers, logger);
        const bobBankAPI = await BankAPI.subscribe(bobUserId, providers, aliceBankAPI.deployedContractAddress, logger);

        // Setup accounts: Alice($200), Bob($100)
        await aliceBankAPI.createAccount('test-user', '1111', '200.00');
        await bobBankAPI.createAccount('test-user', '2222', '100.00');
        
        await firstValueFrom(aliceBankAPI.state$.pipe(filter((s) => s.balance === 20000n)));
        await firstValueFrom(bobBankAPI.state$.pipe(filter((s) => s.balance === 10000n)));

        // Step 1: Alice requests authorization to send to Bob
        await aliceBankAPI.requestTransferAuthorization('1111', bobUserId);
        logger.info('Authorization requested by Alice');

        // Step 2: Bob approves Alice's request with $50 limit
        await bobBankAPI.approveTransferAuthorization('2222', aliceUserId, '50.00');
        logger.info('Authorization approved by Bob with $50 limit');

        // Step 3: Alice can now send to Bob within the limit
        await aliceBankAPI.sendToAuthorizedUser('1111', bobUserId, '30.00');
        
        // Wait for Alice's balance to update (200 - 30 = 170)
        const aliceAfterTransfer = await firstValueFrom(
          aliceBankAPI.state$.pipe(filter((s) => s.balance === 17000n)),
        );
        expect(aliceAfterTransfer.balance).toBe(17000n);

        // Verify detailed transaction histories
        const aliceHistory = await aliceBankAPI.getDetailedTransactionHistory();
        const bobHistory = await bobBankAPI.getDetailedTransactionHistory();
        
        // Alice should have auth_request and auth_transfer records
        const aliceAuthRequest = aliceHistory.find(tx => tx.type === 'auth_request');
        const aliceAuthTransfer = aliceHistory.find(tx => tx.type === 'auth_transfer');
        
        expect(aliceAuthRequest).toBeDefined();
        expect(aliceAuthRequest?.counterparty).toBe(bobUserId);
        expect(aliceAuthTransfer).toBeDefined();
        expect(aliceAuthTransfer?.amount).toBe(3000n); // $30.00 in cents
        expect(aliceAuthTransfer?.counterparty).toBe(bobUserId);

        // Bob should have auth_approve record
        const bobAuthApproval = bobHistory.find(tx => tx.type === 'auth_approve');
        expect(bobAuthApproval).toBeDefined();
        expect(bobAuthApproval?.counterparty).toBe(aliceUserId);
        expect(bobAuthApproval?.maxAmount).toBe(5000n); // $50.00 in cents

        logger.info('Full authorization workflow test completed successfully');
      }, 15 * 60_000);

      test('should allow multiple transfers within authorization limit', async () => {
        const aliceUserId = `alice-multi-auth-${Date.now()}`;
        const bobUserId = `bob-multi-auth-${Date.now()}`;

        const aliceBankAPI = await BankAPI.deploy(aliceUserId, providers, logger);
        const bobBankAPI = await BankAPI.subscribe(bobUserId, providers, aliceBankAPI.deployedContractAddress, logger);

        // Setup accounts
        await aliceBankAPI.createAccount('test-user', '1111', '150.00');
        await bobBankAPI.createAccount('test-user', '2222', '50.00');
        
        await firstValueFrom(aliceBankAPI.state$.pipe(filter((s) => s.balance === 15000n)));
        await firstValueFrom(bobBankAPI.state$.pipe(filter((s) => s.balance === 5000n)));

        // Setup authorization: Bob allows Alice to send up to $80
        await aliceBankAPI.requestTransferAuthorization('1111', bobUserId);
        await bobBankAPI.approveTransferAuthorization('2222', aliceUserId, '80.00');

        // Alice makes multiple transfers within limit
        await aliceBankAPI.sendToAuthorizedUser('1111', bobUserId, '20.00');  // Total: $20
        await firstValueFrom(aliceBankAPI.state$.pipe(filter((s) => s.balance === 13000n))); // 150-20=130

        await aliceBankAPI.sendToAuthorizedUser('1111', bobUserId, '25.00');  // Total: $45
        await firstValueFrom(aliceBankAPI.state$.pipe(filter((s) => s.balance === 10500n))); // 130-25=105

        await aliceBankAPI.sendToAuthorizedUser('1111', bobUserId, '15.00');  // Total: $60
        await firstValueFrom(aliceBankAPI.state$.pipe(filter((s) => s.balance === 9000n))); // 105-15=90

        // Verify Alice has 3 auth_transfer transactions
        const aliceHistory = await aliceBankAPI.getDetailedTransactionHistory();
        const aliceAuthTransfers = aliceHistory.filter(tx => tx.type === 'auth_transfer');
        expect(aliceAuthTransfers).toHaveLength(3);
        
        const totalTransferred = aliceAuthTransfers.reduce((sum, tx) => sum + (tx.amount || 0n), 0n);
        expect(totalTransferred).toBe(6000n); // $20 + $25 + $15 = $60 in cents

        logger.info('Multiple transfers within limit test completed');
      }, 15 * 60_000);

      test('should fail transfer exceeding authorization limit', async () => {
        const aliceUserId = `alice-exceed-${Date.now()}`;
        const bobUserId = `bob-exceed-${Date.now()}`;

        const aliceBankAPI = await BankAPI.deploy(aliceUserId, providers, logger);
        const bobBankAPI = await BankAPI.subscribe(bobUserId, providers, aliceBankAPI.deployedContractAddress, logger);

        // Setup accounts
        await aliceBankAPI.createAccount('test-user', '1111', '200.00');
        await bobBankAPI.createAccount('test-user', '2222', '100.00');
        
        await firstValueFrom(aliceBankAPI.state$.pipe(filter((s) => s.balance === 20000n)));
        await firstValueFrom(bobBankAPI.state$.pipe(filter((s) => s.balance === 10000n)));

        // Setup authorization: Bob allows Alice to send up to $30
        await aliceBankAPI.requestTransferAuthorization('1111', bobUserId);
        await bobBankAPI.approveTransferAuthorization('2222', aliceUserId, '30.00');

        // Alice tries to send more than authorized limit
        await expect(async () => {
          await aliceBankAPI.sendToAuthorizedUser('1111', bobUserId, '50.00'); // Exceeds $30 limit
        }).rejects.toThrow(); // Should fail "Amount exceeds authorized limit"
        
        logger.info('Authorization limit exceeded test completed');
      }, 10 * 60_000);

      test('should fail transfer without authorization', async () => {
        const aliceUserId = `alice-no-auth-${Date.now()}`;
        const bobUserId = `bob-no-auth-${Date.now()}`;

        const aliceBankAPI = await BankAPI.deploy(aliceUserId, providers, logger);
        const bobBankAPI = await BankAPI.subscribe(bobUserId, providers, aliceBankAPI.deployedContractAddress, logger);

        // Setup accounts
        await aliceBankAPI.createAccount('test-user', '1111', '100.00');
        await bobBankAPI.createAccount('test-user', '2222', '50.00');
        
        await firstValueFrom(aliceBankAPI.state$.pipe(filter((s) => s.balance === 10000n)));
        await firstValueFrom(bobBankAPI.state$.pipe(filter((s) => s.balance === 5000n)));

        // Alice tries to send to Bob without authorization
        await expect(async () => {
          await aliceBankAPI.sendToAuthorizedUser('1111', bobUserId, '25.00');
        }).rejects.toThrow(); // Should fail "No authorization - recipient must approve first"
        
        logger.info('No authorization test completed');
      }, 10 * 60_000);

      test('should fail authorization approval without pending request', async () => {
        const aliceUserId = `alice-no-request-${Date.now()}`;
        const bobUserId = `bob-no-request-${Date.now()}`;

        const aliceBankAPI = await BankAPI.deploy(aliceUserId, providers, logger);
        const bobBankAPI = await BankAPI.subscribe(bobUserId, providers, aliceBankAPI.deployedContractAddress, logger);

        // Setup accounts
        await aliceBankAPI.createAccount('test-user', '1111', '100.00');
        await bobBankAPI.createAccount('test-user', '2222', '50.00');
        
        await firstValueFrom(aliceBankAPI.state$.pipe(filter((s) => s.balance === 10000n)));
        await firstValueFrom(bobBankAPI.state$.pipe(filter((s) => s.balance === 5000n)));

        // Bob tries to approve Alice without a pending request
        await expect(async () => {
          await bobBankAPI.approveTransferAuthorization('2222', aliceUserId, '50.00');
        }).rejects.toThrow(); // Should fail "No pending authorization request"
        
        logger.info('No pending request test completed');
      }, 10 * 60_000);

      test('should handle bidirectional authorization', async () => {
        const aliceUserId = `alice-bidirectional-${Date.now()}`;
        const bobUserId = `bob-bidirectional-${Date.now()}`;

        const aliceBankAPI = await BankAPI.deploy(aliceUserId, providers, logger);
        // Add small delay to ensure contract is fully ready
        await new Promise(resolve => setTimeout(resolve, 1000));
        const bobBankAPI = await BankAPI.subscribe(bobUserId, providers, aliceBankAPI.deployedContractAddress, logger);

        // Setup accounts
        logger.info('Creating Alice account for bidirectional test...');
        await aliceBankAPI.createAccount('test-user', '1111', '150.00');
        await firstValueFrom(aliceBankAPI.state$.pipe(filter((s) => {
          logger.info(`Alice bidirectional state: exists=${s.accountExists}, balance=${s.balance}`);
          return s.accountExists === true && s.balance === 15000n;
        })));
        
        logger.info('Creating Bob account for bidirectional test...');
        await bobBankAPI.createAccount('test-user', '2222', '100.00');
        await firstValueFrom(bobBankAPI.state$.pipe(filter((s) => {
          logger.info(`Bob bidirectional state: exists=${s.accountExists}, balance=${s.balance}`);
          return s.accountExists === true && s.balance === 10000n;
        })));

        // Alice -> Bob authorization
        await aliceBankAPI.requestTransferAuthorization('1111', bobUserId);
        await bobBankAPI.approveTransferAuthorization('2222', aliceUserId, '40.00');
        
        logger.info('Bob -> Alice authorization');
        // Bob -> Alice authorization  
        await bobBankAPI.requestTransferAuthorization('2222', aliceUserId);
        await aliceBankAPI.approveTransferAuthorization('1111', bobUserId, '60.00');
        logger.info('Alice -> Bob authorization');

        // Both users can now send to each other
        await aliceBankAPI.sendToAuthorizedUser('1111', bobUserId, '30.00');   // Alice -> Bob: $30
        await firstValueFrom(aliceBankAPI.state$.pipe(filter((s) => s.balance === 12000n))); // 150-30=120
        logger.info('Alice -> Bob transfer');

        await bobBankAPI.sendToAuthorizedUser('2222', aliceUserId, '25.00');   // Bob -> Alice: $25
        await firstValueFrom(bobBankAPI.state$.pipe(filter((s) => s.balance === 7500n))); // 100-25=75
        logger.info('Bob -> Alice transfer');

        // Verify both have auth_transfer transactions
        const aliceHistory = await aliceBankAPI.getDetailedTransactionHistory();
        const bobHistory = await bobBankAPI.getDetailedTransactionHistory();
        
        const aliceAuthTransfers = aliceHistory.filter(tx => tx.type === 'auth_transfer');
        const bobAuthTransfers = bobHistory.filter(tx => tx.type === 'auth_transfer');
        
        expect(aliceAuthTransfers).toHaveLength(1);
        expect(bobAuthTransfers).toHaveLength(1);

        logger.info('Bidirectional authorization test completed');
      }, 15 * 60_000);

      test('should provide helpful error message for legacy transferToUser without authorization', async () => {
        const aliceUserId = `alice-legacy-${Date.now()}`;
        const bobUserId = `bob-legacy-${Date.now()}`;

        const aliceBankAPI = await BankAPI.deploy(aliceUserId, providers, logger);
        const bobBankAPI = await BankAPI.subscribe(bobUserId, providers, aliceBankAPI.deployedContractAddress, logger);

        // Setup accounts
        await aliceBankAPI.createAccount('test-user', '1111', '100.00');
        await bobBankAPI.createAccount('test-user', '2222', '50.00');
        
        await firstValueFrom(aliceBankAPI.state$.pipe(filter((s) => s.balance === 10000n)));
        await firstValueFrom(bobBankAPI.state$.pipe(filter((s) => s.balance === 5000n)));

        // Alice tries to use legacy transferToUser without authorization
        await expect(async () => {
          await aliceBankAPI.transferToUser('1111', bobUserId, '25.00');
        }).rejects.toThrow(/Transfer failed: No authorization exists.*authorization system/);
        
        logger.info('Legacy transfer helpful error test completed');
      }, 10 * 60_000);
    });
  });
});