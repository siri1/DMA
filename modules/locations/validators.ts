import { z } from 'zod'

export const createLocationSchema = z.object({
  code: z.string().min(1).max(20),
  warehouse: z.string().min(1),
  aisle: z.string().optional(),
  shelf: z.string().optional(),
  position: z.string().optional(),
})

export type CreateLocationInput = z.infer<typeof createLocationSchema>
