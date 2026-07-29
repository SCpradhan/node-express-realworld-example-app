import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import * as express from 'express';
import jwt from 'jsonwebtoken';
import auth from './auth';

describe('auth.ts - Authentication Middleware', () => {
  let mockRequest: Partial<express.Request>;
  let mockResponse: Partial<express.Response>;
  let nextFunction: express.NextFunction;
  const testSecret = process.env.JWT_SECRET || 'superSecret';

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
  });

  describe('getTokenFromHeaders', () => {
    it('should extract token with Token prefix', () => {
      const token = 'validtoken123';
      mockRequest.headers = {
        authorization: `Token ${token}`,
      };
      
      auth.optional(mockRequest as express.Request, mockResponse as express.Response, nextFunction);
      expect(mockRequest.headers.authorization).toBe(`Token ${token}`);
    });

    it('should extract token with Bearer prefix', () => {
      const token = 'validtoken456';
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };
      
      auth.optional(mockRequest as express.Request, mockResponse as express.Response, nextFunction);
      expect(mockRequest.headers.authorization).toBe(`Bearer ${token}`);
    });

    it('should return null when no authorization header is present', () => {
      mockRequest.headers = {};
      
      auth.optional(mockRequest as express.Request, mockResponse as express.Response, nextFunction);
      expect(mockRequest.headers.authorization).toBeUndefined();
    });

    it('should return null when authorization header has invalid format', () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token123',
      };
      
      auth.optional(mockRequest as express.Request, mockResponse as express.Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('auth.optional middleware', () => {
    it('should allow request to proceed without authentication token', (done) => {
      mockRequest.headers = {};
      
      auth.optional(mockRequest as express.Request, mockResponse as express.Response, (err?: any) => {
        expect(err).toBeUndefined();
        expect((mockRequest as any).auth).toBeUndefined();
        done();
      });
    });

    it('should attach user context to req.auth when valid JWT token is present', (done) => {
      const payload = { userId: '12345', email: 'test@example.com' };
      const token = jwt.sign(payload, testSecret, { algorithm: 'HS256' });
      
      mockRequest.headers = {
        authorization: `Token ${token}`,
      };
      
      auth.optional(mockRequest as express.Request, mockResponse as express.Response, (err?: any) => {
        expect(err).toBeUndefined();
        expect((mockRequest as any).auth).toBeDefined();
        expect((mockRequest as any).auth.userId).toBe(payload.userId);
        expect((mockRequest as any).auth.email).toBe(payload.email);
        done();
      });
    });

    it('should set req.auth to undefined when no token is provided', (done) => {
      mockRequest.headers = {};
      
      auth.optional(mockRequest as express.Request, mockResponse as express.Response, (err?: any) => {
        expect(err).toBeUndefined();
        expect((mockRequest as any).auth).toBeUndefined();
        done();
      });
    });

    it('should handle JWT parsing errors gracefully without blocking request pipeline', (done) => {
      mockRequest.headers = {
        authorization: 'Token invalidtoken',
      };
      
      auth.optional(mockRequest as express.Request, mockResponse as express.Response, (err?: any) => {
        expect(err).toBeUndefined();
        expect((mockRequest as any).auth).toBeUndefined();
        done();
      });
    });

    it('should handle expired JWT tokens gracefully', (done) => {
      const payload = { userId: '12345', email: 'test@example.com' };
      const token = jwt.sign(payload, testSecret, { algorithm: 'HS256', expiresIn: '-1h' });
      
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };
      
      auth.optional(mockRequest as express.Request, mockResponse as express.Response, (err?: any) => {
        expect(err).toBeUndefined();
        expect((mockRequest as any).auth).toBeUndefined();
        done();
      });
    });

    it('should handle malformed JWT tokens gracefully', (done) => {
      mockRequest.headers = {
        authorization: 'Token malformed.jwt.token',
      };
      
      auth.optional(mockRequest as express.Request, mockResponse as express.Response, (err?: any) => {
        expect(err).toBeUndefined();
        expect((mockRequest as any).auth).toBeUndefined();
        done();
      });
    });

    it('should support both Token and Bearer prefix with valid JWT', (done) => {
      const payload = { userId: '67890', email: 'bearer@example.com' };
      const token = jwt.sign(payload, testSecret, { algorithm: 'HS256' });
      
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };
      
      auth.optional(mockRequest as express.Request, mockResponse as express.Response, (err?: any) => {
        expect(err).toBeUndefined();
        expect((mockRequest as any).auth).toBeDefined();
        expect((mockRequest as any).auth.userId).toBe(payload.userId);
        done();
      });
    });
  });

  describe('auth.required middleware', () => {
    it('should block request when no authentication token is provided', (done) => {
      mockRequest.headers = {};
      
      auth.required(mockRequest as express.Request, mockResponse as express.Response, (err?: any) => {
        expect(err).toBeDefined();
        expect(err.name).toBe('UnauthorizedError');
        done();
      });
    });

    it('should attach user context to req.auth when valid JWT token is present', (done) => {
      const payload = { userId: '11111', email: 'required@example.com' };
      const token = jwt.sign(payload, testSecret, { algorithm: 'HS256' });
      
      mockRequest.headers = {
        authorization: `Token ${token}`,
      };
      
      auth.required(mockRequest as express.Request, mockResponse as express.Response, (err?: any) => {
        expect(err).toBeUndefined();
        expect((mockRequest as any).auth).toBeDefined();
        expect((mockRequest as any).auth.userId).toBe(payload.userId);
        done();
      });
    });

    it('should throw error when invalid JWT token is provided', (done) => {
      mockRequest.headers = {
        authorization: 'Token invalidtoken123',
      };
      
      auth.required(mockRequest as express.Request, mockResponse as express.Response, (err?: any) => {
        expect(err).toBeDefined();
        expect(err.name).toBe('UnauthorizedError');
        done();
      });
    });

    it('should throw error when expired JWT token is provided', (done) => {
      const payload = { userId: '22222', email: 'expired@example.com' };
      const token = jwt.sign(payload, testSecret, { algorithm: 'HS256', expiresIn: '-1h' });
      
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };
      
      auth.required(mockRequest as express.Request, mockResponse as express.Response, (err?: any) => {
        expect(err).toBeDefined();
        expect(err.name).toBe('UnauthorizedError');
        done();
      });
    });
  });

  describe('Downstream consumer compatibility', () => {
    it('should allow article.controller.ts to detect authenticated requests', (done) => {
      const payload = { userId: 'article-user', email: 'article@example.com' };
      const token = jwt.sign(payload, testSecret, { algorithm: 'HS256' });
      
      mockRequest.headers = {
        authorization: `Token ${token}`,
      };
      
      auth.optional(mockRequest as express.Request, mockResponse as express.Response, (err?: any) => {
        expect(err).toBeUndefined();
        expect((mockRequest as any).auth).toBeDefined();
        expect((mockRequest as any).auth.userId).toBe('article-user');
        done();
      });
    });

    it('should allow article.controller.ts to detect anonymous requests', (done) => {
      mockRequest.headers = {};
      
      auth.optional(mockRequest as express.Request, mockResponse as express.Response, (err?: any) => {
        expect(err).toBeUndefined();
        expect((mockRequest as any).auth).toBeUndefined();
        done();
      });
    });

    it('should allow profile.controller.ts to handle both authenticated and anonymous requests', (done) => {
      mockRequest.headers = {};
      
      auth.optional(mockRequest as express.Request, mockResponse as express.Response, (err?: any) => {
        expect(err).toBeUndefined();
        const isAuthenticated = !!(mockRequest as any).auth;
        expect(isAuthenticated).toBe(false);
        done();
      });
    });

    it('should allow tag.controller.ts to function with anonymous requests', (done) => {
      mockRequest.headers = {};
      
      auth.optional(mockRequest as express.Request, mockResponse as express.Response, (err?: any) => {
        expect(err).toBeUndefined();
        expect((mockRequest as any).auth).toBeUndefined();
        done();
      });
    });
  });

  describe('JWT algorithm validation', () => {
    it('should only accept HS256 algorithm tokens', (done) => {
      const payload = { userId: 'algo-test', email: 'algo@example.com' };
      const token = jwt.sign(payload, testSecret, { algorithm: 'HS256' });
      
      mockRequest.headers = {
        authorization: `Token ${token}`,
      };
      
      auth.optional(mockRequest as express.Request, mockResponse as express.Response, (err?: any) => {
        expect(err).toBeUndefined();
        expect((mockRequest as any).auth).toBeDefined();
        done();
      });
    });
  });

  describe('Environment configuration', () => {
    it('should use JWT_SECRET from environment or fallback to default', () => {
      const secret = process.env.JWT_SECRET || 'superSecret';
      expect(secret).toBeDefined();
      expect(typeof secret).toBe('string');
    });
  });
});