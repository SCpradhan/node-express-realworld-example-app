import { profileMapper, toProfileResponse, ProfileResponse } from './profile.utils';
import { IUser } from '../../models/User';

describe('profile.utils.ts', () => {
  describe('profileMapper', () => {
    it('should map user to profile response with following false by default', () => {
      const mockUser: IUser = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'https://example.com/image.jpg',
        email: 'test@example.com',
        password: 'hashedpassword'
      } as IUser;

      const result: ProfileResponse = profileMapper(mockUser);

      expect(result).toEqual({
        profile: {
          username: 'testuser',
          bio: 'Test bio',
          image: 'https://example.com/image.jpg',
          following: false
        }
      });
    });

    it('should map user to profile response with following true when specified', () => {
      const mockUser: IUser = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'https://example.com/image.jpg',
        email: 'test@example.com',
        password: 'hashedpassword'
      } as IUser;

      const result: ProfileResponse = profileMapper(mockUser, true);

      expect(result).toEqual({
        profile: {
          username: 'testuser',
          bio: 'Test bio',
          image: 'https://example.com/image.jpg',
          following: true
        }
      });
    });

    it('should use empty string for bio when bio is null', () => {
      const mockUser: IUser = {
        username: 'testuser',
        bio: null,
        image: 'https://example.com/image.jpg',
        email: 'test@example.com',
        password: 'hashedpassword'
      } as IUser;

      const result: ProfileResponse = profileMapper(mockUser);

      expect(result.profile.bio).toBe('');
    });

    it('should use empty string for bio when bio is undefined', () => {
      const mockUser: IUser = {
        username: 'testuser',
        bio: undefined,
        image: 'https://example.com/image.jpg',
        email: 'test@example.com',
        password: 'hashedpassword'
      } as IUser;

      const result: ProfileResponse = profileMapper(mockUser);

      expect(result.profile.bio).toBe('');
    });

    it('should use default image when image is null', () => {
      const mockUser: IUser = {
        username: 'testuser',
        bio: 'Test bio',
        image: null,
        email: 'test@example.com',
        password: 'hashedpassword'
      } as IUser;

      const result: ProfileResponse = profileMapper(mockUser);

      expect(result.profile.image).toBe('https://static.productionready.io/images/smiley-cyrus.jpg');
    });

    it('should use default image when image is undefined', () => {
      const mockUser: IUser = {
        username: 'testuser',
        bio: 'Test bio',
        image: undefined,
        email: 'test@example.com',
        password: 'hashedpassword'
      } as IUser;

      const result: ProfileResponse = profileMapper(mockUser);

      expect(result.profile.image).toBe('https://static.productionready.io/images/smiley-cyrus.jpg');
    });

    it('should use default image when image is empty string', () => {
      const mockUser: IUser = {
        username: 'testuser',
        bio: 'Test bio',
        image: '',
        email: 'test@example.com',
        password: 'hashedpassword'
      } as IUser;

      const result: ProfileResponse = profileMapper(mockUser);

      expect(result.profile.image).toBe('https://static.productionready.io/images/smiley-cyrus.jpg');
    });
  });

  describe('toProfileResponse', () => {
    it('should return profile with following false when no currentUserId provided', () => {
      const mockUser: IUser = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'https://example.com/image.jpg',
        email: 'test@example.com',
        password: 'hashedpassword',
        followers: []
      } as IUser;

      const result: ProfileResponse = toProfileResponse(mockUser);

      expect(result.profile.following).toBe(false);
    });

    it('should return profile with following false when currentUserId is undefined', () => {
      const mockUser: IUser = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'https://example.com/image.jpg',
        email: 'test@example.com',
        password: 'hashedpassword',
        followers: ['follower1', 'follower2']
      } as IUser;

      const result: ProfileResponse = toProfileResponse(mockUser, undefined);

      expect(result.profile.following).toBe(false);
    });

    it('should return profile with following true when currentUserId is in followers', () => {
      const currentUserId = 'user123';
      const mockUser: IUser = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'https://example.com/image.jpg',
        email: 'test@example.com',
        password: 'hashedpassword',
        followers: [
          { toString: () => 'user456' },
          { toString: () => 'user123' },
          { toString: () => 'user789' }
        ]
      } as any;

      const result: ProfileResponse = toProfileResponse(mockUser, currentUserId);

      expect(result.profile.following).toBe(true);
    });

    it('should return profile with following false when currentUserId is not in followers', () => {
      const currentUserId = 'user999';
      const mockUser: IUser = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'https://example.com/image.jpg',
        email: 'test@example.com',
        password: 'hashedpassword',
        followers: [
          { toString: () => 'user456' },
          { toString: () => 'user123' },
          { toString: () => 'user789' }
        ]
      } as any;

      const result: ProfileResponse = toProfileResponse(mockUser, currentUserId);

      expect(result.profile.following).toBe(false);
    });

    it('should return profile with following false when followers array is empty', () => {
      const currentUserId = 'user123';
      const mockUser: IUser = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'https://example.com/image.jpg',
        email: 'test@example.com',
        password: 'hashedpassword',
        followers: []
      } as IUser;

      const result: ProfileResponse = toProfileResponse(mockUser, currentUserId);

      expect(result.profile.following).toBe(false);
    });

    it('should return profile with following false when followers is undefined', () => {
      const currentUserId = 'user123';
      const mockUser: IUser = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'https://example.com/image.jpg',
        email: 'test@example.com',
        password: 'hashedpassword',
        followers: undefined
      } as any;

      const result: ProfileResponse = toProfileResponse(mockUser, currentUserId);

      expect(result.profile.following).toBe(false);
    });

    it('should return profile with following false when followers is null', () => {
      const currentUserId = 'user123';
      const mockUser: IUser = {
        username: 'testuser',
        bio: 'Test bio',
        image: 'https://example.com/image.jpg',
        email: 'test@example.com',
        password: 'hashedpassword',
        followers: null
      } as any;

      const result: ProfileResponse = toProfileResponse(mockUser, currentUserId);

      expect(result.profile.following).toBe(false);
    });

    it('should apply default bio and image when not provided', () => {
      const mockUser: IUser = {
        username: 'testuser',
        bio: null,
        image: null,
        email: 'test@example.com',
        password: 'hashedpassword',
        followers: []
      } as IUser;

      const result: ProfileResponse = toProfileResponse(mockUser);

      expect(result.profile.bio).toBe('');
      expect(result.profile.image).toBe('https://static.productionready.io/images/smiley-cyrus.jpg');
    });

    it('should correctly map all profile properties with following status', () => {
      const currentUserId = 'user123';
      const mockUser: IUser = {
        username: 'johndoe',
        bio: 'Software Developer',
        image: 'https://example.com/johndoe.jpg',
        email: 'john@example.com',
        password: 'hashedpassword',
        followers: [{ toString: () => 'user123' }]
      } as any;

      const result: ProfileResponse = toProfileResponse(mockUser, currentUserId);

      expect(result).toEqual({
        profile: {
          username: 'johndoe',
          bio: 'Software Developer',
          image: 'https://example.com/johndoe.jpg',
          following: true
        }
      });
    });
  });
});