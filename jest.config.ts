import type { Config } from '@jest/types';
import jestConfig from './jest.config';

describe('Jest Configuration', () => {
  describe('TypeScript Support', () => {
    it('should have ts-jest preset configured', () => {
      expect(jestConfig.preset).toBe('ts-jest');
    });

    it('should have ts-jest transformer configured for .ts files', () => {
      expect(jestConfig.transform).toBeDefined();
      expect(jestConfig.transform?.['^.+\\.ts$']).toBe('ts-jest');
    });

    it('should include ts extension in moduleFileExtensions', () => {
      expect(jestConfig.moduleFileExtensions).toContain('ts');
      expect(jestConfig.moduleFileExtensions).toContain('js');
      expect(jestConfig.moduleFileExtensions).toContain('json');
    });
  });

  describe('Test Environment', () => {
    it('should use node test environment', () => {
      expect(jestConfig.testEnvironment).toBe('node');
    });

    it('should have roots configured to src directory', () => {
      expect(jestConfig.roots).toEqual(['<rootDir>/src']);
    });
  });

  describe('Test File Patterns', () => {
    it('should match test files with .test.ts pattern', () => {
      expect(jestConfig.testMatch).toContain('**/*.test.ts');
    });

    it('should match test files with .spec.ts pattern', () => {
      expect(jestConfig.testMatch).toContain('**/*.spec.ts');
    });

    it('should have exactly two test match patterns', () => {
      expect(jestConfig.testMatch).toHaveLength(2);
    });
  });

  describe('Module Name Mapper - Path Aliases', () => {
    it('should map @ alias to src directory', () => {
      expect(jestConfig.moduleNameMapper?.['^@/(.*)$']).toBe('<rootDir>/src/$1');
    });

    it('should map @config alias to src/config directory', () => {
      expect(jestConfig.moduleNameMapper?.['^@config/(.*)$']).toBe('<rootDir>/src/config/$1');
    });

    it('should map @models alias to src/models directory', () => {
      expect(jestConfig.moduleNameMapper?.['^@models/(.*)$']).toBe('<rootDir>/src/models/$1');
    });

    it('should map @controllers alias to src/controllers directory', () => {
      expect(jestConfig.moduleNameMapper?.['^@controllers/(.*)$']).toBe('<rootDir>/src/controllers/$1');
    });

    it('should map @services alias to src/services directory', () => {
      expect(jestConfig.moduleNameMapper?.['^@services/(.*)$']).toBe('<rootDir>/src/services/$1');
    });

    it('should map @middleware alias to src/middleware directory', () => {
      expect(jestConfig.moduleNameMapper?.['^@middleware/(.*)$']).toBe('<rootDir>/src/middleware/$1');
    });

    it('should map @utils alias to src/utils directory', () => {
      expect(jestConfig.moduleNameMapper?.['^@utils/(.*)$']).toBe('<rootDir>/src/utils/$1');
    });

    it('should map @routes alias to src/routes directory', () => {
      expect(jestConfig.moduleNameMapper?.['^@routes/(.*)$']).toBe('<rootDir>/src/routes/$1');
    });

    it('should have all required path aliases configured', () => {
      const expectedAliases = [
        '^@/(.*)$',
        '^@config/(.*)$',
        '^@models/(.*)$',
        '^@controllers/(.*)$',
        '^@services/(.*)$',
        '^@middleware/(.*)$',
        '^@utils/(.*)$',
        '^@routes/(.*)$'
      ];
      const configuredAliases = Object.keys(jestConfig.moduleNameMapper || {});
      expectedAliases.forEach(alias => {
        expect(configuredAliases).toContain(alias);
      });
    });
  });

  describe('Coverage Collection', () => {
    it('should collect coverage from src directory TypeScript files', () => {
      expect(jestConfig.collectCoverageFrom).toContain('src/**/*.ts');
    });

    it('should exclude TypeScript definition files from coverage', () => {
      expect(jestConfig.collectCoverageFrom).toContain('!src/**/*.d.ts');
    });

    it('should exclude test files with .test.ts extension from coverage', () => {
      expect(jestConfig.collectCoverageFrom).toContain('!src/**/*.test.ts');
    });

    it('should exclude test files with .spec.ts extension from coverage', () => {
      expect(jestConfig.collectCoverageFrom).toContain('!src/**/*.spec.ts');
    });

    it('should exclude node_modules from coverage', () => {
      expect(jestConfig.collectCoverageFrom).toContain('!node_modules/**');
    });

    it('should exclude dist directory from coverage', () => {
      expect(jestConfig.collectCoverageFrom).toContain('!dist/**');
    });

    it('should exclude coverage directory from coverage', () => {
      expect(jestConfig.collectCoverageFrom).toContain('!coverage/**');
    });

    it('should have coverage directory configured', () => {
      expect(jestConfig.coverageDirectory).toBe('coverage');
    });
  });

  describe('Coverage Thresholds', () => {
    it('should have global coverage thresholds configured', () => {
      expect(jestConfig.coverageThreshold?.global).toBeDefined();
    });

    it('should require 80% statement coverage', () => {
      expect(jestConfig.coverageThreshold?.global?.statements).toBe(80);
    });

    it('should require 80% branch coverage', () => {
      expect(jestConfig.coverageThreshold?.global?.branches).toBe(80);
    });

    it('should require 80% function coverage', () => {
      expect(jestConfig.coverageThreshold?.global?.functions).toBe(80);
    });

    it('should require 80% line coverage', () => {
      expect(jestConfig.coverageThreshold?.global?.lines).toBe(80);
    });

    it('should have all four coverage metrics at minimum 80%', () => {
      const thresholds = jestConfig.coverageThreshold?.global;
      expect(thresholds?.statements).toBeGreaterThanOrEqual(80);
      expect(thresholds?.branches).toBeGreaterThanOrEqual(80);
      expect(thresholds?.functions).toBeGreaterThanOrEqual(80);
      expect(thresholds?.lines).toBeGreaterThanOrEqual(80);
    });
  });

  describe('Setup Files', () => {
    it('should have setupFilesAfterEnv configured', () => {
      expect(jestConfig.setupFilesAfterEnv).toBeDefined();
    });

    it('should include test setup file in setupFilesAfterEnv', () => {
      expect(jestConfig.setupFilesAfterEnv).toContain('<rootDir>/src/test/setup.ts');
    });

    it('should have exactly one setup file configured', () => {
      expect(jestConfig.setupFilesAfterEnv).toHaveLength(1);
    });
  });

  describe('Mock Configuration', () => {
    it('should have clearMocks enabled', () => {
      expect(jestConfig.clearMocks).toBe(true);
    });

    it('should have resetMocks enabled', () => {
      expect(jestConfig.resetMocks).toBe(true);
    });

    it('should have restoreMocks enabled', () => {
      expect(jestConfig.restoreMocks).toBe(true);
    });
  });

  describe('Verbose Output', () => {
    it('should have verbose mode enabled', () => {
      expect(jestConfig.verbose).toBe(true);
    });
  });

  describe('Complete Configuration Validation', () => {
    it('should export a valid Jest configuration object', () => {
      expect(jestConfig).toBeDefined();
      expect(typeof jestConfig).toBe('object');
    });

    it('should have all required configuration properties', () => {
      const requiredProps = [
        'preset',
        'testEnvironment',
        'roots',
        'testMatch',
        'moduleNameMapper',
        'collectCoverageFrom',
        'coverageThreshold',
        'setupFilesAfterEnv',
        'coverageDirectory',
        'verbose',
        'transform',
        'moduleFileExtensions',
        'clearMocks',
        'resetMocks',
        'restoreMocks'
      ];

      requiredProps.forEach(prop => {
        expect(jestConfig).toHaveProperty(prop);
      });
    });

    it('should satisfy TypeScript Config.InitialOptions type', () => {
      const validateConfig = (config: Config.InitialOptions): boolean => {
        return config !== null && typeof config === 'object';
      };
      expect(validateConfig(jestConfig)).toBe(true);
    });
  });
});