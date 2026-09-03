import { prisma } from '@/lib/prisma'
import { AssetStatus, type QuarantineDecision, type UserRole } from '@prisma/client'
import { transitionAssetState } from '@/modules/states/services'
import type { EnterQuarantineInput, DecideQuarantineInput } from './validators'

// The asset state machine only allows QUARENTENA → EM_OPERACAO | ABATIDO (docs/ASSUMPTIONS.md 3.5)
const DECISION_TARGET: Record<QuarantineDecision, AssetStatus> = {
  REPARAR: AssetStatus.EM_OPERACAO,
  REAPROVEITAR: AssetStatus.EM_OPERACAO,
  TRANSFERIR: AssetStatus.EM_OPERACAO,
  ABATER: AssetStatus.ABATIDO,
}

export async function enterQuarantine(
  input: EnterQuarantineInput,
  userId: string,
  userRole: UserRole
) {
  await transitionAssetState(
    input.assetId,
    AssetStatus.QUARENTENA,
    userId,
    userRole,
    input.technicalOpinion
  )

  return prisma.quarantine.create({
    data: {
      assetId: input.assetId,
      technicalOpinion: input.technicalOpinion,
    },
    include: { asset: true },
  })
}

export async function getQuarantineById(id: string) {
  return prisma.quarantine.findUnique({
    where: { id },
    include: { asset: true },
  })
}

export async function getQuarantines() {
  return prisma.quarantine.findMany({
    include: { asset: true },
    orderBy: { enteredAt: 'desc' },
  })
}

export async function getPendingQuarantines() {
  return prisma.quarantine.findMany({
    where: { decision: null },
    include: { asset: true },
    orderBy: { enteredAt: 'asc' },
  })
}

export async function decideQuarantine(
  id: string,
  input: DecideQuarantineInput,
  userId: string,
  userRole: UserRole
) {
  const quarantine = await prisma.quarantine.findUnique({ where: { id } })
  if (!quarantine) throw new Error('Quarentena não encontrada')
  if (quarantine.decision) throw new Error('Quarentena já decidida')

  const target = DECISION_TARGET[input.decision]

  await transitionAssetState(
    quarantine.assetId,
    target,
    userId,
    userRole,
    `Decisão de quarentena: ${input.decision}`
  )

  if (target === AssetStatus.ABATIDO) {
    await prisma.asset.update({
      where: { id: quarantine.assetId },
      data: { scrappedAt: new Date() },
    })
  }

  return prisma.quarantine.update({
    where: { id },
    data: {
      decision: input.decision,
      decidedAt: new Date(),
      decidedById: userId,
    },
    include: { asset: true },
  })
}

export async function getQuarantinesByAsset(assetId: string) {
  return prisma.quarantine.findMany({
    where: { assetId },
    orderBy: { enteredAt: 'desc' },
  })
}

export async function getOverdueQuarantines(daysLimit = 30) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysLimit)

  return prisma.quarantine.findMany({
    where: {
      decision: null,
      enteredAt: { lte: cutoffDate },
    },
    include: { asset: true },
    orderBy: { enteredAt: 'asc' },
  })
}
