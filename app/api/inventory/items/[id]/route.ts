import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission, canViewCosts } from '@/lib/rbac'
import { createAuditLog } from '@/lib/audit'
import { getItemById, updateItem } from '@/modules/inventory/services'
import { updateItemSchema } from '@/modules/inventory/validators'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'items', 'view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const item = await getItemById(params.id)
  if (!item) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (canViewCosts(session.user.role)) {
    return NextResponse.json(item)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { avgCost, ...withoutCost } = item
  return NextResponse.json(withoutCost)
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'items', 'edit')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const before = await getItemById(params.id)
  if (!before) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const parsed = updateItemSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
  }

  const after = await updateItem(params.id, parsed.data)

  await createAuditLog({
    userId: session.user.id,
    action: 'UPDATE',
    module: 'items',
    entityType: 'item',
    entityId: params.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    before: before as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    after: after as any,
  })

  return NextResponse.json(after)
}
