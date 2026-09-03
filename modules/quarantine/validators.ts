import { z } from 'zod'
import { QuarantineDecision } from '@prisma/client'

export const enterQuarantineSchema = z.object({
  assetId: z.string().min(1, 'Asset é obrigatório'),
  technicalOpinion: z.string().optional(),
})

export const decideQuarantineSchema = z.object({
  decision: z.enum([
    QuarantineDecision.REPARAR,
    QuarantineDecision.REAPROVEITAR,
    QuarantineDecision.TRANSFERIR,
    QuarantineDecision.ABATER,
  ]),
})

export type EnterQuarantineInput = z.infer<typeof enterQuarantineSchema>
export type DecideQuarantineInput = z.infer<typeof decideQuarantineSchema>
