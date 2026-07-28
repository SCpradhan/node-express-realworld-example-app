import { Comment, CommentData, CommentsData } from './comment.model';

describe('Comment Model', () => {
  describe('Comment Interface', () => {
    it('should have correct structure for Comment interface', () => {
      const mockComment: Comment = {
        id: 1,
        body: 'This is a test comment',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        author: {
          username: 'testuser',
          bio: 'Test bio',
          image: 'https://example.com/image.jpg',
          following: false
        }
      };

      expect(mockComment.id).toBe(1);
      expect(mockComment.body).toBe('This is a test comment');
      expect(mockComment.createdAt).toBeInstanceOf(Date);
      expect(mockComment.updatedAt).toBeInstanceOf(Date);
      expect(mockComment.author.username).toBe('testuser');
      expect(mockComment.author.bio).toBe('Test bio');
      expect(mockComment.author.image).toBe('https://example.com/image.jpg');
      expect(mockComment.author.following).toBe(false);
    });

    it('should allow null bio in author', () => {
      const mockComment: Comment = {
        id: 2,
        body: 'Another comment',
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {
          username: 'anotheruser',
          bio: null,
          image: 'https://example.com/avatar.jpg',
          following: true
        }
      };

      expect(mockComment.author.bio).toBeNull();
    });

    it('should have numeric id field', () => {
      const mockComment: Comment = {
        id: 12345,
        body: 'Comment with numeric id',
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {
          username: 'user123',
          bio: null,
          image: 'image.jpg',
          following: false
        }
      };

      expect(typeof mockComment.id).toBe('number');
    });

    it('should have string body field', () => {
      const mockComment: Comment = {
        id: 1,
        body: 'Test body content',
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {
          username: 'testuser',
          bio: null,
          image: 'image.jpg',
          following: false
        }
      };

      expect(typeof mockComment.body).toBe('string');
    });

    it('should have Date type for createdAt and updatedAt', () => {
      const now = new Date();
      const mockComment: Comment = {
        id: 1,
        body: 'Test',
        createdAt: now,
        updatedAt: now,
        author: {
          username: 'user',
          bio: null,
          image: 'img.jpg',
          following: false
        }
      };

      expect(mockComment.createdAt).toBeInstanceOf(Date);
      expect(mockComment.updatedAt).toBeInstanceOf(Date);
    });

    it('should have boolean following field in author', () => {
      const mockComment: Comment = {
        id: 1,
        body: 'Test',
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {
          username: 'user',
          bio: null,
          image: 'img.jpg',
          following: true
        }
      };

      expect(typeof mockComment.author.following).toBe('boolean');
    });
  });

  describe('CommentData Interface', () => {
    it('should wrap a single Comment in comment property', () => {
      const mockCommentData: CommentData = {
        comment: {
          id: 1,
          body: 'Single comment',
          createdAt: new Date(),
          updatedAt: new Date(),
          author: {
            username: 'user',
            bio: 'Bio text',
            image: 'image.jpg',
            following: false
          }
        }
      };

      expect(mockCommentData.comment).toBeDefined();
      expect(mockCommentData.comment.id).toBe(1);
      expect(mockCommentData.comment.body).toBe('Single comment');
    });

    it('should have correct structure for API response', () => {
      const mockCommentData: CommentData = {
        comment: {
          id: 99,
          body: 'API response comment',
          createdAt: new Date('2023-06-15'),
          updatedAt: new Date('2023-06-16'),
          author: {
            username: 'apiuser',
            bio: null,
            image: 'avatar.png',
            following: true
          }
        }
      };

      expect(mockCommentData).toHaveProperty('comment');
      expect(mockCommentData.comment).toHaveProperty('id');
      expect(mockCommentData.comment).toHaveProperty('body');
      expect(mockCommentData.comment).toHaveProperty('author');
    });
  });

  describe('CommentsData Interface', () => {
    it('should wrap multiple Comments in comments array', () => {
      const mockCommentsData: CommentsData = {
        comments: [
          {
            id: 1,
            body: 'First comment',
            createdAt: new Date(),
            updatedAt: new Date(),
            author: {
              username: 'user1',
              bio: null,
              image: 'img1.jpg',
              following: false
            }
          },
          {
            id: 2,
            body: 'Second comment',
            createdAt: new Date(),
            updatedAt: new Date(),
            author: {
              username: 'user2',
              bio: 'User 2 bio',
              image: 'img2.jpg',
              following: true
            }
          }
        ]
      };

      expect(mockCommentsData.comments).toHaveLength(2);
      expect(mockCommentsData.comments[0].id).toBe(1);
      expect(mockCommentsData.comments[1].id).toBe(2);
    });

    it('should handle empty comments array', () => {
      const mockCommentsData: CommentsData = {
        comments: []
      };

      expect(mockCommentsData.comments).toHaveLength(0);
      expect(Array.isArray(mockCommentsData.comments)).toBe(true);
    });

    it('should maintain Comment structure in array', () => {
      const mockCommentsData: CommentsData = {
        comments: [
          {
            id: 10,
            body: 'Array comment',
            createdAt: new Date(),
            updatedAt: new Date(),
            author: {
              username: 'arrayuser',
              bio: 'Array bio',
              image: 'array.jpg',
              following: false
            }
          }
        ]
      };

      expect(mockCommentsData.comments[0]).toHaveProperty('id');
      expect(mockCommentsData.comments[0]).toHaveProperty('body');
      expect(mockCommentsData.comments[0]).toHaveProperty('createdAt');
      expect(mockCommentsData.comments[0]).toHaveProperty('updatedAt');
      expect(mockCommentsData.comments[0]).toHaveProperty('author');
      expect(mockCommentsData.comments[0].author).toHaveProperty('username');
      expect(mockCommentsData.comments[0].author).toHaveProperty('bio');
      expect(mockCommentsData.comments[0].author).toHaveProperty('image');
      expect(mockCommentsData.comments[0].author).toHaveProperty('following');
    });
  });

  describe('Comment Model Relationship to Article', () => {
    it('should maintain independent Comment structure without Article reference', () => {
      const mockComment: Comment = {
        id: 1,
        body: 'Comment without article reference',
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {
          username: 'user',
          bio: null,
          image: 'img.jpg',
          following: false
        }
      };

      expect(mockComment).not.toHaveProperty('article');
      expect(mockComment).not.toHaveProperty('articleId');
    });

    it('should verify Comment model has no readingTime property', () => {
      const mockComment: Comment = {
        id: 1,
        body: 'Comment for readingTime verification',
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {
          username: 'user',
          bio: null,
          image: 'img.jpg',
          following: false
        }
      };

      expect(mockComment).not.toHaveProperty('readingTime');
    });
  });

  describe('Type Safety Validation', () => {
    it('should enforce required fields in Comment', () => {
      const validComment: Comment = {
        id: 1,
        body: 'Valid comment',
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {
          username: 'validuser',
          bio: null,
          image: 'valid.jpg',
          following: false
        }
      };

      expect(validComment.id).toBeDefined();
      expect(validComment.body).toBeDefined();
      expect(validComment.createdAt).toBeDefined();
      expect(validComment.updatedAt).toBeDefined();
      expect(validComment.author).toBeDefined();
      expect(validComment.author.username).toBeDefined();
      expect(validComment.author.image).toBeDefined();
      expect(validComment.author.following).toBeDefined();
    });

    it('should enforce required fields in author object', () => {
      const mockComment: Comment = {
        id: 1,
        body: 'Test',
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {
          username: 'requireduser',
          bio: null,
          image: 'required.jpg',
          following: false
        }
      };

      expect(mockComment.author.username).toBeTruthy();
      expect(mockComment.author.image).toBeTruthy();
      expect(typeof mockComment.author.following).toBe('boolean');
    });
  });
});