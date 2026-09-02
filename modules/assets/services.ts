import { prisma } from '@/lib/prisma'
import type { AssetStatus, Asset } from '@prisma/client'
import type { CreateAssetInput, UpdateAssetInput } from './validators'

export async function getAssetById(id: string) {
  return prisma.asset.findUnique({
    where: { id },
    include: {
      workOrders: {
        take: 5,
        orderBy: { openedAt: 'desc' },
      },
    },
  })
}

export async function getAssets(filters?: {
  status?: AssetStatus
  family?: string
}) {
  return prisma.asset.findMany({
    where: {
      ...(filters?.status && { status: filters.status }),
      ...(filters?.family && { family: filters.family }),
    },
    orderBy: { entryDate: 'desc' },
  })
}

export async function createAsset(data: CreateAssetInput) {
  const asset = await prisma.asset.create({
    data: {
      ...data,
      status: 'EM_OPERACAO',
    },
  })

  // Log auditoria (será feito em Server Action)
  return asset
}

export async function updateAsset(id: string, data: UpdateAssetInput) {
  return prisma.asset.update({
    where: { id },
    data,
  })
}

export async function deleteAsset(id: string) {
  return prisma.asset.delete({
    where: { id },
  })
}

export async function getAssetsByStatus(status: AssetStatus) {
  return prisma.asset.findMany({
    where: { status },
    orderBy: { entryDate: 'desc' },
  })
}

export async function countAssetsByStatus() {
  const statuses = [
    'EM_OPERACAO',
    'EM_MANUTENCAO',
    'INDISPONIVEL',
    'FORA_DE_SERVICO',
    'QUARENTENA',
    'ABATIDO',
  ] as const

  const counts = await Promise.all(
    statuses.map(async (status) => ({
      status,
      count: await prisma.asset.count({ where: { status } }),
    }))
  )

  return Object.fromEntries(counts.map((c) => [c.status, c.count]))
}

export async function getOldestAssetInMaintenance() {
  return prisma.asset.findFirst({
    where: { status: 'EM_MANUTENCAO' },
    orderBy: { entryDate: 'asc' },
  })
}
