import { authorMapper, Author } from './author.mapper';
import { User } from '../../models/user.model';

describe('authorMapper', () => {
  describe('Basic Functionality', () => {
    it('should map user to author with all fields present', () => {
      const mockUser: User = {
        username: 'johndoe',
        bio: 'Software developer',
        image: 'https://example.com/avatar.jpg',
        email: 'john@example.com',
        password: 'hashedpassword'
      };

      const result: Author = authorMapper(mockUser, false);

      expect(result).toEqual({
        username: 'johndoe',
        bio: 'Software developer',
        image: 'https://example.com/avatar.jpg',
        following: false
      });
    });

    it('should map user to author with following set to true', () => {
      const mockUser: User = {
        username: 'janedoe',
        bio: 'Designer',
        image: 'https://example.com/jane.jpg',
        email: 'jane@example.com',
        password: 'hashedpassword'
      };

      const result: Author = authorMapper(mockUser, true);

      expect(result).toEqual({
        username: 'janedoe',
        bio: 'Designer',
        image: 'https://example.com/jane.jpg',
        following: true
      });
    });

    it('should default following to false when not provided', () => {
      const mockUser: User = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'https://example.com/test.jpg',
        email: 'test@example.com',
        password: 'hashedpassword'
      };

      const result: Author = authorMapper(mockUser);

      expect(result.following).toBe(false);
    });
  });

  describe('Null/Empty Field Handling', () => {
    it('should convert empty bio to null', () => {
      const mockUser: User = {
        username: 'userwithnobio',
        bio: '',
        image: 'https://example.com/avatar.jpg',
        email: 'user@example.com',
        password: 'hashedpassword'
      };

      const result: Author = authorMapper(mockUser, false);

      expect(result.bio).toBeNull();
    });

    it('should convert undefined bio to null', () => {
      const mockUser: User = {
        username: 'userwithnobio',
        bio: undefined as any,
        image: 'https://example.com/avatar.jpg',
        email: 'user@example.com',
        password: 'hashedpassword'
      };

      const result: Author = authorMapper(mockUser, false);

      expect(result.bio).toBeNull();
    });

    it('should convert null bio to null', () => {
      const mockUser: User = {
        username: 'userwithnobio',
        bio: null as any,
        image: 'https://example.com/avatar.jpg',
        email: 'user@example.com',
        password: 'hashedpassword'
      };

      const result: Author = authorMapper(mockUser, false);

      expect(result.bio).toBeNull();
    });

    it('should convert empty image to null', () => {
      const mockUser: User = {
        username: 'userwithnoimage',
        bio: 'Some bio',
        image: '',
        email: 'user@example.com',
        password: 'hashedpassword'
      };

      const result: Author = authorMapper(mockUser, false);

      expect(result.image).toBeNull();
    });

    it('should convert undefined image to null', () => {
      const mockUser: User = {
        username: 'userwithnoimage',
        bio: 'Some bio',
        image: undefined as any,
        email: 'user@example.com',
        password: 'hashedpassword'
      };

      const result: Author = authorMapper(mockUser, false);

      expect(result.image).toBeNull();
    });

    it('should convert null image to null', () => {
      const mockUser: User = {
        username: 'userwithnoimage',
        bio: 'Some bio',
        image: null as any,
        email: 'user@example.com',
        password: 'hashedpassword'
      };

      const result: Author = authorMapper(mockUser, false);

      expect(result.image).toBeNull();
    });

    it('should handle both bio and image as empty strings', () => {
      const mockUser: User = {
        username: 'minimaluser',
        bio: '',
        image: '',
        email: 'minimal@example.com',
        password: 'hashedpassword'
      };

      const result: Author = authorMapper(mockUser, false);

      expect(result).toEqual({
        username: 'minimaluser',
        bio: null,
        image: null,
        following: false
      });
    });
  });

  describe('Username Handling', () => {
    it('should preserve username exactly as provided', () => {
      const mockUser: User = {
        username: 'User_With-Special.Chars123',
        bio: 'Bio',
        image: 'https://example.com/img.jpg',
        email: 'user@example.com',
        password: 'hashedpassword'
      };

      const result: Author = authorMapper(mockUser, false);

      expect(result.username).toBe('User_With-Special.Chars123');
    });

    it('should handle single character username', () => {
      const mockUser: User = {
        username: 'a',
        bio: 'Bio',
        image: 'https://example.com/img.jpg',
        email: 'user@example.com',
        password: 'hashedpassword'
      };

      const result: Author = authorMapper(mockUser, false);

      expect(result.username).toBe('a');
    });
  });

  describe('Integration with Article Mapper', () => {
    it('should produce author object compatible with article response structure', () => {
      const mockUser: User = {
        username: 'articleauthor',
        bio: 'Article writer',
        image: 'https://example.com/author.jpg',
        email: 'author@example.com',
        password: 'hashedpassword'
      };

      const result: Author = authorMapper(mockUser, true);

      expect(result).toHaveProperty('username');
      expect(result).toHaveProperty('bio');
      expect(result).toHaveProperty('image');
      expect(result).toHaveProperty('following');
      expect(Object.keys(result)).toHaveLength(4);
    });

    it('should maintain serialization compatibility when used in article context', () => {
      const mockUser: User = {
        username: 'testauthor',
        bio: 'Test bio',
        image: 'https://example.com/test.jpg',
        email: 'test@example.com',
        password: 'hashedpassword'
      };

      const result: Author = authorMapper(mockUser, false);
      const serialized = JSON.stringify(result);
      const deserialized = JSON.parse(serialized);

      expect(deserialized).toEqual(result);
      expect(deserialized.username).toBe('testauthor');
      expect(deserialized.bio).toBe('Test bio');
      expect(deserialized.image).toBe('https://example.com/test.jpg');
      expect(deserialized.following).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle user with all optional fields as empty', () => {
      const mockUser: User = {
        username: 'bareuser',
        bio: '',
        image: '',
        email: 'bare@example.com',
        password: 'hashedpassword'
      };

      const result: Author = authorMapper(mockUser);

      expect(result.username).toBe('bareuser');
      expect(result.bio).toBeNull();
      expect(result.image).toBeNull();
      expect(result.following).toBe(false);
    });

    it('should not include user email or password in author object', () => {
      const mockUser: User = {
        username: 'secureuser',
        bio: 'Bio',
        image: 'https://example.com/img.jpg',
        email: 'secure@example.com',
        password: 'supersecret'
      };

      const result: Author = authorMapper(mockUser, false);

      expect(result).not.toHaveProperty('email');
      expect(result).not.toHaveProperty('password');
    });

    it('should handle following parameter as explicit false', () => {
      const mockUser: User = {
        username: 'user',
        bio: 'Bio',
        image: 'https://example.com/img.jpg',
        email: 'user@example.com',
        password: 'hashedpassword'
      };

      const result: Author = authorMapper(mockUser, false);

      expect(result.following).toBe(false);
      expect(result.following).not.toBeUndefined();
      expect(result.following).not.toBeNull();
    });

    it('should handle following parameter as explicit true', () => {
      const mockUser: User = {
        username: 'user',
        bio: 'Bio',
        image: 'https://example.com/img.jpg',
        email: 'user@example.com',
        password: 'hashedpassword'
      };

      const result: Author = authorMapper(mockUser, true);

      expect(result.following).toBe(true);
      expect(result.following).not.toBeUndefined();
      expect(result.following).not.toBeNull();
    });
  });

  describe('Type Safety', () => {
    it('should return object matching Author interface', () => {
      const mockUser: User = {
        username: 'typeuser',
        bio: 'Type safe bio',
        image: 'https://example.com/type.jpg',
        email: 'type@example.com',
        password: 'hashedpassword'
      };

      const result: Author = authorMapper(mockUser, false);

      expect(typeof result.username).toBe('string');
      expect(typeof result.following).toBe('boolean');
      expect(result.bio === null || typeof result.bio === 'string').toBe(true);
      expect(result.image === null || typeof result.image === 'string').toBe(true);
    });
  });
});