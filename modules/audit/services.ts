import { prisma } from '@/lib/prisma'

export interface AuditFilter {
  userId?: string
  module?: string
  entityType?: string
  action?: string
  fromDate?: Date
  toDate?: Date
  limit?: number
  offset?: number
}

export async function getAuditLogs(filter: AuditFilter) {
  const { userId, module, entityType, action, fromDate, toDate, limit = 100, offset = 0 } = filter

  const logs = await prisma.auditLog.findMany({
    where: {
      userId,
      module,
      entityType,
      action,
      createdAt: {
        gte: fromDate,
        lte: toDate,
      },
    },
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  })

  const total = await prisma.auditLog.count({
    where: {
      userId,
      module,
      entityType,
      action,
      createdAt: {
        gte: fromDate,
        lte: toDate,
      },
    },
  })

  return { logs, total }
}

export async function getAuditLogsByEntity(entityType: string, entityId: string) {
  return prisma.auditLog.findMany({
    where: { entityType, entityId },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function exportAuditLogs(filter: AuditFilter) {
  const { userId, module, entityType, action, fromDate, toDate } = filter

  return prisma.auditLog.findMany({
    where: {
      userId,
      module,
      entityType,
      action,
      createdAt: {
        gte: fromDate,
        lte: toDate,
      },
    },
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}
