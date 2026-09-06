import { prisma } from '@/lib/prisma'
import type { CreateInterventionInput, UpdateInterventionInput, StopInterventionInput } from './validators'

export async function createIntervention(data: CreateInterventionInput) {
  const active = await prisma.intervention.findFirst({
    where: { technicianId: data.technicianId, endedAt: null },
  })
  if (active) {
    throw new Error('Já tem uma intervenção em curso. Termine-a antes de iniciar outra.')
  }

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

/** The technician's currently running (not yet ended) intervention on this
 * work order, if any - used to render the live clock UI. */
export async function getActiveIntervention(workOrderId: string, technicianId: string) {
  return prisma.intervention.findFirst({
    where: { workOrderId, technicianId, endedAt: null },
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

/**
 * Clocks out a running intervention: stamps endedAt, derives laborMinutes
 * from the actual startedAt/endedAt gap (rather than trusting a manually
 * typed number), and - when the technician has an hourlyRate set - computes
 * laborCost at that rate. The rate is read at clock-out time and the cost
 * stored on the row, so a later rate change never rewrites historical costs.
 */
export async function stopIntervention(id: string, data: StopInterventionInput) {
  const intervention = await prisma.intervention.findUnique({
    where: { id },
    include: { technician: true },
  })
  if (!intervention) throw new Error('Intervenção não encontrada')
  if (intervention.endedAt) throw new Error('Esta intervenção já foi terminada')
  if (!intervention.startedAt) throw new Error('Intervenção sem hora de início registada')

  const endedAt = new Date()
  const laborMinutes = Math.max(
    1,
    Math.round((endedAt.getTime() - intervention.startedAt.getTime()) / 60000)
  )
  const rate = intervention.technician.hourlyRate
  const laborCost = rate ? Math.round((laborMinutes / 60) * Number(rate) * 100) / 100 : null

  return prisma.intervention.update({
    where: { id },
    data: {
      endedAt,
      laborMinutes,
      laborCost,
      diagnosis: data.diagnosis,
      activities: data.activities,
      result: data.result,
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
