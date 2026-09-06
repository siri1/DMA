import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'

/**
 * Lightweight technician list for assigning work orders. Deliberately NOT
 * gated by 'users:view' (ADMIN-only) - anyone who can create/edit a work
 * order needs to see who they can assign it to.
 */
export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'workorders', 'create')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const technicians = await prisma.user.findMany({
    where: { role: 'OFICINA', active: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(technicians)
}
