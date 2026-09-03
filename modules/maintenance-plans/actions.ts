'use server'

import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/rbac'
import { createAuditLog } from '@/lib/audit'
import { createMaintenancePlanSchema, updateMaintenancePlanSchema } from './validators'
import {
  createMaintenancePlan as createService,
  updateMaintenancePlan as updateService,
  deleteMaintenancePlan as deleteService,
  getMaintenancePlanById,
} from './services'

export async function createMaintenancePlanAction(formData: unknown) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'maintenance', 'create')) {
    throw new Error('Forbidden')
  }

  const validated = createMaintenancePlanSchema.parse(formData)
  const plan = await createService(validated)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await createAuditLog({
    userId: session.user.id as string,
    action: 'CREATE',
    module: 'maintenance',
    entityType: 'maintenanceplan',
    entityId: plan.id,
    after: plan as any,
  })

  return plan
}

export async function updateMaintenancePlanAction(id: string, formData: unknown) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'maintenance', 'edit')) {
    throw new Error('Forbidden')
  }

  const before = await getMaintenancePlanById(id)
  const validated = updateMaintenancePlanSchema.parse(formData)
  const plan = await updateService(id, validated)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await createAuditLog({
    userId: session.user.id as string,
    action: 'UPDATE',
    module: 'maintenance',
    entityType: 'maintenanceplan',
    entityId: id,
    before: before ? (before as any) : undefined,
    after: plan as any,
  })

  return plan
}

export async function deleteMaintenancePlanAction(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'maintenance', 'delete')) {
    throw new Error('Forbidden')
  }

  const before = await getMaintenancePlanById(id)
  const plan = await deleteService(id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await createAuditLog({
    userId: session.user.id as string,
    action: 'DELETE',
    module: 'maintenance',
    entityType: 'maintenanceplan',
    entityId: id,
    before: before ? (before as any) : undefined,
  })

  return plan
}
