import { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import express from 'express';
import authRouter from './auth.controller';
import * as authService from './auth.service';
import { auth } from './auth';

jest.mock('./auth.service');
jest.mock('./auth');

describe('Auth Controller', () => {
  let app: express.Application;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(authRouter);
    
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('POST /users/login', () => {
    it('should return 422 when request body does not contain user object', async () => {
      const response = await request(app)
        .post('/users/login')
        .send({});

      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        errors: {
          body: ['Request body must contain a user object']
        }
      });
    });

    it('should return 422 when email is missing', async () => {
      const response = await request(app)
        .post('/users/login')
        .send({
          user: {
            password: 'password123'
          }
        });

      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        errors: {
          body: ['Email and password are required']
        }
      });
    });

    it('should return 422 when password is missing', async () => {
      const response = await request(app)
        .post('/users/login')
        .send({
          user: {
            email: 'test@example.com'
          }
        });

      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        errors: {
          body: ['Email and password are required']
        }
      });
    });

    it('should return 422 when both email and password are missing', async () => {
      const response = await request(app)
        .post('/users/login')
        .send({
          user: {}
        });

      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        errors: {
          body: ['Email and password are required']
        }
      });
    });

    it('should return 200 with authenticated user on successful login', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        username: 'testuser',
        token: 'jwt-token'
      };

      (authService.loginUser as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/users/login')
        .send({
          user: {
            email: 'test@example.com',
            password: 'password123'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ user: mockUser });
      expect(authService.loginUser).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(authService.loginUser).toHaveBeenCalledTimes(1);
    });

    it('should call next with error when authService.loginUser throws error', async () => {
      const mockError = new Error('Invalid credentials');
      (authService.loginUser as jest.Mock).mockRejectedValue(mockError);

      app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        res.status(500).json({ error: err.message });
      });

      const response = await request(app)
        .post('/users/login')
        .send({
          user: {
            email: 'test@example.com',
            password: 'wrongpassword'
          }
        });

      expect(authService.loginUser).toHaveBeenCalledWith('test@example.com', 'wrongpassword');
      expect(response.status).toBe(500);
    });
  });

  describe('POST /users', () => {
    it('should return 422 when request body does not contain user object', async () => {
      const response = await request(app)
        .post('/users')
        .send({});

      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        errors: {
          body: ['Request body must contain a user object']
        }
      });
    });

    it('should return 422 when email is missing', async () => {
      const response = await request(app)
        .post('/users')
        .send({
          user: {
            username: 'testuser',
            password: 'password123'
          }
        });

      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        errors: {
          body: ['Email, username, and password are required']
        }
      });
    });

    it('should return 422 when username is missing', async () => {
      const response = await request(app)
        .post('/users')
        .send({
          user: {
            email: 'test@example.com',
            password: 'password123'
          }
        });

      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        errors: {
          body: ['Email, username, and password are required']
        }
      });
    });

    it('should return 422 when password is missing', async () => {
      const response = await request(app)
        .post('/users')
        .send({
          user: {
            email: 'test@example.com',
            username: 'testuser'
          }
        });

      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        errors: {
          body: ['Email, username, and password are required']
        }
      });
    });

    it('should return 422 when all required fields are missing', async () => {
      const response = await request(app)
        .post('/users')
        .send({
          user: {}
        });

      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        errors: {
          body: ['Email, username, and password are required']
        }
      });
    });

    it('should return 201 with registered user on successful registration', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        username: 'testuser',
        token: 'jwt-token'
      };

      (authService.registerUser as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/users')
        .send({
          user: {
            email: 'test@example.com',
            username: 'testuser',
            password: 'password123'
          }
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ user: mockUser });
      expect(authService.registerUser).toHaveBeenCalledWith('test@example.com', 'testuser', 'password123');
      expect(authService.registerUser).toHaveBeenCalledTimes(1);
    });

    it('should call next with error when authService.registerUser throws error', async () => {
      const mockError = new Error('User already exists');
      (authService.registerUser as jest.Mock).mockRejectedValue(mockError);

      app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        res.status(500).json({ error: err.message });
      });

      const response = await request(app)
        .post('/users')
        .send({
          user: {
            email: 'test@example.com',
            username: 'testuser',
            password: 'password123'
          }
        });

      expect(authService.registerUser).toHaveBeenCalledWith('test@example.com', 'testuser', 'password123');
      expect(response.status).toBe(500);
    });
  });

  describe('GET /user', () => {
    beforeEach(() => {
      (auth.required as jest.Mock) = jest.fn((req: Request, res: Response, next: NextFunction) => {
        req.user = { id: '123' };
        next();
      });
      
      app = express();
      app.use(express.json());
      app.use(authRouter);
    });

    it('should return 200 with current user when authenticated', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        username: 'testuser'
      };

      (authService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/user')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ user: mockUser });
      expect(authService.getCurrentUser).toHaveBeenCalledWith('123');
      expect(authService.getCurrentUser).toHaveBeenCalledTimes(1);
    });

    it('should call next with error when authService.getCurrentUser throws error', async () => {
      const mockError = new Error('User not found');
      (authService.getCurrentUser as jest.Mock).mockRejectedValue(mockError);

      app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        res.status(500).json({ error: err.message });
      });

      const response = await request(app)
        .get('/user')
        .set('Authorization', 'Bearer valid-token');

      expect(authService.getCurrentUser).toHaveBeenCalledWith('123');
      expect(response.status).toBe(500);
    });

    it('should extract user id from req.user.id populated by auth middleware', async () => {
      const mockUser = {
        id: '456',
        email: 'another@example.com',
        username: 'anotheruser'
      };

      (auth.required as jest.Mock) = jest.fn((req: Request, res: Response, next: NextFunction) => {
        req.user = { id: '456' };
        next();
      });

      (authService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      app = express();
      app.use(express.json());
      app.use(authRouter);

      const response = await request(app)
        .get('/user')
        .set('Authorization', 'Bearer valid-token');

      expect(authService.getCurrentUser).toHaveBeenCalledWith('456');
    });
  });

  describe('PUT /user', () => {
    beforeEach(() => {
      (auth.required as jest.Mock) = jest.fn((req: Request, res: Response, next: NextFunction) => {
        req.user = { id: '123' };
        next();
      });
      
      app = express();
      app.use(express.json());
      app.use(authRouter);
    });

    it('should return 422 when request body does not contain user object', async () => {
      const response = await request(app)
        .put('/user')
        .set('Authorization', 'Bearer valid-token')
        .send({});

      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        errors: {
          body: ['Request body must contain a user object']
        }
      });
    });

    it('should return 200 with updated user on successful update', async () => {
      const updates = {
        email: 'newemail@example.com',
        username: 'newusername'
      };

      const mockUpdatedUser = {
        id: '123',
        email: 'newemail@example.com',
        username: 'newusername'
      };

      (authService.updateUser as jest.Mock).mockResolvedValue(mockUpdatedUser);

      const response = await request(app)
        .put('/user')
        .set('Authorization', 'Bearer valid-token')
        .send({ user: updates });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ user: mockUpdatedUser });
      expect(authService.updateUser).toHaveBeenCalledWith('123', updates);
      expect(authService.updateUser).toHaveBeenCalledTimes(1);
    });

    it('should extract user id from req.user.id and updates from req.body.user', async () => {
      const updates = {
        bio: 'New bio',
        image: 'http://example.com/image.jpg'
      };

      const mockUpdatedUser = {
        id: '123',
        email: 'test@example.com',
        username: 'testuser',
        bio: 'New bio',
        image: 'http://example.com/image.jpg'
      };

      (authService.updateUser as jest.Mock).mockResolvedValue(mockUpdatedUser);

      const response = await request(app)
        .put('/user')
        .set('Authorization', 'Bearer valid-token')
        .send({ user: updates });

      expect(authService.updateUser).toHaveBeenCalledWith('123', updates);
      expect(response.body).toEqual({ user: mockUpdatedUser });
    });

    it('should call next with error when authService.updateUser throws error', async () => {
      const mockError = new Error('Update failed');
      (authService.updateUser as jest.Mock).mockRejectedValue(mockError);

      app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        res.status(500).json({ error: err.message });
      });

      const response = await request(app)
        .put('/user')
        .set('Authorization', 'Bearer valid-token')
        .send({
          user: {
            email: 'newemail@example.com'
          }
        });

      expect(authService.updateUser).toHaveBeenCalled();
      expect(response.status).toBe(500);
    });

    it('should handle partial updates correctly', async () => {
      const partialUpdates = {
        email: 'updated@example.com'
      };

      const mockUpdatedUser = {
        id: '123',
        email: 'updated@example.com',
        username: 'testuser'
      };

      (authService.updateUser as jest.Mock).mockResolvedValue(mockUpdatedUser);

      const response = await request(app)
        .put('/user')
        .set('Authorization', 'Bearer valid-token')
        .send({ user: partialUpdates });

      expect(response.status).toBe(200);
      expect(authService.updateUser).toHaveBeenCalledWith('123', partialUpdates);
    });
  });

  describe('validateUserBody middleware', () => {
    it('should call next when req.body.user exists', async () => {
      const response = await request(app)
        .post('/users/login')
        .send({
          user: {
            email: 'test@example.com',
            password: 'password123'
          }
        });

      expect(authService.loginUser).toHaveBeenCalled();
    });

    it('should return 422 with proper error structure when req.body.user is missing', async () => {
      const response = await request(app)
        .post('/users/login')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toHaveProperty('body');
      expect(Array.isArray(response.body.errors.body)).toBe(true);
    });

    it('should not call service methods when validation fails', async () => {
      await request(app)
        .post('/users/login')
        .send({});

      expect(authService.loginUser).not.toHaveBeenCalled();
    });
  });

  describe('Response format consistency', () => {
    beforeEach(() => {
      (auth.required as jest.Mock) = jest.fn((req: Request, res: Response, next: NextFunction) => {
        req.user = { id: '123' };
        next();
      });
      
      app = express();
      app.use(express.json());
      app.use(authRouter);
    });

    it('should return consistent { user: {...} } format for POST /users/login', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      (authService.loginUser as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/users/login')
        .send({ user: { email: 'test@example.com', password: 'password123' } });

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toEqual(mockUser);
    });

    it('should return consistent { user: {...} } format for POST /users', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      (authService.registerUser as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/users')
        .send({ user: { email: 'test@example.com', username: 'test', password: 'password123' } });

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toEqual(mockUser);
    });

    it('should return consistent { user: {...} } format for GET /user', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      (authService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/user')
        .set('Authorization', 'Bearer valid-token');

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toEqual(mockUser);
    });

    it('should return consistent { user: {...} } format for PUT /user', async () => {
      const mockUser = { id: '123', email: 'updated@example.com' };
      (authService.updateUser as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .put('/user')
        .set('Authorization', 'Bearer valid-token')
        .send({ user: { email: 'updated@example.com' } });

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toEqual(mockUser);
    });
  });

  describe('Centralized error handling', () => {
    beforeEach(() => {
      (auth.required as jest.Mock) = jest.fn((req: Request, res: Response, next: NextFunction) => {
        req.user = { id: '123' };
        next();
      });
      
      app = express();
      app.use(express.json());
      app.use(authRouter);
      app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        res.status(500).json({ error: err.message });
      });
    });

    it('should pass errors to next() in POST /users/login', async () => {
      const mockError = new Error('Login error');
      (authService.loginUser as jest.Mock).mockRejectedValue(mockError);

      const response = await request(app)
        .post('/users/login')
        .send({ user: { email: 'test@example.com', password: 'password123' } });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Login error');
    });

    it('should pass errors to next() in POST /users', async () => {
      const mockError = new Error('Registration error');
      (authService.registerUser as jest.Mock).mockRejectedValue(mockError);

      const response = await request(app)
        .post('/users')
        .send({ user: { email: 'test@example.com', username: 'test', password: 'password123' } });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Registration error');
    });

    it('should pass errors to next() in GET /user', async () => {
      const mockError = new Error('Get user error');
      (authService.getCurrentUser as jest.Mock).mockRejectedValue(mockError);

      const response = await request(app)
        .get('/user')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Get user error');
    });

    it('should pass errors to next() in PUT /user', async () => {
      const mockError = new Error('Update error');
      (authService.updateUser as jest.Mock).mockRejectedValue(mockError);

      const response = await request(app)
        .put('/user')
        .set('Authorization', 'Bearer valid-token')
        .send({ user: { email: 'updated@example.com' } });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Update error');
    });
  });

  describe('Endpoint path preservation', () => {
    it('should expose POST /users/login endpoint', async () => {
      (authService.loginUser as jest.Mock).mockResolvedValue({ id: '123' });

      const response = await request(app)
        .post('/users/login')
        .send({ user: { email: 'test@example.com', password: 'password123' } });

      expect(response.status).not.toBe(404);
    });

    it('should expose POST /users endpoint', async () => {
      (authService.registerUser as jest.Mock).mockResolvedValue({ id: '123' });

      const response = await request(app)
        .post('/users')
        .send({ user: { email: 'test@example.com', username: 'test', password: 'password123' } });

      expect(response.status).not.toBe(404);
    });

    it('should expose GET /user endpoint', async () => {
      (auth.required as jest.Mock) = jest.fn((req: Request, res: Response, next: NextFunction) => {
        req.user = { id: '123' };
        next();
      });
      (authService.getCurrentUser as jest.Mock).mockResolvedValue({ id: '123' });

      app = express();
      app.use(express.json());
      app.use(authRouter);

      const response = await request(app)
        .get('/user')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).not.toBe(404);
    });

    it('should expose PUT /user endpoint', async () => {
      (auth.required as jest.Mock) = jest.fn((req: Request, res: Response, next: NextFunction) => {
        req.user = { id: '123' };
        next();
      });
      (authService.updateUser as jest.Mock).mockResolvedValue({ id: '123' });

      app = express();
      app.use(express.json());
      app.use(authRouter);

      const response = await request(app)
        .put('/user')
        .set('Authorization', 'Bearer valid-token')
        .send({ user: { email: 'updated@example.com' } });

      expect(response.status).not.toBe(404);
    });
  });
});