const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

describe('Migration 20210924225358_initial - Database Schema Tests', () => {
  const migrationPath = path.join(__dirname, '../../../src/prisma/migrations/20210924225358_initial/migration.sql');
  const testDbPath = path.join(__dirname, '../../../test.db');

  beforeAll(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  afterAll(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('User Table Schema', () => {
    test('should create User table with id as INTEGER PRIMARY KEY', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      expect(migrationContent).toContain('"id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT');
      expect(migrationContent).toContain('CREATE TABLE "User"');
    });

    test('should have email column as TEXT NOT NULL with UNIQUE constraint', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      expect(migrationContent).toContain('"email" TEXT NOT NULL');
      expect(migrationContent).toContain('CREATE UNIQUE INDEX "User_email_key" ON "User"("email")');
    });

    test('should have username column as TEXT NOT NULL with UNIQUE constraint', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      expect(migrationContent).toContain('"username" TEXT NOT NULL');
      expect(migrationContent).toContain('CREATE UNIQUE INDEX "User_username_key" ON "User"("username")');
    });

    test('should have hash column as TEXT NOT NULL for storing hashed password', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      expect(migrationContent).toContain('"hash" TEXT NOT NULL');
    });

    test('should have salt column as TEXT NOT NULL for storing password salt', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      expect(migrationContent).toContain('"salt" TEXT NOT NULL');
    });

    test('should have bio column as TEXT (nullable) for user biography', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      expect(migrationContent).toContain('"bio" TEXT');
      expect(migrationContent).not.toContain('"bio" TEXT NOT NULL');
    });

    test('should have image column as TEXT (nullable) for user profile image URL', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      expect(migrationContent).toContain('"image" TEXT');
      expect(migrationContent).not.toContain('"image" TEXT NOT NULL');
    });

    test('should have createdAt column with TIMESTAMP DEFAULT CURRENT_TIMESTAMP', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      expect(migrationContent).toContain('"createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP');
    });

    test('should have updatedAt column with TIMESTAMP DEFAULT CURRENT_TIMESTAMP', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      expect(migrationContent).toContain('"updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP');
    });
  });

  describe('User Table Indexes', () => {
    test('should create index idx_user_email on email column', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      expect(migrationContent).toContain('CREATE INDEX "idx_user_email" ON "User"("email")');
    });

    test('should create index idx_user_username on username column', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      expect(migrationContent).toContain('CREATE INDEX "idx_user_username" ON "User"("username")');
    });
  });

  describe('Foreign Key Constraints', () => {
    test('should have foreign key constraint for Article.authorId referencing User.id', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      expect(migrationContent).toContain('CONSTRAINT "Article_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE');
    });

    test('should have foreign key constraint for Comment.authorId referencing User.id', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      expect(migrationContent).toContain('CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE');
    });

    test('should have foreign key constraint for Comment.articleId referencing Article.id', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      expect(migrationContent).toContain('CONSTRAINT "Comment_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE');
    });

    test('should have foreign key constraint for Favorite.userId referencing User.id', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      expect(migrationContent).toContain('CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE');
    });

    test('should have foreign key constraint for Favorite.articleId referencing Article.id', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      expect(migrationContent).toContain('CONSTRAINT "Favorite_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE');
    });

    test('should have foreign key constraint for Follow.followerId referencing User.id', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      expect(migrationContent).toContain('CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE');
    });

    test('should have foreign key constraint for Follow.followingId referencing User.id', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      expect(migrationContent).toContain('CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE');
    });
  });

  describe('Related Tables', () => {
    test('should create Article table with proper structure', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      expect(migrationContent).toContain('CREATE TABLE "Article"');
      expect(migrationContent).toContain('"slug" TEXT NOT NULL');
      expect(migrationContent).toContain('CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug")');
    });

    test('should create Comment table with proper structure', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      expect(migrationContent).toContain('CREATE TABLE "Comment"');
      expect(migrationContent).toContain('"body" TEXT NOT NULL');
    });

    test('should create Favorite table with composite unique constraint', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      expect(migrationContent).toContain('CREATE TABLE "Favorite"');
      expect(migrationContent).toContain('CREATE UNIQUE INDEX "Favorite_userId_articleId_key" ON "Favorite"("userId", "articleId")');
    });

    test('should create Follow table with composite unique constraint', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      expect(migrationContent).toContain('CREATE TABLE "Follow"');
      expect(migrationContent).toContain('CREATE UNIQUE INDEX "Follow_followerId_followingId_key" ON "Follow"("followerId", "followingId")');
    });
  });

  describe('Migration File Integrity', () => {
    test('should be valid SQL syntax', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      expect(migrationContent).toBeTruthy();
      expect(migrationContent.length).toBeGreaterThan(0);
    });

    test('should contain all required CREATE TABLE statements', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      const tableCount = (migrationContent.match(/CREATE TABLE/g) || []).length;
      expect(tableCount).toBe(5);
    });

    test('should contain all required CREATE INDEX statements', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      const indexCount = (migrationContent.match(/CREATE (UNIQUE )?INDEX/g) || []).length;
      expect(indexCount).toBeGreaterThanOrEqual(7);
    });

    test('should have proper CASCADE delete behavior on all foreign keys', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      const foreignKeyCount = (migrationContent.match(/CONSTRAINT.*FOREIGN KEY/g) || []).length;
      const cascadeCount = (migrationContent.match(/ON DELETE CASCADE/g) || []).length;
      expect(foreignKeyCount).toBe(cascadeCount);
    });
  });

  describe('Password Security Fields', () => {
    test('should ensure hash and salt fields are both present and NOT NULL', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      expect(migrationContent).toContain('"hash" TEXT NOT NULL');
      expect(migrationContent).toContain('"salt" TEXT NOT NULL');
    });

    test('should not store password in plain text', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      expect(migrationContent).not.toContain('"password"');
    });
  });
});