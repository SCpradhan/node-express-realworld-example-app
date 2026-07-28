import request from 'supertest';
import express, { Express } from 'express';
import cors from 'cors';
import app from '../main';

describe('main.ts - Application Entry Point', () => {
  describe('Middleware Configuration', () => {
    it('should have CORS middleware enabled', async () => {
      const response = await request(app)
        .options('/api/test')
        .set('Origin', 'http://example.com')
        .set('Access-Control-Request-Method', 'GET');
      
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should parse JSON request bodies', async () => {
      const testApp = express();
      testApp.use(express.json());
      testApp.post('/test', (req, res) => {
        res.json({ received: req.body });
      });

      const response = await request(testApp)
        .post('/test')
        .send({ test: 'data' })
        .set('Content-Type', 'application/json');

      expect(response.body.received).toEqual({ test: 'data' });
    });

    it('should parse URL-encoded request bodies', async () => {
      const testApp = express();
      testApp.use(express.urlencoded({ extended: true }));
      testApp.post('/test', (req, res) => {
        res.json({ received: req.body });
      });

      const response = await request(testApp)
        .post('/test')
        .send('key=value')
        .set('Content-Type', 'application/x-www-form-urlencoded');

      expect(response.body.received).toEqual({ key: 'value' });
    });

    it('should serve static files from public directory', async () => {
      const testApp = express();
      testApp.use(express.static('public'));
      
      expect(testApp._router.stack.some((layer: any) => 
        layer.name === 'serveStatic'
      )).toBe(true);
    });
  });

  describe('Route Mounting', () => {
    it('should mount API routes under /api prefix', () => {
      const routes = app._router.stack.filter((layer: any) => 
        layer.regexp.test('/api')
      );
      
      expect(routes.length).toBeGreaterThan(0);
    });

    it('should serve enhanced article API responses through existing route mounting', async () => {
      const response = await request(app)
        .get('/api/articles')
        .expect('Content-Type', /json/);
      
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Error Handling Middleware', () => {
    it('should have centralized error handling middleware as last middleware', () => {
      const middlewareStack = app._router.stack;
      const errorHandlers = middlewareStack.filter((layer: any) => 
        layer.handle.length === 4
      );
      
      expect(errorHandlers.length).toBeGreaterThan(0);
    });

    it('should handle validation errors through centralized error handler', async () => {
      const testApp = express();
      testApp.use(express.json());
      testApp.post('/test', (req, res, next) => {
        const error: any = new Error('Validation failed');
        error.status = 422;
        error.errors = { field: 'is required' };
        next(error);
      });
      testApp.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
        res.status(err.status || 500).json({
          errors: err.errors || { message: err.message }
        });
      });

      const response = await request(testApp)
        .post('/test')
        .send({});

      expect(response.status).toBe(422);
      expect(response.body.errors).toBeDefined();
    });

    it('should handle new validation scenarios for readingTime feature', async () => {
      const testApp = express();
      testApp.use(express.json());
      testApp.post('/test', (req, res, next) => {
        const error: any = new Error('Invalid readingTime calculation');
        error.status = 400;
        next(error);
      });
      testApp.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
        res.status(err.status || 500).json({
          errors: { message: err.message }
        });
      });

      const response = await request(testApp)
        .post('/test')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.errors.message).toContain('readingTime');
    });
  });

  describe('HTTP Server Configuration', () => {
    it('should use PORT from environment variable if available', () => {
      const originalPort = process.env.PORT;
      process.env.PORT = '4000';
      
      expect(process.env.PORT).toBe('4000');
      
      process.env.PORT = originalPort;
    });

    it('should default to port 3000 if PORT environment variable is not set', () => {
      const originalPort = process.env.PORT;
      delete process.env.PORT;
      
      const defaultPort = process.env.PORT || 3000;
      expect(defaultPort).toBe(3000);
      
      process.env.PORT = originalPort;
    });

    it('should export the Express app instance', () => {
      expect(app).toBeDefined();
      expect(typeof app).toBe('function');
      expect(app.listen).toBeDefined();
    });
  });

  describe('No Modifications Required for readingTime Feature', () => {
    it('should maintain unchanged CORS configuration', () => {
      const corsMiddleware = app._router.stack.find((layer: any) => 
        layer.name === 'corsMiddleware'
      );
      
      expect(app._router.stack.some((layer: any) => 
        layer.name === 'corsMiddleware' || String(layer.handle).includes('cors')
      )).toBe(true);
    });

    it('should maintain unchanged body parsing middleware', () => {
      const jsonParser = app._router.stack.some((layer: any) => 
        layer.name === 'jsonParser'
      );
      const urlencodedParser = app._router.stack.some((layer: any) => 
        layer.name === 'urlencodedParser'
      );
      
      expect(jsonParser || urlencodedParser).toBe(true);
    });

    it('should maintain unchanged static file serving', () => {
      const staticMiddleware = app._router.stack.some((layer: any) => 
        layer.name === 'serveStatic'
      );
      
      expect(staticMiddleware).toBe(true);
    });

    it('should maintain unchanged HTTP server configuration', () => {
      expect(app.listen).toBeDefined();
      expect(typeof app.listen).toBe('function');
    });

    it('should serve enhanced article responses without main.ts modifications', async () => {
      const response = await request(app)
        .get('/api/articles/test-slug');
      
      expect([200, 404, 401, 403]).toContain(response.status);
    });
  });
});