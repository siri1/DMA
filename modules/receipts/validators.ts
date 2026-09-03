import { z } from 'zod'
import { ReceiptStatus } from '@prisma/client'

export const createReceiptSchema = z.object({
  purchaseOrderId: z.string().optional(),
  lines: z.array(
    z.object({
      itemId: z.string().min(1),
      qtyReceived: z.number().min(1),
    })
  ),
})

export const completeReceiptSchema = z.object({
  status: z.enum([ReceiptStatus.PARCIAL, ReceiptStatus.RECEBIDA]),
})

export type CreateReceiptInput = z.infer<typeof createReceiptSchema>
export type CompleteReceiptInput = z.infer<typeof completeReceiptSchema>
