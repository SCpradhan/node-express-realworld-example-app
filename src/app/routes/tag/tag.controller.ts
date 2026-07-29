import { Request, Response, NextFunction } from 'express';
import * as tagService from '../../services/tag.service';
import tagController from './tag.controller';

jest.mock('../../services/tag.service');

describe('Tag Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockRequest = {};
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('GET /tags', () => {
    it('should return 200 status with tags array when tags are retrieved successfully', async () => {
      const mockTags = ['reactjs', 'nodejs', 'typescript', 'express'];
      (tagService.getAllTags as jest.Mock).mockResolvedValue(mockTags);

      const routeHandler = tagController.stack.find(
        (layer: any) => layer.route?.path === '/' && layer.route?.methods.get
      )?.route.stack[0].handle;

      await routeHandler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(tagService.getAllTags).toHaveBeenCalledTimes(1);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ tags: mockTags });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 200 status with empty tags array when no tags exist', async () => {
      const mockTags: string[] = [];
      (tagService.getAllTags as jest.Mock).mockResolvedValue(mockTags);

      const routeHandler = tagController.stack.find(
        (layer: any) => layer.route?.path === '/' && layer.route?.methods.get
      )?.route.stack[0].handle;

      await routeHandler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(tagService.getAllTags).toHaveBeenCalledTimes(1);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ tags: [] });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error when tagService.getAllTags throws an error', async () => {
      const mockError = new Error('Database connection failed');
      (tagService.getAllTags as jest.Mock).mockRejectedValue(mockError);

      const routeHandler = tagController.stack.find(
        (layer: any) => layer.route?.path === '/' && layer.route?.methods.get
      )?.route.stack[0].handle;

      await routeHandler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(tagService.getAllTags).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(statusMock).not.toHaveBeenCalled();
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it('should call next with error when tagService.getAllTags throws a generic error', async () => {
      const mockError = new Error('Unexpected error');
      (tagService.getAllTags as jest.Mock).mockRejectedValue(mockError);

      const routeHandler = tagController.stack.find(
        (layer: any) => layer.route?.path === '/' && layer.route?.methods.get
      )?.route.stack[0].handle;

      await routeHandler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(tagService.getAllTags).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should handle service returning null or undefined gracefully', async () => {
      (tagService.getAllTags as jest.Mock).mockResolvedValue(null);

      const routeHandler = tagController.stack.find(
        (layer: any) => layer.route?.path === '/' && layer.route?.methods.get
      )?.route.stack[0].handle;

      await routeHandler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(tagService.getAllTags).toHaveBeenCalledTimes(1);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ tags: null });
    });

    it('should verify router is an Express Router instance', () => {
      expect(tagController).toBeDefined();
      expect(typeof tagController).toBe('function');
    });

    it('should verify GET route is registered on root path', () => {
      const getRoute = tagController.stack.find(
        (layer: any) => layer.route?.path === '/' && layer.route?.methods.get
      );
      expect(getRoute).toBeDefined();
    });

    it('should not require authentication for GET /tags endpoint', async () => {
      const mockTags = ['tag1', 'tag2'];
      (tagService.getAllTags as jest.Mock).mockResolvedValue(mockTags);

      const routeHandler = tagController.stack.find(
        (layer: any) => layer.route?.path === '/' && layer.route?.methods.get
      )?.route.stack[0].handle;

      await routeHandler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ tags: mockTags });
    });
  });
});