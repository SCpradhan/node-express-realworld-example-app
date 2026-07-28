const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const sinon = require('sinon');
const chai = require('chai');
const expect = chai.expect;

describe('Articles Route - readingTime Integration Tests', function() {
  let app;
  let Article;
  let User;
  let Comment;
  let authStub;
  let mockArticle;
  let mockUser;

  beforeEach(function() {
    app = express();
    app.use(express.json());

    Article = {
      findOne: sinon.stub(),
      find: sinon.stub(),
      count: sinon.stub(),
      model: sinon.stub()
    };

    User = {
      findById: sinon.stub(),
      findOne: sinon.stub()
    };

    Comment = {
      findById: sinon.stub(),
      find: sinon.stub()
    };

    authStub = {
      optional: function(req, res, next) { next(); },
      required: function(req, res, next) { 
        req.payload = { id: 'user123' };
        next(); 
      }
    };

    mockUser = {
      _id: 'user123',
      username: 'testuser',
      following: ['author456']
    };

    mockArticle = {
      _id: 'article123',
      slug: 'test-article',
      title: 'Test Article',
      description: 'Test Description',
      body: 'This is a test article body with enough content to calculate reading time. '.repeat(50),
      author: {
        _id: 'author456',
        username: 'author'
      },
      comments: [],
      tagList: ['test', 'article'],
      toJSONFor: sinon.stub().returns({
        slug: 'test-article',
        title: 'Test Article',
        description: 'Test Description',
        body: 'This is a test article body with enough content to calculate reading time. '.repeat(50),
        tagList: ['test', 'article'],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorited: false,
        favoritesCount: 0,
        author: {
          username: 'author',
          bio: '',
          image: '',
          following: false
        },
        readingTime: 5
      }),
      populate: sinon.stub().returnsThis(),
      execPopulate: sinon.stub().resolves(),
      save: sinon.stub().resolves(),
      remove: sinon.stub().resolves(),
      updateFavoriteCount: sinon.stub().resolves()
    };

    mongoose.model = function(modelName) {
      if (modelName === 'Article') return Article;
      if (modelName === 'User') return User;
      if (modelName === 'Comment') return Comment;
    };
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('GET /api/articles/:slug - Single Article Endpoint', function() {
    it('should return article with readingTime field included via toJSONFor(user)', function(done) {
      const router = require('express').Router();
      
      router.param('article', function(req, res, next, slug) {
        req.article = mockArticle;
        next();
      });

      router.get('/:slug', authStub.optional, function(req, res, next) {
        Promise.all([
          req.payload ? User.findById(req.payload.id) : null,
          req.article.populate('author').execPopulate()
        ]).then(function(results) {
          const user = results[0];
          return res.json({ article: req.article.toJSONFor(user) });
        }).catch(next);
      });

      app.use('/api/articles', router);

      User.findById.resolves(mockUser);
      mockArticle.populate.returnsThis();
      mockArticle.execPopulate.resolves(mockArticle);

      request(app)
        .get('/api/articles/test-article')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.body.article).to.have.property('readingTime');
          expect(res.body.article.readingTime).to.be.a('number');
          expect(res.body.article.readingTime).to.equal(5);
          expect(mockArticle.toJSONFor.calledOnce).to.be.true;
          done();
        });
    });

    it('should include readingTime when user is not authenticated', function(done) {
      const router = require('express').Router();
      
      router.param('article', function(req, res, next, slug) {
        req.article = mockArticle;
        next();
      });

      router.get('/:slug', function(req, res, next) {
        Promise.all([
          null,
          req.article.populate('author').execPopulate()
        ]).then(function(results) {
          const user = results[0];
          return res.json({ article: req.article.toJSONFor(user) });
        }).catch(next);
      });

      app.use('/api/articles', router);

      mockArticle.populate.returnsThis();
      mockArticle.execPopulate.resolves(mockArticle);

      request(app)
        .get('/api/articles/test-article')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.body.article).to.have.property('readingTime');
          expect(res.body.article.readingTime).to.equal(5);
          expect(mockArticle.toJSONFor.calledWith(null)).to.be.true;
          done();
        });
    });

    it('should verify readingTime is an integer value in minutes', function(done) {
      const router = require('express').Router();
      
      router.param('article', function(req, res, next, slug) {
        req.article = mockArticle;
        next();
      });

      router.get('/:slug', authStub.optional, function(req, res, next) {
        Promise.all([
          req.payload ? User.findById(req.payload.id) : null,
          req.article.populate('author').execPopulate()
        ]).then(function(results) {
          const user = results[0];
          return res.json({ article: req.article.toJSONFor(user) });
        }).catch(next);
      });

      app.use('/api/articles', router);

      User.findById.resolves(mockUser);
      mockArticle.populate.returnsThis();
      mockArticle.execPopulate.resolves(mockArticle);

      request(app)
        .get('/api/articles/test-article')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.body.article.readingTime).to.be.a('number');
          expect(Number.isInteger(res.body.article.readingTime)).to.be.true;
          expect(res.body.article.readingTime).to.be.at.least(0);
          done();
        });
    });
  });

  describe('GET /api/articles - List Articles Endpoint', function() {
    it('should return all articles with readingTime field included via toJSONFor(user)', function(done) {
      const router = require('express').Router();
      
      const mockArticle2 = {
        ...mockArticle,
        _id: 'article456',
        slug: 'test-article-2',
        toJSONFor: sinon.stub().returns({
          slug: 'test-article-2',
          title: 'Test Article 2',
          readingTime: 3
        })
      };

      router.get('/', authStub.optional, function(req, res, next) {
        let query = {};
        let limit = 20;
        let offset = 0;

        Promise.all([
          req.query.author ? User.findOne({username: req.query.author}) : null,
          req.query.favorited ? User.findOne({username: req.query.favorited}) : null
        ]).then(function(results){
          return Promise.all([
            Article.find(query)
              .limit(Number(limit))
              .skip(Number(offset))
              .sort({createdAt: 'desc'})
              .populate('author')
              .exec(),
            Article.count(query).exec(),
            req.payload ? User.findById(req.payload.id) : null,
          ]).then(function(results){
            const articles = results[0];
            const articlesCount = results[1];
            const user = results[2];

            return res.json({
              articles: articles.map(function(article){
                return article.toJSONFor(user);
              }),
              articlesCount: articlesCount
            });
          });
        }).catch(next);
      });

      app.use('/api/articles', router);

      const findStub = {
        limit: sinon.stub().returnsThis(),
        skip: sinon.stub().returnsThis(),
        sort: sinon.stub().returnsThis(),
        populate: sinon.stub().returnsThis(),
        exec: sinon.stub().resolves([mockArticle, mockArticle2])
      };

      Article.find.returns(findStub);
      Article.count.returns({ exec: sinon.stub().resolves(2) });
      User.findById.resolves(mockUser);

      request(app)
        .get('/api/articles')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.body.articles).to.be.an('array');
          expect(res.body.articles).to.have.lengthOf(2);
          expect(res.body.articles[0]).to.have.property('readingTime');
          expect(res.body.articles[1]).to.have.property('readingTime');
          expect(res.body.articles[0].readingTime).to.equal(5);
          expect(res.body.articles[1].readingTime).to.equal(3);
          expect(mockArticle.toJSONFor.called).to.be.true;
          expect(mockArticle2.toJSONFor.called).to.be.true;
          done();
        });
    });

    it('should include readingTime for each article when filtering by tag', function(done) {
      const router = require('express').Router();
      
      router.get('/', authStub.optional, function(req, res, next) {
        let query = {};
        let limit = 20;
        let offset = 0;

        if(typeof req.query.tag !== 'undefined'){
          query.tagList = {"$in" : [req.query.tag]};
        }

        Promise.all([
          req.query.author ? User.findOne({username: req.query.author}) : null,
          req.query.favorited ? User.findOne({username: req.query.favorited}) : null
        ]).then(function(results){
          return Promise.all([
            Article.find(query)
              .limit(Number(limit))
              .skip(Number(offset))
              .sort({createdAt: 'desc'})
              .populate('author')
              .exec(),
            Article.count(query).exec(),
            req.payload ? User.findById(req.payload.id) : null,
          ]).then(function(results){
            const articles = results[0];
            const articlesCount = results[1];
            const user = results[2];

            return res.json({
              articles: articles.map(function(article){
                return article.toJSONFor(user);
              }),
              articlesCount: articlesCount
            });
          });
        }).catch(next);
      });

      app.use('/api/articles', router);

      const findStub = {
        limit: sinon.stub().returnsThis(),
        skip: sinon.stub().returnsThis(),
        sort: sinon.stub().returnsThis(),
        populate: sinon.stub().returnsThis(),
        exec: sinon.stub().resolves([mockArticle])
      };

      Article.find.returns(findStub);
      Article.count.returns({ exec: sinon.stub().resolves(1) });
      User.findById.resolves(mockUser);

      request(app)
        .get('/api/articles?tag=test')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.body.articles).to.be.an('array');
          expect(res.body.articles[0]).to.have.property('readingTime');
          expect(res.body.articles[0].readingTime).to.be.a('number');
          done();
        });
    });

    it('should include readingTime for each article when filtering by author', function(done) {
      const router = require('express').Router();
      
      router.get('/', authStub.optional, function(req, res, next) {
        let query = {};
        let limit = 20;
        let offset = 0;

        Promise.all([
          req.query.author ? User.findOne({username: req.query.author}) : null,
          req.query.favorited ? User.findOne({username: req.query.favorited}) : null
        ]).then(function(results){
          const author = results[0];
          const favoriter = results[1];

          if(author){
            query.author = author._id;
          }

          return Promise.all([
            Article.find(query)
              .limit(Number(limit))
              .skip(Number(offset))
              .sort({createdAt: 'desc'})
              .populate('author')
              .exec(),
            Article.count(query).exec(),
            req.payload ? User.findById(req.payload.id) : null,
          ]).then(function(results){
            const articles = results[0];
            const articlesCount = results[1];
            const user = results[2];

            return res.json({
              articles: articles.map(function(article){
                return article.toJSONFor(user);
              }),
              articlesCount: articlesCount
            });
          });
        }).catch(next);
      });

      app.use('/api/articles', router);

      const findStub = {
        limit: sinon.stub().returnsThis(),
        skip: sinon.stub().returnsThis(),
        sort: sinon.stub().returnsThis(),
        populate: sinon.stub().returnsThis(),
        exec: sinon.stub().resolves([mockArticle])
      };

      Article.find.returns(findStub);
      Article.count.returns({ exec: sinon.stub().resolves(1) });
      User.findOne.resolves({ _id: 'author456', username: 'author' });
      User.findById.resolves(mockUser);

      request(app)
        .get('/api/articles?author=author')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.body.articles).to.be.an('array');
          expect(res.body.articles[0]).to.have.property('readingTime');
          expect(res.body.articles[0].readingTime).to.equal(5);
          done();
        });
    });

    it('should verify each article readingTime is an integer in minutes', function(done) {
      const router = require('express').Router();
      
      router.get('/', authStub.optional, function(req, res, next) {
        let query = {};
        let limit = 20;
        let offset = 0;

        Promise.all([
          req.query.author ? User.findOne({username: req.query.author}) : null,
          req.query.favorited ? User.findOne({username: req.query.favorited}) : null
        ]).then(function(results){
          return Promise.all([
            Article.find(query)
              .limit(Number(limit))
              .skip(Number(offset))
              .sort({createdAt: 'desc'})
              .populate('author')
              .exec(),
            Article.count(query).exec(),
            req.payload ? User.findById(req.payload.id) : null,
          ]).then(function(results){
            const articles = results[0];
            const articlesCount = results[1];
            const user = results[2];

            return res.json({
              articles: articles.map(function(article){
                return article.toJSONFor(user);
              }),
              articlesCount: articlesCount
            });
          });
        }).catch(next);
      });

      app.use('/api/articles', router);

      const findStub = {
        limit: sinon.stub().returnsThis(),
        skip: sinon.stub().returnsThis(),
        sort: sinon.stub().returnsThis(),
        populate: sinon.stub().returnsThis(),
        exec: sinon.stub().resolves([mockArticle])
      };

      Article.find.returns(findStub);
      Article.count.returns({ exec: sinon.stub().resolves(1) });
      User.findById.resolves(mockUser);

      request(app)
        .get('/api/articles')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          res.body.articles.forEach(function(article) {
            expect(article.readingTime).to.be.a('number');
            expect(Number.isInteger(article.readingTime)).to.be.true;
            expect(article.readingTime).to.be.at.least(0);
          });
          done();
        });
    });
  });

  describe('GET /api/articles/feed - User Feed Endpoint', function() {
    it('should return feed articles with readingTime field included via toJSONFor(user)', function(done) {
      const router = require('express').Router();
      
      router.get('/feed', authStub.required, function(req, res, next) {
        let limit = 20;
        let offset = 0;

        User.findById(req.payload.id).then(function(user){
          if (!user) { return res.sendStatus(401); }

          Promise.all([
            Article.find({ author: {$in: user.following}})
              .limit(Number(limit))
              .skip(Number(offset))
              .populate('author')
              .exec(),
            Article.count({ author: {$in: user.following}})
          ]).then(function(results){
            const articles = results[0];
            const articlesCount = results[1];

            return res.json({
              articles: articles.map(function(article){
                return article.toJSONFor(user);
              }),
              articlesCount: articlesCount
            });
          }).catch(next);
        });
      });

      app.use('/api/articles', router);

      const findStub = {
        limit: sinon.stub().returnsThis(),
        skip: sinon.stub().returnsThis(),
        populate: sinon.stub().returnsThis(),
        exec: sinon.stub().resolves([mockArticle])
      };

      Article.find.returns(findStub);
      Article.count.resolves(1);
      User.findById.resolves(mockUser);

      request(app)
        .get('/api/articles/feed')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.body.articles).to.be.an('array');
          expect(res.body.articles).to.have.lengthOf(1);
          expect(res.body.articles[0]).to.have.property('readingTime');
          expect(res.body.articles[0].readingTime).to.equal(5);
          expect(mockArticle.toJSONFor.calledWith(mockUser)).to.be.true;
          done();
        });
    });

    it('should include readingTime for multiple feed articles', function(done) {
      const router = require('express').Router();
      
      const mockArticle2 = {
        ...mockArticle,
        _id: 'article789',
        slug: 'feed-article-2',
        toJSONFor: sinon.stub().returns({
          slug: 'feed-article-2',
          title: 'Feed Article 2',
          readingTime: 7
        })
      };

      router.get('/feed', authStub.required, function(req, res, next) {
        let limit = 20;
        let offset = 0;

        User.findById(req.payload.id).then(function(user){
          if (!user) { return res.sendStatus(401); }

          Promise.all([
            Article.find({ author: {$in: user.following}})
              .limit(Number(limit))
              .skip(Number(offset))
              .populate('author')
              .exec(),
            Article.count({ author: {$in: user.following}})
          ]).then(function(results){
            const articles = results[0];
            const articlesCount = results[1];

            return res.json({
              articles: articles.map(function(article){
                return article.toJSONFor(user);
              }),
              articlesCount: articlesCount
            });
          }).catch(next);
        });
      });

      app.use('/api/articles', router);

      const findStub = {
        limit: sinon.stub().returnsThis(),
        skip: sinon.stub().returnsThis(),
        populate: sinon.stub().returnsThis(),
        exec: sinon.stub().resolves([mockArticle, mockArticle2])
      };

      Article.find.returns(findStub);
      Article.count.resolves(2);
      User.findById.resolves(mockUser);

      request(app)
        .get('/api/articles/feed')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.body.articles).to.have.lengthOf(2);
          expect(res.body.articles[0]).to.have.property('readingTime');
          expect(res.body.articles[1]).to.have.property('readingTime');
          expect(res.body.articles[0].readingTime).to.equal(5);
          expect(res.body.articles[1].readingTime).to.equal(7);
          done();
        });
    });

    it('should verify feed article readingTime values are integers in minutes', function(done) {
      const router = require('express').Router();
      
      router.get('/feed', authStub.required, function(req, res, next) {
        let limit = 20;
        let offset = 0;

        User.findById(req.payload.id).then(function(user){
          if (!user) { return res.sendStatus(401); }

          Promise.all([
            Article.find({ author: {$in: user.following}})
              .limit(Number(limit))
              .skip(Number(offset))
              .populate('author')
              .exec(),
            Article.count({ author: {$in: user.following}})
          ]).then(function(results){
            const articles = results[0];
            const articlesCount = results[1];

            return res.json({
              articles: articles.map(function(article){
                return article.toJSONFor(user);
              }),
              articlesCount: articlesCount
            });
          }).catch(next);
        });
      });

      app.use('/api/articles', router);

      const findStub = {
        limit: sinon.stub().returnsThis(),
        skip: sinon.stub().returnsThis(),
        populate: sinon.stub().returnsThis(),
        exec: sinon.stub().resolves([mockArticle])
      };

      Article.find.returns(findStub);
      Article.count.resolves(1);
      User.findById.resolves(mockUser);

      request(app)
        .get('/api/articles/feed')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          res.body.articles.forEach(function(article) {
            expect(article.readingTime).to.be.a('number');
            expect(Number.isInteger(article.readingTime)).to.be.true;
            expect(article.readingTime).to.be.at.least(0);
          });
          done();
        });
    });

    it('should return 401 when user is not authenticated for feed endpoint', function(done) {
      const router = require('express').Router();
      
      router.get('/feed', authStub.required, function(req, res, next) {
        let limit = 20;
        let offset = 0;

        User.findById(req.payload.id).then(function(user){
          if (!user) { return res.sendStatus(401); }

          Promise.all([
            Article.find({ author: {$in: user.following}})
              .limit(Number(limit))
              .skip(Number(offset))
              .populate('author')
              .exec(),
            Article.count({ author: {$in: user.following}})
          ]).then(function(results){
            const articles = results[0];
            const articlesCount = results[1];

            return res.json({
              articles: articles.map(function(article){
                return article.toJSONFor(user);
              }),
              articlesCount: articlesCount
            });
          }).catch(next);
        });
      });

      app.use('/api/articles', router);

      User.findById.resolves(null);

      request(app)
        .get('/api/articles/feed')
        .expect(401, done);
    });
  });

  describe('toJSONFor method invocation tests', function() {
    it('should verify toJSONFor is called with correct user parameter in GET /:slug', function(done) {
      const router = require('express').Router();
      
      router.param('article', function(req, res, next, slug) {
        req.article = mockArticle;
        next();
      });

      router.get('/:slug', authStub.optional, function(req, res, next) {
        Promise.all([
          req.payload ? User.findById(req.payload.id) : null,
          req.article.populate('author').execPopulate()
        ]).then(function(results) {
          const user = results[0];
          return res.json({ article: req.article.toJSONFor(user) });
        }).catch(next);
      });

      app.use('/api/articles', router);

      User.findById.resolves(mockUser);
      mockArticle.populate.returnsThis();
      mockArticle.execPopulate.resolves(mockArticle);

      request(app)
        .get('/api/articles/test-article')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          expect(mockArticle.toJSONFor.calledOnce).to.be.true;
          const callArg = mockArticle.toJSONFor.getCall(0).args[0];
          expect(callArg).to.deep.equal(mockUser);
          done();
        });
    });

    it('should verify toJSONFor is called for each article in GET / endpoint', function(done) {
      const router = require('express').Router();
      
      const mockArticle2 = {
        ...mockArticle,
        toJSONFor: sinon.stub().returns({ readingTime: 3 })
      };

      router.get('/', authStub.optional, function(req, res, next) {
        let query = {};
        let limit = 20;
        let offset = 0;

        Promise.all([
          req.query.author ? User.findOne({username: req.query.author}) : null,
          req.query.favorited ? User.findOne({username: req.query.favorited}) : null
        ]).then(function(results){
          return Promise.all([
            Article.find(query)
              .limit(Number(limit))
              .skip(Number(offset))
              .sort({createdAt: 'desc'})
              .populate('author')
              .exec(),
            Article.count(query).exec(),
            req.payload ? User.findById(req.payload.id) : null,
          ]).then(function(results){
            const articles = results[0];
            const articlesCount = results[1];
            const user = results[2];

            return res.json({
              articles: articles.map(function(article){
                return article.toJSONFor(user);
              }),
              articlesCount: articlesCount
            });
          });
        }).catch(next);
      });

      app.use('/api/articles', router);

      const findStub = {
        limit: sinon.stub().returnsThis(),
        skip: sinon.stub().returnsThis(),
        sort: sinon.stub().returnsThis(),
        populate: sinon.stub().returnsThis(),
        exec: sinon.stub().resolves([mockArticle, mockArticle2])
      };

      Article.find.returns(findStub);
      Article.count.returns({ exec: sinon.stub().resolves(2) });
      User.findById.resolves(mockUser);

      request(app)
        .get('/api/articles')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          expect(mockArticle.toJSONFor.calledOnce).to.be.true;
          expect(mockArticle2.toJSONFor.calledOnce).to.be.true;
          expect(mockArticle.toJSONFor.calledWith(mockUser)).to.be.true;
          expect(mockArticle2.toJSONFor.calledWith(mockUser)).to.be.true;
          done();
        });
    });

    it('should verify toJSONFor is called for each article in GET /feed endpoint', function(done) {
      const router = require('express').Router();
      
      const mockArticle2 = {
        ...mockArticle,
        toJSONFor: sinon.stub().returns({ readingTime: 4 })
      };

      router.get('/feed', authStub.required, function(req, res, next) {
        let limit = 20;
        let offset = 0;

        User.findById(req.payload.id).then(function(user){
          if (!user) { return res.sendStatus(401); }

          Promise.all([
            Article.find({ author: {$in: user.following}})
              .limit(Number(limit))
              .skip(Number(offset))
              .populate('author')
              .exec(),
            Article.count({ author: {$in: user.following}})
          ]).then(function(results){
            const articles = results[0];
            const articlesCount = results[1];

            return res.json({
              articles: articles.map(function(article){
                return article.toJSONFor(user);
              }),
              articlesCount: articlesCount
            });
          }).catch(next);
        });
      });

      app.use('/api/articles', router);

      const findStub = {
        limit: sinon.stub().returnsThis(),
        skip: sinon.stub().returnsThis(),
        populate: sinon.stub().returnsThis(),
        exec: sinon.stub().resolves([mockArticle, mockArticle2])
      };

      Article.find.returns(findStub);
      Article.count.resolves(2);
      User.findById.resolves(mockUser);

      request(app)
        .get('/api/articles/feed')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          expect(mockArticle.toJSONFor.calledOnce).to.be.true;
          expect(mockArticle2.toJSONFor.calledOnce).to.be.true;
          expect(mockArticle.toJSONFor.calledWith(mockUser)).to.be.true;
          expect(mockArticle2.toJSONFor.calledWith(mockUser)).to.be.true;
          done();
        });
    });
  });

  describe('Edge cases and error handling', function() {
    it('should handle empty article list and still return valid structure', function(done) {
      const router = require('express').Router();
      
      router.get('/', authStub.optional, function(req, res, next) {
        let query = {};
        let limit = 20;
        let offset = 0;

        Promise.all([
          req.query.author ? User.findOne({username: req.query.author}) : null,
          req.query.favorited ? User.findOne({username: req.query.favorited}) : null
        ]).then(function(results){
          return Promise.all([
            Article.find(query)
              .limit(Number(limit))
              .skip(Number(offset))
              .sort({createdAt: 'desc'})
              .populate('author')
              .exec(),
            Article.count(query).exec(),
            req.payload ? User.findById(req.payload.id) : null,
          ]).then(function(results){
            const articles = results[0];
            const articlesCount = results[1];
            const user = results[2];

            return res.json({
              articles: articles.map(function(article){
                return article.toJSONFor(user);
              }),
              articlesCount: articlesCount
            });
          });
        }).catch(next);
      });

      app.use('/api/articles', router);

      const findStub = {
        limit: sinon.stub().returnsThis(),
        skip: sinon.stub().returnsThis(),
        sort: sinon.stub().returnsThis(),
        populate: sinon.stub().returnsThis(),
        exec: sinon.stub().resolves([])
      };

      Article.find.returns(findStub);
      Article.count.returns({ exec: sinon.stub().resolves(0) });
      User.findById.resolves(mockUser);

      request(app)
        .get('/api/articles')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.body.articles).to.be.an('array');
          expect(res.body.articles).to.have.lengthOf(0);
          expect(res.body.articlesCount).to.equal(0);
          done();
        });
    });

    it('should handle empty feed and still return valid structure', function(done) {
      const router = require('express').Router();
      
      router.get('/feed', authStub.required, function(req, res, next) {
        let limit = 20;
        let offset = 0;

        User.findById(req.payload.id).then(function(user){
          if (!user) { return res.sendStatus(401); }

          Promise.all([
            Article.find({ author: {$in: user.following}})
              .limit(Number(limit))
              .skip(Number(offset))
              .populate('author')
              .exec(),
            Article.count({ author: {$in: user.following}})
          ]).then(function(results){
            const articles = results[0];
            const articlesCount = results[1];

            return res.json({
              articles: articles.map(function(article){
                return article.toJSONFor(user);
              }),
              articlesCount: articlesCount
            });
          }).catch(next);
        });
      });

      app.use('/api/articles', router);

      const findStub = {
        limit: sinon.stub().returnsThis(),
        skip: sinon.stub().returnsThis(),
        populate: sinon.stub().returnsThis(),
        exec: sinon.stub().resolves([])
      };

      Article.find.returns(findStub);
      Article.count.resolves(0);
      User.findById.resolves(mockUser);

      request(app)
        .get('/api/articles/feed')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.body.articles).to.be.an('array');
          expect(res.body.articles).to.have.lengthOf(0);
          expect(res.body.articlesCount).to.equal(0);
          done();
        });
    });

    it('should handle article with zero readingTime', function(done) {
      const router = require('express').Router();
      
      const shortArticle = {
        ...mockArticle,
        body: 'Short',
        toJSONFor: sinon.stub().returns({
          slug: 'short-article',
          title: 'Short Article',
          readingTime: 0
        })
      };

      router.param('article', function(req, res, next, slug) {
        req.article = shortArticle;
        next();
      });

      router.get('/:slug', authStub.optional, function(req, res, next) {
        Promise.all([
          req.payload ? User.findById(req.payload.id) : null,
          req.article.populate('author').execPopulate()
        ]).then(function(results) {
          const user = results[0];
          return res.json({ article: req.article.toJSONFor(user) });
        }).catch(next);
      });

      app.use('/api/articles', router);

      User.findById.resolves(mockUser);
      shortArticle.populate = sinon.stub().returnsThis();
      shortArticle.execPopulate = sinon.stub().resolves(shortArticle);

      request(app)
        .get('/api/articles/short-article')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.body.article).to.have.property('readingTime');
          expect(res.body.article.readingTime).to.equal(0);
          expect(Number.isInteger(res.body.article.readingTime)).to.be.true;
          done();
        });
    });
  });
});