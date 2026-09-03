import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/rbac'
import { createAuditLog } from '@/lib/audit'
import { getInventoryCountById, completeInventoryCount } from '@/modules/inventory-count/services'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'stocks', 'view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const count = await getInventoryCountById(params.id)
  if (!count) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(count)
}

export async function PATCH(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'stocks', 'approve')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const before = await getInventoryCountById(params.id)
  if (!before) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (before.status === 'CONCLUIDA') {
    return NextResponse.json({ error: 'Contagem já concluída' }, { status: 409 })
  }

  const count = await completeInventoryCount(params.id, session.user.id)

  await createAuditLog({
    userId: session.user.id,
    action: 'STATE_CHANGE',
    module: 'stocks',
    entityType: 'inventoryCount',
    entityId: params.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    before: before as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    after: count as any,
  })

  return NextResponse.json(count)
}
