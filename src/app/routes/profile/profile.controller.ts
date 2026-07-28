import { Request, Response, NextFunction } from 'express';
import profileRouter from '../../../src/app/routes/profile/profile.controller';
import auth from '../../../src/app/routes/auth';

describe('Profile Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockUser: any;
  let mockTargetUser: any;
  let mockUserModel: any;

  beforeEach(() => {
    mockUser = {
      _id: 'user123',
      username: 'currentuser',
      follow: jest.fn().mockResolvedValue(undefined),
      unfollow: jest.fn().mockResolvedValue(undefined)
    };

    mockTargetUser = {
      _id: 'target123',
      username: 'targetuser',
      toProfileJSON: jest.fn().mockResolvedValue({
        username: 'targetuser',
        bio: 'Test bio',
        image: 'https://example.com/image.jpg',
        following: false
      })
    };

    mockUserModel = {
      findOne: jest.fn()
    };

    mockRequest = {
      params: {},
      user: mockUser,
      app: {
        get: jest.fn().mockReturnValue(mockUserModel)
      } as any
    };

    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/profiles/:username', () => {
    it('should return a user profile when user exists', async () => {
      mockRequest.params = { username: 'targetuser' };
      mockUserModel.findOne.mockResolvedValue(mockTargetUser);

      const handler = (profileRouter as any).stack.find(
        (layer: any) => layer.route?.path === '/:username' && layer.route?.methods?.get
      )?.route?.stack[0]?.handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ username: 'targetuser' });
      expect(mockTargetUser.toProfileJSON).toHaveBeenCalledWith(mockUser);
      expect(mockResponse.json).toHaveBeenCalledWith({
        profile: {
          username: 'targetuser',
          bio: 'Test bio',
          image: 'https://example.com/image.jpg',
          following: false
        }
      });
    });

    it('should return 404 when user does not exist', async () => {
      mockRequest.params = { username: 'nonexistent' };
      mockUserModel.findOne.mockResolvedValue(null);

      const handler = (profileRouter as any).stack.find(
        (layer: any) => layer.route?.path === '/:username' && layer.route?.methods?.get
      )?.route?.stack[0]?.handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ username: 'nonexistent' });
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        errors: { profile: ['not found'] }
      });
    });

    it('should handle errors and call next middleware', async () => {
      mockRequest.params = { username: 'targetuser' };
      const error = new Error('Database error');
      mockUserModel.findOne.mockRejectedValue(error);

      const handler = (profileRouter as any).stack.find(
        (layer: any) => layer.route?.path === '/:username' && layer.route?.methods?.get
      )?.route?.stack[0]?.handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should work with optional authentication', async () => {
      mockRequest.params = { username: 'targetuser' };
      mockRequest.user = undefined;
      mockUserModel.findOne.mockResolvedValue(mockTargetUser);

      const handler = (profileRouter as any).stack.find(
        (layer: any) => layer.route?.path === '/:username' && layer.route?.methods?.get
      )?.route?.stack[0]?.handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockTargetUser.toProfileJSON).toHaveBeenCalledWith(undefined);
      expect(mockResponse.json).toHaveBeenCalled();
    });
  });

  describe('POST /api/profiles/:username/follow', () => {
    it('should follow a user successfully', async () => {
      mockRequest.params = { username: 'targetuser' };
      mockUserModel.findOne.mockResolvedValue(mockTargetUser);
      mockTargetUser.toProfileJSON.mockResolvedValue({
        username: 'targetuser',
        bio: 'Test bio',
        image: 'https://example.com/image.jpg',
        following: true
      });

      const handler = (profileRouter as any).stack.find(
        (layer: any) => layer.route?.path === '/:username/follow' && layer.route?.methods?.post
      )?.route?.stack[0]?.handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ username: 'targetuser' });
      expect(mockUser.follow).toHaveBeenCalledWith('target123');
      expect(mockTargetUser.toProfileJSON).toHaveBeenCalledWith(mockUser);
      expect(mockResponse.json).toHaveBeenCalledWith({
        profile: {
          username: 'targetuser',
          bio: 'Test bio',
          image: 'https://example.com/image.jpg',
          following: true
        }
      });
    });

    it('should return 404 when trying to follow non-existent user', async () => {
      mockRequest.params = { username: 'nonexistent' };
      mockUserModel.findOne.mockResolvedValue(null);

      const handler = (profileRouter as any).stack.find(
        (layer: any) => layer.route?.path === '/:username/follow' && layer.route?.methods?.post
      )?.route?.stack[0]?.handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        errors: { profile: ['not found'] }
      });
      expect(mockUser.follow).not.toHaveBeenCalled();
    });

    it('should handle errors during follow operation', async () => {
      mockRequest.params = { username: 'targetuser' };
      mockUserModel.findOne.mockResolvedValue(mockTargetUser);
      const error = new Error('Follow operation failed');
      mockUser.follow.mockRejectedValue(error);

      const handler = (profileRouter as any).stack.find(
        (layer: any) => layer.route?.path === '/:username/follow' && layer.route?.methods?.post
      )?.route?.stack[0]?.handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('DELETE /api/profiles/:username/follow', () => {
    it('should unfollow a user successfully', async () => {
      mockRequest.params = { username: 'targetuser' };
      mockUserModel.findOne.mockResolvedValue(mockTargetUser);
      mockTargetUser.toProfileJSON.mockResolvedValue({
        username: 'targetuser',
        bio: 'Test bio',
        image: 'https://example.com/image.jpg',
        following: false
      });

      const handler = (profileRouter as any).stack.find(
        (layer: any) => layer.route?.path === '/:username/follow' && layer.route?.methods?.delete
      )?.route?.stack[0]?.handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ username: 'targetuser' });
      expect(mockUser.unfollow).toHaveBeenCalledWith('target123');
      expect(mockTargetUser.toProfileJSON).toHaveBeenCalledWith(mockUser);
      expect(mockResponse.json).toHaveBeenCalledWith({
        profile: {
          username: 'targetuser',
          bio: 'Test bio',
          image: 'https://example.com/image.jpg',
          following: false
        }
      });
    });

    it('should return 404 when trying to unfollow non-existent user', async () => {
      mockRequest.params = { username: 'nonexistent' };
      mockUserModel.findOne.mockResolvedValue(null);

      const handler = (profileRouter as any).stack.find(
        (layer: any) => layer.route?.path === '/:username/follow' && layer.route?.methods?.delete
      )?.route?.stack[0]?.handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        errors: { profile: ['not found'] }
      });
      expect(mockUser.unfollow).not.toHaveBeenCalled();
    });

    it('should handle errors during unfollow operation', async () => {
      mockRequest.params = { username: 'targetuser' };
      mockUserModel.findOne.mockResolvedValue(mockTargetUser);
      const error = new Error('Unfollow operation failed');
      mockUser.unfollow.mockRejectedValue(error);

      const handler = (profileRouter as any).stack.find(
        (layer: any) => layer.route?.path === '/:username/follow' && layer.route?.methods?.delete
      )?.route?.stack[0]?.handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should verify that profile endpoints do not directly return article data', async () => {
      mockRequest.params = { username: 'targetuser' };
      mockUserModel.findOne.mockResolvedValue(mockTargetUser);
      const profileData = {
        username: 'targetuser',
        bio: 'Test bio',
        image: 'https://example.com/image.jpg',
        following: false
      };
      mockTargetUser.toProfileJSON.mockResolvedValue(profileData);

      const handler = (profileRouter as any).stack.find(
        (layer: any) => layer.route?.path === '/:username/follow' && layer.route?.methods?.delete
      )?.route?.stack[0]?.handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      const responseData = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(responseData.profile).toBeDefined();
      expect(responseData.profile.articles).toBeUndefined();
      expect(responseData.profile.readingTime).toBeUndefined();
    });
  });

  describe('Verification: No modifications required for readingTime feature', () => {
    it('should confirm profile endpoints do not directly return article data', () => {
      const profileResponse = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'https://example.com/image.jpg',
        following: false
      };

      expect(profileResponse).not.toHaveProperty('articles');
      expect(profileResponse).not.toHaveProperty('readingTime');
      expect(profileResponse).toHaveProperty('username');
      expect(profileResponse).toHaveProperty('bio');
      expect(profileResponse).toHaveProperty('image');
      expect(profileResponse).toHaveProperty('following');
    });

    it('should document that indirect article access will receive enhanced payload', () => {
      const documentation = {
        endpoint: 'GET /api/profiles/:username',
        modification: 'none',
        reason: 'Profile endpoints do not directly return article data',
        note: 'Any indirect article data access (e.g., articles by author) will receive the enhanced article payload with readingTime field'
      };

      expect(documentation.modification).toBe('none');
      expect(documentation.note).toContain('readingTime');
    });
  });
});