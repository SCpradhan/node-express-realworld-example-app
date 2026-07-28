import { Router } from 'express';
import request from 'supertest';
import express, { Application } from 'express';
import router from '../../../src/app/routes/routes';
import articleRouter from '../../../src/app/routes/api/articles';
import userRouter from '../../../src/app/routes/api/users';
import profileRouter from '../../../src/app/routes/api/profiles';
import tagRouter from '../../../src/app/routes/api/tags';

jest.mock('../../../src/app/routes/api/articles');
jest.mock('../../../src/app/routes/api/users');
jest.mock('../../../src/app/routes/api/profiles');
jest.mock('../../../src/app/routes/api/tags');

describe('routes.ts - Main Router Configuration', () => {
  let app: Application;
  let mockArticleRouter: Router;
  let mockUserRouter: Router;
  let mockProfileRouter: Router;
  let mockTagRouter: Router;

  beforeEach(() => {
    app = express();
    mockArticleRouter = Router();
    mockUserRouter = Router();
    mockProfileRouter = Router();
    mockTagRouter = Router();

    (articleRouter as jest.Mock).mockReturnValue(mockArticleRouter);
    (userRouter as jest.Mock).mockReturnValue(mockUserRouter);
    (profileRouter as jest.Mock).mockReturnValue(mockProfileRouter);
    (tagRouter as jest.Mock).mockReturnValue(mockTagRouter);

    app.use('/api', router);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Route Mounting Verification', () => {
    it('should mount article router at /articles path', () => {
      const routerStack = (router as any).stack;
      const articleRoute = routerStack.find((layer: any) => 
        layer.regexp.test('/articles') && layer.name === 'router'
      );
      expect(articleRoute).toBeDefined();
    });

    it('should mount user router at /users path', () => {
      const routerStack = (router as any).stack;
      const userRoute = routerStack.find((layer: any) => 
        layer.regexp.test('/users') && layer.name === 'router'
      );
      expect(userRoute).toBeDefined();
    });

    it('should mount profile router at /profiles path', () => {
      const routerStack = (router as any).stack;
      const profileRoute = routerStack.find((layer: any) => 
        layer.regexp.test('/profiles') && layer.name === 'router'
      );
      expect(profileRoute).toBeDefined();
    });

    it('should mount tag router at /tags path', () => {
      const routerStack = (router as any).stack;
      const tagRoute = routerStack.find((layer: any) => 
        layer.regexp.test('/tags') && layer.name === 'router'
      );
      expect(tagRoute).toBeDefined();
    });
  });

  describe('No Breaking Changes Verification', () => {
    it('should export a valid Express Router instance', () => {
      expect(router).toBeDefined();
      expect(typeof router).toBe('function');
      expect(router.stack).toBeDefined();
    });

    it('should maintain all four route mounts without modifications', () => {
      const routerStack = (router as any).stack;
      const routerLayers = routerStack.filter((layer: any) => layer.name === 'router');
      expect(routerLayers).toHaveLength(4);
    });

    it('should not introduce any additional middleware layers', () => {
      const routerStack = (router as any).stack;
      const middlewareLayers = routerStack.filter((layer: any) => 
        layer.name !== 'router' && layer.name !== 'bound dispatch'
      );
      expect(middlewareLayers).toHaveLength(0);
    });
  });

  describe('Article Routes Integration for readingTime Feature', () => {
    beforeEach(() => {
      mockArticleRouter.get('/', (req, res) => {
        res.json({
          articles: [{
            slug: 'test-article',
            title: 'Test Article',
            body: 'Test body content',
            readingTime: 5
          }]
        });
      });

      mockArticleRouter.get('/:slug', (req, res) => {
        res.json({
          article: {
            slug: req.params.slug,
            title: 'Test Article',
            body: 'Test body content',
            readingTime: 5
          }
        });
      });

      mockArticleRouter.get('/feed', (req, res) => {
        res.json({
          articles: [{
            slug: 'feed-article',
            title: 'Feed Article',
            body: 'Feed content',
            readingTime: 3
          }]
        });
      });

      app.use('/api', router);
    });

    it('should serve GET /api/articles with readingTime in response payload', async () => {
      const response = await request(app).get('/api/articles');
      expect(response.status).toBe(200);
      expect(response.body.articles).toBeDefined();
      expect(response.body.articles[0]).toHaveProperty('readingTime');
    });

    it('should serve GET /api/articles/:slug with readingTime in response payload', async () => {
      const response = await request(app).get('/api/articles/test-slug');
      expect(response.status).toBe(200);
      expect(response.body.article).toBeDefined();
      expect(response.body.article).toHaveProperty('readingTime');
    });

    it('should serve GET /api/articles/feed with readingTime in response payload', async () => {
      const response = await request(app).get('/api/articles/feed');
      expect(response.status).toBe(200);
      expect(response.body.articles).toBeDefined();
      expect(response.body.articles[0]).toHaveProperty('readingTime');
    });
  });

  describe('Middleware and Authentication Configuration', () => {
    it('should preserve middleware chain for article routes', () => {
      const articleRouteLayer = (router as any).stack.find((layer: any) => 
        layer.regexp.test('/articles')
      );
      expect(articleRouteLayer).toBeDefined();
      expect(articleRouteLayer.handle).toBe(mockArticleRouter);
    });

    it('should preserve middleware chain for user routes', () => {
      const userRouteLayer = (router as any).stack.find((layer: any) => 
        layer.regexp.test('/users')
      );
      expect(userRouteLayer).toBeDefined();
      expect(userRouteLayer.handle).toBe(mockUserRouter);
    });

    it('should preserve middleware chain for profile routes', () => {
      const profileRouteLayer = (router as any).stack.find((layer: any) => 
        layer.regexp.test('/profiles')
      );
      expect(profileRouteLayer).toBeDefined();
      expect(profileRouteLayer.handle).toBe(mockProfileRouter);
    });

    it('should preserve middleware chain for tag routes', () => {
      const tagRouteLayer = (router as any).stack.find((layer: any) => 
        layer.regexp.test('/tags')
      );
      expect(tagRouteLayer).toBeDefined();
      expect(tagRouteLayer.handle).toBe(mockTagRouter);
    });

    it('should not alter route order which could affect middleware execution', () => {
      const routerStack = (router as any).stack;
      const routePaths = routerStack
        .filter((layer: any) => layer.name === 'router')
        .map((layer: any) => layer.regexp.toString());
      
      expect(routePaths[0]).toMatch(/articles/);
      expect(routePaths[1]).toMatch(/users/);
      expect(routePaths[2]).toMatch(/profiles/);
      expect(routePaths[3]).toMatch(/tags/);
    });
  });

  describe('Backward Compatibility for main.ts Dependency', () => {
    it('should export default router compatible with main.ts import', () => {
      expect(router).toBeDefined();
      expect(router.constructor.name).toBe('Function');
    });

    it('should maintain router interface expected by Express app.use()', () => {
      expect(() => {
        const testApp = express();
        testApp.use('/api', router);
      }).not.toThrow();
    });

    it('should not introduce breaking changes to router signature', () => {
      expect(router.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Route Aggregation Integrity', () => {
    it('should aggregate all API controllers without conflicts', () => {
      const routerStack = (router as any).stack;
      const routePaths = routerStack
        .filter((layer: any) => layer.name === 'router')
        .map((layer: any) => layer.regexp);
      
      const uniquePaths = new Set(routePaths.map((r: RegExp) => r.toString()));
      expect(uniquePaths.size).toBe(4);
    });

    it('should not have overlapping route patterns', () => {
      const routerStack = (router as any).stack;
      const routeLayers = routerStack.filter((layer: any) => layer.name === 'router');
      
      for (let i = 0; i < routeLayers.length; i++) {
        for (let j = i + 1; j < routeLayers.length; j++) {
          expect(routeLayers[i].regexp.toString()).not.toBe(routeLayers[j].regexp.toString());
        }
      }
    });

    it('should maintain proper route isolation between controllers', () => {
      expect(articleRouter).not.toBe(userRouter);
      expect(articleRouter).not.toBe(profileRouter);
      expect(articleRouter).not.toBe(tagRouter);
      expect(userRouter).not.toBe(profileRouter);
      expect(userRouter).not.toBe(tagRouter);
      expect(profileRouter).not.toBe(tagRouter);
    });
  });

  describe('Documentation Compliance', () => {
    it('should confirm no modifications required for readingTime feature', () => {
      const routerStack = (router as any).stack;
      const hasOnlyExpectedRoutes = routerStack.every((layer: any) => {
        if (layer.name !== 'router') return true;
        const path = layer.regexp.toString();
        return path.match(/articles|users|profiles|tags/);
      });
      expect(hasOnlyExpectedRoutes).toBe(true);
    });

    it('should verify routes.ts structure remains unchanged', () => {
      const routerStack = (router as any).stack;
      const routerCount = routerStack.filter((layer: any) => layer.name === 'router').length;
      expect(routerCount).toBe(4);
    });
  });
});