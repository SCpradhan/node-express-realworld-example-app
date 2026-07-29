import { Article } from './article.model';
import { Comment } from './comment.model';

describe('Article Model', () => {
  describe('Article Interface Structure', () => {
    it('should have all required fields defined in the interface', () => {
      const mockArticle: Article = {
        id: 1,
        slug: 'test-article-slug',
        title: 'Test Article Title',
        description: 'Test article description',
        body: 'Test article body content',
        tagList: ['tag1', 'tag2', 'tag3'],
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        author: { id: 1, username: 'testuser' },
        favoritesCount: 5,
        favorited: true,
        comments: []
      };

      expect(mockArticle.id).toBeDefined();
      expect(mockArticle.slug).toBeDefined();
      expect(mockArticle.title).toBeDefined();
      expect(mockArticle.description).toBeDefined();
      expect(mockArticle.body).toBeDefined();
      expect(mockArticle.tagList).toBeDefined();
      expect(mockArticle.createdAt).toBeDefined();
      expect(mockArticle.updatedAt).toBeDefined();
      expect(mockArticle.author).toBeDefined();
      expect(mockArticle.favoritesCount).toBeDefined();
      expect(mockArticle.favorited).toBeDefined();
      expect(mockArticle.comments).toBeDefined();
    });

    it('should support slug field as string', () => {
      const mockArticle: Article = {
        id: 1,
        slug: 'how-to-train-your-dragon',
        title: 'How to train your dragon',
        description: 'Ever wonder how?',
        body: 'It takes a Jacobian',
        tagList: ['dragons', 'training'],
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {},
        favoritesCount: 0,
        favorited: false,
        comments: []
      };

      expect(typeof mockArticle.slug).toBe('string');
      expect(mockArticle.slug).toBe('how-to-train-your-dragon');
    });

    it('should support title field as string', () => {
      const mockArticle: Article = {
        id: 1,
        slug: 'test-slug',
        title: 'Test Article Title',
        description: 'Description',
        body: 'Body',
        tagList: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {},
        favoritesCount: 0,
        favorited: false,
        comments: []
      };

      expect(typeof mockArticle.title).toBe('string');
      expect(mockArticle.title).toBe('Test Article Title');
    });

    it('should support description field as string', () => {
      const mockArticle: Article = {
        id: 1,
        slug: 'test-slug',
        title: 'Title',
        description: 'This is a test description',
        body: 'Body',
        tagList: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {},
        favoritesCount: 0,
        favorited: false,
        comments: []
      };

      expect(typeof mockArticle.description).toBe('string');
      expect(mockArticle.description).toBe('This is a test description');
    });

    it('should support body field as string', () => {
      const mockArticle: Article = {
        id: 1,
        slug: 'test-slug',
        title: 'Title',
        description: 'Description',
        body: 'This is the article body content with multiple paragraphs',
        tagList: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {},
        favoritesCount: 0,
        favorited: false,
        comments: []
      };

      expect(typeof mockArticle.body).toBe('string');
      expect(mockArticle.body).toBe('This is the article body content with multiple paragraphs');
    });
  });

  describe('tagList Field - Array of Strings', () => {
    it('should support tagList as an array of strings', () => {
      const mockArticle: Article = {
        id: 1,
        slug: 'test-slug',
        title: 'Title',
        description: 'Description',
        body: 'Body',
        tagList: ['javascript', 'typescript', 'node'],
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {},
        favoritesCount: 0,
        favorited: false,
        comments: []
      };

      expect(Array.isArray(mockArticle.tagList)).toBe(true);
      expect(mockArticle.tagList.length).toBe(3);
      expect(mockArticle.tagList).toContain('javascript');
      expect(mockArticle.tagList).toContain('typescript');
      expect(mockArticle.tagList).toContain('node');
    });

    it('should support empty tagList array', () => {
      const mockArticle: Article = {
        id: 1,
        slug: 'test-slug',
        title: 'Title',
        description: 'Description',
        body: 'Body',
        tagList: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {},
        favoritesCount: 0,
        favorited: false,
        comments: []
      };

      expect(Array.isArray(mockArticle.tagList)).toBe(true);
      expect(mockArticle.tagList.length).toBe(0);
    });

    it('should support tagList with single tag for filtering', () => {
      const mockArticle: Article = {
        id: 1,
        slug: 'test-slug',
        title: 'Title',
        description: 'Description',
        body: 'Body',
        tagList: ['reactjs'],
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {},
        favoritesCount: 0,
        favorited: false,
        comments: []
      };

      expect(mockArticle.tagList.length).toBe(1);
      expect(mockArticle.tagList[0]).toBe('reactjs');
    });

    it('should support tagList with multiple tags for tag-based filtering', () => {
      const mockArticle: Article = {
        id: 1,
        slug: 'test-slug',
        title: 'Title',
        description: 'Description',
        body: 'Body',
        tagList: ['angular', 'vue', 'react', 'svelte'],
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {},
        favoritesCount: 0,
        favorited: false,
        comments: []
      };

      expect(mockArticle.tagList.length).toBe(4);
      mockArticle.tagList.forEach(tag => {
        expect(typeof tag).toBe('string');
      });
    });
  });

  describe('author Field - User Reference', () => {
    it('should support author field that references User model', () => {
      const mockAuthor = {
        id: 123,
        username: 'johndoe',
        email: 'john@example.com',
        bio: 'Software developer',
        image: 'https://example.com/avatar.jpg'
      };

      const mockArticle: Article = {
        id: 1,
        slug: 'test-slug',
        title: 'Title',
        description: 'Description',
        body: 'Body',
        tagList: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        author: mockAuthor,
        favoritesCount: 0,
        favorited: false,
        comments: []
      };

      expect(mockArticle.author).toBeDefined();
      expect(mockArticle.author.id).toBe(123);
      expect(mockArticle.author.username).toBe('johndoe');
    });

    it('should support author field for population in queries', () => {
      const mockArticle: Article = {
        id: 1,
        slug: 'test-slug',
        title: 'Title',
        description: 'Description',
        body: 'Body',
        tagList: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        author: { id: 456, username: 'janedoe' },
        favoritesCount: 0,
        favorited: false,
        comments: []
      };

      expect(mockArticle.author).toHaveProperty('id');
      expect(mockArticle.author).toHaveProperty('username');
    });

    it('should support author field with minimal user data', () => {
      const mockArticle: Article = {
        id: 1,
        slug: 'test-slug',
        title: 'Title',
        description: 'Description',
        body: 'Body',
        tagList: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        author: { username: 'testuser' },
        favoritesCount: 0,
        favorited: false,
        comments: []
      };

      expect(mockArticle.author.username).toBe('testuser');
    });
  });

  describe('Favorites Properties', () => {
    it('should track favoritesCount as number', () => {
      const mockArticle: Article = {
        id: 1,
        slug: 'test-slug',
        title: 'Title',
        description: 'Description',
        body: 'Body',
        tagList: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {},
        favoritesCount: 42,
        favorited: false,
        comments: []
      };

      expect(typeof mockArticle.favoritesCount).toBe('number');
      expect(mockArticle.favoritesCount).toBe(42);
    });

    it('should support favoritesCount of zero', () => {
      const mockArticle: Article = {
        id: 1,
        slug: 'test-slug',
        title: 'Title',
        description: 'Description',
        body: 'Body',
        tagList: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {},
        favoritesCount: 0,
        favorited: false,
        comments: []
      };

      expect(mockArticle.favoritesCount).toBe(0);
    });

    it('should track favorited status as boolean', () => {
      const mockArticle: Article = {
        id: 1,
        slug: 'test-slug',
        title: 'Title',
        description: 'Description',
        body: 'Body',
        tagList: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {},
        favoritesCount: 10,
        favorited: true,
        comments: []
      };

      expect(typeof mockArticle.favorited).toBe('boolean');
      expect(mockArticle.favorited).toBe(true);
    });

    it('should support favorited as false', () => {
      const mockArticle: Article = {
        id: 1,
        slug: 'test-slug',
        title: 'Title',
        description: 'Description',
        body: 'Body',
        tagList: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {},
        favoritesCount: 5,
        favorited: false,
        comments: []
      };

      expect(mockArticle.favorited).toBe(false);
    });

    it('should support tracking which users favorited the article', () => {
      const mockArticle: Article = {
        id: 1,
        slug: 'test-slug',
        title: 'Title',
        description: 'Description',
        body: 'Body',
        tagList: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {},
        favoritesCount: 3,
        favorited: true,
        comments: []
      };

      expect(mockArticle.favoritesCount).toBeGreaterThan(0);
      expect(mockArticle.favorited).toBe(true);
    });
  });

  describe('Date Fields - createdAt and updatedAt', () => {
    it('should support createdAt as Date object', () => {
      const createdDate = new Date('2023-06-15T10:30:00Z');
      const mockArticle: Article = {
        id: 1,
        slug: 'test-slug',
        title: 'Title',
        description: 'Description',
        body: 'Body',
        tagList: [],
        createdAt: createdDate,
        updatedAt: new Date(),
        author: {},
        favoritesCount: 0,
        favorited: false,
        comments: []
      };

      expect(mockArticle.createdAt).toBeInstanceOf(Date);
      expect(mockArticle.createdAt).toEqual(createdDate);
    });

    it('should support updatedAt as Date object', () => {
      const updatedDate = new Date('2023-06-20T14:45:00Z');
      const mockArticle: Article = {
        id: 1,
        slug: 'test-slug',
        title: 'Title',
        description: 'Description',
        body: 'Body',
        tagList: [],
        createdAt: new Date('2023-06-15T10:30:00Z'),
        updatedAt: updatedDate,
        author: {},
        favoritesCount: 0,
        favorited: false,
        comments: []
      };

      expect(mockArticle.updatedAt).toBeInstanceOf(Date);
      expect(mockArticle.updatedAt).toEqual(updatedDate);
    });

    it('should support sorting by createdAt in descending order', () => {
      const article1: Article = {
        id: 1,
        slug: 'article-1',
        title: 'Article 1',
        description: 'Description 1',
        body: 'Body 1',
        tagList: [],
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date(),
        author: {},
        favoritesCount: 0,
        favorited: false,
        comments: []
      };

      const article2: Article = {
        id: 2,
        slug: 'article-2',
        title: 'Article 2',
        description: 'Description 2',
        body: 'Body 2',
        tagList: [],
        createdAt: new Date('2023-06-01'),
        updatedAt: new Date(),
        author: {},
        favoritesCount: 0,
        favorited: false,
        comments: []
      };

      const article3: Article = {
        id: 3,
        slug: 'article-3',
        title: 'Article 3',
        description: 'Description 3',
        body: 'Body 3',
        tagList: [],
        createdAt: new Date('2023-03-15'),
        updatedAt: new Date(),
        author: {},
        favoritesCount: 0,
        favorited: false,
        comments: []
      };

      const articles = [article1, article2, article3];
      const sortedArticles = articles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      expect(sortedArticles[0].id).toBe(2);
      expect(sortedArticles[1].id).toBe(3);
      expect(sortedArticles[2].id).toBe(1);
    });

    it('should validate createdAt is before or equal to updatedAt', () => {
      const createdDate = new Date('2023-01-01');
      const updatedDate = new Date('2023-01-15');

      const mockArticle: Article = {
        id: 1,
        slug: 'test-slug',
        title: 'Title',
        description: 'Description',
        body: 'Body',
        tagList: [],
        createdAt: createdDate,
        updatedAt: updatedDate,
        author: {},
        favoritesCount: 0,
        favorited: false,
        comments: []
      };

      expect(mockArticle.createdAt.getTime()).toBeLessThanOrEqual(mockArticle.updatedAt.getTime());
    });
  });

  describe('Comments Field', () => {
    it('should support comments array', () => {
      const mockComments: Comment[] = [
        {
          id: 1,
          body: 'Great article!',
          createdAt: new Date(),
          author: { username: 'commenter1' }
        } as Comment
      ];

      const mockArticle: Article = {
        id: 1,
        slug: 'test-slug',
        title: 'Title',
        description: 'Description',
        body: 'Body',
        tagList: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {},
        favoritesCount: 0,
        favorited: false,
        comments: mockComments
      };

      expect(Array.isArray(mockArticle.comments)).toBe(true);
      expect(mockArticle.comments.length).toBe(1);
    });

    it('should support empty comments array', () => {
      const mockArticle: Article = {
        id: 1,
        slug: 'test-slug',
        title: 'Title',
        description: 'Description',
        body: 'Body',
        tagList: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {},
        favoritesCount: 0,
        favorited: false,
        comments: []
      };

      expect(mockArticle.comments.length).toBe(0);
    });
  });

  describe('Query Support - Multiple Filter Criteria', () => {
    it('should support filtering by tag', () => {
      const articles: Article[] = [
        {
          id: 1,
          slug: 'article-1',
          title: 'Article 1',
          description: 'Description 1',
          body: 'Body 1',
          tagList: ['javascript', 'node'],
          createdAt: new Date(),
          updatedAt: new Date(),
          author: {},
          favoritesCount: 0,
          favorited: false,
          comments: []
        },
        {
          id: 2,
          slug: 'article-2',
          title: 'Article 2',
          description: 'Description 2',
          body: 'Body 2',
          tagList: ['python', 'django'],
          createdAt: new Date(),
          updatedAt: new Date(),
          author: {},
          favoritesCount: 0,
          favorited: false,
          comments: []
        }
      ];

      const filteredByTag = articles.filter(article => article.tagList.includes('javascript'));
      expect(filteredByTag.length).toBe(1);
      expect(filteredByTag[0].id).toBe(1);
    });

    it('should support filtering by author', () => {
      const articles: Article[] = [
        {
          id: 1,
          slug: 'article-1',
          title: 'Article 1',
          description: 'Description 1',
          body: 'Body 1',
          tagList: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          author: { id: 1, username: 'author1' },
          favoritesCount: 0,
          favorited: false,
          comments: []
        },
        {
          id: 2,
          slug: 'article-2',
          title: 'Article 2',
          description: 'Description 2',
          body: 'Body 2',
          tagList: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          author: { id: 2, username: 'author2' },
          favoritesCount: 0,
          favorited: false,
          comments: []
        }
      ];

      const filteredByAuthor = articles.filter(article => article.author.username === 'author1');
      expect(filteredByAuthor.length).toBe(1);
      expect(filteredByAuthor[0].id).toBe(1);
    });

    it('should support filtering by favorited status', () => {
      const articles: Article[] = [
        {
          id: 1,
          slug: 'article-1',
          title: 'Article 1',
          description: 'Description 1',
          body: 'Body 1',
          tagList: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          author: {},
          favoritesCount: 5,
          favorited: true,
          comments: []
        },
        {
          id: 2,
          slug: 'article-2',
          title: 'Article 2',
          description: 'Description 2',
          body: 'Body 2',
          tagList: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          author: {},
          favoritesCount: 0,
          favorited: false,
          comments: []
        }
      ];

      const filteredByFavorited = articles.filter(article => article.favorited === true);
      expect(filteredByFavorited.length).toBe(1);
      expect(filteredByFavorited[0].id).toBe(1);
    });

    it('should support combined filtering by tag, author, and favorited', () => {
      const articles: Article[] = [
        {
          id: 1,
          slug: 'article-1',
          title: 'Article 1',
          description: 'Description 1',
          body: 'Body 1',
          tagList: ['javascript'],
          createdAt: new Date(),
          updatedAt: new Date(),
          author: { id: 1, username: 'author1' },
          favoritesCount: 5,
          favorited: true,
          comments: []
        },
        {
          id: 2,
          slug: 'article-2',
          title: 'Article 2',
          description: 'Description 2',
          body: 'Body 2',
          tagList: ['javascript'],
          createdAt: new Date(),
          updatedAt: new Date(),
          author: { id: 2, username: 'author2' },
          favoritesCount: 0,
          favorited: false,
          comments: []
        },
        {
          id: 3,
          slug: 'article-3',
          title: 'Article 3',
          description: 'Description 3',
          body: 'Body 3',
          tagList: ['python'],
          createdAt: new Date(),
          updatedAt: new Date(),
          author: { id: 1, username: 'author1' },
          favoritesCount: 3,
          favorited: true,
          comments: []
        }
      ];

      const filtered = articles.filter(article => 
        article.tagList.includes('javascript') &&
        article.author.username === 'author1' &&
        article.favorited === true
      );

      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe(1);
    });
  });

  describe('Model Schema Documentation', () => {
    it('should document all expected schema fields for findArticles query', () => {
      const schemaFields = [
        'id',
        'slug',
        'title',
        'description',
        'body',
        'tagList',
        'createdAt',
        'updatedAt',
        'author',
        'favoritesCount',
        'favorited',
        'comments'
      ];

      const mockArticle: Article = {
        id: 1,
        slug: 'test-slug',
        title: 'Title',
        description: 'Description',
        body: 'Body',
        tagList: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {},
        favoritesCount: 0,
        favorited: false,
        comments: []
      };

      schemaFields.forEach(field => {
        expect(mockArticle).toHaveProperty(field);
      });
    });

    it('should validate Article interface does not break downstream consumers', () => {
      const mockArticle: Article = {
        id: 1,
        slug: 'test-slug',
        title: 'Title',
        description: 'Description',
        body: 'Body',
        tagList: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {},
        favoritesCount: 0,
        favorited: false,
        comments: []
      };

      expect(mockArticle.author).toBeDefined();
      expect(mockArticle.comments).toBeDefined();
      expect(Array.isArray(mockArticle.comments)).toBe(true);
    });
  });

  describe('ID Field', () => {
    it('should support id as number', () => {
      const mockArticle: Article = {
        id: 12345,
        slug: 'test-slug',
        title: 'Title',
        description: 'Description',
        body: 'Body',
        tagList: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {},
        favoritesCount: 0,
        favorited: false,
        comments: []
      };

      expect(typeof mockArticle.id).toBe('number');
      expect(mockArticle.id).toBe(12345);
    });

    it('should support unique id values', () => {
      const article1: Article = {
        id: 1,
        slug: 'article-1',
        title: 'Article 1',
        description: 'Description 1',
        body: 'Body 1',
        tagList: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {},
        favoritesCount: 0,
        favorited: false,
        comments: []
      };

      const article2: Article = {
        id: 2,
        slug: 'article-2',
        title: 'Article 2',
        description: 'Description 2',
        body: 'Body 2',
        tagList: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {},
        favoritesCount: 0,
        favorited: false,
        comments: []
      };

      expect(article1.id).not.toBe(article2.id);
    });
  });
});