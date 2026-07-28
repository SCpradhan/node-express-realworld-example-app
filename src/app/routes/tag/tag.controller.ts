import request from 'supertest';
import express, { Express } from 'express';
import tagController from '../../../src/app/routes/tag/tag.controller';
import { Tag } from '../../../src/app/models/tag.model';

jest.mock('../../../src/app/models/tag.model');

describe('Tag Controller', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/tags', tagController);
    jest.clearAllMocks();
  });

  describe('GET /api/tags', () => {
    it('should return a list of tags successfully', async () => {
      const mockTags = ['reactjs', 'nodejs', 'typescript', 'testing'];
      const mockFind = {
        distinct: jest.fn().mockResolvedValue(mockTags)
      };
      (Tag.find as jest.Mock).mockReturnValue(mockFind);

      const response = await request(app).get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        tags: mockTags
      });
      expect(Tag.find).toHaveBeenCalledTimes(1);
      expect(mockFind.distinct).toHaveBeenCalledWith('name');
    });

    it('should return an empty array when no tags exist', async () => {
      const mockFind = {
        distinct: jest.fn().mockResolvedValue([])
      };
      (Tag.find as jest.Mock).mockReturnValue(mockFind);

      const response = await request(app).get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        tags: []
      });
      expect(Tag.find).toHaveBeenCalledTimes(1);
      expect(mockFind.distinct).toHaveBeenCalledWith('name');
    });

    it('should handle database errors gracefully', async () => {
      const mockError = new Error('Database connection failed');
      const mockFind = {
        distinct: jest.fn().mockRejectedValue(mockError)
      };
      (Tag.find as jest.Mock).mockReturnValue(mockFind);

      app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
        res.status(500).json({ error: err.message });
      });

      const response = await request(app).get('/api/tags');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Database connection failed'
      });
      expect(Tag.find).toHaveBeenCalledTimes(1);
    });

    it('should only return tag names without article data', async () => {
      const mockTags = ['javascript', 'python', 'java'];
      const mockFind = {
        distinct: jest.fn().mockResolvedValue(mockTags)
      };
      (Tag.find as jest.Mock).mockReturnValue(mockFind);

      const response = await request(app).get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body.tags).toEqual(mockTags);
      expect(response.body.tags.every((tag: any) => typeof tag === 'string')).toBe(true);
      expect(response.body).not.toHaveProperty('articles');
      expect(response.body).not.toHaveProperty('readingTime');
    });

    it('should return distinct tag names only', async () => {
      const mockTags = ['reactjs', 'nodejs', 'typescript'];
      const mockFind = {
        distinct: jest.fn().mockResolvedValue(mockTags)
      };
      (Tag.find as jest.Mock).mockReturnValue(mockFind);

      const response = await request(app).get('/api/tags');

      expect(response.status).toBe(200);
      expect(mockFind.distinct).toHaveBeenCalledWith('name');
      expect(new Set(response.body.tags).size).toBe(response.body.tags.length);
    });

    it('should verify no readingTime feature modifications are present', async () => {
      const mockTags = ['coding', 'testing'];
      const mockFind = {
        distinct: jest.fn().mockResolvedValue(mockTags)
      };
      (Tag.find as jest.Mock).mockReturnValue(mockFind);

      const response = await request(app).get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ tags: mockTags });
      expect(response.body).not.toHaveProperty('readingTime');
      expect(JSON.stringify(response.body)).not.toContain('readingTime');
    });
  });
});