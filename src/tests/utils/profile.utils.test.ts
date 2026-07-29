import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { mapUserToProfile, isFollowing } from '../../utils/profile.utils';
import { User } from '../../models/user.model';
import { PrismaClient } from '@prisma/client';

// Mock Prisma client
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    follow: {
      findFirst: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

const prisma = new PrismaClient();

describe('Profile Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should map user to profile format', async () => {
    const mockUser: User = {
      id: 1,
      username: 'testuser',
      bio: 'Test bio',
      image: 'https://example.com/image.jpg',
      email: 'test@example.com',
      password: 'hashedpassword',
    };

    const profile = await mapUserToProfile(mockUser);

    expect(profile).toHaveProperty('username');
    expect(profile).toHaveProperty('bio');
    expect(profile).toHaveProperty('image');
    expect(profile).toHaveProperty('following');
    expect(profile.username).toBe('testuser');
    expect(profile.bio).toBe('Test bio');
    expect(profile.image).toBe('https://example.com/image.jpg');
    expect(profile.following).toBe(false);
  });

  test('should calculate following status correctly', async () => {
    const mockUser: User = {
      id: 1,
      username: 'testuser',
      bio: 'Test bio',
      image: 'https://example.com/image.jpg',
      email: 'test@example.com',
      password: 'hashedpassword',
    };

    const currentUserId = 2;

    // Mock database query to return follow relationship exists
    (prisma.follow.findFirst as jest.Mock).mockResolvedValue({
      followerId: currentUserId,
      followingId: mockUser.id,
    });

    const profile = await mapUserToProfile(mockUser, currentUserId);

    expect(profile.following).toBe(true);
    expect(prisma.follow.findFirst).toHaveBeenCalledWith({
      where: {
        followerId: currentUserId,
        followingId: mockUser.id,
      },
    });
  });

  test('should handle null bio and image', async () => {
    const mockUser: User = {
      id: 1,
      username: 'testuser',
      bio: null,
      image: null,
      email: 'test@example.com',
      password: 'hashedpassword',
    };

    const profile = await mapUserToProfile(mockUser);

    expect(profile.bio).toBeNull();
    expect(profile.image).toBeNull();
    expect(profile.username).toBe('testuser');
    expect(profile.following).toBe(false);
  });

  test('should return false when follow relationship does not exist', async () => {
    const followerId = 1;
    const followingId = 2;

    (prisma.follow.findFirst as jest.Mock).mockResolvedValue(null);

    const result = await isFollowing(followerId, followingId);

    expect(result).toBe(false);
    expect(prisma.follow.findFirst).toHaveBeenCalledWith({
      where: {
        followerId,
        followingId,
      },
    });
  });

  test('should return true when follow relationship exists', async () => {
    const followerId = 1;
    const followingId = 2;

    (prisma.follow.findFirst as jest.Mock).mockResolvedValue({
      followerId,
      followingId,
    });

    const result = await isFollowing(followerId, followingId);

    expect(result).toBe(true);
    expect(prisma.follow.findFirst).toHaveBeenCalledWith({
      where: {
        followerId,
        followingId,
      },
    });
  });

  test('should handle mapUserToProfile without currentUserId', async () => {
    const mockUser: User = {
      id: 1,
      username: 'testuser',
      bio: 'Test bio',
      image: 'https://example.com/image.jpg',
      email: 'test@example.com',
      password: 'hashedpassword',
    };

    const profile = await mapUserToProfile(mockUser, undefined);

    expect(profile.following).toBe(false);
    expect(prisma.follow.findFirst).not.toHaveBeenCalled();
  });

  test('should map user with empty string bio and image', async () => {
    const mockUser: User = {
      id: 1,
      username: 'testuser',
      bio: '',
      image: '',
      email: 'test@example.com',
      password: 'hashedpassword',
    };

    const profile = await mapUserToProfile(mockUser);

    expect(profile.bio).toBe('');
    expect(profile.image).toBe('');
    expect(profile.username).toBe('testuser');
    expect(profile.following).toBe(false);
  });

  test('should handle database error in isFollowing gracefully', async () => {
    const followerId = 1;
    const followingId = 2;

    (prisma.follow.findFirst as jest.Mock).mockRejectedValue(
      new Error('Database connection error')
    );

    await expect(isFollowing(followerId, followingId)).rejects.toThrow(
      'Database connection error'
    );
  });

  test('should handle database error in mapUserToProfile gracefully', async () => {
    const mockUser: User = {
      id: 1,
      username: 'testuser',
      bio: 'Test bio',
      image: 'https://example.com/image.jpg',
      email: 'test@example.com',
      password: 'hashedpassword',
    };

    const currentUserId = 2;

    (prisma.follow.findFirst as jest.Mock).mockRejectedValue(
      new Error('Database connection error')
    );

    await expect(mapUserToProfile(mockUser, currentUserId)).rejects.toThrow(
      'Database connection error'
    );
  });
});