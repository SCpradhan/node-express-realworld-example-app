import { Request, Response, NextFunction } from 'express';
import * as articleService from './article.service';
import router from './article.controller';

// Mock dependencies
jest.mock('./article.service');
jest.mock('../auth/auth', () => ({
  optional: jest.fn((req, res, next) => next()),
  required: jest.fn((req, res, next) => next()),
}));

describe('Article Controller - GET / route', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    
    mockRequest = {
      query: {},
      auth: undefined,
    };
    
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    
    mockNext = jest.fn();
    
    jest.clearAllMocks();
  });

  describe('Query Parameter Validation - Limit', () => {
    it('should use default limit of 20 when limit parameter is not provided', async () => {
      mockRequest.query = {};
      
      const mockResult = { articles: [], articlesCount: 0 };
      (articleService.findArticles as jest.Mock).mockResolvedValue(mockResult);

      const handler = (router as any).stack.find((layer: any) => 
        layer.route?.path === '/' && layer.route?.methods?.get
      ).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.findArticles).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 20 })
      );
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should parse limit parameter as integer when provided', async () => {
      mockRequest.query = { limit: '50' };
      
      const mockResult = { articles: [], articlesCount: 0 };
      (articleService.findArticles as jest.Mock).mockResolvedValue(mockResult);

      const handler = (router as any).stack.find((layer: any) => 
        layer.route?.path === '/' && layer.route?.methods?.get
      ).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.findArticles).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 50 })
      );
    });

    it('should return 422 error when limit exceeds 100', async () => {
      mockRequest.query = { limit: '150' };

      const handler = (router as any).stack.find((layer: any) => 
        layer.route?.path === '/' && layer.route?.methods?.get
      ).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(422);
      expect(jsonMock).toHaveBeenCalledWith({
        errors: { body: ['Limit cannot exceed 100'] }
      });
      expect(articleService.findArticles).not.toHaveBeenCalled();
    });

    it('should accept limit of exactly 100', async () => {
      mockRequest.query = { limit: '100' };
      
      const mockResult = { articles: [], articlesCount: 0 };
      (articleService.findArticles as jest.Mock).mockResolvedValue(mockResult);

      const handler = (router as any).stack.find((layer: any) => 
        layer.route?.path === '/' && layer.route?.methods?.get
      ).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.findArticles).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 100 })
      );
      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe('Query Parameter Validation - Offset', () => {
    it('should use default offset of 0 when offset parameter is not provided', async () => {
      mockRequest.query = {};
      
      const mockResult = { articles: [], articlesCount: 0 };
      (articleService.findArticles as jest.Mock).mockResolvedValue(mockResult);

      const handler = (router as any).stack.find((layer: any) => 
        layer.route?.path === '/' && layer.route?.methods?.get
      ).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.findArticles).toHaveBeenCalledWith(
        expect.objectContaining({ offset: 0 })
      );
    });

    it('should parse offset parameter as integer when provided', async () => {
      mockRequest.query = { offset: '10' };
      
      const mockResult = { articles: [], articlesCount: 0 };
      (articleService.findArticles as jest.Mock).mockResolvedValue(mockResult);

      const handler = (router as any).stack.find((layer: any) => 
        layer.route?.path === '/' && layer.route?.methods?.get
      ).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.findArticles).toHaveBeenCalledWith(
        expect.objectContaining({ offset: 10 })
      );
    });

    it('should return 422 error when offset is negative', async () => {
      mockRequest.query = { offset: '-5' };

      const handler = (router as any).stack.find((layer: any) => 
        layer.route?.path === '/' && layer.route?.methods?.get
      ).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(422);
      expect(jsonMock).toHaveBeenCalledWith({
        errors: { body: ['Offset must be non-negative'] }
      });
      expect(articleService.findArticles).not.toHaveBeenCalled();
    });

    it('should accept offset of 0', async () => {
      mockRequest.query = { offset: '0' };
      
      const mockResult = { articles: [], articlesCount: 0 };
      (articleService.findArticles as jest.Mock).mockResolvedValue(mockResult);

      const handler = (router as any).stack.find((layer: any) => 
        layer.route?.path === '/' && layer.route?.methods?.get
      ).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.findArticles).toHaveBeenCalledWith(
        expect.objectContaining({ offset: 0 })
      );
      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe('Query Parameter Validation - Optional String Filters', () => {
    it('should pass tag filter as string when provided', async () => {
      mockRequest.query = { tag: 'javascript' };
      
      const mockResult = { articles: [], articlesCount: 0 };
      (articleService.findArticles as jest.Mock).mockResolvedValue(mockResult);

      const handler = (router as any).stack.find((layer: any) => 
        layer.route?.path === '/' && layer.route?.methods?.get
      ).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.findArticles).toHaveBeenCalledWith(
        expect.objectContaining({ tag: 'javascript' })
      );
    });

    it('should pass author filter as string when provided', async () => {
      mockRequest.query = { author: 'johndoe' };
      
      const mockResult = { articles: [], articlesCount: 0 };
      (articleService.findArticles as jest.Mock).mockResolvedValue(mockResult);

      const handler = (router as any).stack.find((layer: any) => 
        layer.route?.path === '/' && layer.route?.methods?.get
      ).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.findArticles).toHaveBeenCalledWith(
        expect.objectContaining({ author: 'johndoe' })
      );
    });

    it('should pass favorited filter as string when provided', async () => {
      mockRequest.query = { favorited: 'janedoe' };
      
      const mockResult = { articles: [], articlesCount: 0 };
      (articleService.findArticles as jest.Mock).mockResolvedValue(mockResult);

      const handler = (router as any).stack.find((layer: any) => 
        layer.route?.path === '/' && layer.route?.methods?.get
      ).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.findArticles).toHaveBeenCalledWith(
        expect.objectContaining({ favorited: 'janedoe' })
      );
    });

    it('should pass undefined for optional filters when not provided', async () => {
      mockRequest.query = {};
      
      const mockResult = { articles: [], articlesCount: 0 };
      (articleService.findArticles as jest.Mock).mockResolvedValue(mockResult);

      const handler = (router as any).stack.find((layer: any) => 
        layer.route?.path === '/' && layer.route?.methods?.get
      ).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.findArticles).toHaveBeenCalledWith(
        expect.objectContaining({
          tag: undefined,
          author: undefined,
          favorited: undefined
        })
      );
    });

    it('should handle all filters together', async () => {
      mockRequest.query = {
        limit: '30',
        offset: '5',
        tag: 'nodejs',
        author: 'alice',
        favorited: 'bob'
      };
      
      const mockResult = { articles: [], articlesCount: 0 };
      (articleService.findArticles as jest.Mock).mockResolvedValue(mockResult);

      const handler = (router as any).stack.find((layer: any) => 
        layer.route?.path === '/' && layer.route?.methods?.get
      ).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.findArticles).toHaveBeenCalledWith({
        limit: 30,
        offset: 5,
        tag: 'nodejs',
        author: 'alice',
        favorited: 'bob',
        currentUserId: undefined
      });
    });
  });

  describe('Authentication - Optional Auth', () => {
    it('should pass undefined currentUserId for anonymous requests', async () => {
      mockRequest.query = {};
      mockRequest.auth = undefined;
      
      const mockResult = { articles: [], articlesCount: 0 };
      (articleService.findArticles as jest.Mock).mockResolvedValue(mockResult);

      const handler = (router as any).stack.find((layer: any) => 
        layer.route?.path === '/' && layer.route?.methods?.get
      ).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.findArticles).toHaveBeenCalledWith(
        expect.objectContaining({ currentUserId: undefined })
      );
    });

    it('should extract currentUserId from authenticated request', async () => {
      mockRequest.query = {};
      mockRequest.auth = { user: { id: 123 } } as any;
      
      const mockResult = { articles: [], articlesCount: 0 };
      (articleService.findArticles as jest.Mock).mockResolvedValue(mockResult);

      const handler = (router as any).stack.find((layer: any) => 
        layer.route?.path === '/' && layer.route?.methods?.get
      ).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.findArticles).toHaveBeenCalledWith(
        expect.objectContaining({ currentUserId: 123 })
      );
    });

    it('should handle authenticated user with favorited filter', async () => {
      mockRequest.query = { favorited: 'someuser' };
      mockRequest.auth = { user: { id: 456 } } as any;
      
      const mockResult = { 
        articles: [{ id: 1, favorited: true, following: true }], 
        articlesCount: 1 
      };
      (articleService.findArticles as jest.Mock).mockResolvedValue(mockResult);

      const handler = (router as any).stack.find((layer: any) => 
        layer.route?.path === '/' && layer.route?.methods?.get
      ).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.findArticles).toHaveBeenCalledWith({
        limit: 20,
        offset: 0,
        tag: undefined,
        author: undefined,
        favorited: 'someuser',
        currentUserId: 456
      });
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        articles: [{ id: 1, favorited: true, following: true }],
        articlesCount: 1
      });
    });
  });

  describe('Success Response', () => {
    it('should return 200 with articles and articlesCount on success', async () => {
      mockRequest.query = {};
      
      const mockResult = {
        articles: [
          { id: 1, title: 'Article 1' },
          { id: 2, title: 'Article 2' }
        ],
        articlesCount: 2
      };
      (articleService.findArticles as jest.Mock).mockResolvedValue(mockResult);

      const handler = (router as any).stack.find((layer: any) => 
        layer.route?.path === '/' && layer.route?.methods?.get
      ).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        articles: mockResult.articles,
        articlesCount: mockResult.articlesCount
      });
    });

    it('should return empty array when no articles found', async () => {
      mockRequest.query = { tag: 'nonexistent' };
      
      const mockResult = { articles: [], articlesCount: 0 };
      (articleService.findArticles as jest.Mock).mockResolvedValue(mockResult);

      const handler = (router as any).stack.find((layer: any) => 
        layer.route?.path === '/' && layer.route?.methods?.get
      ).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        articles: [],
        articlesCount: 0
      });
    });
  });

  describe('Error Handling', () => {
    it('should return 422 for validation errors from service', async () => {
      mockRequest.query = {};
      
      const validationError = new Error('validation: Invalid tag format');
      (articleService.findArticles as jest.Mock).mockRejectedValue(validationError);

      const handler = (router as any).stack.find((layer: any) => 
        layer.route?.path === '/' && layer.route?.methods?.get
      ).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(422);
      expect(jsonMock).toHaveBeenCalledWith({
        errors: { body: ['validation: Invalid tag format'] }
      });
    });

    it('should return 500 for internal server errors', async () => {
      mockRequest.query = {};
      
      const serverError = new Error('Database connection failed');
      (articleService.findArticles as jest.Mock).mockRejectedValue(serverError);

      const handler = (router as any).stack.find((layer: any) => 
        layer.route?.path === '/' && layer.route?.methods?.get
      ).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        errors: { body: ['Internal server error'] }
      });
    });

    it('should return 500 for non-Error exceptions', async () => {
      mockRequest.query = {};
      
      (articleService.findArticles as jest.Mock).mockRejectedValue('String error');

      const handler = (router as any).stack.find((layer: any) => 
        layer.route?.path === '/' && layer.route?.methods?.get
      ).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        errors: { body: ['Internal server error'] }
      });
    });

    it('should handle service timeout errors as 500', async () => {
      mockRequest.query = {};
      
      const timeoutError = new Error('Request timeout');
      (articleService.findArticles as jest.Mock).mockRejectedValue(timeoutError);

      const handler = (router as any).stack.find((layer: any) => 
        layer.route?.path === '/' && layer.route?.methods?.get
      ).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        errors: { body: ['Internal server error'] }
      });
    });
  });

  describe('Combined Validation Scenarios', () => {
    it('should return 422 when both limit exceeds 100 and offset is negative (limit checked first)', async () => {
      mockRequest.query = { limit: '150', offset: '-10' };

      const handler = (router as any).stack.find((layer: any) => 
        layer.route?.path === '/' && layer.route?.methods?.get
      ).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(422);
      expect(jsonMock).toHaveBeenCalledWith({
        errors: { body: ['Limit cannot exceed 100'] }
      });
    });

    it('should validate offset after limit passes validation', async () => {
      mockRequest.query = { limit: '50', offset: '-5' };

      const handler = (router as any).stack.find((layer: any) => 
        layer.route?.path === '/' && layer.route?.methods?.get
      ).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(422);
      expect(jsonMock).toHaveBeenCalledWith({
        errors: { body: ['Offset must be non-negative'] }
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle non-numeric limit parameter', async () => {
      mockRequest.query = { limit: 'abc' };
      
      const mockResult = { articles: [], articlesCount: 0 };
      (articleService.findArticles as jest.Mock).mockResolvedValue(mockResult);

      const handler = (router as any).stack.find((layer: any) => 
        layer.route?.path === '/' && layer.route?.methods?.get
      ).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.findArticles).toHaveBeenCalledWith(
        expect.objectContaining({ limit: NaN })
      );
    });

    it('should handle non-numeric offset parameter', async () => {
      mockRequest.query = { offset: 'xyz' };
      
      const mockResult = { articles: [], articlesCount: 0 };
      (articleService.findArticles as jest.Mock).mockResolvedValue(mockResult);

      const handler = (router as any).stack.find((layer: any) => 
        layer.route?.path === '/' && layer.route?.methods?.get
      ).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.findArticles).toHaveBeenCalledWith(
        expect.objectContaining({ offset: NaN })
      );
    });

    it('should handle decimal limit values by parsing as integer', async () => {
      mockRequest.query = { limit: '25.7' };
      
      const mockResult = { articles: [], articlesCount: 0 };
      (articleService.findArticles as jest.Mock).mockResolvedValue(mockResult);

      const handler = (router as any).stack.find((layer: any) => 
        layer.route?.path === '/' && layer.route?.methods?.get
      ).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.findArticles).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 25 })
      );
    });

    it('should handle empty string query parameters', async () => {
      mockRequest.query = { tag: '', author: '', favorited: '' };
      
      const mockResult = { articles: [], articlesCount: 0 };
      (articleService.findArticles as jest.Mock).mockResolvedValue(mockResult);

      const handler = (router as any).stack.find((layer: any) => 
        layer.route?.path === '/' && layer.route?.methods?.get
      ).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.findArticles).toHaveBeenCalledWith(
        expect.objectContaining({
          tag: '',
          author: '',
          favorited: ''
        })
      );
    });
  });

  describe('Service Integration', () => {
    it('should invoke findArticles with all parameters correctly formatted', async () => {
      mockRequest.query = {
        limit: '75',
        offset: '15',
        tag: 'typescript',
        author: 'developer',
        favorited: 'user123'
      };
      mockRequest.auth = { user: { id: 999 } } as any;
      
      const mockResult = { articles: [], articlesCount: 0 };
      (articleService.findArticles as jest.Mock).mockResolvedValue(mockResult);

      const handler = (router as any).stack.find((layer: any) => 
        layer.route?.path === '/' && layer.route?.methods?.get
      ).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.findArticles).toHaveBeenCalledTimes(1);
      expect(articleService.findArticles).toHaveBeenCalledWith({
        limit: 75,
        offset: 15,
        tag: 'typescript',
        author: 'developer',
        favorited: 'user123',
        currentUserId: 999
      });
    });

    it('should not call findArticles when validation fails', async () => {
      mockRequest.query = { limit: '200' };

      const handler = (router as any).stack.find((layer: any) => 
        layer.route?.path === '/' && layer.route?.methods?.get
      ).route.stack[0].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(articleService.findArticles).not.toHaveBeenCalled();
    });
  });
});