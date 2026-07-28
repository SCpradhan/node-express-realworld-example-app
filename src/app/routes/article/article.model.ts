import { Article, Profile } from './article.model';

describe('Article Interface', () => {
  describe('readingTime property', () => {
    it('should allow Article object without readingTime property (backward compatibility)', () => {
      const mockProfile: Profile = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'https://example.com/image.jpg',
        following: false
      };

      const article: Article = {
        id: '1',
        slug: 'test-article',
        title: 'Test Article',
        description: 'Test description',
        body: 'Test body content',
        tagList: ['test', 'article'],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorited: false,
        favoritesCount: 0,
        author: mockProfile
      };

      expect(article).toBeDefined();
      expect(article.readingTime).toBeUndefined();
    });

    it('should allow Article object with readingTime property set to a number', () => {
      const mockProfile: Profile = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'https://example.com/image.jpg',
        following: false
      };

      const article: Article = {
        id: '1',
        slug: 'test-article',
        title: 'Test Article',
        description: 'Test description',
        body: 'Test body content',
        tagList: ['test', 'article'],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorited: false,
        favoritesCount: 0,
        author: mockProfile,
        readingTime: 5
      };

      expect(article).toBeDefined();
      expect(article.readingTime).toBe(5);
      expect(typeof article.readingTime).toBe('number');
    });

    it('should allow readingTime to be zero', () => {
      const mockProfile: Profile = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'https://example.com/image.jpg',
        following: false
      };

      const article: Article = {
        id: '1',
        slug: 'test-article',
        title: 'Test Article',
        description: 'Test description',
        body: 'Test body content',
        tagList: ['test', 'article'],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorited: false,
        favoritesCount: 0,
        author: mockProfile,
        readingTime: 0
      };

      expect(article.readingTime).toBe(0);
    });

    it('should allow readingTime to be a positive integer', () => {
      const mockProfile: Profile = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'https://example.com/image.jpg',
        following: false
      };

      const article: Article = {
        id: '1',
        slug: 'test-article',
        title: 'Test Article',
        description: 'Test description',
        body: 'Test body content',
        tagList: ['test', 'article'],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorited: false,
        favoritesCount: 0,
        author: mockProfile,
        readingTime: 15
      };

      expect(article.readingTime).toBe(15);
      expect(article.readingTime).toBeGreaterThan(0);
    });

    it('should allow readingTime to be a decimal number', () => {
      const mockProfile: Profile = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'https://example.com/image.jpg',
        following: false
      };

      const article: Article = {
        id: '1',
        slug: 'test-article',
        title: 'Test Article',
        description: 'Test description',
        body: 'Test body content',
        tagList: ['test', 'article'],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorited: false,
        favoritesCount: 0,
        author: mockProfile,
        readingTime: 3.5
      };

      expect(article.readingTime).toBe(3.5);
    });

    it('should maintain all existing Article properties when readingTime is added', () => {
      const mockProfile: Profile = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'https://example.com/image.jpg',
        following: false
      };

      const testDate = new Date();
      const article: Article = {
        id: '123',
        slug: 'test-slug',
        title: 'Test Title',
        description: 'Test Description',
        body: 'Test Body',
        tagList: ['tag1', 'tag2'],
        createdAt: testDate,
        updatedAt: testDate,
        favorited: true,
        favoritesCount: 10,
        author: mockProfile,
        readingTime: 7
      };

      expect(article.id).toBe('123');
      expect(article.slug).toBe('test-slug');
      expect(article.title).toBe('Test Title');
      expect(article.description).toBe('Test Description');
      expect(article.body).toBe('Test Body');
      expect(article.tagList).toEqual(['tag1', 'tag2']);
      expect(article.createdAt).toBe(testDate);
      expect(article.updatedAt).toBe(testDate);
      expect(article.favorited).toBe(true);
      expect(article.favoritesCount).toBe(10);
      expect(article.author).toBe(mockProfile);
      expect(article.readingTime).toBe(7);
    });

    it('should allow explicit undefined for readingTime', () => {
      const mockProfile: Profile = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'https://example.com/image.jpg',
        following: false
      };

      const article: Article = {
        id: '1',
        slug: 'test-article',
        title: 'Test Article',
        description: 'Test description',
        body: 'Test body content',
        tagList: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorited: false,
        favoritesCount: 0,
        author: mockProfile,
        readingTime: undefined
      };

      expect(article.readingTime).toBeUndefined();
    });
  });

  describe('Profile Interface', () => {
    it('should create valid Profile object with all required properties', () => {
      const profile: Profile = {
        username: 'johndoe',
        bio: 'Software developer',
        image: 'https://example.com/avatar.jpg',
        following: true
      };

      expect(profile.username).toBe('johndoe');
      expect(profile.bio).toBe('Software developer');
      expect(profile.image).toBe('https://example.com/avatar.jpg');
      expect(profile.following).toBe(true);
    });
  });

  describe('Type Safety', () => {
    it('should enforce number type for readingTime at compile time', () => {
      const mockProfile: Profile = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'https://example.com/image.jpg',
        following: false
      };

      const article: Article = {
        id: '1',
        slug: 'test-article',
        title: 'Test Article',
        description: 'Test description',
        body: 'Test body content',
        tagList: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorited: false,
        favoritesCount: 0,
        author: mockProfile,
        readingTime: 10
      };

      const readingTimeValue: number | undefined = article.readingTime;
      expect(typeof readingTimeValue === 'number' || readingTimeValue === undefined).toBe(true);
    });
  });
});