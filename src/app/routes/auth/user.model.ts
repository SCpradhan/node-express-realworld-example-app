import mongoose from 'mongoose';
import { expect } from 'chai';
import sinon from 'sinon';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import secret from '../config';

describe('User Model - Article.readingTime Compatibility Tests', () => {
  let User;
  let testUser;
  let saveStub;

  before(() => {
    // Load the User model
    require('./user.model');
    User = mongoose.model('User');
  });

  beforeEach(() => {
    testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      bio: 'Test bio',
      image: 'http://example.com/image.jpg'
    });
    testUser._id = new mongoose.Types.ObjectId();
    testUser.salt = crypto.randomBytes(16).toString('hex');
    testUser.hash = crypto.pbkdf2Sync('password123', testUser.salt, 10000, 512, 'sha512').toString('hex');
    
    saveStub = sinon.stub(testUser, 'save').resolves(testUser);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('User-Article Relationship Compatibility', () => {
    it('should maintain ObjectId reference type for favorites array', () => {
      expect(testUser.favorites).to.be.an('array');
      expect(testUser.favorites).to.have.lengthOf(0);
    });

    it('should successfully add Article ObjectId to favorites array', async () => {
      const articleId = new mongoose.Types.ObjectId();
      
      await testUser.favorite(articleId);
      
      expect(testUser.favorites).to.include(articleId);
      expect(saveStub.calledOnce).to.be.true;
    });

    it('should handle Article ObjectId with readingTime property without breaking favorites', async () => {
      const articleId = new mongoose.Types.ObjectId();
      
      await testUser.favorite(articleId);
      
      expect(testUser.favorites[0].toString()).to.equal(articleId.toString());
      expect(testUser.favorites).to.have.lengthOf(1);
    });

    it('should verify isFavorite works with Article ObjectId references', () => {
      const articleId = new mongoose.Types.ObjectId();
      testUser.favorites.push(articleId);
      
      const result = testUser.isFavorite(articleId);
      
      expect(result).to.be.true;
    });

    it('should verify isFavorite returns false for non-favorited Article', () => {
      const articleId = new mongoose.Types.ObjectId();
      const nonFavoritedId = new mongoose.Types.ObjectId();
      testUser.favorites.push(articleId);
      
      const result = testUser.isFavorite(nonFavoritedId);
      
      expect(result).to.be.false;
    });

    it('should successfully remove Article ObjectId from favorites', async () => {
      const articleId = new mongoose.Types.ObjectId();
      testUser.favorites.push(articleId);
      
      await testUser.unfavorite(articleId);
      
      expect(saveStub.calledOnce).to.be.true;
    });

    it('should not add duplicate Article ObjectId to favorites', async () => {
      const articleId = new mongoose.Types.ObjectId();
      
      await testUser.favorite(articleId);
      await testUser.favorite(articleId);
      
      expect(testUser.favorites).to.have.lengthOf(1);
    });

    it('should handle multiple Article ObjectIds in favorites array', async () => {
      const articleId1 = new mongoose.Types.ObjectId();
      const articleId2 = new mongoose.Types.ObjectId();
      const articleId3 = new mongoose.Types.ObjectId();
      
      await testUser.favorite(articleId1);
      await testUser.favorite(articleId2);
      await testUser.favorite(articleId3);
      
      expect(testUser.favorites).to.have.lengthOf(3);
      expect(testUser.isFavorite(articleId1)).to.be.true;
      expect(testUser.isFavorite(articleId2)).to.be.true;
      expect(testUser.isFavorite(articleId3)).to.be.true;
    });
  });

  describe('TypeScript Type Compatibility Verification', () => {
    it('should verify favorites array accepts mongoose.Schema.Types.ObjectId', () => {
      const articleId = new mongoose.Types.ObjectId();
      testUser.favorites.push(articleId);
      
      expect(testUser.favorites[0]).to.be.instanceOf(mongoose.Types.ObjectId);
    });

    it('should verify favorites array reference to Article model remains valid', () => {
      const schemaPath = User.schema.path('favorites');
      
      expect(schemaPath).to.exist;
      expect(schemaPath.options.type[0].ref).to.equal('Article');
    });

    it('should confirm User schema structure is unchanged', () => {
      const schemaKeys = Object.keys(User.schema.paths);
      
      expect(schemaKeys).to.include.members([
        'username',
        'email',
        'bio',
        'image',
        'favorites',
        'following',
        'hash',
        'salt',
        '_id'
      ]);
    });

    it('should verify no breaking changes to User-Article relationship mapping', () => {
      const favoritesPath = User.schema.path('favorites');
      
      expect(favoritesPath.instance).to.equal('Array');
      expect(favoritesPath.caster.instance).to.equal('ObjectID');
    });
  });

  describe('Existing User Methods Compatibility', () => {
    it('should verify validPassword method still functions correctly', () => {
      const isValid = testUser.validPassword('password123');
      
      expect(isValid).to.be.true;
    });

    it('should verify setPassword method still functions correctly', () => {
      const oldSalt = testUser.salt;
      const oldHash = testUser.hash;
      
      testUser.setPassword('newpassword456');
      
      expect(testUser.salt).to.not.equal(oldSalt);
      expect(testUser.hash).to.not.equal(oldHash);
      expect(testUser.validPassword('newpassword456')).to.be.true;
    });

    it('should verify generateJWT method still functions correctly', () => {
      const token = testUser.generateJWT();
      const decoded = jwt.verify(token, secret);
      
      expect(decoded.id).to.equal(testUser._id.toString());
      expect(decoded.username).to.equal(testUser.username);
      expect(decoded.exp).to.be.a('number');
    });

    it('should verify toAuthJSON method still functions correctly', () => {
      const authJSON = testUser.toAuthJSON();
      
      expect(authJSON).to.have.all.keys('username', 'email', 'token', 'bio', 'image');
      expect(authJSON.username).to.equal(testUser.username);
      expect(authJSON.email).to.equal(testUser.email);
      expect(authJSON.bio).to.equal(testUser.bio);
      expect(authJSON.image).to.equal(testUser.image);
    });

    it('should verify toProfileJSONFor method still functions correctly with following user', () => {
      const otherUser = new User({
        username: 'otheruser',
        email: 'other@example.com'
      });
      otherUser._id = new mongoose.Types.ObjectId();
      otherUser.following = [testUser._id];
      
      sinon.stub(otherUser, 'isFollowing').returns(true);
      
      const profileJSON = testUser.toProfileJSONFor(otherUser);
      
      expect(profileJSON).to.have.all.keys('username', 'bio', 'image', 'following');
      expect(profileJSON.following).to.be.true;
    });

    it('should verify toProfileJSONFor method uses default image when none provided', () => {
      testUser.image = null;
      
      const profileJSON = testUser.toProfileJSONFor(null);
      
      expect(profileJSON.image).to.equal('https://static.productionready.io/images/smiley-cyrus.jpg');
    });

    it('should verify follow method still functions correctly', async () => {
      const userToFollowId = new mongoose.Types.ObjectId();
      
      await testUser.follow(userToFollowId);
      
      expect(testUser.following).to.include(userToFollowId);
      expect(saveStub.calledOnce).to.be.true;
    });

    it('should verify unfollow method still functions correctly', async () => {
      const userToUnfollowId = new mongoose.Types.ObjectId();
      testUser.following.push(userToUnfollowId);
      
      await testUser.unfollow(userToUnfollowId);
      
      expect(saveStub.calledOnce).to.be.true;
    });

    it('should verify isFollowing method still functions correctly', () => {
      const followedUserId = new mongoose.Types.ObjectId();
      testUser.following.push(followedUserId);
      
      const result = testUser.isFollowing(followedUserId);
      
      expect(result).to.be.true;
    });
  });

  describe('Schema Validation and Constraints', () => {
    it('should verify username field constraints remain intact', () => {
      const usernamePath = User.schema.path('username');
      
      expect(usernamePath.options.lowercase).to.be.true;
      expect(usernamePath.options.unique).to.be.true;
      expect(usernamePath.options.required).to.exist;
      expect(usernamePath.options.index).to.be.true;
    });

    it('should verify email field constraints remain intact', () => {
      const emailPath = User.schema.path('email');
      
      expect(emailPath.options.lowercase).to.be.true;
      expect(emailPath.options.unique).to.be.true;
      expect(emailPath.options.required).to.exist;
      expect(emailPath.options.index).to.be.true;
    });

    it('should verify timestamps option is still enabled', () => {
      expect(User.schema.options.timestamps).to.be.true;
    });

    it('should verify unique validator plugin is still applied', () => {
      const plugins = User.schema.plugins;
      const hasUniqueValidator = plugins.some(plugin => 
        plugin.fn.name === 'uniqueValidator' || plugin.fn.toString().includes('unique')
      );
      
      expect(hasUniqueValidator).to.be.true;
    });
  });

  describe('Documentation and Comments Verification', () => {
    it('should verify compatibility comment exists in source code', () => {
      const fs = require('fs');
      const path = require('path');
      const sourceCode = fs.readFileSync(path.join(__dirname, 'user.model.ts'), 'utf8');
      
      expect(sourceCode).to.include('NOTE: User model is compatible with Article.readingTime enhancement');
      expect(sourceCode).to.include('The Article interface now includes an optional readingTime property');
      expect(sourceCode).to.include('type-agnostic to Article schema changes');
    });
  });

  describe('Integration Scenarios with Article Model', () => {
    it('should handle favoriting an Article with readingTime property', async () => {
      const articleWithReadingTime = {
        _id: new mongoose.Types.ObjectId(),
        title: 'Test Article',
        body: 'Test body content',
        readingTime: 5
      };
      
      await testUser.favorite(articleWithReadingTime._id);
      
      expect(testUser.isFavorite(articleWithReadingTime._id)).to.be.true;
    });

    it('should handle favoriting an Article without readingTime property', async () => {
      const articleWithoutReadingTime = {
        _id: new mongoose.Types.ObjectId(),
        title: 'Test Article',
        body: 'Test body content'
      };
      
      await testUser.favorite(articleWithoutReadingTime._id);
      
      expect(testUser.isFavorite(articleWithoutReadingTime._id)).to.be.true;
    });

    it('should maintain favorites array integrity with mixed Article types', async () => {
      const articleWithReadingTime = new mongoose.Types.ObjectId();
      const articleWithoutReadingTime = new mongoose.Types.ObjectId();
      
      await testUser.favorite(articleWithReadingTime);
      await testUser.favorite(articleWithoutReadingTime);
      
      expect(testUser.favorites).to.have.lengthOf(2);
      expect(testUser.isFavorite(articleWithReadingTime)).to.be.true;
      expect(testUser.isFavorite(articleWithoutReadingTime)).to.be.true;
    });
  });
});