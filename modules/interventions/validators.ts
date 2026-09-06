import { z } from 'zod'

export const createInterventionSchema = z.object({
  workOrderId: z.string().min(1),
  technicianId: z.string().min(1),
  diagnosis: z.string().optional(),
  activities: z.string().optional(),
  result: z.enum(['CONCLUIDA', 'PENDENTE', 'REQUER_NOVA']).optional(),
  laborMinutes: z.number().int().positive().optional(),
})

export const updateInterventionSchema = createInterventionSchema.partial()

export const stopInterventionSchema = z.object({
  diagnosis: z.string().optional(),
  activities: z.string().optional(),
  result: z.enum(['CONCLUIDA', 'PENDENTE', 'REQUER_NOVA']).optional(),
})

export type CreateInterventionInput = z.infer<typeof createInterventionSchema>
export type UpdateInterventionInput = z.infer<typeof updateInterventionSchema>
export type StopInterventionInput = z.infer<typeof stopInterventionSchema>
