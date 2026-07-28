import { ArticleService } from './article.service';
import { Article } from './article.model';
import { User } from '../user/user.model';
import { ArticleMapper } from './article.mapper';

jest.mock('./article.model');
jest.mock('../user/user.model');
jest.mock('./article.mapper');

describe('ArticleService', () => {
  let articleService: ArticleService;
  let mockArticleMapper: jest.Mocked<ArticleMapper>;

  beforeEach(() => {
    jest.clearAllMocks();
    articleService = new ArticleService();
    mockArticleMapper = (articleService as any).articleMapper;
  });

  describe('getArticle', () => {
    it('should retrieve a single article by slug and delegate to mapper', async () => {
      const mockSlug = 'test-article-slug';
      const mockUser = { _id: 'user123', username: 'testuser' } as User;
      const mockArticle = {
        _id: 'article123',
        slug: mockSlug,
        title: 'Test Article',
        body: 'This is a test article body with some content.',
        author: { _id: 'author123', username: 'author' }
      };
      const mockMappedResponse = {
        slug: mockSlug,
        title: 'Test Article',
        body: 'This is a test article body with some content.',
        readingTime: 1
      };

      (Article.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockArticle)
      });
      mockArticleMapper.toArticleResponse.mockReturnValue(mockMappedResponse);

      const result = await articleService.getArticle(mockSlug, mockUser);

      expect(Article.findOne).toHaveBeenCalledWith({ slug: mockSlug });
      expect(mockArticleMapper.toArticleResponse).toHaveBeenCalledWith(mockArticle, mockUser);
      expect(result).toEqual(mockMappedResponse);
    });

    it('should pass raw article data including body field to mapper without modification', async () => {
      const mockSlug = 'test-slug';
      const mockArticle = {
        _id: 'article123',
        slug: mockSlug,
        title: 'Test',
        body: 'Raw body content that should not be modified',
        description: 'Test description',
        tagList: ['test']
      };

      (Article.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockArticle)
      });
      mockArticleMapper.toArticleResponse.mockReturnValue({});

      await articleService.getArticle(mockSlug);

      const mapperCallArgs = mockArticleMapper.toArticleResponse.mock.calls[0][0];
      expect(mapperCallArgs).toEqual(mockArticle);
      expect(mapperCallArgs.body).toBe('Raw body content that should not be modified');
    });

    it('should throw error when article is not found', async () => {
      const mockSlug = 'non-existent-slug';

      (Article.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await expect(articleService.getArticle(mockSlug)).rejects.toThrow('Article not found');
      expect(mockArticleMapper.toArticleResponse).not.toHaveBeenCalled();
    });

    it('should handle articles with missing body content by delegating to mapper', async () => {
      const mockSlug = 'article-no-body';
      const mockArticle = {
        _id: 'article123',
        slug: mockSlug,
        title: 'Test',
        body: null
      };

      (Article.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockArticle)
      });
      mockArticleMapper.toArticleResponse.mockReturnValue({});

      await articleService.getArticle(mockSlug);

      expect(mockArticleMapper.toArticleResponse).toHaveBeenCalledWith(mockArticle, undefined);
    });

    it('should work without authenticated user', async () => {
      const mockSlug = 'public-article';
      const mockArticle = { _id: 'article123', slug: mockSlug, body: 'content' };

      (Article.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockArticle)
      });
      mockArticleMapper.toArticleResponse.mockReturnValue({});

      await articleService.getArticle(mockSlug);

      expect(mockArticleMapper.toArticleResponse).toHaveBeenCalledWith(mockArticle, undefined);
    });
  });

  describe('getArticles', () => {
    it('should retrieve multiple articles with default pagination and delegate to mapper', async () => {
      const mockArticles = [
        { _id: 'article1', slug: 'article-1', body: 'Body 1', author: {} },
        { _id: 'article2', slug: 'article-2', body: 'Body 2', author: {} }
      ];

      (Article.find as jest.Mock).mockReturnValue({
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockArticles)
      });
      (Article.countDocuments as jest.Mock).mockResolvedValue(2);
      mockArticleMapper.toArticleResponse.mockImplementation((article) => ({ ...article, readingTime: 1 }));

      const result = await articleService.getArticles({});

      expect(Article.find).toHaveBeenCalledWith({});
      expect(mockArticleMapper.toArticleResponse).toHaveBeenCalledTimes(2);
      expect(result.articles).toHaveLength(2);
      expect(result.articlesCount).toBe(2);
    });

    it('should pass raw article data including body field to mapper for each article', async () => {
      const mockArticles = [
        { _id: 'article1', body: 'Raw body 1' },
        { _id: 'article2', body: 'Raw body 2' }
      ];

      (Article.find as jest.Mock).mockReturnValue({
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockArticles)
      });
      (Article.countDocuments as jest.Mock).mockResolvedValue(2);
      mockArticleMapper.toArticleResponse.mockReturnValue({});

      await articleService.getArticles({});

      expect(mockArticleMapper.toArticleResponse).toHaveBeenNthCalledWith(1, mockArticles[0], undefined);
      expect(mockArticleMapper.toArticleResponse).toHaveBeenNthCalledWith(2, mockArticles[1], undefined);
    });

    it('should filter articles by tag', async () => {
      const mockQuery = { tag: 'javascript' };

      (Article.find as jest.Mock).mockReturnValue({
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue([])
      });
      (Article.countDocuments as jest.Mock).mockResolvedValue(0);

      await articleService.getArticles(mockQuery);

      expect(Article.find).toHaveBeenCalledWith({ tagList: { $in: ['javascript'] } });
    });

    it('should filter articles by author', async () => {
      const mockQuery = { author: 'testauthor' };
      const mockAuthor = { _id: 'author123', username: 'testauthor' };

      (User.findOne as jest.Mock).mockResolvedValue(mockAuthor);
      (Article.find as jest.Mock).mockReturnValue({
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue([])
      });
      (Article.countDocuments as jest.Mock).mockResolvedValue(0);

      await articleService.getArticles(mockQuery);

      expect(User.findOne).toHaveBeenCalledWith({ username: 'testauthor' });
      expect(Article.find).toHaveBeenCalledWith({ author: 'author123' });
    });

    it('should filter articles by favorited user', async () => {
      const mockQuery = { favorited: 'favoriteuser' };
      const mockFavoritedUser = { _id: 'user123', username: 'favoriteuser', favorites: ['article1', 'article2'] };

      (User.findOne as jest.Mock).mockResolvedValue(mockFavoritedUser);
      (Article.find as jest.Mock).mockReturnValue({
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue([])
      });
      (Article.countDocuments as jest.Mock).mockResolvedValue(0);

      await articleService.getArticles(mockQuery);

      expect(User.findOne).toHaveBeenCalledWith({ username: 'favoriteuser' });
      expect(Article.find).toHaveBeenCalledWith({ _id: { $in: ['article1', 'article2'] } });
    });

    it('should apply custom limit and offset', async () => {
      const mockQuery = { limit: 10, offset: 5 };
      const mockFind = {
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue([])
      };

      (Article.find as jest.Mock).mockReturnValue(mockFind);
      (Article.countDocuments as jest.Mock).mockResolvedValue(0);

      await articleService.getArticles(mockQuery);

      expect(mockFind.limit).toHaveBeenCalledWith(10);
      expect(mockFind.skip).toHaveBeenCalledWith(5);
    });

    it('should handle empty article list', async () => {
      (Article.find as jest.Mock).mockReturnValue({
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue([])
      });
      (Article.countDocuments as jest.Mock).mockResolvedValue(0);

      const result = await articleService.getArticles({});

      expect(result.articles).toEqual([]);
      expect(result.articlesCount).toBe(0);
    });
  });

  describe('getFeed', () => {
    it('should retrieve user feed and delegate to mapper', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        following: ['author1', 'author2']
      } as User;
      const mockArticles = [
        { _id: 'article1', body: 'Feed article 1', author: 'author1' },
        { _id: 'article2', body: 'Feed article 2', author: 'author2' }
      ];

      (Article.find as jest.Mock).mockReturnValue({
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockArticles)
      });
      (Article.countDocuments as jest.Mock).mockResolvedValue(2);
      mockArticleMapper.toArticleResponse.mockReturnValue({});

      const result = await articleService.getFeed(mockUser, {});

      expect(Article.find).toHaveBeenCalledWith({ author: { $in: ['author1', 'author2'] } });
      expect(mockArticleMapper.toArticleResponse).toHaveBeenCalledTimes(2);
      expect(result.articles).toHaveLength(2);
      expect(result.articlesCount).toBe(2);
    });

    it('should pass raw article data including body field to mapper for feed articles', async () => {
      const mockUser = {
        _id: 'user123',
        following: ['author1']
      } as User;
      const mockArticles = [
        { _id: 'article1', body: 'Raw feed body content', author: 'author1' }
      ];

      (Article.find as jest.Mock).mockReturnValue({
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockArticles)
      });
      (Article.countDocuments as jest.Mock).mockResolvedValue(1);
      mockArticleMapper.toArticleResponse.mockReturnValue({});

      await articleService.getFeed(mockUser, {});

      expect(mockArticleMapper.toArticleResponse).toHaveBeenCalledWith(mockArticles[0], mockUser);
      expect(mockArticleMapper.toArticleResponse.mock.calls[0][0].body).toBe('Raw feed body content');
    });

    it('should throw error when user is not authenticated', async () => {
      await expect(articleService.getFeed(null as any, {})).rejects.toThrow('User must be authenticated to access feed');
      expect(Article.find).not.toHaveBeenCalled();
    });

    it('should handle user with no following list', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        following: undefined
      } as User;

      (Article.find as jest.Mock).mockReturnValue({
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue([])
      });
      (Article.countDocuments as jest.Mock).mockResolvedValue(0);

      const result = await articleService.getFeed(mockUser, {});

      expect(Article.find).toHaveBeenCalledWith({ author: { $in: undefined } });
      expect(result.articles).toEqual([]);
    });

    it('should apply custom limit and offset to feed', async () => {
      const mockUser = {
        _id: 'user123',
        following: ['author1']
      } as User;
      const mockQuery = { limit: 5, offset: 10 };
      const mockFind = {
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue([])
      };

      (Article.find as jest.Mock).mockReturnValue(mockFind);
      (Article.countDocuments as jest.Mock).mockResolvedValue(0);

      await articleService.getFeed(mockUser, mockQuery);

      expect(mockFind.limit).toHaveBeenCalledWith(5);
      expect(mockFind.skip).toHaveBeenCalledWith(10);
    });

    it('should verify readingTime calculation is delegated to mapper layer', async () => {
      const mockUser = {
        _id: 'user123',
        following: ['author1']
      } as User;
      const mockArticle = {
        _id: 'article1',
        body: 'This is a long article body that would require reading time calculation',
        author: 'author1'
      };

      (Article.find as jest.Mock).mockReturnValue({
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue([mockArticle])
      });
      (Article.countDocuments as jest.Mock).mockResolvedValue(1);
      mockArticleMapper.toArticleResponse.mockReturnValue({ readingTime: 2 });

      await articleService.getFeed(mockUser, {});

      // Verify service does not calculate readingTime
      const mapperCallArgs = mockArticleMapper.toArticleResponse.mock.calls[0][0];
      expect(mapperCallArgs).not.toHaveProperty('readingTime');
      expect(mockArticleMapper.toArticleResponse).toHaveBeenCalledWith(mockArticle, mockUser);
    });
  });

  describe('Error handling for invalid body content', () => {
    it('should delegate error handling for missing body to mapper in getArticle', async () => {
      const mockArticle = { _id: 'article1', slug: 'test', body: undefined };

      (Article.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockArticle)
      });
      mockArticleMapper.toArticleResponse.mockReturnValue({});

      await articleService.getArticle('test');

      expect(mockArticleMapper.toArticleResponse).toHaveBeenCalledWith(mockArticle, undefined);
    });

    it('should delegate error handling for empty body to mapper in getArticles', async () => {
      const mockArticles = [{ _id: 'article1', body: '' }];

      (Article.find as jest.Mock).mockReturnValue({
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockArticles)
      });
      (Article.countDocuments as jest.Mock).mockResolvedValue(1);
      mockArticleMapper.toArticleResponse.mockReturnValue({});

      await articleService.getArticles({});

      expect(mockArticleMapper.toArticleResponse).toHaveBeenCalledWith(mockArticles[0], undefined);
    });

    it('should delegate error handling for invalid body to mapper in getFeed', async () => {
      const mockUser = { _id: 'user123', following: ['author1'] } as User;
      const mockArticles = [{ _id: 'article1', body: null }];

      (Article.find as jest.Mock).mockReturnValue({
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockArticles)
      });
      (Article.countDocuments as jest.Mock).mockResolvedValue(1);
      mockArticleMapper.toArticleResponse.mockReturnValue({});

      await articleService.getFeed(mockUser, {});

      expect(mockArticleMapper.toArticleResponse).toHaveBeenCalledWith(mockArticles[0], mockUser);
    });
  });

  describe('No breaking changes verification', () => {
    it('should maintain backward compatibility with existing getArticle signature', async () => {
      const mockArticle = { _id: 'article1', slug: 'test', body: 'content' };

      (Article.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockArticle)
      });
      mockArticleMapper.toArticleResponse.mockReturnValue({});

      // Test with slug only
      await articleService.getArticle('test');
      expect(mockArticleMapper.toArticleResponse).toHaveBeenCalled();

      // Test with slug and user
      const mockUser = { _id: 'user123' } as User;
      await articleService.getArticle('test', mockUser);
      expect(mockArticleMapper.toArticleResponse).toHaveBeenCalledWith(mockArticle, mockUser);
    });

    it('should maintain backward compatibility with existing getArticles signature', async () => {
      (Article.find as jest.Mock).mockReturnValue({
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue([])
      });
      (Article.countDocuments as jest.Mock).mockResolvedValue(0);

      // Test with empty query
      const result1 = await articleService.getArticles({});
      expect(result1).toHaveProperty('articles');
      expect(result1).toHaveProperty('articlesCount');

      // Test with query and user
      const mockUser = { _id: 'user123' } as User;
      const result2 = await articleService.getArticles({ tag: 'test' }, mockUser);
      expect(result2).toHaveProperty('articles');
      expect(result2).toHaveProperty('articlesCount');
    });

    it('should maintain backward compatibility with existing getFeed signature', async () => {
      const mockUser = { _id: 'user123', following: [] } as User;

      (Article.find as jest.Mock).mockReturnValue({
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue([])
      });
      (Article.countDocuments as jest.Mock).mockResolvedValue(0);

      const result = await articleService.getFeed(mockUser, {});
      expect(result).toHaveProperty('articles');
      expect(result).toHaveProperty('articlesCount');
    });
  });
});