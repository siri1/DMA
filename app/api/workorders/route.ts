import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/rbac'
import { getWorkOrders } from '@/modules/workorders/services'
import type { WorkOrderStatus, WorkOrderPriority } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'workorders', 'view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') as WorkOrderStatus | null
  const priority = searchParams.get('priority') as WorkOrderPriority | null

  const workOrders = await getWorkOrders({
    ...(status && { status }),
    ...(priority && { priority }),
  })

  return NextResponse.json(workOrders)
}
