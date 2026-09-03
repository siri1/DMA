import { z } from 'zod'

export const createInventoryCountSchema = z.object({
  lines: z
    .array(
      z.object({
        itemId: z.string().min(1),
        expectedQty: z.number().int().min(0),
        countedQty: z.number().int().min(0),
      })
    )
    .min(1, 'Adicione pelo menos um artigo'),
})

export type CreateInventoryCountInput = z.infer<typeof createInventoryCountSchema>
