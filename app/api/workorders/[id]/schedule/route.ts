import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/rbac'
import { createAuditLog } from '@/lib/audit'
import { getWorkOrderById } from '@/modules/workorders/services'
import { scheduleWorkOrder } from '@/modules/scheduling/services'
import { scheduleWorkOrderSchema } from '@/modules/scheduling/validators'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'workorders', 'edit')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const before = await getWorkOrderById(params.id)
  if (!before) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const parsed = scheduleWorkOrderSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
  }

  const after = await scheduleWorkOrder(params.id, parsed.data)

  await createAuditLog({
    userId: session.user.id,
    action: 'UPDATE',
    module: 'workorders',
    entityType: 'workorder',
    entityId: params.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    before: before as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    after: after as any,
  })

  return NextResponse.json(after)
}
