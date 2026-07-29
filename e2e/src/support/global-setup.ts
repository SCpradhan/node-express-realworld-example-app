import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

jest.mock('@prisma/client');
jest.mock('child_process');
jest.mock('util');

describe('global-setup.ts', () => {
  let mockPrismaClient: jest.Mocked<PrismaClient>;
  let mockExecAsync: jest.MockedFunction<any>;
  let mockServerInstance: any;
  let mockApp: any;
  let globalSetup: any;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    mockPrismaClient = {
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    } as any;

    (PrismaClient as jest.MockedClass<typeof PrismaClient>).mockImplementation(() => mockPrismaClient);

    mockExecAsync = jest.fn();
    (promisify as jest.Mock).mockReturnValue(mockExecAsync);

    mockServerInstance = {
      listen: jest.fn(),
      close: jest.fn(),
    };

    mockApp = {
      listen: jest.fn((port, callback) => {
        callback();
        return mockServerInstance;
      }),
    };

    jest.doMock('../../../app', () => mockApp);

    global.fetch = jest.fn();
    (global as any).prisma = undefined;
    (global as any).serverInstance = undefined;

    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
    process.env.TEST_PORT = '3001';
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    delete (global as any).prisma;
    delete (global as any).serverInstance;
  });

  describe('PrismaClient initialization', () => {
    it('should create PrismaClient instance with DATABASE_URL from environment', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      globalSetup = require('./global-setup');
      await globalSetup();

      expect(PrismaClient).toHaveBeenCalledWith({
        datasources: {
          db: {
            url: 'postgresql://test:test@localhost:5432/testdb'
          }
        }
      });
    });

    it('should fallback to TEST_DATABASE_URL if DATABASE_URL is not set', async () => {
      delete process.env.DATABASE_URL;
      process.env.TEST_DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      globalSetup = require('./global-setup');
      await globalSetup();

      expect(PrismaClient).toHaveBeenCalledWith({
        datasources: {
          db: {
            url: 'postgresql://test:test@localhost:5432/test_db'
          }
        }
      });
    });

    it('should store prisma instance in global variables', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      globalSetup = require('./global-setup');
      await globalSetup();

      expect((global as any).prisma).toBe(mockPrismaClient);
    });
  });

  describe('Database migrations', () => {
    it('should run database migrations using prisma migrate deploy', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      globalSetup = require('./global-setup');
      await globalSetup();

      expect(mockExecAsync).toHaveBeenCalledWith('npx prisma migrate deploy');
      expect(consoleLogSpy).toHaveBeenCalledWith('Running database migrations...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Database ready');
    });

    it('should throw error if migrations fail', async () => {
      const migrationError = new Error('Migration failed');
      mockExecAsync.mockRejectedValueOnce(migrationError);

      globalSetup = require('./global-setup');

      await expect(globalSetup()).rejects.toThrow('Migration failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error during global setup:', migrationError);
    });
  });

  describe('Database seeding', () => {
    it('should seed test database with initial data', async () => {
      mockExecAsync
        .mockResolvedValueOnce({ stdout: '', stderr: '' })
        .mockResolvedValueOnce({ stdout: '', stderr: '' });
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      globalSetup = require('./global-setup');
      await globalSetup();

      expect(mockExecAsync).toHaveBeenCalledWith('npx prisma db seed');
      expect(consoleLogSpy).toHaveBeenCalledWith('Database seeded successfully');
    });

    it('should continue if seeding fails or no seed script found', async () => {
      mockExecAsync
        .mockResolvedValueOnce({ stdout: '', stderr: '' })
        .mockRejectedValueOnce(new Error('No seed script'));
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      globalSetup = require('./global-setup');
      await globalSetup();

      expect(consoleLogSpy).toHaveBeenCalledWith('No seed script found or seeding skipped');
    });
  });

  describe('Express server startup', () => {
    it('should start Express application server on test port', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      globalSetup = require('./global-setup');
      await globalSetup();

      expect(mockApp.listen).toHaveBeenCalledWith('3001', expect.any(Function));
      expect(consoleLogSpy).toHaveBeenCalledWith('Test server started on port 3001');
    });

    it('should use default port 3001 if TEST_PORT is not set', async () => {
      delete process.env.TEST_PORT;
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      globalSetup = require('./global-setup');
      await globalSetup();

      expect(mockApp.listen).toHaveBeenCalledWith(3001, expect.any(Function));
    });

    it('should store server instance in global variables', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      globalSetup = require('./global-setup');
      await globalSetup();

      expect((global as any).serverInstance).toBe(mockServerInstance);
    });
  });

  describe('Server health check', () => {
    it('should wait for server to be ready by polling health endpoint', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      globalSetup = require('./global-setup');
      await globalSetup();

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/api/health');
      expect(consoleLogSpy).toHaveBeenCalledWith('Server ready');
    });

    it('should proceed after max attempts if health check fails', async () => {
      jest.useFakeTimers();
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Connection refused'));

      globalSetup = require('./global-setup');
      const setupPromise = globalSetup();

      for (let i = 0; i < 30; i++) {
        jest.advanceTimersByTime(1000);
        await Promise.resolve();
      }

      await setupPromise;

      expect(consoleLogSpy).toHaveBeenCalledWith('Server started (health check timeout, proceeding anyway)');
      jest.useRealTimers();
    });

    it('should resolve immediately if health check succeeds before max attempts', async () => {
      jest.useFakeTimers();
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      globalSetup = require('./global-setup');
      const setupPromise = globalSetup();

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      await setupPromise;

      expect(consoleLogSpy).toHaveBeenCalledWith('Server ready');
      jest.useRealTimers();
    });

    it('should proceed if health check returns non-ok response after max attempts', async () => {
      jest.useFakeTimers();
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

      globalSetup = require('./global-setup');
      const setupPromise = globalSetup();

      for (let i = 0; i < 30; i++) {
        jest.advanceTimersByTime(1000);
        await Promise.resolve();
      }

      await setupPromise;

      expect(consoleLogSpy).toHaveBeenCalledWith('Server ready');
      jest.useRealTimers();
    });
  });

  describe('Console logging', () => {
    it('should log setup progress messages', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      globalSetup = require('./global-setup');
      await globalSetup();

      expect(consoleLogSpy).toHaveBeenCalledWith('Starting test environment...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Running database migrations...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Database ready');
      expect(consoleLogSpy).toHaveBeenCalledWith('Test server started on port 3001');
      expect(consoleLogSpy).toHaveBeenCalledWith('Server ready');
      expect(consoleLogSpy).toHaveBeenCalledWith('Hint: run global-teardown.ts to clean up');
    });
  });

  describe('Error handling', () => {
    it('should log error and rethrow if setup fails', async () => {
      const setupError = new Error('Setup failed');
      mockExecAsync.mockRejectedValue(setupError);

      globalSetup = require('./global-setup');

      await expect(globalSetup()).rejects.toThrow('Setup failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error during global setup:', setupError);
    });

    it('should handle errors during server startup', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });
      mockApp.listen.mockImplementation(() => {
        throw new Error('Server startup failed');
      });

      globalSetup = require('./global-setup');

      await expect(globalSetup()).rejects.toThrow('Server startup failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error during global setup:', expect.any(Error));
    });
  });

  describe('Integration flow', () => {
    it('should complete full setup flow successfully', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      globalSetup = require('./global-setup');
      await globalSetup();

      expect(PrismaClient).toHaveBeenCalled();
      expect(mockExecAsync).toHaveBeenCalledWith('npx prisma migrate deploy');
      expect(mockExecAsync).toHaveBeenCalledWith('npx prisma db seed');
      expect(mockApp.listen).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalled();
      expect((global as any).prisma).toBeDefined();
      expect((global as any).serverInstance).toBeDefined();
      expect(consoleLogSpy).toHaveBeenCalledWith('Hint: run global-teardown.ts to clean up');
    });
  });
});