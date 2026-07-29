import { RegisteredUserModel } from './registered-user.model';

describe('RegisteredUserModel Interface', () => {
  describe('Type Validation', () => {
    it('should accept valid RegisteredUserModel with all required properties', () => {
      const validUser: RegisteredUserModel = {
        email: 'test@example.com',
        username: 'testuser',
        bio: 'Test bio',
        image: 'https://example.com/image.jpg',
        token: 'jwt.token.here'
      };

      expect(validUser.email).toBe('test@example.com');
      expect(validUser.username).toBe('testuser');
      expect(validUser.bio).toBe('Test bio');
      expect(validUser.image).toBe('https://example.com/image.jpg');
      expect(validUser.token).toBe('jwt.token.here');
    });

    it('should accept RegisteredUserModel with null bio', () => {
      const userWithNullBio: RegisteredUserModel = {
        email: 'test@example.com',
        username: 'testuser',
        bio: null,
        image: 'https://example.com/image.jpg',
        token: 'jwt.token.here'
      };

      expect(userWithNullBio.bio).toBeNull();
    });

    it('should accept RegisteredUserModel with null image', () => {
      const userWithNullImage: RegisteredUserModel = {
        email: 'test@example.com',
        username: 'testuser',
        bio: 'Test bio',
        image: null,
        token: 'jwt.token.here'
      };

      expect(userWithNullImage.image).toBeNull();
    });

    it('should accept RegisteredUserModel with both bio and image as null', () => {
      const userWithNullFields: RegisteredUserModel = {
        email: 'test@example.com',
        username: 'testuser',
        bio: null,
        image: null,
        token: 'jwt.token.here'
      };

      expect(userWithNullFields.bio).toBeNull();
      expect(userWithNullFields.image).toBeNull();
    });

    it('should have email property of type string', () => {
      const user: RegisteredUserModel = {
        email: 'test@example.com',
        username: 'testuser',
        bio: null,
        image: null,
        token: 'jwt.token.here'
      };

      expect(typeof user.email).toBe('string');
    });

    it('should have username property of type string', () => {
      const user: RegisteredUserModel = {
        email: 'test@example.com',
        username: 'testuser',
        bio: null,
        image: null,
        token: 'jwt.token.here'
      };

      expect(typeof user.username).toBe('string');
    });

    it('should have token property of type string', () => {
      const user: RegisteredUserModel = {
        email: 'test@example.com',
        username: 'testuser',
        bio: null,
        image: null,
        token: 'jwt.token.here'
      };

      expect(typeof user.token).toBe('string');
    });

    it('should have bio property of type string when not null', () => {
      const user: RegisteredUserModel = {
        email: 'test@example.com',
        username: 'testuser',
        bio: 'Test bio',
        image: null,
        token: 'jwt.token.here'
      };

      expect(typeof user.bio).toBe('string');
    });

    it('should have image property of type string when not null', () => {
      const user: RegisteredUserModel = {
        email: 'test@example.com',
        username: 'testuser',
        bio: null,
        image: 'https://example.com/image.jpg',
        token: 'jwt.token.here'
      };

      expect(typeof user.image).toBe('string');
    });
  });

  describe('Interface Structure', () => {
    it('should contain exactly 5 properties', () => {
      const user: RegisteredUserModel = {
        email: 'test@example.com',
        username: 'testuser',
        bio: null,
        image: null,
        token: 'jwt.token.here'
      };

      expect(Object.keys(user).length).toBe(5);
    });

    it('should have all required property names', () => {
      const user: RegisteredUserModel = {
        email: 'test@example.com',
        username: 'testuser',
        bio: null,
        image: null,
        token: 'jwt.token.here'
      };

      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('username');
      expect(user).toHaveProperty('bio');
      expect(user).toHaveProperty('image');
      expect(user).toHaveProperty('token');
    });
  });

  describe('Real-world Scenarios', () => {
    it('should represent authenticated user response with complete profile', () => {
      const authenticatedUser: RegisteredUserModel = {
        email: 'john.doe@example.com',
        username: 'johndoe',
        bio: 'Software developer and tech enthusiast',
        image: 'https://api.realworld.io/images/johndoe.jpg',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U'
      };

      expect(authenticatedUser.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(authenticatedUser.username.length).toBeGreaterThan(0);
      expect(authenticatedUser.token.length).toBeGreaterThan(0);
    });

    it('should represent authenticated user response with minimal profile', () => {
      const minimalUser: RegisteredUserModel = {
        email: 'minimal@example.com',
        username: 'minimaluser',
        bio: null,
        image: null,
        token: 'jwt.token.minimal'
      };

      expect(minimalUser.email).toBeDefined();
      expect(minimalUser.username).toBeDefined();
      expect(minimalUser.token).toBeDefined();
      expect(minimalUser.bio).toBeNull();
      expect(minimalUser.image).toBeNull();
    });

    it('should handle empty string values for bio', () => {
      const userWithEmptyBio: RegisteredUserModel = {
        email: 'test@example.com',
        username: 'testuser',
        bio: '',
        image: null,
        token: 'jwt.token.here'
      };

      expect(userWithEmptyBio.bio).toBe('');
      expect(typeof userWithEmptyBio.bio).toBe('string');
    });

    it('should handle empty string values for image', () => {
      const userWithEmptyImage: RegisteredUserModel = {
        email: 'test@example.com',
        username: 'testuser',
        bio: null,
        image: '',
        token: 'jwt.token.here'
      };

      expect(userWithEmptyImage.image).toBe('');
      expect(typeof userWithEmptyImage.image).toBe('string');
    });
  });

  describe('Export Validation', () => {
    it('should be exported as named export', () => {
      const exportedModule = require('./registered-user.model');
      expect(exportedModule).toHaveProperty('RegisteredUserModel');
    });
  });
});