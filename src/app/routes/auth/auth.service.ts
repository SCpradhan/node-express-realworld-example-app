import { PrismaClient } from '@prisma/client';
import { registerUser, loginUser, getCurrentUser, updateUser } from './auth.service';
import { setPassword, validPassword, toAuthJSON } from '../../models/user.model';

jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

jest.mock('../../models/user.model', () => ({
  setPassword: jest.fn(),
  validPassword: jest.fn(),
  generateJWT: jest.fn(),
  toAuthJSON: jest.fn(),
}));

describe('Auth Service', () => {
  let prisma: any;

  beforeEach(() => {
    prisma = new PrismaClient();
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    const validEmail = 'test@example.com';
    const validUsername = 'testuser';
    const validPassword = 'password123';

    it('should successfully register a user with valid inputs', async () => {
      const hashedPassword = 'hashed_password';
      const mockUser = { id: 1, email: validEmail, username: validUsername, password: hashedPassword };
      const mockAuthJSON = { user: { email: validEmail, username: validUsername, token: 'jwt_token' } };

      prisma.user.findUnique.mockResolvedValue(null);
      (setPassword as jest.Mock).mockReturnValue(hashedPassword);
      prisma.user.create.mockResolvedValue(mockUser);
      (toAuthJSON as jest.Mock).mockReturnValue(mockAuthJSON);

      const result = await registerUser(validEmail, validUsername, validPassword);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: validEmail } });
      expect(setPassword).toHaveBeenCalledWith(validPassword);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { email: validEmail, username: validUsername, password: hashedPassword },
      });
      expect(toAuthJSON).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockAuthJSON);
    });

    it('should throw 422 error for invalid email format', async () => {
      const invalidEmail = 'invalid-email';

      await expect(registerUser(invalidEmail, validUsername, validPassword)).rejects.toThrow('Invalid email format');
      await expect(registerUser(invalidEmail, validUsername, validPassword)).rejects.toMatchObject({ status: 422 });
    });

    it('should throw 422 error for email without @', async () => {
      const invalidEmail = 'invalidemail.com';

      await expect(registerUser(invalidEmail, validUsername, validPassword)).rejects.toThrow('Invalid email format');
      await expect(registerUser(invalidEmail, validUsername, validPassword)).rejects.toMatchObject({ status: 422 });
    });

    it('should throw 422 error for email without domain', async () => {
      const invalidEmail = 'test@';

      await expect(registerUser(invalidEmail, validUsername, validPassword)).rejects.toThrow('Invalid email format');
      await expect(registerUser(invalidEmail, validUsername, validPassword)).rejects.toMatchObject({ status: 422 });
    });

    it('should throw 422 error for password less than 8 characters', async () => {
      const shortPassword = 'pass123';

      await expect(registerUser(validEmail, validUsername, shortPassword)).rejects.toThrow('Password must be at least 8 characters');
      await expect(registerUser(validEmail, validUsername, shortPassword)).rejects.toMatchObject({ status: 422 });
    });

    it('should throw 422 error for password exactly 7 characters', async () => {
      const shortPassword = 'pass12';

      await expect(registerUser(validEmail, validUsername, shortPassword)).rejects.toThrow('Password must be at least 8 characters');
      await expect(registerUser(validEmail, validUsername, shortPassword)).rejects.toMatchObject({ status: 422 });
    });

    it('should accept password exactly 8 characters', async () => {
      const minPassword = 'pass1234';
      const hashedPassword = 'hashed_password';
      const mockUser = { id: 1, email: validEmail, username: validUsername, password: hashedPassword };
      const mockAuthJSON = { user: { email: validEmail, username: validUsername, token: 'jwt_token' } };

      prisma.user.findUnique.mockResolvedValue(null);
      (setPassword as jest.Mock).mockReturnValue(hashedPassword);
      prisma.user.create.mockResolvedValue(mockUser);
      (toAuthJSON as jest.Mock).mockReturnValue(mockAuthJSON);

      const result = await registerUser(validEmail, validUsername, minPassword);

      expect(result).toEqual(mockAuthJSON);
    });

    it('should throw 422 error if email already exists', async () => {
      const existingUser = { id: 1, email: validEmail, username: 'existinguser', password: 'hashed' };
      prisma.user.findUnique.mockResolvedValue(existingUser);

      await expect(registerUser(validEmail, validUsername, validPassword)).rejects.toThrow('Email already registered');
      await expect(registerUser(validEmail, validUsername, validPassword)).rejects.toMatchObject({ status: 422 });
    });

    it('should throw 500 error for database errors during findUnique', async () => {
      prisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

      await expect(registerUser(validEmail, validUsername, validPassword)).rejects.toThrow('Database error occurred');
      await expect(registerUser(validEmail, validUsername, validPassword)).rejects.toMatchObject({ status: 500 });
    });

    it('should throw 500 error for database errors during create', async () => {
      const hashedPassword = 'hashed_password';
      prisma.user.findUnique.mockResolvedValue(null);
      (setPassword as jest.Mock).mockReturnValue(hashedPassword);
      prisma.user.create.mockRejectedValue(new Error('Database write failed'));

      await expect(registerUser(validEmail, validUsername, validPassword)).rejects.toThrow('Database error occurred');
      await expect(registerUser(validEmail, validUsername, validPassword)).rejects.toMatchObject({ status: 500 });
    });
  });

  describe('loginUser', () => {
    const validEmail = 'test@example.com';
    const validPassword = 'password123';

    it('should successfully login user with valid credentials', async () => {
      const mockUser = { id: 1, email: validEmail, username: 'testuser', password: 'hashed_password' };
      const mockAuthJSON = { user: { email: validEmail, username: 'testuser', token: 'jwt_token' } };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      (validPassword as jest.Mock).mockReturnValue(true);
      (toAuthJSON as jest.Mock).mockReturnValue(mockAuthJSON);

      const result = await loginUser(validEmail, validPassword);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: validEmail } });
      expect(validPassword).toHaveBeenCalledWith(validPassword, mockUser.password);
      expect(toAuthJSON).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockAuthJSON);
    });

    it('should throw 401 error if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(loginUser(validEmail, validPassword)).rejects.toThrow('Invalid email or password');
      await expect(loginUser(validEmail, validPassword)).rejects.toMatchObject({ status: 401 });
    });

    it('should throw 401 error if password is invalid', async () => {
      const mockUser = { id: 1, email: validEmail, username: 'testuser', password: 'hashed_password' };
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (validPassword as jest.Mock).mockReturnValue(false);

      await expect(loginUser(validEmail, validPassword)).rejects.toThrow('Invalid email or password');
      await expect(loginUser(validEmail, validPassword)).rejects.toMatchObject({ status: 401 });
    });

    it('should throw 500 error for database errors', async () => {
      prisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

      await expect(loginUser(validEmail, validPassword)).rejects.toThrow('Database error occurred');
      await expect(loginUser(validEmail, validPassword)).rejects.toMatchObject({ status: 500 });
    });
  });

  describe('getCurrentUser', () => {
    const userId = 1;

    it('should successfully retrieve current user', async () => {
      const mockUser = { id: userId, email: 'test@example.com', username: 'testuser', password: 'hashed' };
      const mockAuthJSON = { user: { email: 'test@example.com', username: 'testuser', token: 'jwt_token' } };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      (toAuthJSON as jest.Mock).mockReturnValue(mockAuthJSON);

      const result = await getCurrentUser(userId);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: userId } });
      expect(toAuthJSON).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockAuthJSON);
    });

    it('should throw 404 error if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(getCurrentUser(userId)).rejects.toThrow('User not found');
      await expect(getCurrentUser(userId)).rejects.toMatchObject({ status: 404 });
    });

    it('should throw 500 error for database errors', async () => {
      prisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

      await expect(getCurrentUser(userId)).rejects.toThrow('Database error occurred');
      await expect(getCurrentUser(userId)).rejects.toMatchObject({ status: 500 });
    });
  });

  describe('updateUser', () => {
    const userId = 1;

    it('should successfully update user with valid email', async () => {
      const updates = { email: 'newemail@example.com' };
      const mockUser = { id: userId, email: updates.email, username: 'testuser', password: 'hashed' };
      const mockAuthJSON = { user: { email: updates.email, username: 'testuser', token: 'jwt_token' } };

      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.update.mockResolvedValue(mockUser);
      (toAuthJSON as jest.Mock).mockReturnValue(mockAuthJSON);

      const result = await updateUser(userId, updates);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: updates.email } });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { email: updates.email },
      });
      expect(toAuthJSON).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockAuthJSON);
    });

    it('should throw 422 error for invalid email format in update', async () => {
      const updates = { email: 'invalid-email' };

      await expect(updateUser(userId, updates)).rejects.toThrow('Invalid email format');
      await expect(updateUser(userId, updates)).rejects.toMatchObject({ status: 422 });
    });

    it('should throw 422 error if email already taken by another user', async () => {
      const updates = { email: 'taken@example.com' };
      const existingUser = { id: 2, email: updates.email, username: 'otheruser', password: 'hashed' };

      prisma.user.findUnique.mockResolvedValue(existingUser);

      await expect(updateUser(userId, updates)).rejects.toThrow('Email already registered');
      await expect(updateUser(userId, updates)).rejects.toMatchObject({ status: 422 });
    });

    it('should allow email update if email belongs to current user', async () => {
      const updates = { email: 'myemail@example.com' };
      const existingUser = { id: userId, email: updates.email, username: 'testuser', password: 'hashed' };
      const mockAuthJSON = { user: { email: updates.email, username: 'testuser', token: 'jwt_token' } };

      prisma.user.findUnique.mockResolvedValue(existingUser);
      prisma.user.update.mockResolvedValue(existingUser);
      (toAuthJSON as jest.Mock).mockReturnValue(mockAuthJSON);

      const result = await updateUser(userId, updates);

      expect(result).toEqual(mockAuthJSON);
    });

    it('should successfully update user password with valid length', async () => {
      const updates = { password: 'newpassword123' };
      const hashedPassword = 'new_hashed_password';
      const mockUser = { id: userId, email: 'test@example.com', username: 'testuser', password: hashedPassword };
      const mockAuthJSON = { user: { email: 'test@example.com', username: 'testuser', token: 'jwt_token' } };

      (setPassword as jest.Mock).mockReturnValue(hashedPassword);
      prisma.user.update.mockResolvedValue(mockUser);
      (toAuthJSON as jest.Mock).mockReturnValue(mockAuthJSON);

      const result = await updateUser(userId, updates);

      expect(setPassword).toHaveBeenCalledWith(updates.password);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { password: hashedPassword },
      });
      expect(result).toEqual(mockAuthJSON);
    });

    it('should throw 422 error for password less than 8 characters in update', async () => {
      const updates = { password: 'short' };

      await expect(updateUser(userId, updates)).rejects.toThrow('Password must be at least 8 characters');
      await expect(updateUser(userId, updates)).rejects.toMatchObject({ status: 422 });
    });

    it('should successfully update username', async () => {
      const updates = { username: 'newusername' };
      const mockUser = { id: userId, email: 'test@example.com', username: updates.username, password: 'hashed' };
      const mockAuthJSON = { user: { email: 'test@example.com', username: updates.username, token: 'jwt_token' } };

      prisma.user.update.mockResolvedValue(mockUser);
      (toAuthJSON as jest.Mock).mockReturnValue(mockAuthJSON);

      const result = await updateUser(userId, updates);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { username: updates.username },
      });
      expect(result).toEqual(mockAuthJSON);
    });

    it('should successfully update bio', async () => {
      const updates = { bio: 'New bio text' };
      const mockUser = { id: userId, email: 'test@example.com', username: 'testuser', bio: updates.bio, password: 'hashed' };
      const mockAuthJSON = { user: { email: 'test@example.com', username: 'testuser', token: 'jwt_token' } };

      prisma.user.update.mockResolvedValue(mockUser);
      (toAuthJSON as jest.Mock).mockReturnValue(mockAuthJSON);

      const result = await updateUser(userId, updates);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { bio: updates.bio },
      });
      expect(result).toEqual(mockAuthJSON);
    });

    it('should successfully update image', async () => {
      const updates = { image: 'https://example.com/image.jpg' };
      const mockUser = { id: userId, email: 'test@example.com', username: 'testuser', image: updates.image, password: 'hashed' };
      const mockAuthJSON = { user: { email: 'test@example.com', username: 'testuser', token: 'jwt_token' } };

      prisma.user.update.mockResolvedValue(mockUser);
      (toAuthJSON as jest.Mock).mockReturnValue(mockAuthJSON);

      const result = await updateUser(userId, updates);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { image: updates.image },
      });
      expect(result).toEqual(mockAuthJSON);
    });

    it('should successfully update multiple fields at once', async () => {
      const updates = {
        email: 'newemail@example.com',
        username: 'newusername',
        bio: 'New bio',
        image: 'https://example.com/image.jpg',
        password: 'newpassword123',
      };
      const hashedPassword = 'new_hashed_password';
      const mockUser = { id: userId, ...updates, password: hashedPassword };
      const mockAuthJSON = { user: { email: updates.email, username: updates.username, token: 'jwt_token' } };

      prisma.user.findUnique.mockResolvedValue(null);
      (setPassword as jest.Mock).mockReturnValue(hashedPassword);
      prisma.user.update.mockResolvedValue(mockUser);
      (toAuthJSON as jest.Mock).mockReturnValue(mockAuthJSON);

      const result = await updateUser(userId, updates);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          email: updates.email,
          username: updates.username,
          bio: updates.bio,
          image: updates.image,
          password: hashedPassword,
        },
      });
      expect(result).toEqual(mockAuthJSON);
    });

    it('should handle empty updates object', async () => {
      const updates = {};
      const mockUser = { id: userId, email: 'test@example.com', username: 'testuser', password: 'hashed' };
      const mockAuthJSON = { user: { email: 'test@example.com', username: 'testuser', token: 'jwt_token' } };

      prisma.user.update.mockResolvedValue(mockUser);
      (toAuthJSON as jest.Mock).mockReturnValue(mockAuthJSON);

      const result = await updateUser(userId, updates);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {},
      });
      expect(result).toEqual(mockAuthJSON);
    });

    it('should throw 500 error for database errors during update', async () => {
      const updates = { username: 'newusername' };
      prisma.user.update.mockRejectedValue(new Error('Database write failed'));

      await expect(updateUser(userId, updates)).rejects.toThrow('Database error occurred');
      await expect(updateUser(userId, updates)).rejects.toMatchObject({ status: 500 });
    });

    it('should throw 500 error for database errors during email uniqueness check', async () => {
      const updates = { email: 'newemail@example.com' };
      prisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

      await expect(updateUser(userId, updates)).rejects.toThrow('Database error occurred');
      await expect(updateUser(userId, updates)).rejects.toMatchObject({ status: 500 });
    });
  });
});