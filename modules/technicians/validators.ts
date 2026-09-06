import { z } from 'zod'

export const markAbsentSchema = z.object({
  date: z.coerce.date(),
  reason: z.string().max(200).optional(),
})
export type MarkAbsentInput = z.infer<typeof markAbsentSchema>

export const markAvailableSchema = z.object({
  date: z.coerce.date(),
})
export type MarkAvailableInput = z.infer<typeof markAvailableSchema>
