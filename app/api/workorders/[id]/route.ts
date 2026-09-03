import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/rbac'
import { createAuditLog } from '@/lib/audit'
import { getWorkOrderById, updateWorkOrder } from '@/modules/workorders/services'
import { updateWorkOrderSchema } from '@/modules/workorders/validators'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'workorders', 'view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const workOrder = await getWorkOrderById(params.id)
  if (!workOrder) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(workOrder)
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'workorders', 'edit')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const parsed = updateWorkOrderSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const before = await getWorkOrderById(params.id)
  if (!before) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const workOrder = await updateWorkOrder(params.id, parsed.data)

  await createAuditLog({
    userId: session.user.id,
    action: 'UPDATE',
    module: 'workorders',
    entityType: 'workorder',
    entityId: params.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    before: before as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    after: workOrder as any,
  })

  return NextResponse.json(workOrder)
}
