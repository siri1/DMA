import { prisma } from '@/lib/prisma'
import type { CreateSupplierInput, UpdateSupplierInput } from './validators'

export async function createSupplier(input: CreateSupplierInput) {
  return prisma.supplier.create({
    data: {
      name: input.name,
      nif: input.nif,
      contact: input.contact,
      phone: input.phone,
      email: input.email,
      leadTimeDays: input.leadTimeDays,
    },
  })
}

export async function getSupplierById(id: string) {
  return prisma.supplier.findUnique({
    where: { id },
    include: {
      purchaseOrders: { take: 5, orderBy: { createdAt: 'desc' } },
    },
  })
}

export async function getSuppliers(search?: string) {
  return prisma.supplier.findMany({
    where: search
      ? {
          OR: [{ name: { contains: search, mode: 'insensitive' } }, { nif: { contains: search } }],
        }
      : undefined,
    orderBy: { name: 'asc' },
  })
}

export async function updateSupplier(id: string, input: UpdateSupplierInput) {
  return prisma.supplier.update({
    where: { id },
    data: {
      ...(input.name && { name: input.name }),
      ...(input.nif && { nif: input.nif }),
      ...(input.contact !== undefined && { contact: input.contact }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.email !== undefined && { email: input.email }),
      ...(input.leadTimeDays && { leadTimeDays: input.leadTimeDays }),
    },
  })
}

export async function deleteSupplier(id: string) {
  return prisma.supplier.delete({ where: { id } })
}
