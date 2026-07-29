import { Router } from 'express';
import request from 'supertest';
import express, { Application } from 'express';
import router from './routes';

jest.mock('./tag/tag.controller', () => {
  const mockRouter = Router();
  mockRouter.get('/tags', (req, res) => res.json({ tags: [] }));
  return mockRouter;
});

jest.mock('./article/article.controller', () => {
  const mockRouter = Router();
  mockRouter.get('/articles', (req, res) => res.json({ articles: [] }));
  mockRouter.get('/articles/:slug', (req, res) => res.json({ article: {} }));
  mockRouter.post('/articles', (req, res) => res.status(201).json({ article: {} }));
  return mockRouter;
});

jest.mock('./auth/auth.controller', () => {
  const mockRouter = Router();
  mockRouter.post('/users/login', (req, res) => res.json({ user: {} }));
  return mockRouter;
});

jest.mock('./profile/profile.controller', () => {
  const mockRouter = Router();
  mockRouter.get('/profiles/:username', (req, res) => res.json({ profile: {} }));
  return mockRouter;
});

describe('routes.ts - Article Router Integration', () => {
  let app: Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(router);
  });

  describe('Article Router Import and Mounting', () => {
    it('should successfully import articleRouter from article.controller', () => {
      const articleRouter = require('./article/article.controller');
      expect(articleRouter).toBeDefined();
      expect(typeof articleRouter).toBe('object');
    });

    it('should mount article router at /api/articles path', async () => {
      const response = await request(app).get('/api/articles');
      expect(response.status).not.toBe(404);
    });

    it('should respond to GET /api/articles endpoint', async () => {
      const response = await request(app).get('/api/articles');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('articles');
    });

    it('should respond to GET /api/articles/:slug endpoint', async () => {
      const response = await request(app).get('/api/articles/test-slug');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('article');
    });

    it('should respond to POST /api/articles endpoint', async () => {
      const response = await request(app)
        .post('/api/articles')
        .send({ article: { title: 'Test' } });
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('article');
    });
  });

  describe('Route Registration Order', () => {
    it('should register article routes before wildcard routes', async () => {
      const response = await request(app).get('/api/articles');
      expect(response.status).toBe(200);
    });

    it('should not conflict with tag controller routes', async () => {
      const tagsResponse = await request(app).get('/api/tags');
      const articlesResponse = await request(app).get('/api/articles');
      
      expect(tagsResponse.status).toBe(200);
      expect(articlesResponse.status).toBe(200);
    });

    it('should not conflict with auth controller routes', async () => {
      const authResponse = await request(app).post('/api/users/login');
      const articlesResponse = await request(app).get('/api/articles');
      
      expect(authResponse.status).toBe(200);
      expect(articlesResponse.status).toBe(200);
    });

    it('should not conflict with profile controller routes', async () => {
      const profileResponse = await request(app).get('/api/profiles/testuser');
      const articlesResponse = await request(app).get('/api/articles');
      
      expect(profileResponse.status).toBe(200);
      expect(articlesResponse.status).toBe(200);
    });
  });

  describe('Base Path Prefix Verification', () => {
    it('should apply /api prefix to article routes', async () => {
      const responseWithPrefix = await request(app).get('/api/articles');
      const responseWithoutPrefix = await request(app).get('/articles');
      
      expect(responseWithPrefix.status).toBe(200);
      expect(responseWithoutPrefix.status).toBe(404);
    });

    it('should result in final endpoint path /api/articles', async () => {
      const response = await request(app).get('/api/articles');
      expect(response.status).toBe(200);
      expect(response.request.path).toBe('/api/articles');
    });
  });

  describe('Router Export and Structure', () => {
    it('should export a valid Express Router instance', () => {
      expect(router).toBeDefined();
      expect(typeof router).toBe('function');
    });

    it('should maintain all existing route registrations', async () => {
      const endpoints = [
        '/api/tags',
        '/api/articles',
        '/api/profiles/testuser',
        '/api/users/login'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app).get(endpoint);
        expect(response.status).not.toBe(404);
      }
    });
  });

  describe('Inline Documentation', () => {
    it('should contain inline comment for article routes registration', () => {
      const fs = require('fs');
      const path = require('path');
      const routesContent = fs.readFileSync(
        path.join(__dirname, 'routes.ts'),
        'utf-8'
      );
      
      expect(routesContent).toContain('Article routes registration');
      expect(routesContent).toContain('/api/articles');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid article routes gracefully', async () => {
      const response = await request(app).get('/api/articles/invalid/nested/path');
      expect([200, 404]).toContain(response.status);
    });

    it('should maintain route isolation between controllers', async () => {
      const articlesResponse = await request(app).get('/api/articles');
      const tagsResponse = await request(app).get('/api/tags');
      
      expect(articlesResponse.body).not.toEqual(tagsResponse.body);
    });

    it('should handle concurrent requests to different routes', async () => {
      const requests = [
        request(app).get('/api/articles'),
        request(app).get('/api/tags'),
        request(app).get('/api/profiles/testuser')
      ];

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Duplicate Import Mitigation', () => {
    it('should handle articleRouter import without conflicts', () => {
      const routesModule = require('./routes');
      expect(routesModule.default).toBeDefined();
    });

    it('should not break existing API endpoint accessibility', async () => {
      const endpoints = [
        { path: '/api/tags', method: 'get' },
        { path: '/api/articles', method: 'get' },
        { path: '/api/profiles/testuser', method: 'get' },
        { path: '/api/users/login', method: 'post' }
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)[endpoint.method](endpoint.path);
        expect(response.status).not.toBe(500);
        expect(response.status).not.toBe(404);
      }
    });
  });
});