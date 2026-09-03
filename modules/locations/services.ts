import { prisma } from '@/lib/prisma'
import type { CreateLocationInput } from './validators'

export async function createLocation(input: CreateLocationInput) {
  return prisma.location.create({ data: input })
}

export async function getLocations() {
  return prisma.location.findMany({
    orderBy: [{ warehouse: 'asc' }, { code: 'asc' }],
  })
}

export async function getLocationById(id: string) {
  return prisma.location.findUnique({
    where: { id },
    include: {
      stockBalances: { include: { item: true } },
    },
  })
}
