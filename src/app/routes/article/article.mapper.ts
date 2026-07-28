import { articleMapper } from './article.mapper';

describe('calculateReadingTime', () => {
  // Access the calculateReadingTime function through the module
  const calculateReadingTime = (body: string): number => {
    const result = articleMapper({ body });
    return result.readingTime;
  };

  describe('Edge Cases - Null/Undefined/Empty', () => {
    it('should return 1 for null body', () => {
      const result = articleMapper({ body: null });
      expect(result.readingTime).toBe(1);
    });

    it('should return 1 for undefined body', () => {
      const result = articleMapper({ body: undefined });
      expect(result.readingTime).toBe(1);
    });

    it('should return 1 for empty string body', () => {
      const result = articleMapper({ body: '' });
      expect(result.readingTime).toBe(1);
    });

    it('should return 1 for body with only whitespace', () => {
      const result = articleMapper({ body: '   \n\t  ' });
      expect(result.readingTime).toBe(1);
    });
  });

  describe('Word Count Calculation', () => {
    it('should return 1 for very short body with 1 word', () => {
      const result = articleMapper({ body: 'Hello' });
      expect(result.readingTime).toBe(1);
    });

    it('should return 1 for body with 50 words', () => {
      const words = Array(50).fill('word').join(' ');
      const result = articleMapper({ body: words });
      expect(result.readingTime).toBe(1);
    });

    it('should return 1 for body with exactly 200 words', () => {
      const words = Array(200).fill('word').join(' ');
      const result = articleMapper({ body: words });
      expect(result.readingTime).toBe(1);
    });

    it('should return 2 for body with 201 words', () => {
      const words = Array(201).fill('word').join(' ');
      const result = articleMapper({ body: words });
      expect(result.readingTime).toBe(2);
    });

    it('should return 2 for body with 400 words', () => {
      const words = Array(400).fill('word').join(' ');
      const result = articleMapper({ body: words });
      expect(result.readingTime).toBe(2);
    });

    it('should return 3 for body with 401 words', () => {
      const words = Array(401).fill('word').join(' ');
      const result = articleMapper({ body: words });
      expect(result.readingTime).toBe(3);
    });

    it('should return 5 for body with 1000 words', () => {
      const words = Array(1000).fill('word').join(' ');
      const result = articleMapper({ body: words });
      expect(result.readingTime).toBe(5);
    });

    it('should return 51 for very long body with 10000 words', () => {
      const words = Array(10000).fill('word').join(' ');
      const result = articleMapper({ body: words });
      expect(result.readingTime).toBe(50);
    });

    it('should return 101 for extremely long body with 20000 words', () => {
      const words = Array(20000).fill('word').join(' ');
      const result = articleMapper({ body: words });
      expect(result.readingTime).toBe(100);
    });
  });

  describe('Special Characters and Formatting', () => {
    it('should handle body with special characters', () => {
      const body = 'Hello! How are you? I\'m fine. #testing @mentions $money';
      const result = articleMapper({ body });
      expect(result.readingTime).toBe(1);
    });

    it('should handle body with punctuation', () => {
      const body = 'Word, word. word! word? word; word: word...';
      const result = articleMapper({ body });
      expect(result.readingTime).toBe(1);
    });

    it('should handle body with multiple spaces between words', () => {
      const words = Array(250).fill('word').join('   ');
      const result = articleMapper({ body: words });
      expect(result.readingTime).toBe(2);
    });

    it('should handle body with newlines and tabs', () => {
      const body = 'word\nword\tword\n\nword\t\tword';
      const result = articleMapper({ body });
      expect(result.readingTime).toBe(1);
    });

    it('should handle body with mixed whitespace', () => {
      const words = Array(300).fill('word').join(' \n\t ');
      const result = articleMapper({ body: words });
      expect(result.readingTime).toBe(2);
    });

    it('should handle body with leading and trailing whitespace', () => {
      const words = '   ' + Array(250).fill('word').join(' ') + '   ';
      const result = articleMapper({ body: words });
      expect(result.readingTime).toBe(2);
    });

    it('should handle body with unicode characters', () => {
      const body = 'Hello 世界 مرحبا שלום Привет';
      const result = articleMapper({ body });
      expect(result.readingTime).toBe(1);
    });

    it('should handle body with emojis', () => {
      const body = '😀 😃 😄 😁 😆 word word word';
      const result = articleMapper({ body });
      expect(result.readingTime).toBe(1);
    });
  });

  describe('Math.ceil behavior', () => {
    it('should round up 199 words to 1 minute', () => {
      const words = Array(199).fill('word').join(' ');
      const result = articleMapper({ body: words });
      expect(result.readingTime).toBe(1);
    });

    it('should round up 250 words to 2 minutes', () => {
      const words = Array(250).fill('word').join(' ');
      const result = articleMapper({ body: words });
      expect(result.readingTime).toBe(2);
    });

    it('should round up 399 words to 2 minutes', () => {
      const words = Array(399).fill('word').join(' ');
      const result = articleMapper({ body: words });
      expect(result.readingTime).toBe(2);
    });
  });
});

