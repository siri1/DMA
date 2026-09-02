import { prisma } from '@/lib/prisma'
import type { WorkOrderStatus, WorkOrderPriority } from '@prisma/client'
import type { CreateWorkOrderInput, UpdateWorkOrderInput } from './validators'

export async function generateWorkOrderNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const lastWO = await prisma.workOrder.findFirst({
    where: { number: { startsWith: `OT-${year}` } },
    orderBy: { createdAt: 'desc' },
  })

  let nextNum = 1
  if (lastWO) {
    const match = lastWO.number.match(/OT-\d+-(\d+)/)
    if (match) {
      nextNum = parseInt(match[1]) + 1
    }
  }

  return `OT-${year}-${String(nextNum).padStart(4, '0')}`
}

export async function createWorkOrder(data: CreateWorkOrderInput) {
  const number = await generateWorkOrderNumber()

  return prisma.workOrder.create({
    data: {
      number,
      ...data,
      status: 'ABERTA',
    },
    include: {
      asset: true,
      assignedTo: true,
    },
  })
}

export async function getWorkOrderById(id: string) {
  return prisma.workOrder.findUnique({
    where: { id },
    include: {
      asset: true,
      assignedTo: true,
      interventions: { orderBy: { createdAt: 'desc' } },
    },
  })
}

export async function getWorkOrders(filters?: {
  status?: WorkOrderStatus
  priority?: WorkOrderPriority
  assetId?: string
}) {
  return prisma.workOrder.findMany({
    where: {
      ...(filters?.status && { status: filters.status }),
      ...(filters?.priority && { priority: filters.priority }),
      ...(filters?.assetId && { assetId: filters.assetId }),
    },
    include: {
      asset: true,
      assignedTo: true,
    },
    orderBy: [{ priority: 'asc' }, { openedAt: 'desc' }],
  })
}

export async function updateWorkOrder(id: string, data: UpdateWorkOrderInput) {
  return prisma.workOrder.update({
    where: { id },
    data,
    include: {
      asset: true,
      assignedTo: true,
    },
  })
}

export async function countByStatus() {
  const statuses = [
    'ABERTA',
    'EM_CURSO',
    'EM_DIAGNOSTICO',
    'EM_REPARACAO',
    'AGUARDA_MATERIAL',
    'EM_INSPECCAO',
    'RESOLVIDA',
  ] as const

  return Promise.all(
    statuses.map(async (status) => ({
      status,
      count: await prisma.workOrder.count({ where: { status } }),
    }))
  )
}
