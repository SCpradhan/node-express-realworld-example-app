import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const result = await authService.register(userData);

      expect(result).toBeDefined();
      expect(result.user.username).toBe(userData.username);
      expect(result.user.email).toBe(userData.email);
      expect(result.user.token).toBeDefined();
    });

    it('should throw error when registering with existing email', async () => {
      const userData = {
        username: 'testuser',
        email: 'existing@example.com',
        password: 'password123'
      };

      await expect(authService.register(userData)).rejects.toThrow();
    });

    it('should hash password before storing', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const result = await authService.register(userData);

      expect(result.user.password).not.toBe(userData.password);
    });

    it('should validate email format', async () => {
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'password123'
      };

      await expect(authService.register(userData)).rejects.toThrow();
    });

    it('should validate username length', async () => {
      const userData = {
        username: 'ab',
        email: 'test@example.com',
        password: 'password123'
      };

      await expect(authService.register(userData)).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const result = await authService.login(credentials);

      expect(result).toBeDefined();
      expect(result.user.email).toBe(credentials.email);
      expect(result.user.token).toBeDefined();
    });

    it('should throw error with invalid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      await expect(authService.login(credentials)).rejects.toThrow();
    });

    it('should throw error when user does not exist', async () => {
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      await expect(authService.login(credentials)).rejects.toThrow();
    });

    it('should generate valid JWT token on successful login', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const result = await authService.login(credentials);

      expect(result.user.token).toMatch(/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/);
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user with valid token', async () => {
      const token = 'valid-jwt-token';

      const result = await authService.getCurrentUser(token);

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.token).toBe(token);
    });

    it('should throw error with invalid token', async () => {
      const token = 'invalid-token';

      await expect(authService.getCurrentUser(token)).rejects.toThrow();
    });

    it('should throw error with expired token', async () => {
      const token = 'expired-jwt-token';

      await expect(authService.getCurrentUser(token)).rejects.toThrow();
    });

    it('should throw error when token is missing', async () => {
      await expect(authService.getCurrentUser(null)).rejects.toThrow();
    });
  });

  describe('updateUser', () => {
    it('should update user profile successfully', async () => {
      const userId = 1;
      const updateData = {
        username: 'updateduser',
        bio: 'Updated bio',
        image: 'https://example.com/image.jpg'
      };

      const result = await authService.updateUser(userId, updateData);

      expect(result).toBeDefined();
      expect(result.user.username).toBe(updateData.username);
      expect(result.user.bio).toBe(updateData.bio);
    });

    it('should update only provided fields', async () => {
      const userId = 1;
      const updateData = {
        bio: 'Updated bio only'
      };

      const result = await authService.updateUser(userId, updateData);

      expect(result).toBeDefined();
      expect(result.user.bio).toBe(updateData.bio);
    });

    it('should throw error when updating with existing username', async () => {
      const userId = 1;
      const updateData = {
        username: 'existinguser'
      };

      await expect(authService.updateUser(userId, updateData)).rejects.toThrow();
    });

    it('should throw error when user does not exist', async () => {
      const userId = 999;
      const updateData = {
        username: 'updateduser'
      };

      await expect(authService.updateUser(userId, updateData)).rejects.toThrow();
    });

    it('should update password with hashing', async () => {
      const userId = 1;
      const updateData = {
        password: 'newpassword123'
      };

      const result = await authService.updateUser(userId, updateData);

      expect(result.user.password).not.toBe(updateData.password);
    });
  });
});