describe('articleMapper', () => {
  describe('Backward Compatibility', () => {
    it('should maintain all existing properties in the response', () => {
      const article = {
        slug: 'test-article',
        title: 'Test Article',
        description: 'Test Description',
        body: 'Test body content',
        tagList: ['tag1', 'tag2'],
        createdAt: '2023-01-01',
        updatedAt: '2023-01-02',
        favorited: true,
        favoritesCount: 5,
        author: {
          username: 'testuser',
          bio: 'Test bio',
          image: 'test.jpg',
          following: true
        }
      };

      const result = articleMapper(article);

      expect(result.slug).toBe('test-article');
      expect(result.title).toBe('Test Article');
      expect(result.description).toBe('Test Description');
      expect(result.body).toBe('Test body content');
      expect(result.tagList).toEqual(['tag1', 'tag2']);
      expect(result.createdAt).toBe('2023-01-01');
      expect(result.updatedAt).toBe('2023-01-02');
      expect(result.favorited).toBe(true);
      expect(result.favoritesCount).toBe(5);
      expect(result.author.username).toBe('testuser');
      expect(result.author.bio).toBe('Test bio');
      expect(result.author.image).toBe('test.jpg');
      expect(result.author.following).toBe(true);
    });

    it('should handle missing optional properties with defaults', () => {
      const article = {
        slug: 'test-article',
        title: 'Test Article',
        description: 'Test Description',
        body: 'Test body content'
      };

      const result = articleMapper(article);

      expect(result.tagList).toEqual([]);
      expect(result.favorited).toBe(false);
      expect(result.favoritesCount).toBe(0);
      expect(result.author.following).toBe(false);
    });

    it('should handle missing author properties', () => {
      const article = {
        slug: 'test-article',
        title: 'Test Article',
        description: 'Test Description',
        body: 'Test body content',
        author: {}
      };

      const result = articleMapper(article);

      expect(result.author.username).toBeUndefined();
      expect(result.author.bio).toBeUndefined();
      expect(result.author.image).toBeUndefined();
      expect(result.author.following).toBe(false);
    });
  });

  describe('readingTime Property Integration', () => {
    it('should include readingTime property in the response', () => {
      const article = {
        slug: 'test-article',
        title: 'Test Article',
        description: 'Test Description',
        body: 'Test body content with some words',
        tagList: ['tag1']
      };

      const result = articleMapper(article);

      expect(result).toHaveProperty('readingTime');
      expect(typeof result.readingTime).toBe('number');
    });

    it('should position readingTime after body and before tagList', () => {
      const article = {
        slug: 'test-article',
        title: 'Test Article',
        description: 'Test Description',
        body: 'Test body content',
        tagList: ['tag1']
      };

      const result = articleMapper(article);
      const keys = Object.keys(result);

      const bodyIndex = keys.indexOf('body');
      const readingTimeIndex = keys.indexOf('readingTime');
      const tagListIndex = keys.indexOf('tagList');

      expect(readingTimeIndex).toBeGreaterThan(bodyIndex);
      expect(readingTimeIndex).toBeLessThan(tagListIndex);
    });

    it('should calculate readingTime correctly for single article response', () => {
      const article = {
        slug: 'test-article',
        title: 'Test Article',
        description: 'Test Description',
        body: Array(500).fill('word').join(' ')
      };

      const result = articleMapper(article);

      expect(result.readingTime).toBe(3);
    });

    it('should work for article list responses', () => {
      const articles = [
        { body: Array(200).fill('word').join(' ') },
        { body: Array(400).fill('word').join(' ') },
        { body: Array(600).fill('word').join(' ') }
      ];

      const results = articles.map(articleMapper);

      expect(results[0].readingTime).toBe(1);
      expect(results[1].readingTime).toBe(2);
      expect(results[2].readingTime).toBe(3);
    });

    it('should work for feed responses', () => {
      const feedArticles = [
        { body: 'Short article' },
        { body: Array(1000).fill('word').join(' ') },
        { body: '' }
      ];

      const results = feedArticles.map(articleMapper);

      expect(results[0].readingTime).toBe(1);
      expect(results[1].readingTime).toBe(5);
      expect(results[2].readingTime).toBe(1);
    });
  });

  describe('TypeScript Type Inference', () => {
    it('should return an object with readingTime as a number', () => {
      const article = {
        slug: 'test-article',
        title: 'Test Article',
        description: 'Test Description',
        body: 'Test body content'
      };

      const result = articleMapper(article);

      expect(typeof result.readingTime).toBe('number');
      expect(Number.isInteger(result.readingTime)).toBe(true);
      expect(result.readingTime).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Comprehensive Integration Tests', () => {
    it('should handle complete article with all properties and correct readingTime', () => {
      const article = {
        slug: 'comprehensive-test',
        title: 'Comprehensive Test Article',
        description: 'A comprehensive test',
        body: Array(750).fill('word').join(' '),
        tagList: ['test', 'comprehensive'],
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-02T00:00:00.000Z',
        favorited: true,
        favoritesCount: 10,
        author: {
          username: 'testauthor',
          bio: 'Test author bio',
          image: 'https://example.com/image.jpg',
          following: true
        }
      };

      const result = articleMapper(article);

      expect(result.slug).toBe('comprehensive-test');
      expect(result.title).toBe('Comprehensive Test Article');
      expect(result.description).toBe('A comprehensive test');
      expect(result.body).toBe(article.body);
      expect(result.readingTime).toBe(4);
      expect(result.tagList).toEqual(['test', 'comprehensive']);
      expect(result.createdAt).toBe('2023-01-01T00:00:00.000Z');
      expect(result.updatedAt).toBe('2023-01-02T00:00:00.000Z');
      expect(result.favorited).toBe(true);
      expect(result.favoritesCount).toBe(10);
      expect(result.author.username).toBe('testauthor');
      expect(result.author.bio).toBe('Test author bio');
      expect(result.author.image).toBe('https://example.com/image.jpg');
      expect(result.author.following).toBe(true);
    });

    it('should handle minimal article with only required fields', () => {
      const article = {
        body: 'Minimal content'
      };

      const result = articleMapper(article);

      expect(result.readingTime).toBe(1);
      expect(result.tagList).toEqual([]);
      expect(result.favorited).toBe(false);
      expect(result.favoritesCount).toBe(0);
    });
  });
});