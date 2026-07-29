import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { auth } from './auth';
import { User } from '../../models/user.model';

jest.mock('jsonwebtoken');
jest.mock('../../models/user.model');

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    
    mockRequest = {
      headers: {}
    };
    
    mockResponse = {
      status: statusMock,
      json: jsonMock
    };
    
    mockNext = jest.fn();
    
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTokenFromHeaders', () => {
    it('should extract token with Token prefix', async () => {
      mockRequest.headers = {
        authorization: 'Token validtoken123'
      };

      const mockUser = { id: 'user123', email: 'test@example.com' };
      (jwt.verify as jest.Mock).mockReturnValue({ id: 'user123' });
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      await auth.required(mockRequest as Request, mockResponse as Response, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith('validtoken123', 'test-secret');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should extract token with Bearer prefix', async () => {
      mockRequest.headers = {
        authorization: 'Bearer validtoken456'
      };

      const mockUser = { id: 'user456', email: 'test2@example.com' };
      (jwt.verify as jest.Mock).mockReturnValue({ id: 'user456' });
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      await auth.required(mockRequest as Request, mockResponse as Response, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith('validtoken456', 'test-secret');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return null when no authorization header is present', async () => {
      mockRequest.headers = {};

      await auth.required(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'No authorization token was found' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return null when authorization header has invalid format', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token123'
      };

      await auth.required(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'No authorization token was found' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('auth.required', () => {
    it('should return 401 when no token is provided', async () => {
      mockRequest.headers = {};

      await auth.required(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'No authorization token was found' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token is invalid', async () => {
      mockRequest.headers = {
        authorization: 'Token invalidtoken'
      };

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await auth.required(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token is expired', async () => {
      mockRequest.headers = {
        authorization: 'Token expiredtoken'
      };

      (jwt.verify as jest.Mock).mockImplementation(() => {
        const error: any = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      await auth.required(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token is malformed', async () => {
      mockRequest.headers = {
        authorization: 'Token malformedtoken'
      };

      (jwt.verify as jest.Mock).mockImplementation(() => {
        const error: any = new Error('jwt malformed');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      await auth.required(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when decoded token has no user id', async () => {
      mockRequest.headers = {
        authorization: 'Token validtoken'
      };

      (jwt.verify as jest.Mock).mockReturnValue({ email: 'test@example.com' });

      await auth.required(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not found in database', async () => {
      mockRequest.headers = {
        authorization: 'Token validtoken'
      };

      (jwt.verify as jest.Mock).mockReturnValue({ id: 'nonexistentuser' });
      (User.findById as jest.Mock).mockResolvedValue(null);

      await auth.required(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 when database lookup fails', async () => {
      mockRequest.headers = {
        authorization: 'Token validtoken'
      };

      (jwt.verify as jest.Mock).mockReturnValue({ id: 'user123' });
      (User.findById as jest.Mock).mockRejectedValue(new Error('Database connection error'));

      await auth.required(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Database lookup failed' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should attach user to request and call next on successful authentication', async () => {
      mockRequest.headers = {
        authorization: 'Token validtoken'
      };

      const mockUser = { id: 'user123', email: 'test@example.com', name: 'Test User' };
      (jwt.verify as jest.Mock).mockReturnValue({ id: 'user123' });
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      await auth.required(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as any).user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should use JWT_SECRET from environment variable', async () => {
      process.env.JWT_SECRET = 'custom-secret';
      mockRequest.headers = {
        authorization: 'Token validtoken'
      };

      const mockUser = { id: 'user123', email: 'test@example.com' };
      (jwt.verify as jest.Mock).mockReturnValue({ id: 'user123' });
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      await auth.required(mockRequest as Request, mockResponse as Response, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith('validtoken', 'custom-secret');
    });

    it('should use default secret when JWT_SECRET is not set', async () => {
      delete process.env.JWT_SECRET;
      mockRequest.headers = {
        authorization: 'Token validtoken'
      };

      const mockUser = { id: 'user123', email: 'test@example.com' };
      (jwt.verify as jest.Mock).mockReturnValue({ id: 'user123' });
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      await auth.required(mockRequest as Request, mockResponse as Response, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith('validtoken', 'secret');
    });
  });

  describe('auth.optional', () => {
    it('should set user to null and call next when no token is provided', async () => {
      mockRequest.headers = {};

      await auth.optional(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as any).user).toBeNull();
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should set user to null and call next when token is invalid', async () => {
      mockRequest.headers = {
        authorization: 'Token invalidtoken'
      };

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await auth.optional(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as any).user).toBeNull();
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should set user to null and call next when token is expired', async () => {
      mockRequest.headers = {
        authorization: 'Token expiredtoken'
      };

      (jwt.verify as jest.Mock).mockImplementation(() => {
        const error: any = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      await auth.optional(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as any).user).toBeNull();
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should set user to null and call next when token is malformed', async () => {
      mockRequest.headers = {
        authorization: 'Token malformedtoken'
      };

      (jwt.verify as jest.Mock).mockImplementation(() => {
        const error: any = new Error('jwt malformed');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      await auth.optional(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as any).user).toBeNull();
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should set user to null and call next when decoded token has no user id', async () => {
      mockRequest.headers = {
        authorization: 'Token validtoken'
      };

      (jwt.verify as jest.Mock).mockReturnValue({ email: 'test@example.com' });

      await auth.optional(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as any).user).toBeNull();
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should set user to null and call next when user is not found in database', async () => {
      mockRequest.headers = {
        authorization: 'Token validtoken'
      };

      (jwt.verify as jest.Mock).mockReturnValue({ id: 'nonexistentuser' });
      (User.findById as jest.Mock).mockResolvedValue(null);

      await auth.optional(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as any).user).toBeNull();
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should set user to null and call next when database lookup fails', async () => {
      mockRequest.headers = {
        authorization: 'Token validtoken'
      };

      (jwt.verify as jest.Mock).mockReturnValue({ id: 'user123' });
      (User.findById as jest.Mock).mockRejectedValue(new Error('Database connection error'));

      await auth.optional(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as any).user).toBeNull();
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should attach user to request and call next on successful authentication', async () => {
      mockRequest.headers = {
        authorization: 'Token validtoken'
      };

      const mockUser = { id: 'user123', email: 'test@example.com', name: 'Test User' };
      (jwt.verify as jest.Mock).mockReturnValue({ id: 'user123' });
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      await auth.optional(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as any).user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should never throw errors for any failure scenario', async () => {
      const scenarios = [
        { headers: {} },
        { headers: { authorization: 'Token invalidtoken' } },
        { headers: { authorization: 'InvalidFormat token' } }
      ];

      for (const scenario of scenarios) {
        mockRequest.headers = scenario.headers;
        (jwt.verify as jest.Mock).mockImplementation(() => {
          throw new Error('Any error');
        });

        await expect(
          auth.optional(mockRequest as Request, mockResponse as Response, mockNext)
        ).resolves.not.toThrow();

        expect(mockNext).toHaveBeenCalled();
        expect(statusMock).not.toHaveBeenCalled();
        
        jest.clearAllMocks();
      }
    });

    it('should support Bearer token format', async () => {
      mockRequest.headers = {
        authorization: 'Bearer validtoken789'
      };

      const mockUser = { id: 'user789', email: 'bearer@example.com' };
      (jwt.verify as jest.Mock).mockReturnValue({ id: 'user789' });
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      await auth.optional(mockRequest as Request, mockResponse as Response, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith('validtoken789', 'test-secret');
      expect((mockRequest as any).user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle unexpected errors gracefully', async () => {
      mockRequest.headers = {
        authorization: 'Token validtoken'
      };

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      await auth.optional(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as any).user).toBeNull();
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain compatibility with Token authorization scheme', async () => {
      mockRequest.headers = {
        authorization: 'Token legacytoken'
      };

      const mockUser = { id: 'legacy123', email: 'legacy@example.com' };
      (jwt.verify as jest.Mock).mockReturnValue({ id: 'legacy123' });
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      await auth.required(mockRequest as Request, mockResponse as Response, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith('legacytoken', 'test-secret');
      expect((mockRequest as any).user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should maintain compatibility with Bearer authorization scheme', async () => {
      mockRequest.headers = {
        authorization: 'Bearer moderntoken'
      };

      const mockUser = { id: 'modern123', email: 'modern@example.com' };
      (jwt.verify as jest.Mock).mockReturnValue({ id: 'modern123' });
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      await auth.required(mockRequest as Request, mockResponse as Response, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith('moderntoken', 'test-secret');
      expect((mockRequest as any).user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Error Status Codes', () => {
    it('should return 401 for missing token in required middleware', async () => {
      mockRequest.headers = {};

      await auth.required(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it('should return 401 for invalid token in required middleware', async () => {
      mockRequest.headers = {
        authorization: 'Token invalidtoken'
      };

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid');
      });

      await auth.required(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it('should return 500 for database errors in required middleware', async () => {
      mockRequest.headers = {
        authorization: 'Token validtoken'
      };

      (jwt.verify as jest.Mock).mockReturnValue({ id: 'user123' });
      (User.findById as jest.Mock).mockRejectedValue(new Error('DB Error'));

      await auth.required(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });
});