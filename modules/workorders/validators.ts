import { z } from 'zod'

export const createWorkOrderSchema = z.object({
  assetId: z.string().min(1),
  origin: z.enum(['AVARIA', 'PLANO', 'MANUAL']),
  priority: z.enum(['CRITICA', 'ALTA', 'MEDIA', 'BAIXA']),
  summary: z.string().min(5).max(500),
  assignedToId: z.string().optional(),
  dueAt: z.coerce.date().optional(),
})

export const updateWorkOrderSchema = createWorkOrderSchema.partial().extend({
  status: z.enum(['ABERTA', 'EM_CURSO', 'EM_DIAGNOSTICO', 'EM_REPARACAO', 'AGUARDA_MATERIAL', 'EM_INSPECCAO', 'RESOLVIDA', 'PENDENTE', 'CANCELADA']).optional(),
})

export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>
export type UpdateWorkOrderInput = z.infer<typeof updateWorkOrderSchema>
