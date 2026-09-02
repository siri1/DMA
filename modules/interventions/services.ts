import { prisma } from '@/lib/prisma'
import type { CreateInterventionInput, UpdateInterventionInput } from './validators'

export async function createIntervention(data: CreateInterventionInput) {
  return prisma.intervention.create({
    data: {
      ...data,
      startedAt: new Date(),
    },
    include: {
      workOrder: true,
      technician: true,
    },
  })
}

export async function getInterventionById(id: string) {
  return prisma.intervention.findUnique({
    where: { id },
    include: {
      workOrder: true,
      technician: true,
    },
  })
}

export async function getInterventionsByWorkOrder(workOrderId: string) {
  return prisma.intervention.findMany({
    where: { workOrderId },
    include: {
      technician: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function updateIntervention(id: string, data: UpdateInterventionInput) {
  return prisma.intervention.update({
    where: { id },
    data: {
      ...data,
      endedAt: data.result ? new Date() : undefined,
    },
    include: {
      workOrder: true,
      technician: true,
    },
  })
}

export async function getAverageLaborTime(workOrderId: string) {
  const interventions = await prisma.intervention.findMany({
    where: {
      workOrderId,
      laborMinutes: { not: null },
    },
    select: { laborMinutes: true },
  })

  if (interventions.length === 0) return 0

  const total = interventions.reduce((sum, i) => sum + (i.laborMinutes || 0), 0)
  return Math.round(total / interventions.length)
}
