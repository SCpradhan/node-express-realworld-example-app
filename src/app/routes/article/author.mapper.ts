import authorMapper from './author.mapper';
import { User } from '../auth/user.model';

describe('authorMapper', () => {
  describe('username, bio, and image mapping', () => {
    it('should map username directly from author object', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        followedBy: [],
      };

      const result = authorMapper(author);

      expect(result.username).toBe('testuser');
    });

    it('should map bio directly from author object when bio is provided', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        followedBy: [],
      };

      const result = authorMapper(author);

      expect(result.bio).toBe('Test bio');
    });

    it('should set bio to null when bio is null', () => {
      const author = {
        username: 'testuser',
        bio: null,
        image: 'http://example.com/image.jpg',
        followedBy: [],
      };

      const result = authorMapper(author);

      expect(result.bio).toBeNull();
    });

    it('should set bio to null when bio is undefined', () => {
      const author = {
        username: 'testuser',
        bio: undefined,
        image: 'http://example.com/image.jpg',
        followedBy: [],
      };

      const result = authorMapper(author);

      expect(result.bio).toBeNull();
    });

    it('should set bio to null when bio is empty string', () => {
      const author = {
        username: 'testuser',
        bio: '',
        image: 'http://example.com/image.jpg',
        followedBy: [],
      };

      const result = authorMapper(author);

      expect(result.bio).toBeNull();
    });

    it('should map image directly from author object when image is provided', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        followedBy: [],
      };

      const result = authorMapper(author);

      expect(result.image).toBe('http://example.com/image.jpg');
    });

    it('should set image to null when image is null', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: null,
        followedBy: [],
      };

      const result = authorMapper(author);

      expect(result.image).toBeNull();
    });

    it('should set image to null when image is undefined', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: undefined,
        followedBy: [],
      };

      const result = authorMapper(author);

      expect(result.image).toBeNull();
    });

    it('should set image to null when image is empty string', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: '',
        followedBy: [],
      };

      const result = authorMapper(author);

      expect(result.image).toBeNull();
    });
  });

  describe('following field for anonymous requests', () => {
    it('should set following to false when currentUserId is undefined', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        followedBy: [{ id: 1 }, { id: 2 }],
      };

      const result = authorMapper(author, undefined);

      expect(result.following).toBe(false);
    });

    it('should set following to false when currentUserId is not provided', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        followedBy: [{ id: 1 }, { id: 2 }],
      };

      const result = authorMapper(author);

      expect(result.following).toBe(false);
    });

    it('should set following to false for anonymous request even when followedBy list is empty', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        followedBy: [],
      };

      const result = authorMapper(author);

      expect(result.following).toBe(false);
    });
  });

  describe('following field for authenticated requests', () => {
    it('should set following to true when currentUserId exists in followedBy list', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        followedBy: [{ id: 1 }, { id: 2 }, { id: 3 }],
      };

      const result = authorMapper(author, 2);

      expect(result.following).toBe(true);
    });

    it('should set following to false when currentUserId does not exist in followedBy list', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        followedBy: [{ id: 1 }, { id: 2 }, { id: 3 }],
      };

      const result = authorMapper(author, 5);

      expect(result.following).toBe(false);
    });

    it('should set following to false when followedBy list is empty and currentUserId is provided', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        followedBy: [],
      };

      const result = authorMapper(author, 1);

      expect(result.following).toBe(false);
    });

    it('should handle currentUserId as first item in followedBy list', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        followedBy: [{ id: 10 }, { id: 20 }],
      };

      const result = authorMapper(author, 10);

      expect(result.following).toBe(true);
    });

    it('should handle currentUserId as last item in followedBy list', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        followedBy: [{ id: 10 }, { id: 20 }],
      };

      const result = authorMapper(author, 20);

      expect(result.following).toBe(true);
    });

    it('should handle currentUserId of 0 correctly', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        followedBy: [{ id: 0 }, { id: 1 }],
      };

      const result = authorMapper(author, 0);

      expect(result.following).toBe(false);
    });
  });

  describe('edge cases and null safety', () => {
    it('should handle author with null followedBy gracefully', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        followedBy: null,
      };

      const result = authorMapper(author, 1);

      expect(result.following).toBe(false);
    });

    it('should handle author with undefined followedBy gracefully', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        followedBy: undefined,
      };

      const result = authorMapper(author, 1);

      expect(result.following).toBe(false);
    });

    it('should return all required fields in the response object', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        followedBy: [],
      };

      const result = authorMapper(author);

      expect(result).toHaveProperty('username');
      expect(result).toHaveProperty('bio');
      expect(result).toHaveProperty('image');
      expect(result).toHaveProperty('following');
    });

    it('should handle followedBy with partial User objects', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        followedBy: [
          { id: 1, username: 'user1' },
          { id: 2 },
          { id: 3, username: 'user3', email: 'user3@example.com' },
        ],
      };

      const result = authorMapper(author, 2);

      expect(result.following).toBe(true);
    });

    it('should maintain backward compatibility with article.mapper.ts consumer', () => {
      const author = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        followedBy: [{ id: 1 }],
      };

      const result = authorMapper(author, 1);

      expect(typeof result.username).toBe('string');
      expect(result.bio === null || typeof result.bio === 'string').toBe(true);
      expect(result.image === null || typeof result.image === 'string').toBe(true);
      expect(typeof result.following).toBe('boolean');
    });
  });

  describe('comprehensive integration scenarios', () => {
    it('should correctly map complete author object for authenticated user who is following', () => {
      const author = {
        username: 'johndoe',
        bio: 'Software developer',
        image: 'http://example.com/johndoe.jpg',
        followedBy: [{ id: 5 }, { id: 10 }, { id: 15 }],
      };

      const result = authorMapper(author, 10);

      expect(result).toEqual({
        username: 'johndoe',
        bio: 'Software developer',
        image: 'http://example.com/johndoe.jpg',
        following: true,
      });
    });

    it('should correctly map complete author object for authenticated user who is not following', () => {
      const author = {
        username: 'johndoe',
        bio: 'Software developer',
        image: 'http://example.com/johndoe.jpg',
        followedBy: [{ id: 5 }, { id: 10 }, { id: 15 }],
      };

      const result = authorMapper(author, 99);

      expect(result).toEqual({
        username: 'johndoe',
        bio: 'Software developer',
        image: 'http://example.com/johndoe.jpg',
        following: false,
      });
    });

    it('should correctly map author object with null bio and image for anonymous user', () => {
      const author = {
        username: 'janedoe',
        bio: null,
        image: null,
        followedBy: [{ id: 1 }],
      };

      const result = authorMapper(author);

      expect(result).toEqual({
        username: 'janedoe',
        bio: null,
        image: null,
        following: false,
      });
    });

    it('should correctly map minimal author object for anonymous user', () => {
      const author = {
        username: 'minimaluser',
        followedBy: [],
      };

      const result = authorMapper(author);

      expect(result).toEqual({
        username: 'minimaluser',
        bio: null,
        image: null,
        following: false,
      });
    });
  });
});