'use server'

import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/rbac'
import { createAuditLog } from '@/lib/audit'
import { transitionAssetState, transitionWorkOrderState } from './services'
import type { AssetStatus, WorkOrderStatus } from '@prisma/client'

export async function transitionAssetStateAction(
  assetId: string,
  toState: AssetStatus,
  reason?: string
) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'assets', 'edit')) {
    throw new Error('Forbidden')
  }

  const asset = await transitionAssetState(
    assetId,
    toState,
    session.user.id as string,
    session.user.role as any,
    reason
  )

  // Auditoria
  await createAuditLog({
    userId: session.user.id as string,
    action: 'STATE_CHANGE',
    module: 'assets',
    entityType: 'asset',
    entityId: assetId,
    after: { status: toState, reason } as any,
  })

  return asset
}

export async function transitionWorkOrderStateAction(
  workOrderId: string,
  toState: WorkOrderStatus,
  reason?: string
) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'workorders', 'edit')) {
    throw new Error('Forbidden')
  }

  const workOrder = await transitionWorkOrderState(
    workOrderId,
    toState,
    session.user.id as string,
    session.user.role as any,
    reason
  )

  // Auditoria
  await createAuditLog({
    userId: session.user.id as string,
    action: 'STATE_CHANGE',
    module: 'workorders',
    entityType: 'workorder',
    entityId: workOrderId,
    after: { status: toState, reason } as any,
  })

  return workOrder
}
