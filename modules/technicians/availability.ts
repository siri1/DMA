import { prisma } from '@/lib/prisma'

export function toDateOnly(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export async function markAbsent(
  technicianId: string,
  date: Date,
  reason: string | undefined,
  recordedById: string
) {
  const day = toDateOnly(date)
  return prisma.technicianAbsence.upsert({
    where: { technicianId_date: { technicianId, date: day } },
    create: { technicianId, date: day, reason, recordedById },
    update: { reason, recordedById },
  })
}

export async function markAvailable(technicianId: string, date: Date) {
  const day = toDateOnly(date)
  await prisma.technicianAbsence.deleteMany({ where: { technicianId, date: day } })
}

export async function getAbsencesForDate(date: Date) {
  const day = toDateOnly(date)
  return prisma.technicianAbsence.findMany({ where: { date: day } })
}
