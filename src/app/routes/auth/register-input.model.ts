import { RegisterInputModel } from './register-input.model';

describe('RegisterInputModel', () => {
  describe('Interface Structure', () => {
    it('should accept valid RegisterInputModel with all required properties', () => {
      const validInput: RegisterInputModel = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      };

      expect(validInput.email).toBe('test@example.com');
      expect(validInput.username).toBe('testuser');
      expect(validInput.password).toBe('password123');
    });

    it('should accept RegisterInputModel with valid email format', () => {
      const input: RegisterInputModel = {
        email: 'user.name+tag@example.co.uk',
        username: 'testuser',
        password: 'securepass123'
      };

      expect(input.email).toBe('user.name+tag@example.co.uk');
    });

    it('should accept RegisterInputModel with unique username', () => {
      const input: RegisterInputModel = {
        email: 'test@example.com',
        username: 'uniqueuser123',
        password: 'password123'
      };

      expect(input.username).toBe('uniqueuser123');
    });

    it('should accept RegisterInputModel with password of exactly 8 characters', () => {
      const input: RegisterInputModel = {
        email: 'test@example.com',
        username: 'testuser',
        password: '12345678'
      };

      expect(input.password).toBe('12345678');
      expect(input.password.length).toBe(8);
    });

    it('should accept RegisterInputModel with password longer than 8 characters', () => {
      const input: RegisterInputModel = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'verylongpassword123456'
      };

      expect(input.password).toBe('verylongpassword123456');
      expect(input.password.length).toBeGreaterThan(8);
    });

    it('should have email property of type string', () => {
      const input: RegisterInputModel = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      };

      expect(typeof input.email).toBe('string');
    });

    it('should have username property of type string', () => {
      const input: RegisterInputModel = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      };

      expect(typeof input.username).toBe('string');
    });

    it('should have password property of type string', () => {
      const input: RegisterInputModel = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      };

      expect(typeof input.password).toBe('string');
    });

    it('should accept RegisterInputModel with various valid email formats', () => {
      const testCases: RegisterInputModel[] = [
        { email: 'simple@example.com', username: 'user1', password: 'password1' },
        { email: 'very.common@example.com', username: 'user2', password: 'password2' },
        { email: 'disposable.style.email.with+symbol@example.com', username: 'user3', password: 'password3' },
        { email: 'other.email-with-hyphen@example.com', username: 'user4', password: 'password4' },
        { email: 'x@example.com', username: 'user5', password: 'password5' }
      ];

      testCases.forEach(testCase => {
        expect(testCase.email).toBeTruthy();
        expect(testCase.username).toBeTruthy();
        expect(testCase.password).toBeTruthy();
      });
    });

    it('should accept RegisterInputModel with alphanumeric username', () => {
      const input: RegisterInputModel = {
        email: 'test@example.com',
        username: 'user123',
        password: 'password123'
      };

      expect(input.username).toBe('user123');
    });

    it('should accept RegisterInputModel with special characters in password', () => {
      const input: RegisterInputModel = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'P@ssw0rd!'
      };

      expect(input.password).toBe('P@ssw0rd!');
      expect(input.password.length).toBeGreaterThanOrEqual(8);
    });

    it('should accept RegisterInputModel with minimum valid data', () => {
      const input: RegisterInputModel = {
        email: 'a@b.c',
        username: 'u',
        password: '12345678'
      };

      expect(input.email).toBe('a@b.c');
      expect(input.username).toBe('u');
      expect(input.password.length).toBe(8);
    });

    it('should accept RegisterInputModel with maximum length strings', () => {
      const longEmail = 'a'.repeat(50) + '@example.com';
      const longUsername = 'u'.repeat(100);
      const longPassword = 'p'.repeat(100);

      const input: RegisterInputModel = {
        email: longEmail,
        username: longUsername,
        password: longPassword
      };

      expect(input.email).toBe(longEmail);
      expect(input.username).toBe(longUsername);
      expect(input.password).toBe(longPassword);
    });

    it('should maintain all properties when assigned', () => {
      const input: RegisterInputModel = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      };

      const copy = { ...input };

      expect(copy.email).toBe(input.email);
      expect(copy.username).toBe(input.username);
      expect(copy.password).toBe(input.password);
    });

    it('should be compatible with object destructuring', () => {
      const input: RegisterInputModel = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      };

      const { email, username, password } = input;

      expect(email).toBe('test@example.com');
      expect(username).toBe('testuser');
      expect(password).toBe('password123');
    });
  });

  describe('Type Safety', () => {
    it('should enforce all required properties are present', () => {
      const input: RegisterInputModel = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      };

      expect(input).toHaveProperty('email');
      expect(input).toHaveProperty('username');
      expect(input).toHaveProperty('password');
    });

    it('should allow assignment to variables of RegisterInputModel type', () => {
      const createInput = (): RegisterInputModel => ({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      });

      const input = createInput();

      expect(input.email).toBeDefined();
      expect(input.username).toBeDefined();
      expect(input.password).toBeDefined();
    });

    it('should work with array of RegisterInputModel', () => {
      const inputs: RegisterInputModel[] = [
        { email: 'user1@example.com', username: 'user1', password: 'password1' },
        { email: 'user2@example.com', username: 'user2', password: 'password2' }
      ];

      expect(inputs).toHaveLength(2);
      expect(inputs[0].email).toBe('user1@example.com');
      expect(inputs[1].email).toBe('user2@example.com');
    });
  });

  describe('Documentation Compliance', () => {
    it('should support email validation rule documentation', () => {
      const input: RegisterInputModel = {
        email: 'valid.email@example.com',
        username: 'testuser',
        password: 'password123'
      };

      expect(input.email).toContain('@');
      expect(input.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    it('should support username uniqueness rule documentation', () => {
      const input1: RegisterInputModel = {
        email: 'user1@example.com',
        username: 'uniqueuser1',
        password: 'password123'
      };

      const input2: RegisterInputModel = {
        email: 'user2@example.com',
        username: 'uniqueuser2',
        password: 'password123'
      };

      expect(input1.username).not.toBe(input2.username);
    });

    it('should support password length rule documentation', () => {
      const input: RegisterInputModel = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      };

      expect(input.password.length).toBeGreaterThanOrEqual(8);
    });
  });
});