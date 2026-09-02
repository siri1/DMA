'use server'

import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/rbac'
import { createAuditLog } from '@/lib/audit'
import { createInterventionSchema, updateInterventionSchema } from './validators'
import {
  createIntervention as createInterventionService,
  updateIntervention as updateInterventionService,
  getInterventionById,
} from './services'

export async function createInterventionAction(formData: unknown) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  if (!hasPermission(session.user.role as any, 'interventions', 'create')) {
    throw new Error('Forbidden')
  }

  const validated = createInterventionSchema.parse(formData)
  const intervention = await createInterventionService(validated)

  await createAuditLog({
    userId: session.user.id as string,
    action: 'CREATE',
    module: 'interventions',
    entityType: 'intervention',
    entityId: intervention.id,
    after: intervention as any,
  })

  return intervention
}

export async function updateInterventionAction(id: string, formData: unknown) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  if (!hasPermission(session.user.role as any, 'interventions', 'edit')) {
    throw new Error('Forbidden')
  }

  const before = await getInterventionById(id)
  const validated = updateInterventionSchema.parse(formData)
  const intervention = await updateInterventionService(id, validated)

  await createAuditLog({
    userId: session.user.id as string,
    action: 'UPDATE',
    module: 'interventions',
    entityType: 'intervention',
    entityId: id,
    before: before ? (before as any) : undefined,
    after: intervention as any,
  })

  return intervention
}
