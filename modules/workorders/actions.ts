'use server'

import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/rbac'
import { createAuditLog } from '@/lib/audit'
import { createWorkOrderSchema, updateWorkOrderSchema } from './validators'
import {
  createWorkOrder as createWorkOrderService,
  updateWorkOrder as updateWorkOrderService,
  getWorkOrderById,
} from './services'

export async function createWorkOrderAction(formData: unknown) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  if (!hasPermission(session.user.role as any, 'workorders', 'create')) {
    throw new Error('Forbidden')
  }

  const validated = createWorkOrderSchema.parse(formData)
  const workOrder = await createWorkOrderService(validated)

  await createAuditLog({
    userId: session.user.id as string,
    action: 'CREATE',
    module: 'workorders',
    entityType: 'workorder',
    entityId: workOrder.id,
    after: JSON.stringify(workOrder),
  })

  return workOrder
}

export async function updateWorkOrderAction(id: string, formData: unknown) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  if (!hasPermission(session.user.role as any, 'workorders', 'edit')) {
    throw new Error('Forbidden')
  }

  const before = await getWorkOrderById(id)
  const validated = updateWorkOrderSchema.parse(formData)
  const workOrder = await updateWorkOrderService(id, validated)

  await createAuditLog({
    userId: session.user.id as string,
    action: 'UPDATE',
    module: 'workorders',
    entityType: 'workorder',
    entityId: id,
    before: before ? JSON.stringify(before) : undefined,
    after: JSON.stringify(workOrder),
  })

  return workOrder
}
