import * as bcrypt from 'bcryptjs';
import {
  createUser,
  login,
  getCurrentUser,
  updateUser,
  getUserByUsername,
  getUserProfile,
  isFollowing,
} from './auth.service';
import prisma from '../../../prisma/prisma-client';
import HttpException from '../../models/http-exception.model';
import generateToken from './token.utils';

jest.mock('../../../prisma/prisma-client', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  follows: {
    findUnique: jest.fn(),
  },
}));

jest.mock('bcryptjs');
jest.mock('./token.utils');

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should throw HttpException when email is blank', async () => {
      const input = { email: '', username: 'testuser', password: 'password123' };

      await expect(createUser(input)).rejects.toThrow(HttpException);
      await expect(createUser(input)).rejects.toMatchObject({
        status: 422,
        errors: { email: ["can't be blank"] },
      });
    });

    it('should throw HttpException when email is only whitespace', async () => {
      const input = { email: '   ', username: 'testuser', password: 'password123' };

      await expect(createUser(input)).rejects.toThrow(HttpException);
      await expect(createUser(input)).rejects.toMatchObject({
        status: 422,
        errors: { email: ["can't be blank"] },
      });
    });

    it('should throw HttpException when username is blank', async () => {
      const input = { email: 'test@example.com', username: '', password: 'password123' };

      await expect(createUser(input)).rejects.toThrow(HttpException);
      await expect(createUser(input)).rejects.toMatchObject({
        status: 422,
        errors: { username: ["can't be blank"] },
      });
    });

    it('should throw HttpException when username is only whitespace', async () => {
      const input = { email: 'test@example.com', username: '   ', password: 'password123' };

      await expect(createUser(input)).rejects.toThrow(HttpException);
      await expect(createUser(input)).rejects.toMatchObject({
        status: 422,
        errors: { username: ["can't be blank"] },
      });
    });

    it('should throw HttpException when password is blank', async () => {
      const input = { email: 'test@example.com', username: 'testuser', password: '' };

      await expect(createUser(input)).rejects.toThrow(HttpException);
      await expect(createUser(input)).rejects.toMatchObject({
        status: 422,
        errors: { password: ["can't be blank"] },
      });
    });

    it('should throw HttpException when password is only whitespace', async () => {
      const input = { email: 'test@example.com', username: 'testuser', password: '   ' };

      await expect(createUser(input)).rejects.toThrow(HttpException);
      await expect(createUser(input)).rejects.toMatchObject({
        status: 422,
        errors: { password: ["can't be blank"] },
      });
    });

    it('should throw HttpException when email already exists', async () => {
      const input = { email: 'test@example.com', username: 'testuser', password: 'password123' };

      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: 1 })
        .mockResolvedValueOnce(null);

      await expect(createUser(input)).rejects.toThrow(HttpException);
      await expect(createUser(input)).rejects.toMatchObject({
        status: 422,
        errors: { email: ['has already been taken'] },
      });
    });

    it('should throw HttpException when username already exists', async () => {
      const input = { email: 'test@example.com', username: 'testuser', password: 'password123' };

      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 1 });

      await expect(createUser(input)).rejects.toThrow(HttpException);
      await expect(createUser(input)).rejects.toMatchObject({
        status: 422,
        errors: { username: ['has already been taken'] },
      });
    });

    it('should throw HttpException when both email and username already exist', async () => {
      const input = { email: 'test@example.com', username: 'testuser', password: 'password123' };

      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: 1 })
        .mockResolvedValueOnce({ id: 2 });

      await expect(createUser(input)).rejects.toThrow(HttpException);
      await expect(createUser(input)).rejects.toMatchObject({
        status: 422,
        errors: {
          email: ['has already been taken'],
          username: ['has already been taken'],
        },
      });
    });

    it('should create user successfully with all fields', async () => {
      const input = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        image: 'http://example.com/image.jpg',
        bio: 'Test bio',
        demo: true,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
      });
      (generateToken as jest.Mock).mockReturnValue('token123');

      const result = await createUser(input);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          username: 'testuser',
          email: 'test@example.com',
          password: 'hashedPassword',
          image: 'http://example.com/image.jpg',
          bio: 'Test bio',
          demo: true,
        },
        select: {
          id: true,
          email: true,
          username: true,
          bio: true,
          image: true,
        },
      });
      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        token: 'token123',
      });
    });

    it('should create user successfully without optional fields', async () => {
      const input = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        bio: null,
        image: null,
      });
      (generateToken as jest.Mock).mockReturnValue('token123');

      const result = await createUser(input);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          username: 'testuser',
          email: 'test@example.com',
          password: 'hashedPassword',
        },
        select: {
          id: true,
          email: true,
          username: true,
          bio: true,
          image: true,
        },
      });
      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        bio: null,
        image: null,
        token: 'token123',
      });
    });

    it('should trim whitespace from email, username, and password', async () => {
      const input = {
        email: '  test@example.com  ',
        username: '  testuser  ',
        password: '  password123  ',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        bio: null,
        image: null,
      });
      (generateToken as jest.Mock).mockReturnValue('token123');

      await createUser(input);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          username: 'testuser',
          email: 'test@example.com',
          password: 'hashedPassword',
        },
        select: {
          id: true,
          email: true,
          username: true,
          bio: true,
          image: true,
        },
      });
    });
  });

  describe('login', () => {
    it('should throw HttpException when email is blank', async () => {
      const userPayload = { email: '', password: 'password123' };

      await expect(login(userPayload)).rejects.toThrow(HttpException);
      await expect(login(userPayload)).rejects.toMatchObject({
        status: 422,
        errors: { email: ["can't be blank"] },
      });
    });

    it('should throw HttpException when email is only whitespace', async () => {
      const userPayload = { email: '   ', password: 'password123' };

      await expect(login(userPayload)).rejects.toThrow(HttpException);
      await expect(login(userPayload)).rejects.toMatchObject({
        status: 422,
        errors: { email: ["can't be blank"] },
      });
    });

    it('should throw HttpException when password is blank', async () => {
      const userPayload = { email: 'test@example.com', password: '' };

      await expect(login(userPayload)).rejects.toThrow(HttpException);
      await expect(login(userPayload)).rejects.toMatchObject({
        status: 422,
        errors: { password: ["can't be blank"] },
      });
    });

    it('should throw HttpException when password is only whitespace', async () => {
      const userPayload = { email: 'test@example.com', password: '   ' };

      await expect(login(userPayload)).rejects.toThrow(HttpException);
      await expect(login(userPayload)).rejects.toMatchObject({
        status: 422,
        errors: { password: ["can't be blank"] },
      });
    });

    it('should throw HttpException when user does not exist', async () => {
      const userPayload = { email: 'test@example.com', password: 'password123' };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(login(userPayload)).rejects.toThrow(HttpException);
      await expect(login(userPayload)).rejects.toMatchObject({
        status: 403,
        errors: { 'email or password': ['is invalid'] },
      });
    });

    it('should throw HttpException when password does not match', async () => {
      const userPayload = { email: 'test@example.com', password: 'wrongpassword' };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedPassword',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(login(userPayload)).rejects.toThrow(HttpException);
      await expect(login(userPayload)).rejects.toMatchObject({
        status: 403,
        errors: { 'email or password': ['is invalid'] },
      });
    });

    it('should login successfully with correct credentials', async () => {
      const userPayload = { email: 'test@example.com', password: 'password123' };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedPassword',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (generateToken as jest.Mock).mockReturnValue('token123');

      const result = await login(userPayload);

      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(generateToken).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        email: 'test@example.com',
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        token: 'token123',
      });
    });

    it('should trim whitespace from email and password', async () => {
      const userPayload = { email: '  test@example.com  ', password: '  password123  ' };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedPassword',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (generateToken as jest.Mock).mockReturnValue('token123');

      await login(userPayload);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: {
          id: true,
          email: true,
          username: true,
          password: true,
          bio: true,
          image: true,
        },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user with token', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
      });
      (generateToken as jest.Mock).mockReturnValue('token123');

      const result = await getCurrentUser(1);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: {
          id: true,
          email: true,
          username: true,
          bio: true,
          image: true,
        },
      });
      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        token: 'token123',
      });
    });
  });

  describe('updateUser', () => {
    it('should update user with all fields including password', async () => {
      const userPayload = {
        email: 'newemail@example.com',
        username: 'newusername',
        password: 'newpassword',
        image: 'http://example.com/newimage.jpg',
        bio: 'New bio',
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');
      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'newemail@example.com',
        username: 'newusername',
        bio: 'New bio',
        image: 'http://example.com/newimage.jpg',
      });
      (generateToken as jest.Mock).mockReturnValue('token123');

      const result = await updateUser(userPayload, 1);

      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 10);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          email: 'newemail@example.com',
          username: 'newusername',
          password: 'newHashedPassword',
          image: 'http://example.com/newimage.jpg',
          bio: 'New bio',
        },
        select: {
          id: true,
          email: true,
          username: true,
          bio: true,
          image: true,
        },
      });
      expect(result).toEqual({
        id: 1,
        email: 'newemail@example.com',
        username: 'newusername',
        bio: 'New bio',
        image: 'http://example.com/newimage.jpg',
        token: 'token123',
      });
    });

    it('should update user without password', async () => {
      const userPayload = {
        email: 'newemail@example.com',
        username: 'newusername',
        image: 'http://example.com/newimage.jpg',
        bio: 'New bio',
      };

      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'newemail@example.com',
        username: 'newusername',
        bio: 'New bio',
        image: 'http://example.com/newimage.jpg',
      });
      (generateToken as jest.Mock).mockReturnValue('token123');

      const result = await updateUser(userPayload, 1);

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          email: 'newemail@example.com',
          username: 'newusername',
          image: 'http://example.com/newimage.jpg',
          bio: 'New bio',
        },
        select: {
          id: true,
          email: true,
          username: true,
          bio: true,
          image: true,
        },
      });
      expect(result).toEqual({
        id: 1,
        email: 'newemail@example.com',
        username: 'newusername',
        bio: 'New bio',
        image: 'http://example.com/newimage.jpg',
        token: 'token123',
      });
    });

    it('should update user with only some fields', async () => {
      const userPayload = {
        bio: 'Updated bio only',
      };

      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        bio: 'Updated bio only',
        image: 'http://example.com/image.jpg',
      });
      (generateToken as jest.Mock).mockReturnValue('token123');

      const result = await updateUser(userPayload, 1);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          bio: 'Updated bio only',
        },
        select: {
          id: true,
          email: true,
          username: true,
          bio: true,
          image: true,
        },
      });
      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        bio: 'Updated bio only',
        image: 'http://example.com/image.jpg',
        token: 'token123',
      });
    });

    it('should update user with empty payload', async () => {
      const userPayload = {};

      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
      });
      (generateToken as jest.Mock).mockReturnValue('token123');

      const result = await updateUser(userPayload, 1);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {},
        select: {
          id: true,
          email: true,
          username: true,
          bio: true,
          image: true,
        },
      });
      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        token: 'token123',
      });
    });
  });

  describe('getUserByUsername', () => {
    it('should return user by username', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
      });

      const result = await getUserByUsername('testuser');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' },
        select: {
          id: true,
          email: true,
          username: true,
          bio: true,
          image: true,
        },
      });
      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
      });
    });

    it('should return null when user does not exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getUserByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile with following status when currentUserId is provided and user is following', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        followers: [{ followerId: 2 }],
      });

      const result = await getUserProfile('testuser', 2);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' },
        select: {
          id: true,
          username: true,
          bio: true,
          image: true,
          followers: {
            where: { followerId: 2 },
            select: { followerId: true },
          },
        },
      });
      expect(result).toEqual({
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        following: true,
      });
    });

    it('should return user profile with following status false when currentUserId is provided and user is not following', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        followers: [],
      });

      const result = await getUserProfile('testuser', 2);

      expect(result).toEqual({
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        following: false,
      });
    });

    it('should return user profile without following status when currentUserId is not provided', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
      });

      const result = await getUserProfile('testuser');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' },
        select: {
          id: true,
          username: true,
          bio: true,
          image: true,
          followers: false,
        },
      });
      expect(result).toEqual({
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        following: false,
      });
    });

    it('should throw HttpException when user does not exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(getUserProfile('nonexistent')).rejects.toThrow(HttpException);
      await expect(getUserProfile('nonexistent')).rejects.toMatchObject({
        status: 404,
        errors: { user: ['not found'] },
      });
    });

    it('should return user profile with null bio and image', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        username: 'testuser',
        bio: null,
        image: null,
        followers: [],
      });

      const result = await getUserProfile('testuser', 2);

      expect(result).toEqual({
        username: 'testuser',
        bio: null,
        image: null,
        following: false,
      });
    });
  });

  describe('isFollowing', () => {
    it('should return true when follow relationship exists', async () => {
      (prisma.follows.findUnique as jest.Mock).mockResolvedValue({
        followerId: 1,
        followingId: 2,
      });

      const result = await isFollowing(1, 2);

      expect(prisma.follows.findUnique).toHaveBeenCalledWith({
        where: {
          followerId_followingId: {
            followerId: 1,
            followingId: 2,
          },
        },
      });
      expect(result).toBe(true);
    });

    it('should return false when follow relationship does not exist', async () => {
      (prisma.follows.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await isFollowing(1, 2);

      expect(prisma.follows.findUnique).toHaveBeenCalledWith({
        where: {
          followerId_followingId: {
            followerId: 1,
            followingId: 2,
          },
        },
      });
      expect(result).toBe(false);
    });

    it('should handle different user IDs correctly', async () => {
      (prisma.follows.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await isFollowing(999, 888);

      expect(prisma.follows.findUnique).toHaveBeenCalledWith({
        where: {
          followerId_followingId: {
            followerId: 999,
            followingId: 888,
          },
        },
      });
      expect(result).toBe(false);
    });
  });
});