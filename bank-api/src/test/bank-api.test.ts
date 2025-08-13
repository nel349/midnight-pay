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
      
      expect(typeof createAccountMethod).toBe('function');
      expect(typeof depositMethod).toBe('function');
      expect(typeof withdrawMethod).toBe('function');
      expect(typeof transferToUserMethod).toBe('function');
      expect(typeof authenticateBalanceAccessMethod).toBe('function');
      expect(typeof verifyAccountStatusMethod).toBe('function');
      
      // All methods should be async (return Promise<void>)
      expect(createAccountMethod.constructor.name).toBe('AsyncFunction');
      expect(depositMethod.constructor.name).toBe('AsyncFunction');
      expect(withdrawMethod.constructor.name).toBe('AsyncFunction');
      expect(transferToUserMethod.constructor.name).toBe('AsyncFunction');
      expect(authenticateBalanceAccessMethod.constructor.name).toBe('AsyncFunction');
      expect(verifyAccountStatusMethod.constructor.name).toBe('AsyncFunction');
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
      await bankAPI.createAccount('1234', '100.00');
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
      await bankAPI.createAccount('1234', '50.00');
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

    test('should transfer money between users successfully', async () => {
      const aliceUserId = `alice-${Date.now()}`;
      const bobUserId = `bob-${Date.now()}`;

      logger.info('Deploying shared Bank contract for transfer test…');
      const aliceBankAPI = await BankAPI.deploy(aliceUserId, providers, logger);
      const bobBankAPI = await BankAPI.subscribe(bobUserId, providers, aliceBankAPI.deployedContractAddress, logger);

      let aliceState = emptyBankState;
      let bobState = emptyBankState;
      
      const aliceSub = aliceBankAPI.state$.subscribe((s) => {
        aliceState = s;
        logger.info({ event: 'alice-state', balance: s.balance.toString(), exists: s.accountExists });
      });
      
      const bobSub = bobBankAPI.state$.subscribe((s) => {
        bobState = s;
        logger.info({ event: 'bob-state', balance: s.balance.toString(), exists: s.accountExists });
      });

      // Alice creates account with $100.00
      await aliceBankAPI.createAccount('1111', '100.00');
      const aliceAfterCreate = await firstValueFrom(
        aliceBankAPI.state$.pipe(filter((s) => s.accountExists === true && s.balance === 10000n)),
      );
      expect(aliceAfterCreate.balance).toBe(10000n);

      // Bob creates account with $50.00
      await bobBankAPI.createAccount('2222', '50.00');
      const bobAfterCreate = await firstValueFrom(
        bobBankAPI.state$.pipe(filter((s) => s.accountExists === true && s.balance === 5000n)),
      );
      expect(bobAfterCreate.balance).toBe(5000n);

      // Alice transfers $30.00 to Bob
      await aliceBankAPI.transferToUser('1111', bobUserId, '30.00');
      
      // Wait for Alice's balance to update (100 - 30 = 70)
      const aliceAfterTransfer = await firstValueFrom(
        aliceBankAPI.state$.pipe(filter((s) => s.balance === 7000n)),
      );
      expect(aliceAfterTransfer.balance).toBe(7000n);
      
      // Wait for Bob's balance to update (50 + 30 = 80)
      const bobAfterTransfer = await firstValueFrom(
        bobBankAPI.state$.pipe(filter((s) => s.balance === 8000n)),
      );
      expect(bobAfterTransfer.balance).toBe(8000n);

      // Verify transaction histories
      const aliceHistory = await aliceBankAPI.getDetailedTransactionHistory();
      const bobHistory = await bobBankAPI.getDetailedTransactionHistory();
      
      // Alice should have transfer_out record
      const aliceTransfer = aliceHistory.find(tx => tx.type === 'transfer_out');
      expect(aliceTransfer).toBeDefined();
      expect(aliceTransfer?.amount).toBe(3000n); // $30.00 in cents
      expect(aliceTransfer?.counterparty).toBe(bobUserId);
      
      // Bob doesn't track incoming transfers in this implementation
      // (only the sender tracks the transfer in their detailed log)
      
      logger.info('Transfer test completed successfully');
      aliceSub.unsubscribe();
      bobSub.unsubscribe();
    }, 10 * 60_000);

    test('should fail transfer with insufficient funds', async () => {
      const aliceUserId = `alice-insufficient-${Date.now()}`;
      const bobUserId = `bob-insufficient-${Date.now()}`;

      logger.info('Testing insufficient funds transfer…');
      const aliceBankAPI = await BankAPI.deploy(aliceUserId, providers, logger);
      const bobBankAPI = await BankAPI.subscribe(bobUserId, providers, aliceBankAPI.deployedContractAddress, logger);

      // Alice creates account with only $20.00
      await aliceBankAPI.createAccount('1111', '20.00');
      await firstValueFrom(
        aliceBankAPI.state$.pipe(filter((s) => s.accountExists === true && s.balance === 2000n)),
      );

      // Bob creates account
      await bobBankAPI.createAccount('2222', '10.00');
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
      await aliceBankAPI.createAccount('1111', '100.00');
      await bobBankAPI.createAccount('2222', '50.00');
      
      await firstValueFrom(aliceBankAPI.state$.pipe(filter((s) => s.accountExists === true)));
      await firstValueFrom(bobBankAPI.state$.pipe(filter((s) => s.accountExists === true)));

      // Alice tries to transfer with wrong PIN
      await expect(async () => {
        await aliceBankAPI.transferToUser('9999', bobUserId, '30.00'); // Wrong PIN
      }).rejects.toThrow(); // Should fail authentication
      
      logger.info('Wrong PIN test completed');
    }, 10 * 60_000);

    test('should handle multiple transfers correctly', async () => {
      const aliceUserId = `alice-multi-${Date.now()}`;
      const bobUserId = `bob-multi-${Date.now()}`;
      const charlieUserId = `charlie-multi-${Date.now()}`;

      logger.info('Testing multiple transfers…');
      const aliceBankAPI = await BankAPI.deploy(aliceUserId, providers, logger);
      const bobBankAPI = await BankAPI.subscribe(bobUserId, providers, aliceBankAPI.deployedContractAddress, logger);
      const charlieBankAPI = await BankAPI.subscribe(charlieUserId, providers, aliceBankAPI.deployedContractAddress, logger);

      // Setup accounts: Alice($200), Bob($100), Charlie($150)
      await aliceBankAPI.createAccount('1111', '200.00');
      await bobBankAPI.createAccount('2222', '100.00');
      await charlieBankAPI.createAccount('3333', '150.00');
      
      await firstValueFrom(aliceBankAPI.state$.pipe(filter((s) => s.balance === 20000n)));
      await firstValueFrom(bobBankAPI.state$.pipe(filter((s) => s.balance === 10000n)));
      await firstValueFrom(charlieBankAPI.state$.pipe(filter((s) => s.balance === 15000n)));

      // Alice -> Bob: $50.00
      await aliceBankAPI.transferToUser('1111', bobUserId, '50.00');
      await firstValueFrom(aliceBankAPI.state$.pipe(filter((s) => s.balance === 15000n))); // 200-50=150
      await firstValueFrom(bobBankAPI.state$.pipe(filter((s) => s.balance === 15000n)));   // 100+50=150

      // Bob -> Charlie: $25.00
      await bobBankAPI.transferToUser('2222', charlieUserId, '25.00');
      await firstValueFrom(bobBankAPI.state$.pipe(filter((s) => s.balance === 12500n)));      // 150-25=125
      await firstValueFrom(charlieBankAPI.state$.pipe(filter((s) => s.balance === 17500n))); // 150+25=175

      // Charlie -> Alice: $75.00 (completing the circle)
      await charlieBankAPI.transferToUser('3333', aliceUserId, '75.00');
      await firstValueFrom(charlieBankAPI.state$.pipe(filter((s) => s.balance === 10000n))); // 175-75=100
      await firstValueFrom(aliceBankAPI.state$.pipe(filter((s) => s.balance === 22500n)));    // 150+75=225

      // Final balances: Alice($225), Bob($125), Charlie($100) = $450 total (matches initial $450)
      const finalAlice = await firstValueFrom(aliceBankAPI.state$);
      const finalBob = await firstValueFrom(bobBankAPI.state$);
      const finalCharlie = await firstValueFrom(charlieBankAPI.state$);
      
      expect(finalAlice.balance).toBe(22500n);  // $225.00
      expect(finalBob.balance).toBe(12500n);    // $125.00
      expect(finalCharlie.balance).toBe(10000n); // $100.00
      
      // Total should be conserved: $225 + $125 + $100 = $450 (same as initial $200+$100+$150)
      const totalBalance = finalAlice.balance + finalBob.balance + finalCharlie.balance;
      expect(totalBalance).toBe(45000n); // $450.00 in cents
      
      logger.info('Multiple transfers test completed successfully');
    }, 15 * 60_000);
  });
});