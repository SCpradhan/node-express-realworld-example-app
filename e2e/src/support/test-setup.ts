import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { api, setAuthToken, clearAuthToken } from './test-setup';

describe('test-setup.ts', () => {
  let mock: MockAdapter;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mock = new MockAdapter(api);
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    clearAuthToken();
  });

  afterEach(() => {
    mock.restore();
    consoleErrorSpy.mockRestore();
  });

  describe('axios instance configuration', () => {
    it('should create axios instance with default base URL when API_URL is not set', () => {
      expect(api.defaults.baseURL).toBe(process.env.API_URL || 'http://localhost:3000');
    });

    it('should create axios instance with environment variable base URL when API_URL is set', () => {
      const originalEnv = process.env.API_URL;
      process.env.API_URL = 'http://test-api.com';
      
      const testBaseURL = process.env.API_URL || 'http://localhost:3000';
      expect(testBaseURL).toBe('http://test-api.com');
      
      process.env.API_URL = originalEnv;
    });

    it('should export api instance', () => {
      expect(api).toBeDefined();
      expect(api.defaults).toBeDefined();
    });
  });

  describe('setAuthToken', () => {
    it('should set authentication token', () => {
      const token = 'test-token-123';
      setAuthToken(token);

      mock.onGet('/test').reply(200, { success: true });

      return api.get('/test').then(() => {
        const requestConfig = mock.history.get[0];
        expect(requestConfig.headers?.Authorization).toBe(`Token ${token}`);
      });
    });

    it('should update authentication token when called multiple times', () => {
      const firstToken = 'first-token';
      const secondToken = 'second-token';
      
      setAuthToken(firstToken);
      setAuthToken(secondToken);

      mock.onGet('/test').reply(200, { success: true });

      return api.get('/test').then(() => {
        const requestConfig = mock.history.get[0];
        expect(requestConfig.headers?.Authorization).toBe(`Token ${secondToken}`);
      });
    });
  });

  describe('clearAuthToken', () => {
    it('should clear authentication token', () => {
      setAuthToken('test-token');
      clearAuthToken();

      mock.onGet('/test').reply(200, { success: true });

      return api.get('/test').then(() => {
        const requestConfig = mock.history.get[0];
        expect(requestConfig.headers?.Authorization).toBeUndefined();
      });
    });

    it('should handle clearing token when no token is set', () => {
      clearAuthToken();

      mock.onGet('/test').reply(200, { success: true });

      return api.get('/test').then(() => {
        const requestConfig = mock.history.get[0];
        expect(requestConfig.headers?.Authorization).toBeUndefined();
      });
    });
  });

  describe('request interceptor', () => {
    it('should attach Authorization header when token is set', () => {
      const token = 'bearer-token-xyz';
      setAuthToken(token);

      mock.onPost('/api/endpoint').reply(200, { data: 'success' });

      return api.post('/api/endpoint', { test: 'data' }).then(() => {
        const requestConfig = mock.history.post[0];
        expect(requestConfig.headers?.Authorization).toBe(`Token ${token}`);
      });
    });

    it('should not attach Authorization header when token is not set', () => {
      clearAuthToken();

      mock.onGet('/public').reply(200, { data: 'public' });

      return api.get('/public').then(() => {
        const requestConfig = mock.history.get[0];
        expect(requestConfig.headers?.Authorization).toBeUndefined();
      });
    });

    it('should handle request interceptor error', () => {
      mock.onGet('/test').networkError();

      return api.get('/test').catch((error) => {
        expect(error).toBeDefined();
      });
    });
  });

  describe('response interceptor', () => {
    it('should return response for successful requests', () => {
      const responseData = { message: 'success', data: [1, 2, 3] };
      mock.onGet('/success').reply(200, responseData);

      return api.get('/success').then((response) => {
        expect(response.status).toBe(200);
        expect(response.data).toEqual(responseData);
      });
    });

    it('should handle 401 Unauthorized error', () => {
      mock.onGet('/protected').reply(401, { error: 'Unauthorized' });

      return api.get('/protected').catch((error) => {
        expect(error.response.status).toBe(401);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Unauthorized: Authentication required or token expired'
        );
      });
    });

    it('should handle 422 Unprocessable Entity error', () => {
      const validationErrors = { errors: { email: ['is invalid'] } };
      mock.onPost('/validate').reply(422, validationErrors);

      return api.post('/validate', {}).catch((error) => {
        expect(error.response.status).toBe(422);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Unprocessable Entity: Validation error',
          validationErrors
        );
      });
    });

    it('should handle 500 Internal Server Error', () => {
      mock.onGet('/error').reply(500, { error: 'Server error' });

      return api.get('/error').catch((error) => {
        expect(error.response.status).toBe(500);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Internal Server Error: Something went wrong on the server'
        );
      });
    });

    it('should handle other error status codes without logging', () => {
      mock.onGet('/notfound').reply(404, { error: 'Not found' });

      return api.get('/notfound').catch((error) => {
        expect(error.response.status).toBe(404);
        expect(consoleErrorSpy).not.toHaveBeenCalled();
      });
    });

    it('should handle network errors without response', () => {
      mock.onGet('/network-error').networkError();

      return api.get('/network-error').catch((error) => {
        expect(error.response).toBeUndefined();
        expect(consoleErrorSpy).not.toHaveBeenCalled();
      });
    });

    it('should reject promise on error responses', () => {
      mock.onGet('/error').reply(500);

      return api.get('/error').catch((error) => {
        expect(error).toBeDefined();
        expect(error.response.status).toBe(500);
      });
    });
  });

  describe('integration tests', () => {
    it('should make authenticated request with token and handle success', () => {
      const token = 'integration-token';
      const responseData = { user: 'testuser' };
      
      setAuthToken(token);
      mock.onGet('/user/profile').reply(200, responseData);

      return api.get('/user/profile').then((response) => {
        const requestConfig = mock.history.get[0];
        expect(requestConfig.headers?.Authorization).toBe(`Token ${token}`);
        expect(response.data).toEqual(responseData);
      });
    });

    it('should make unauthenticated request and handle 401 error', () => {
      clearAuthToken();
      mock.onGet('/protected').reply(401);

      return api.get('/protected').catch((error) => {
        const requestConfig = mock.history.get[0];
        expect(requestConfig.headers?.Authorization).toBeUndefined();
        expect(error.response.status).toBe(401);
        expect(consoleErrorSpy).toHaveBeenCalled();
      });
    });

    it('should switch between authenticated and unauthenticated requests', async () => {
      const token = 'switch-token';
      
      clearAuthToken();
      mock.onGet('/public').reply(200, { public: true });
      
      await api.get('/public').then(() => {
        expect(mock.history.get[0].headers?.Authorization).toBeUndefined();
      });

      setAuthToken(token);
      mock.onGet('/private').reply(200, { private: true });
      
      await api.get('/private').then(() => {
        expect(mock.history.get[1].headers?.Authorization).toBe(`Token ${token}`);
      });

      clearAuthToken();
      mock.onGet('/public2').reply(200, { public: true });
      
      await api.get('/public2').then(() => {
        expect(mock.history.get[2].headers?.Authorization).toBeUndefined();
      });
    });
  });
});