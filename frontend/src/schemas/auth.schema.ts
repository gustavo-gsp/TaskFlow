import { z } from 'zod';

/**
 * Schema de validação para login
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(8, 'Senha deve ter no mínimo 8 caracteres'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Schema de validação para registro
 */
export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Nome é obrigatório')
      .min(2, 'Nome deve ter no mínimo 2 caracteres')
      .max(100, 'Nome deve ter no máximo 100 caracteres'),
    email: z
      .string()
      .min(1, 'Email é obrigatório')
      .email('Email inválido'),
    password: z
      .string()
      .min(1, 'Senha é obrigatória')
      .min(8, 'Senha deve ter no mínimo 8 caracteres')
      .max(100, 'Senha deve ter no máximo 100 caracteres'),
    confirmPassword: z
      .string()
      .min(1, 'Confirmação de senha é obrigatória'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
