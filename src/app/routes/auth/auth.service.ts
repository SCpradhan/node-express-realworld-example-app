import { AuthService } from './auth.service';
import { UserRepository } from '../../repositories/user.repository';
import { User } from '../../models/user.model';
import * as jwt from 'jsonwebtoken';

jest.mock('../../repositories/user.repository');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  const mockUser: User = {
    id: '123',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedpassword123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
    mockUserRepository = (authService as any).userRepository;
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);

      const result = await authService.register('testuser', 'test@example.com', 'password123');

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        password: expect.any(String),
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw error if user already exists', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(
        authService.register('testuser', 'test@example.com', 'password123')
      ).rejects.toThrow('User already exists');

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should hash password before creating user', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);

      await authService.register('testuser', 'test@example.com', 'password123');

      const createCall = mockUserRepository.create.mock.calls[0][0];
      expect(createCall.password).not.toBe('password123');
      expect(createCall.password).toHaveLength(128);
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const hashedPassword = (authService as any).hashPassword('password123');
      const userWithHashedPassword = { ...mockUser, password: hashedPassword };
      mockUserRepository.findByEmail.mockResolvedValue(userWithHashedPassword);
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');

      const result = await authService.login('test@example.com', 'password123');

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(result).toEqual({
        user: userWithHashedPassword,
        token: 'mock-token',
      });
    });

    it('should throw error if user not found', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(authService.login('test@example.com', 'password123')).rejects.toThrow(
        'Invalid credentials'
      );

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should throw error if password is invalid', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(authService.login('test@example.com', 'wrongpassword')).rejects.toThrow(
        'Invalid credentials'
      );

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should generate token with correct user data', async () => {
      const hashedPassword = (authService as any).hashPassword('password123');
      const userWithHashedPassword = { ...mockUser, password: hashedPassword };
      mockUserRepository.findByEmail.mockResolvedValue(userWithHashedPassword);
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');

      await authService.login('test@example.com', 'password123');

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
        },
        expect.any(String),
        { expiresIn: '7d' }
      );
    });
  });

  describe('getCurrentUser', () => {
    it('should return user by id', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await authService.getCurrentUser('123');

      expect(mockUserRepository.findById).toHaveBeenCalledWith('123');
      expect(result).toEqual(mockUser);
    });

    it('should throw error if user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(authService.getCurrentUser('123')).rejects.toThrow('User not found');

      expect(mockUserRepository.findById).toHaveBeenCalledWith('123');
    });
  });

  describe('updateUser', () => {
    it('should successfully update user', async () => {
      const updates = { username: 'newusername' };
      const updatedUser = { ...mockUser, ...updates };
      mockUserRepository.update.mockResolvedValue(updatedUser);

      const result = await authService.updateUser('123', updates);

      expect(mockUserRepository.update).toHaveBeenCalledWith('123', updates);
      expect(result).toEqual(updatedUser);
    });

    it('should hash password if password is being updated', async () => {
      const updates = { password: 'newpassword123' };
      const updatedUser = { ...mockUser };
      mockUserRepository.update.mockResolvedValue(updatedUser);

      await authService.updateUser('123', updates);

      const updateCall = mockUserRepository.update.mock.calls[0][1];
      expect(updateCall.password).not.toBe('newpassword123');
      expect(updateCall.password).toHaveLength(128);
    });

    it('should throw error if user not found', async () => {
      mockUserRepository.update.mockResolvedValue(null);

      await expect(authService.updateUser('123', { username: 'newusername' })).rejects.toThrow(
        'User not found'
      );

      expect(mockUserRepository.update).toHaveBeenCalledWith('123', { username: 'newusername' });
    });

    it('should update multiple fields including password', async () => {
      const updates = { username: 'newusername', email: 'newemail@example.com', password: 'newpass' };
      const updatedUser = { ...mockUser, ...updates };
      mockUserRepository.update.mockResolvedValue(updatedUser);

      await authService.updateUser('123', updates);

      const updateCall = mockUserRepository.update.mock.calls[0][1];
      expect(updateCall.username).toBe('newusername');
      expect(updateCall.email).toBe('newemail@example.com');
      expect(updateCall.password).not.toBe('newpass');
      expect(updateCall.password).toHaveLength(128);
    });
  });

  describe('generateToken', () => {
    it('should generate JWT token with user data', () => {
      (jwt.sign as jest.Mock).mockReturnValue('generated-token');

      const token = authService.generateToken(mockUser);

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
        },
        expect.any(String),
        { expiresIn: '7d' }
      );
      expect(token).toBe('generated-token');
    });

    it('should use JWT_SECRET from environment or default', () => {
      (jwt.sign as jest.Mock).mockReturnValue('token');

      authService.generateToken(mockUser);

      const secret = (authService as any).secret;
      expect(secret).toBeDefined();
    });
  });

  describe('verifyToken', () => {
    it('should successfully verify valid token', () => {
      const decodedToken = { id: '123', username: 'testuser', email: 'test@example.com' };
      (jwt.verify as jest.Mock).mockReturnValue(decodedToken);

      const result = authService.verifyToken('valid-token');

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', expect.any(String));
      expect(result).toEqual(decodedToken);
    });

    it('should throw error for invalid token', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('jwt malformed');
      });

      expect(() => authService.verifyToken('invalid-token')).toThrow('Invalid token');

      expect(jwt.verify).toHaveBeenCalledWith('invalid-token', expect.any(String));
    });

    it('should throw error for expired token', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('jwt expired');
      });

      expect(() => authService.verifyToken('expired-token')).toThrow('Invalid token');
    });
  });

  describe('password hashing', () => {
    it('should consistently hash the same password', () => {
      const password = 'testpassword123';
      const hash1 = (authService as any).hashPassword(password);
      const hash2 = (authService as any).hashPassword(password);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(128);
    });

    it('should verify correct password', () => {
      const password = 'testpassword123';
      const hashedPassword = (authService as any).hashPassword(password);

      const isValid = (authService as any).verifyPassword(password, hashedPassword);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', () => {
      const password = 'testpassword123';
      const hashedPassword = (authService as any).hashPassword(password);

      const isValid = (authService as any).verifyPassword('wrongpassword', hashedPassword);

      expect(isValid).toBe(false);
    });

    it('should produce different hashes for different passwords', () => {
      const hash1 = (authService as any).hashPassword('password1');
      const hash2 = (authService as any).hashPassword('password2');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('compatibility with article data containing readingTime', () => {
    it('should handle user profile with articles containing readingTime field', async () => {
      const userWithArticles = {
        ...mockUser,
        articles: [
          {
            id: 'article1',
            title: 'Test Article',
            body: 'Test content',
            readingTime: 5,
          },
        ],
      };
      mockUserRepository.findById.mockResolvedValue(userWithArticles);

      const result = await authService.getCurrentUser('123');

      expect(result).toEqual(userWithArticles);
      expect(result.articles[0].readingTime).toBe(5);
    });

    it('should update user without affecting article readingTime data', async () => {
      const userWithArticles = {
        ...mockUser,
        articles: [
          {
            id: 'article1',
            title: 'Test Article',
            body: 'Test content',
            readingTime: 5,
          },
        ],
      };
      mockUserRepository.update.mockResolvedValue(userWithArticles);

      const result = await authService.updateUser('123', { username: 'newname' });

      expect(result.articles[0].readingTime).toBe(5);
    });

    it('should generate token for user with articles containing readingTime', () => {
      const userWithArticles = {
        ...mockUser,
        articles: [
          {
            id: 'article1',
            readingTime: 5,
          },
        ],
      };
      (jwt.sign as jest.Mock).mockReturnValue('token-with-articles');

      const token = authService.generateToken(userWithArticles);

      expect(token).toBe('token-with-articles');
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          id: userWithArticles.id,
          username: userWithArticles.username,
          email: userWithArticles.email,
        },
        expect.any(String),
        { expiresIn: '7d' }
      );
    });
  });
});