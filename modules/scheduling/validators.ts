import { z } from 'zod'

export const scheduleWorkOrderSchema = z.object({
  scheduledStart: z.coerce.date(),
  estimatedDurationMinutes: z.number().int().min(15).max(24 * 60),
  requiredQualifications: z.array(z.string().min(1)).default([]),
})
export type ScheduleWorkOrderInput = z.infer<typeof scheduleWorkOrderSchema>

export const assignTechnicianSchema = z.object({
  technicianId: z.string().min(1),
  force: z.boolean().optional(),
})
export type AssignTechnicianInput = z.infer<typeof assignTechnicianSchema>
