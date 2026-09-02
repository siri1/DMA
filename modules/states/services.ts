import { prisma } from '@/lib/prisma'
import { canTransition, recordStateTransition } from '@/lib/state-machine'
import type { UserRole, AssetStatus, WorkOrderStatus } from '@prisma/client'

export async function transitionAssetState(
  assetId: string,
  toState: AssetStatus,
  userId: string,
  userRole: UserRole,
  reason?: string
) {
  // Obter estado actual
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
  })

  if (!asset) throw new Error('Asset not found')

  // Validar transição
  const allowed = await canTransition('asset', asset.status, toState, userRole)
  if (!allowed) throw new Error('State transition not allowed')

  // Actualizar status
  const updated = await prisma.asset.update({
    where: { id: assetId },
    data: { status: toState },
  })

  // Registar transição
  await recordStateTransition(
    'asset',
    assetId,
    asset.status,
    toState,
    userId,
    reason
  )

  return updated
}

export async function transitionWorkOrderState(
  workOrderId: string,
  toState: WorkOrderStatus,
  userId: string,
  userRole: UserRole,
  reason?: string
) {
  // Obter estado actual
  const workOrder = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
  })

  if (!workOrder) throw new Error('WorkOrder not found')

  // Validar transição
  const allowed = await canTransition(
    'workorder',
    workOrder.status,
    toState,
    userRole
  )
  if (!allowed) throw new Error('State transition not allowed')

  // Actualizar status
  const updated = await prisma.workOrder.update({
    where: { id: workOrderId },
    data: { status: toState },
  })

  // Registar transição
  await recordStateTransition(
    'workorder',
    workOrderId,
    workOrder.status,
    toState,
    userId,
    reason
  )

  return updated
}

export async function getStateTransitionHistory(
  entityType: string,
  entityId: string
) {
  return prisma.stateTransition.findMany({
    where: {
      entityType,
      entityId,
    },
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}
