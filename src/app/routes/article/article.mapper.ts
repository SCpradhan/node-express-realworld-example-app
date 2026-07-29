import articleMapper from './article.mapper';
import authorMapper from './author.mapper';

jest.mock('./author.mapper');

describe('articleMapper', () => {
  const mockAuthorMapper = authorMapper as jest.MockedFunction<typeof authorMapper>;
  
  const mockDate = new Date('2023-01-15T10:30:00.000Z');
  
  const createMockArticle = (overrides = {}) => ({
    slug: 'test-article-slug',
    title: 'Test Article Title',
    description: 'Test article description',
    body: 'Test article body content',
    tagList: [
      { name: 'javascript' },
      { name: 'testing' },
      { name: 'nodejs' }
    ],
    createdAt: mockDate,
    updatedAt: mockDate,
    favoritedBy: [
      { id: 1 },
      { id: 2 },
      { id: 3 }
    ],
    author: {
      id: 10,
      username: 'testauthor',
      bio: 'Test bio',
      image: 'http://example.com/image.jpg'
    },
    ...overrides
  });

  const mockAuthorResponse = {
    username: 'testauthor',
    bio: 'Test bio',
    image: 'http://example.com/image.jpg',
    following: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthorMapper.mockReturnValue(mockAuthorResponse);
  });

  describe('Basic field mapping', () => {
    it('should map slug correctly', () => {
      const article = createMockArticle();
      const result = articleMapper(article);
      
      expect(result.slug).toBe('test-article-slug');
    });

    it('should map title correctly', () => {
      const article = createMockArticle();
      const result = articleMapper(article);
      
      expect(result.title).toBe('Test Article Title');
    });

    it('should map description correctly', () => {
      const article = createMockArticle();
      const result = articleMapper(article);
      
      expect(result.description).toBe('Test article description');
    });

    it('should map body correctly', () => {
      const article = createMockArticle();
      const result = articleMapper(article);
      
      expect(result.body).toBe('Test article body content');
    });
  });

  describe('tagList mapping', () => {
    it('should map tagList to array of tag name strings', () => {
      const article = createMockArticle();
      const result = articleMapper(article);
      
      expect(result.tagList).toEqual(['javascript', 'testing', 'nodejs']);
      expect(Array.isArray(result.tagList)).toBe(true);
      expect(result.tagList.every(tag => typeof tag === 'string')).toBe(true);
    });

    it('should handle empty tagList', () => {
      const article = createMockArticle({ tagList: [] });
      const result = articleMapper(article);
      
      expect(result.tagList).toEqual([]);
      expect(Array.isArray(result.tagList)).toBe(true);
    });

    it('should handle single tag in tagList', () => {
      const article = createMockArticle({ tagList: [{ name: 'solo-tag' }] });
      const result = articleMapper(article);
      
      expect(result.tagList).toEqual(['solo-tag']);
    });
  });

  describe('Date formatting', () => {
    it('should format createdAt as ISO 8601 string', () => {
      const article = createMockArticle();
      const result = articleMapper(article);
      
      expect(result.createdAt).toBe('2023-01-15T10:30:00.000Z');
      expect(typeof result.createdAt).toBe('string');
    });

    it('should format updatedAt as ISO 8601 string', () => {
      const article = createMockArticle();
      const result = articleMapper(article);
      
      expect(result.updatedAt).toBe('2023-01-15T10:30:00.000Z');
      expect(typeof result.updatedAt).toBe('string');
    });

    it('should handle different createdAt and updatedAt dates', () => {
      const createdDate = new Date('2023-01-15T10:30:00.000Z');
      const updatedDate = new Date('2023-02-20T15:45:30.000Z');
      const article = createMockArticle({ 
        createdAt: createdDate, 
        updatedAt: updatedDate 
      });
      const result = articleMapper(article);
      
      expect(result.createdAt).toBe('2023-01-15T10:30:00.000Z');
      expect(result.updatedAt).toBe('2023-02-20T15:45:30.000Z');
    });
  });

  describe('favorited field logic', () => {
    it('should return favorited as true when currentUserId is in favoritedBy list', () => {
      const article = createMockArticle();
      const result = articleMapper(article, 2);
      
      expect(result.favorited).toBe(true);
    });

    it('should return favorited as false when currentUserId is not in favoritedBy list', () => {
      const article = createMockArticle();
      const result = articleMapper(article, 999);
      
      expect(result.favorited).toBe(false);
    });

    it('should return favorited as false when currentUserId is undefined (anonymous request)', () => {
      const article = createMockArticle();
      const result = articleMapper(article);
      
      expect(result.favorited).toBe(false);
    });

    it('should return favorited as false when currentUserId is null', () => {
      const article = createMockArticle();
      const result = articleMapper(article, null as any);
      
      expect(result.favorited).toBe(false);
    });

    it('should return favorited as false when currentUserId is 0', () => {
      const article = createMockArticle();
      const result = articleMapper(article, 0);
      
      expect(result.favorited).toBe(false);
    });

    it('should handle empty favoritedBy array with currentUserId', () => {
      const article = createMockArticle({ favoritedBy: [] });
      const result = articleMapper(article, 1);
      
      expect(result.favorited).toBe(false);
    });

    it('should handle empty favoritedBy array without currentUserId', () => {
      const article = createMockArticle({ favoritedBy: [] });
      const result = articleMapper(article);
      
      expect(result.favorited).toBe(false);
    });

    it('should correctly identify first user in favoritedBy list', () => {
      const article = createMockArticle();
      const result = articleMapper(article, 1);
      
      expect(result.favorited).toBe(true);
    });

    it('should correctly identify last user in favoritedBy list', () => {
      const article = createMockArticle();
      const result = articleMapper(article, 3);
      
      expect(result.favorited).toBe(true);
    });
  });

  describe('favoritesCount calculation', () => {
    it('should calculate favoritesCount from favoritedBy array length', () => {
      const article = createMockArticle();
      const result = articleMapper(article);
      
      expect(result.favoritesCount).toBe(3);
    });

    it('should return 0 for favoritesCount when favoritedBy is empty', () => {
      const article = createMockArticle({ favoritedBy: [] });
      const result = articleMapper(article);
      
      expect(result.favoritesCount).toBe(0);
    });

    it('should return 1 for favoritesCount when favoritedBy has one user', () => {
      const article = createMockArticle({ favoritedBy: [{ id: 1 }] });
      const result = articleMapper(article);
      
      expect(result.favoritesCount).toBe(1);
    });

    it('should calculate favoritesCount correctly with large number of favorites', () => {
      const manyFavorites = Array.from({ length: 100 }, (_, i) => ({ id: i + 1 }));
      const article = createMockArticle({ favoritedBy: manyFavorites });
      const result = articleMapper(article);
      
      expect(result.favoritesCount).toBe(100);
    });
  });

  describe('author mapping', () => {
    it('should invoke authorMapper with article author and currentUserId', () => {
      const article = createMockArticle();
      const currentUserId = 5;
      
      articleMapper(article, currentUserId);
      
      expect(mockAuthorMapper).toHaveBeenCalledWith(article.author, currentUserId);
      expect(mockAuthorMapper).toHaveBeenCalledTimes(1);
    });

    it('should invoke authorMapper with article author when currentUserId is undefined', () => {
      const article = createMockArticle();
      
      articleMapper(article);
      
      expect(mockAuthorMapper).toHaveBeenCalledWith(article.author, undefined);
      expect(mockAuthorMapper).toHaveBeenCalledTimes(1);
    });

    it('should include author object in response', () => {
      const article = createMockArticle();
      const result = articleMapper(article);
      
      expect(result.author).toEqual(mockAuthorResponse);
    });

    it('should pass through authorMapper return value', () => {
      const customAuthorResponse = {
        username: 'customauthor',
        bio: 'Custom bio',
        image: 'http://example.com/custom.jpg',
        following: true
      };
      mockAuthorMapper.mockReturnValue(customAuthorResponse);
      
      const article = createMockArticle();
      const result = articleMapper(article);
      
      expect(result.author).toEqual(customAuthorResponse);
    });
  });

  describe('Complete response structure', () => {
    it('should return object with all required fields', () => {
      const article = createMockArticle();
      const result = articleMapper(article, 2);
      
      expect(result).toHaveProperty('slug');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('body');
      expect(result).toHaveProperty('tagList');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
      expect(result).toHaveProperty('favorited');
      expect(result).toHaveProperty('favoritesCount');
      expect(result).toHaveProperty('author');
    });

    it('should return correctly formatted response for authenticated user who favorited', () => {
      const article = createMockArticle();
      const result = articleMapper(article, 1);
      
      expect(result).toEqual({
        slug: 'test-article-slug',
        title: 'Test Article Title',
        description: 'Test article description',
        body: 'Test article body content',
        tagList: ['javascript', 'testing', 'nodejs'],
        createdAt: '2023-01-15T10:30:00.000Z',
        updatedAt: '2023-01-15T10:30:00.000Z',
        favorited: true,
        favoritesCount: 3,
        author: mockAuthorResponse
      });
    });

    it('should return correctly formatted response for authenticated user who did not favorite', () => {
      const article = createMockArticle();
      const result = articleMapper(article, 999);
      
      expect(result).toEqual({
        slug: 'test-article-slug',
        title: 'Test Article Title',
        description: 'Test article description',
        body: 'Test article body content',
        tagList: ['javascript', 'testing', 'nodejs'],
        createdAt: '2023-01-15T10:30:00.000Z',
        updatedAt: '2023-01-15T10:30:00.000Z',
        favorited: false,
        favoritesCount: 3,
        author: mockAuthorResponse
      });
    });

    it('should return correctly formatted response for anonymous user', () => {
      const article = createMockArticle();
      const result = articleMapper(article);
      
      expect(result).toEqual({
        slug: 'test-article-slug',
        title: 'Test Article Title',
        description: 'Test article description',
        body: 'Test article body content',
        tagList: ['javascript', 'testing', 'nodejs'],
        createdAt: '2023-01-15T10:30:00.000Z',
        updatedAt: '2023-01-15T10:30:00.000Z',
        favorited: false,
        favoritesCount: 3,
        author: mockAuthorResponse
      });
    });
  });

  describe('Backward compatibility', () => {
    it('should maintain consistent response structure for article detail endpoint', () => {
      const article = createMockArticle();
      const result = articleMapper(article, 1);
      
      const expectedKeys = [
        'slug', 'title', 'description', 'body', 'tagList',
        'createdAt', 'updatedAt', 'favorited', 'favoritesCount', 'author'
      ];
      
      expect(Object.keys(result).sort()).toEqual(expectedKeys.sort());
    });

    it('should maintain consistent response structure for article feed endpoint', () => {
      const article = createMockArticle();
      const result = articleMapper(article);
      
      const expectedKeys = [
        'slug', 'title', 'description', 'body', 'tagList',
        'createdAt', 'updatedAt', 'favorited', 'favoritesCount', 'author'
      ];
      
      expect(Object.keys(result).sort()).toEqual(expectedKeys.sort());
    });

    it('should handle article objects from article.service.ts consumer', () => {
      const serviceArticle = createMockArticle({
        slug: 'service-article',
        title: 'Service Article',
        description: 'From service',
        body: 'Service body'
      });
      
      const result = articleMapper(serviceArticle, 2);
      
      expect(result.slug).toBe('service-article');
      expect(result.title).toBe('Service Article');
      expect(result.description).toBe('From service');
      expect(result.body).toBe('Service body');
    });
  });

  describe('Edge cases', () => {
    it('should handle article with special characters in fields', () => {
      const article = createMockArticle({
        title: 'Test & Article <Title>',
        description: 'Description with "quotes" and \'apostrophes\'',
        body: 'Body with\nnewlines\tand\ttabs'
      });
      const result = articleMapper(article);
      
      expect(result.title).toBe('Test & Article <Title>');
      expect(result.description).toBe('Description with "quotes" and \'apostrophes\'');
      expect(result.body).toBe('Body with\nnewlines\tand\ttabs');
    });

    it('should handle article with unicode characters', () => {
      const article = createMockArticle({
        title: 'Test 测试 テスト',
        description: 'Emoji 🚀 test',
        body: 'Unicode ñ ü ö'
      });
      const result = articleMapper(article);
      
      expect(result.title).toBe('Test 测试 テスト');
      expect(result.description).toBe('Emoji 🚀 test');
      expect(result.body).toBe('Unicode ñ ü ö');
    });

    it('should handle very long tag names', () => {
      const longTagName = 'a'.repeat(1000);
      const article = createMockArticle({
        tagList: [{ name: longTagName }]
      });
      const result = articleMapper(article);
      
      expect(result.tagList[0]).toBe(longTagName);
      expect(result.tagList[0].length).toBe(1000);
    });

    it('should handle negative user IDs in favoritedBy', () => {
      const article = createMockArticle({
        favoritedBy: [{ id: -1 }, { id: -2 }]
      });
      const result = articleMapper(article, -1);
      
      expect(result.favorited).toBe(true);
      expect(result.favoritesCount).toBe(2);
    });
  });
});