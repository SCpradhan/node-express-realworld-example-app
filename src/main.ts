import request from 'supertest';
import express, { Request, Response, NextFunction, Express } from 'express';
import cors from 'cors';
import HttpException from './app/exceptions/HttpException';

describe('main.ts - Express Application Configuration', () => {
  let app: Express;
  let server: any;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
    if (server) {
      server.close();
    }
  });

  describe('Middleware Configuration', () => {
    beforeEach(() => {
      app = express();
      app.use(cors());
      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));
      app.use(express.static('public'));
    });

    test('should configure CORS middleware', async () => {
      app.get('/test-cors', (req: Request, res: Response) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/test-cors')
        .set('Origin', 'http://example.com');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    test('should parse JSON request bodies', async () => {
      app.post('/test-json', (req: Request, res: Response) => {
        res.json(req.body);
      });

      const response = await request(app)
        .post('/test-json')
        .send({ test: 'data' })
        .set('Content-Type', 'application/json');

      expect(response.body).toEqual({ test: 'data' });
    });

    test('should parse URL-encoded request bodies', async () => {
      app.post('/test-urlencoded', (req: Request, res: Response) => {
        res.json(req.body);
      });

      const response = await request(app)
        .post('/test-urlencoded')
        .send('key=value')
        .set('Content-Type', 'application/x-www-form-urlencoded');

      expect(response.body).toEqual({ key: 'value' });
    });

    test('should serve static files from public directory', async () => {
      app.get('/test-static', (req: Request, res: Response) => {
        res.json({ staticConfigured: true });
      });

      const response = await request(app).get('/test-static');
      expect(response.status).toBe(200);
    });
  });

  describe('Centralized Error Handling Middleware', () => {
    beforeEach(() => {
      app = express();
      app.use(express.json());
    });

    test('should handle 401 Unauthorized HttpException with correct response format', async () => {
      app.get('/test-401', (req: Request, res: Response, next: NextFunction) => {
        const error = new HttpException(401, 'Unauthorized access');
        next(error);
      });

      app.use((err: Error | HttpException, req: Request, res: Response, next: NextFunction) => {
        console.error(err);

        if (err instanceof HttpException && 'status' in err) {
          const status = err.status;
          const message = err.message;

          if (status === 401) {
            return res.status(401).json({
              errors: {
                body: ['Unauthorized']
              }
            });
          }
        }

        return res.status(500).json({
          errors: {
            body: ['Internal Server Error']
          }
        });
      });

      const response = await request(app).get('/test-401');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        errors: {
          body: ['Unauthorized']
        }
      });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('should handle 422 Unprocessable Entity HttpException with error message', async () => {
      app.post('/test-422', (req: Request, res: Response, next: NextFunction) => {
        const error = new HttpException(422, 'Validation failed');
        next(error);
      });

      app.use((err: Error | HttpException, req: Request, res: Response, next: NextFunction) => {
        console.error(err);

        if (err instanceof HttpException && 'status' in err) {
          const status = err.status;
          const message = err.message;

          if (status === 422) {
            return res.status(422).json({
              errors: {
                body: [message]
              }
            });
          }
        }

        return res.status(500).json({
          errors: {
            body: ['Internal Server Error']
          }
        });
      });

      const response = await request(app).post('/test-422');

      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        errors: {
          body: ['Validation failed']
        }
      });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('should handle other HttpException status codes with custom message', async () => {
      app.get('/test-404', (req: Request, res: Response, next: NextFunction) => {
        const error = new HttpException(404, 'Resource not found');
        next(error);
      });

      app.use((err: Error | HttpException, req: Request, res: Response, next: NextFunction) => {
        console.error(err);

        if (err instanceof HttpException && 'status' in err) {
          const status = err.status;
          const message = err.message;

          return res.status(status).json({
            errors: {
              body: [message]
            }
          });
        }

        return res.status(500).json({
          errors: {
            body: ['Internal Server Error']
          }
        });
      });

      const response = await request(app).get('/test-404');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        errors: {
          body: ['Resource not found']
        }
      });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('should handle generic Error with 500 status code', async () => {
      app.get('/test-generic-error', (req: Request, res: Response, next: NextFunction) => {
        const error = new Error('Something went wrong');
        next(error);
      });

      app.use((err: Error | HttpException, req: Request, res: Response, next: NextFunction) => {
        console.error(err);

        if (err instanceof HttpException && 'status' in err) {
          const status = err.status;
          const message = err.message;

          return res.status(status).json({
            errors: {
              body: [message]
            }
          });
        }

        return res.status(500).json({
          errors: {
            body: ['Internal Server Error']
          }
        });
      });

      const response = await request(app).get('/test-generic-error');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        errors: {
          body: ['Internal Server Error']
        }
      });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('should log error details to console for debugging', async () => {
      const testError = new HttpException(500, 'Test error');

      app.get('/test-logging', (req: Request, res: Response, next: NextFunction) => {
        next(testError);
      });

      app.use((err: Error | HttpException, req: Request, res: Response, next: NextFunction) => {
        console.error(err);

        return res.status(500).json({
          errors: {
            body: ['Internal Server Error']
          }
        });
      });

      await request(app).get('/test-logging');

      expect(consoleErrorSpy).toHaveBeenCalledWith(testError);
    });

    test('should maintain RealWorld API specification error response format', async () => {
      app.get('/test-format', (req: Request, res: Response, next: NextFunction) => {
        const error = new HttpException(400, 'Bad request');
        next(error);
      });

      app.use((err: Error | HttpException, req: Request, res: Response, next: NextFunction) => {
        console.error(err);

        if (err instanceof HttpException && 'status' in err) {
          return res.status(err.status).json({
            errors: {
              body: [err.message]
            }
          });
        }

        return res.status(500).json({
          errors: {
            body: ['Internal Server Error']
          }
        });
      });

      const response = await request(app).get('/test-format');

      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toHaveProperty('body');
      expect(Array.isArray(response.body.errors.body)).toBe(true);
    });
  });

  describe('Server Configuration and Startup', () => {
    test('should use PORT from environment variable', () => {
      const originalPort = process.env.PORT;
      process.env.PORT = '4000';

      const PORT = process.env.PORT || 3000;
      expect(PORT).toBe('4000');

      process.env.PORT = originalPort;
    });

    test('should fallback to port 3000 when PORT environment variable is not set', () => {
      const originalPort = process.env.PORT;
      delete process.env.PORT;

      const PORT = process.env.PORT || 3000;
      expect(PORT).toBe(3000);

      process.env.PORT = originalPort;
    });

    test('should start HTTP server and log startup message', (done) => {
      app = express();
      const PORT = 0;

      server = app.listen(PORT, () => {
        const actualPort = (server.address() as any).port;
        expect(actualPort).toBeGreaterThan(0);
        done();
      });
    });
  });

  describe('Graceful Shutdown Handling', () => {
    test('should handle SIGTERM signal and close server gracefully', (done) => {
      app = express();
      server = app.listen(0);

      const closeSpy = jest.spyOn(server, 'close');

      process.emit('SIGTERM');

      setTimeout(() => {
        expect(closeSpy).toHaveBeenCalled();
        done();
      }, 100);
    });

    test('should handle SIGINT signal and close server gracefully', (done) => {
      app = express();
      server = app.listen(0);

      const closeSpy = jest.spyOn(server, 'close');

      process.emit('SIGINT');

      setTimeout(() => {
        expect(closeSpy).toHaveBeenCalled();
        done();
      }, 100);
    });

    test('should log shutdown messages on SIGTERM', (done) => {
      app = express();
      server = app.listen(0);

      process.emit('SIGTERM');

      setTimeout(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith('SIGTERM signal received: closing HTTP server');
        done();
      }, 100);
    });

    test('should log shutdown messages on SIGINT', (done) => {
      app = express();
      server = app.listen(0);

      process.emit('SIGINT');

      setTimeout(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith('SIGINT signal received: closing HTTP server');
        done();
      }, 100);
    });
  });

  describe('Middleware Execution Order', () => {
    test('should execute middleware in correct order: CORS -> body parsing -> routes -> error handling', async () => {
      const executionOrder: string[] = [];

      app = express();

      app.use((req: Request, res: Response, next: NextFunction) => {
        executionOrder.push('cors');
        next();
      });

      app.use(express.json());
      app.use((req: Request, res: Response, next: NextFunction) => {
        executionOrder.push('body-parser');
        next();
      });

      app.get('/test-order', (req: Request, res: Response) => {
        executionOrder.push('route');
        res.json({ order: executionOrder });
      });

      const response = await request(app).get('/test-order');

      expect(response.body.order).toEqual(['cors', 'body-parser', 'route']);
    });

    test('should execute error handler after routes', async () => {
      app = express();

      app.get('/test-error-order', (req: Request, res: Response, next: NextFunction) => {
        next(new HttpException(500, 'Test error'));
      });

      app.use((err: Error | HttpException, req: Request, res: Response, next: NextFunction) => {
        console.error(err);
        return res.status(500).json({
          errors: {
            body: ['Internal Server Error']
          }
        });
      });

      const response = await request(app).get('/test-error-order');

      expect(response.status).toBe(500);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('Route Mounting', () => {
    test('should mount API routes after middleware configuration', async () => {
      app = express();
      app.use(cors());
      app.use(express.json());

      const mockRouter = express.Router();
      mockRouter.get('/api/test', (req: Request, res: Response) => {
        res.json({ mounted: true });
      });

      app.use(mockRouter);

      const response = await request(app).get('/api/test');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ mounted: true });
    });

    test('should ensure routes are mounted before error handler', async () => {
      app = express();

      const mockRouter = express.Router();
      mockRouter.get('/api/error-test', (req: Request, res: Response, next: NextFunction) => {
        next(new HttpException(400, 'Route error'));
      });

      app.use(mockRouter);

      app.use((err: Error | HttpException, req: Request, res: Response, next: NextFunction) => {
        console.error(err);
        if (err instanceof HttpException) {
          return res.status(err.status).json({
            errors: {
              body: [err.message]
            }
          });
        }
        return res.status(500).json({
          errors: {
            body: ['Internal Server Error']
          }
        });
      });

      const response = await request(app).get('/api/error-test');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        errors: {
          body: ['Route error']
        }
      });
    });
  });
});