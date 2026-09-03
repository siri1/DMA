import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/rbac'
import { createAuditLog } from '@/lib/audit'
import { getPurchaseOrders, createPurchaseOrder } from '@/modules/purchase-orders/services'
import { createPurchaseOrderSchema } from '@/modules/purchase-orders/validators'

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'purchaseOrders', 'view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const orders = await getPurchaseOrders()
  return NextResponse.json(orders)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'purchaseOrders', 'create')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const parsed = createPurchaseOrderSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
  }

  const order = await createPurchaseOrder(parsed.data)

  await createAuditLog({
    userId: session.user.id,
    action: 'CREATE',
    module: 'purchaseOrders',
    entityType: 'purchaseOrder',
    entityId: order.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    after: order as any,
  })

  return NextResponse.json(order, { status: 201 })
}
