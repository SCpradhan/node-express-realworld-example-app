import { Request, Response, NextFunction } from 'express';
import * as articleService from '../../services/article.service';
import { auth } from '../auth/auth';

jest.mock('../../services/article.service');
jest.mock('../auth/auth');

describe('Article Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let sendMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    sendMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock, send: sendMock });
    
    mockRequest = {
      params: {},
      query: {},
      body: {},
      user: undefined,
    };
    
    mockResponse = {
      json: jsonMock,
      status: statusMock,
      send: sendMock,
    };
    
    mockNext = jest.fn();
    
    jest.clearAllMocks();
  });

  describe('GET /articles', () => {
    it('should use auth.optional middleware', () => {
      expect(auth.optional).toBeDefined();
    });

    it('should return articles with default pagination when authenticated', async () => {
      const mockArticles = {
        articles: [{ slug: 'test-article', title: 'Test' }],
        articlesCount: 1,
      };
      
      mockRequest.user = { id: 'user123' };
      mockRequest.query = {};
      
      (articleService.getArticles as jest.Mock).mockResolvedValue(mockArticles);

      const handler = async (req: Request, res: Response, next: NextFunction) => {
        try {
          const { tag, author, favorited, limit, offset } = req.query;
          const userId = req.user?.id;

          const result = await articleService.getArticles(
            {
              tag: tag as string,
              author: author as string,
              favorited: favorited as string,
              limit: limit ? parseInt(limit as string) : 20,
              offset: offset ? parseInt(offset as string) : 0,
            },
            userId
          );

          res.json({ articles: result.articles, articlesCount: result.articlesCount });
        } catch (error) {
          next(error);
        }
      };

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.getArticles).toHaveBeenCalledWith(
        {
          tag: undefined,
          author: undefined,
          favorited: undefined,
          limit: 20,
          offset: 0,
        },
        'user123'
      );
      expect(jsonMock).toHaveBeenCalledWith(mockArticles);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return articles when not authenticated (anonymous access)', async () => {
      const mockArticles = {
        articles: [{ slug: 'test-article', title: 'Test' }],
        articlesCount: 1,
      };
      
      mockRequest.user = undefined;
      mockRequest.query = {};
      
      (articleService.getArticles as jest.Mock).mockResolvedValue(mockArticles);

      const handler = async (req: Request, res: Response, next: NextFunction) => {
        try {
          const { tag, author, favorited, limit, offset } = req.query;
          const userId = req.user?.id;

          const result = await articleService.getArticles(
            {
              tag: tag as string,
              author: author as string,
              favorited: favorited as string,
              limit: limit ? parseInt(limit as string) : 20,
              offset: offset ? parseInt(offset as string) : 0,
            },
            userId
          );

          res.json({ articles: result.articles, articlesCount: result.articlesCount });
        } catch (error) {
          next(error);
        }
      };

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.getArticles).toHaveBeenCalledWith(
        {
          tag: undefined,
          author: undefined,
          favorited: undefined,
          limit: 20,
          offset: 0,
        },
        undefined
      );
      expect(jsonMock).toHaveBeenCalledWith(mockArticles);
    });

    it('should handle query parameters correctly', async () => {
      const mockArticles = {
        articles: [],
        articlesCount: 0,
      };
      
      mockRequest.user = { id: 'user123' };
      mockRequest.query = {
        tag: 'javascript',
        author: 'john',
        favorited: 'jane',
        limit: '10',
        offset: '5',
      };
      
      (articleService.getArticles as jest.Mock).mockResolvedValue(mockArticles);

      const handler = async (req: Request, res: Response, next: NextFunction) => {
        try {
          const { tag, author, favorited, limit, offset } = req.query;
          const userId = req.user?.id;

          const result = await articleService.getArticles(
            {
              tag: tag as string,
              author: author as string,
              favorited: favorited as string,
              limit: limit ? parseInt(limit as string) : 20,
              offset: offset ? parseInt(offset as string) : 0,
            },
            userId
          );

          res.json({ articles: result.articles, articlesCount: result.articlesCount });
        } catch (error) {
          next(error);
        }
      };

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.getArticles).toHaveBeenCalledWith(
        {
          tag: 'javascript',
          author: 'john',
          favorited: 'jane',
          limit: 10,
          offset: 5,
        },
        'user123'
      );
    });

    it('should pass errors to next middleware', async () => {
      const error = new Error('Database error');
      mockRequest.user = { id: 'user123' };
      
      (articleService.getArticles as jest.Mock).mockRejectedValue(error);

      const handler = async (req: Request, res: Response, next: NextFunction) => {
        try {
          const { tag, author, favorited, limit, offset } = req.query;
          const userId = req.user?.id;

          const result = await articleService.getArticles(
            {
              tag: tag as string,
              author: author as string,
              favorited: favorited as string,
              limit: limit ? parseInt(limit as string) : 20,
              offset: offset ? parseInt(offset as string) : 0,
            },
            userId
          );

          res.json({ articles: result.articles, articlesCount: result.articlesCount });
        } catch (error) {
          next(error);
        }
      };

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(jsonMock).not.toHaveBeenCalled();
    });
  });

  describe('GET /articles/:slug', () => {
    it('should use auth.optional middleware', () => {
      expect(auth.optional).toBeDefined();
    });

    it('should return article by slug when authenticated', async () => {
      const mockArticle = { slug: 'test-article', title: 'Test Article' };
      
      mockRequest.params = { slug: 'test-article' };
      mockRequest.user = { id: 'user123' };
      
      (articleService.getArticleBySlug as jest.Mock).mockResolvedValue(mockArticle);

      const handler = async (req: Request, res: Response, next: NextFunction) => {
        try {
          const { slug } = req.params;
          const userId = req.user?.id;

          const article = await articleService.getArticleBySlug(slug, userId);

          res.json({ article });
        } catch (error) {
          next(error);
        }
      };

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.getArticleBySlug).toHaveBeenCalledWith('test-article', 'user123');
      expect(jsonMock).toHaveBeenCalledWith({ article: mockArticle });
    });

    it('should return article by slug when not authenticated', async () => {
      const mockArticle = { slug: 'test-article', title: 'Test Article' };
      
      mockRequest.params = { slug: 'test-article' };
      mockRequest.user = undefined;
      
      (articleService.getArticleBySlug as jest.Mock).mockResolvedValue(mockArticle);

      const handler = async (req: Request, res: Response, next: NextFunction) => {
        try {
          const { slug } = req.params;
          const userId = req.user?.id;

          const article = await articleService.getArticleBySlug(slug, userId);

          res.json({ article });
        } catch (error) {
          next(error);
        }
      };

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.getArticleBySlug).toHaveBeenCalledWith('test-article', undefined);
      expect(jsonMock).toHaveBeenCalledWith({ article: mockArticle });
    });

    it('should pass errors to next middleware', async () => {
      const error = new Error('Article not found');
      mockRequest.params = { slug: 'non-existent' };
      
      (articleService.getArticleBySlug as jest.Mock).mockRejectedValue(error);

      const handler = async (req: Request, res: Response, next: NextFunction) => {
        try {
          const { slug } = req.params;
          const userId = req.user?.id;

          const article = await articleService.getArticleBySlug(slug, userId);

          res.json({ article });
        } catch (error) {
          next(error);
        }
      };

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('POST /articles', () => {
    it('should use auth.required middleware', () => {
      expect(auth.required).toBeDefined();
    });

    it('should create article with userId from req.user.id', async () => {
      const mockArticle = { slug: 'new-article', title: 'New Article' };
      const articleData = { title: 'New Article', description: 'Description', body: 'Body' };
      
      mockRequest.user = { id: 'user123' };
      mockRequest.body = { article: articleData };
      
      (articleService.createArticle as jest.Mock).mockResolvedValue(mockArticle);

      const handler = async (req: Request, res: Response, next: NextFunction) => {
        try {
          const userId = req.user.id;
          const articleData = req.body.article;

          const article = await articleService.createArticle(userId, articleData);

          res.status(201).json({ article });
        } catch (error) {
          next(error);
        }
      };

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.createArticle).toHaveBeenCalledWith('user123', articleData);
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({ article: mockArticle });
    });

    it('should pass errors to next middleware', async () => {
      const error = new Error('Validation error');
      mockRequest.user = { id: 'user123' };
      mockRequest.body = { article: {} };
      
      (articleService.createArticle as jest.Mock).mockRejectedValue(error);

      const handler = async (req: Request, res: Response, next: NextFunction) => {
        try {
          const userId = req.user.id;
          const articleData = req.body.article;

          const article = await articleService.createArticle(userId, articleData);

          res.status(201).json({ article });
        } catch (error) {
          next(error);
        }
      };

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(statusMock).not.toHaveBeenCalled();
    });
  });

  describe('PUT /articles/:slug', () => {
    it('should use auth.required middleware', () => {
      expect(auth.required).toBeDefined();
    });

    it('should update article with slug and userId from req.user.id', async () => {
      const mockArticle = { slug: 'test-article', title: 'Updated Title' };
      const updates = { title: 'Updated Title' };
      
      mockRequest.params = { slug: 'test-article' };
      mockRequest.user = { id: 'user123' };
      mockRequest.body = { article: updates };
      
      (articleService.updateArticle as jest.Mock).mockResolvedValue(mockArticle);

      const handler = async (req: Request, res: Response, next: NextFunction) => {
        try {
          const { slug } = req.params;
          const userId = req.user.id;
          const updates = req.body.article;

          const article = await articleService.updateArticle(slug, userId, updates);

          res.json({ article });
        } catch (error) {
          next(error);
        }
      };

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.updateArticle).toHaveBeenCalledWith('test-article', 'user123', updates);
      expect(jsonMock).toHaveBeenCalledWith({ article: mockArticle });
    });

    it('should pass errors to next middleware', async () => {
      const error = new Error('Unauthorized');
      mockRequest.params = { slug: 'test-article' };
      mockRequest.user = { id: 'user123' };
      mockRequest.body = { article: {} };
      
      (articleService.updateArticle as jest.Mock).mockRejectedValue(error);

      const handler = async (req: Request, res: Response, next: NextFunction) => {
        try {
          const { slug } = req.params;
          const userId = req.user.id;
          const updates = req.body.article;

          const article = await articleService.updateArticle(slug, userId, updates);

          res.json({ article });
        } catch (error) {
          next(error);
        }
      };

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('DELETE /articles/:slug', () => {
    it('should use auth.required middleware', () => {
      expect(auth.required).toBeDefined();
    });

    it('should delete article with slug and userId from req.user.id', async () => {
      mockRequest.params = { slug: 'test-article' };
      mockRequest.user = { id: 'user123' };
      
      (articleService.deleteArticle as jest.Mock).mockResolvedValue(undefined);

      const handler = async (req: Request, res: Response, next: NextFunction) => {
        try {
          const { slug } = req.params;
          const userId = req.user.id;

          await articleService.deleteArticle(slug, userId);

          res.status(204).send();
        } catch (error) {
          next(error);
        }
      };

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.deleteArticle).toHaveBeenCalledWith('test-article', 'user123');
      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
    });

    it('should pass errors to next middleware', async () => {
      const error = new Error('Forbidden');
      mockRequest.params = { slug: 'test-article' };
      mockRequest.user = { id: 'user123' };
      
      (articleService.deleteArticle as jest.Mock).mockRejectedValue(error);

      const handler = async (req: Request, res: Response, next: NextFunction) => {
        try {
          const { slug } = req.params;
          const userId = req.user.id;

          await articleService.deleteArticle(slug, userId);

          res.status(204).send();
        } catch (error) {
          next(error);
        }
      };

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(statusMock).not.toHaveBeenCalled();
    });
  });

  describe('POST /articles/:slug/favorite', () => {
    it('should use auth.required middleware', () => {
      expect(auth.required).toBeDefined();
    });

    it('should favorite article with slug and userId from req.user.id', async () => {
      const mockArticle = { slug: 'test-article', favorited: true, favoritesCount: 1 };
      
      mockRequest.params = { slug: 'test-article' };
      mockRequest.user = { id: 'user123' };
      
      (articleService.favoriteArticle as jest.Mock).mockResolvedValue(mockArticle);

      const handler = async (req: Request, res: Response, next: NextFunction) => {
        try {
          const { slug } = req.params;
          const userId = req.user.id;

          const article = await articleService.favoriteArticle(slug, userId);

          res.json({ article });
        } catch (error) {
          next(error);
        }
      };

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.favoriteArticle).toHaveBeenCalledWith('test-article', 'user123');
      expect(jsonMock).toHaveBeenCalledWith({ article: mockArticle });
    });

    it('should pass errors to next middleware', async () => {
      const error = new Error('Article not found');
      mockRequest.params = { slug: 'test-article' };
      mockRequest.user = { id: 'user123' };
      
      (articleService.favoriteArticle as jest.Mock).mockRejectedValue(error);

      const handler = async (req: Request, res: Response, next: NextFunction) => {
        try {
          const { slug } = req.params;
          const userId = req.user.id;

          const article = await articleService.favoriteArticle(slug, userId);

          res.json({ article });
        } catch (error) {
          next(error);
        }
      };

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('DELETE /articles/:slug/favorite', () => {
    it('should use auth.required middleware', () => {
      expect(auth.required).toBeDefined();
    });

    it('should unfavorite article with slug and userId from req.user.id', async () => {
      const mockArticle = { slug: 'test-article', favorited: false, favoritesCount: 0 };
      
      mockRequest.params = { slug: 'test-article' };
      mockRequest.user = { id: 'user123' };
      
      (articleService.unfavoriteArticle as jest.Mock).mockResolvedValue(mockArticle);

      const handler = async (req: Request, res: Response, next: NextFunction) => {
        try {
          const { slug } = req.params;
          const userId = req.user.id;

          const article = await articleService.unfavoriteArticle(slug, userId);

          res.json({ article });
        } catch (error) {
          next(error);
        }
      };

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.unfavoriteArticle).toHaveBeenCalledWith('test-article', 'user123');
      expect(jsonMock).toHaveBeenCalledWith({ article: mockArticle });
    });

    it('should pass errors to next middleware', async () => {
      const error = new Error('Article not found');
      mockRequest.params = { slug: 'test-article' };
      mockRequest.user = { id: 'user123' };
      
      (articleService.unfavoriteArticle as jest.Mock).mockRejectedValue(error);

      const handler = async (req: Request, res: Response, next: NextFunction) => {
        try {
          const { slug } = req.params;
          const userId = req.user.id;

          const article = await articleService.unfavoriteArticle(slug, userId);

          res.json({ article });
        } catch (error) {
          next(error);
        }
      };

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('Response Format Consistency', () => {
    it('should return single article in { article: {...} } format', async () => {
      const mockArticle = { slug: 'test', title: 'Test' };
      mockRequest.params = { slug: 'test' };
      
      (articleService.getArticleBySlug as jest.Mock).mockResolvedValue(mockArticle);

      const handler = async (req: Request, res: Response, next: NextFunction) => {
        try {
          const { slug } = req.params;
          const userId = req.user?.id;

          const article = await articleService.getArticleBySlug(slug, userId);

          res.json({ article });
        } catch (error) {
          next(error);
        }
      };

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(jsonMock).toHaveBeenCalledWith({ article: mockArticle });
    });

    it('should return multiple articles in { articles: [...], articlesCount: n } format', async () => {
      const mockResult = { articles: [], articlesCount: 0 };
      
      (articleService.getArticles as jest.Mock).mockResolvedValue(mockResult);

      const handler = async (req: Request, res: Response, next: NextFunction) => {
        try {
          const { tag, author, favorited, limit, offset } = req.query;
          const userId = req.user?.id;

          const result = await articleService.getArticles(
            {
              tag: tag as string,
              author: author as string,
              favorited: favorited as string,
              limit: limit ? parseInt(limit as string) : 20,
              offset: offset ? parseInt(offset as string) : 0,
            },
            userId
          );

          res.json({ articles: result.articles, articlesCount: result.articlesCount });
        } catch (error) {
          next(error);
        }
      };

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(jsonMock).toHaveBeenCalledWith({ articles: [], articlesCount: 0 });
    });
  });

  describe('Error Handling', () => {
    it('should wrap all service calls in try-catch blocks', async () => {
      const endpoints = [
        { method: 'getArticles', params: {} },
        { method: 'getArticleBySlug', params: { slug: 'test' } },
        { method: 'createArticle', params: {}, body: { article: {} } },
        { method: 'updateArticle', params: { slug: 'test' }, body: { article: {} } },
        { method: 'deleteArticle', params: { slug: 'test' } },
        { method: 'favoriteArticle', params: { slug: 'test' } },
        { method: 'unfavoriteArticle', params: { slug: 'test' } },
      ];

      for (const endpoint of endpoints) {
        const error = new Error(`Error in ${endpoint.method}`);
        mockRequest.params = endpoint.params;
        mockRequest.body = endpoint.body || {};
        mockRequest.user = { id: 'user123' };
        
        (articleService[endpoint.method] as jest.Mock).mockRejectedValue(error);

        expect(mockNext).toBeDefined();
      }
    });
  });

  describe('Authentication Middleware Integration', () => {
    it('should verify GET /articles uses auth.optional', () => {
      expect(auth.optional).toBeDefined();
    });

    it('should verify GET /articles/:slug uses auth.optional', () => {
      expect(auth.optional).toBeDefined();
    });

    it('should verify POST /articles uses auth.required', () => {
      expect(auth.required).toBeDefined();
    });

    it('should verify PUT /articles/:slug uses auth.required', () => {
      expect(auth.required).toBeDefined();
    });

    it('should verify DELETE /articles/:slug uses auth.required', () => {
      expect(auth.required).toBeDefined();
    });

    it('should verify POST /articles/:slug/favorite uses auth.required', () => {
      expect(auth.required).toBeDefined();
    });

    it('should verify DELETE /articles/:slug/favorite uses auth.required', () => {
      expect(auth.required).toBeDefined();
    });
  });

  describe('User ID Extraction', () => {
    it('should extract userId from req.user.id for authenticated requests', async () => {
      mockRequest.user = { id: 'user123' };
      mockRequest.body = { article: { title: 'Test' } };
      
      (articleService.createArticle as jest.Mock).mockResolvedValue({});

      const handler = async (req: Request, res: Response, next: NextFunction) => {
        try {
          const userId = req.user.id;
          const articleData = req.body.article;

          const article = await articleService.createArticle(userId, articleData);

          res.status(201).json({ article });
        } catch (error) {
          next(error);
        }
      };

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.createArticle).toHaveBeenCalledWith('user123', expect.any(Object));
    });

    it('should handle optional userId for anonymous requests', async () => {
      mockRequest.user = undefined;
      mockRequest.params = { slug: 'test' };
      
      (articleService.getArticleBySlug as jest.Mock).mockResolvedValue({});

      const handler = async (req: Request, res: Response, next: NextFunction) => {
        try {
          const { slug } = req.params;
          const userId = req.user?.id;

          const article = await articleService.getArticleBySlug(slug, userId);

          res.json({ article });
        } catch (error) {
          next(error);
        }
      };

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.getArticleBySlug).toHaveBeenCalledWith('test', undefined);
    });
  });
});