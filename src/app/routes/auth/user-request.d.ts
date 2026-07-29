import { Request } from 'express';

/**
 * Test suite for user-request.d.ts type definitions
 * Validates the Express Request interface augmentation with user property
 */
describe('Express Request User Property Type Definition', () => {
  describe('Request interface augmentation', () => {
    it('should allow Request object without user property', () => {
      const mockRequest: Request = {} as Request;
      expect(mockRequest.user).toBeUndefined();
    });

    it('should allow Request object with valid user property containing id, username, and email', () => {
      const mockRequest: Request = {
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com'
        }
      } as Request;

      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.id).toBe(1);
      expect(mockRequest.user?.username).toBe('testuser');
      expect(mockRequest.user?.email).toBe('test@example.com');
    });

    it('should enforce user.id to be a number type', () => {
      const mockRequest: Request = {
        user: {
          id: 123,
          username: 'testuser',
          email: 'test@example.com'
        }
      } as Request;

      expect(typeof mockRequest.user?.id).toBe('number');
    });

    it('should enforce user.username to be a string type', () => {
      const mockRequest: Request = {
        user: {
          id: 1,
          username: 'johndoe',
          email: 'john@example.com'
        }
      } as Request;

      expect(typeof mockRequest.user?.username).toBe('string');
    });

    it('should enforce user.email to be a string type', () => {
      const mockRequest: Request = {
        user: {
          id: 1,
          username: 'testuser',
          email: 'user@domain.com'
        }
      } as Request;

      expect(typeof mockRequest.user?.email).toBe('string');
    });

    it('should handle user property as optional (undefined)', () => {
      const mockRequest: Request = {} as Request;
      
      expect(mockRequest.user).toBeUndefined();
      expect(mockRequest.user?.id).toBeUndefined();
      expect(mockRequest.user?.username).toBeUndefined();
      expect(mockRequest.user?.email).toBeUndefined();
    });

    it('should allow accessing user properties with optional chaining', () => {
      const mockRequestWithUser: Request = {
        user: {
          id: 42,
          username: 'alice',
          email: 'alice@example.com'
        }
      } as Request;

      const mockRequestWithoutUser: Request = {} as Request;

      expect(mockRequestWithUser.user?.id).toBe(42);
      expect(mockRequestWithoutUser.user?.id).toBeUndefined();
    });

    it('should support multiple user objects with different valid data', () => {
      const request1: Request = {
        user: {
          id: 1,
          username: 'user1',
          email: 'user1@test.com'
        }
      } as Request;

      const request2: Request = {
        user: {
          id: 999,
          username: 'admin',
          email: 'admin@system.com'
        }
      } as Request;

      expect(request1.user?.id).not.toBe(request2.user?.id);
      expect(request1.user?.username).not.toBe(request2.user?.username);
      expect(request1.user?.email).not.toBe(request2.user?.email);
    });

    it('should maintain all three required properties in user object', () => {
      const mockRequest: Request = {
        user: {
          id: 5,
          username: 'completeuser',
          email: 'complete@example.com'
        }
      } as Request;

      expect(mockRequest.user).toHaveProperty('id');
      expect(mockRequest.user).toHaveProperty('username');
      expect(mockRequest.user).toHaveProperty('email');
    });

    it('should handle edge case with minimum valid id value', () => {
      const mockRequest: Request = {
        user: {
          id: 0,
          username: 'minuser',
          email: 'min@example.com'
        }
      } as Request;

      expect(mockRequest.user?.id).toBe(0);
    });

    it('should handle edge case with large id value', () => {
      const mockRequest: Request = {
        user: {
          id: Number.MAX_SAFE_INTEGER,
          username: 'maxuser',
          email: 'max@example.com'
        }
      } as Request;

      expect(mockRequest.user?.id).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should handle empty string values for username and email', () => {
      const mockRequest: Request = {
        user: {
          id: 1,
          username: '',
          email: ''
        }
      } as Request;

      expect(mockRequest.user?.username).toBe('');
      expect(mockRequest.user?.email).toBe('');
    });

    it('should verify user property structure matches JWT payload format', () => {
      const mockJWTPayload = {
        id: 100,
        username: 'jwtuser',
        email: 'jwt@example.com'
      };

      const mockRequest: Request = {
        user: mockJWTPayload
      } as Request;

      expect(mockRequest.user).toEqual(mockJWTPayload);
      expect(Object.keys(mockRequest.user!)).toEqual(['id', 'username', 'email']);
    });
  });
});