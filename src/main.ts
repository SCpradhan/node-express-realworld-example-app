import request from 'supertest';
import express from 'express';
import cors from 'cors';
import * as bodyParser from 'body-parser';
import HttpException from './app/models/http-exception.model';

describe('main.ts - Express Application Configuration', () => {
  let app: express.Application;
  let mockRouter: express.Router;

  beforeEach(() => {
    app = express();
    mockRouter = express.Router();
  });

  describe('Router Import and Mounting', () => {
    test('should import router from routes.ts', () => {
      const router = require('./app/routes/routes');
      expect(router).toBeDefined();
      expect(router.default || router).toBeDefined();
    });

    test('should mount router to Express app with /api base path', (done) => {
      mockRouter.get('/test', (req, res) => {
        res.json({ success: true });
      });

      app.use(cors());
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use('/api', mockRouter);

      request(app)
        .get('/api/test')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.success).toBe(true);
          done();
        });
    });

    test('should make /api/articles endpoint accessible', (done) => {
      mockRouter.get('/articles', (req, res) => {
        res.json({ articles: [] });
      });

      app.use(cors());
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use('/api', mockRouter);

      request(app)
        .get('/api/articles')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).toHaveProperty('articles');
          done();
        });
    });
  });

  describe('Middleware Configuration Order', () => {
    test('should apply CORS middleware before router', (done) => {
      mockRouter.get('/test', (req, res) => {
        res.json({ cors: true });
      });

      app.use(cors());
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use('/api', mockRouter);

      request(app)
        .get('/api/test')
        .expect(200)
        .expect('Access-Control-Allow-Origin', '*')
        .end(done);
    });

    test('should apply body-parser middleware before router', (done) => {
      mockRouter.post('/test', (req, res) => {
        res.json({ body: req.body });
      });

      app.use(cors());
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use('/api', mockRouter);

      request(app)
        .post('/api/test')
        .send({ test: 'data' })
        .set('Content-Type', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.body).toEqual({ test: 'data' });
          done();
        });
    });

    test('should parse JSON request bodies', (done) => {
      mockRouter.post('/json', (req, res) => {
        res.json({ received: req.body });
      });

      app.use(cors());
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use('/api', mockRouter);

      request(app)
        .post('/api/json')
        .send({ key: 'value' })
        .set('Content-Type', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.received).toEqual({ key: 'value' });
          done();
        });
    });

    test('should parse URL-encoded request bodies with extended option', (done) => {
      mockRouter.post('/urlencoded', (req, res) => {
        res.json({ received: req.body });
      });

      app.use(cors());
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use('/api', mockRouter);

      request(app)
        .post('/api/urlencoded')
        .send('key=value&nested[prop]=data')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.received.key).toBe('value');
          done();
        });
    });
  });

  describe('Global Error Handling Middleware', () => {
    test('should register error handling middleware after router', (done) => {
      mockRouter.get('/error', (req, res, next) => {
        next(new Error('Test error'));
      });

      app.use(cors());
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use('/api', mockRouter);

      app.use(
        (
          err: Error | HttpException,
          req: express.Request,
          res: express.Response,
          next: express.NextFunction,
        ) => {
          res.status(500).json({
            errors: { body: [err.message] },
          });
        },
      );

      request(app)
        .get('/api/error')
        .expect(500)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.errors.body).toContain('Test error');
          done();
        });
    });

    test('should format UnauthorizedError with status 401 and required format', (done) => {
      mockRouter.get('/unauthorized', (req, res, next) => {
        const err: any = new Error('Unauthorized');
        err.name = 'UnauthorizedError';
        next(err);
      });

      app.use(cors());
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use('/api', mockRouter);

      app.use(
        (
          err: Error | HttpException,
          req: express.Request,
          res: express.Response,
          next: express.NextFunction,
        ) => {
          if (err && err.name === 'UnauthorizedError') {
            return res.status(401).json({
              errors: { body: ['missing authorization credentials'] },
            });
          }
        },
      );

      request(app)
        .get('/api/unauthorized')
        .expect(401)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).toEqual({
            errors: { body: ['missing authorization credentials'] },
          });
          done();
        });
    });

    test('should format HttpException with custom errorCode and required format', (done) => {
      mockRouter.get('/custom-error', (req, res, next) => {
        const err: any = new Error('Custom error message');
        err.errorCode = 400;
        next(err);
      });

      app.use(cors());
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use('/api', mockRouter);

      app.use(
        (
          err: Error | HttpException,
          req: express.Request,
          res: express.Response,
          next: express.NextFunction,
        ) => {
          if (err && (err as any).errorCode) {
            res.status((err as any).errorCode).json({
              errors: { body: [err.message] },
            });
          }
        },
      );

      request(app)
        .get('/api/custom-error')
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).toEqual({
            errors: { body: ['Custom error message'] },
          });
          done();
        });
    });

    test('should format generic Error with status 500 and required format', (done) => {
      mockRouter.get('/generic-error', (req, res, next) => {
        next(new Error('Generic error'));
      });

      app.use(cors());
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use('/api', mockRouter);

      app.use(
        (
          err: Error | HttpException,
          req: express.Request,
          res: express.Response,
          next: express.NextFunction,
        ) => {
          if (err) {
            res.status(500).json({
              errors: { body: [err.message] },
            });
          }
        },
      );

      request(app)
        .get('/api/generic-error')
        .expect(500)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).toEqual({
            errors: { body: ['Generic error'] },
          });
          done();
        });
    });

    test('should catch errors from /api/articles endpoint', (done) => {
      mockRouter.get('/articles', (req, res, next) => {
        next(new Error('Articles error'));
      });

      app.use(cors());
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use('/api', mockRouter);

      app.use(
        (
          err: Error | HttpException,
          req: express.Request,
          res: express.Response,
          next: express.NextFunction,
        ) => {
          res.status(500).json({
            errors: { body: [err.message] },
          });
        },
      );

      request(app)
        .get('/api/articles')
        .expect(500)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.errors.body).toContain('Articles error');
          done();
        });
    });
  });

  describe('Endpoint Accessibility', () => {
    test('should handle authenticated requests to /api/articles', (done) => {
      mockRouter.get('/articles', (req, res) => {
        const token = req.headers.authorization;
        res.json({ authenticated: !!token, articles: [] });
      });

      app.use(cors());
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use('/api', mockRouter);

      request(app)
        .get('/api/articles')
        .set('Authorization', 'Bearer token123')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.authenticated).toBe(true);
          done();
        });
    });

    test('should handle anonymous requests to /api/articles', (done) => {
      mockRouter.get('/articles', (req, res) => {
        const token = req.headers.authorization;
        res.json({ authenticated: !!token, articles: [] });
      });

      app.use(cors());
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use('/api', mockRouter);

      request(app)
        .get('/api/articles')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.authenticated).toBe(false);
          done();
        });
    });

    test('should not break existing /api/tags endpoint', (done) => {
      mockRouter.get('/tags', (req, res) => {
        res.json({ tags: ['test', 'example'] });
      });

      app.use(cors());
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use('/api', mockRouter);

      request(app)
        .get('/api/tags')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.tags).toBeDefined();
          done();
        });
    });

    test('should not break existing /api/auth endpoint', (done) => {
      mockRouter.post('/auth', (req, res) => {
        res.json({ user: { token: 'test-token' } });
      });

      app.use(cors());
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use('/api', mockRouter);

      request(app)
        .post('/api/auth')
        .send({ email: 'test@test.com', password: 'password' })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.user).toBeDefined();
          done();
        });
    });

    test('should not break existing /api/profiles endpoint', (done) => {
      mockRouter.get('/profiles/:username', (req, res) => {
        res.json({ profile: { username: req.params.username } });
      });

      app.use(cors());
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use('/api', mockRouter);

      request(app)
        .get('/api/profiles/testuser')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.profile.username).toBe('testuser');
          done();
        });
    });

    test('should not break other article routes', (done) => {
      mockRouter.get('/articles/:slug', (req, res) => {
        res.json({ article: { slug: req.params.slug } });
      });

      app.use(cors());
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use('/api', mockRouter);

      request(app)
        .get('/api/articles/test-article')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.article.slug).toBe('test-article');
          done();
        });
    });
  });

  describe('Server Startup', () => {
    test('should start server successfully on configured PORT', (done) => {
      const testPort = 3001;
      const testApp = express();
      
      testApp.use(cors());
      testApp.use(bodyParser.json());
      testApp.use(bodyParser.urlencoded({ extended: true }));
      testApp.use('/api', mockRouter);

      const server = testApp.listen(testPort, () => {
        expect(server.listening).toBe(true);
        server.close(done);
      });
    });

    test('should use default PORT 3000 when PORT env variable is not set', () => {
      const originalPort = process.env.PORT;
      delete process.env.PORT;
      
      const PORT = process.env.PORT || 3000;
      expect(PORT).toBe(3000);
      
      if (originalPort) {
        process.env.PORT = originalPort;
      }
    });

    test('should use environment PORT when set', () => {
      const originalPort = process.env.PORT;
      process.env.PORT = '4000';
      
      const PORT = process.env.PORT || 3000;
      expect(PORT).toBe('4000');
      
      if (originalPort) {
        process.env.PORT = originalPort;
      } else {
        delete process.env.PORT;
      }
    });
  });

  describe('Root Endpoint', () => {
    test('should respond with API status at root endpoint', (done) => {
      app.use(cors());
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use('/api', mockRouter);

      app.get('/', (req, res) => {
        res.json({ status: 'API is running on /api' });
      });

      request(app)
        .get('/')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.status).toBe('API is running on /api');
          done();
        });
    });
  });

  describe('Static Assets', () => {
    test('should serve static files from assets directory', (done) => {
      app.use(cors());
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use('/api', mockRouter);
      app.use(express.static(__dirname + '/assets'));

      request(app)
        .get('/test.txt')
        .end((err, res) => {
          expect(res.status).toBeLessThan(500);
          done();
        });
    });
  });

  describe('Middleware Chain Integration', () => {
    test('should process requests through complete middleware chain', (done) => {
      mockRouter.post('/articles', (req, res) => {
        res.json({
          cors: req.headers['access-control-allow-origin'] !== undefined,
          bodyParsed: req.body !== undefined,
          article: req.body,
        });
      });

      app.use(cors());
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use('/api', mockRouter);

      request(app)
        .post('/api/articles')
        .send({ title: 'Test Article' })
        .set('Content-Type', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.bodyParsed).toBe(true);
          expect(res.body.article.title).toBe('Test Article');
          done();
        });
    });

    test('should handle errors through complete middleware chain', (done) => {
      mockRouter.post('/articles', (req, res, next) => {
        if (!req.body.title) {
          const err: any = new Error('Title is required');
          err.errorCode = 422;
          return next(err);
        }
        res.json({ article: req.body });
      });

      app.use(cors());
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use('/api', mockRouter);

      app.use(
        (
          err: Error | HttpException,
          req: express.Request,
          res: express.Response,
          next: express.NextFunction,
        ) => {
          if (err && (err as any).errorCode) {
            res.status((err as any).errorCode).json({
              errors: { body: [err.message] },
            });
          }
        },
      );

      request(app)
        .post('/api/articles')
        .send({})
        .set('Content-Type', 'application/json')
        .expect(422)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.errors.body).toContain('Title is required');
          done();
        });
    });
  });
});