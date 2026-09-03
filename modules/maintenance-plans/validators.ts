import { z } from 'zod'
import { MaintenanceType } from '@prisma/client'

export const createMaintenancePlanSchema = z.object({
  assetId: z.string().min(1, 'Asset é obrigatório'),
  family: z.string().optional(),
  type: z.enum([MaintenanceType.PREVENTIVA, MaintenanceType.CORRECTIVA, MaintenanceType.INSPECCAO]),
  periodicityDays: z.number().min(1, 'Periodicidade deve ser ≥ 1 dia'),
  nextDueAt: z.coerce.date(),
  active: z.boolean().default(true),
})

export const updateMaintenancePlanSchema = createMaintenancePlanSchema.partial()

export type CreateMaintenancePlanInput = z.infer<typeof createMaintenancePlanSchema>
export type UpdateMaintenancePlanInput = z.infer<typeof updateMaintenancePlanSchema>
