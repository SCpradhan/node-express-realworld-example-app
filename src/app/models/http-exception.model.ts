import { HttpException } from './http-exception.model';

describe('HttpException', () => {
  describe('constructor', () => {
    it('should create an HttpException with status and message', () => {
      const status = 400;
      const message = 'Bad Request';
      
      const exception = new HttpException(status, message);
      
      expect(exception).toBeInstanceOf(HttpException);
      expect(exception).toBeInstanceOf(Error);
      expect(exception.status).toBe(status);
      expect(exception.message).toBe(message);
      expect(exception.errors).toBeUndefined();
    });

    it('should create an HttpException with status, message, and errors', () => {
      const status = 422;
      const message = 'Validation Error';
      const errors = { body: ['body is required'] };
      
      const exception = new HttpException(status, message, errors);
      
      expect(exception).toBeInstanceOf(HttpException);
      expect(exception).toBeInstanceOf(Error);
      expect(exception.status).toBe(status);
      expect(exception.message).toBe(message);
      expect(exception.errors).toEqual(errors);
    });

    it('should handle validation errors for readingTime calculation scenarios', () => {
      const status = 422;
      const message = 'Invalid article body content';
      const errors = { body: ['body content is invalid for readingTime calculation'] };
      
      const exception = new HttpException(status, message, errors);
      
      expect(exception.status).toBe(422);
      expect(exception.message).toBe('Invalid article body content');
      expect(exception.errors).toEqual(errors);
    });

    it('should handle 404 errors for article not found scenarios', () => {
      const status = 404;
      const message = 'Article not found';
      
      const exception = new HttpException(status, message);
      
      expect(exception.status).toBe(404);
      expect(exception.message).toBe('Article not found');
    });

    it('should handle 401 unauthorized errors', () => {
      const status = 401;
      const message = 'Unauthorized';
      
      const exception = new HttpException(status, message);
      
      expect(exception.status).toBe(401);
      expect(exception.message).toBe('Unauthorized');
    });

    it('should handle 403 forbidden errors', () => {
      const status = 403;
      const message = 'Forbidden';
      
      const exception = new HttpException(status, message);
      
      expect(exception.status).toBe(403);
      expect(exception.message).toBe('Forbidden');
    });

    it('should handle 500 internal server errors', () => {
      const status = 500;
      const message = 'Internal Server Error';
      const errors = { details: 'Database connection failed' };
      
      const exception = new HttpException(status, message, errors);
      
      expect(exception.status).toBe(500);
      expect(exception.message).toBe('Internal Server Error');
      expect(exception.errors).toEqual(errors);
    });

    it('should maintain proper prototype chain', () => {
      const exception = new HttpException(400, 'Bad Request');
      
      expect(Object.getPrototypeOf(exception)).toBe(HttpException.prototype);
    });

    it('should be throwable and catchable', () => {
      const status = 400;
      const message = 'Bad Request';
      
      expect(() => {
        throw new HttpException(status, message);
      }).toThrow(HttpException);
      
      try {
        throw new HttpException(status, message);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect((error as HttpException).status).toBe(status);
        expect((error as HttpException).message).toBe(message);
      }
    });

    it('should handle multiple validation errors for readingTime feature', () => {
      const status = 422;
      const message = 'Validation failed';
      const errors = {
        body: ['body is required', 'body must be a string'],
        title: ['title is required']
      };
      
      const exception = new HttpException(status, message, errors);
      
      expect(exception.status).toBe(422);
      expect(exception.errors).toEqual(errors);
      expect(exception.errors.body).toHaveLength(2);
      expect(exception.errors.title).toHaveLength(1);
    });

    it('should handle empty errors object', () => {
      const status = 422;
      const message = 'Validation Error';
      const errors = {};
      
      const exception = new HttpException(status, message, errors);
      
      expect(exception.errors).toEqual({});
    });

    it('should handle null errors', () => {
      const status = 400;
      const message = 'Bad Request';
      const errors = null;
      
      const exception = new HttpException(status, message, errors);
      
      expect(exception.errors).toBeNull();
    });

    it('should preserve error stack trace', () => {
      const exception = new HttpException(500, 'Internal Server Error');
      
      expect(exception.stack).toBeDefined();
      expect(exception.stack).toContain('HttpException');
    });
  });

  describe('error handling compatibility with service layers', () => {
    it('should support article service error scenarios', () => {
      const articleNotFound = new HttpException(404, 'Article not found');
      const invalidArticleData = new HttpException(422, 'Invalid article data', {
        body: ['body is required for readingTime calculation']
      });
      
      expect(articleNotFound.status).toBe(404);
      expect(invalidArticleData.status).toBe(422);
      expect(invalidArticleData.errors).toBeDefined();
    });

    it('should support auth service error scenarios', () => {
      const unauthorized = new HttpException(401, 'Unauthorized');
      const invalidCredentials = new HttpException(422, 'Invalid credentials', {
        email: ['email or password is invalid']
      });
      
      expect(unauthorized.status).toBe(401);
      expect(invalidCredentials.status).toBe(422);
    });

    it('should support profile service error scenarios', () => {
      const profileNotFound = new HttpException(404, 'Profile not found');
      const forbidden = new HttpException(403, 'Forbidden');
      
      expect(profileNotFound.status).toBe(404);
      expect(forbidden.status).toBe(403);
    });
  });
});