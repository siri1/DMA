import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import type { CreateUserInput, UpdateUserInput, ResetPasswordInput } from './validators'

export async function createUser(input: CreateUserInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) throw new Error('Utilizador com este email já existe')

  const passwordHash = await hashPassword(input.password)

  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      role: input.role,
      passwordHash,
      active: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      lastLoginAt: true,
      createdAt: true,
    },
  })
}

export async function getUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      lastLoginAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      lastLoginAt: true,
      createdAt: true,
    },
  })
}

export async function updateUser(id: string, input: UpdateUserInput) {
  return prisma.user.update({
    where: { id },
    data: {
      name: input.name,
      email: input.email,
      role: input.role,
      active: input.active,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      lastLoginAt: true,
    },
  })
}

export async function resetPassword(id: string, input: ResetPasswordInput) {
  const passwordHash = await hashPassword(input.newPassword)
  return prisma.user.update({
    where: { id },
    data: { passwordHash },
    select: { id: true, email: true },
  })
}

export async function deactivateUser(id: string) {
  return prisma.user.update({
    where: { id },
    data: { active: false },
    select: { id: true, email: true, active: true },
  })
}
