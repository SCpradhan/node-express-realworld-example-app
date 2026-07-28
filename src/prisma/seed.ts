import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    comment: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    article: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    user: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    $disconnect: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('Database Seed Script', () => {
  let prisma: any;
  let mockBcrypt: any;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = new PrismaClient();
    mockBcrypt = require('bcrypt');
    
    // Setup default mock implementations
    mockBcrypt.hash.mockResolvedValue('hashedPassword123');
    
    prisma.user.create.mockImplementation(({ data }: any) => 
      Promise.resolve({ id: `user-${data.username}`, ...data })
    );
    
    prisma.article.create.mockImplementation(({ data }: any) => 
      Promise.resolve({ id: `article-${data.slug}`, ...data })
    );
    
    prisma.comment.create.mockImplementation(({ data }: any) => 
      Promise.resolve({ id: `comment-${Date.now()}`, ...data })
    );
    
    prisma.comment.deleteMany.mockResolvedValue({ count: 0 });
    prisma.article.deleteMany.mockResolvedValue({ count: 0 });
    prisma.user.deleteMany.mockResolvedValue({ count: 0 });
    prisma.$disconnect.mockResolvedValue(undefined);
  });

  describe('Data Cleanup', () => {
    it('should delete all comments before seeding', async () => {
      const { main } = require('./seed');
      await main();
      
      expect(prisma.comment.deleteMany).toHaveBeenCalledTimes(1);
      expect(prisma.comment.deleteMany).toHaveBeenCalledWith();
    });

    it('should delete all articles before seeding', async () => {
      const { main } = require('./seed');
      await main();
      
      expect(prisma.article.deleteMany).toHaveBeenCalledTimes(1);
      expect(prisma.article.deleteMany).toHaveBeenCalledWith();
    });

    it('should delete all users before seeding', async () => {
      const { main } = require('./seed');
      await main();
      
      expect(prisma.user.deleteMany).toHaveBeenCalledTimes(1);
      expect(prisma.user.deleteMany).toHaveBeenCalledWith();
    });

    it('should delete data in correct order (comments, articles, users)', async () => {
      const { main } = require('./seed');
      await main();
      
      const deleteOrder = [
        prisma.comment.deleteMany.mock.invocationCallOrder[0],
        prisma.article.deleteMany.mock.invocationCallOrder[0],
        prisma.user.deleteMany.mock.invocationCallOrder[0],
      ];
      
      expect(deleteOrder[0]).toBeLessThan(deleteOrder[1]);
      expect(deleteOrder[1]).toBeLessThan(deleteOrder[2]);
    });
  });

  describe('User Creation', () => {
    it('should hash passwords using bcrypt with salt rounds of 10', async () => {
      const { main } = require('./seed');
      await main();
      
      expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });

    it('should create exactly 3 test users', async () => {
      const { main } = require('./seed');
      await main();
      
      expect(prisma.user.create).toHaveBeenCalledTimes(3);
    });

    it('should create user1 with correct data', async () => {
      const { main } = require('./seed');
      await main();
      
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'john.doe@example.com',
          username: 'johndoe',
          password: 'hashedPassword123',
          bio: 'Full-stack developer and tech enthusiast',
          image: 'https://api.realworld.io/images/demo-avatar.png',
        }),
      });
    });

    it('should create user2 with correct data', async () => {
      const { main } = require('./seed');
      await main();
      
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'jane.smith@example.com',
          username: 'janesmith',
          password: 'hashedPassword123',
          bio: 'Software architect and blogger',
          image: 'https://api.realworld.io/images/smiley-cyrus.jpg',
        }),
      });
    });

    it('should create user3 with correct data', async () => {
      const { main } = require('./seed');
      await main();
      
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'bob.wilson@example.com',
          username: 'bobwilson',
          password: 'hashedPassword123',
          bio: 'DevOps engineer',
          image: 'https://api.realworld.io/images/avatar.png',
        }),
      });
    });
  });

  describe('Article Creation with Varying Body Lengths for ReadingTime Testing', () => {
    it('should create exactly 5 articles with different body lengths', async () => {
      const { main } = require('./seed');
      await main();
      
      expect(prisma.article.create).toHaveBeenCalledTimes(5);
    });

    it('should create a very short article (~30 words) for readingTime testing', async () => {
      const { main } = require('./seed');
      await main();
      
      const veryShortArticleCall = prisma.article.create.mock.calls.find(
        (call: any) => call[0].data.slug === 'quick-git-tips'
      );
      
      expect(veryShortArticleCall).toBeDefined();
      const wordCount = veryShortArticleCall[0].data.body.split(/\s+/).length;
      expect(wordCount).toBeGreaterThanOrEqual(25);
      expect(wordCount).toBeLessThanOrEqual(40);
    });

    it('should create a short article (~50 words) for readingTime testing', async () => {
      const { main } = require('./seed');
      await main();
      
      const shortArticleCall = prisma.article.create.mock.calls.find(
        (call: any) => call[0].data.slug === 'introduction-to-typescript'
      );
      
      expect(shortArticleCall).toBeDefined();
      const wordCount = shortArticleCall[0].data.body.split(/\s+/).length;
      expect(wordCount).toBeGreaterThanOrEqual(40);
      expect(wordCount).toBeLessThanOrEqual(70);
    });

    it('should create medium articles (~180-200 words) for readingTime testing', async () => {
      const { main } = require('./seed');
      await main();
      
      const mediumArticleCalls = prisma.article.create.mock.calls.filter(
        (call: any) => 
          call[0].data.slug === 'building-rest-apis-with-nodejs' ||
          call[0].data.slug === 'docker-containerization-basics'
      );
      
      expect(mediumArticleCalls.length).toBe(2);
      
      mediumArticleCalls.forEach((call: any) => {
        const wordCount = call[0].data.body.split(/\s+/).length;
        expect(wordCount).toBeGreaterThanOrEqual(150);
        expect(wordCount).toBeLessThanOrEqual(250);
      });
    });

    it('should create a long article (~500 words) for readingTime testing', async () => {
      const { main } = require('./seed');
      await main();
      
      const longArticleCall = prisma.article.create.mock.calls.find(
        (call: any) => call[0].data.slug === 'comprehensive-guide-to-prisma-orm'
      );
      
      expect(longArticleCall).toBeDefined();
      const wordCount = longArticleCall[0].data.body.split(/\s+/).length;
      expect(wordCount).toBeGreaterThanOrEqual(450);
      expect(wordCount).toBeLessThanOrEqual(550);
    });

    it('should create article with slug "introduction-to-typescript"', async () => {
      const { main } = require('./seed');
      await main();
      
      expect(prisma.article.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          slug: 'introduction-to-typescript',
          title: 'Introduction to TypeScript',
          description: 'A brief overview of TypeScript basics',
          tagList: ['typescript', 'javascript', 'programming'],
        }),
      });
    });

    it('should create article with slug "building-rest-apis-with-nodejs"', async () => {
      const { main } = require('./seed');
      await main();
      
      expect(prisma.article.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          slug: 'building-rest-apis-with-nodejs',
          title: 'Building REST APIs with Node.js',
          description: 'Learn how to create scalable REST APIs using Node.js and Express',
          tagList: ['nodejs', 'express', 'rest', 'api'],
        }),
      });
    });

    it('should create article with slug "comprehensive-guide-to-prisma-orm"', async () => {
      const { main } = require('./seed');
      await main();
      
      expect(prisma.article.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          slug: 'comprehensive-guide-to-prisma-orm',
          title: 'Comprehensive Guide to Prisma ORM',
          description: 'An in-depth exploration of Prisma ORM for database management',
          tagList: ['prisma', 'orm', 'database', 'typescript'],
        }),
      });
    });

    it('should create article with slug "docker-containerization-basics"', async () => {
      const { main } = require('./seed');
      await main();
      
      expect(prisma.article.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          slug: 'docker-containerization-basics',
          title: 'Docker Containerization Basics',
          description: 'Understanding Docker and containerization concepts',
          tagList: ['docker', 'devops', 'containers'],
        }),
      });
    });

    it('should create article with slug "quick-git-tips"', async () => {
      const { main } = require('./seed');
      await main();
      
      expect(prisma.article.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          slug: 'quick-git-tips',
          title: 'Quick Git Tips',
          description: 'Essential Git commands every developer should know',
          tagList: ['git', 'version-control', 'tips'],
        }),
      });
    });

    it('should assign correct authors to articles', async () => {
      const { main } = require('./seed');
      await main();
      
      const article1Call = prisma.article.create.mock.calls.find(
        (call: any) => call[0].data.slug === 'introduction-to-typescript'
      );
      expect(article1Call[0].data.authorId).toBe('user-johndoe');
      
      const article2Call = prisma.article.create.mock.calls.find(
        (call: any) => call[0].data.slug === 'building-rest-apis-with-nodejs'
      );
      expect(article2Call[0].data.authorId).toBe('user-janesmith');
      
      const article3Call = prisma.article.create.mock.calls.find(
        (call: any) => call[0].data.slug === 'comprehensive-guide-to-prisma-orm'
      );
      expect(article3Call[0].data.authorId).toBe('user-johndoe');
      
      const article4Call = prisma.article.create.mock.calls.find(
        (call: any) => call[0].data.slug === 'docker-containerization-basics'
      );
      expect(article4Call[0].data.authorId).toBe('user-bobwilson');
      
      const article5Call = prisma.article.create.mock.calls.find(
        (call: any) => call[0].data.slug === 'quick-git-tips'
      );
      expect(article5Call[0].data.authorId).toBe('user-janesmith');
    });

    it('should set createdAt and updatedAt timestamps for all articles', async () => {
      const { main } = require('./seed');
      await main();
      
      prisma.article.create.mock.calls.forEach((call: any) => {
        expect(call[0].data.createdAt).toBeInstanceOf(Date);
        expect(call[0].data.updatedAt).toBeInstanceOf(Date);
      });
    });

    it('should verify all articles have body content for meaningful readingTime calculation', async () => {
      const { main } = require('./seed');
      await main();
      
      prisma.article.create.mock.calls.forEach((call: any) => {
        expect(call[0].data.body).toBeDefined();
        expect(call[0].data.body.length).toBeGreaterThan(0);
        expect(call[0].data.body.split(/\s+/).length).toBeGreaterThan(10);
      });
    });
  });

  describe('Comment Creation', () => {
    it('should create exactly 3 comments', async () => {
      const { main } = require('./seed');
      await main();
      
      expect(prisma.comment.create).toHaveBeenCalledTimes(3);
    });

    it('should create comment on article1 by user2', async () => {
      const { main } = require('./seed');
      await main();
      
      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: {
          body: 'Great article! Very informative.',
          articleId: 'article-introduction-to-typescript',
          authorId: 'user-janesmith',
        },
      });
    });

    it('should create comment on article3 by user3', async () => {
      const { main } = require('./seed');
      await main();
      
      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: {
          body: 'Thanks for sharing this comprehensive guide.',
          articleId: 'article-comprehensive-guide-to-prisma-orm',
          authorId: 'user-bobwilson',
        },
      });
    });

    it('should create comment on article4 by user1', async () => {
      const { main } = require('./seed');
      await main();
      
      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: {
          body: 'This helped me understand Docker much better.',
          articleId: 'article-docker-containerization-basics',
          authorId: 'user-johndoe',
        },
      });
    });
  });

  describe('Execution Flow and Error Handling', () => {
    it('should execute seeding operations in correct order', async () => {
      const { main } = require('./seed');
      await main();
      
      const deleteCommentsOrder = prisma.comment.deleteMany.mock.invocationCallOrder[0];
      const deleteArticlesOrder = prisma.article.deleteMany.mock.invocationCallOrder[0];
      const deleteUsersOrder = prisma.user.deleteMany.mock.invocationCallOrder[0];
      const firstUserCreateOrder = prisma.user.create.mock.invocationCallOrder[0];
      const firstArticleCreateOrder = prisma.article.create.mock.invocationCallOrder[0];
      const firstCommentCreateOrder = prisma.comment.create.mock.invocationCallOrder[0];
      
      expect(deleteCommentsOrder).toBeLessThan(deleteArticlesOrder);
      expect(deleteArticlesOrder).toBeLessThan(deleteUsersOrder);
      expect(deleteUsersOrder).toBeLessThan(firstUserCreateOrder);
      expect(firstUserCreateOrder).toBeLessThan(firstArticleCreateOrder);
      expect(firstArticleCreateOrder).toBeLessThan(firstCommentCreateOrder);
    });

    it('should disconnect from Prisma after successful seeding', async () => {
      const { main } = require('./seed');
      await main();
      
      expect(prisma.$disconnect).toHaveBeenCalledTimes(1);
    });

    it('should disconnect from Prisma even if seeding fails', async () => {
      prisma.user.create.mockRejectedValueOnce(new Error('Database error'));
      
      const { main } = require('./seed');
      
      try {
        await main();
      } catch (error) {
        // Expected to throw
      }
      
      expect(prisma.$disconnect).toHaveBeenCalledTimes(1);
    });

    it('should handle errors during user creation', async () => {
      const error = new Error('Failed to create user');
      prisma.user.create.mockRejectedValueOnce(error);
      
      const { main } = require('./seed');
      
      await expect(main()).rejects.toThrow('Failed to create user');
    });

    it('should handle errors during article creation', async () => {
      const error = new Error('Failed to create article');
      prisma.article.create.mockRejectedValueOnce(error);
      
      const { main } = require('./seed');
      
      await expect(main()).rejects.toThrow('Failed to create article');
    });

    it('should handle errors during comment creation', async () => {
      const error = new Error('Failed to create comment');
      prisma.comment.create.mockRejectedValueOnce(error);
      
      const { main } = require('./seed');
      
      await expect(main()).rejects.toThrow('Failed to create comment');
    });

    it('should handle errors during data cleanup', async () => {
      const error = new Error('Failed to delete data');
      prisma.comment.deleteMany.mockRejectedValueOnce(error);
      
      const { main } = require('./seed');
      
      await expect(main()).rejects.toThrow('Failed to delete data');
    });
  });

  describe('ReadingTime Calculation Verification', () => {
    it('should verify seed script does not persist readingTime field', async () => {
      const { main } = require('./seed');
      await main();
      
      prisma.article.create.mock.calls.forEach((call: any) => {
        expect(call[0].data.readingTime).toBeUndefined();
      });
    });

    it('should confirm readingTime is a calculated field not stored in database', async () => {
      const { main } = require('./seed');
      await main();
      
      const articleDataKeys = Object.keys(prisma.article.create.mock.calls[0][0].data);
      expect(articleDataKeys).not.toContain('readingTime');
    });

    it('should verify articles have sufficient body content for readingTime calculation', async () => {
      const { main } = require('./seed');
      await main();
      
      const articleBodies = prisma.article.create.mock.calls.map(
        (call: any) => call[0].data.body
      );
      
      articleBodies.forEach((body: string) => {
        expect(body).toBeTruthy();
        expect(body.length).toBeGreaterThan(50);
      });
    });

    it('should document that seed data includes variety of article lengths', async () => {
      const { main } = require('./seed');
      await main();
      
      const wordCounts = prisma.article.create.mock.calls.map((call: any) => {
        return call[0].data.body.split(/\s+/).length;
      });
      
      const minWords = Math.min(...wordCounts);
      const maxWords = Math.max(...wordCounts);
      
      expect(minWords).toBeLessThan(50);
      expect(maxWords).toBeGreaterThan(400);
      expect(maxWords - minWords).toBeGreaterThan(400);
    });
  });

  describe('Console Output Verification', () => {
    let consoleLogSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should log success message after seeding', async () => {
      const { main } = require('./seed');
      await main();
      
      expect(consoleLogSpy).toHaveBeenCalledWith('Database seeded successfully!');
    });

    it('should log created users information', async () => {
      const { main } = require('./seed');
      await main();
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Created users:',
        expect.objectContaining({
          user1: 'johndoe',
          user2: 'janesmith',
          user3: 'bobwilson',
        })
      );
    });

    it('should log articles with varying body lengths information', async () => {
      const { main } = require('./seed');
      await main();
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Created articles with varying body lengths for readingTime testing:'
      );
    });

    it('should log readingTime calculation note', async () => {
      const { main } = require('./seed');
      await main();
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Note: readingTime is a calculated field and will be computed when articles are retrieved through the API'
      );
    });

    it('should log error message on failure', async () => {
      const error = new Error('Seeding failed');
      prisma.user.create.mockRejectedValueOnce(error);
      
      const { main } = require('./seed');
      
      try {
        await main();
      } catch (e) {
        // Expected
      }
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error seeding database:', error);
    });
  });
});