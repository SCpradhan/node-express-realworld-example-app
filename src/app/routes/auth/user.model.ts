import { User } from './user.model';
import { Article } from '../article/article.model';
import { Comment } from '../article/comment.model';

describe('User Model', () => {
  describe('User Interface Structure', () => {
    it('should have all required fields defined in the interface', () => {
      const mockUser: User = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        bio: 'Test bio',
        image: 'https://example.com/image.jpg',
        articles: [],
        favorites: [],
        followedBy: [],
        following: [],
        comments: [],
        demo: false
      };

      expect(mockUser.id).toBeDefined();
      expect(mockUser.username).toBeDefined();
      expect(mockUser.email).toBeDefined();
      expect(mockUser.password).toBeDefined();
      expect(mockUser.bio).toBeDefined();
      expect(mockUser.image).toBeDefined();
      expect(mockUser.articles).toBeDefined();
      expect(mockUser.favorites).toBeDefined();
      expect(mockUser.followedBy).toBeDefined();
      expect(mockUser.following).toBeDefined();
      expect(mockUser.comments).toBeDefined();
      expect(mockUser.demo).toBeDefined();
    });

    it('should allow bio to be null', () => {
      const mockUser: User = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        bio: null,
        image: 'https://example.com/image.jpg',
        articles: [],
        favorites: [],
        followedBy: [],
        following: [],
        comments: [],
        demo: false
      };

      expect(mockUser.bio).toBeNull();
    });

    it('should allow image to be null', () => {
      const mockUser: User = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        bio: 'Test bio',
        image: null,
        articles: [],
        favorites: [],
        followedBy: [],
        following: [],
        comments: [],
        demo: false
      };

      expect(mockUser.image).toBeNull();
    });

    it('should support username field for author filter parameter', () => {
      const mockUser: User = {
        id: 1,
        username: 'authorusername',
        email: 'author@example.com',
        password: 'hashedpassword',
        bio: 'Author bio',
        image: 'https://example.com/author.jpg',
        articles: [],
        favorites: [],
        followedBy: [],
        following: [],
        comments: [],
        demo: false
      };

      expect(mockUser.username).toBe('authorusername');
      expect(typeof mockUser.username).toBe('string');
    });
  });

  describe('Following Relationships', () => {
    it('should support following array to track users being followed', () => {
      const followedUser: User = {
        id: 2,
        username: 'followeduser',
        email: 'followed@example.com',
        password: 'hashedpassword',
        bio: 'Followed user bio',
        image: null,
        articles: [],
        favorites: [],
        followedBy: [],
        following: [],
        comments: [],
        demo: false
      };

      const mockUser: User = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        bio: 'Test bio',
        image: null,
        articles: [],
        favorites: [],
        followedBy: [],
        following: [followedUser],
        comments: [],
        demo: false
      };

      expect(mockUser.following).toHaveLength(1);
      expect(mockUser.following[0].username).toBe('followeduser');
    });

    it('should support followedBy array to track followers', () => {
      const followerUser: User = {
        id: 2,
        username: 'followeruser',
        email: 'follower@example.com',
        password: 'hashedpassword',
        bio: 'Follower bio',
        image: null,
        articles: [],
        favorites: [],
        followedBy: [],
        following: [],
        comments: [],
        demo: false
      };

      const mockUser: User = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        bio: 'Test bio',
        image: null,
        articles: [],
        favorites: [],
        followedBy: [followerUser],
        following: [],
        comments: [],
        demo: false
      };

      expect(mockUser.followedBy).toHaveLength(1);
      expect(mockUser.followedBy[0].username).toBe('followeruser');
    });

    it('should support multiple following relationships', () => {
      const followedUser1: User = {
        id: 2,
        username: 'followeduser1',
        email: 'followed1@example.com',
        password: 'hashedpassword',
        bio: null,
        image: null,
        articles: [],
        favorites: [],
        followedBy: [],
        following: [],
        comments: [],
        demo: false
      };

      const followedUser2: User = {
        id: 3,
        username: 'followeduser2',
        email: 'followed2@example.com',
        password: 'hashedpassword',
        bio: null,
        image: null,
        articles: [],
        favorites: [],
        followedBy: [],
        following: [],
        comments: [],
        demo: false
      };

      const mockUser: User = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        bio: 'Test bio',
        image: null,
        articles: [],
        favorites: [],
        followedBy: [],
        following: [followedUser1, followedUser2],
        comments: [],
        demo: false
      };

      expect(mockUser.following).toHaveLength(2);
      expect(mockUser.following[0].id).toBe(2);
      expect(mockUser.following[1].id).toBe(3);
    });

    it('should allow empty following and followedBy arrays', () => {
      const mockUser: User = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        bio: 'Test bio',
        image: null,
        articles: [],
        favorites: [],
        followedBy: [],
        following: [],
        comments: [],
        demo: false
      };

      expect(mockUser.following).toHaveLength(0);
      expect(mockUser.followedBy).toHaveLength(0);
    });
  });

  describe('Author Profile Data Population', () => {
    it('should support all fields required for author profile', () => {
      const authorUser: User = {
        id: 1,
        username: 'authorname',
        email: 'author@example.com',
        password: 'hashedpassword',
        bio: 'Author biography',
        image: 'https://example.com/author-image.jpg',
        articles: [],
        favorites: [],
        followedBy: [],
        following: [],
        comments: [],
        demo: false
      };

      expect(authorUser.username).toBe('authorname');
      expect(authorUser.bio).toBe('Author biography');
      expect(authorUser.image).toBe('https://example.com/author-image.jpg');
      expect(authorUser.following).toBeDefined();
    });

    it('should support author profile with null bio and image', () => {
      const authorUser: User = {
        id: 1,
        username: 'authorname',
        email: 'author@example.com',
        password: 'hashedpassword',
        bio: null,
        image: null,
        articles: [],
        favorites: [],
        followedBy: [],
        following: [],
        comments: [],
        demo: false
      };

      expect(authorUser.username).toBe('authorname');
      expect(authorUser.bio).toBeNull();
      expect(authorUser.image).toBeNull();
    });
  });

  describe('Articles and Favorites', () => {
    it('should support articles array', () => {
      const mockArticle: Article = {
        slug: 'test-article',
        title: 'Test Article',
        description: 'Test description',
        body: 'Test body',
        tagList: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorited: false,
        favoritesCount: 0,
        author: {} as User
      } as Article;

      const mockUser: User = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        bio: 'Test bio',
        image: null,
        articles: [mockArticle],
        favorites: [],
        followedBy: [],
        following: [],
        comments: [],
        demo: false
      };

      expect(mockUser.articles).toHaveLength(1);
      expect(mockUser.articles[0].slug).toBe('test-article');
    });

    it('should support favorites array', () => {
      const mockArticle: Article = {
        slug: 'favorite-article',
        title: 'Favorite Article',
        description: 'Favorite description',
        body: 'Favorite body',
        tagList: ['favorite'],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorited: true,
        favoritesCount: 1,
        author: {} as User
      } as Article;

      const mockUser: User = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        bio: 'Test bio',
        image: null,
        articles: [],
        favorites: [mockArticle],
        followedBy: [],
        following: [],
        comments: [],
        demo: false
      };

      expect(mockUser.favorites).toHaveLength(1);
      expect(mockUser.favorites[0].favorited).toBe(true);
    });
  });

  describe('Comments', () => {
    it('should support comments array', () => {
      const mockComment: Comment = {
        id: 1,
        body: 'Test comment',
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {} as User,
        article: {} as Article
      } as Comment;

      const mockUser: User = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        bio: 'Test bio',
        image: null,
        articles: [],
        favorites: [],
        followedBy: [],
        following: [],
        comments: [mockComment],
        demo: false
      };

      expect(mockUser.comments).toHaveLength(1);
      expect(mockUser.comments[0].body).toBe('Test comment');
    });

    it('should allow empty comments array', () => {
      const mockUser: User = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        bio: 'Test bio',
        image: null,
        articles: [],
        favorites: [],
        followedBy: [],
        following: [],
        comments: [],
        demo: false
      };

      expect(mockUser.comments).toHaveLength(0);
    });
  });

  describe('Demo Flag', () => {
    it('should support demo flag set to true', () => {
      const mockUser: User = {
        id: 1,
        username: 'demouser',
        email: 'demo@example.com',
        password: 'hashedpassword',
        bio: 'Demo user',
        image: null,
        articles: [],
        favorites: [],
        followedBy: [],
        following: [],
        comments: [],
        demo: true
      };

      expect(mockUser.demo).toBe(true);
    });

    it('should support demo flag set to false', () => {
      const mockUser: User = {
        id: 1,
        username: 'regularuser',
        email: 'regular@example.com',
        password: 'hashedpassword',
        bio: 'Regular user',
        image: null,
        articles: [],
        favorites: [],
        followedBy: [],
        following: [],
        comments: [],
        demo: false
      };

      expect(mockUser.demo).toBe(false);
    });
  });

  describe('User Model Integrity', () => {
    it('should maintain all required fields without modification', () => {
      const mockUser: User = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        bio: 'Test bio',
        image: 'https://example.com/image.jpg',
        articles: [],
        favorites: [],
        followedBy: [],
        following: [],
        comments: [],
        demo: false
      };

      const userKeys = Object.keys(mockUser);
      expect(userKeys).toContain('id');
      expect(userKeys).toContain('username');
      expect(userKeys).toContain('email');
      expect(userKeys).toContain('password');
      expect(userKeys).toContain('bio');
      expect(userKeys).toContain('image');
      expect(userKeys).toContain('articles');
      expect(userKeys).toContain('favorites');
      expect(userKeys).toContain('followedBy');
      expect(userKeys).toContain('following');
      expect(userKeys).toContain('comments');
      expect(userKeys).toContain('demo');
    });

    it('should support querying by username for author filter', () => {
      const users: User[] = [
        {
          id: 1,
          username: 'author1',
          email: 'author1@example.com',
          password: 'hashedpassword',
          bio: 'Author 1 bio',
          image: null,
          articles: [],
          favorites: [],
          followedBy: [],
          following: [],
          comments: [],
          demo: false
        },
        {
          id: 2,
          username: 'author2',
          email: 'author2@example.com',
          password: 'hashedpassword',
          bio: 'Author 2 bio',
          image: null,
          articles: [],
          favorites: [],
          followedBy: [],
          following: [],
          comments: [],
          demo: false
        }
      ];

      const filteredUser = users.find(user => user.username === 'author1');
      expect(filteredUser).toBeDefined();
      expect(filteredUser?.username).toBe('author1');
      expect(filteredUser?.id).toBe(1);
    });
  });
});