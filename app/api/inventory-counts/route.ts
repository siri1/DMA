import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/rbac'
import { createAuditLog } from '@/lib/audit'
import { getInventoryCounts, createInventoryCount } from '@/modules/inventory-count/services'
import { createInventoryCountSchema } from '@/modules/inventory-count/validators'

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'stocks', 'view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const counts = await getInventoryCounts()
  return NextResponse.json(counts)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'stocks', 'create')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const parsed = createInventoryCountSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
  }

  const count = await createInventoryCount(parsed.data)

  await createAuditLog({
    userId: session.user.id,
    action: 'CREATE',
    module: 'stocks',
    entityType: 'inventoryCount',
    entityId: count.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    after: count as any,
  })

  return NextResponse.json(count, { status: 201 })
}
