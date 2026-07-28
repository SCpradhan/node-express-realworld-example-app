import { expect } from 'chai';
import sinon from 'sinon';
import ProfileService from '../../services/profile.service';
import User from '../../models/user.model';

describe('ProfileService', () => {
  let profileService: ProfileService;
  let userModelStub: sinon.SinonStub;

  beforeEach(() => {
    profileService = new ProfileService();
    userModelStub = sinon.stub(User, 'findOne');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getProfile', () => {
    it('should return a user profile with following status', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        following: ['follower123']
      };

      userModelStub.resolves(mockUser);

      const result = await profileService.getProfile('testuser', 'follower123');

      expect(result).to.have.property('username', 'testuser');
      expect(result).to.have.property('bio', 'Test bio');
      expect(result).to.have.property('image', 'http://example.com/image.jpg');
      expect(result).to.have.property('following', true);
    });

    it('should return a user profile without following status when no current user', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        bio: 'Test bio',
        image: 'http://example.com/image.jpg',
        following: []
      };

      userModelStub.resolves(mockUser);

      const result = await profileService.getProfile('testuser', null);

      expect(result).to.have.property('username', 'testuser');
      expect(result).to.have.property('following', false);
    });

    it('should throw error when user not found', async () => {
      userModelStub.resolves(null);

      try {
        await profileService.getProfile('nonexistent', null);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('User not found');
      }
    });
  });

  describe('followUser', () => {
    it('should add user to following list', async () => {
      const currentUser = {
        _id: 'user123',
        username: 'currentuser',
        following: [],
        save: sinon.stub().resolves()
      };

      const targetUser = {
        _id: 'target123',
        username: 'targetuser',
        bio: 'Target bio',
        image: 'http://example.com/target.jpg',
        following: []
      };

      userModelStub.onFirstCall().resolves(currentUser);
      userModelStub.onSecondCall().resolves(targetUser);

      const result = await profileService.followUser('currentuser', 'targetuser');

      expect(currentUser.following).to.include('target123');
      expect(result).to.have.property('username', 'targetuser');
      expect(result).to.have.property('following', true);
    });
  });

  describe('unfollowUser', () => {
    it('should remove user from following list', async () => {
      const currentUser = {
        _id: 'user123',
        username: 'currentuser',
        following: ['target123'],
        save: sinon.stub().resolves()
      };

      const targetUser = {
        _id: 'target123',
        username: 'targetuser',
        bio: 'Target bio',
        image: 'http://example.com/target.jpg',
        following: []
      };

      userModelStub.onFirstCall().resolves(currentUser);
      userModelStub.onSecondCall().resolves(targetUser);

      const result = await profileService.unfollowUser('currentuser', 'targetuser');

      expect(currentUser.following).to.not.include('target123');
      expect(result).to.have.property('username', 'targetuser');
      expect(result).to.have.property('following', false);
    });
  });
});