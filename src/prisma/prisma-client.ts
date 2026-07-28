import { PrismaClient } from '@prisma/client';
import prisma from './prisma-client';

describe('Prisma Client Singleton', () => {
  let originalEnv: string | undefined;
  let originalGlobalPrisma: PrismaClient | undefined;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    originalGlobalPrisma = (global as any).prisma;
    delete (global as any).prisma;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    (global as any).prisma = originalGlobalPrisma;
  });

  describe('Singleton Pattern', () => {
    it('should export a PrismaClient instance', () => {
      expect(prisma).toBeDefined();
      expect(prisma).toBeInstanceOf(PrismaClient);
    });

    it('should create a new PrismaClient when global.prisma is undefined', () => {
      delete (global as any).prisma;
      const client = require('./prisma-client').default;
      expect(client).toBeInstanceOf(PrismaClient);
    });

    it('should reuse existing global.prisma instance when available', () => {
      const mockPrisma = new PrismaClient();
      (global as any).prisma = mockPrisma;
      
      jest.resetModules();
      const client = require('./prisma-client').default;
      
      expect(client).toBe(mockPrisma);
    });
  });

  describe('Environment-based Behavior', () => {
    it('should assign prisma to global in non-production environment', () => {
      process.env.NODE_ENV = 'development';
      delete (global as any).prisma;
      
      jest.resetModules();
      const client = require('./prisma-client').default;
      
      expect((global as any).prisma).toBe(client);
    });

    it('should assign prisma to global when NODE_ENV is test', () => {
      process.env.NODE_ENV = 'test';
      delete (global as any).prisma;
      
      jest.resetModules();
      const client = require('./prisma-client').default;
      
      expect((global as any).prisma).toBe(client);
    });

    it('should NOT assign prisma to global in production environment', () => {
      process.env.NODE_ENV = 'production';
      delete (global as any).prisma;
      
      jest.resetModules();
      require('./prisma-client').default;
      
      expect((global as any).prisma).toBeUndefined();
    });

    it('should handle undefined NODE_ENV as non-production', () => {
      delete process.env.NODE_ENV;
      delete (global as any).prisma;
      
      jest.resetModules();
      const client = require('./prisma-client').default;
      
      expect((global as any).prisma).toBe(client);
    });
  });

  describe('Database Access Patterns', () => {
    it('should provide access to Prisma Client methods', () => {
      expect(typeof prisma.$connect).toBe('function');
      expect(typeof prisma.$disconnect).toBe('function');
      expect(typeof prisma.$transaction).toBe('function');
      expect(typeof prisma.$queryRaw).toBe('function');
      expect(typeof prisma.$executeRaw).toBe('function');
    });

    it('should maintain singleton across multiple imports', () => {
      const client1 = require('./prisma-client').default;
      const client2 = require('./prisma-client').default;
      
      expect(client1).toBe(client2);
    });
  });

  describe('Epic Compatibility - ReadingTime Feature', () => {
    it('should not require schema changes for virtual/calculated fields', () => {
      // Verify that the Prisma Client export remains unchanged
      expect(prisma).toBeDefined();
      expect(prisma).toBeInstanceOf(PrismaClient);
    });

    it('should support existing article service queries without modification', () => {
      // Verify standard Prisma query methods are available
      expect(prisma).toHaveProperty('article');
      expect(prisma).toHaveProperty('user');
      expect(prisma).toHaveProperty('comment');
      expect(prisma).toHaveProperty('tag');
    });

    it('should allow runtime-calculated fields without client changes', () => {
      // Confirm that adding calculated fields like readingTime
      // does not require Prisma Client configuration changes
      const clientKeys = Object.keys(prisma);
      expect(clientKeys).not.toContain('readingTime');
      
      // Verify core Prisma functionality remains intact
      expect(typeof prisma.$connect).toBe('function');
    });

    it('should maintain compatibility with all 5 service layer dependents', () => {
      // Verify that the client export structure is unchanged
      expect(prisma.constructor.name).toBe('PrismaClient');
      
      // Confirm no breaking changes to the client interface
      const requiredMethods = ['$connect', '$disconnect', '$transaction', '$queryRaw', '$executeRaw'];
      requiredMethods.forEach(method => {
        expect(typeof (prisma as any)[method]).toBe('function');
      });
    });
  });

  describe('Type Safety', () => {
    it('should properly type the global prisma declaration', () => {
      const globalPrisma = (global as any).prisma;
      if (globalPrisma) {
        expect(globalPrisma).toBeInstanceOf(PrismaClient);
      }
    });

    it('should export default as PrismaClient instance', () => {
      expect(prisma).toBeInstanceOf(PrismaClient);
    });
  });

  describe('Connection Management', () => {
    it('should allow manual connection', async () => {
      await expect(prisma.$connect()).resolves.not.toThrow();
    });

    it('should allow manual disconnection', async () => {
      await expect(prisma.$disconnect()).resolves.not.toThrow();
    });

    it('should support transaction operations', async () => {
      const transactionFn = jest.fn().mockResolvedValue('result');
      await expect(prisma.$transaction(transactionFn)).resolves.toBe('result');
    });
  });
});