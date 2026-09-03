import { z } from 'zod'

export const purchaseOrderLineSchema = z.object({
  itemId: z.string().min(1),
  qtyOrdered: z.number().int().positive(),
  unitPrice: z.number().positive(),
})

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().min(1),
  lines: z.array(purchaseOrderLineSchema).min(1, 'Adicione pelo menos um artigo'),
})

export const updatePurchaseOrderStatusSchema = z.object({
  status: z.enum(['RASCUNHO', 'ENVIADA', 'PARCIAL', 'RECEBIDA', 'CANCELADA']),
})

export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>
export type UpdatePurchaseOrderStatusInput = z.infer<typeof updatePurchaseOrderStatusSchema>
