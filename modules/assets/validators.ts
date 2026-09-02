import { z } from 'zod'

export const createAssetSchema = z.object({
  assetCode: z.string().min(3).max(50),
  description: z.string().min(5).max(500),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  entryDate: z.coerce.date(),
  diagnosis: z.string().optional(),
  location: z.string().optional(),
  family: z.string().optional(),
})

export const updateAssetSchema = createAssetSchema.partial()

export type CreateAssetInput = z.infer<typeof createAssetSchema>
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>
