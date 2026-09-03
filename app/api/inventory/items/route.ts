import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission, canViewCosts } from '@/lib/rbac'
import { createAuditLog } from '@/lib/audit'
import { getItems, createItem } from '@/modules/inventory/services'
import { createItemSchema } from '@/modules/inventory/validators'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'items', 'view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')

  const items = await getItems(search || undefined)

  if (canViewCosts(session.user.role)) {
    return NextResponse.json(items)
  }

  return NextResponse.json(
    items.map((i) => ({
      id: i.id,
      sku: i.sku,
      description: i.description,
      brand: i.brand,
      unit: i.unit,
      minStock: i.minStock,
      maxStock: i.maxStock,
      barcode: i.barcode,
      active: i.active,
    }))
  )
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'items', 'create')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const parsed = createItemSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
  }

  const item = await createItem(parsed.data)

  await createAuditLog({
    userId: session.user.id,
    action: 'CREATE',
    module: 'items',
    entityType: 'item',
    entityId: item.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    after: item as any,
  })

  return NextResponse.json(item, { status: 201 })
}
