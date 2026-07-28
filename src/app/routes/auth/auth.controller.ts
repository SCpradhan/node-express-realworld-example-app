import { Request, Response, NextFunction } from 'express';
import authController from '../../../src/app/routes/auth/auth.controller';
import User from '../../../models/user';
import auth from '../../../src/app/auth';

jest.mock('../../../models/user');
jest.mock('../../../src/app/auth');

describe('Auth Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      payload: undefined
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      sendStatus: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('POST /users - User Registration', () => {
    it('should return 422 when username is missing', async () => {
      mockRequest.body = {
        user: {
          email: 'test@example.com',
          password: 'password123'
        }
      };

      const route = authController.stack.find(r => r.route?.path === '/users' && r.route?.methods.post);
      await route?.route?.stack[0].handle(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(422);
      expect(mockResponse.json).toHaveBeenCalledWith({
        errors: { username: "can't be blank" }
      });
    });

    it('should return 422 when email is missing', async () => {
      mockRequest.body = {
        user: {
          username: 'testuser',
          password: 'password123'
        }
      };

      const route = authController.stack.find(r => r.route?.path === '/users' && r.route?.methods.post);
      await route?.route?.stack[0].handle(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(422);
      expect(mockResponse.json).toHaveBeenCalledWith({
        errors: { email: "can't be blank" }
      });
    });

    it('should return 422 when password is missing', async () => {
      mockRequest.body = {
        user: {
          username: 'testuser',
          email: 'test@example.com'
        }
      };

      const route = authController.stack.find(r => r.route?.path === '/users' && r.route?.methods.post);
      await route?.route?.stack[0].handle(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(422);
      expect(mockResponse.json).toHaveBeenCalledWith({
        errors: { password: "can't be blank" }
      });
    });

    it('should successfully register a new user with valid data', async () => {
      const mockUser = {
        username: 'testuser',
        email: 'test@example.com',
        setPassword: jest.fn().mockResolvedValue(undefined),
        save: jest.fn().mockResolvedValue(undefined),
        toAuthJSON: jest.fn().mockReturnValue({
          username: 'testuser',
          email: 'test@example.com',
          token: 'jwt-token'
        })
      };

      (User as jest.MockedClass<typeof User>).mockImplementation(() => mockUser as any);

      mockRequest.body = {
        user: {
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        }
      };

      const route = authController.stack.find(r => r.route?.path === '/users' && r.route?.methods.post);
      await route?.route?.stack[0].handle(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUser.setPassword).toHaveBeenCalledWith('password123');
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        user: {
          username: 'testuser',
          email: 'test@example.com',
          token: 'jwt-token'
        }
      });
    });

    it('should call next with error when registration fails', async () => {
      const mockError = new Error('Database error');
      const mockUser = {
        setPassword: jest.fn().mockRejectedValue(mockError),
        save: jest.fn()
      };

      (User as jest.MockedClass<typeof User>).mockImplementation(() => mockUser as any);

      mockRequest.body = {
        user: {
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        }
      };

      const route = authController.stack.find(r => r.route?.path === '/users' && r.route?.methods.post);
      await route?.route?.stack[0].handle(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('POST /users/login - User Login', () => {
    it('should return 422 when email is missing', async () => {
      mockRequest.body = {
        user: {
          password: 'password123'
        }
      };

      const route = authController.stack.find(r => r.route?.path === '/users/login' && r.route?.methods.post);
      await route?.route?.stack[0].handle(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(422);
      expect(mockResponse.json).toHaveBeenCalledWith({
        errors: { email: "can't be blank" }
      });
    });

    it('should return 422 when password is missing', async () => {
      mockRequest.body = {
        user: {
          email: 'test@example.com'
        }
      };

      const route = authController.stack.find(r => r.route?.path === '/users/login' && r.route?.methods.post);
      await route?.route?.stack[0].handle(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(422);
      expect(mockResponse.json).toHaveBeenCalledWith({
        errors: { password: "can't be blank" }
      });
    });

    it('should return 422 when user is not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      mockRequest.body = {
        user: {
          email: 'nonexistent@example.com',
          password: 'password123'
        }
      };

      const route = authController.stack.find(r => r.route?.path === '/users/login' && r.route?.methods.post);
      await route?.route?.stack[0].handle(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(422);
      expect(mockResponse.json).toHaveBeenCalledWith({
        errors: { 'email or password': 'is invalid' }
      });
    });

    it('should return 422 when password is invalid', async () => {
      const mockUser = {
        validatePassword: jest.fn().mockResolvedValue(false)
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      mockRequest.body = {
        user: {
          email: 'test@example.com',
          password: 'wrongpassword'
        }
      };

      const route = authController.stack.find(r => r.route?.path === '/users/login' && r.route?.methods.post);
      await route?.route?.stack[0].handle(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUser.validatePassword).toHaveBeenCalledWith('wrongpassword');
      expect(mockResponse.status).toHaveBeenCalledWith(422);
      expect(mockResponse.json).toHaveBeenCalledWith({
        errors: { 'email or password': 'is invalid' }
      });
    });

    it('should successfully login with valid credentials', async () => {
      const mockUser = {
        validatePassword: jest.fn().mockResolvedValue(true),
        toAuthJSON: jest.fn().mockReturnValue({
          username: 'testuser',
          email: 'test@example.com',
          token: 'jwt-token'
        })
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      mockRequest.body = {
        user: {
          email: 'test@example.com',
          password: 'password123'
        }
      };

      const route = authController.stack.find(r => r.route?.path === '/users/login' && r.route?.methods.post);
      await route?.route?.stack[0].handle(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUser.validatePassword).toHaveBeenCalledWith('password123');
      expect(mockResponse.json).toHaveBeenCalledWith({
        user: {
          username: 'testuser',
          email: 'test@example.com',
          token: 'jwt-token'
        }
      });
    });

    it('should call next with error when login fails', async () => {
      const mockError = new Error('Database error');
      (User.findOne as jest.Mock).mockRejectedValue(mockError);

      mockRequest.body = {
        user: {
          email: 'test@example.com',
          password: 'password123'
        }
      };

      const route = authController.stack.find(r => r.route?.path === '/users/login' && r.route?.methods.post);
      await route?.route?.stack[0].handle(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('GET /user - Get Current User', () => {
    it('should return 401 when userId is not in payload', async () => {
      mockRequest.payload = undefined;

      const route = authController.stack.find(r => r.route?.path === '/user' && r.route?.methods.get);
      await route?.route?.stack[1].handle(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.sendStatus).toHaveBeenCalledWith(401);
    });

    it('should return 401 when user is not found', async () => {
      mockRequest.payload = { id: 'user123' };
      (User.findById as jest.Mock).mockResolvedValue(null);

      const route = authController.stack.find(r => r.route?.path === '/user' && r.route?.methods.get);
      await route?.route?.stack[1].handle(mockRequest as Request, mockResponse as Response, mockNext);

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(mockResponse.sendStatus).toHaveBeenCalledWith(401);
    });

    it('should return user data when authenticated', async () => {
      const mockUser = {
        toAuthJSON: jest.fn().mockReturnValue({
          username: 'testuser',
          email: 'test@example.com',
          token: 'jwt-token'
        })
      };

      mockRequest.payload = { id: 'user123' };
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const route = authController.stack.find(r => r.route?.path === '/user' && r.route?.methods.get);
      await route?.route?.stack[1].handle(mockRequest as Request, mockResponse as Response, mockNext);

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(mockResponse.json).toHaveBeenCalledWith({
        user: {
          username: 'testuser',
          email: 'test@example.com',
          token: 'jwt-token'
        }
      });
    });

    it('should call next with error when fetching user fails', async () => {
      const mockError = new Error('Database error');
      mockRequest.payload = { id: 'user123' };
      (User.findById as jest.Mock).mockRejectedValue(mockError);

      const route = authController.stack.find(r => r.route?.path === '/user' && r.route?.methods.get);
      await route?.route?.stack[1].handle(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('PUT /user - Update Current User', () => {
    it('should return 401 when userId is not in payload', async () => {
      mockRequest.payload = undefined;
      mockRequest.body = { user: { username: 'newusername' } };

      const route = authController.stack.find(r => r.route?.path === '/user' && r.route?.methods.put);
      await route?.route?.stack[1].handle(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.sendStatus).toHaveBeenCalledWith(401);
    });

    it('should return 401 when user is not found', async () => {
      mockRequest.payload = { id: 'user123' };
      mockRequest.body = { user: { username: 'newusername' } };
      (User.findById as jest.Mock).mockResolvedValue(null);

      const route = authController.stack.find(r => r.route?.path === '/user' && r.route?.methods.put);
      await route?.route?.stack[1].handle(mockRequest as Request, mockResponse as Response, mockNext);

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(mockResponse.sendStatus).toHaveBeenCalledWith(401);
    });

    it('should update username when provided', async () => {
      const mockUser = {
        username: 'oldusername',
        save: jest.fn().mockResolvedValue(undefined),
        toAuthJSON: jest.fn().mockReturnValue({
          username: 'newusername',
          email: 'test@example.com',
          token: 'jwt-token'
        })
      };

      mockRequest.payload = { id: 'user123' };
      mockRequest.body = { user: { username: 'newusername' } };
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const route = authController.stack.find(r => r.route?.path === '/user' && r.route?.methods.put);
      await route?.route?.stack[1].handle(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUser.username).toBe('newusername');
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        user: {
          username: 'newusername',
          email: 'test@example.com',
          token: 'jwt-token'
        }
      });
    });

    it('should update email when provided', async () => {
      const mockUser = {
        email: 'old@example.com',
        save: jest.fn().mockResolvedValue(undefined),
        toAuthJSON: jest.fn().mockReturnValue({
          username: 'testuser',
          email: 'new@example.com',
          token: 'jwt-token'
        })
      };

      mockRequest.payload = { id: 'user123' };
      mockRequest.body = { user: { email: 'new@example.com' } };
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const route = authController.stack.find(r => r.route?.path === '/user' && r.route?.methods.put);
      await route?.route?.stack[1].handle(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUser.email).toBe('new@example.com');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should update bio when provided', async () => {
      const mockUser = {
        bio: 'old bio',
        save: jest.fn().mockResolvedValue(undefined),
        toAuthJSON: jest.fn().mockReturnValue({
          username: 'testuser',
          email: 'test@example.com',
          bio: 'new bio',
          token: 'jwt-token'
        })
      };

      mockRequest.payload = { id: 'user123' };
      mockRequest.body = { user: { bio: 'new bio' } };
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const route = authController.stack.find(r => r.route?.path === '/user' && r.route?.methods.put);
      await route?.route?.stack[1].handle(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUser.bio).toBe('new bio');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should update image when provided', async () => {
      const mockUser = {
        image: 'old-image.jpg',
        save: jest.fn().mockResolvedValue(undefined),
        toAuthJSON: jest.fn().mockReturnValue({
          username: 'testuser',
          email: 'test@example.com',
          image: 'new-image.jpg',
          token: 'jwt-token'
        })
      };

      mockRequest.payload = { id: 'user123' };
      mockRequest.body = { user: { image: 'new-image.jpg' } };
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const route = authController.stack.find(r => r.route?.path === '/user' && r.route?.methods.put);
      await route?.route?.stack[1].handle(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUser.image).toBe('new-image.jpg');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should update password when provided', async () => {
      const mockUser = {
        setPassword: jest.fn().mockResolvedValue(undefined),
        save: jest.fn().mockResolvedValue(undefined),
        toAuthJSON: jest.fn().mockReturnValue({
          username: 'testuser',
          email: 'test@example.com',
          token: 'jwt-token'
        })
      };

      mockRequest.payload = { id: 'user123' };
      mockRequest.body = { user: { password: 'newpassword123' } };
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const route = authController.stack.find(r => r.route?.path === '/user' && r.route?.methods.put);
      await route?.route?.stack[1].handle(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUser.setPassword).toHaveBeenCalledWith('newpassword123');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should update multiple fields simultaneously', async () => {
      const mockUser = {
        username: 'oldusername',
        email: 'old@example.com',
        bio: 'old bio',
        image: 'old-image.jpg',
        setPassword: jest.fn().mockResolvedValue(undefined),
        save: jest.fn().mockResolvedValue(undefined),
        toAuthJSON: jest.fn().mockReturnValue({
          username: 'newusername',
          email: 'new@example.com',
          bio: 'new bio',
          image: 'new-image.jpg',
          token: 'jwt-token'
        })
      };

      mockRequest.payload = { id: 'user123' };
      mockRequest.body = {
        user: {
          username: 'newusername',
          email: 'new@example.com',
          bio: 'new bio',
          image: 'new-image.jpg',
          password: 'newpassword123'
        }
      };
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const route = authController.stack.find(r => r.route?.path === '/user' && r.route?.methods.put);
      await route?.route?.stack[1].handle(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUser.username).toBe('newusername');
      expect(mockUser.email).toBe('new@example.com');
      expect(mockUser.bio).toBe('new bio');
      expect(mockUser.image).toBe('new-image.jpg');
      expect(mockUser.setPassword).toHaveBeenCalledWith('newpassword123');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should not update fields when undefined', async () => {
      const mockUser = {
        username: 'testuser',
        email: 'test@example.com',
        bio: 'test bio',
        image: 'test-image.jpg',
        save: jest.fn().mockResolvedValue(undefined),
        toAuthJSON: jest.fn().mockReturnValue({
          username: 'testuser',
          email: 'test@example.com',
          token: 'jwt-token'
        })
      };

      mockRequest.payload = { id: 'user123' };
      mockRequest.body = { user: {} };
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const route = authController.stack.find(r => r.route?.path === '/user' && r.route?.methods.put);
      await route?.route?.stack[1].handle(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUser.username).toBe('testuser');
      expect(mockUser.email).toBe('test@example.com');
      expect(mockUser.bio).toBe('test bio');
      expect(mockUser.image).toBe('test-image.jpg');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should call next with error when update fails', async () => {
      const mockError = new Error('Database error');
      mockRequest.payload = { id: 'user123' };
      mockRequest.body = { user: { username: 'newusername' } };
      (User.findById as jest.Mock).mockRejectedValue(mockError);

      const route = authController.stack.find(r => r.route?.path === '/user' && r.route?.methods.put);
      await route?.route?.stack[1].handle(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('Verification: No Article Data in Auth Responses', () => {
    it('should verify registration response does not contain article data', async () => {
      const mockUser = {
        username: 'testuser',
        email: 'test@example.com',
        setPassword: jest.fn().mockResolvedValue(undefined),
        save: jest.fn().mockResolvedValue(undefined),
        toAuthJSON: jest.fn().mockReturnValue({
          username: 'testuser',
          email: 'test@example.com',
          token: 'jwt-token',
          bio: 'test bio',
          image: 'test-image.jpg'
        })
      };

      (User as jest.MockedClass<typeof User>).mockImplementation(() => mockUser as any);

      mockRequest.body = {
        user: {
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        }
      };

      const route = authController.stack.find(r => r.route?.path === '/users' && r.route?.methods.post);
      await route?.route?.stack[0].handle(mockRequest as Request, mockResponse as Response, mockNext);

      const responseData = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(responseData.user).toBeDefined();
      expect(responseData.user.articles).toBeUndefined();
      expect(responseData.user.readingTime).toBeUndefined();
    });

    it('should verify login response does not contain article data', async () => {
      const mockUser = {
        validatePassword: jest.fn().mockResolvedValue(true),
        toAuthJSON: jest.fn().mockReturnValue({
          username: 'testuser',
          email: 'test@example.com',
          token: 'jwt-token'
        })
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      mockRequest.body = {
        user: {
          email: 'test@example.com',
          password: 'password123'
        }
      };

      const route = authController.stack.find(r => r.route?.path === '/users/login' && r.route?.methods.post);
      await route?.route?.stack[0].handle(mockRequest as Request, mockResponse as Response, mockNext);

      const responseData = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(responseData.user).toBeDefined();
      expect(responseData.user.articles).toBeUndefined();
      expect(responseData.user.readingTime).toBeUndefined();
    });

    it('should verify get current user response does not contain article data', async () => {
      const mockUser = {
        toAuthJSON: jest.fn().mockReturnValue({
          username: 'testuser',
          email: 'test@example.com',
          token: 'jwt-token'
        })
      };

      mockRequest.payload = { id: 'user123' };
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const route = authController.stack.find(r => r.route?.path === '/user' && r.route?.methods.get);
      await route?.route?.stack[1].handle(mockRequest as Request, mockResponse as Response, mockNext);

      const responseData = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(responseData.user).toBeDefined();
      expect(responseData.user.articles).toBeUndefined();
      expect(responseData.user.readingTime).toBeUndefined();
    });

    it('should verify update user response does not contain article data', async () => {
      const mockUser = {
        username: 'testuser',
        save: jest.fn().mockResolvedValue(undefined),
        toAuthJSON: jest.fn().mockReturnValue({
          username: 'newusername',
          email: 'test@example.com',
          token: 'jwt-token'
        })
      };

      mockRequest.payload = { id: 'user123' };
      mockRequest.body = { user: { username: 'newusername' } };
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const route = authController.stack.find(r => r.route?.path === '/user' && r.route?.methods.put);
      await route?.route?.stack[1].handle(mockRequest as Request, mockResponse as Response, mockNext);

      const responseData = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(responseData.user).toBeDefined();
      expect(responseData.user.articles).toBeUndefined();
      expect(responseData.user.readingTime).toBeUndefined();
    });
  });
});