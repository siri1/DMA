import { z } from 'zod'

export const createSupplierSchema = z.object({
  name: z.string().min(3, 'Nome deve ter ≥ 3 caracteres'),
  nif: z.string().min(5, 'NIF deve ter ≥ 5 caracteres'),
  contact: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
  leadTimeDays: z.number().min(1, 'Lead time ≥ 1 dia'),
})

export const updateSupplierSchema = createSupplierSchema.partial()

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>
