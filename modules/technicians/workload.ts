import { prisma } from '@/lib/prisma'

/**
 * No shift/roster length was specified by the client, so a standard
 * Mon-Fri, 8h/day week is assumed here purely for utilization comparison
 * (not for payroll). Documented as provisional in docs/ASSUMPTIONS.md 4.6.
 */
export const STANDARD_SHIFT_HOURS = 8
export const WEEKLY_TARGET_HOURS = STANDARD_SHIFT_HOURS * 5

export function startOfWeek(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay() // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day // back up to Monday
  d.setDate(d.getDate() + diff)
  return d
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export interface DailyHours {
  date: string
  label: string
  minutes: number
}

export interface TechnicianWorkload {
  technicianId: string
  name: string
  hourlyRate: number | null
  weekStart: string
  dailyHours: DailyHours[]
  totalMinutes: number
  totalHours: number
  targetHours: number
  utilizationPercent: number
  isOvertime: boolean
  interventionCount: number
  avgDurationMinutes: number
  totalLaborCost: number | null
}

/**
 * Computes real utilization from completed Intervention rows (laborMinutes,
 * stamped at clock-out) - no separate attendance/workload table needed.
 * `includeCost` should be false for viewers who can't see costs (canViewCosts).
 */
export async function getWorkloadForWeek(weekOf: Date, includeCost: boolean): Promise<TechnicianWorkload[]> {
  const weekStart = startOfWeek(weekOf)
  const weekEnd = addDays(weekStart, 7)

  const technicians = await prisma.user.findMany({
    where: { role: 'OFICINA', active: true },
    orderBy: { name: 'asc' },
  })

  const interventions = await prisma.intervention.findMany({
    where: {
      technicianId: { in: technicians.map((t) => t.id) },
      endedAt: { gte: weekStart, lt: weekEnd },
      laborMinutes: { not: null },
    },
    select: { technicianId: true, endedAt: true, laborMinutes: true, laborCost: true },
  })

  return technicians.map((tech) => {
    const own = interventions.filter((i) => i.technicianId === tech.id)

    const dailyHours: DailyHours[] = Array.from({ length: 7 }, (_, i) => {
      const day = addDays(weekStart, i)
      const dayStr = day.toISOString().slice(0, 10)
      const minutes = own
        .filter((iv) => iv.endedAt && iv.endedAt.toISOString().slice(0, 10) === dayStr)
        .reduce((sum, iv) => sum + (iv.laborMinutes || 0), 0)
      return { date: dayStr, label: DAY_LABELS[day.getDay()], minutes }
    })

    const totalMinutes = own.reduce((sum, iv) => sum + (iv.laborMinutes || 0), 0)
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10
    const utilizationPercent = Math.round((totalHours / WEEKLY_TARGET_HOURS) * 1000) / 10
    const totalLaborCost = includeCost
      ? own.reduce((sum, iv) => sum + Number(iv.laborCost || 0), 0)
      : null

    return {
      technicianId: tech.id,
      name: tech.name,
      hourlyRate: includeCost && tech.hourlyRate !== null ? Number(tech.hourlyRate) : null,
      weekStart: weekStart.toISOString().slice(0, 10),
      dailyHours,
      totalMinutes,
      totalHours,
      targetHours: WEEKLY_TARGET_HOURS,
      utilizationPercent,
      isOvertime: totalHours > WEEKLY_TARGET_HOURS,
      interventionCount: own.length,
      avgDurationMinutes: own.length > 0 ? Math.round(totalMinutes / own.length) : 0,
      totalLaborCost,
    }
  })
}
