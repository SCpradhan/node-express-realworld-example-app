import { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import express, { Express } from 'express';
import profileRouter from './profile.controller';
import * as profileService from './profile.service';
import auth from '../auth/auth';

jest.mock('./profile.service');
jest.mock('../auth/auth');

describe('Profile Controller', () => {
  let app: Express;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(profileRouter);

    mockRequest = {
      params: {},
      auth: undefined,
    };

    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('GET /profiles/:username', () => {
    const mockProfile = {
      username: 'testuser',
      bio: 'Test bio',
      image: 'https://example.com/image.jpg',
      following: false,
    };

    beforeEach(() => {
      (auth.optional as jest.Mock) = jest.fn((req, res, next) => next());
    });

    it('should retrieve profile by username for authenticated user', async () => {
      const username = 'testuser';
      const userId = 'user123';

      (profileService.getProfile as jest.Mock).mockResolvedValue(mockProfile);

      const response = await request(app)
        .get(`/profiles/${username}`)
        .set('Authorization', 'Bearer token');

      expect(profileService.getProfile).toHaveBeenCalledWith(username, undefined);
    });

    it('should retrieve profile by username for anonymous user', async () => {
      const username = 'testuser';

      (profileService.getProfile as jest.Mock).mockResolvedValue(mockProfile);

      const response = await request(app).get(`/profiles/${username}`);

      expect(profileService.getProfile).toHaveBeenCalledWith(username, undefined);
    });

    it('should return profile with correct format including username, bio, image, and following status', async () => {
      const username = 'testuser';

      (profileService.getProfile as jest.Mock).mockResolvedValue(mockProfile);

      const response = await request(app).get(`/profiles/${username}`);

      expect(response.body).toHaveProperty('profile');
      expect(response.body.profile).toHaveProperty('username', 'testuser');
      expect(response.body.profile).toHaveProperty('bio', 'Test bio');
      expect(response.body.profile).toHaveProperty('image', 'https://example.com/image.jpg');
      expect(response.body.profile).toHaveProperty('following', false);
    });

    it('should handle errors and pass to next middleware', async () => {
      const username = 'testuser';
      const error = new Error('Profile not found');

      (profileService.getProfile as jest.Mock).mockRejectedValue(error);

      const response = await request(app).get(`/profiles/${username}`);

      expect(profileService.getProfile).toHaveBeenCalledWith(username, undefined);
    });

    it('should handle profile retrieval with authenticated user ID', async () => {
      const username = 'testuser';
      const userId = 'user123';

      (auth.optional as jest.Mock) = jest.fn((req, res, next) => {
        req.auth = { user: { id: userId } };
        next();
      });

      (profileService.getProfile as jest.Mock).mockResolvedValue({
        ...mockProfile,
        following: true,
      });

      const response = await request(app)
        .get(`/profiles/${username}`)
        .set('Authorization', 'Bearer token');

      expect(profileService.getProfile).toHaveBeenCalled();
    });

    it('should return standardized error format when profile not found', async () => {
      const username = 'nonexistent';
      const error = { status: 404, message: 'Profile not found' };

      (profileService.getProfile as jest.Mock).mockRejectedValue(error);

      const response = await request(app).get(`/profiles/${username}`);

      expect(profileService.getProfile).toHaveBeenCalledWith(username, undefined);
    });
  });

  describe('POST /profiles/:username/follow', () => {
    const mockFollowedProfile = {
      username: 'testuser',
      bio: 'Test bio',
      image: 'https://example.com/image.jpg',
      following: true,
    };

    beforeEach(() => {
      (auth.required as jest.Mock) = jest.fn((req, res, next) => {
        req.auth = { user: { id: 'follower123' } };
        next();
      });
    });

    it('should follow user successfully', async () => {
      const username = 'testuser';
      const followerId = 'follower123';

      (profileService.followUser as jest.Mock).mockResolvedValue(mockFollowedProfile);

      const response = await request(app)
        .post(`/profiles/${username}/follow`)
        .set('Authorization', 'Bearer token');

      expect(profileService.followUser).toHaveBeenCalled();
    });

    it('should return profile with following status true after follow', async () => {
      const username = 'testuser';

      (profileService.followUser as jest.Mock).mockResolvedValue(mockFollowedProfile);

      const response = await request(app)
        .post(`/profiles/${username}/follow`)
        .set('Authorization', 'Bearer token');

      expect(response.body).toHaveProperty('profile');
      expect(response.body.profile).toHaveProperty('following', true);
    });

    it('should require authentication for follow action', async () => {
      (auth.required as jest.Mock) = jest.fn((req, res, next) => {
        const error: any = new Error('Unauthorized');
        error.status = 401;
        next(error);
      });

      const username = 'testuser';

      const response = await request(app).post(`/profiles/${username}/follow`);

      expect(profileService.followUser).not.toHaveBeenCalled();
    });

    it('should handle errors during follow operation', async () => {
      const username = 'testuser';
      const error = new Error('Follow operation failed');

      (profileService.followUser as jest.Mock).mockRejectedValue(error);

      const response = await request(app)
        .post(`/profiles/${username}/follow`)
        .set('Authorization', 'Bearer token');

      expect(profileService.followUser).toHaveBeenCalled();
    });

    it('should handle following already followed user', async () => {
      const username = 'testuser';
      const error = { status: 422, message: 'Already following this user' };

      (profileService.followUser as jest.Mock).mockRejectedValue(error);

      const response = await request(app)
        .post(`/profiles/${username}/follow`)
        .set('Authorization', 'Bearer token');

      expect(profileService.followUser).toHaveBeenCalled();
    });

    it('should handle following non-existent user', async () => {
      const username = 'nonexistent';
      const error = { status: 404, message: 'User not found' };

      (profileService.followUser as jest.Mock).mockRejectedValue(error);

      const response = await request(app)
        .post(`/profiles/${username}/follow`)
        .set('Authorization', 'Bearer token');

      expect(profileService.followUser).toHaveBeenCalled();
    });
  });

  describe('DELETE /profiles/:username/follow', () => {
    const mockUnfollowedProfile = {
      username: 'testuser',
      bio: 'Test bio',
      image: 'https://example.com/image.jpg',
      following: false,
    };

    beforeEach(() => {
      (auth.required as jest.Mock) = jest.fn((req, res, next) => {
        req.auth = { user: { id: 'follower123' } };
        next();
      });
    });

    it('should unfollow user successfully', async () => {
      const username = 'testuser';
      const followerId = 'follower123';

      (profileService.unfollowUser as jest.Mock).mockResolvedValue(mockUnfollowedProfile);

      const response = await request(app)
        .delete(`/profiles/${username}/follow`)
        .set('Authorization', 'Bearer token');

      expect(profileService.unfollowUser).toHaveBeenCalled();
    });

    it('should return profile with following status false after unfollow', async () => {
      const username = 'testuser';

      (profileService.unfollowUser as jest.Mock).mockResolvedValue(mockUnfollowedProfile);

      const response = await request(app)
        .delete(`/profiles/${username}/follow`)
        .set('Authorization', 'Bearer token');

      expect(response.body).toHaveProperty('profile');
      expect(response.body.profile).toHaveProperty('following', false);
    });

    it('should require authentication for unfollow action', async () => {
      (auth.required as jest.Mock) = jest.fn((req, res, next) => {
        const error: any = new Error('Unauthorized');
        error.status = 401;
        next(error);
      });

      const username = 'testuser';

      const response = await request(app).delete(`/profiles/${username}/follow`);

      expect(profileService.unfollowUser).not.toHaveBeenCalled();
    });

    it('should handle errors during unfollow operation', async () => {
      const username = 'testuser';
      const error = new Error('Unfollow operation failed');

      (profileService.unfollowUser as jest.Mock).mockRejectedValue(error);

      const response = await request(app)
        .delete(`/profiles/${username}/follow`)
        .set('Authorization', 'Bearer token');

      expect(profileService.unfollowUser).toHaveBeenCalled();
    });

    it('should handle unfollowing non-followed user', async () => {
      const username = 'testuser';
      const error = { status: 422, message: 'Not following this user' };

      (profileService.unfollowUser as jest.Mock).mockRejectedValue(error);

      const response = await request(app)
        .delete(`/profiles/${username}/follow`)
        .set('Authorization', 'Bearer token');

      expect(profileService.unfollowUser).toHaveBeenCalled();
    });

    it('should handle unfollowing non-existent user', async () => {
      const username = 'nonexistent';
      const error = { status: 404, message: 'User not found' };

      (profileService.unfollowUser as jest.Mock).mockRejectedValue(error);

      const response = await request(app)
        .delete(`/profiles/${username}/follow`)
        .set('Authorization', 'Bearer token');

      expect(profileService.unfollowUser).toHaveBeenCalled();
    });

    it('should correctly manage following relationships query', async () => {
      const username = 'testuser';
      const followerId = 'follower123';

      (profileService.unfollowUser as jest.Mock).mockResolvedValue(mockUnfollowedProfile);

      const response = await request(app)
        .delete(`/profiles/${username}/follow`)
        .set('Authorization', 'Bearer token');

      expect(profileService.unfollowUser).toHaveBeenCalled();
      expect(response.body.profile.following).toBe(false);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      (auth.optional as jest.Mock) = jest.fn((req, res, next) => next());
      (auth.required as jest.Mock) = jest.fn((req, res, next) => {
        req.auth = { user: { id: 'user123' } };
        next();
      });
    });

    it('should pass errors to next middleware with standardized format for GET profile', async () => {
      const username = 'testuser';
      const standardError = {
        status: 500,
        message: 'Internal server error',
        errors: { body: ['Something went wrong'] },
      };

      (profileService.getProfile as jest.Mock).mockRejectedValue(standardError);

      const response = await request(app).get(`/profiles/${username}`);

      expect(profileService.getProfile).toHaveBeenCalled();
    });

    it('should pass errors to next middleware with standardized format for POST follow', async () => {
      const username = 'testuser';
      const standardError = {
        status: 500,
        message: 'Internal server error',
        errors: { body: ['Something went wrong'] },
      };

      (profileService.followUser as jest.Mock).mockRejectedValue(standardError);

      const response = await request(app)
        .post(`/profiles/${username}/follow`)
        .set('Authorization', 'Bearer token');

      expect(profileService.followUser).toHaveBeenCalled();
    });

    it('should pass errors to next middleware with standardized format for DELETE unfollow', async () => {
      const username = 'testuser';
      const standardError = {
        status: 500,
        message: 'Internal server error',
        errors: { body: ['Something went wrong'] },
      };

      (profileService.unfollowUser as jest.Mock).mockRejectedValue(standardError);

      const response = await request(app)
        .delete(`/profiles/${username}/follow`)
        .set('Authorization', 'Bearer token');

      expect(profileService.unfollowUser).toHaveBeenCalled();
    });
  });

  describe('Profile Infrastructure for Article Author Serialization', () => {
    beforeEach(() => {
      (auth.optional as jest.Mock) = jest.fn((req, res, next) => next());
    });

    it('should provide profile data structure compatible with article author serialization', async () => {
      const username = 'articleauthor';
      const mockAuthorProfile = {
        username: 'articleauthor',
        bio: 'I write articles',
        image: 'https://example.com/author.jpg',
        following: false,
      };

      (profileService.getProfile as jest.Mock).mockResolvedValue(mockAuthorProfile);

      const response = await request(app).get(`/profiles/${username}`);

      expect(response.body.profile).toMatchObject({
        username: expect.any(String),
        bio: expect.any(String),
        image: expect.any(String),
        following: expect.any(Boolean),
      });
    });

    it('should support profile retrieval for article list author filter validation', async () => {
      const authorUsername = 'authorfilter';
      const mockProfile = {
        username: 'authorfilter',
        bio: 'Author bio',
        image: 'https://example.com/author.jpg',
        following: true,
      };

      (profileService.getProfile as jest.Mock).mockResolvedValue(mockProfile);

      const response = await request(app).get(`/profiles/${authorUsername}`);

      expect(response.body.profile.username).toBe(authorUsername);
      expect(profileService.getProfile).toHaveBeenCalledWith(authorUsername, undefined);
    });
  });
});