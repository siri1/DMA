import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission, canViewCosts } from '@/lib/rbac'
import { getItems } from '@/modules/inventory/services'

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
