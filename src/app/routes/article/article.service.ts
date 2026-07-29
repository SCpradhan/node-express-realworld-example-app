import { PrismaClient } from '@prisma/client';
import * as articleService from './article.service';

jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    user: {
      findUnique: jest.fn(),
    },
    article: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    favorite: {
      create: jest.fn(),
      delete: jest.fn(),
    },
    comment: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

describe('Article Service', () => {
  let prisma: any;

  beforeEach(() => {
    prisma = new PrismaClient();
    jest.clearAllMocks();
  });

  describe('createArticle', () => {
    const userId = 1;
    const articleData = {
      title: 'Test Article',
      description: 'Test Description',
      body: 'Test Body',
      tagList: ['test', 'article'],
    };

    it('should create an article when user exists', async () => {
      const mockUser = { id: userId, email: 'test@example.com' };
      const mockArticle = {
        id: 1,
        ...articleData,
        authorId: userId,
        author: mockUser,
        favorites: [],
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.article.create.mockResolvedValue(mockArticle);

      const result = await articleService.createArticle(userId, articleData);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: userId } });
      expect(prisma.article.create).toHaveBeenCalledWith({
        data: {
          title: articleData.title,
          description: articleData.description,
          body: articleData.body,
          authorId: userId,
          tagList: articleData.tagList,
        },
        include: {
          author: true,
          favorites: true,
        },
      });
      expect(result).toEqual(mockArticle);
    });

    it('should throw 401 error when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(articleService.createArticle(userId, articleData)).rejects.toThrow('User not found');
      
      try {
        await articleService.createArticle(userId, articleData);
      } catch (error: any) {
        expect(error.status).toBe(401);
      }

      expect(prisma.article.create).not.toHaveBeenCalled();
    });

    it('should handle empty tagList by defaulting to empty array', async () => {
      const mockUser = { id: userId, email: 'test@example.com' };
      const articleDataNoTags = {
        title: 'Test Article',
        description: 'Test Description',
        body: 'Test Body',
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.article.create.mockResolvedValue({});

      await articleService.createArticle(userId, articleDataNoTags);

      expect(prisma.article.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tagList: [],
          }),
        })
      );
    });
  });

  describe('updateArticle', () => {
    const userId = 1;
    const articleId = 1;
    const updateData = {
      title: 'Updated Title',
      description: 'Updated Description',
    };

    it('should update article when user is the author', async () => {
      const mockArticle = { id: articleId, authorId: userId, title: 'Old Title' };
      const mockUpdatedArticle = { ...mockArticle, ...updateData };

      prisma.article.findUnique.mockResolvedValue(mockArticle);
      prisma.article.update.mockResolvedValue(mockUpdatedArticle);

      const result = await articleService.updateArticle(userId, articleId, updateData);

      expect(prisma.article.findUnique).toHaveBeenCalledWith({ where: { id: articleId } });
      expect(prisma.article.update).toHaveBeenCalledWith({
        where: { id: articleId },
        data: updateData,
        include: {
          author: true,
          favorites: true,
        },
      });
      expect(result).toEqual(mockUpdatedArticle);
    });

    it('should throw 403 error when user is not the author', async () => {
      const mockArticle = { id: articleId, authorId: 2, title: 'Old Title' };

      prisma.article.findUnique.mockResolvedValue(mockArticle);

      await expect(articleService.updateArticle(userId, articleId, updateData)).rejects.toThrow('Not authorized to update this article');
      
      try {
        await articleService.updateArticle(userId, articleId, updateData);
      } catch (error: any) {
        expect(error.status).toBe(403);
      }

      expect(prisma.article.update).not.toHaveBeenCalled();
    });

    it('should throw 404 error when article does not exist', async () => {
      prisma.article.findUnique.mockResolvedValue(null);

      await expect(articleService.updateArticle(userId, articleId, updateData)).rejects.toThrow('Article not found');
      
      try {
        await articleService.updateArticle(userId, articleId, updateData);
      } catch (error: any) {
        expect(error.status).toBe(404);
      }

      expect(prisma.article.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteArticle', () => {
    const userId = 1;
    const articleId = 1;

    it('should delete article when user is the author', async () => {
      const mockArticle = { id: articleId, authorId: userId, title: 'Test Article' };

      prisma.article.findUnique.mockResolvedValue(mockArticle);
      prisma.article.delete.mockResolvedValue(mockArticle);

      const result = await articleService.deleteArticle(userId, articleId);

      expect(prisma.article.findUnique).toHaveBeenCalledWith({ where: { id: articleId } });
      expect(prisma.article.delete).toHaveBeenCalledWith({ where: { id: articleId } });
      expect(result).toEqual({ message: 'Article deleted successfully' });
    });

    it('should throw 403 error when user is not the author', async () => {
      const mockArticle = { id: articleId, authorId: 2, title: 'Test Article' };

      prisma.article.findUnique.mockResolvedValue(mockArticle);

      await expect(articleService.deleteArticle(userId, articleId)).rejects.toThrow('Not authorized to delete this article');
      
      try {
        await articleService.deleteArticle(userId, articleId);
      } catch (error: any) {
        expect(error.status).toBe(403);
      }

      expect(prisma.article.delete).not.toHaveBeenCalled();
    });

    it('should throw 404 error when article does not exist', async () => {
      prisma.article.findUnique.mockResolvedValue(null);

      await expect(articleService.deleteArticle(userId, articleId)).rejects.toThrow('Article not found');
      
      try {
        await articleService.deleteArticle(userId, articleId);
      } catch (error: any) {
        expect(error.status).toBe(404);
      }

      expect(prisma.article.delete).not.toHaveBeenCalled();
    });
  });

  describe('favoriteArticle', () => {
    const userId = 1;
    const articleId = 1;

    it('should create favorite relationship when valid userId and articleId provided', async () => {
      const mockFavorite = { userId, articleId, createdAt: new Date() };

      prisma.favorite.create.mockResolvedValue(mockFavorite);

      const result = await articleService.favoriteArticle(userId, articleId);

      expect(prisma.favorite.create).toHaveBeenCalledWith({
        data: {
          userId,
          articleId,
        },
      });
      expect(result).toEqual(mockFavorite);
    });

    it('should throw 401 error when userId is not provided', async () => {
      await expect(articleService.favoriteArticle(0, articleId)).rejects.toThrow('User ID is required');
      
      try {
        await articleService.favoriteArticle(0, articleId);
      } catch (error: any) {
        expect(error.status).toBe(401);
      }

      expect(prisma.favorite.create).not.toHaveBeenCalled();
    });

    it('should throw 400 error when article is already favorited (P2002 constraint)', async () => {
      const prismaError = new Error('Unique constraint failed');
      (prismaError as any).code = 'P2002';

      prisma.favorite.create.mockRejectedValue(prismaError);

      await expect(articleService.favoriteArticle(userId, articleId)).rejects.toThrow('Article already favorited');
      
      try {
        await articleService.favoriteArticle(userId, articleId);
      } catch (error: any) {
        expect(error.status).toBe(400);
      }
    });

    it('should throw 404 error when article or user not found (P2003 foreign key constraint)', async () => {
      const prismaError = new Error('Foreign key constraint failed');
      (prismaError as any).code = 'P2003';

      prisma.favorite.create.mockRejectedValue(prismaError);

      await expect(articleService.favoriteArticle(userId, articleId)).rejects.toThrow('Article or user not found');
      
      try {
        await articleService.favoriteArticle(userId, articleId);
      } catch (error: any) {
        expect(error.status).toBe(404);
      }
    });

    it('should rethrow unknown database errors', async () => {
      const unknownError = new Error('Unknown database error');

      prisma.favorite.create.mockRejectedValue(unknownError);

      await expect(articleService.favoriteArticle(userId, articleId)).rejects.toThrow('Unknown database error');
    });
  });

  describe('unfavoriteArticle', () => {
    const userId = 1;
    const articleId = 1;

    it('should delete favorite relationship when valid userId and articleId provided', async () => {
      prisma.favorite.delete.mockResolvedValue({});

      const result = await articleService.unfavoriteArticle(userId, articleId);

      expect(prisma.favorite.delete).toHaveBeenCalledWith({
        where: {
          userId_articleId: {
            userId,
            articleId,
          },
        },
      });
      expect(result).toEqual({ message: 'Article unfavorited successfully' });
    });

    it('should throw 401 error when userId is not provided', async () => {
      await expect(articleService.unfavoriteArticle(0, articleId)).rejects.toThrow('User ID is required');
      
      try {
        await articleService.unfavoriteArticle(0, articleId);
      } catch (error: any) {
        expect(error.status).toBe(401);
      }

      expect(prisma.favorite.delete).not.toHaveBeenCalled();
    });

    it('should throw 404 error when favorite not found (P2025 record not found)', async () => {
      const prismaError = new Error('Record to delete does not exist');
      (prismaError as any).code = 'P2025';

      prisma.favorite.delete.mockRejectedValue(prismaError);

      await expect(articleService.unfavoriteArticle(userId, articleId)).rejects.toThrow('Favorite not found');
      
      try {
        await articleService.unfavoriteArticle(userId, articleId);
      } catch (error: any) {
        expect(error.status).toBe(404);
      }
    });

    it('should rethrow unknown database errors', async () => {
      const unknownError = new Error('Unknown database error');

      prisma.favorite.delete.mockRejectedValue(unknownError);

      await expect(articleService.unfavoriteArticle(userId, articleId)).rejects.toThrow('Unknown database error');
    });
  });

  describe('getArticle', () => {
    const articleId = 1;

    it('should retrieve article with author, favorites, and comments', async () => {
      const mockArticle = {
        id: articleId,
        title: 'Test Article',
        author: { id: 1, email: 'test@example.com' },
        favorites: [],
        comments: [],
      };

      prisma.article.findUnique.mockResolvedValue(mockArticle);

      const result = await articleService.getArticle(articleId);

      expect(prisma.article.findUnique).toHaveBeenCalledWith({
        where: { id: articleId },
        include: {
          author: true,
          favorites: true,
          comments: true,
        },
      });
      expect(result).toEqual(mockArticle);
    });

    it('should return null when article does not exist', async () => {
      prisma.article.findUnique.mockResolvedValue(null);

      const result = await articleService.getArticle(articleId);

      expect(result).toBeNull();
    });
  });

  describe('createComment', () => {
    const userId = 1;
    const articleId = 1;
    const body = 'Test comment';

    it('should create comment when user exists', async () => {
      const mockUser = { id: userId, email: 'test@example.com' };
      const mockComment = {
        id: 1,
        body,
        authorId: userId,
        articleId,
        author: mockUser,
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.comment.create.mockResolvedValue(mockComment);

      const result = await articleService.createComment(userId, articleId, body);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: userId } });
      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: {
          body,
          authorId: userId,
          articleId,
        },
        include: {
          author: true,
        },
      });
      expect(result).toEqual(mockComment);
    });

    it('should throw 401 error when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(articleService.createComment(userId, articleId, body)).rejects.toThrow('User not found');
      
      try {
        await articleService.createComment(userId, articleId, body);
      } catch (error: any) {
        expect(error.status).toBe(401);
      }

      expect(prisma.comment.create).not.toHaveBeenCalled();
    });
  });

  describe('deleteComment', () => {
    const userId = 1;
    const commentId = 1;

    it('should delete comment when user is the author', async () => {
      const mockComment = { id: commentId, authorId: userId, body: 'Test comment' };

      prisma.comment.findUnique.mockResolvedValue(mockComment);
      prisma.comment.delete.mockResolvedValue(mockComment);

      const result = await articleService.deleteComment(userId, commentId);

      expect(prisma.comment.findUnique).toHaveBeenCalledWith({ where: { id: commentId } });
      expect(prisma.comment.delete).toHaveBeenCalledWith({ where: { id: commentId } });
      expect(result).toEqual({ message: 'Comment deleted successfully' });
    });

    it('should throw 403 error when user is not the author', async () => {
      const mockComment = { id: commentId, authorId: 2, body: 'Test comment' };

      prisma.comment.findUnique.mockResolvedValue(mockComment);

      await expect(articleService.deleteComment(userId, commentId)).rejects.toThrow('Not authorized to delete this comment');
      
      try {
        await articleService.deleteComment(userId, commentId);
      } catch (error: any) {
        expect(error.status).toBe(403);
      }

      expect(prisma.comment.delete).not.toHaveBeenCalled();
    });

    it('should throw 404 error when comment does not exist', async () => {
      prisma.comment.findUnique.mockResolvedValue(null);

      await expect(articleService.deleteComment(userId, commentId)).rejects.toThrow('Comment not found');
      
      try {
        await articleService.deleteComment(userId, commentId);
      } catch (error: any) {
        expect(error.status).toBe(404);
      }

      expect(prisma.comment.delete).not.toHaveBeenCalled();
    });
  });

  describe('getArticleComments', () => {
    const articleId = 1;

    it('should retrieve all comments for an article ordered by createdAt desc', async () => {
      const mockComments = [
        { id: 2, body: 'Second comment', articleId, author: { id: 1 }, createdAt: new Date('2023-01-02') },
        { id: 1, body: 'First comment', articleId, author: { id: 1 }, createdAt: new Date('2023-01-01') },
      ];

      prisma.comment.findMany.mockResolvedValue(mockComments);

      const result = await articleService.getArticleComments(articleId);

      expect(prisma.comment.findMany).toHaveBeenCalledWith({
        where: { articleId },
        include: {
          author: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toEqual(mockComments);
    });

    it('should return empty array when no comments exist', async () => {
      prisma.comment.findMany.mockResolvedValue([]);

      const result = await articleService.getArticleComments(articleId);

      expect(result).toEqual([]);
    });
  });
});