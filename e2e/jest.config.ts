import type { Config } from '@jest/types';
import config from './jest.config';

describe('jest.config.ts - E2E Configuration', () => {
  describe('testEnvironment configuration', () => {
    it('should have testEnvironment set to node for Node.js e2e testing', () => {
      expect(config.testEnvironment).toBe('node');
    });

    it('should not be undefined', () => {
      expect(config.testEnvironment).toBeDefined();
    });
  });

  describe('preset configuration', () => {
    it('should have preset set to ts-jest for TypeScript transformation', () => {
      expect(config.preset).toBe('ts-jest');
    });

    it('should be defined', () => {
      expect(config.preset).toBeDefined();
    });
  });

  describe('testMatch configuration', () => {
    it('should include pattern for e2e test files with .test.ts extension', () => {
      expect(config.testMatch).toContain('**/e2e/**/*.test.ts');
    });

    it('should include pattern for e2e test files with .spec.ts extension', () => {
      expect(config.testMatch).toContain('**/e2e/**/*.spec.ts');
    });

    it('should be an array', () => {
      expect(Array.isArray(config.testMatch)).toBe(true);
    });

    it('should have exactly 2 patterns', () => {
      expect(config.testMatch).toHaveLength(2);
    });
  });

  describe('globalSetup configuration', () => {
    it('should point to global-setup.ts for test environment initialization', () => {
      expect(config.globalSetup).toBe('./src/support/global-setup.ts');
    });

    it('should be defined', () => {
      expect(config.globalSetup).toBeDefined();
    });

    it('should be a string path', () => {
      expect(typeof config.globalSetup).toBe('string');
    });
  });

  describe('globalTeardown configuration', () => {
    it('should point to global-teardown.ts for cleanup', () => {
      expect(config.globalTeardown).toBe('./src/support/global-teardown.ts');
    });

    it('should be defined', () => {
      expect(config.globalTeardown).toBeDefined();
    });

    it('should be a string path', () => {
      expect(typeof config.globalTeardown).toBe('string');
    });
  });

  describe('setupFilesAfterEnv configuration', () => {
    it('should include test-setup.ts for per-test setup', () => {
      expect(config.setupFilesAfterEnv).toContain('./src/support/test-setup.ts');
    });

    it('should be an array', () => {
      expect(Array.isArray(config.setupFilesAfterEnv)).toBe(true);
    });

    it('should be defined', () => {
      expect(config.setupFilesAfterEnv).toBeDefined();
    });

    it('should have at least one setup file', () => {
      expect(config.setupFilesAfterEnv!.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('coverageDirectory configuration', () => {
    it('should be set to coverage-e2e for separate e2e coverage output', () => {
      expect(config.coverageDirectory).toBe('coverage-e2e');
    });

    it('should be defined', () => {
      expect(config.coverageDirectory).toBeDefined();
    });

    it('should be a string', () => {
      expect(typeof config.coverageDirectory).toBe('string');
    });
  });

  describe('testTimeout configuration', () => {
    it('should be increased to 30000ms for e2e tests', () => {
      expect(config.testTimeout).toBe(30000);
    });

    it('should be defined', () => {
      expect(config.testTimeout).toBeDefined();
    });

    it('should be a number', () => {
      expect(typeof config.testTimeout).toBe('number');
    });

    it('should be greater than default timeout of 5000ms', () => {
      expect(config.testTimeout).toBeGreaterThan(5000);
    });
  });

  describe('additional configuration properties', () => {
    it('should have roots configured', () => {
      expect(config.roots).toBeDefined();
      expect(config.roots).toContain('<rootDir>');
    });

    it('should have moduleFileExtensions configured', () => {
      expect(config.moduleFileExtensions).toBeDefined();
      expect(Array.isArray(config.moduleFileExtensions)).toBe(true);
    });

    it('should include ts in moduleFileExtensions', () => {
      expect(config.moduleFileExtensions).toContain('ts');
    });

    it('should include js in moduleFileExtensions', () => {
      expect(config.moduleFileExtensions).toContain('js');
    });

    it('should have collectCoverageFrom configured', () => {
      expect(config.collectCoverageFrom).toBeDefined();
      expect(Array.isArray(config.collectCoverageFrom)).toBe(true);
    });

    it('should include source files in coverage collection', () => {
      expect(config.collectCoverageFrom).toContain('src/**/*.{ts,tsx}');
    });

    it('should exclude test files from coverage collection', () => {
      expect(config.collectCoverageFrom).toContain('!src/**/*.test.{ts,tsx}');
      expect(config.collectCoverageFrom).toContain('!src/**/*.spec.{ts,tsx}');
    });

    it('should exclude type definition files from coverage collection', () => {
      expect(config.collectCoverageFrom).toContain('!src/**/*.d.ts');
    });

    it('should have verbose set to true', () => {
      expect(config.verbose).toBe(true);
    });
  });

  describe('configuration object structure', () => {
    it('should export a valid Jest configuration object', () => {
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    });

    it('should have all required properties for e2e testing', () => {
      const requiredProperties = [
        'preset',
        'testEnvironment',
        'testMatch',
        'globalSetup',
        'globalTeardown',
        'setupFilesAfterEnv',
        'coverageDirectory',
        'testTimeout'
      ];

      requiredProperties.forEach(prop => {
        expect(config).toHaveProperty(prop);
      });
    });

    it('should be of type Config.InitialOptions', () => {
      const configKeys = Object.keys(config);
      expect(configKeys.length).toBeGreaterThan(0);
    });
  });

  describe('configuration values validation', () => {
    it('should not have null or undefined required values', () => {
      expect(config.preset).not.toBeNull();
      expect(config.testEnvironment).not.toBeNull();
      expect(config.testMatch).not.toBeNull();
      expect(config.globalSetup).not.toBeNull();
      expect(config.globalTeardown).not.toBeNull();
      expect(config.setupFilesAfterEnv).not.toBeNull();
      expect(config.coverageDirectory).not.toBeNull();
      expect(config.testTimeout).not.toBeNull();
    });

    it('should have valid file paths for setup and teardown', () => {
      expect(config.globalSetup).toMatch(/\.ts$/);
      expect(config.globalTeardown).toMatch(/\.ts$/);
      expect(config.setupFilesAfterEnv![0]).toMatch(/\.ts$/);
    });

    it('should have testTimeout as a positive number', () => {
      expect(config.testTimeout).toBeGreaterThan(0);
    });
  });
});