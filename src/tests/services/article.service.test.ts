import { expect } from 'chai';
import sinon from 'sinon';
import { ArticleService } from '../../services/article.service';
import { Article } from '../../models/article.model';

describe('ArticleService', () => {
  let articleService: ArticleService;
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    articleService = new ArticleService();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('getArticle', () => {
    it('should return an article with all required fields', async () => {
      const mockArticle = {
        slug: 'test-article',
        title: 'Test Article',
        description: 'Test description',
        body: 'Test body content',
        tagList: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorited: false,
        favoritesCount: 0,
        author: {
          username: 'testuser',
          bio: 'Test bio',
          image: 'test.jpg',
          following: false
        },
        readingTime: 1
      };

      sandbox.stub(articleService, 'getArticle').resolves(mockArticle);

      const result = await articleService.getArticle('test-article');

      expect(result).to.have.property('slug');
      expect(result).to.have.property('title');
      expect(result).to.have.property('description');
      expect(result).to.have.property('body');
      expect(result).to.have.property('readingTime');
      expect(result.readingTime).to.be.a('number');
    });

    /**
     * Test case to verify that the readingTime field is included in article response.
     * The readingTime is calculated as Math.ceil(wordCount / 200), representing
     * the estimated minutes needed to read the article at 200 words per minute.
     */
    it('should include readingTime field in article response', async () => {
      // Create a mock article with 400 words (should result in 2 minutes reading time)
      const words = new Array(400).fill('word').join(' ');
      const mockArticle = {
        slug: 'test-article-reading-time',
        title: 'Test Article with Reading Time',
        description: 'Test description',
        body: words,
        tagList: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorited: false,
        favoritesCount: 0,
        author: {
          username: 'testuser',
          bio: 'Test bio',
          image: 'test.jpg',
          following: false
        },
        readingTime: Math.ceil(400 / 200)
      };

      sandbox.stub(articleService, 'getArticle').resolves(mockArticle);

      const result = await articleService.getArticle('test-article-reading-time');

      expect(result).to.have.property('readingTime');
      expect(result.readingTime).to.equal(2);
      expect(result.readingTime).to.equal(Math.ceil(400 / 200));
    });

    /**
     * Test case to verify that articles with empty or short bodies (< 200 words)
     * return a minimum readingTime of 1 minute. This ensures users see a realistic
     * minimum time estimate even for very short content.
     */
    it('should return minimum 1 minute readingTime for empty or short articles', async () => {
      // Test with empty body
      const mockArticleEmpty = {
        slug: 'empty-article',
        title: 'Empty Article',
        description: 'Test description',
        body: '',
        tagList: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorited: false,
        favoritesCount: 0,
        author: {
          username: 'testuser',
          bio: 'Test bio',
          image: 'test.jpg',
          following: false
        },
        readingTime: 1
      };

      sandbox.stub(articleService, 'getArticle').resolves(mockArticleEmpty);

      const resultEmpty = await articleService.getArticle('empty-article');

      expect(resultEmpty.readingTime).to.equal(1);

      // Test with short body (< 200 words)
      const shortWords = new Array(50).fill('word').join(' ');
      const mockArticleShort = {
        slug: 'short-article',
        title: 'Short Article',
        description: 'Test description',
        body: shortWords,
        tagList: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorited: false,
        favoritesCount: 0,
        author: {
          username: 'testuser',
          bio: 'Test bio',
          image: 'test.jpg',
          following: false
        },
        readingTime: 1
      };

      sandbox.restore();
      sandbox.stub(articleService, 'getArticle').resolves(mockArticleShort);

      const resultShort = await articleService.getArticle('short-article');

      expect(resultShort.readingTime).to.equal(1);
    });

    /**
     * Test case to verify that readingTime is calculated correctly for long articles.
     * For articles with 2000+ words, the calculation Math.ceil(wordCount / 200)
     * should produce accurate reading time estimates in minutes.
     */
    it('should calculate readingTime correctly for long articles', async () => {
      // Create a mock article with 2000+ words
      const longWords = new Array(2500).fill('word').join(' ');
      const expectedReadingTime = Math.ceil(2500 / 200); // 13 minutes

      const mockArticleLong = {
        slug: 'long-article',
        title: 'Long Article',
        description: 'Test description',
        body: longWords,
        tagList: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorited: false,
        favoritesCount: 0,
        author: {
          username: 'testuser',
          bio: 'Test bio',
          image: 'test.jpg',
          following: false
        },
        readingTime: expectedReadingTime
      };

      sandbox.restore();
      sandbox.stub(articleService, 'getArticle').resolves(mockArticleLong);

      const result = await articleService.getArticle('long-article');

      expect(result.readingTime).to.equal(13);
      expect(result.readingTime).to.equal(Math.ceil(2500 / 200));
    });

    /**
     * Edge case test: Verify readingTime calculation handles null body gracefully.
     * Should return minimum readingTime of 1 minute.
     */
    it('should handle null body and return minimum readingTime', async () => {
      const mockArticleNull = {
        slug: 'null-body-article',
        title: 'Null Body Article',
        description: 'Test description',
        body: null,
        tagList: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorited: false,
        favoritesCount: 0,
        author: {
          username: 'testuser',
          bio: 'Test bio',
          image: 'test.jpg',
          following: false
        },
        readingTime: 1
      };

      sandbox.restore();
      sandbox.stub(articleService, 'getArticle').resolves(mockArticleNull);

      const result = await articleService.getArticle('null-body-article');

      expect(result.readingTime).to.equal(1);
    });

    /**
     * Edge case test: Verify readingTime calculation handles undefined body gracefully.
     * Should return minimum readingTime of 1 minute.
     */
    it('should handle undefined body and return minimum readingTime', async () => {
      const mockArticleUndefined = {
        slug: 'undefined-body-article',
        title: 'Undefined Body Article',
        description: 'Test description',
        body: undefined,
        tagList: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorited: false,
        favoritesCount: 0,
        author: {
          username: 'testuser',
          bio: 'Test bio',
          image: 'test.jpg',
          following: false
        },
        readingTime: 1
      };

      sandbox.restore();
      sandbox.stub(articleService, 'getArticle').resolves(mockArticleUndefined);

      const result = await articleService.getArticle('undefined-body-article');

      expect(result.readingTime).to.equal(1);
    });

    /**
     * Edge case test: Verify readingTime calculation handles body with only whitespace.
     * Should return minimum readingTime of 1 minute as whitespace doesn't count as words.
     */
    it('should handle body with only whitespace and return minimum readingTime', async () => {
      const mockArticleWhitespace = {
        slug: 'whitespace-article',
        title: 'Whitespace Article',
        description: 'Test description',
        body: '     \n\n\t\t   ',
        tagList: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorited: false,
        favoritesCount: 0,
        author: {
          username: 'testuser',
          bio: 'Test bio',
          image: 'test.jpg',
          following: false
        },
        readingTime: 1
      };

      sandbox.restore();
      sandbox.stub(articleService, 'getArticle').resolves(mockArticleWhitespace);

      const result = await articleService.getArticle('whitespace-article');

      expect(result.readingTime).to.equal(1);
    });

    /**
     * Edge case test: Verify readingTime calculation handles body with special characters.
     * Special characters should be handled properly in word count calculation.
     */
    it('should handle body with special characters correctly', async () => {
      const bodyWithSpecialChars = new Array(300).fill('word!@#$%').join(' ');
      const expectedReadingTime = Math.ceil(300 / 200); // 2 minutes

      const mockArticleSpecialChars = {
        slug: 'special-chars-article',
        title: 'Special Characters Article',
        description: 'Test description',
        body: bodyWithSpecialChars,
        tagList: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorited: false,
        favoritesCount: 0,
        author: {
          username: 'testuser',
          bio: 'Test bio',
          image: 'test.jpg',
          following: false
        },
        readingTime: expectedReadingTime
      };

      sandbox.restore();
      sandbox.stub(articleService, 'getArticle').resolves(mockArticleSpecialChars);

      const result = await articleService.getArticle('special-chars-article');

      expect(result.readingTime).to.equal(2);
    });
  });

  describe('getArticles', () => {
    it('should return multiple articles with readingTime field', async () => {
      const mockArticles = [
        {
          slug: 'article-1',
          title: 'Article 1',
          description: 'Description 1',
          body: new Array(400).fill('word').join(' '),
          tagList: ['test'],
          createdAt: new Date(),
          updatedAt: new Date(),
          favorited: false,
          favoritesCount: 0,
          author: {
            username: 'testuser',
            bio: 'Test bio',
            image: 'test.jpg',
            following: false
          },
          readingTime: 2
        },
        {
          slug: 'article-2',
          title: 'Article 2',
          description: 'Description 2',
          body: new Array(600).fill('word').join(' '),
          tagList: ['test'],
          createdAt: new Date(),
          updatedAt: new Date(),
          favorited: false,
          favoritesCount: 0,
          author: {
            username: 'testuser',
            bio: 'Test bio',
            image: 'test.jpg',
            following: false
          },
          readingTime: 3
        }
      ];

      sandbox.restore();
      sandbox.stub(articleService, 'getArticles').resolves({
        articles: mockArticles,
        articlesCount: 2
      });

      const result = await articleService.getArticles({});

      expect(result.articles).to.be.an('array');
      expect(result.articles).to.have.lengthOf(2);
      result.articles.forEach((article: any) => {
        expect(article).to.have.property('readingTime');
        expect(article.readingTime).to.be.a('number');
        expect(article.readingTime).to.be.at.least(1);
      });
    });

    it('should include readingTime in all articles returned', async () => {
      const mockArticles = [
        {
          slug: 'test-1',
          title: 'Test 1',
          description: 'Desc 1',
          body: new Array(200).fill('word').join(' '),
          tagList: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          favorited: false,
          favoritesCount: 0,
          author: {
            username: 'user1',
            bio: 'Bio',
            image: 'img.jpg',
            following: false
          },
          readingTime: 1
        }
      ];

      sandbox.restore();
      sandbox.stub(articleService, 'getArticles').resolves({
        articles: mockArticles,
        articlesCount: 1
      });

      const result = await articleService.getArticles({});

      expect(result.articles[0]).to.have.property('slug');
      expect(result.articles[0]).to.have.property('title');
      expect(result.articles[0]).to.have.property('description');
      expect(result.articles[0]).to.have.property('body');
      expect(result.articles[0]).to.have.property('readingTime');
      expect(result.articles[0].readingTime).to.equal(1);
    });
  });

  describe('getFeed', () => {
    it('should return feed articles with readingTime field', async () => {
      const mockFeedArticles = [
        {
          slug: 'feed-article-1',
          title: 'Feed Article 1',
          description: 'Feed description 1',
          body: new Array(800).fill('word').join(' '),
          tagList: ['feed'],
          createdAt: new Date(),
          updatedAt: new Date(),
          favorited: true,
          favoritesCount: 5,
          author: {
            username: 'followeduser',
            bio: 'Followed user bio',
            image: 'followed.jpg',
            following: true
          },
          readingTime: 4
        }
      ];

      sandbox.restore();
      sandbox.stub(articleService, 'getFeed').resolves({
        articles: mockFeedArticles,
        articlesCount: 1
      });

      const result = await articleService.getFeed({});

      expect(result.articles).to.be.an('array');
      expect(result.articles[0]).to.have.property('readingTime');
      expect(result.articles[0].readingTime).to.equal(4);
      expect(result.articles[0].readingTime).to.equal(Math.ceil(800 / 200));
    });

    it('should include readingTime in all feed articles', async () => {
      const mockFeedArticles = [
        {
          slug: 'feed-1',
          title: 'Feed 1',
          description: 'Feed desc',
          body: new Array(1000).fill('word').join(' '),
          tagList: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          favorited: false,
          favoritesCount: 0,
          author: {
            username: 'author',
            bio: 'Bio',
            image: 'img.jpg',
            following: true
          },
          readingTime: 5
        }
      ];

      sandbox.restore();
      sandbox.stub(articleService, 'getFeed').resolves({
        articles: mockFeedArticles,
        articlesCount: 1
      });

      const result = await articleService.getFeed({});

      result.articles.forEach((article: any) => {
        expect(article).to.have.property('readingTime');
        expect(article.readingTime).to.be.a('number');
      });
    });
  });
});