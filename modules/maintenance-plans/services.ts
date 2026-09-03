import { prisma } from '@/lib/prisma'
import { WorkOrderOrigin, WorkOrderPriority, WorkOrderStatus } from '@prisma/client'
import type { CreateMaintenancePlanInput, UpdateMaintenancePlanInput } from './validators'

export async function createMaintenancePlan(input: CreateMaintenancePlanInput) {
  return prisma.maintenancePlan.create({
    data: {
      assetId: input.assetId,
      family: input.family,
      type: input.type,
      periodicityDays: input.periodicityDays,
      nextDueAt: input.nextDueAt,
      active: input.active,
    },
    include: { asset: { select: { description: true, assetCode: true } } },
  })
}

export async function getMaintenancePlanById(id: string) {
  return prisma.maintenancePlan.findUnique({
    where: { id },
    include: {
      asset: { select: { description: true, assetCode: true, family: true } },
    },
  })
}

export async function getMaintenancePlans(filters?: { assetId?: string; active?: boolean }) {
  return prisma.maintenancePlan.findMany({
    where: {
      ...(filters?.assetId && { assetId: filters.assetId }),
      ...(filters?.active !== undefined && { active: filters.active }),
    },
    include: { asset: { select: { description: true, assetCode: true } } },
    orderBy: { nextDueAt: 'asc' },
  })
}

export async function updateMaintenancePlan(id: string, input: UpdateMaintenancePlanInput) {
  return prisma.maintenancePlan.update({
    where: { id },
    data: {
      ...(input.type && { type: input.type }),
      ...(input.periodicityDays && { periodicityDays: input.periodicityDays }),
      ...(input.nextDueAt && { nextDueAt: input.nextDueAt }),
      ...(input.active !== undefined && { active: input.active }),
    },
    include: { asset: { select: { description: true, assetCode: true } } },
  })
}

export async function deleteMaintenancePlan(id: string) {
  return prisma.maintenancePlan.delete({
    where: { id },
  })
}

export async function generateOverdueWorkOrders() {
  const now = new Date()

  const overduePlans = await prisma.maintenancePlan.findMany({
    where: {
      active: true,
      nextDueAt: { lte: now },
    },
    include: { asset: true },
  })

  const createdWorkOrders = await Promise.all(
    overduePlans.map(async (plan) => {
      if (!plan.assetId || !plan.asset) return null

      const wo = await prisma.workOrder.create({
        data: {
          number: `OT-${now.getFullYear()}-${Math.floor(Math.random() * 10000)}`,
          assetId: plan.assetId,
          origin: WorkOrderOrigin.PLANO,
          priority: WorkOrderPriority.MEDIA,
          status: WorkOrderStatus.ABERTA,
          openedAt: now,
          dueAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          summary: `Manutenção ${plan.type} programada — ${plan.asset.description}`,
        },
      })

      // Atualizar próxima data
      await prisma.maintenancePlan.update({
        where: { id: plan.id },
        data: { nextDueAt: new Date(now.getTime() + plan.periodicityDays * 24 * 60 * 60 * 1000) },
      })

      return wo
    })
  )

  return createdWorkOrders.filter((wo) => wo !== null)
}

export async function getOverduePlans() {
  return prisma.maintenancePlan.findMany({
    where: {
      active: true,
      nextDueAt: { lte: new Date() },
    },
    include: { asset: { select: { description: true, assetCode: true } } },
    orderBy: { nextDueAt: 'asc' },
  })
}

export async function getUpcomingPlans(daysAhead = 30) {
  const now = new Date()
  const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)

  return prisma.maintenancePlan.findMany({
    where: {
      active: true,
      nextDueAt: { gte: now, lte: future },
    },
    include: { asset: { select: { description: true, assetCode: true } } },
    orderBy: { nextDueAt: 'asc' },
  })
}
