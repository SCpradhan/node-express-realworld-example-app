import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { UserModel, User } from './user.model';

describe('UserModel', () => {
  let mockUser: User;
  let userModel: UserModel;

  beforeEach(() => {
    mockUser = {
      id: 'test-user-id-123',
      email: 'test@example.com',
      username: 'testuser',
      bio: 'Test bio',
      image: 'https://example.com/image.jpg',
      hash: 'existing-hash',
      salt: 'existing-salt'
    };
    userModel = new UserModel(mockUser);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize all user properties correctly', () => {
      expect(userModel.id).toBe(mockUser.id);
      expect(userModel.email).toBe(mockUser.email);
      expect(userModel.username).toBe(mockUser.username);
      expect(userModel.bio).toBe(mockUser.bio);
      expect(userModel.image).toBe(mockUser.image);
      expect(userModel.hash).toBe(mockUser.hash);
      expect(userModel.salt).toBe(mockUser.salt);
    });

    it('should handle optional bio and image fields', () => {
      const minimalUser: User = {
        id: 'test-id',
        email: 'test@example.com',
        username: 'testuser',
        hash: 'hash',
        salt: 'salt'
      };
      const minimalUserModel = new UserModel(minimalUser);
      expect(minimalUserModel.bio).toBeUndefined();
      expect(minimalUserModel.image).toBeUndefined();
    });
  });

  describe('setPassword', () => {
    it('should throw error when password is less than 8 characters', () => {
      expect(() => userModel.setPassword('short')).toThrow('Password must be at least 8 characters');
      expect(() => userModel.setPassword('1234567')).toThrow('Password must be at least 8 characters');
      expect(() => userModel.setPassword('')).toThrow('Password must be at least 8 characters');
    });

    it('should accept password with exactly 8 characters', () => {
      expect(() => userModel.setPassword('12345678')).not.toThrow();
    });

    it('should accept password with more than 8 characters', () => {
      expect(() => userModel.setPassword('validpassword123')).not.toThrow();
    });

    it('should generate random salt using crypto.randomBytes', () => {
      const randomBytesSpy = vi.spyOn(crypto, 'randomBytes');
      userModel.setPassword('validpassword');
      expect(randomBytesSpy).toHaveBeenCalledWith(16);
      expect(userModel.salt).toHaveLength(32); // 16 bytes = 32 hex characters
    });

    it('should generate different salts for multiple calls', () => {
      userModel.setPassword('password123');
      const firstSalt = userModel.salt;
      userModel.setPassword('password456');
      const secondSalt = userModel.salt;
      expect(firstSalt).not.toBe(secondSalt);
    });

    it('should hash password using pbkdf2Sync with correct parameters', () => {
      const pbkdf2SyncSpy = vi.spyOn(crypto, 'pbkdf2Sync');
      const password = 'validpassword123';
      userModel.setPassword(password);
      
      expect(pbkdf2SyncSpy).toHaveBeenCalledWith(
        password,
        userModel.salt,
        10000,
        512,
        'sha512'
      );
    });

    it('should store hash as hex string', () => {
      userModel.setPassword('validpassword');
      expect(userModel.hash).toMatch(/^[0-9a-f]+$/);
      expect(userModel.hash).toHaveLength(1024); // 512 bytes = 1024 hex characters
    });

    it('should update both hash and salt properties', () => {
      const originalHash = userModel.hash;
      const originalSalt = userModel.salt;
      
      userModel.setPassword('newpassword123');
      
      expect(userModel.hash).not.toBe(originalHash);
      expect(userModel.salt).not.toBe(originalSalt);
    });
  });

  describe('validPassword', () => {
    beforeEach(() => {
      userModel.setPassword('correctpassword');
    });

    it('should return true for correct password', () => {
      expect(userModel.validPassword('correctpassword')).toBe(true);
    });

    it('should return false for incorrect password', () => {
      expect(userModel.validPassword('wrongpassword')).toBe(false);
    });

    it('should return false for empty password', () => {
      expect(userModel.validPassword('')).toBe(false);
    });

    it('should return false for password with different case', () => {
      expect(userModel.validPassword('CORRECTPASSWORD')).toBe(false);
    });

    it('should use pbkdf2Sync with stored salt and same parameters', () => {
      const pbkdf2SyncSpy = vi.spyOn(crypto, 'pbkdf2Sync');
      const password = 'testpassword';
      
      userModel.validPassword(password);
      
      expect(pbkdf2SyncSpy).toHaveBeenCalledWith(
        password,
        userModel.salt,
        10000,
        512,
        'sha512'
      );
    });

    it('should use timing-safe comparison', () => {
      const timingSafeEqualSpy = vi.spyOn(crypto, 'timingSafeEqual');
      
      userModel.validPassword('correctpassword');
      
      expect(timingSafeEqualSpy).toHaveBeenCalled();
    });

    it('should compare buffers correctly in timingSafeEqual', () => {
      const timingSafeEqualSpy = vi.spyOn(crypto, 'timingSafeEqual');
      
      userModel.validPassword('correctpassword');
      
      const calls = timingSafeEqualSpy.mock.calls[0];
      expect(calls[0]).toBeInstanceOf(Buffer);
      expect(calls[1]).toBeInstanceOf(Buffer);
    });

    it('should handle multiple validation attempts', () => {
      expect(userModel.validPassword('correctpassword')).toBe(true);
      expect(userModel.validPassword('wrongpassword')).toBe(false);
      expect(userModel.validPassword('correctpassword')).toBe(true);
    });
  });

  describe('generateJWT', () => {
    let originalEnv: string | undefined;

    beforeEach(() => {
      originalEnv = process.env.JWT_SECRET;
      vi.useFakeTimers();
    });

    afterEach(() => {
      process.env.JWT_SECRET = originalEnv;
      vi.useRealTimers();
    });

    it('should generate JWT with correct payload structure', () => {
      const token = userModel.generateJWT();
      const decoded = jwt.decode(token) as any;
      
      expect(decoded).toHaveProperty('id');
      expect(decoded).toHaveProperty('username');
      expect(decoded).toHaveProperty('exp');
    });

    it('should include user id in JWT payload', () => {
      const token = userModel.generateJWT();
      const decoded = jwt.decode(token) as any;
      
      expect(decoded.id).toBe(userModel.id);
    });

    it('should include username in JWT payload', () => {
      const token = userModel.generateJWT();
      const decoded = jwt.decode(token) as any;
      
      expect(decoded.username).toBe(userModel.username);
    });

    it('should set expiration to 60 days from now', () => {
      const now = new Date('2024-01-01T00:00:00Z');
      vi.setSystemTime(now);
      
      const token = userModel.generateJWT();
      const decoded = jwt.decode(token) as any;
      
      const expectedExp = Math.floor(now.getTime() / 1000) + (60 * 60 * 24 * 60);
      expect(decoded.exp).toBe(expectedExp);
    });

    it('should use JWT_SECRET from environment variable', () => {
      process.env.JWT_SECRET = 'test-secret-key';
      const jwtSignSpy = vi.spyOn(jwt, 'sign');
      
      userModel.generateJWT();
      
      expect(jwtSignSpy).toHaveBeenCalledWith(
        expect.any(Object),
        'test-secret-key'
      );
    });

    it('should use default secret when JWT_SECRET is not set', () => {
      delete process.env.JWT_SECRET;
      const jwtSignSpy = vi.spyOn(jwt, 'sign');
      
      userModel.generateJWT();
      
      expect(jwtSignSpy).toHaveBeenCalledWith(
        expect.any(Object),
        'secret'
      );
    });

    it('should return a valid JWT string', () => {
      process.env.JWT_SECRET = 'test-secret';
      const token = userModel.generateJWT();
      
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should generate different tokens at different times', () => {
      vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
      const token1 = userModel.generateJWT();
      
      vi.setSystemTime(new Date('2024-01-02T00:00:00Z'));
      const token2 = userModel.generateJWT();
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('toAuthJSON', () => {
    it('should return object with email, username, bio, image, and token', () => {
      const authJSON = userModel.toAuthJSON();
      
      expect(authJSON).toHaveProperty('email');
      expect(authJSON).toHaveProperty('username');
      expect(authJSON).toHaveProperty('bio');
      expect(authJSON).toHaveProperty('image');
      expect(authJSON).toHaveProperty('token');
    });

    it('should include correct email value', () => {
      const authJSON = userModel.toAuthJSON() as any;
      expect(authJSON.email).toBe(userModel.email);
    });

    it('should include correct username value', () => {
      const authJSON = userModel.toAuthJSON() as any;
      expect(authJSON.username).toBe(userModel.username);
    });

    it('should include correct bio value', () => {
      const authJSON = userModel.toAuthJSON() as any;
      expect(authJSON.bio).toBe(userModel.bio);
    });

    it('should include correct image value', () => {
      const authJSON = userModel.toAuthJSON() as any;
      expect(authJSON.image).toBe(userModel.image);
    });

    it('should include generated JWT token', () => {
      const authJSON = userModel.toAuthJSON() as any;
      expect(typeof authJSON.token).toBe('string');
      expect(authJSON.token.split('.')).toHaveLength(3);
    });

    it('should not include hash in returned object', () => {
      const authJSON = userModel.toAuthJSON() as any;
      expect(authJSON).not.toHaveProperty('hash');
    });

    it('should not include salt in returned object', () => {
      const authJSON = userModel.toAuthJSON() as any;
      expect(authJSON).not.toHaveProperty('salt');
    });

    it('should not include id in returned object', () => {
      const authJSON = userModel.toAuthJSON() as any;
      expect(authJSON).not.toHaveProperty('id');
    });

    it('should handle undefined bio gracefully', () => {
      userModel.bio = undefined;
      const authJSON = userModel.toAuthJSON() as any;
      expect(authJSON.bio).toBeUndefined();
    });

    it('should handle undefined image gracefully', () => {
      userModel.image = undefined;
      const authJSON = userModel.toAuthJSON() as any;
      expect(authJSON.image).toBeUndefined();
    });

    it('should call generateJWT method', () => {
      const generateJWTSpy = vi.spyOn(userModel, 'generateJWT');
      userModel.toAuthJSON();
      expect(generateJWTSpy).toHaveBeenCalledTimes(1);
    });

    it('should return consistent structure for multiple calls', () => {
      const authJSON1 = userModel.toAuthJSON() as any;
      const authJSON2 = userModel.toAuthJSON() as any;
      
      expect(Object.keys(authJSON1).sort()).toEqual(Object.keys(authJSON2).sort());
    });
  });

  describe('Integration tests', () => {
    it('should complete full password lifecycle: set, validate, and authenticate', () => {
      const password = 'securepassword123';
      
      userModel.setPassword(password);
      expect(userModel.validPassword(password)).toBe(true);
      
      const authJSON = userModel.toAuthJSON() as any;
      expect(authJSON.token).toBeDefined();
      
      const decoded = jwt.decode(authJSON.token) as any;
      expect(decoded.id).toBe(userModel.id);
      expect(decoded.username).toBe(userModel.username);
    });

    it('should maintain security by not exposing sensitive data', () => {
      userModel.setPassword('securepassword');
      const authJSON = userModel.toAuthJSON() as any;
      
      expect(authJSON.hash).toBeUndefined();
      expect(authJSON.salt).toBeUndefined();
      expect(authJSON.id).toBeUndefined();
    });

    it('should handle password change correctly', () => {
      const firstPassword = 'firstpassword123';
      const secondPassword = 'secondpassword456';
      
      userModel.setPassword(firstPassword);
      const firstHash = userModel.hash;
      const firstSalt = userModel.salt;
      
      userModel.setPassword(secondPassword);
      
      expect(userModel.hash).not.toBe(firstHash);
      expect(userModel.salt).not.toBe(firstSalt);
      expect(userModel.validPassword(firstPassword)).toBe(false);
      expect(userModel.validPassword(secondPassword)).toBe(true);
    });
  });
});