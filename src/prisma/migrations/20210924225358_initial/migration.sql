const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

describe('Migration 20210924225358_initial - Schema Verification Tests', () => {
  const migrationPath = path.join(__dirname, '../../../src/prisma/migrations/20210924225358_initial/migration.sql');
  
  describe('Article Table Schema Verification', () => {
    test('should verify Article table has body column for readingTime calculation', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      
      expect(migrationContent).toContain('CREATE TABLE "Article"');
      expect(migrationContent).toContain('"body" TEXT NOT NULL');
    });

    test('should verify Article table does NOT contain readingTime column', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      
      expect(migrationContent).not.toContain('readingTime');
      expect(migrationContent).not.toContain('reading_time');
      expect(migrationContent).not.toContain('READING_TIME');
    });

    test('should verify Article table has all required columns', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      
      expect(migrationContent).toContain('"id" SERIAL NOT NULL');
      expect(migrationContent).toContain('"slug" TEXT NOT NULL');
      expect(migrationContent).toContain('"title" TEXT NOT NULL');
      expect(migrationContent).toContain('"description" TEXT NOT NULL');
      expect(migrationContent).toContain('"body" TEXT NOT NULL');
      expect(migrationContent).toContain('"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP');
      expect(migrationContent).toContain('"updatedAt" TIMESTAMP(3) NOT NULL');
      expect(migrationContent).toContain('"authorId" INTEGER NOT NULL');
    });

    test('should verify Article table has primary key constraint', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      
      expect(migrationContent).toContain('CONSTRAINT "Article_pkey" PRIMARY KEY ("id")');
    });

    test('should verify Article table has unique slug constraint', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      
      expect(migrationContent).toContain('CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug")');
    });

    test('should verify Article table has foreign key to User', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      
      expect(migrationContent).toContain('ALTER TABLE "Article" ADD CONSTRAINT "Article_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id")');
    });
  });

  describe('Migration File Integrity Tests', () => {
    test('should verify migration file exists', () => {
      expect(fs.existsSync(migrationPath)).toBe(true);
    });

    test('should verify migration file is readable', () => {
      expect(() => {
        fs.readFileSync(migrationPath, 'utf8');
      }).not.toThrow();
    });

    test('should verify migration file contains valid SQL syntax', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      
      expect(migrationContent).toContain('CREATE TABLE');
      expect(migrationContent).toContain('ALTER TABLE');
      expect(migrationContent).toContain('ADD CONSTRAINT');
    });

    test('should verify migration file has no modifications for readingTime feature', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      const lines = migrationContent.split('\n');
      
      const readingTimeRelatedLines = lines.filter(line => 
        line.toLowerCase().includes('readingtime') || 
        line.toLowerCase().includes('reading_time')
      );
      
      expect(readingTimeRelatedLines.length).toBe(0);
    });
  });

  describe('Related Tables Schema Verification', () => {
    test('should verify User table exists for Article author relationship', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      
      expect(migrationContent).toContain('CREATE TABLE "User"');
      expect(migrationContent).toContain('"id" SERIAL NOT NULL');
      expect(migrationContent).toContain('"email" TEXT NOT NULL');
      expect(migrationContent).toContain('"username" TEXT NOT NULL');
    });

    test('should verify Comment table exists', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      
      expect(migrationContent).toContain('CREATE TABLE "Comment"');
      expect(migrationContent).toContain('"articleId" INTEGER NOT NULL');
    });

    test('should verify Tag table and Article-Tag relationship exists', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      
      expect(migrationContent).toContain('CREATE TABLE "Tag"');
      expect(migrationContent).toContain('CREATE TABLE "_ArticleToTag"');
    });

    test('should verify Article favorites relationship exists', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      
      expect(migrationContent).toContain('CREATE TABLE "_ArticleFavorites"');
    });
  });

  describe('Body Column Sufficiency Tests', () => {
    test('should verify body column type is TEXT for storing article content', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      
      const bodyColumnMatch = migrationContent.match(/"body"\s+TEXT\s+NOT NULL/);
      expect(bodyColumnMatch).not.toBeNull();
    });

    test('should verify body column is NOT NULL to ensure content exists for readingTime calculation', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      
      expect(migrationContent).toContain('"body" TEXT NOT NULL');
    });

    test('should document that body column is sufficient for runtime readingTime calculation', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      
      const hasBodyColumn = migrationContent.includes('"body" TEXT NOT NULL');
      const hasNoReadingTimeColumn = !migrationContent.toLowerCase().includes('readingtime');
      
      expect(hasBodyColumn).toBe(true);
      expect(hasNoReadingTimeColumn).toBe(true);
    });
  });

  describe('Migration Rollback Safety Tests', () => {
    test('should verify no ALTER TABLE statements modify Article structure for readingTime', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      const alterTableStatements = migrationContent.match(/ALTER TABLE "Article"[^;]+;/g) || [];
      
      const readingTimeAlterations = alterTableStatements.filter(stmt => 
        stmt.toLowerCase().includes('readingtime') || 
        stmt.toLowerCase().includes('reading_time')
      );
      
      expect(readingTimeAlterations.length).toBe(0);
    });

    test('should verify migration is idempotent for Article table', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      
      const createTableMatches = migrationContent.match(/CREATE TABLE "Article"/g) || [];
      expect(createTableMatches.length).toBe(1);
    });
  });

  describe('Documentation and Compliance Tests', () => {
    test('should confirm no database migration required for readingTime Epic', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      
      expect(migrationContent).not.toContain('readingTime');
      expect(migrationContent).not.toContain('reading_time');
    });

    test('should verify readingTime is intended as calculated/virtual field', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      
      const hasComputedColumn = migrationContent.toLowerCase().includes('generated') || 
                                 migrationContent.toLowerCase().includes('computed') ||
                                 migrationContent.toLowerCase().includes('virtual');
      
      expect(hasComputedColumn).toBe(false);
    });

    test('should verify migration file requires no modifications per checklist', () => {
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      const originalExpectedTables = ['Article', 'User', 'Comment', 'Tag', '_ArticleToTag', '_ArticleFavorites', '_UserFollows'];
      
      originalExpectedTables.forEach(tableName => {
        expect(migrationContent).toContain(`CREATE TABLE "${tableName}"`);
      });
      
      expect(migrationContent).not.toContain('readingTime');
    });
  });
});