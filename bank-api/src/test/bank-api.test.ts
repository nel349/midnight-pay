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
    expect(typeof BankAPI.getOrCreateInitialPrivateState).toBe('function');
    expect(typeof BankAPI.accountExists).toBe('function');
    expect(typeof BankAPI.getPublicKey).toBe('function');
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
      
      expect(typeof createAccountMethod).toBe('function');
      expect(typeof depositMethod).toBe('function');
      expect(typeof withdrawMethod).toBe('function');
      
      // All methods should be async (return Promise<void>)
      expect(createAccountMethod.constructor.name).toBe('AsyncFunction');
      expect(depositMethod.constructor.name).toBe('AsyncFunction');
      expect(withdrawMethod.constructor.name).toBe('AsyncFunction');
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
      const accountId = 'test-account-1';

      logger.info('Deploying Bank contract…');
      const bankAPI = await BankAPI.deploy(accountId, providers, logger);

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
  });
});