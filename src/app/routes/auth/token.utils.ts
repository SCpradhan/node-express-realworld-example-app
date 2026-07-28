import { expect } from 'chai';
import jwt from 'jsonwebtoken';
import sinon from 'sinon';
import { generateToken, verifyToken, extractTokenFromHeader, TokenPayload } from './token.utils';
import { User } from '../../models/user.model';

describe('Token Utils', () => {
  const SECRET = process.env.JWT_SECRET || 'secret';
  let clock: sinon.SinonFakeTimers;

  const mockUser: User = {
    id: 'user123',
    username: 'testuser',
    email: 'test@example.com'
  } as User;

  beforeEach(() => {
    clock = sinon.useFakeTimers(new Date('2024-01-01T00:00:00Z'));
  });

  afterEach(() => {
    clock.restore();
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token with correct payload', () => {
      const token = generateToken(mockUser);
      
      expect(token).to.be.a('string');
      expect(token.split('.')).to.have.lengthOf(3);
      
      const decoded = jwt.verify(token, SECRET) as any;
      expect(decoded.id).to.equal(mockUser.id);
      expect(decoded.username).to.equal(mockUser.username);
      expect(decoded.email).to.equal(mockUser.email);
    });

    it('should set expiration to 60 days from now', () => {
      const token = generateToken(mockUser);
      const decoded = jwt.verify(token, SECRET) as any;
      
      const expectedExp = new Date('2024-01-01T00:00:00Z');
      expectedExp.setDate(expectedExp.getDate() + 60);
      
      expect(decoded.exp).to.equal(Math.floor(expectedExp.getTime() / 1000));
    });

    it('should generate different tokens for different users', () => {
      const user2: User = {
        id: 'user456',
        username: 'anotheruser',
        email: 'another@example.com'
      } as User;

      const token1 = generateToken(mockUser);
      const token2 = generateToken(user2);

      expect(token1).to.not.equal(token2);
    });

    it('should include all required user fields in token payload', () => {
      const token = generateToken(mockUser);
      const decoded = jwt.verify(token, SECRET) as TokenPayload;

      expect(decoded).to.have.property('id');
      expect(decoded).to.have.property('username');
      expect(decoded).to.have.property('email');
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const token = generateToken(mockUser);
      const decoded = verifyToken(token);

      expect(decoded).to.not.be.null;
      expect(decoded!.id).to.equal(mockUser.id);
      expect(decoded!.username).to.equal(mockUser.username);
      expect(decoded!.email).to.equal(mockUser.email);
    });

    it('should return null for an invalid token', () => {
      const invalidToken = 'invalid.token.string';
      const decoded = verifyToken(invalidToken);

      expect(decoded).to.be.null;
    });

    it('should return null for a malformed token', () => {
      const malformedToken = 'notavalidjwt';
      const decoded = verifyToken(malformedToken);

      expect(decoded).to.be.null;
    });

    it('should return null for an expired token', () => {
      const token = generateToken(mockUser);
      
      clock.restore();
      clock = sinon.useFakeTimers(new Date('2024-03-02T00:00:01Z'));
      
      const decoded = verifyToken(token);
      expect(decoded).to.be.null;
    });

    it('should return null for a token signed with wrong secret', () => {
      const wrongSecretToken = jwt.sign(
        { id: mockUser.id, username: mockUser.username, email: mockUser.email },
        'wrongsecret'
      );

      const decoded = verifyToken(wrongSecretToken);
      expect(decoded).to.be.null;
    });

    it('should return null for an empty token string', () => {
      const decoded = verifyToken('');
      expect(decoded).to.be.null;
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Authorization header with Token scheme', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      const authHeader = `Token ${token}`;

      const extracted = extractTokenFromHeader(authHeader);
      expect(extracted).to.equal(token);
    });

    it('should return null for undefined Authorization header', () => {
      const extracted = extractTokenFromHeader(undefined);
      expect(extracted).to.be.null;
    });

    it('should return null for empty Authorization header', () => {
      const extracted = extractTokenFromHeader('');
      expect(extracted).to.be.null;
    });

    it('should return null for Authorization header without Token scheme', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      const authHeader = `Bearer ${token}`;

      const extracted = extractTokenFromHeader(authHeader);
      expect(extracted).to.be.null;
    });

    it('should return null for Authorization header with only scheme', () => {
      const authHeader = 'Token';
      const extracted = extractTokenFromHeader(authHeader);
      expect(extracted).to.be.null;
    });

    it('should return null for Authorization header with extra parts', () => {
      const authHeader = 'Token part1 part2 part3';
      const extracted = extractTokenFromHeader(authHeader);
      expect(extracted).to.be.null;
    });

    it('should handle Authorization header with Token scheme case-sensitively', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      const authHeader = `token ${token}`;

      const extracted = extractTokenFromHeader(authHeader);
      expect(extracted).to.be.null;
    });

    it('should extract token with special characters', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-token_with.special+chars';
      const authHeader = `Token ${token}`;

      const extracted = extractTokenFromHeader(authHeader);
      expect(extracted).to.equal(token);
    });
  });

  describe('Integration: Token generation and verification flow', () => {
    it('should successfully generate and verify token for authenticated article endpoints', () => {
      const token = generateToken(mockUser);
      const authHeader = `Token ${token}`;
      
      const extractedToken = extractTokenFromHeader(authHeader);
      expect(extractedToken).to.not.be.null;
      
      const verified = verifyToken(extractedToken!);
      expect(verified).to.not.be.null;
      expect(verified!.id).to.equal(mockUser.id);
      expect(verified!.username).to.equal(mockUser.username);
    });

    it('should maintain authentication flow integrity for article feed endpoint', () => {
      const token = generateToken(mockUser);
      const verified = verifyToken(token);
      
      expect(verified).to.not.be.null;
      expect(verified!.id).to.equal(mockUser.id);
    });

    it('should maintain authentication flow integrity for POST /articles endpoint', () => {
      const token = generateToken(mockUser);
      const authHeader = `Token ${token}`;
      const extractedToken = extractTokenFromHeader(authHeader);
      const verified = verifyToken(extractedToken!);
      
      expect(verified).to.not.be.null;
      expect(verified!.username).to.equal(mockUser.username);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle user with missing optional fields', () => {
      const minimalUser: User = {
        id: 'user789',
        username: 'minimal',
        email: 'minimal@example.com'
      } as User;

      const token = generateToken(minimalUser);
      const decoded = verifyToken(token);

      expect(decoded).to.not.be.null;
      expect(decoded!.id).to.equal(minimalUser.id);
    });

    it('should handle very long token strings in extractTokenFromHeader', () => {
      const longToken = 'a'.repeat(10000);
      const authHeader = `Token ${longToken}`;

      const extracted = extractTokenFromHeader(authHeader);
      expect(extracted).to.equal(longToken);
    });

    it('should handle null bytes in token verification gracefully', () => {
      const tokenWithNull = 'token\0withNull';
      const decoded = verifyToken(tokenWithNull);
      expect(decoded).to.be.null;
    });
  });
});