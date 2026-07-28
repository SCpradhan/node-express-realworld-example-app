var mongoose = require('mongoose');
var expect = require('chai').expect;
var Article = require('../models/Article');

describe('Article Model - readingTime Virtual Property', function() {
  
  describe('Edge Cases - Null, Undefined, and Empty Body', function() {
    
    it('should return 1 minute reading time when body is null', function() {
      var article = new mongoose.models.Article({
        title: 'Test Article',
        description: 'Test Description',
        body: null
      });
      
      expect(article.readingTime).to.equal(1);
    });
    
    it('should return 1 minute reading time when body is undefined', function() {
      var article = new mongoose.models.Article({
        title: 'Test Article',
        description: 'Test Description'
      });
      
      expect(article.readingTime).to.equal(1);
    });
    
    it('should return 1 minute reading time when body is empty string', function() {
      var article = new mongoose.models.Article({
        title: 'Test Article',
        description: 'Test Description',
        body: ''
      });
      
      expect(article.readingTime).to.equal(1);
    });
    
    it('should return 1 minute reading time when body contains only whitespace', function() {
      var article = new mongoose.models.Article({
        title: 'Test Article',
        description: 'Test Description',
        body: '   \n\t  '
      });
      
      expect(article.readingTime).to.equal(1);
    });
  });
  
  describe('Word Count and Reading Time Calculation', function() {
    
    it('should return 1 minute for 100 words (below 200 words per minute threshold)', function() {
      var words = [];
      for (var i = 0; i < 100; i++) {
        words.push('word');
      }
      var article = new mongoose.models.Article({
        title: 'Test Article',
        description: 'Test Description',
        body: words.join(' ')
      });
      
      expect(article.readingTime).to.equal(1);
    });
    
    it('should return 1 minute for exactly 200 words', function() {
      var words = [];
      for (var i = 0; i < 200; i++) {
        words.push('word');
      }
      var article = new mongoose.models.Article({
        title: 'Test Article',
        description: 'Test Description',
        body: words.join(' ')
      });
      
      expect(article.readingTime).to.equal(1);
    });
    
    it('should return 2 minutes for 250 words', function() {
      var words = [];
      for (var i = 0; i < 250; i++) {
        words.push('word');
      }
      var article = new mongoose.models.Article({
        title: 'Test Article',
        description: 'Test Description',
        body: words.join(' ')
      });
      
      expect(article.readingTime).to.equal(2);
    });
    
    it('should return 3 minutes for 500 words', function() {
      var words = [];
      for (var i = 0; i < 500; i++) {
        words.push('word');
      }
      var article = new mongoose.models.Article({
        title: 'Test Article',
        description: 'Test Description',
        body: words.join(' ')
      });
      
      expect(article.readingTime).to.equal(3);
    });
    
    it('should return 2 minutes for 201 words (ceiling function test)', function() {
      var words = [];
      for (var i = 0; i < 201; i++) {
        words.push('word');
      }
      var article = new mongoose.models.Article({
        title: 'Test Article',
        description: 'Test Description',
        body: words.join(' ')
      });
      
      expect(article.readingTime).to.equal(2);
    });
    
    it('should return 5 minutes for 1000 words', function() {
      var words = [];
      for (var i = 0; i < 1000; i++) {
        words.push('word');
      }
      var article = new mongoose.models.Article({
        title: 'Test Article',
        description: 'Test Description',
        body: words.join(' ')
      });
      
      expect(article.readingTime).to.equal(5);
    });
  });
  
  describe('Whitespace Handling', function() {
    
    it('should correctly count words separated by single spaces', function() {
      var article = new mongoose.models.Article({
        title: 'Test Article',
        description: 'Test Description',
        body: 'one two three four five'
      });
      
      expect(article.readingTime).to.equal(1);
    });
    
    it('should correctly count words separated by multiple spaces', function() {
      var article = new mongoose.models.Article({
        title: 'Test Article',
        description: 'Test Description',
        body: 'one    two     three    four     five'
      });
      
      expect(article.readingTime).to.equal(1);
    });
    
    it('should correctly count words separated by tabs', function() {
      var article = new mongoose.models.Article({
        title: 'Test Article',
        description: 'Test Description',
        body: 'one\ttwo\tthree\tfour\tfive'
      });
      
      expect(article.readingTime).to.equal(1);
    });
    
    it('should correctly count words separated by newlines', function() {
      var article = new mongoose.models.Article({
        title: 'Test Article',
        description: 'Test Description',
        body: 'one\ntwo\nthree\nfour\nfive'
      });
      
      expect(article.readingTime).to.equal(1);
    });
    
    it('should correctly count words with mixed whitespace characters', function() {
      var article = new mongoose.models.Article({
        title: 'Test Article',
        description: 'Test Description',
        body: 'one  \n\ttwo   \n  three\t\tfour     \n\n\tfive'
      });
      
      expect(article.readingTime).to.equal(1);
    });
    
    it('should filter out empty strings from split result', function() {
      var article = new mongoose.models.Article({
        title: 'Test Article',
        description: 'Test Description',
        body: '  word1   word2  word3  '
      });
      
      expect(article.readingTime).to.equal(1);
    });
  });
  
  describe('Minimum Reading Time Validation', function() {
    
    it('should never return less than 1 minute for any valid content', function() {
      var article = new mongoose.models.Article({
        title: 'Test Article',
        description: 'Test Description',
        body: 'single'
      });
      
      expect(article.readingTime).to.be.at.least(1);
    });
    
    it('should return 1 minute for 50 words', function() {
      var words = [];
      for (var i = 0; i < 50; i++) {
        words.push('word');
      }
      var article = new mongoose.models.Article({
        title: 'Test Article',
        description: 'Test Description',
        body: words.join(' ')
      });
      
      expect(article.readingTime).to.equal(1);
    });
  });
  
  describe('toJSONFor Method - readingTime Inclusion', function() {
    
    it('should include readingTime in JSON output', function() {
      var mockUser = {
        _id: mongoose.Types.ObjectId(),
        isFavorite: function() { return false; }
      };
      
      var mockAuthor = {
        toProfileJSONFor: function() {
          return { username: 'testauthor', bio: 'Test bio', image: 'test.jpg' };
        }
      };
      
      var article = new mongoose.models.Article({
        slug: 'test-article',
        title: 'Test Article',
        description: 'Test Description',
        body: 'This is a test article with some content to calculate reading time.',
        tagList: ['test', 'article'],
        author: mockAuthor
      });
      
      var json = article.toJSONFor(mockUser);
      
      expect(json).to.have.property('readingTime');
      expect(json.readingTime).to.be.a('number');
      expect(json.readingTime).to.equal(1);
    });
    
    it('should include correct readingTime for longer articles in JSON output', function() {
      var mockUser = {
        _id: mongoose.Types.ObjectId(),
        isFavorite: function() { return false; }
      };
      
      var mockAuthor = {
        toProfileJSONFor: function() {
          return { username: 'testauthor', bio: 'Test bio', image: 'test.jpg' };
        }
      };
      
      var words = [];
      for (var i = 0; i < 500; i++) {
        words.push('word');
      }
      
      var article = new mongoose.models.Article({
        slug: 'test-article',
        title: 'Test Article',
        description: 'Test Description',
        body: words.join(' '),
        tagList: ['test', 'article'],
        author: mockAuthor
      });
      
      var json = article.toJSONFor(mockUser);
      
      expect(json).to.have.property('readingTime');
      expect(json.readingTime).to.equal(3);
    });
  });
  
  describe('Schema Configuration - Virtual Property Serialization', function() {
    
    it('should have toJSON virtuals enabled in schema options', function() {
      var schema = mongoose.models.Article.schema;
      
      expect(schema.options).to.have.property('toJSON');
      expect(schema.options.toJSON).to.have.property('virtuals');
      expect(schema.options.toJSON.virtuals).to.equal(true);
    });
    
    it('should serialize readingTime when converting to JSON', function() {
      var article = new mongoose.models.Article({
        title: 'Test Article',
        description: 'Test Description',
        body: 'Test content with multiple words to test serialization.'
      });
      
      var json = article.toJSON();
      
      expect(json).to.have.property('readingTime');
      expect(json.readingTime).to.be.a('number');
    });
  });
  
  describe('Boundary and Edge Case Testing', function() {
    
    it('should handle very long articles correctly', function() {
      var words = [];
      for (var i = 0; i < 10000; i++) {
        words.push('word');
      }
      var article = new mongoose.models.Article({
        title: 'Test Article',
        description: 'Test Description',
        body: words.join(' ')
      });
      
      expect(article.readingTime).to.equal(50);
    });
    
    it('should handle articles with exactly 199 words', function() {
      var words = [];
      for (var i = 0; i < 199; i++) {
        words.push('word');
      }
      var article = new mongoose.models.Article({
        title: 'Test Article',
        description: 'Test Description',
        body: words.join(' ')
      });
      
      expect(article.readingTime).to.equal(1);
    });
    
    it('should handle articles with special characters and punctuation', function() {
      var article = new mongoose.models.Article({
        title: 'Test Article',
        description: 'Test Description',
        body: 'Hello, world! This is a test. Does it work? Yes, it does.'
      });
      
      expect(article.readingTime).to.equal(1);
    });
    
    it('should handle articles with numbers', function() {
      var article = new mongoose.models.Article({
        title: 'Test Article',
        description: 'Test Description',
        body: '123 456 789 test 111 222 333'
      });
      
      expect(article.readingTime).to.equal(1);
    });
  });
});