import { authorMapper, ProfileResponse } from './author.mapper';
import { User } from '../../models/user.model';

jest.mock('../../models', () => ({
  sequelize: {
    query: jest.fn(),
    QueryTypes: {
      SELECT: 'SELECT'
    }
  }
}));

describe('authorMapper', () => {
  let mockSequelize: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSequelize = require('../../models').sequelize;
  });

  describe('Basic author mapping without currentUserId', () => {
    it('should map author with all fields present and following set to false', async () => {
      const author: User = {
        id: 1,
        username: 'johndoe',
        bio: 'Software developer',
        image: 'https://example.com/avatar.jpg'
      } as User;

      const result: ProfileResponse = await authorMapper(author);

      expect(result).toEqual({
        username: 'johndoe',
        bio: 'Software developer',
        image: 'https://example.com/avatar.jpg',
        following: false
      });
    });

    it('should handle null bio gracefully', async () => {
      const author: User = {
        id: 2,
        username: 'janedoe',
        bio: null,
        image: 'https://example.com/jane.jpg'
      } as User;

      const result: ProfileResponse = await authorMapper(author);

      expect(result).toEqual({
        username: 'janedoe',
        bio: null,
        image: 'https://example.com/jane.jpg',
        following: false
      });
    });

    it('should handle null image gracefully', async () => {
      const author: User = {
        id: 3,
        username: 'bobsmith',
        bio: 'Designer',
        image: null
      } as User;

      const result: ProfileResponse = await authorMapper(author);

      expect(result).toEqual({
        username: 'bobsmith',
        bio: 'Designer',
        image: null,
        following: false
      });
    });

    it('should handle both null bio and null image gracefully', async () => {
      const author: User = {
        id: 4,
        username: 'alicejones',
        bio: null,
        image: null
      } as User;

      const result: ProfileResponse = await authorMapper(author);

      expect(result).toEqual({
        username: 'alicejones',
        bio: null,
        image: null,
        following: false
      });
    });

    it('should handle undefined bio by converting to null', async () => {
      const author: User = {
        id: 5,
        username: 'testuser',
        bio: undefined,
        image: 'https://example.com/test.jpg'
      } as any;

      const result: ProfileResponse = await authorMapper(author);

      expect(result).toEqual({
        username: 'testuser',
        bio: null,
        image: 'https://example.com/test.jpg',
        following: false
      });
    });

    it('should handle undefined image by converting to null', async () => {
      const author: User = {
        id: 6,
        username: 'anotheruser',
        bio: 'Test bio',
        image: undefined
      } as any;

      const result: ProfileResponse = await authorMapper(author);

      expect(result).toEqual({
        username: 'anotheruser',
        bio: 'Test bio',
        image: null,
        following: false
      });
    });

    it('should handle empty string bio by converting to null', async () => {
      const author: User = {
        id: 7,
        username: 'emptyuser',
        bio: '',
        image: 'https://example.com/empty.jpg'
      } as User;

      const result: ProfileResponse = await authorMapper(author);

      expect(result).toEqual({
        username: 'emptyuser',
        bio: null,
        image: 'https://example.com/empty.jpg',
        following: false
      });
    });

    it('should handle empty string image by converting to null', async () => {
      const author: User = {
        id: 8,
        username: 'noimageuser',
        bio: 'Has bio',
        image: ''
      } as User;

      const result: ProfileResponse = await authorMapper(author);

      expect(result).toEqual({
        username: 'noimageuser',
        bio: 'Has bio',
        image: null,
        following: false
      });
    });
  });

  describe('Author mapping with currentUserId - following relationship exists', () => {
    it('should set following to true when follow relationship exists', async () => {
      const author: User = {
        id: 10,
        username: 'followeduser',
        bio: 'Popular author',
        image: 'https://example.com/followed.jpg'
      } as User;

      mockSequelize.query.mockResolvedValue([
        { count: 1 }
      ]);

      const result: ProfileResponse = await authorMapper(author, 5);

      expect(result).toEqual({
        username: 'followeduser',
        bio: 'Popular author',
        image: 'https://example.com/followed.jpg',
        following: true
      });

      expect(mockSequelize.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) as count'),
        {
          replacements: { currentUserId: 5, authorId: 10 },
          type: 'SELECT'
        }
      );
    });

    it('should set following to true when count is greater than 1', async () => {
      const author: User = {
        id: 11,
        username: 'multifollow',
        bio: 'Test',
        image: null
      } as User;

      mockSequelize.query.mockResolvedValue([
        { count: 5 }
      ]);

      const result: ProfileResponse = await authorMapper(author, 3);

      expect(result.following).toBe(true);
    });

    it('should query database with correct parameters', async () => {
      const author: User = {
        id: 99,
        username: 'querytest',
        bio: 'Query test user',
        image: 'https://example.com/query.jpg'
      } as User;

      mockSequelize.query.mockResolvedValue([
        { count: 1 }
      ]);

      await authorMapper(author, 42);

      expect(mockSequelize.query).toHaveBeenCalledTimes(1);
      expect(mockSequelize.query).toHaveBeenCalledWith(
        expect.stringContaining('follower_id = :currentUserId AND following_id = :authorId'),
        {
          replacements: { currentUserId: 42, authorId: 99 },
          type: 'SELECT'
        }
      );
    });
  });

  describe('Author mapping with currentUserId - no following relationship', () => {
    it('should set following to false when follow relationship does not exist', async () => {
      const author: User = {
        id: 20,
        username: 'notfollowed',
        bio: 'Not followed author',
        image: 'https://example.com/notfollowed.jpg'
      } as User;

      mockSequelize.query.mockResolvedValue([
        { count: 0 }
      ]);

      const result: ProfileResponse = await authorMapper(author, 7);

      expect(result).toEqual({
        username: 'notfollowed',
        bio: 'Not followed author',
        image: 'https://example.com/notfollowed.jpg',
        following: false
      });

      expect(mockSequelize.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) as count'),
        {
          replacements: { currentUserId: 7, authorId: 20 },
          type: 'SELECT'
        }
      );
    });

    it('should set following to false when query returns null results', async () => {
      const author: User = {
        id: 21,
        username: 'nullresult',
        bio: 'Null result test',
        image: null
      } as User;

      mockSequelize.query.mockResolvedValue([null]);

      const result: ProfileResponse = await authorMapper(author, 8);

      expect(result.following).toBe(false);
    });

    it('should set following to false when query returns undefined results', async () => {
      const author: User = {
        id: 22,
        username: 'undefinedresult',
        bio: 'Undefined result test',
        image: null
      } as User;

      mockSequelize.query.mockResolvedValue([undefined]);

      const result: ProfileResponse = await authorMapper(author, 9);

      expect(result.following).toBe(false);
    });

    it('should set following to false when results object has no count property', async () => {
      const author: User = {
        id: 23,
        username: 'nocount',
        bio: 'No count property',
        image: null
      } as User;

      mockSequelize.query.mockResolvedValue([{}]);

      const result: ProfileResponse = await authorMapper(author, 10);

      expect(result.following).toBe(false);
    });
  });

  describe('Edge cases and error scenarios', () => {
    it('should handle currentUserId of 0', async () => {
      const author: User = {
        id: 30,
        username: 'zeroid',
        bio: 'Zero ID test',
        image: null
      } as User;

      mockSequelize.query.mockResolvedValue([
        { count: 1 }
      ]);

      const result: ProfileResponse = await authorMapper(author, 0);

      expect(mockSequelize.query).toHaveBeenCalledWith(
        expect.any(String),
        {
          replacements: { currentUserId: 0, authorId: 30 },
          type: 'SELECT'
        }
      );
      expect(result.following).toBe(true);
    });

    it('should handle negative currentUserId', async () => {
      const author: User = {
        id: 31,
        username: 'negativeid',
        bio: 'Negative ID test',
        image: null
      } as User;

      mockSequelize.query.mockResolvedValue([
        { count: 0 }
      ]);

      const result: ProfileResponse = await authorMapper(author, -1);

      expect(mockSequelize.query).toHaveBeenCalledWith(
        expect.any(String),
        {
          replacements: { currentUserId: -1, authorId: 31 },
          type: 'SELECT'
        }
      );
      expect(result.following).toBe(false);
    });

    it('should handle database query rejection', async () => {
      const author: User = {
        id: 32,
        username: 'erroruser',
        bio: 'Error test',
        image: null
      } as User;

      mockSequelize.query.mockRejectedValue(new Error('Database connection failed'));

      await expect(authorMapper(author, 12)).rejects.toThrow('Database connection failed');
    });

    it('should handle malformed query results', async () => {
      const author: User = {
        id: 33,
        username: 'malformed',
        bio: 'Malformed test',
        image: null
      } as User;

      mockSequelize.query.mockResolvedValue([
        { count: 'not a number' }
      ]);

      const result: ProfileResponse = await authorMapper(author, 13);

      expect(result.following).toBe(false);
    });

    it('should handle empty array from query', async () => {
      const author: User = {
        id: 34,
        username: 'emptyarray',
        bio: 'Empty array test',
        image: null
      } as User;

      mockSequelize.query.mockResolvedValue([]);

      const result: ProfileResponse = await authorMapper(author, 14);

      expect(result.following).toBe(false);
    });

    it('should handle author with special characters in username', async () => {
      const author: User = {
        id: 35,
        username: 'user@#$%^&*()',
        bio: 'Special chars',
        image: null
      } as User;

      const result: ProfileResponse = await authorMapper(author);

      expect(result.username).toBe('user@#$%^&*()');
      expect(result.following).toBe(false);
    });

    it('should handle very long bio string', async () => {
      const longBio = 'a'.repeat(10000);
      const author: User = {
        id: 36,
        username: 'longbio',
        bio: longBio,
        image: null
      } as User;

      const result: ProfileResponse = await authorMapper(author);

      expect(result.bio).toBe(longBio);
      expect(result.bio?.length).toBe(10000);
    });

    it('should handle very long image URL', async () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(5000) + '.jpg';
      const author: User = {
        id: 37,
        username: 'longurl',
        bio: 'Long URL test',
        image: longUrl
      } as User;

      const result: ProfileResponse = await authorMapper(author);

      expect(result.image).toBe(longUrl);
    });

    it('should handle concurrent calls with different users', async () => {
      const author1: User = {
        id: 40,
        username: 'concurrent1',
        bio: 'First',
        image: null
      } as User;

      const author2: User = {
        id: 41,
        username: 'concurrent2',
        bio: 'Second',
        image: null
      } as User;

      mockSequelize.query
        .mockResolvedValueOnce([{ count: 1 }])
        .mockResolvedValueOnce([{ count: 0 }]);

      const [result1, result2] = await Promise.all([
        authorMapper(author1, 15),
        authorMapper(author2, 16)
      ]);

      expect(result1.following).toBe(true);
      expect(result2.following).toBe(false);
      expect(mockSequelize.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('Return type validation', () => {
    it('should return ProfileResponse with all required properties', async () => {
      const author: User = {
        id: 50,
        username: 'typecheck',
        bio: 'Type validation',
        image: 'https://example.com/type.jpg'
      } as User;

      const result: ProfileResponse = await authorMapper(author);

      expect(result).toHaveProperty('username');
      expect(result).toHaveProperty('bio');
      expect(result).toHaveProperty('image');
      expect(result).toHaveProperty('following');
      expect(typeof result.username).toBe('string');
      expect(typeof result.following).toBe('boolean');
    });

    it('should return a Promise that resolves to ProfileResponse', async () => {
      const author: User = {
        id: 51,
        username: 'promisecheck',
        bio: 'Promise test',
        image: null
      } as User;

      const result = authorMapper(author);

      expect(result).toBeInstanceOf(Promise);
      const resolved = await result;
      expect(resolved).toHaveProperty('username');
      expect(resolved).toHaveProperty('following');
    });
  });
});