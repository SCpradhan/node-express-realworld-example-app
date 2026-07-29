import { Request, Response, NextFunction } from 'express';
import profileRouter from './profile.controller';
import { auth } from '../auth/auth';
import { profileService } from '../../services/profile.service';

jest.mock('../auth/auth');
jest.mock('../../services/profile.service');

describe('Profile Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    
    mockRequest = {
      params: {},
      user: undefined
    };
    
    mockResponse = {
      status: statusMock,
      json: jsonMock
    };
    
    mockNext = jest.fn();
    
    jest.clearAllMocks();
  });

  describe('GET /profiles/:username', () => {
    it('should retrieve profile for authenticated user with userId', async () => {
      const username = 'testuser';
      const userId = 'user123';
      const mockProfileData = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        following: true
      };

      mockRequest.params = { username };
      mockRequest.user = { id: userId };

      (profileService.getProfile as jest.Mock).mockResolvedValue(mockProfileData);

      const handler = (profileRouter as any).stack.find(
        (layer: any) => layer.route?.path === '/:username' && layer.route?.methods.get
      ).route.stack[1].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(profileService.getProfile).toHaveBeenCalledWith(username, userId);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ profile: mockProfileData });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should retrieve profile for anonymous user with null userId', async () => {
      const username = 'testuser';
      const mockProfileData = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        following: false
      };

      mockRequest.params = { username };
      mockRequest.user = undefined;

      (profileService.getProfile as jest.Mock).mockResolvedValue(mockProfileData);

      const handler = (profileRouter as any).stack.find(
        (layer: any) => layer.route?.path === '/:username' && layer.route?.methods.get
      ).route.stack[1].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(profileService.getProfile).toHaveBeenCalledWith(username, null);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ profile: mockProfileData });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should extract username from req.params.username', async () => {
      const username = 'johndoe';
      const mockProfileData = { username: 'johndoe', bio: '', image: '', following: false };

      mockRequest.params = { username };
      mockRequest.user = undefined;

      (profileService.getProfile as jest.Mock).mockResolvedValue(mockProfileData);

      const handler = (profileRouter as any).stack.find(
        (layer: any) => layer.route?.path === '/:username' && layer.route?.methods.get
      ).route.stack[1].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(profileService.getProfile).toHaveBeenCalledWith(username, null);
    });

    it('should handle errors and pass to next middleware', async () => {
      const username = 'testuser';
      const error = new Error('Profile not found');

      mockRequest.params = { username };
      mockRequest.user = undefined;

      (profileService.getProfile as jest.Mock).mockRejectedValue(error);

      const handler = (profileRouter as any).stack.find(
        (layer: any) => layer.route?.path === '/:username' && layer.route?.methods.get
      ).route.stack[1].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(statusMock).not.toHaveBeenCalled();
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it('should return response in format { profile: {...} }', async () => {
      const username = 'testuser';
      const mockProfileData = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        following: false
      };

      mockRequest.params = { username };
      mockRequest.user = undefined;

      (profileService.getProfile as jest.Mock).mockResolvedValue(mockProfileData);

      const handler = (profileRouter as any).stack.find(
        (layer: any) => layer.route?.path === '/:username' && layer.route?.methods.get
      ).route.stack[1].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(jsonMock).toHaveBeenCalledWith({ profile: mockProfileData });
    });
  });

  describe('POST /profiles/:username/follow', () => {
    it('should follow user and return updated profile with following: true', async () => {
      const username = 'targetuser';
      const userId = 'user123';
      const mockUpdatedProfile = {
        username: 'targetuser',
        bio: 'Target bio',
        image: 'http://example.com/target.jpg',
        following: true
      };

      mockRequest.params = { username };
      mockRequest.user = { id: userId };

      (profileService.followUser as jest.Mock).mockResolvedValue(mockUpdatedProfile);

      const handler = (profileRouter as any).stack.find(
        (layer: any) => layer.route?.path === '/:username/follow' && layer.route?.methods.post
      ).route.stack[1].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(profileService.followUser).toHaveBeenCalledWith(userId, username);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ profile: mockUpdatedProfile });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should extract username from req.params.username', async () => {
      const username = 'followme';
      const userId = 'user123';
      const mockUpdatedProfile = { username: 'followme', bio: '', image: '', following: true };

      mockRequest.params = { username };
      mockRequest.user = { id: userId };

      (profileService.followUser as jest.Mock).mockResolvedValue(mockUpdatedProfile);

      const handler = (profileRouter as any).stack.find(
        (layer: any) => layer.route?.path === '/:username/follow' && layer.route?.methods.post
      ).route.stack[1].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(profileService.followUser).toHaveBeenCalledWith(userId, username);
    });

    it('should extract userId from req.user.id', async () => {
      const username = 'targetuser';
      const userId = 'authenticatedUser456';
      const mockUpdatedProfile = { username: 'targetuser', bio: '', image: '', following: true };

      mockRequest.params = { username };
      mockRequest.user = { id: userId };

      (profileService.followUser as jest.Mock).mockResolvedValue(mockUpdatedProfile);

      const handler = (profileRouter as any).stack.find(
        (layer: any) => layer.route?.path === '/:username/follow' && layer.route?.methods.post
      ).route.stack[1].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(profileService.followUser).toHaveBeenCalledWith(userId, username);
    });

    it('should handle errors and pass to next middleware', async () => {
      const username = 'targetuser';
      const userId = 'user123';
      const error = new Error('Cannot follow user');

      mockRequest.params = { username };
      mockRequest.user = { id: userId };

      (profileService.followUser as jest.Mock).mockRejectedValue(error);

      const handler = (profileRouter as any).stack.find(
        (layer: any) => layer.route?.path === '/:username/follow' && layer.route?.methods.post
      ).route.stack[1].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(statusMock).not.toHaveBeenCalled();
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it('should return response in format { profile: {...} }', async () => {
      const username = 'targetuser';
      const userId = 'user123';
      const mockUpdatedProfile = {
        username: 'targetuser',
        bio: 'Target bio',
        image: 'http://example.com/target.jpg',
        following: true
      };

      mockRequest.params = { username };
      mockRequest.user = { id: userId };

      (profileService.followUser as jest.Mock).mockResolvedValue(mockUpdatedProfile);

      const handler = (profileRouter as any).stack.find(
        (layer: any) => layer.route?.path === '/:username/follow' && layer.route?.methods.post
      ).route.stack[1].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(jsonMock).toHaveBeenCalledWith({ profile: mockUpdatedProfile });
    });
  });

  describe('DELETE /profiles/:username/follow', () => {
    it('should unfollow user and return updated profile with following: false', async () => {
      const username = 'targetuser';
      const userId = 'user123';
      const mockUpdatedProfile = {
        username: 'targetuser',
        bio: 'Target bio',
        image: 'http://example.com/target.jpg',
        following: false
      };

      mockRequest.params = { username };
      mockRequest.user = { id: userId };

      (profileService.unfollowUser as jest.Mock).mockResolvedValue(mockUpdatedProfile);

      const handler = (profileRouter as any).stack.find(
        (layer: any) => layer.route?.path === '/:username/follow' && layer.route?.methods.delete
      ).route.stack[1].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(profileService.unfollowUser).toHaveBeenCalledWith(userId, username);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ profile: mockUpdatedProfile });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should extract username from req.params.username', async () => {
      const username = 'unfollowme';
      const userId = 'user123';
      const mockUpdatedProfile = { username: 'unfollowme', bio: '', image: '', following: false };

      mockRequest.params = { username };
      mockRequest.user = { id: userId };

      (profileService.unfollowUser as jest.Mock).mockResolvedValue(mockUpdatedProfile);

      const handler = (profileRouter as any).stack.find(
        (layer: any) => layer.route?.path === '/:username/follow' && layer.route?.methods.delete
      ).route.stack[1].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(profileService.unfollowUser).toHaveBeenCalledWith(userId, username);
    });

    it('should extract userId from req.user.id', async () => {
      const username = 'targetuser';
      const userId = 'authenticatedUser789';
      const mockUpdatedProfile = { username: 'targetuser', bio: '', image: '', following: false };

      mockRequest.params = { username };
      mockRequest.user = { id: userId };

      (profileService.unfollowUser as jest.Mock).mockResolvedValue(mockUpdatedProfile);

      const handler = (profileRouter as any).stack.find(
        (layer: any) => layer.route?.path === '/:username/follow' && layer.route?.methods.delete
      ).route.stack[1].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(profileService.unfollowUser).toHaveBeenCalledWith(userId, username);
    });

    it('should handle errors and pass to next middleware', async () => {
      const username = 'targetuser';
      const userId = 'user123';
      const error = new Error('Cannot unfollow user');

      mockRequest.params = { username };
      mockRequest.user = { id: userId };

      (profileService.unfollowUser as jest.Mock).mockRejectedValue(error);

      const handler = (profileRouter as any).stack.find(
        (layer: any) => layer.route?.path === '/:username/follow' && layer.route?.methods.delete
      ).route.stack[1].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(statusMock).not.toHaveBeenCalled();
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it('should return response in format { profile: {...} }', async () => {
      const username = 'targetuser';
      const userId = 'user123';
      const mockUpdatedProfile = {
        username: 'targetuser',
        bio: 'Target bio',
        image: 'http://example.com/target.jpg',
        following: false
      };

      mockRequest.params = { username };
      mockRequest.user = { id: userId };

      (profileService.unfollowUser as jest.Mock).mockResolvedValue(mockUpdatedProfile);

      const handler = (profileRouter as any).stack.find(
        (layer: any) => layer.route?.path === '/:username/follow' && layer.route?.methods.delete
      ).route.stack[1].handle;

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(jsonMock).toHaveBeenCalledWith({ profile: mockUpdatedProfile });
    });
  });

  describe('Middleware Integration', () => {
    it('should apply auth.optional middleware to GET /profiles/:username', () => {
      const getRoute = (profileRouter as any).stack.find(
        (layer: any) => layer.route?.path === '/:username' && layer.route?.methods.get
      );

      expect(getRoute).toBeDefined();
      expect(getRoute.route.stack[0].handle).toBe(auth.optional);
    });

    it('should apply auth.required middleware to POST /profiles/:username/follow', () => {
      const postRoute = (profileRouter as any).stack.find(
        (layer: any) => layer.route?.path === '/:username/follow' && layer.route?.methods.post
      );

      expect(postRoute).toBeDefined();
      expect(postRoute.route.stack[0].handle).toBe(auth.required);
    });

    it('should apply auth.required middleware to DELETE /profiles/:username/follow', () => {
      const deleteRoute = (profileRouter as any).stack.find(
        (layer: any) => layer.route?.path === '/:username/follow' && layer.route?.methods.delete
      );

      expect(deleteRoute).toBeDefined();
      expect(deleteRoute.route.stack[0].handle).toBe(auth.required);
    });
  });

  describe('Route Path Validation', () => {
    it('should define GET endpoint at /profiles/:username', () => {
      const getRoute = (profileRouter as any).stack.find(
        (layer: any) => layer.route?.path === '/:username' && layer.route?.methods.get
      );

      expect(getRoute).toBeDefined();
      expect(getRoute.route.path).toBe('/:username');
    });

    it('should define POST endpoint at /profiles/:username/follow', () => {
      const postRoute = (profileRouter as any).stack.find(
        (layer: any) => layer.route?.path === '/:username/follow' && layer.route?.methods.post
      );

      expect(postRoute).toBeDefined();
      expect(postRoute.route.path).toBe('/:username/follow');
    });

    it('should define DELETE endpoint at /profiles/:username/follow', () => {
      const deleteRoute = (profileRouter as any).stack.find(
        (layer: any) => layer.route?.path === '/:username/follow' && layer.route?.methods.delete
      );

      expect(deleteRoute).toBeDefined();
      expect(deleteRoute.route.path).toBe('/:username/follow');
    });
  });
});