import { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import express from 'express';
import tagController from './tag.controller';
import getTags from './tag.service';
import auth from '../auth/auth';

jest.mock('./tag.service');
jest.mock('../auth/auth');

describe('Tag Controller', () => {
  let app: express.Application;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', tagController);

    mockRequest = {
      auth: undefined,
    };

    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('GET /api/tags', () => {
    it('should return all unique tags when user is not authenticated', async () => {
      const mockTags = ['reactjs', 'nodejs', 'typescript', 'javascript'];
      (getTags as jest.Mock).mockResolvedValue(mockTags);
      (auth.optional as any) = jest.fn((req, res, next) => next());

      const response = await request(app).get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ tags: mockTags });
      expect(getTags).toHaveBeenCalledWith(undefined);
    });

    it('should return all unique tags when user is authenticated', async () => {
      const mockTags = ['reactjs', 'nodejs', 'typescript', 'javascript', 'express'];
      const mockUserId = 'user123';
      (getTags as jest.Mock).mockResolvedValue(mockTags);
      (auth.optional as any) = jest.fn((req, res, next) => {
        req.auth = { user: { id: mockUserId } };
        next();
      });

      const response = await request(app).get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ tags: mockTags });
      expect(getTags).toHaveBeenCalledWith(mockUserId);
    });

    it('should return empty array when no tags exist', async () => {
      (getTags as jest.Mock).mockResolvedValue([]);
      (auth.optional as any) = jest.fn((req, res, next) => next());

      const response = await request(app).get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ tags: [] });
      expect(getTags).toHaveBeenCalledWith(undefined);
    });

    it('should return tags that can be used for filtering articles', async () => {
      const mockTags = ['dragons', 'training', 'coding'];
      (getTags as jest.Mock).mockResolvedValue(mockTags);
      (auth.optional as any) = jest.fn((req, res, next) => next());

      const response = await request(app).get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body.tags).toBeInstanceOf(Array);
      expect(response.body.tags).toEqual(mockTags);
      expect(response.body.tags.every((tag: any) => typeof tag === 'string')).toBe(true);
    });

    it('should handle errors and pass them to next middleware', async () => {
      const mockError = new Error('Database connection failed');
      (getTags as jest.Mock).mockRejectedValue(mockError);
      (auth.optional as any) = jest.fn((req, res, next) => next());

      const errorHandler = jest.fn((err, req, res, next) => {
        res.status(500).json({ error: err.message });
      });

      app.use(errorHandler);

      const response = await request(app).get('/api/tags');

      expect(getTags).toHaveBeenCalled();
      expect(response.status).toBe(500);
    });

    it('should call getTags service with correct user id from auth context', async () => {
      const mockUserId = 'authenticated-user-456';
      const mockTags = ['test', 'mock'];
      (getTags as jest.Mock).mockResolvedValue(mockTags);
      (auth.optional as any) = jest.fn((req, res, next) => {
        req.auth = { user: { id: mockUserId } };
        next();
      });

      await request(app).get('/api/tags');

      expect(getTags).toHaveBeenCalledTimes(1);
      expect(getTags).toHaveBeenCalledWith(mockUserId);
    });

    it('should return consistent tag response format for article filtering', async () => {
      const mockTags = ['javascript', 'typescript', 'react'];
      (getTags as jest.Mock).mockResolvedValue(mockTags);
      (auth.optional as any) = jest.fn((req, res, next) => next());

      const response = await request(app).get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tags');
      expect(Array.isArray(response.body.tags)).toBe(true);
      expect(response.body.tags).toEqual(mockTags);
    });

    it('should validate that tags are unique across articles', async () => {
      const mockUniqueTags = ['unique1', 'unique2', 'unique3'];
      (getTags as jest.Mock).mockResolvedValue(mockUniqueTags);
      (auth.optional as any) = jest.fn((req, res, next) => next());

      const response = await request(app).get('/api/tags');

      const tags = response.body.tags;
      const uniqueSet = new Set(tags);
      expect(tags.length).toBe(uniqueSet.size);
    });

    it('should handle null or undefined user id gracefully', async () => {
      const mockTags = ['tag1', 'tag2'];
      (getTags as jest.Mock).mockResolvedValue(mockTags);
      (auth.optional as any) = jest.fn((req, res, next) => {
        req.auth = { user: { id: null } };
        next();
      });

      const response = await request(app).get('/api/tags');

      expect(response.status).toBe(200);
      expect(getTags).toHaveBeenCalledWith(null);
    });

    it('should pass error to next middleware when getTags throws exception', async () => {
      const mockError = new Error('Service unavailable');
      (getTags as jest.Mock).mockRejectedValue(mockError);
      (auth.optional as any) = jest.fn((req, res, next) => next());

      const errorHandler = jest.fn((err, req, res, next) => {
        expect(err).toBe(mockError);
        res.status(503).json({ error: 'Service unavailable' });
      });

      app.use(errorHandler);

      const response = await request(app).get('/api/tags');

      expect(errorHandler).toHaveBeenCalled();
      expect(response.status).toBe(503);
    });

    it('should verify auth.optional middleware is applied to the route', async () => {
      const mockTags = ['tag1'];
      (getTags as jest.Mock).mockResolvedValue(mockTags);
      const authOptionalSpy = jest.fn((req, res, next) => next());
      (auth.optional as any) = authOptionalSpy;

      await request(app).get('/api/tags');

      expect(authOptionalSpy).toHaveBeenCalled();
    });

    it('should return tags in format compatible with article list tag filtering', async () => {
      const mockTags = ['filter-tag-1', 'filter-tag-2', 'filter-tag-3'];
      (getTags as jest.Mock).mockResolvedValue(mockTags);
      (auth.optional as any) = jest.fn((req, res, next) => next());

      const response = await request(app).get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ tags: expect.any(Array) });
      response.body.tags.forEach((tag: any) => {
        expect(typeof tag).toBe('string');
        expect(tag.length).toBeGreaterThan(0);
      });
    });
  });
});