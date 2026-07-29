import { Router } from 'express';
import routes from './routes';
import authRouter from './auth/auth.controller';
import articleRouter from './article/article.controller';
import profileRouter from './profile/profile.controller';
import tagRouter from './tag/tag.controller';

jest.mock('express');
jest.mock('./auth/auth.controller');
jest.mock('./article/article.controller');
jest.mock('./profile/profile.controller');
jest.mock('./tag/tag.controller');

describe('routes.ts', () => {
  let mockRouter: any;
  let mockUse: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUse = jest.fn();
    mockRouter = {
      use: mockUse,
    };
    (Router as jest.Mock).mockReturnValue(mockRouter);
  });

  describe('Router Initialization', () => {
    it('should create a router instance using express.Router()', () => {
      jest.isolateModules(() => {
        require('./routes');
      });
      expect(Router).toHaveBeenCalled();
    });
  });

  describe('Controller Imports', () => {
    it('should import authRouter from ./auth/auth.controller', () => {
      expect(authRouter).toBeDefined();
    });

    it('should import articleRouter from ./article/article.controller', () => {
      expect(articleRouter).toBeDefined();
    });

    it('should import profileRouter from ./profile/profile.controller', () => {
      expect(profileRouter).toBeDefined();
    });

    it('should import tagRouter from ./tag/tag.controller', () => {
      expect(tagRouter).toBeDefined();
    });
  });

  describe('Route Mounting', () => {
    beforeEach(() => {
      jest.isolateModules(() => {
        require('./routes');
      });
    });

    it('should mount authRouter at /api path', () => {
      expect(mockUse).toHaveBeenCalledWith('/api', authRouter);
    });

    it('should mount articleRouter at /api path', () => {
      expect(mockUse).toHaveBeenCalledWith('/api', articleRouter);
    });

    it('should mount profileRouter at /api path', () => {
      expect(mockUse).toHaveBeenCalledWith('/api', profileRouter);
    });

    it('should mount tagRouter at /api path', () => {
      expect(mockUse).toHaveBeenCalledWith('/api', tagRouter);
    });

    it('should mount all routers exactly 4 times', () => {
      expect(mockUse).toHaveBeenCalledTimes(4);
    });
  });

  describe('Route Mounting Order', () => {
    it('should mount authRouter first to maintain authentication flow', () => {
      jest.isolateModules(() => {
        require('./routes');
      });
      expect(mockUse.mock.calls[0]).toEqual(['/api', authRouter]);
    });

    it('should mount articleRouter second', () => {
      jest.isolateModules(() => {
        require('./routes');
      });
      expect(mockUse.mock.calls[1]).toEqual(['/api', articleRouter]);
    });

    it('should mount profileRouter third', () => {
      jest.isolateModules(() => {
        require('./routes');
      });
      expect(mockUse.mock.calls[2]).toEqual(['/api', profileRouter]);
    });

    it('should mount tagRouter fourth', () => {
      jest.isolateModules(() => {
        require('./routes');
      });
      expect(mockUse.mock.calls[3]).toEqual(['/api', tagRouter]);
    });

    it('should preserve middleware execution sequence by maintaining mount order', () => {
      jest.isolateModules(() => {
        require('./routes');
      });
      const callOrder = mockUse.mock.calls.map(call => call[1]);
      expect(callOrder).toEqual([authRouter, articleRouter, profileRouter, tagRouter]);
    });
  });

  describe('API Base Path', () => {
    it('should use /api as base path for all routes', () => {
      jest.isolateModules(() => {
        require('./routes');
      });
      mockUse.mock.calls.forEach(call => {
        expect(call[0]).toBe('/api');
      });
    });

    it('should maintain /api prefix to preserve API contract with frontend clients', () => {
      jest.isolateModules(() => {
        require('./routes');
      });
      const allPathsAreApi = mockUse.mock.calls.every(call => call[0] === '/api');
      expect(allPathsAreApi).toBe(true);
    });
  });

  describe('Router Export', () => {
    it('should export the configured router as default export', () => {
      expect(routes).toBeDefined();
      expect(routes).toBe(mockRouter);
    });

    it('should export a router instance with use method', () => {
      expect(routes).toHaveProperty('use');
      expect(typeof routes.use).toBe('function');
    });
  });

  describe('Module Structure', () => {
    it('should use correct relative paths for all controller imports', () => {
      const moduleExports = require('./routes');
      expect(moduleExports.default).toBeDefined();
    });

    it('should be compatible with main.ts entry point import', () => {
      expect(() => {
        const importedRoutes = require('./routes').default;
        expect(importedRoutes).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Integration Points', () => {
    it('should aggregate all API controllers under single router', () => {
      jest.isolateModules(() => {
        require('./routes');
      });
      expect(mockUse).toHaveBeenCalledWith('/api', authRouter);
      expect(mockUse).toHaveBeenCalledWith('/api', articleRouter);
      expect(mockUse).toHaveBeenCalledWith('/api', profileRouter);
      expect(mockUse).toHaveBeenCalledWith('/api', tagRouter);
    });

    it('should serve as entry point for all API routes', () => {
      const router = require('./routes').default;
      expect(router).toBe(mockRouter);
      expect(mockUse).toHaveBeenCalledTimes(4);
    });
  });

  describe('Critical Path Protection', () => {
    it('should not break authentication flow for protected endpoints', () => {
      jest.isolateModules(() => {
        require('./routes');
      });
      const authRouterIndex = mockUse.mock.calls.findIndex(call => call[1] === authRouter);
      expect(authRouterIndex).toBe(0);
    });

    it('should maintain consistent route structure to prevent breaking API consumers', () => {
      jest.isolateModules(() => {
        require('./routes');
      });
      expect(mockUse).toHaveBeenCalledTimes(4);
      mockUse.mock.calls.forEach(call => {
        expect(call[0]).toBe('/api');
        expect(call[1]).toBeDefined();
      });
    });
  });
});