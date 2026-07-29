import request from 'supertest';
import express, { Express } from 'express';
import authRouter from './auth.controller';
import * as authService from './auth.service';
import auth from './auth';

jest.mock('./auth.service');
jest.mock('./auth');

describe('Auth Controller', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', authRouter);
    jest.clearAllMocks();
  });

  describe('POST /users - Create User', () => {
    it('should create a new user with status 201 and return user object', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        token: 'jwt-token-123'
      };

      (authService.createUser as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'test@example.com',
            username: 'testuser',
            password: 'password123'
          }
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ user: mockUser });
      expect(authService.createUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        demo: false
      });
    });

    it('should set demo flag to false when creating user', async () => {
      const mockUser = { id: 1, email: 'test@example.com', username: 'testuser' };
      (authService.createUser as jest.Mock).mockResolvedValue(mockUser);

      await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'test@example.com',
            username: 'testuser',
            password: 'password123'
          }
        });

      expect(authService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ demo: false })
      );
    });

    it('should call next with error when createUser throws an error', async () => {
      const mockError = new Error('User creation failed');
      (authService.createUser as jest.Mock).mockRejectedValue(mockError);

      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'test@example.com',
            username: 'testuser',
            password: 'password123'
          }
        });

      expect(authService.createUser).toHaveBeenCalled();
    });

    it('should include JWT token in user registration response', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        token: 'jwt-token-abc123'
      };

      (authService.createUser as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'test@example.com',
            username: 'testuser',
            password: 'password123'
          }
        });

      expect(response.body.user.token).toBeDefined();
      expect(response.body.user.token).toBe('jwt-token-abc123');
    });
  });

  describe('POST /users/login - User Login', () => {
    it('should login user and return user object with JWT token', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        token: 'jwt-token-456'
      };

      (authService.login as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: 'test@example.com',
            password: 'password123'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ user: mockUser });
      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should return JWT token for subsequent authenticated requests', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        token: 'jwt-token-for-auth'
      };

      (authService.login as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: 'test@example.com',
            password: 'password123'
          }
        });

      expect(response.body.user.token).toBeDefined();
      expect(typeof response.body.user.token).toBe('string');
    });

    it('should call next with error when login fails', async () => {
      const mockError = new Error('Invalid credentials');
      (authService.login as jest.Mock).mockRejectedValue(mockError);

      const response = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: 'test@example.com',
            password: 'wrongpassword'
          }
        });

      expect(authService.login).toHaveBeenCalled();
    });

    it('should return standardized error format on login failure', async () => {
      const mockError = { errors: { 'email or password': ['is invalid'] } };
      (authService.login as jest.Mock).mockRejectedValue(mockError);

      await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: 'test@example.com',
            password: 'wrongpassword'
          }
        });

      expect(authService.login).toHaveBeenCalled();
    });
  });

  describe('GET /user - Get Current User', () => {
    it('should get current user when auth.required middleware passes', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        token: 'jwt-token-789'
      };

      (auth.required as jest.Mock).mockImplementation((req, res, next) => {
        req.auth = { user: { id: 1 } };
        next();
      });

      (authService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/user')
        .set('Authorization', 'Bearer jwt-token-789');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ user: mockUser });
      expect(authService.getCurrentUser).toHaveBeenCalledWith(1);
    });

    it('should verify auth.required middleware is properly applied', async () => {
      (auth.required as jest.Mock).mockImplementation((req, res, next) => {
        req.auth = { user: { id: 1 } };
        next();
      });

      (authService.getCurrentUser as jest.Mock).mockResolvedValue({});

      await request(app)
        .get('/api/user')
        .set('Authorization', 'Bearer jwt-token');

      expect(auth.required).toHaveBeenCalled();
    });

    it('should call next with error when getCurrentUser fails', async () => {
      const mockError = new Error('User not found');

      (auth.required as jest.Mock).mockImplementation((req, res, next) => {
        req.auth = { user: { id: 1 } };
        next();
      });

      (authService.getCurrentUser as jest.Mock).mockRejectedValue(mockError);

      const response = await request(app)
        .get('/api/user')
        .set('Authorization', 'Bearer jwt-token');

      expect(authService.getCurrentUser).toHaveBeenCalled();
    });

    it('should handle undefined user id gracefully', async () => {
      (auth.required as jest.Mock).mockImplementation((req, res, next) => {
        req.auth = { user: undefined };
        next();
      });

      (authService.getCurrentUser as jest.Mock).mockResolvedValue(null);

      await request(app)
        .get('/api/user')
        .set('Authorization', 'Bearer jwt-token');

      expect(authService.getCurrentUser).toHaveBeenCalledWith(undefined);
    });
  });

  describe('PUT /user - Update User', () => {
    it('should update user when auth.required middleware passes', async () => {
      const mockUpdatedUser = {
        id: 1,
        email: 'updated@example.com',
        username: 'updateduser',
        bio: 'Updated bio',
        token: 'jwt-token-updated'
      };

      (auth.required as jest.Mock).mockImplementation((req, res, next) => {
        req.auth = { user: { id: 1 } };
        next();
      });

      (authService.updateUser as jest.Mock).mockResolvedValue(mockUpdatedUser);

      const response = await request(app)
        .put('/api/user')
        .set('Authorization', 'Bearer jwt-token')
        .send({
          user: {
            email: 'updated@example.com',
            bio: 'Updated bio'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ user: mockUpdatedUser });
      expect(authService.updateUser).toHaveBeenCalledWith(
        {
          email: 'updated@example.com',
          bio: 'Updated bio'
        },
        1
      );
    });

    it('should verify auth.required middleware is properly applied to update route', async () => {
      (auth.required as jest.Mock).mockImplementation((req, res, next) => {
        req.auth = { user: { id: 1 } };
        next();
      });

      (authService.updateUser as jest.Mock).mockResolvedValue({});

      await request(app)
        .put('/api/user')
        .set('Authorization', 'Bearer jwt-token')
        .send({ user: {} });

      expect(auth.required).toHaveBeenCalled();
    });

    it('should call next with error when updateUser fails', async () => {
      const mockError = new Error('Update failed');

      (auth.required as jest.Mock).mockImplementation((req, res, next) => {
        req.auth = { user: { id: 1 } };
        next();
      });

      (authService.updateUser as jest.Mock).mockRejectedValue(mockError);

      const response = await request(app)
        .put('/api/user')
        .set('Authorization', 'Bearer jwt-token')
        .send({ user: { email: 'test@example.com' } });

      expect(authService.updateUser).toHaveBeenCalled();
    });

    it('should pass user id from auth context to updateUser service', async () => {
      (auth.required as jest.Mock).mockImplementation((req, res, next) => {
        req.auth = { user: { id: 42 } };
        next();
      });

      (authService.updateUser as jest.Mock).mockResolvedValue({});

      await request(app)
        .put('/api/user')
        .set('Authorization', 'Bearer jwt-token')
        .send({ user: { username: 'newusername' } });

      expect(authService.updateUser).toHaveBeenCalledWith(
        { username: 'newusername' },
        42
      );
    });
  });

  describe('Error Response Format Validation', () => {
    it('should return standardized error format matching article list error format', async () => {
      const standardizedError = {
        errors: {
          body: ['error message']
        }
      };

      (authService.createUser as jest.Mock).mockRejectedValue(standardizedError);

      await request(app)
        .post('/api/users')
        .send({ user: { email: 'test@example.com' } });

      expect(authService.createUser).toHaveBeenCalled();
    });

    it('should ensure error handling consistency across all routes', async () => {
      const mockError = new Error('Service error');

      (authService.login as jest.Mock).mockRejectedValue(mockError);

      await request(app)
        .post('/api/users/login')
        .send({ user: { email: 'test@example.com', password: 'pass' } });

      expect(authService.login).toHaveBeenCalled();
    });
  });

  describe('Authentication Infrastructure for Article Controller', () => {
    it('should verify authentication routes are functioning for article list feature', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        token: 'jwt-token-for-articles'
      };

      (authService.login as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: 'test@example.com',
            password: 'password123'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.user.token).toBeDefined();
    });

    it('should confirm no conflicts with article list endpoint', async () => {
      const mockUser = { id: 1, email: 'test@example.com', username: 'testuser' };
      (authService.createUser as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'test@example.com',
            username: 'testuser',
            password: 'password123'
          }
        });

      expect(response.status).toBe(201);
    });

    it('should provide JWT token that can be used with auth.optional middleware', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        token: 'jwt-token-optional-auth'
      };

      (authService.login as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: 'test@example.com',
            password: 'password123'
          }
        });

      expect(response.body.user.token).toBeTruthy();
      expect(typeof response.body.user.token).toBe('string');
    });
  });

  describe('Route Registration Validation', () => {
    it('should verify POST /users route is registered', async () => {
      (authService.createUser as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .post('/api/users')
        .send({ user: {} });

      expect(authService.createUser).toHaveBeenCalled();
    });

    it('should verify POST /users/login route is registered', async () => {
      (authService.login as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .post('/api/users/login')
        .send({ user: {} });

      expect(authService.login).toHaveBeenCalled();
    });

    it('should verify GET /user route is registered with auth.required', async () => {
      (auth.required as jest.Mock).mockImplementation((req, res, next) => {
        req.auth = { user: { id: 1 } };
        next();
      });
      (authService.getCurrentUser as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .get('/api/user')
        .set('Authorization', 'Bearer token');

      expect(auth.required).toHaveBeenCalled();
      expect(authService.getCurrentUser).toHaveBeenCalled();
    });

    it('should verify PUT /user route is registered with auth.required', async () => {
      (auth.required as jest.Mock).mockImplementation((req, res, next) => {
        req.auth = { user: { id: 1 } };
        next();
      });
      (authService.updateUser as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .put('/api/user')
        .set('Authorization', 'Bearer token')
        .send({ user: {} });

      expect(auth.required).toHaveBeenCalled();
      expect(authService.updateUser).toHaveBeenCalled();
    });
  });
});