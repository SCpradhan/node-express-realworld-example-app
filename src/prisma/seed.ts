import { PrismaClient } from '@prisma/client';
import { setPassword } from '../models/user.model';

jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    user: {
      create: jest.fn(),
    },
    article: {
      create: jest.fn(),
    },
    comment: {
      create: jest.fn(),
    },
    follow: {
      create: jest.fn(),
    },
    favorite: {
      create: jest.fn(),
    },
    $disconnect: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

jest.mock('../models/user.model', () => ({
  setPassword: jest.fn(),
}));

describe('Database Seed Script', () => {
  let prisma: any;
  let mockSetPassword: jest.MockedFunction<typeof setPassword>;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = new PrismaClient();
    mockSetPassword = setPassword as jest.MockedFunction<typeof setPassword>;
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
      throw new Error(`Process exited with code ${code}`);
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('main function - successful seeding', () => {
    it('should create two users with hashed passwords using setPassword method', async () => {
      mockSetPassword
        .mockReturnValueOnce({ hash: 'hashedPassword1', salt: 'salt1' })
        .mockReturnValueOnce({ hash: 'hashedPassword2', salt: 'salt2' });

      prisma.user.create
        .mockResolvedValueOnce({ id: 1, email: 'john@example.com', username: 'john' })
        .mockResolvedValueOnce({ id: 2, email: 'jane@example.com', username: 'jane' });

      prisma.article.create.mockResolvedValue({ id: 1 });
      prisma.comment.create.mockResolvedValue({ id: 1 });
      prisma.follow.create.mockResolvedValue({ id: 1 });
      prisma.favorite.create.mockResolvedValue({ id: 1 });

      const { main } = require('./seed');
      await main();

      expect(mockSetPassword).toHaveBeenCalledTimes(2);
      expect(mockSetPassword).toHaveBeenCalledWith('password123');
      expect(prisma.user.create).toHaveBeenCalledTimes(2);
    });

    it('should create user 1 with correct email, username, and hashed password', async () => {
      mockSetPassword.mockReturnValue({ hash: 'hashedPassword1', salt: 'salt1' });

      prisma.user.create
        .mockResolvedValueOnce({ id: 1, email: 'john@example.com', username: 'john' })
        .mockResolvedValueOnce({ id: 2, email: 'jane@example.com', username: 'jane' });

      prisma.article.create.mockResolvedValue({ id: 1 });
      prisma.comment.create.mockResolvedValue({ id: 1 });
      prisma.follow.create.mockResolvedValue({ id: 1 });
      prisma.favorite.create.mockResolvedValue({ id: 1 });

      const { main } = require('./seed');
      await main();

      expect(prisma.user.create).toHaveBeenNthCalledWith(1, {
        data: {
          email: 'john@example.com',
          username: 'john',
          password: 'hashedPassword1',
          salt: 'salt1',
          bio: 'Software developer and tech enthusiast',
          image: 'https://api.realworld.io/images/demo-avatar.png',
        },
      });
    });

    it('should create user 2 with correct email, username, and hashed password', async () => {
      mockSetPassword
        .mockReturnValueOnce({ hash: 'hashedPassword1', salt: 'salt1' })
        .mockReturnValueOnce({ hash: 'hashedPassword2', salt: 'salt2' });

      prisma.user.create
        .mockResolvedValueOnce({ id: 1, email: 'john@example.com', username: 'john' })
        .mockResolvedValueOnce({ id: 2, email: 'jane@example.com', username: 'jane' });

      prisma.article.create.mockResolvedValue({ id: 1 });
      prisma.comment.create.mockResolvedValue({ id: 1 });
      prisma.follow.create.mockResolvedValue({ id: 1 });
      prisma.favorite.create.mockResolvedValue({ id: 1 });

      const { main } = require('./seed');
      await main();

      expect(prisma.user.create).toHaveBeenNthCalledWith(2, {
        data: {
          email: 'jane@example.com',
          username: 'jane',
          password: 'hashedPassword2',
          salt: 'salt2',
          bio: 'Writer and content creator',
          image: 'https://api.realworld.io/images/smiley-cyrus.jpg',
        },
      });
    });

    it('should create sample articles associated with created users', async () => {
      mockSetPassword.mockReturnValue({ hash: 'hashedPassword', salt: 'salt' });

      prisma.user.create
        .mockResolvedValueOnce({ id: 1, email: 'john@example.com', username: 'john' })
        .mockResolvedValueOnce({ id: 2, email: 'jane@example.com', username: 'jane' });

      prisma.article.create
        .mockResolvedValueOnce({ id: 1, authorId: 1 })
        .mockResolvedValueOnce({ id: 2, authorId: 2 });

      prisma.comment.create.mockResolvedValue({ id: 1 });
      prisma.follow.create.mockResolvedValue({ id: 1 });
      prisma.favorite.create.mockResolvedValue({ id: 1 });

      const { main } = require('./seed');
      await main();

      expect(prisma.article.create).toHaveBeenCalledTimes(2);
      expect(prisma.article.create).toHaveBeenNthCalledWith(1, {
        data: {
          slug: 'how-to-train-your-dragon',
          title: 'How to train your dragon',
          description: 'Ever wonder how?',
          body: 'It takes a Jacobian',
          tagList: ['dragons', 'training'],
          authorId: 1,
        },
      });
      expect(prisma.article.create).toHaveBeenNthCalledWith(2, {
        data: {
          slug: 'how-to-build-webapps-that-scale',
          title: 'How to build webapps that scale',
          description: 'This is important',
          body: 'You need to use a database',
          tagList: ['webdev', 'scaling'],
          authorId: 2,
        },
      });
    });

    it('should create sample comments on articles', async () => {
      mockSetPassword.mockReturnValue({ hash: 'hashedPassword', salt: 'salt' });

      prisma.user.create
        .mockResolvedValueOnce({ id: 1, email: 'john@example.com', username: 'john' })
        .mockResolvedValueOnce({ id: 2, email: 'jane@example.com', username: 'jane' });

      prisma.article.create
        .mockResolvedValueOnce({ id: 1, authorId: 1 })
        .mockResolvedValueOnce({ id: 2, authorId: 2 });

      prisma.comment.create.mockResolvedValue({ id: 1 });
      prisma.follow.create.mockResolvedValue({ id: 1 });
      prisma.favorite.create.mockResolvedValue({ id: 1 });

      const { main } = require('./seed');
      await main();

      expect(prisma.comment.create).toHaveBeenCalledTimes(2);
      expect(prisma.comment.create).toHaveBeenNthCalledWith(1, {
        data: {
          body: 'Great article! Very informative.',
          articleId: 1,
          authorId: 2,
        },
      });
      expect(prisma.comment.create).toHaveBeenNthCalledWith(2, {
        data: {
          body: 'Thanks for sharing this knowledge.',
          articleId: 2,
          authorId: 1,
        },
      });
    });

    it('should create sample follow relationships', async () => {
      mockSetPassword.mockReturnValue({ hash: 'hashedPassword', salt: 'salt' });

      prisma.user.create
        .mockResolvedValueOnce({ id: 1, email: 'john@example.com', username: 'john' })
        .mockResolvedValueOnce({ id: 2, email: 'jane@example.com', username: 'jane' });

      prisma.article.create.mockResolvedValue({ id: 1 });
      prisma.comment.create.mockResolvedValue({ id: 1 });
      prisma.follow.create.mockResolvedValue({ id: 1 });
      prisma.favorite.create.mockResolvedValue({ id: 1 });

      const { main } = require('./seed');
      await main();

      expect(prisma.follow.create).toHaveBeenCalledTimes(1);
      expect(prisma.follow.create).toHaveBeenCalledWith({
        data: {
          followerId: 1,
          followingId: 2,
        },
      });
    });

    it('should create sample favorite relationships', async () => {
      mockSetPassword.mockReturnValue({ hash: 'hashedPassword', salt: 'salt' });

      prisma.user.create
        .mockResolvedValueOnce({ id: 1, email: 'john@example.com', username: 'john' })
        .mockResolvedValueOnce({ id: 2, email: 'jane@example.com', username: 'jane' });

      prisma.article.create
        .mockResolvedValueOnce({ id: 1, authorId: 1 })
        .mockResolvedValueOnce({ id: 2, authorId: 2 });

      prisma.comment.create.mockResolvedValue({ id: 1 });
      prisma.follow.create.mockResolvedValue({ id: 1 });
      prisma.favorite.create.mockResolvedValue({ id: 1 });

      const { main } = require('./seed');
      await main();

      expect(prisma.favorite.create).toHaveBeenCalledTimes(2);
      expect(prisma.favorite.create).toHaveBeenNthCalledWith(1, {
        data: {
          userId: 1,
          articleId: 2,
        },
      });
      expect(prisma.favorite.create).toHaveBeenNthCalledWith(2, {
        data: {
          userId: 2,
          articleId: 1,
        },
      });
    });

    it('should log success message after seeding', async () => {
      mockSetPassword.mockReturnValue({ hash: 'hashedPassword', salt: 'salt' });

      prisma.user.create.mockResolvedValue({ id: 1 });
      prisma.article.create.mockResolvedValue({ id: 1 });
      prisma.comment.create.mockResolvedValue({ id: 1 });
      prisma.follow.create.mockResolvedValue({ id: 1 });
      prisma.favorite.create.mockResolvedValue({ id: 1 });

      const { main } = require('./seed');
      await main();

      expect(consoleLogSpy).toHaveBeenCalledWith('Database seeded successfully!');
    });

    it('should disconnect Prisma client in finally block', async () => {
      mockSetPassword.mockReturnValue({ hash: 'hashedPassword', salt: 'salt' });

      prisma.user.create.mockResolvedValue({ id: 1 });
      prisma.article.create.mockResolvedValue({ id: 1 });
      prisma.comment.create.mockResolvedValue({ id: 1 });
      prisma.follow.create.mockResolvedValue({ id: 1 });
      prisma.favorite.create.mockResolvedValue({ id: 1 });

      const { main } = require('./seed');
      await main();

      expect(prisma.$disconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('main function - error handling', () => {
    it('should catch and log errors during seeding', async () => {
      const testError = new Error('Database connection failed');
      mockSetPassword.mockReturnValue({ hash: 'hashedPassword', salt: 'salt' });
      prisma.user.create.mockRejectedValue(testError);

      const { main } = require('./seed');

      await expect(main()).rejects.toThrow('Database connection failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error seeding database:', testError);
    });

    it('should disconnect Prisma client even when error occurs', async () => {
      const testError = new Error('Seeding failed');
      mockSetPassword.mockReturnValue({ hash: 'hashedPassword', salt: 'salt' });
      prisma.user.create.mockRejectedValue(testError);

      const { main } = require('./seed');

      await expect(main()).rejects.toThrow('Seeding failed');
      expect(prisma.$disconnect).toHaveBeenCalledTimes(1);
    });

    it('should handle promise rejection and exit with code 1', async () => {
      const testError = new Error('Fatal error');
      mockSetPassword.mockReturnValue({ hash: 'hashedPassword', salt: 'salt' });
      prisma.user.create.mockRejectedValue(testError);

      jest.isolateModules(() => {
        require('./seed');
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('password hashing consistency', () => {
    it('should use setPassword method from user.model.ts for password hashing', async () => {
      mockSetPassword.mockReturnValue({ hash: 'hashedPassword', salt: 'salt' });

      prisma.user.create.mockResolvedValue({ id: 1 });
      prisma.article.create.mockResolvedValue({ id: 1 });
      prisma.comment.create.mockResolvedValue({ id: 1 });
      prisma.follow.create.mockResolvedValue({ id: 1 });
      prisma.favorite.create.mockResolvedValue({ id: 1 });

      const { main } = require('./seed');
      await main();

      expect(mockSetPassword).toHaveBeenCalledWith('password123');
      expect(mockSetPassword).toHaveBeenCalledTimes(2);
    });

    it('should store both hash and salt returned from setPassword', async () => {
      mockSetPassword
        .mockReturnValueOnce({ hash: 'hash1', salt: 'salt1' })
        .mockReturnValueOnce({ hash: 'hash2', salt: 'salt2' });

      prisma.user.create.mockResolvedValue({ id: 1 });
      prisma.article.create.mockResolvedValue({ id: 1 });
      prisma.comment.create.mockResolvedValue({ id: 1 });
      prisma.follow.create.mockResolvedValue({ id: 1 });
      prisma.favorite.create.mockResolvedValue({ id: 1 });

      const { main } = require('./seed');
      await main();

      expect(prisma.user.create).toHaveBeenNthCalledWith(1, expect.objectContaining({
        data: expect.objectContaining({
          password: 'hash1',
          salt: 'salt1',
        }),
      }));

      expect(prisma.user.create).toHaveBeenNthCalledWith(2, expect.objectContaining({
        data: expect.objectContaining({
          password: 'hash2',
          salt: 'salt2',
        }),
      }));
    });
  });

  describe('PrismaClient integration', () => {
    it('should import and instantiate PrismaClient from @prisma/client', () => {
      const { PrismaClient: MockedPrismaClient } = require('@prisma/client');
      expect(MockedPrismaClient).toHaveBeenCalled();
    });

    it('should use prisma.user.create() to insert users', async () => {
      mockSetPassword.mockReturnValue({ hash: 'hashedPassword', salt: 'salt' });

      prisma.user.create.mockResolvedValue({ id: 1 });
      prisma.article.create.mockResolvedValue({ id: 1 });
      prisma.comment.create.mockResolvedValue({ id: 1 });
      prisma.follow.create.mockResolvedValue({ id: 1 });
      prisma.favorite.create.mockResolvedValue({ id: 1 });

      const { main } = require('./seed');
      await main();

      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('should use prisma.article.create() to insert articles', async () => {
      mockSetPassword.mockReturnValue({ hash: 'hashedPassword', salt: 'salt' });

      prisma.user.create.mockResolvedValue({ id: 1 });
      prisma.article.create.mockResolvedValue({ id: 1 });
      prisma.comment.create.mockResolvedValue({ id: 1 });
      prisma.follow.create.mockResolvedValue({ id: 1 });
      prisma.favorite.create.mockResolvedValue({ id: 1 });

      const { main } = require('./seed');
      await main();

      expect(prisma.article.create).toHaveBeenCalled();
    });

    it('should use prisma.comment.create() to insert comments', async () => {
      mockSetPassword.mockReturnValue({ hash: 'hashedPassword', salt: 'salt' });

      prisma.user.create.mockResolvedValue({ id: 1 });
      prisma.article.create.mockResolvedValue({ id: 1 });
      prisma.comment.create.mockResolvedValue({ id: 1 });
      prisma.follow.create.mockResolvedValue({ id: 1 });
      prisma.favorite.create.mockResolvedValue({ id: 1 });

      const { main } = require('./seed');
      await main();

      expect(prisma.comment.create).toHaveBeenCalled();
    });

    it('should use prisma.follow.create() to insert follow relationships', async () => {
      mockSetPassword.mockReturnValue({ hash: 'hashedPassword', salt: 'salt' });

      prisma.user.create.mockResolvedValue({ id: 1 });
      prisma.article.create.mockResolvedValue({ id: 1 });
      prisma.comment.create.mockResolvedValue({ id: 1 });
      prisma.follow.create.mockResolvedValue({ id: 1 });
      prisma.favorite.create.mockResolvedValue({ id: 1 });

      const { main } = require('./seed');
      await main();

      expect(prisma.follow.create).toHaveBeenCalled();
    });

    it('should use prisma.favorite.create() to insert favorite relationships', async () => {
      mockSetPassword.mockReturnValue({ hash: 'hashedPassword', salt: 'salt' });

      prisma.user.create.mockResolvedValue({ id: 1 });
      prisma.article.create.mockResolvedValue({ id: 1 });
      prisma.comment.create.mockResolvedValue({ id: 1 });
      prisma.follow.create.mockResolvedValue({ id: 1 });
      prisma.favorite.create.mockResolvedValue({ id: 1 });

      const { main } = require('./seed');
      await main();

      expect(prisma.favorite.create).toHaveBeenCalled();
    });
  });
});