import { z } from 'zod'

export const createItemSchema = z.object({
  sku: z.string().min(3, 'SKU deve ter ≥ 3 caracteres'),
  description: z.string().min(5, 'Descrição deve ter ≥ 5 caracteres'),
  brand: z.string().optional(),
  unit: z.string().default('UN'),
  minStock: z.number().min(0),
  maxStock: z.number().min(1),
  avgCost: z.number().min(0),
  barcode: z.string().optional(),
  active: z.boolean().default(true),
})

export const updateItemSchema = createItemSchema.partial()

export const createLocationSchema = z.object({
  warehouse: z.string().min(1),
  aisle: z.string().min(1),
  shelf: z.string().min(1),
  position: z.string().min(1),
})

export type CreateItemInput = z.infer<typeof createItemSchema>
export type UpdateItemInput = z.infer<typeof updateItemSchema>
export type CreateLocationInput = z.infer<typeof createLocationSchema>
