import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { findArticles } from './article.service';
import prisma from '../../../prisma/prisma-client';
import HttpException from '../../models/http-exception.model';
import articleMapper from './article.mapper';

jest.mock('../../../prisma/prisma-client', () => ({
  __esModule: true,
  default: {
    article: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

jest.mock('./article.mapper', () => ({
  __esModule: true,
  default: jest.fn((article, userId) => ({
    ...article,
    mapped: true,
    userId,
  })),
}));

describe('findArticles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Query Construction', () => {
    it('should construct query with empty filter when no filters are provided', async () => {
      const mockArticles = [
        { id: 1, title: 'Article 1', createdAt: new Date() },
        { id: 2, title: 'Article 2', createdAt: new Date() },
      ];

      (prisma.article.count as jest.Mock).mockResolvedValue(2);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);

      await findArticles(10, 0, undefined, undefined, undefined, undefined);

      expect(prisma.article.count).toHaveBeenCalledWith({
        where: {},
      });

      expect(prisma.article.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
        include: expect.any(Object),
      });
    });

    it('should add tag filter when tag parameter is provided', async () => {
      const mockArticles = [{ id: 1, title: 'Tagged Article' }];

      (prisma.article.count as jest.Mock).mockResolvedValue(1);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);

      await findArticles(10, 0, 'javascript', undefined, undefined, undefined);

      expect(prisma.article.count).toHaveBeenCalledWith({
        where: {
          AND: [
            {
              tagList: {
                some: {
                  name: 'javascript',
                },
              },
            },
          ],
        },
      });
    });

    it('should add author filter when author parameter is provided', async () => {
      const mockArticles = [{ id: 1, title: 'Author Article' }];

      (prisma.article.count as jest.Mock).mockResolvedValue(1);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);

      await findArticles(10, 0, undefined, 'johndoe', undefined, undefined);

      expect(prisma.article.count).toHaveBeenCalledWith({
        where: {
          AND: [
            {
              author: {
                username: {
                  equals: 'johndoe',
                },
              },
            },
          ],
        },
      });
    });

    it('should add favorited filter when favorited parameter is provided', async () => {
      const mockArticles = [{ id: 1, title: 'Favorited Article' }];

      (prisma.article.count as jest.Mock).mockResolvedValue(1);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);

      await findArticles(10, 0, undefined, undefined, 'janedoe', undefined);

      expect(prisma.article.count).toHaveBeenCalledWith({
        where: {
          AND: [
            {
              favoritedBy: {
                some: {
                  username: {
                    equals: 'janedoe',
                  },
                },
              },
            },
          ],
        },
      });
    });

    it('should combine multiple filters when multiple parameters are provided', async () => {
      const mockArticles = [{ id: 1, title: 'Multi-filtered Article' }];

      (prisma.article.count as jest.Mock).mockResolvedValue(1);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);

      await findArticles(10, 0, 'react', 'johndoe', 'janedoe', 1);

      expect(prisma.article.count).toHaveBeenCalledWith({
        where: {
          AND: [
            {
              tagList: {
                some: {
                  name: 'react',
                },
              },
            },
            {
              author: {
                username: {
                  equals: 'johndoe',
                },
              },
            },
            {
              favoritedBy: {
                some: {
                  username: {
                    equals: 'janedoe',
                  },
                },
              },
            },
          ],
        },
      });
    });
  });

  describe('Pagination', () => {
    it('should apply limit parameter correctly', async () => {
      const mockArticles = [{ id: 1 }, { id: 2 }, { id: 3 }];

      (prisma.article.count as jest.Mock).mockResolvedValue(10);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);

      await findArticles(3, 0, undefined, undefined, undefined, undefined);

      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 3,
        })
      );
    });

    it('should apply offset parameter correctly', async () => {
      const mockArticles = [{ id: 4 }, { id: 5 }];

      (prisma.article.count as jest.Mock).mockResolvedValue(10);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);

      await findArticles(10, 5, undefined, undefined, undefined, undefined);

      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
        })
      );
    });

    it('should handle zero offset', async () => {
      const mockArticles = [{ id: 1 }];

      (prisma.article.count as jest.Mock).mockResolvedValue(1);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);

      await findArticles(10, 0, undefined, undefined, undefined, undefined);

      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
        })
      );
    });

    it('should handle large offset values', async () => {
      const mockArticles: any[] = [];

      (prisma.article.count as jest.Mock).mockResolvedValue(100);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);

      await findArticles(10, 95, undefined, undefined, undefined, undefined);

      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 95,
          take: 10,
        })
      );
    });
  });

  describe('Sorting', () => {
    it('should order results by createdAt in descending order', async () => {
      const mockArticles = [
        { id: 1, createdAt: new Date('2024-01-02') },
        { id: 2, createdAt: new Date('2024-01-01') },
      ];

      (prisma.article.count as jest.Mock).mockResolvedValue(2);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);

      await findArticles(10, 0, undefined, undefined, undefined, undefined);

      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            createdAt: 'desc',
          },
        })
      );
    });
  });

  describe('Data Population', () => {
    it('should include tagList with name selection', async () => {
      const mockArticles = [{ id: 1 }];

      (prisma.article.count as jest.Mock).mockResolvedValue(1);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);

      await findArticles(10, 0, undefined, undefined, undefined, undefined);

      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            tagList: {
              select: {
                name: true,
              },
            },
          }),
        })
      );
    });

    it('should include author data with username, bio, image, and followedBy', async () => {
      const mockArticles = [{ id: 1 }];

      (prisma.article.count as jest.Mock).mockResolvedValue(1);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);

      await findArticles(10, 0, undefined, undefined, undefined, undefined);

      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            author: {
              select: {
                username: true,
                bio: true,
                image: true,
                followedBy: true,
              },
            },
          }),
        })
      );
    });

    it('should include favoritedBy data', async () => {
      const mockArticles = [{ id: 1 }];

      (prisma.article.count as jest.Mock).mockResolvedValue(1);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);

      await findArticles(10, 0, undefined, undefined, undefined, undefined);

      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            favoritedBy: true,
          }),
        })
      );
    });

    it('should include favorites count', async () => {
      const mockArticles = [{ id: 1 }];

      (prisma.article.count as jest.Mock).mockResolvedValue(1);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);

      await findArticles(10, 0, undefined, undefined, undefined, undefined);

      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            _count: {
              select: {
                favoritedBy: true,
              },
            },
          }),
        })
      );
    });
  });

  describe('Article Mapping', () => {
    it('should map articles using articleMapper with currentUserId for authenticated requests', async () => {
      const mockArticles = [
        { id: 1, title: 'Article 1' },
        { id: 2, title: 'Article 2' },
      ];

      (prisma.article.count as jest.Mock).mockResolvedValue(2);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);

      const result = await findArticles(10, 0, undefined, undefined, undefined, 123);

      expect(articleMapper).toHaveBeenCalledTimes(2);
      expect(articleMapper).toHaveBeenCalledWith(mockArticles[0], 123);
      expect(articleMapper).toHaveBeenCalledWith(mockArticles[1], 123);
    });

    it('should map articles using articleMapper with undefined for anonymous requests', async () => {
      const mockArticles = [{ id: 1, title: 'Article 1' }];

      (prisma.article.count as jest.Mock).mockResolvedValue(1);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);

      await findArticles(10, 0, undefined, undefined, undefined, undefined);

      expect(articleMapper).toHaveBeenCalledWith(mockArticles[0], undefined);
    });
  });

  describe('Return Value', () => {
    it('should return object with articles array and articlesCount', async () => {
      const mockArticles = [
        { id: 1, title: 'Article 1' },
        { id: 2, title: 'Article 2' },
      ];

      (prisma.article.count as jest.Mock).mockResolvedValue(5);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);

      const result = await findArticles(10, 0, undefined, undefined, undefined, undefined);

      expect(result).toHaveProperty('articles');
      expect(result).toHaveProperty('articlesCount');
      expect(result.articlesCount).toBe(5);
      expect(Array.isArray(result.articles)).toBe(true);
      expect(result.articles).toHaveLength(2);
    });

    it('should return total count without pagination applied', async () => {
      const mockArticles = [{ id: 1 }, { id: 2 }];

      (prisma.article.count as jest.Mock).mockResolvedValue(100);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);

      const result = await findArticles(2, 10, undefined, undefined, undefined, undefined);

      expect(result.articlesCount).toBe(100);
      expect(result.articles).toHaveLength(2);
    });

    it('should return empty articles array when no articles match filters', async () => {
      (prisma.article.count as jest.Mock).mockResolvedValue(0);
      (prisma.article.findMany as jest.Mock).mockResolvedValue([]);

      const result = await findArticles(10, 0, 'nonexistent', undefined, undefined, undefined);

      expect(result.articles).toEqual([]);
      expect(result.articlesCount).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should throw HttpException with 500 status when prisma.article.count fails', async () => {
      (prisma.article.count as jest.Mock).mockRejectedValue(new Error('Database connection error'));

      await expect(
        findArticles(10, 0, undefined, undefined, undefined, undefined)
      ).rejects.toThrow(HttpException);

      await expect(
        findArticles(10, 0, undefined, undefined, undefined, undefined)
      ).rejects.toMatchObject({
        status: 500,
        errors: { database: ['Failed to fetch articles from database'] },
      });
    });

    it('should throw HttpException with 500 status when prisma.article.findMany fails', async () => {
      (prisma.article.count as jest.Mock).mockResolvedValue(10);
      (prisma.article.findMany as jest.Mock).mockRejectedValue(new Error('Query execution error'));

      await expect(
        findArticles(10, 0, undefined, undefined, undefined, undefined)
      ).rejects.toThrow(HttpException);

      await expect(
        findArticles(10, 0, undefined, undefined, undefined, undefined)
      ).rejects.toMatchObject({
        status: 500,
        errors: { database: ['Failed to fetch articles from database'] },
      });
    });

    it('should throw descriptive error message for database query failures', async () => {
      (prisma.article.count as jest.Mock).mockRejectedValue(new Error('Connection timeout'));

      try {
        await findArticles(10, 0, undefined, undefined, undefined, undefined);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.errors.database).toContain('Failed to fetch articles from database');
      }
    });

    it('should handle articleMapper throwing errors', async () => {
      const mockArticles = [{ id: 1 }];

      (prisma.article.count as jest.Mock).mockResolvedValue(1);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);
      (articleMapper as jest.Mock).mockImplementation(() => {
        throw new Error('Mapper error');
      });

      await expect(
        findArticles(10, 0, undefined, undefined, undefined, undefined)
      ).rejects.toThrow(HttpException);
    });
  });

  describe('Authenticated vs Anonymous Requests', () => {
    it('should pass currentUserId to articleMapper for authenticated requests', async () => {
      const mockArticles = [{ id: 1 }];

      (prisma.article.count as jest.Mock).mockResolvedValue(1);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);

      await findArticles(10, 0, undefined, undefined, undefined, 42);

      expect(articleMapper).toHaveBeenCalledWith(mockArticles[0], 42);
    });

    it('should pass undefined to articleMapper for anonymous requests', async () => {
      const mockArticles = [{ id: 1 }];

      (prisma.article.count as jest.Mock).mockResolvedValue(1);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);

      await findArticles(10, 0, undefined, undefined, undefined, undefined);

      expect(articleMapper).toHaveBeenCalledWith(mockArticles[0], undefined);
    });
  });

  describe('Edge Cases', () => {
    it('should handle limit of 0', async () => {
      (prisma.article.count as jest.Mock).mockResolvedValue(10);
      (prisma.article.findMany as jest.Mock).mockResolvedValue([]);

      const result = await findArticles(0, 0, undefined, undefined, undefined, undefined);

      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 0,
        })
      );
      expect(result.articles).toEqual([]);
    });

    it('should handle negative limit gracefully', async () => {
      (prisma.article.count as jest.Mock).mockResolvedValue(10);
      (prisma.article.findMany as jest.Mock).mockResolvedValue([]);

      await findArticles(-5, 0, undefined, undefined, undefined, undefined);

      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: -5,
        })
      );
    });

    it('should handle empty string filters', async () => {
      const mockArticles: any[] = [];

      (prisma.article.count as jest.Mock).mockResolvedValue(0);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);

      await findArticles(10, 0, '', '', '', undefined);

      expect(prisma.article.count).toHaveBeenCalledWith({
        where: {},
      });
    });

    it('should handle special characters in filter parameters', async () => {
      const mockArticles: any[] = [];

      (prisma.article.count as jest.Mock).mockResolvedValue(0);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);

      await findArticles(10, 0, 'tag@#$', 'user!@#', 'fav%^&', undefined);

      expect(prisma.article.count).toHaveBeenCalledWith({
        where: {
          AND: [
            {
              tagList: {
                some: {
                  name: 'tag@#$',
                },
              },
            },
            {
              author: {
                username: {
                  equals: 'user!@#',
                },
              },
            },
            {
              favoritedBy: {
                some: {
                  username: {
                    equals: 'fav%^&',
                  },
                },
              },
            },
          ],
        },
      });
    });

    it('should handle very large limit values', async () => {
      const mockArticles = Array.from({ length: 100 }, (_, i) => ({ id: i + 1 }));

      (prisma.article.count as jest.Mock).mockResolvedValue(100);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);

      await findArticles(1000000, 0, undefined, undefined, undefined, undefined);

      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 1000000,
        })
      );
    });
  });

  describe('Integration with Existing Methods', () => {
    it('should not interfere with existing getArticles method', async () => {
      const mockArticles = [{ id: 1 }];

      (prisma.article.count as jest.Mock).mockResolvedValue(1);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);

      await findArticles(10, 0, undefined, undefined, undefined, undefined);

      expect(prisma.article.count).toHaveBeenCalled();
      expect(prisma.article.findMany).toHaveBeenCalled();
    });

    it('should use the same prisma client instance as other methods', async () => {
      const mockArticles = [{ id: 1 }];

      (prisma.article.count as jest.Mock).mockResolvedValue(1);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);

      await findArticles(10, 0, undefined, undefined, undefined, undefined);

      expect(prisma.article.count).toHaveBeenCalled();
      expect(prisma.article.findMany).toHaveBeenCalled();
    });
  });
});