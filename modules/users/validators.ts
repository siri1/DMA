import { z } from 'zod'

export const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  role: z.enum(['ADMIN', 'OFICINA', 'ARMAZEM', 'GESTAO', 'CLIENTE_INTERNO', 'PAINEL']),
  password: z.string().min(10).max(100),
})

export type CreateUserInput = z.infer<typeof createUserSchema>

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'OFICINA', 'ARMAZEM', 'GESTAO', 'CLIENTE_INTERNO', 'PAINEL']).optional(),
  active: z.boolean().optional(),
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(10).max(100),
})

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
