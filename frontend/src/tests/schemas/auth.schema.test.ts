import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema } from '../../schemas/auth.schema';

describe('Auth Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty email', () => {
      const invalidData = {
        email: '',
        password: 'password123',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const emailError = result.error.issues.find(e => e.path[0] === 'email');
        expect(emailError?.message).toBe('Email é obrigatório');
      }
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const emailError = result.error.issues.find(e => e.path[0] === 'email');
        expect(emailError?.message).toBe('Email inválido');
      }
    });

    it('should reject empty password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find(e => e.path[0] === 'password');
        expect(passwordError?.message).toBe('Senha é obrigatória');
      }
    });

    it('should reject password shorter than 8 characters', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'short',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find(e => e.path[0] === 'password');
        expect(passwordError?.message).toContain('mínimo 8 caracteres');
      }
    });
  });

  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const validData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const invalidData = {
        name: '',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const nameError = result.error.issues.find(e => e.path[0] === 'name');
        expect(nameError?.message).toBe('Nome é obrigatório');
      }
    });

    it('should reject name shorter than 2 characters', () => {
      const invalidData = {
        name: 'A',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const nameError = result.error.issues.find(e => e.path[0] === 'name');
        expect(nameError?.message).toContain('mínimo 2 caracteres');
      }
    });

    it('should reject name longer than 100 characters', () => {
      const invalidData = {
        name: 'A'.repeat(101),
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const nameError = result.error.issues.find(e => e.path[0] === 'name');
        expect(nameError?.message).toContain('máximo 100 caracteres');
      }
    });

    it('should reject when passwords do not match', () => {
      const invalidData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'different123',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(err => 
          err.message.includes('As senhas não coincidem')
        )).toBe(true);
      }
    });

    it('should reject empty confirmation password', () => {
      const invalidData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: '',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmError = result.error.issues.find(e => e.path[0] === 'confirmPassword');
        expect(confirmError?.message).toBe('Confirmação de senha é obrigatória');
      }
    });

    it('should validate with all fields correct', () => {
      const validData = {
        name: 'Valid User Name',
        email: 'valid@example.com',
        password: 'validPassword123',
        confirmPassword: 'validPassword123',
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});
