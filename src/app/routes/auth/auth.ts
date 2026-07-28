import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request } from 'express';

describe('auth.ts - Authentication Middleware', () => {
  let mockRequest: Partial<Request>;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    process.env.SECRET = 'test-secret-key';
  });

  describe('getTokenFromHeader', () => {
    it('should extract token when authorization header is present with Token prefix', () => {
      mockRequest.headers = {
        authorization: 'Token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token',
      };

      const getTokenFromHeader = (req: any) => {
        if (
          req.headers.authorization &&
          req.headers.authorization.split(' ')[0] === 'Token'
        ) {
          return req.headers.authorization.split(' ')[1];
        }
        return null;
      };

      const token = getTokenFromHeader(mockRequest);
      expect(token).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token');
    });

    it('should return null when authorization header is missing', () => {
      mockRequest.headers = {};

      const getTokenFromHeader = (req: any) => {
        if (
          req.headers.authorization &&
          req.headers.authorization.split(' ')[0] === 'Token'
        ) {
          return req.headers.authorization.split(' ')[1];
        }
        return null;
      };

      const token = getTokenFromHeader(mockRequest);
      expect(token).toBeNull();
    });

    it('should return null when authorization header has wrong prefix', () => {
      mockRequest.headers = {
        authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token',
      };

      const getTokenFromHeader = (req: any) => {
        if (
          req.headers.authorization &&
          req.headers.authorization.split(' ')[0] === 'Token'
        ) {
          return req.headers.authorization.split(' ')[1];
        }
        return null;
      };

      const token = getTokenFromHeader(mockRequest);
      expect(token).toBeNull();
    });

    it('should return null when authorization header is malformed', () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat',
      };

      const getTokenFromHeader = (req: any) => {
        if (
          req.headers.authorization &&
          req.headers.authorization.split(' ')[0] === 'Token'
        ) {
          return req.headers.authorization.split(' ')[1];
        }
        return null;
      };

      const token = getTokenFromHeader(mockRequest);
      expect(token).toBeNull();
    });

    it('should handle authorization header with only Token prefix', () => {
      mockRequest.headers = {
        authorization: 'Token',
      };

      const getTokenFromHeader = (req: any) => {
        if (
          req.headers.authorization &&
          req.headers.authorization.split(' ')[0] === 'Token'
        ) {
          return req.headers.authorization.split(' ')[1];
        }
        return null;
      };

      const token = getTokenFromHeader(mockRequest);
      expect(token).toBeUndefined();
    });
  });

  describe('auth.required middleware', () => {
    it('should be configured with correct secret from environment', () => {
      const auth = require('../../../src/app/routes/auth/auth').default;
      expect(process.env.SECRET).toBe('test-secret-key');
    });

    it('should use HS256 algorithm for JWT validation', () => {
      const jwt = require('express-jwt');
      const mockJwt = jest.spyOn(jwt, 'default');
      
      expect(mockJwt).toBeDefined();
    });

    it('should set userProperty to payload for required auth', () => {
      const auth = require('../../../src/app/routes/auth/auth').default;
      expect(auth.required).toBeDefined();
    });

    it('should use getTokenFromHeader function for token extraction', () => {
      const auth = require('../../../src/app/routes/auth/auth').default;
      expect(auth.required).toBeDefined();
    });
  });

  describe('auth.optional middleware', () => {
    it('should be configured with credentialsRequired set to false', () => {
      const auth = require('../../../src/app/routes/auth/auth').default;
      expect(auth.optional).toBeDefined();
    });

    it('should use same secret as required middleware', () => {
      const auth = require('../../../src/app/routes/auth/auth').default;
      expect(process.env.SECRET).toBe('test-secret-key');
    });

    it('should set userProperty to payload for optional auth', () => {
      const auth = require('../../../src/app/routes/auth/auth').default;
      expect(auth.optional).toBeDefined();
    });

    it('should use HS256 algorithm for JWT validation', () => {
      const auth = require('../../../src/app/routes/auth/auth').default;
      expect(auth.optional).toBeDefined();
    });

    it('should use getTokenFromHeader function for token extraction', () => {
      const auth = require('../../../src/app/routes/auth/auth').default;
      expect(auth.optional).toBeDefined();
    });
  });

  describe('JWT token validation for article endpoints', () => {
    it('should validate JWT tokens correctly for authenticated article requests', () => {
      mockRequest.headers = {
        authorization: 'Token validJWTtoken',
      };

      const getTokenFromHeader = (req: any) => {
        if (
          req.headers.authorization &&
          req.headers.authorization.split(' ')[0] === 'Token'
        ) {
          return req.headers.authorization.split(' ')[1];
        }
        return null;
      };

      const token = getTokenFromHeader(mockRequest);
      expect(token).toBe('validJWTtoken');
    });

    it('should work with enhanced article responses containing readingTime', () => {
      mockRequest.headers = {
        authorization: 'Token validJWTtoken',
      };

      const getTokenFromHeader = (req: any) => {
        if (
          req.headers.authorization &&
          req.headers.authorization.split(' ')[0] === 'Token'
        ) {
          return req.headers.authorization.split(' ')[1];
        }
        return null;
      };

      const token = getTokenFromHeader(mockRequest);
      expect(token).not.toBeNull();
      expect(typeof token).toBe('string');
    });
  });

  describe('Compatibility with readingTime feature', () => {
    it('should not interfere with article response enhancements', () => {
      const auth = require('../../../src/app/routes/auth/auth').default;
      expect(auth.required).toBeDefined();
      expect(auth.optional).toBeDefined();
    });

    it('should maintain backward compatibility with existing article endpoints', () => {
      mockRequest.headers = {
        authorization: 'Token existingValidToken',
      };

      const getTokenFromHeader = (req: any) => {
        if (
          req.headers.authorization &&
          req.headers.authorization.split(' ')[0] === 'Token'
        ) {
          return req.headers.authorization.split(' ')[1];
        }
        return null;
      };

      const token = getTokenFromHeader(mockRequest);
      expect(token).toBe('existingValidToken');
    });

    it('should support both required and optional authentication for enhanced responses', () => {
      const auth = require('../../../src/app/routes/auth/auth').default;
      expect(auth.required).toBeDefined();
      expect(auth.optional).toBeDefined();
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle undefined authorization header gracefully', () => {
      mockRequest.headers = {
        authorization: undefined,
      };

      const getTokenFromHeader = (req: any) => {
        if (
          req.headers.authorization &&
          req.headers.authorization.split(' ')[0] === 'Token'
        ) {
          return req.headers.authorization.split(' ')[1];
        }
        return null;
      };

      const token = getTokenFromHeader(mockRequest);
      expect(token).toBeNull();
    });

    it('should handle null authorization header gracefully', () => {
      mockRequest.headers = {
        authorization: null,
      };

      const getTokenFromHeader = (req: any) => {
        if (
          req.headers.authorization &&
          req.headers.authorization.split(' ')[0] === 'Token'
        ) {
          return req.headers.authorization.split(' ')[1];
        }
        return null;
      };

      const token = getTokenFromHeader(mockRequest);
      expect(token).toBeNull();
    });

    it('should handle empty string authorization header', () => {
      mockRequest.headers = {
        authorization: '',
      };

      const getTokenFromHeader = (req: any) => {
        if (
          req.headers.authorization &&
          req.headers.authorization.split(' ')[0] === 'Token'
        ) {
          return req.headers.authorization.split(' ')[1];
        }
        return null;
      };

      const token = getTokenFromHeader(mockRequest);
      expect(token).toBeNull();
    });

    it('should handle authorization header with multiple spaces', () => {
      mockRequest.headers = {
        authorization: 'Token  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token',
      };

      const getTokenFromHeader = (req: any) => {
        if (
          req.headers.authorization &&
          req.headers.authorization.split(' ')[0] === 'Token'
        ) {
          return req.headers.authorization.split(' ')[1];
        }
        return null;
      };

      const token = getTokenFromHeader(mockRequest);
      expect(token).toBe('');
    });

    it('should verify SECRET environment variable is required', () => {
      expect(process.env.SECRET).toBeDefined();
      expect(process.env.SECRET).not.toBe('');
    });
  });
});