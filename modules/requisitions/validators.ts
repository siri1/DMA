import { z } from 'zod'
import { RequisitionStatus } from '@prisma/client'

export const createRequisitionSchema = z.object({
  workOrderId: z.string().min(1, 'OT é obrigatória'),
  lines: z.array(
    z.object({
      itemId: z.string().min(1),
      qtyRequested: z.number().min(1),
    })
  ),
})

export const updateRequisitionLineSchema = z.object({
  qtyRequested: z.number().min(1).optional(),
  qtyDelivered: z.number().min(0).optional(),
})

export const updateRequisitionStatusSchema = z.object({
  status: z.enum([
    RequisitionStatus.PENDENTE,
    RequisitionStatus.RESERVADA,
    RequisitionStatus.AGUARDA_MATERIAL,
    RequisitionStatus.ENTREGUE,
    RequisitionStatus.DEVOLVIDA,
    RequisitionStatus.CANCELADA,
  ]),
})

export type CreateRequisitionInput = z.infer<typeof createRequisitionSchema>
export const deliverRequisitionSchema = z.object({
  action: z.literal('deliver'),
})

export const rejectRequisitionSchema = z.object({
  action: z.literal('reject'),
  reason: z.string().min(3, 'Indique o motivo da rejeição'),
})

export type UpdateRequisitionLineInput = z.infer<typeof updateRequisitionLineSchema>
export type RejectRequisitionInput = z.infer<typeof rejectRequisitionSchema>
