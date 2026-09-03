import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/rbac'
import { createAuditLog } from '@/lib/audit'
import { getRequisitionById, deliverRequisition } from '@/modules/requisitions/services'
import { deliverRequisitionSchema } from '@/modules/requisitions/validators'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'requisitions', 'view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const requisition = await getRequisitionById(params.id)
  if (!requisition) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(requisition)
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'requisitions', 'approve')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const parsed = deliverRequisitionSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Acção inválida' }, { status: 400 })
  }

  const before = await getRequisitionById(params.id)
  if (!before) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (before.status === 'ENTREGUE') {
    return NextResponse.json({ error: 'Requisição já entregue' }, { status: 409 })
  }

  await deliverRequisition(params.id, session.user.id, session.user.role)
  const after = await getRequisitionById(params.id)

  await createAuditLog({
    userId: session.user.id,
    action: 'STATE_CHANGE',
    module: 'requisitions',
    entityType: 'requisition',
    entityId: params.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    before: before as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    after: after as any,
  })

  return NextResponse.json(after)
}
