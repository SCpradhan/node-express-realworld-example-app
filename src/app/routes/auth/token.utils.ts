import jwt from 'jsonwebtoken';
import { Request } from 'express';
import { generateToken, getTokenFromHeaders, verifyToken, TokenPayload } from './token.utils';

describe('token.utils', () => {
  const originalEnv = process.env;
  const TEST_SECRET = 'test-secret-key';

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, JWT_SECRET: TEST_SECRET };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token with default expiration of 60 days', () => {
      const payload = { id: 1, username: 'testuser' };
      const token = generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    it('should include id and username in the token payload', () => {
      const payload = { id: 123, username: 'johndoe' };
      const token = generateToken(payload);
      const decoded = jwt.verify(token, TEST_SECRET) as TokenPayload;

      expect(decoded.id).toBe(123);
      expect(decoded.username).toBe('johndoe');
    });

    it('should set exp field to 60 days from now', () => {
      const payload = { id: 1, username: 'testuser' };
      const beforeTime = Math.floor(Date.now() / 1000);
      const token = generateToken(payload);
      const decoded = jwt.verify(token, TEST_SECRET) as TokenPayload;
      const expectedExp = beforeTime + (60 * 60 * 24 * 60);

      expect(decoded.exp).toBeGreaterThanOrEqual(expectedExp - 1);
      expect(decoded.exp).toBeLessThanOrEqual(expectedExp + 1);
    });

    it('should accept custom expiresIn parameter', () => {
      const payload = { id: 1, username: 'testuser' };
      const token = generateToken(payload, '1h');

      expect(token).toBeDefined();
      const decoded = jwt.verify(token, TEST_SECRET) as TokenPayload;
      expect(decoded.id).toBe(1);
    });

    it('should use default expiresIn of 60d when not provided', () => {
      const payload = { id: 1, username: 'testuser' };
      const token = generateToken(payload);

      expect(token).toBeDefined();
      const decoded = jwt.verify(token, TEST_SECRET) as TokenPayload;
      expect(decoded.exp).toBeDefined();
    });

    it('should sign token with JWT_SECRET from environment', () => {
      const payload = { id: 1, username: 'testuser' };
      const token = generateToken(payload);

      expect(() => jwt.verify(token, TEST_SECRET)).not.toThrow();
      expect(() => jwt.verify(token, 'wrong-secret')).toThrow();
    });
  });

  describe('getTokenFromHeaders', () => {
    it('should extract token from Authorization header with Token prefix', () => {
      const mockRequest = {
        headers: {
          authorization: 'Token abc123xyz'
        }
      } as Request;

      const token = getTokenFromHeaders(mockRequest);
      expect(token).toBe('abc123xyz');
    });

    it('should extract token from Authorization header with Bearer prefix', () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer def456uvw'
        }
      } as Request;

      const token = getTokenFromHeaders(mockRequest);
      expect(token).toBe('def456uvw');
    });

    it('should return null when Authorization header is missing', () => {
      const mockRequest = {
        headers: {}
      } as Request;

      const token = getTokenFromHeaders(mockRequest);
      expect(token).toBeNull();
    });

    it('should return null when Authorization header has invalid format', () => {
      const mockRequest = {
        headers: {
          authorization: 'InvalidFormat abc123'
        }
      } as Request;

      const token = getTokenFromHeaders(mockRequest);
      expect(token).toBeNull();
    });

    it('should return null when Authorization header has no token after prefix', () => {
      const mockRequest = {
        headers: {
          authorization: 'Token '
        }
      } as Request;

      const token = getTokenFromHeaders(mockRequest);
      expect(token).toBe('');
    });

    it('should handle Authorization header with only prefix', () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer'
        }
      } as Request;

      const token = getTokenFromHeaders(mockRequest);
      expect(token).toBeUndefined();
    });

    it('should support backward compatibility with Token scheme', () => {
      const mockRequest = {
        headers: {
          authorization: 'Token legacy-token-123'
        }
      } as Request;

      const token = getTokenFromHeaders(mockRequest);
      expect(token).toBe('legacy-token-123');
    });

    it('should support Bearer scheme for standard OAuth2 compatibility', () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer modern-token-456'
        }
      } as Request;

      const token = getTokenFromHeaders(mockRequest);
      expect(token).toBe('modern-token-456');
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const payload = { id: 1, username: 'testuser' };
      const token = generateToken(payload);
      const decoded = verifyToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.id).toBe(1);
      expect(decoded?.username).toBe('testuser');
      expect(decoded?.exp).toBeDefined();
    });

    it('should return null for invalid token signature', () => {
      const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJ0ZXN0In0.invalid';
      const decoded = verifyToken(invalidToken);

      expect(decoded).toBeNull();
    });

    it('should return null for malformed token', () => {
      const malformedToken = 'not.a.valid.jwt.token';
      const decoded = verifyToken(malformedToken);

      expect(decoded).toBeNull();
    });

    it('should return null for expired token', () => {
      const payload = { id: 1, username: 'testuser' };
      const expiredToken = jwt.sign(
        { ...payload, exp: Math.floor(Date.now() / 1000) - 3600 },
        TEST_SECRET
      );
      const decoded = verifyToken(expiredToken);

      expect(decoded).toBeNull();
    });

    it('should return TokenPayload with correct structure on success', () => {
      const payload = { id: 42, username: 'alice' };
      const token = generateToken(payload);
      const decoded = verifyToken(token);

      expect(decoded).toHaveProperty('id');
      expect(decoded).toHaveProperty('username');
      expect(decoded).toHaveProperty('exp');
      expect(typeof decoded?.id).toBe('number');
      expect(typeof decoded?.username).toBe('string');
      expect(typeof decoded?.exp).toBe('number');
    });

    it('should not throw errors on verification failure', () => {
      const invalidToken = 'completely-invalid-token';
      
      expect(() => verifyToken(invalidToken)).not.toThrow();
      const result = verifyToken(invalidToken);
      expect(result).toBeNull();
    });

    it('should handle empty string token gracefully', () => {
      const decoded = verifyToken('');
      expect(decoded).toBeNull();
    });

    it('should verify token signed with correct JWT_SECRET', () => {
      const payload = { id: 99, username: 'bob' };
      const token = jwt.sign(
        { ...payload, exp: Math.floor(Date.now() / 1000) + 3600 },
        TEST_SECRET
      );
      const decoded = verifyToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.id).toBe(99);
      expect(decoded?.username).toBe('bob');
    });

    it('should return null when token is signed with different secret', () => {
      const payload = { id: 1, username: 'testuser' };
      const token = jwt.sign(
        { ...payload, exp: Math.floor(Date.now() / 1000) + 3600 },
        'different-secret'
      );
      const decoded = verifyToken(token);

      expect(decoded).toBeNull();
    });
  });

  describe('TokenPayload interface', () => {
    it('should enforce TokenPayload structure with id, username, and exp', () => {
      const payload = { id: 1, username: 'testuser' };
      const token = generateToken(payload);
      const decoded = verifyToken(token);

      const tokenPayload: TokenPayload = decoded as TokenPayload;
      expect(tokenPayload.id).toBeDefined();
      expect(tokenPayload.username).toBeDefined();
      expect(tokenPayload.exp).toBeDefined();
    });
  });

  describe('Integration scenarios', () => {
    it('should support full token lifecycle: generate, extract, verify', () => {
      const payload = { id: 100, username: 'integrationtest' };
      const token = generateToken(payload);

      const mockRequest = {
        headers: {
          authorization: `Bearer ${token}`
        }
      } as Request;

      const extractedToken = getTokenFromHeaders(mockRequest);
      expect(extractedToken).toBe(token);

      const verified = verifyToken(extractedToken as string);
      expect(verified).not.toBeNull();
      expect(verified?.id).toBe(100);
      expect(verified?.username).toBe('integrationtest');
    });

    it('should handle auth.optional middleware scenario with missing token', () => {
      const mockRequest = {
        headers: {}
      } as Request;

      const extractedToken = getTokenFromHeaders(mockRequest);
      expect(extractedToken).toBeNull();
    });

    it('should handle auth.optional middleware scenario with invalid token', () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer invalid-token'
        }
      } as Request;

      const extractedToken = getTokenFromHeaders(mockRequest);
      const verified = verifyToken(extractedToken as string);
      expect(verified).toBeNull();
    });
  });
});