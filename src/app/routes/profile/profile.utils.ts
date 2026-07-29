import { PrismaClient } from '@prisma/client';
import { mapUserToProfile, isFollowing, ProfileResponse } from './profile.utils';
import { User } from '../../models/user.model';

jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    follow: {
      findUnique: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

describe('profile.utils', () => {
  let prisma: any;

  beforeEach(() => {
    prisma = new PrismaClient();
    jest.clearAllMocks();
  });

  describe('isFollowing', () => {
    it('should return true when follow relationship exists', async () => {
      const mockFollowRelationship = {
        followerId: 1,
        followingId: 2,
      };
      prisma.follow.findUnique.mockResolvedValue(mockFollowRelationship);

      const result = await isFollowing(1, 2);

      expect(result).toBe(true);
      expect(prisma.follow.findUnique).toHaveBeenCalledWith({
        where: {
          followerId_followingId: {
            followerId: 1,
            followingId: 2,
          },
        },
      });
      expect(prisma.follow.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should return false when follow relationship does not exist', async () => {
      prisma.follow.findUnique.mockResolvedValue(null);

      const result = await isFollowing(1, 2);

      expect(result).toBe(false);
      expect(prisma.follow.findUnique).toHaveBeenCalledWith({
        where: {
          followerId_followingId: {
            followerId: 1,
            followingId: 2,
          },
        },
      });
      expect(prisma.follow.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should handle different user IDs correctly', async () => {
      prisma.follow.findUnique.mockResolvedValue(null);

      const result = await isFollowing(999, 888);

      expect(result).toBe(false);
      expect(prisma.follow.findUnique).toHaveBeenCalledWith({
        where: {
          followerId_followingId: {
            followerId: 999,
            followingId: 888,
          },
        },
      });
    });
  });

  describe('mapUserToProfile', () => {
    const mockUser: User = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      bio: 'Test bio',
      image: 'https://example.com/image.jpg',
      password: 'hashedpassword',
    };

    it('should map user to profile with following true when currentUserId is provided and user is followed', async () => {
      prisma.follow.findUnique.mockResolvedValue({ followerId: 2, followingId: 1 });

      const result: ProfileResponse = await mapUserToProfile(mockUser, 2);

      expect(result).toEqual({
        username: 'testuser',
        bio: 'Test bio',
        image: 'https://example.com/image.jpg',
        following: true,
      });
      expect(prisma.follow.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should map user to profile with following false when currentUserId is provided and user is not followed', async () => {
      prisma.follow.findUnique.mockResolvedValue(null);

      const result: ProfileResponse = await mapUserToProfile(mockUser, 2);

      expect(result).toEqual({
        username: 'testuser',
        bio: 'Test bio',
        image: 'https://example.com/image.jpg',
        following: false,
      });
      expect(prisma.follow.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should map user to profile with following false when currentUserId is not provided', async () => {
      const result: ProfileResponse = await mapUserToProfile(mockUser);

      expect(result).toEqual({
        username: 'testuser',
        bio: 'Test bio',
        image: 'https://example.com/image.jpg',
        following: false,
      });
      expect(prisma.follow.findUnique).not.toHaveBeenCalled();
    });

    it('should handle null bio gracefully', async () => {
      const userWithNullBio: User = {
        ...mockUser,
        bio: null,
      };

      const result: ProfileResponse = await mapUserToProfile(userWithNullBio);

      expect(result).toEqual({
        username: 'testuser',
        bio: null,
        image: 'https://example.com/image.jpg',
        following: false,
      });
    });

    it('should handle undefined bio gracefully by converting to null', async () => {
      const userWithUndefinedBio: User = {
        ...mockUser,
        bio: undefined as any,
      };

      const result: ProfileResponse = await mapUserToProfile(userWithUndefinedBio);

      expect(result).toEqual({
        username: 'testuser',
        bio: null,
        image: 'https://example.com/image.jpg',
        following: false,
      });
    });

    it('should handle null image gracefully', async () => {
      const userWithNullImage: User = {
        ...mockUser,
        image: null,
      };

      const result: ProfileResponse = await mapUserToProfile(userWithNullImage);

      expect(result).toEqual({
        username: 'testuser',
        bio: 'Test bio',
        image: null,
        following: false,
      });
    });

    it('should handle undefined image gracefully by converting to null', async () => {
      const userWithUndefinedImage: User = {
        ...mockUser,
        image: undefined as any,
      };

      const result: ProfileResponse = await mapUserToProfile(userWithUndefinedImage);

      expect(result).toEqual({
        username: 'testuser',
        bio: 'Test bio',
        image: null,
        following: false,
      });
    });

    it('should handle both null bio and image gracefully', async () => {
      const userWithNullFields: User = {
        ...mockUser,
        bio: null,
        image: null,
      };

      const result: ProfileResponse = await mapUserToProfile(userWithNullFields);

      expect(result).toEqual({
        username: 'testuser',
        bio: null,
        image: null,
        following: false,
      });
    });

    it('should handle empty string bio by converting to null', async () => {
      const userWithEmptyBio: User = {
        ...mockUser,
        bio: '',
      };

      const result: ProfileResponse = await mapUserToProfile(userWithEmptyBio);

      expect(result).toEqual({
        username: 'testuser',
        bio: null,
        image: 'https://example.com/image.jpg',
        following: false,
      });
    });

    it('should handle empty string image by converting to null', async () => {
      const userWithEmptyImage: User = {
        ...mockUser,
        image: '',
      };

      const result: ProfileResponse = await mapUserToProfile(userWithEmptyImage);

      expect(result).toEqual({
        username: 'testuser',
        bio: 'Test bio',
        image: null,
        following: false,
      });
    });

    it('should correctly extract username from user object', async () => {
      const userWithDifferentUsername: User = {
        ...mockUser,
        username: 'anotheruser',
      };

      const result: ProfileResponse = await mapUserToProfile(userWithDifferentUsername);

      expect(result.username).toBe('anotheruser');
    });

    it('should call isFollowing with correct parameters when currentUserId is provided', async () => {
      prisma.follow.findUnique.mockResolvedValue(null);

      await mapUserToProfile(mockUser, 5);

      expect(prisma.follow.findUnique).toHaveBeenCalledWith({
        where: {
          followerId_followingId: {
            followerId: 5,
            followingId: 1,
          },
        },
      });
    });

    it('should handle currentUserId of 0 correctly', async () => {
      prisma.follow.findUnique.mockResolvedValue(null);

      const result: ProfileResponse = await mapUserToProfile(mockUser, 0);

      expect(result.following).toBe(false);
      expect(prisma.follow.findUnique).toHaveBeenCalledWith({
        where: {
          followerId_followingId: {
            followerId: 0,
            followingId: 1,
          },
        },
      });
    });
  });
});