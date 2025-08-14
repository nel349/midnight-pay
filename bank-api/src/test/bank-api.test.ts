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

  // Minimal smoke: basic exports
  test('should export core types', () => {
    expect(BankAPI).toBeDefined();
    expect(emptyBankState).toBeDefined();
    expect(ACCOUNT_STATE).toBeDefined();
    expect(utils).toBeDefined();
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

  // Drop signature/unit tests; integration covers behavior

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
      const contractAddress = await BankAPI.deploy(providers, logger);

      logger.info('Bank contract deployed');

      logger.info('Creating account…', { userId });
      await BankAPI.createAccount(providers, contractAddress, userId, '1234', '100.00', logger);
      logger.info('Account created');

      const bankAPI = await BankAPI.subscribe(userId, providers, contractAddress, logger);

      const ready = await firstValueFrom(
        bankAPI.state$.pipe(filter((s) => s.accountExists === true && s.balance === 10000n)),
      );

      expect(ready.accountExists).toBe(true);
      expect(ready.balance).toBe(10000n);
      expect(ready.accountStatus === ACCOUNT_STATE.active || ready.accountStatus === ACCOUNT_STATE.verified).toBe(true);
    }, 10 * 60_000);

    test('should run full lifecycle: create, auth balance, deposit, withdraw, verify', async () => {
      const userId = `lifecycle-user-${Date.now()}`;

      logger.info('Deploying Bank contract for lifecycle test…');
      const contractAddress = await BankAPI.deploy(providers, logger);

      // Create account with $50.00
      await BankAPI.createAccount(providers, contractAddress, userId, '1234', '50.00', logger);
      const bankAPI = await BankAPI.subscribe(userId, providers, contractAddress, logger);
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

      // no-op
    }, 10 * 60_000);


    test('should fail transfer with insufficient funds', async () => {
      const aliceUserId = `alice-insufficient-${Date.now()}`;
      const bobUserId = `bob-insufficient-${Date.now()}`;

      logger.info('Testing insufficient funds transfer…');
      const contractAddress = await BankAPI.deploy(providers, logger);

      // Alice creates account with only $20.00
      await BankAPI.createAccount(providers, contractAddress, aliceUserId, '1111', '20.00', logger);
      const aliceBankAPI = await BankAPI.subscribe(aliceUserId, providers, contractAddress, logger);
      await firstValueFrom(
        aliceBankAPI.state$.pipe(filter((s) => s.accountExists === true && s.balance === 2000n)),
      );

      // Bob creates account
      await BankAPI.createAccount(providers, contractAddress, bobUserId, '2222', '10.00', logger);
      const bobBankAPI = await BankAPI.subscribe(bobUserId, providers, contractAddress, logger);
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

      const contractAddress = await BankAPI.deploy(providers, logger);

      // Setup accounts
      await BankAPI.createAccount(providers, contractAddress, aliceUserId, '1111', '100.00', logger);
      await BankAPI.createAccount(providers, contractAddress, bobUserId, '2222', '50.00', logger);
      const aliceBankAPI = await BankAPI.subscribe(aliceUserId, providers, contractAddress, logger);
      const bobBankAPI = await BankAPI.subscribe(bobUserId, providers, contractAddress, logger);
      
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
      test('should complete full authorization workflow with encrypted token claim', async () => {
        const aliceUserId = `alice-auth-${Date.now()}`;
        const bobUserId = `bob-auth-${Date.now()}`;

        logger.info('Testing full authorization workflow with claim…');
        const contractAddress = await BankAPI.deploy(providers, logger);

        // Setup accounts: Alice($200), Bob($100)
        await BankAPI.createAccount(providers, contractAddress, aliceUserId, '1111', '200.00', logger);
        await BankAPI.createAccount(providers, contractAddress, bobUserId, '2222', '100.00', logger);
        const aliceBankAPI = await BankAPI.subscribe(aliceUserId, providers, contractAddress, logger);
        const bobBankAPI = await BankAPI.subscribe(bobUserId, providers, contractAddress, logger);
        
        await firstValueFrom(aliceBankAPI.state$.pipe(filter((s) => s.balance === 20000n)));
        await firstValueFrom(bobBankAPI.state$.pipe(filter((s) => s.balance === 10000n)));

        // Step 1: Alice requests authorization to send to Bob
        await aliceBankAPI.requestTransferAuthorization('1111', bobUserId);

        // Step 2: Bob approves Alice's request with $50 limit
        await bobBankAPI.approveTransferAuthorization('2222', aliceUserId, '50.00');

        // Step 3: Alice sends $30 to Bob (encrypted on blockchain)
        await aliceBankAPI.sendToAuthorizedUser('1111', bobUserId, '30.00');
        
        // Wait for Alice's balance to update (200 - 30 = 170)
        await firstValueFrom(aliceBankAPI.state$.pipe(filter((s) => s.balance === 17000n)));
        
        // Give Bob's API time to see the blockchain state update
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verify Bob's balance hasn't changed yet (pending claim)
        const bobBeforeClaim = await firstValueFrom(bobBankAPI.state$.pipe(filter((s) => s.balance === 10000n)));
        expect(bobBeforeClaim.balance).toBe(10000n);

        // Step 4: Bob detects and claims the encrypted transfer
        const pendingClaims = await bobBankAPI.getPendingClaims();
        logger.info(`Pending claims found: ${pendingClaims.length}`, { claims: pendingClaims });
        expect(pendingClaims).toHaveLength(1);
        expect(pendingClaims[0].senderUserId).toBe(aliceUserId);

        await bobBankAPI.claimAuthorizedTransfer('2222', aliceUserId);
        
        // Verify Bob received exact amount (100 + 30 = 130)
        const bobAfterClaim = await firstValueFrom(bobBankAPI.state$.pipe(filter((s) => s.balance === 13000n)));
        expect(bobAfterClaim.balance).toBe(13000n);

        // Verify transaction histories include claim
        const aliceHistory = await aliceBankAPI.getDetailedTransactionHistory();
        const bobHistory = await bobBankAPI.getDetailedTransactionHistory();
        
        // Alice should have auth_request and auth_transfer records
        const aliceAuthRequest = aliceHistory.find(tx => tx.type === 'auth_request');
        const aliceAuthTransfer = aliceHistory.find(tx => tx.type === 'auth_transfer');
        
        expect(aliceAuthRequest).toBeDefined();
        expect(aliceAuthTransfer?.amount).toBe(3000n); // $30.00 in cents

        // Bob should have auth_approve and claim_transfer records
        const bobAuthApproval = bobHistory.find(tx => tx.type === 'auth_approve');
        const bobClaim = bobHistory.find(tx => tx.type === 'claim_transfer');
        
        expect(bobAuthApproval).toBeDefined();
        expect(bobAuthApproval?.maxAmount).toBe(5000n); // $50.00 in cents
        expect(bobClaim).toBeDefined();
        expect(bobClaim?.amount).toBe(3000n); // Exact $30.00 recovered

        logger.info('Full authorization workflow with claim completed successfully');
      }, 15 * 60_000);

      test('should allow multiple transfers with encrypted tokens and claims', async () => {
        const aliceUserId = `alice-multi-auth-${Date.now()}`;
        const bobUserId = `bob-multi-auth-${Date.now()}`;

        const contractAddress = await BankAPI.deploy(providers, logger);

        // Setup accounts
        await BankAPI.createAccount(providers, contractAddress, aliceUserId, '1111', '150.00', logger);
        await BankAPI.createAccount(providers, contractAddress, bobUserId, '2222', '50.00', logger);
        const aliceBankAPI = await BankAPI.subscribe(aliceUserId, providers, contractAddress, logger);
        const bobBankAPI = await BankAPI.subscribe(bobUserId, providers, contractAddress, logger);
        
        await firstValueFrom(aliceBankAPI.state$.pipe(filter((s) => s.balance === 15000n)));
        await firstValueFrom(bobBankAPI.state$.pipe(filter((s) => s.balance === 5000n)));

        // Setup authorization: Bob allows Alice to send up to $80
        await aliceBankAPI.requestTransferAuthorization('1111', bobUserId);
        await bobBankAPI.approveTransferAuthorization('2222', aliceUserId, '80.00');

        // Alice makes multiple encrypted transfers
        await aliceBankAPI.sendToAuthorizedUser('1111', bobUserId, '20.00');
        await firstValueFrom(aliceBankAPI.state$.pipe(filter((s) => s.balance === 13000n))); // 150-20=130

        await aliceBankAPI.sendToAuthorizedUser('1111', bobUserId, '25.00');
        await firstValueFrom(aliceBankAPI.state$.pipe(filter((s) => s.balance === 10500n))); // 130-25=105

        await aliceBankAPI.sendToAuthorizedUser('1111', bobUserId, '15.00');
        await firstValueFrom(aliceBankAPI.state$.pipe(filter((s) => s.balance === 9000n))); // 105-15=90

        // Bob's balance should still be original (pending claims)
        const bobBeforeClaims = await firstValueFrom(bobBankAPI.state$.pipe(filter((s) => s.balance === 5000n)));
        expect(bobBeforeClaims.balance).toBe(5000n);

        // Bob should see pending claims but amounts are encrypted (0n until claimed)
        await new Promise(resolve => setTimeout(resolve, 2000));
        const pendingClaims = await bobBankAPI.getPendingClaims();
        expect(pendingClaims).toHaveLength(1); // Multiple transfers to same auth get combined

        // Bob claims the combined encrypted transfer
        await bobBankAPI.claimAuthorizedTransfer('2222', aliceUserId);
        
        // Bob should receive total of all transfers: $50 + $60 = $110
        await firstValueFrom(bobBankAPI.state$.pipe(filter((s) => s.balance === 11000n))); // 50+60=110

        // Verify transaction histories
        const aliceHistory = await aliceBankAPI.getDetailedTransactionHistory();
        const bobHistory = await bobBankAPI.getDetailedTransactionHistory();
        
        const aliceAuthTransfers = aliceHistory.filter(tx => tx.type === 'auth_transfer');
        const bobClaims = bobHistory.filter(tx => tx.type === 'claim_transfer');
        
        expect(aliceAuthTransfers).toHaveLength(3); // 3 individual sends
        expect(bobClaims).toHaveLength(1); // 1 combined claim
        expect(bobClaims[0].amount).toBe(6000n); // $60 total claimed

        logger.info('Multiple encrypted transfers and claim test completed');
      }, 15 * 60_000);

      test('should fail transfer exceeding authorization limit', async () => {
        const aliceUserId = `alice-exceed-${Date.now()}`;
        const bobUserId = `bob-exceed-${Date.now()}`;

        const contractAddress = await BankAPI.deploy(providers, logger);

        // Setup accounts
        await BankAPI.createAccount(providers, contractAddress, aliceUserId, '1111', '200.00', logger);
        await BankAPI.createAccount(providers, contractAddress, bobUserId, '2222', '100.00', logger);
        const aliceBankAPI = await BankAPI.subscribe(aliceUserId, providers, contractAddress, logger);
        const bobBankAPI = await BankAPI.subscribe(bobUserId, providers, contractAddress, logger);
        
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

        const contractAddress = await BankAPI.deploy(providers, logger);

        // Setup accounts
        await BankAPI.createAccount(providers, contractAddress, aliceUserId, '1111', '100.00', logger);
        await BankAPI.createAccount(providers, contractAddress, bobUserId, '2222', '50.00', logger);
        const aliceBankAPI = await BankAPI.subscribe(aliceUserId, providers, contractAddress, logger);
        const bobBankAPI = await BankAPI.subscribe(bobUserId, providers, contractAddress, logger);
        
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

        const contractAddress = await BankAPI.deploy(providers, logger);

        // Setup accounts
        await BankAPI.createAccount(providers, contractAddress, aliceUserId, '1111', '100.00', logger);
        await BankAPI.createAccount(providers, contractAddress, bobUserId, '2222', '50.00', logger);
        const aliceBankAPI = await BankAPI.subscribe(aliceUserId, providers, contractAddress, logger);
        const bobBankAPI = await BankAPI.subscribe(bobUserId, providers, contractAddress, logger);
        
        await firstValueFrom(aliceBankAPI.state$.pipe(filter((s) => s.balance === 10000n)));
        await firstValueFrom(bobBankAPI.state$.pipe(filter((s) => s.balance === 5000n)));

        // Bob tries to approve Alice without a pending request
        await expect(async () => {
          await bobBankAPI.approveTransferAuthorization('2222', aliceUserId, '50.00');
        }).rejects.toThrow(); // Should fail "No pending authorization request"
        
        logger.info('No pending request test completed');
      }, 10 * 60_000);

      test('should handle bidirectional authorization with encrypted claims', async () => {
        const aliceUserId = `alice-bidirectional-${Date.now()}`;
        const bobUserId = `bob-bidirectional-${Date.now()}`;

        const contractAddress = await BankAPI.deploy(providers, logger);

        // Setup accounts
        await BankAPI.createAccount(providers, contractAddress, aliceUserId, '1111', '150.00', logger);
        await BankAPI.createAccount(providers, contractAddress, bobUserId, '2222', '100.00', logger);
        const aliceBankAPI = await BankAPI.subscribe(aliceUserId, providers, contractAddress, logger);
        const bobBankAPI = await BankAPI.subscribe(bobUserId, providers, contractAddress, logger);

        // Setup bidirectional authorizations
        await aliceBankAPI.requestTransferAuthorization('1111', bobUserId);
        await bobBankAPI.approveTransferAuthorization('2222', aliceUserId, '40.00');
        
        await bobBankAPI.requestTransferAuthorization('2222', aliceUserId);
        await aliceBankAPI.approveTransferAuthorization('1111', bobUserId, '60.00');

        // Both users send encrypted transfers
        await aliceBankAPI.sendToAuthorizedUser('1111', bobUserId, '30.00');   // Alice -> Bob
        await firstValueFrom(aliceBankAPI.state$.pipe(filter((s) => s.balance === 12000n))); // 150-30=120

        await bobBankAPI.sendToAuthorizedUser('2222', aliceUserId, '25.00');   // Bob -> Alice  
        await firstValueFrom(bobBankAPI.state$.pipe(filter((s) => s.balance === 7500n))); // 100-25=75

        // Balances haven't changed yet for recipients (pending claims)
        const aliceBeforeClaim = await firstValueFrom(aliceBankAPI.state$.pipe(filter((s) => s.balance === 12000n)));
        const bobBeforeClaim = await firstValueFrom(bobBankAPI.state$.pipe(filter((s) => s.balance === 7500n)));
        expect(aliceBeforeClaim.balance).toBe(12000n); // Still just sent amount deducted
        expect(bobBeforeClaim.balance).toBe(7500n);    // Still just sent amount deducted

        // Both claim their transfers
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await bobBankAPI.claimAuthorizedTransfer('2222', aliceUserId);    // Bob claims Alice's $30
        await firstValueFrom(bobBankAPI.state$.pipe(filter((s) => s.balance === 10500n))); // 75+30=105
        
        await aliceBankAPI.claimAuthorizedTransfer('1111', bobUserId);    // Alice claims Bob's $25
        await firstValueFrom(aliceBankAPI.state$.pipe(filter((s) => s.balance === 14500n))); // 120+25=145

        // Verify transaction histories include both sends and claims
        const aliceHistory = await aliceBankAPI.getDetailedTransactionHistory();
        const bobHistory = await bobBankAPI.getDetailedTransactionHistory();
        
        const aliceAuthTransfers = aliceHistory.filter(tx => tx.type === 'auth_transfer');
        const aliceClaims = aliceHistory.filter(tx => tx.type === 'claim_transfer');
        const bobAuthTransfers = bobHistory.filter(tx => tx.type === 'auth_transfer');
        const bobClaims = bobHistory.filter(tx => tx.type === 'claim_transfer');
        
        expect(aliceAuthTransfers).toHaveLength(1); // Alice sent $30
        expect(aliceClaims).toHaveLength(1);        // Alice claimed $25
        expect(bobAuthTransfers).toHaveLength(1);   // Bob sent $25
        expect(bobClaims).toHaveLength(1);          // Bob claimed $30

        expect(aliceClaims[0].amount).toBe(2500n);  // $25 claimed
        expect(bobClaims[0].amount).toBe(3000n);    // $30 claimed

        logger.info('Bidirectional encrypted authorization test completed');
      }, 15 * 60_000);

      test('should provide helpful error message for legacy transferToUser without authorization', async () => {
        const aliceUserId = `alice-legacy-${Date.now()}`;
        const bobUserId = `bob-legacy-${Date.now()}`;

        const contractAddress = await BankAPI.deploy(providers, logger);

        // Setup accounts
        await BankAPI.createAccount(providers, contractAddress, aliceUserId, '1111', '100.00', logger);
        await BankAPI.createAccount(providers, contractAddress, bobUserId, '2222', '50.00', logger);
        const aliceBankAPI = await BankAPI.subscribe(aliceUserId, providers, contractAddress, logger);
        const bobBankAPI = await BankAPI.subscribe(bobUserId, providers, contractAddress, logger);
        
        await firstValueFrom(aliceBankAPI.state$.pipe(filter((s) => s.balance === 10000n)));
        await firstValueFrom(bobBankAPI.state$.pipe(filter((s) => s.balance === 5000n)));

        // Alice tries to use legacy transferToUser without authorization
        await expect(async () => {
          await aliceBankAPI.transferToUser('1111', bobUserId, '25.00');
        }).rejects.toThrow(/Transfer failed: No authorization exists.*authorization system/);
        
        logger.info('Legacy transfer helpful error test completed');
      }, 10 * 60_000);
    });

      test('should prevent double-claiming the same transfer', async () => {
        const aliceUserId = `alice-double-${Date.now()}`;
        const bobUserId = `bob-double-${Date.now()}`;

        const contractAddress = await BankAPI.deploy(providers, logger);

        // Setup accounts
        await BankAPI.createAccount(providers, contractAddress, aliceUserId, '1111', '150.00', logger);
        await BankAPI.createAccount(providers, contractAddress, bobUserId, '2222', '75.00', logger);
        const aliceBankAPI = await BankAPI.subscribe(aliceUserId, providers, contractAddress, logger);
        const bobBankAPI = await BankAPI.subscribe(bobUserId, providers, contractAddress, logger);
        
        await firstValueFrom(aliceBankAPI.state$.pipe(filter((s) => s.balance === 15000n)));
        await firstValueFrom(bobBankAPI.state$.pipe(filter((s) => s.balance === 7500n)));

        // Setup authorization and send
        await aliceBankAPI.requestTransferAuthorization('1111', bobUserId);
        await bobBankAPI.approveTransferAuthorization('2222', aliceUserId, '100.00');
        await aliceBankAPI.sendToAuthorizedUser('1111', bobUserId, '50.00');
        
        await firstValueFrom(aliceBankAPI.state$.pipe(filter((s) => s.balance === 10000n))); // 150-50=100

        // Bob claims successfully first time
        await new Promise(resolve => setTimeout(resolve, 2000));
        await bobBankAPI.claimAuthorizedTransfer('2222', aliceUserId);
        await firstValueFrom(bobBankAPI.state$.pipe(filter((s) => s.balance === 12500n))); // 75+50=125

        // Bob tries to claim the same transfer again (should fail)
        await expect(async () => {
          await bobBankAPI.claimAuthorizedTransfer('2222', aliceUserId);
        }).rejects.toThrow(); // Should fail "No pending amount to claim"

        // Bob's balance should remain unchanged
        const bobFinalBalance = await firstValueFrom(bobBankAPI.state$.pipe(filter((s) => s.balance === 12500n)));
        expect(bobFinalBalance.balance).toBe(12500n);

        logger.info('Double-claim prevention test completed');
      }, 15 * 60_000);
    });
  
});