import { prisma } from '@/lib/prisma'
import type { ScheduleWorkOrderInput } from './validators'

/**
 * Technicians without a listed qualification are assumed unqualified for
 * anything the work order explicitly requires — an empty requiredQualifications
 * list on the work order means "anyone can do this", not "no one".
 * Pure so it's unit-testable without the database.
 */
export function getQualificationGap(required: string[], has: string[]): string[] {
  const hasSet = new Set(has.map((q) => q.toLowerCase()))
  return required.filter((q) => !hasSet.has(q.toLowerCase()))
}

export async function scheduleWorkOrder(id: string, data: ScheduleWorkOrderInput) {
  return prisma.workOrder.update({
    where: { id },
    data: {
      scheduledStart: data.scheduledStart,
      estimatedDurationMinutes: data.estimatedDurationMinutes,
      requiredQualifications: data.requiredQualifications,
    },
    include: { asset: true, assignedTo: true },
  })
}

export interface AssignTechnicianResult {
  assigned: boolean
  gap: string[]
  workOrder?: Awaited<ReturnType<typeof prisma.workOrder.update>>
}

export async function assignTechnician(
  workOrderId: string,
  technicianId: string,
  force = false
): Promise<AssignTechnicianResult> {
  const [workOrder, technician] = await Promise.all([
    prisma.workOrder.findUnique({ where: { id: workOrderId } }),
    prisma.user.findUnique({ where: { id: technicianId } }),
  ])

  if (!workOrder) throw new Error('OT não encontrada')
  if (!technician || technician.role !== 'OFICINA' || !technician.active) {
    throw new Error('Técnico inválido ou inactivo')
  }

  const gap = getQualificationGap(workOrder.requiredQualifications, technician.qualifications)

  if (gap.length > 0 && !force) {
    return { assigned: false, gap }
  }

  const updated = await prisma.workOrder.update({
    where: { id: workOrderId },
    data: { assignedToId: technicianId },
    include: { asset: true, assignedTo: true },
  })

  return { assigned: true, gap, workOrder: updated }
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfDay(date: Date): Date {
  const d = startOfDay(date)
  d.setDate(d.getDate() + 1)
  return d
}

export interface DailyScheduleTechnician {
  id: string
  name: string
  qualifications: string[]
  activeIntervention: { workOrderId: string; workOrderNumber: string; startedAt: Date } | null
  scheduledMinutesToday: number
  scheduledCount: number
}

export async function getDailySchedule(date: Date) {
  const start = startOfDay(date)
  const end = endOfDay(date)

  const scheduled = await prisma.workOrder.findMany({
    where: { scheduledStart: { gte: start, lt: end } },
    include: {
      asset: true,
      assignedTo: true,
      requisitions: { include: { lines: { include: { item: true } } } },
    },
    orderBy: { scheduledStart: 'asc' },
  })

  const unscheduled = await prisma.workOrder.findMany({
    where: {
      scheduledStart: null,
      status: { notIn: ['RESOLVIDA', 'CANCELADA'] },
    },
    include: { asset: true, assignedTo: true },
    orderBy: [{ priority: 'asc' }, { openedAt: 'asc' }],
    take: 25,
  })

  const technicianUsers = await prisma.user.findMany({
    where: { role: 'OFICINA', active: true },
    orderBy: { name: 'asc' },
  })

  const activeInterventions = await prisma.intervention.findMany({
    where: { technicianId: { in: technicianUsers.map((t) => t.id) }, endedAt: null },
    include: { workOrder: { select: { number: true } } },
  })
  const activeByTechnician = new Map(activeInterventions.map((i) => [i.technicianId, i]))

  const technicians: DailyScheduleTechnician[] = technicianUsers.map((tech) => {
    const todaysWorkOrders = scheduled.filter((wo) => wo.assignedToId === tech.id)
    const active = activeByTechnician.get(tech.id)

    return {
      id: tech.id,
      name: tech.name,
      qualifications: tech.qualifications,
      activeIntervention: active
        ? {
            workOrderId: active.workOrderId,
            workOrderNumber: active.workOrder.number,
            startedAt: active.startedAt as Date,
          }
        : null,
      scheduledMinutesToday: todaysWorkOrders.reduce(
        (sum, wo) => sum + (wo.estimatedDurationMinutes || 0),
        0
      ),
      scheduledCount: todaysWorkOrders.length,
    }
  })

  return { scheduled, unscheduled, technicians }
}
