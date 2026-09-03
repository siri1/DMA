import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/rbac'
import { createAuditLog } from '@/lib/audit'
import { getPurchaseOrderById, updatePurchaseOrderStatus } from '@/modules/purchase-orders/services'
import { updatePurchaseOrderStatusSchema } from '@/modules/purchase-orders/validators'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'purchaseOrders', 'view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const order = await getPurchaseOrderById(params.id)
  if (!order) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(order)
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
  if (!hasPermission(session.user.role as any, 'purchaseOrders', 'approve')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const parsed = updatePurchaseOrderStatusSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
  }

  const before = await getPurchaseOrderById(params.id)
  if (!before) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const order = await updatePurchaseOrderStatus(params.id, parsed.data)

  await createAuditLog({
    userId: session.user.id,
    action: 'STATE_CHANGE',
    module: 'purchaseOrders',
    entityType: 'purchaseOrder',
    entityId: params.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    before: before as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    after: order as any,
  })

  return NextResponse.json(order)
}
