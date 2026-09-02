import { prisma } from './prisma'
import type { AuditLog } from '@prisma/client'

export interface AuditLogInput {
  userId: string
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATE_CHANGE'
  module: string
  entityType: string
  entityId: string
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  ip?: string
}

export async function createAuditLog(input: AuditLogInput): Promise<AuditLog> {
  return prisma.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      module: input.module,
      entityType: input.entityType,
      entityId: input.entityId,
      before: input.before ? JSON.stringify(input.before) : null,
      after: input.after ? JSON.stringify(input.after) : null,
      ip: input.ip,
    },
  })
}

export async function getAuditLogs(
  filters?: {
    userId?: string
    entityType?: string
    entityId?: string
    action?: string
    startDate?: Date
    endDate?: Date
  },
  limit = 100,
  offset = 0
) {
  const where: Record<string, unknown> = {}

  if (filters?.userId) where.userId = filters.userId
  if (filters?.entityType) where.entityType = filters.entityType
  if (filters?.entityId) where.entityId = filters.entityId
  if (filters?.action) where.action = filters.action
  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {}
    if (filters.startDate)
      (where.createdAt as any).gte = filters.startDate
    if (filters.endDate)
      (where.createdAt as any).lte = filters.endDate
  }

  return prisma.auditLog.findMany({
    where,
    take: limit,
    skip: offset,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, email: true } },
    },
  })
}
