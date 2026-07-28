import TagService from './tag.service';
import { Article } from '../../models/article.model';

jest.mock('../../models/article.model');

describe('TagService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTags', () => {
    it('should return an array of distinct tags', async () => {
      const mockTags = ['javascript', 'typescript', 'nodejs', 'testing'];
      const mockDistinct = jest.fn().mockResolvedValue(mockTags);
      const mockFind = jest.fn().mockReturnValue({
        distinct: mockDistinct
      });
      
      (Article.find as jest.Mock) = mockFind;

      const result = await TagService.getTags();

      expect(Article.find).toHaveBeenCalledTimes(1);
      expect(mockDistinct).toHaveBeenCalledWith('tagList');
      expect(result).toEqual(mockTags);
    });

    it('should return an empty array when no tags exist', async () => {
      const mockTags: string[] = [];
      const mockDistinct = jest.fn().mockResolvedValue(mockTags);
      const mockFind = jest.fn().mockReturnValue({
        distinct: mockDistinct
      });
      
      (Article.find as jest.Mock) = mockFind;

      const result = await TagService.getTags();

      expect(Article.find).toHaveBeenCalledTimes(1);
      expect(mockDistinct).toHaveBeenCalledWith('tagList');
      expect(result).toEqual([]);
    });

    it('should throw an error when database query fails', async () => {
      const mockError = new Error('Database connection failed');
      const mockDistinct = jest.fn().mockRejectedValue(mockError);
      const mockFind = jest.fn().mockReturnValue({
        distinct: mockDistinct
      });
      
      (Article.find as jest.Mock) = mockFind;

      await expect(TagService.getTags()).rejects.toThrow('Database connection failed');
      expect(Article.find).toHaveBeenCalledTimes(1);
      expect(mockDistinct).toHaveBeenCalledWith('tagList');
    });

    it('should handle null or undefined values in tag list', async () => {
      const mockTags = ['javascript', null, 'typescript', undefined, 'nodejs'];
      const mockDistinct = jest.fn().mockResolvedValue(mockTags);
      const mockFind = jest.fn().mockReturnValue({
        distinct: mockDistinct
      });
      
      (Article.find as jest.Mock) = mockFind;

      const result = await TagService.getTags();

      expect(Article.find).toHaveBeenCalledTimes(1);
      expect(mockDistinct).toHaveBeenCalledWith('tagList');
      expect(result).toEqual(mockTags);
    });

    it('should verify that getTags does not interact with article body or readingTime', async () => {
      const mockTags = ['tag1', 'tag2'];
      const mockDistinct = jest.fn().mockResolvedValue(mockTags);
      const mockFind = jest.fn().mockReturnValue({
        distinct: mockDistinct
      });
      
      (Article.find as jest.Mock) = mockFind;

      await TagService.getTags();

      expect(mockDistinct).toHaveBeenCalledWith('tagList');
      expect(mockDistinct).not.toHaveBeenCalledWith('body');
      expect(mockDistinct).not.toHaveBeenCalledWith('readingTime');
    });

    it('should call Article.find without any filters', async () => {
      const mockTags = ['tag1'];
      const mockDistinct = jest.fn().mockResolvedValue(mockTags);
      const mockFind = jest.fn().mockReturnValue({
        distinct: mockDistinct
      });
      
      (Article.find as jest.Mock) = mockFind;

      await TagService.getTags();

      expect(Article.find).toHaveBeenCalledWith();
      expect(Article.find).toHaveBeenCalledTimes(1);
    });

    it('should handle large arrays of tags efficiently', async () => {
      const mockTags = Array.from({ length: 1000 }, (_, i) => `tag${i}`);
      const mockDistinct = jest.fn().mockResolvedValue(mockTags);
      const mockFind = jest.fn().mockReturnValue({
        distinct: mockDistinct
      });
      
      (Article.find as jest.Mock) = mockFind;

      const result = await TagService.getTags();

      expect(result).toHaveLength(1000);
      expect(Article.find).toHaveBeenCalledTimes(1);
    });

    it('should propagate specific database errors correctly', async () => {
      const mockError = new Error('Timeout error');
      mockError.name = 'MongoTimeoutError';
      const mockDistinct = jest.fn().mockRejectedValue(mockError);
      const mockFind = jest.fn().mockReturnValue({
        distinct: mockDistinct
      });
      
      (Article.find as jest.Mock) = mockFind;

      await expect(TagService.getTags()).rejects.toThrow('Timeout error');
      await expect(TagService.getTags()).rejects.toMatchObject({ name: 'MongoTimeoutError' });
    });
  });
});