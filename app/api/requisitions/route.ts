import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'requisitions', 'view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const requisitions = await prisma.requisition.findMany({
    include: {
      workOrder: { select: { number: true, summary: true, status: true } },
      lines: { include: { item: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(requisitions)
}
