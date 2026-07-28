import request from 'supertest';
import express, { Express } from 'express';
import articleRouter from './article.controller';
import { ArticleService } from './article.service';
import { auth } from '../../middleware/auth';

jest.mock('./article.service');
jest.mock('../../middleware/auth');

describe('Article Controller', () => {
  let app: Express;
  let mockArticleService: jest.Mocked<ArticleService>;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/articles', articleRouter);

    mockArticleService = new ArticleService() as jest.Mocked<ArticleService>;
    (ArticleService as jest.MockedClass<typeof ArticleService>).mockImplementation(() => mockArticleService);

    (auth.optional as jest.Mock) = jest.fn((req, res, next) => next());
    (auth.required as jest.Mock) = jest.fn((req, res, next) => {
      req.user = { id: 'user123' };
      next();
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /articles', () => {
    it('should return multiple articles with readingTime field', async () => {
      const mockArticles = {
        articles: [
          {
            slug: 'test-article',
            title: 'Test Article',
            description: 'Test description',
            body: 'Test body content',
            readingTime: 5,
            tagList: [],
            createdAt: '2023-01-01',
            updatedAt: '2023-01-01',
            favorited: false,
            favoritesCount: 0,
            author: {
              username: 'testuser',
              bio: '',
              image: '',
              following: false
            }
          }
        ],
        articlesCount: 1
      };

      mockArticleService.getArticles.mockResolvedValue(mockArticles);

      const response = await request(app).get('/articles');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockArticles);
      expect(response.body.articles[0]).toHaveProperty('readingTime');
      expect(response.body.articles[0].readingTime).toBe(5);
      expect(mockArticleService.getArticles).toHaveBeenCalledWith(
        {
          tag: undefined,
          author: undefined,
          favorited: undefined,
          limit: 20,
          offset: 0
        },
        undefined
      );
    });

    it('should handle query parameters correctly', async () => {
      const mockArticles = { articles: [], articlesCount: 0 };
      mockArticleService.getArticles.mockResolvedValue(mockArticles);

      await request(app).get('/articles?tag=testing&author=john&favorited=jane&limit=10&offset=5');

      expect(mockArticleService.getArticles).toHaveBeenCalledWith(
        {
          tag: 'testing',
          author: 'john',
          favorited: 'jane',
          limit: 10,
          offset: 5
        },
        undefined
      );
    });

    it('should use default limit and offset when not provided', async () => {
      const mockArticles = { articles: [], articlesCount: 0 };
      mockArticleService.getArticles.mockResolvedValue(mockArticles);

      await request(app).get('/articles');

      expect(mockArticleService.getArticles).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 20,
          offset: 0
        }),
        undefined
      );
    });

    it('should pass errors to error handler', async () => {
      const error = new Error('Service error');
      mockArticleService.getArticles.mockRejectedValue(error);

      const response = await request(app).get('/articles');

      expect(response.status).not.toBe(200);
    });

    it('should call auth.optional middleware', async () => {
      const mockArticles = { articles: [], articlesCount: 0 };
      mockArticleService.getArticles.mockResolvedValue(mockArticles);

      await request(app).get('/articles');

      expect(auth.optional).toHaveBeenCalled();
    });
  });

  describe('GET /articles/feed', () => {
    it('should return feed articles with readingTime field', async () => {
      const mockFeed = {
        articles: [
          {
            slug: 'feed-article',
            title: 'Feed Article',
            description: 'Feed description',
            body: 'Feed body content',
            readingTime: 3,
            tagList: [],
            createdAt: '2023-01-01',
            updatedAt: '2023-01-01',
            favorited: false,
            favoritesCount: 0,
            author: {
              username: 'followeduser',
              bio: '',
              image: '',
              following: true
            }
          }
        ],
        articlesCount: 1
      };

      mockArticleService.getFeed.mockResolvedValue(mockFeed);

      const response = await request(app).get('/articles/feed');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockFeed);
      expect(response.body.articles[0]).toHaveProperty('readingTime');
      expect(response.body.articles[0].readingTime).toBe(3);
      expect(mockArticleService.getFeed).toHaveBeenCalledWith(
        {
          limit: 20,
          offset: 0
        },
        'user123'
      );
    });

    it('should handle feed query parameters correctly', async () => {
      const mockFeed = { articles: [], articlesCount: 0 };
      mockArticleService.getFeed.mockResolvedValue(mockFeed);

      await request(app).get('/articles/feed?limit=15&offset=10');

      expect(mockArticleService.getFeed).toHaveBeenCalledWith(
        {
          limit: 15,
          offset: 10
        },
        'user123'
      );
    });

    it('should require authentication', async () => {
      const mockFeed = { articles: [], articlesCount: 0 };
      mockArticleService.getFeed.mockResolvedValue(mockFeed);

      await request(app).get('/articles/feed');

      expect(auth.required).toHaveBeenCalled();
    });

    it('should pass errors to error handler', async () => {
      const error = new Error('Feed error');
      mockArticleService.getFeed.mockRejectedValue(error);

      const response = await request(app).get('/articles/feed');

      expect(response.status).not.toBe(200);
    });
  });

  describe('GET /articles/:slug', () => {
    it('should return single article with readingTime field', async () => {
      const mockArticle = {
        slug: 'single-article',
        title: 'Single Article',
        description: 'Single description',
        body: 'Single body content with more words to test reading time calculation',
        readingTime: 7,
        tagList: ['test'],
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
        favorited: false,
        favoritesCount: 5,
        author: {
          username: 'author',
          bio: 'Author bio',
          image: 'https://example.com/image.jpg',
          following: false
        }
      };

      mockArticleService.getArticleBySlug.mockResolvedValue(mockArticle);

      const response = await request(app).get('/articles/single-article');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ article: mockArticle });
      expect(response.body.article).toHaveProperty('readingTime');
      expect(response.body.article.readingTime).toBe(7);
      expect(mockArticleService.getArticleBySlug).toHaveBeenCalledWith('single-article', undefined);
    });

    it('should call auth.optional middleware', async () => {
      const mockArticle = { slug: 'test', readingTime: 5 };
      mockArticleService.getArticleBySlug.mockResolvedValue(mockArticle);

      await request(app).get('/articles/test-slug');

      expect(auth.optional).toHaveBeenCalled();
    });

    it('should pass slug parameter correctly', async () => {
      const mockArticle = { slug: 'my-article-slug', readingTime: 4 };
      mockArticleService.getArticleBySlug.mockResolvedValue(mockArticle);

      await request(app).get('/articles/my-article-slug');

      expect(mockArticleService.getArticleBySlug).toHaveBeenCalledWith('my-article-slug', undefined);
    });

    it('should pass errors to error handler', async () => {
      const error = new Error('Article not found');
      mockArticleService.getArticleBySlug.mockRejectedValue(error);

      const response = await request(app).get('/articles/nonexistent');

      expect(response.status).not.toBe(200);
    });
  });

  describe('POST /articles', () => {
    it('should create article and return it with readingTime', async () => {
      const articleData = {
        title: 'New Article',
        description: 'New description',
        body: 'New body content',
        tagList: ['new']
      };

      const mockCreatedArticle = {
        ...articleData,
        slug: 'new-article',
        readingTime: 2,
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
        favorited: false,
        favoritesCount: 0,
        author: {
          username: 'testuser',
          bio: '',
          image: '',
          following: false
        }
      };

      mockArticleService.createArticle.mockResolvedValue(mockCreatedArticle);

      const response = await request(app)
        .post('/articles')
        .send({ article: articleData });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ article: mockCreatedArticle });
      expect(response.body.article).toHaveProperty('readingTime');
      expect(mockArticleService.createArticle).toHaveBeenCalledWith(articleData, 'user123');
    });

    it('should require authentication', async () => {
      await request(app).post('/articles').send({ article: {} });

      expect(auth.required).toHaveBeenCalled();
    });

    it('should pass errors to error handler', async () => {
      const error = new Error('Creation failed');
      mockArticleService.createArticle.mockRejectedValue(error);

      const response = await request(app)
        .post('/articles')
        .send({ article: { title: 'Test' } });

      expect(response.status).not.toBe(201);
    });
  });

  describe('PUT /articles/:slug', () => {
    it('should update article and return it with readingTime', async () => {
      const updateData = {
        title: 'Updated Title',
        body: 'Updated body content'
      };

      const mockUpdatedArticle = {
        slug: 'test-article',
        title: 'Updated Title',
        description: 'Original description',
        body: 'Updated body content',
        readingTime: 6,
        tagList: [],
        createdAt: '2023-01-01',
        updatedAt: '2023-01-02',
        favorited: false,
        favoritesCount: 0,
        author: {
          username: 'testuser',
          bio: '',
          image: '',
          following: false
        }
      };

      mockArticleService.updateArticle.mockResolvedValue(mockUpdatedArticle);

      const response = await request(app)
        .put('/articles/test-article')
        .send({ article: updateData });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ article: mockUpdatedArticle });
      expect(response.body.article).toHaveProperty('readingTime');
      expect(response.body.article.readingTime).toBe(6);
      expect(mockArticleService.updateArticle).toHaveBeenCalledWith('test-article', updateData, 'user123');
    });

    it('should require authentication', async () => {
      await request(app).put('/articles/test').send({ article: {} });

      expect(auth.required).toHaveBeenCalled();
    });

    it('should pass errors to error handler', async () => {
      const error = new Error('Update failed');
      mockArticleService.updateArticle.mockRejectedValue(error);

      const response = await request(app)
        .put('/articles/test')
        .send({ article: { title: 'Test' } });

      expect(response.status).not.toBe(200);
    });
  });

  describe('DELETE /articles/:slug', () => {
    it('should delete article and return 204', async () => {
      mockArticleService.deleteArticle.mockResolvedValue(undefined);

      const response = await request(app).delete('/articles/test-article');

      expect(response.status).toBe(204);
      expect(response.body).toEqual({});
      expect(mockArticleService.deleteArticle).toHaveBeenCalledWith('test-article', 'user123');
    });

    it('should require authentication', async () => {
      await request(app).delete('/articles/test');

      expect(auth.required).toHaveBeenCalled();
    });

    it('should pass errors to error handler', async () => {
      const error = new Error('Delete failed');
      mockArticleService.deleteArticle.mockRejectedValue(error);

      const response = await request(app).delete('/articles/test');

      expect(response.status).not.toBe(204);
    });
  });

  describe('POST /articles/:slug/favorite', () => {
    it('should favorite article and return it with readingTime', async () => {
      const mockFavoritedArticle = {
        slug: 'test-article',
        title: 'Test Article',
        description: 'Test description',
        body: 'Test body',
        readingTime: 4,
        tagList: [],
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
        favorited: true,
        favoritesCount: 1,
        author: {
          username: 'author',
          bio: '',
          image: '',
          following: false
        }
      };

      mockArticleService.favoriteArticle.mockResolvedValue(mockFavoritedArticle);

      const response = await request(app).post('/articles/test-article/favorite');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ article: mockFavoritedArticle });
      expect(response.body.article).toHaveProperty('readingTime');
      expect(response.body.article.favorited).toBe(true);
      expect(mockArticleService.favoriteArticle).toHaveBeenCalledWith('test-article', 'user123');
    });

    it('should require authentication', async () => {
      await request(app).post('/articles/test/favorite');

      expect(auth.required).toHaveBeenCalled();
    });

    it('should pass errors to error handler', async () => {
      const error = new Error('Favorite failed');
      mockArticleService.favoriteArticle.mockRejectedValue(error);

      const response = await request(app).post('/articles/test/favorite');

      expect(response.status).not.toBe(200);
    });
  });

  describe('DELETE /articles/:slug/favorite', () => {
    it('should unfavorite article and return it with readingTime', async () => {
      const mockUnfavoritedArticle = {
        slug: 'test-article',
        title: 'Test Article',
        description: 'Test description',
        body: 'Test body',
        readingTime: 4,
        tagList: [],
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
        favorited: false,
        favoritesCount: 0,
        author: {
          username: 'author',
          bio: '',
          image: '',
          following: false
        }
      };

      mockArticleService.unfavoriteArticle.mockResolvedValue(mockUnfavoritedArticle);

      const response = await request(app).delete('/articles/test-article/favorite');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ article: mockUnfavoritedArticle });
      expect(response.body.article).toHaveProperty('readingTime');
      expect(response.body.article.favorited).toBe(false);
      expect(mockArticleService.unfavoriteArticle).toHaveBeenCalledWith('test-article', 'user123');
    });

    it('should require authentication', async () => {
      await request(app).delete('/articles/test/favorite');

      expect(auth.required).toHaveBeenCalled();
    });

    it('should pass errors to error handler', async () => {
      const error = new Error('Unfavorite failed');
      mockArticleService.unfavoriteArticle.mockRejectedValue(error);

      const response = await request(app).delete('/articles/test/favorite');

      expect(response.status).not.toBe(200);
    });
  });

  describe('Response Structure Validation', () => {
    it('should verify GET /articles returns readingTime in response structure', async () => {
      const mockArticles = {
        articles: [
          {
            slug: 'test',
            title: 'Test',
            description: 'Test',
            body: 'Test',
            readingTime: 5,
            tagList: [],
            createdAt: '2023-01-01',
            updatedAt: '2023-01-01',
            favorited: false,
            favoritesCount: 0,
            author: { username: 'test', bio: '', image: '', following: false }
          }
        ],
        articlesCount: 1
      };

      mockArticleService.getArticles.mockResolvedValue(mockArticles);

      const response = await request(app).get('/articles');

      expect(response.body).toHaveProperty('articles');
      expect(response.body).toHaveProperty('articlesCount');
      expect(Array.isArray(response.body.articles)).toBe(true);
      expect(response.body.articles[0]).toHaveProperty('readingTime');
      expect(typeof response.body.articles[0].readingTime).toBe('number');
    });

    it('should verify GET /articles/feed returns readingTime in response structure', async () => {
      const mockFeed = {
        articles: [
          {
            slug: 'feed',
            title: 'Feed',
            description: 'Feed',
            body: 'Feed',
            readingTime: 3,
            tagList: [],
            createdAt: '2023-01-01',
            updatedAt: '2023-01-01',
            favorited: false,
            favoritesCount: 0,
            author: { username: 'test', bio: '', image: '', following: true }
          }
        ],
        articlesCount: 1
      };

      mockArticleService.getFeed.mockResolvedValue(mockFeed);

      const response = await request(app).get('/articles/feed');

      expect(response.body).toHaveProperty('articles');
      expect(response.body).toHaveProperty('articlesCount');
      expect(Array.isArray(response.body.articles)).toBe(true);
      expect(response.body.articles[0]).toHaveProperty('readingTime');
      expect(typeof response.body.articles[0].readingTime).toBe('number');
    });

    it('should verify GET /articles/:slug returns readingTime in response structure', async () => {
      const mockArticle = {
        slug: 'single',
        title: 'Single',
        description: 'Single',
        body: 'Single',
        readingTime: 7,
        tagList: [],
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
        favorited: false,
        favoritesCount: 0,
        author: { username: 'test', bio: '', image: '', following: false }
      };

      mockArticleService.getArticleBySlug.mockResolvedValue(mockArticle);

      const response = await request(app).get('/articles/single');

      expect(response.body).toHaveProperty('article');
      expect(response.body.article).toHaveProperty('readingTime');
      expect(typeof response.body.article.readingTime).toBe('number');
    });
  });

  describe('Authentication Middleware Integration', () => {
    it('should verify auth.optional works correctly for GET /articles', async () => {
      const mockArticles = { articles: [], articlesCount: 0 };
      mockArticleService.getArticles.mockResolvedValue(mockArticles);

      await request(app).get('/articles');

      expect(auth.optional).toHaveBeenCalled();
      expect(auth.required).not.toHaveBeenCalled();
    });

    it('should verify auth.optional works correctly for GET /articles/:slug', async () => {
      const mockArticle = { slug: 'test', readingTime: 5 };
      mockArticleService.getArticleBySlug.mockResolvedValue(mockArticle);

      await request(app).get('/articles/test');

      expect(auth.optional).toHaveBeenCalled();
      expect(auth.required).not.toHaveBeenCalled();
    });

    it('should verify auth.required works correctly for GET /articles/feed', async () => {
      const mockFeed = { articles: [], articlesCount: 0 };
      mockArticleService.getFeed.mockResolvedValue(mockFeed);

      await request(app).get('/articles/feed');

      expect(auth.required).toHaveBeenCalled();
    });

    it('should verify auth.required works correctly for POST /articles', async () => {
      const mockArticle = { slug: 'test', readingTime: 5 };
      mockArticleService.createArticle.mockResolvedValue(mockArticle);

      await request(app).post('/articles').send({ article: {} });

      expect(auth.required).toHaveBeenCalled();
    });

    it('should verify auth.required works correctly for PUT /articles/:slug', async () => {
      const mockArticle = { slug: 'test', readingTime: 5 };
      mockArticleService.updateArticle.mockResolvedValue(mockArticle);

      await request(app).put('/articles/test').send({ article: {} });

      expect(auth.required).toHaveBeenCalled();
    });

    it('should verify auth.required works correctly for DELETE /articles/:slug', async () => {
      mockArticleService.deleteArticle.mockResolvedValue(undefined);

      await request(app).delete('/articles/test');

      expect(auth.required).toHaveBeenCalled();
    });

    it('should verify auth.required works correctly for POST /articles/:slug/favorite', async () => {
      const mockArticle = { slug: 'test', readingTime: 5, favorited: true };
      mockArticleService.favoriteArticle.mockResolvedValue(mockArticle);

      await request(app).post('/articles/test/favorite');

      expect(auth.required).toHaveBeenCalled();
    });

    it('should verify auth.required works correctly for DELETE /articles/:slug/favorite', async () => {
      const mockArticle = { slug: 'test', readingTime: 5, favorited: false };
      mockArticleService.unfavoriteArticle.mockResolvedValue(mockArticle);

      await request(app).delete('/articles/test/favorite');

      expect(auth.required).toHaveBeenCalled();
    });
  });
});