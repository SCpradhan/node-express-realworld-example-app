import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { registerUser, loginUser, getCurrentUser, updateUser } from '../../services/auth.service';
import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

describe('Auth Service Tests', () => {
  let testUserId: number;
  let testUserEmail: string;
  let testUserPassword: string;

  beforeEach(async () => {
    await prisma.$connect();
    testUserEmail = `test${Date.now()}@example.com`;
    testUserPassword = 'TestPassword123';
  });

  afterEach(async () => {
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    }
    await prisma.user.deleteMany({
      where: {
        email: {
          startsWith: 'test'
        }
      }
    });
    await prisma.$disconnect();
  });

  test('should register new user with hashed password', async () => {
    const result = await registerUser({
      email: testUserEmail,
      username: 'testuser',
      password: testUserPassword
    });

    testUserId = result.user.id;

    expect(result.user).toHaveProperty('email', testUserEmail);
    expect(result.user).toHaveProperty('username', 'testuser');
    expect(result.user).toHaveProperty('token');
    expect(result.user.token).toBeTruthy();

    const dbUser = await prisma.user.findUnique({
      where: { id: testUserId }
    });

    expect(dbUser).toBeTruthy();
    expect(dbUser?.password).not.toBe(testUserPassword);
    expect(dbUser?.password).toMatch(/^\$2[aby]\$.{56}$/);
    const isHashed = await bcrypt.compare(testUserPassword, dbUser!.password);
    expect(isHashed).toBe(true);
  });

  test('should throw 422 for duplicate email during registration', async () => {
    const userData = {
      email: testUserEmail,
      username: 'testuser1',
      password: testUserPassword
    };

    const firstUser = await registerUser(userData);
    testUserId = firstUser.user.id;

    await expect(
      registerUser({
        email: testUserEmail,
        username: 'testuser2',
        password: testUserPassword
      })
    ).rejects.toMatchObject({
      status: 422,
      message: 'Email already registered'
    });
  });

  test('should throw 422 for invalid email format', async () => {
    await expect(
      registerUser({
        email: 'invalid-email-format',
        username: 'testuser',
        password: testUserPassword
      })
    ).rejects.toMatchObject({
      status: 422,
      message: 'Invalid email format'
    });
  });

  test('should throw 422 for password too short', async () => {
    await expect(
      registerUser({
        email: testUserEmail,
        username: 'testuser',
        password: 'short'
      })
    ).rejects.toMatchObject({
      status: 422,
      message: 'Password must be at least 8 characters'
    });
  });

  test('should authenticate user and return JWT token', async () => {
    const registerResult = await registerUser({
      email: testUserEmail,
      username: 'testuser',
      password: testUserPassword
    });

    testUserId = registerResult.user.id;

    const loginResult = await loginUser({
      email: testUserEmail,
      password: testUserPassword
    });

    expect(loginResult.user).toHaveProperty('token');
    expect(loginResult.user.token).toBeTruthy();

    const decoded = jwt.verify(loginResult.user.token, process.env.JWT_SECRET || 'secret');
    expect(decoded).toHaveProperty('id');
    expect(decoded).toHaveProperty('email', testUserEmail);
  });

  test('should throw 401 for invalid email during login', async () => {
    await expect(
      loginUser({
        email: 'nonexistent@example.com',
        password: testUserPassword
      })
    ).rejects.toMatchObject({
      status: 401,
      message: 'Invalid email or password'
    });
  });

  test('should throw 401 for invalid password during login', async () => {
    const registerResult = await registerUser({
      email: testUserEmail,
      username: 'testuser',
      password: testUserPassword
    });

    testUserId = registerResult.user.id;

    await expect(
      loginUser({
        email: testUserEmail,
        password: 'WrongPassword123'
      })
    ).rejects.toMatchObject({
      status: 401,
      message: 'Invalid email or password'
    });
  });

  test('should retrieve current user by id', async () => {
    const registerResult = await registerUser({
      email: testUserEmail,
      username: 'testuser',
      password: testUserPassword
    });

    testUserId = registerResult.user.id;

    const currentUser = await getCurrentUser(testUserId);

    expect(currentUser.user).toHaveProperty('id', testUserId);
    expect(currentUser.user).toHaveProperty('email', testUserEmail);
    expect(currentUser.user).toHaveProperty('username', 'testuser');
  });

  test('should update user profile', async () => {
    const registerResult = await registerUser({
      email: testUserEmail,
      username: 'testuser',
      password: testUserPassword
    });

    testUserId = registerResult.user.id;

    const updatedBio = 'This is my new bio';
    const updatedImage = 'https://example.com/avatar.jpg';

    const updateResult = await updateUser(testUserId, {
      bio: updatedBio,
      image: updatedImage
    });

    expect(updateResult.user).toHaveProperty('bio', updatedBio);
    expect(updateResult.user).toHaveProperty('image', updatedImage);
    expect(updateResult.user).toHaveProperty('email', testUserEmail);
  });

  test('should validate password correctly', async () => {
    const registerResult = await registerUser({
      email: testUserEmail,
      username: 'testuser',
      password: testUserPassword
    });

    testUserId = registerResult.user.id;

    const dbUser = await prisma.user.findUnique({
      where: { id: testUserId }
    });

    const validPasswordResult = await bcrypt.compare(testUserPassword, dbUser!.password);
    expect(validPasswordResult).toBe(true);

    const invalidPasswordResult = await bcrypt.compare('WrongPassword', dbUser!.password);
    expect(invalidPasswordResult).toBe(false);
  });
});