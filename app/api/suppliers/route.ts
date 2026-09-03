import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/rbac'
import { createAuditLog } from '@/lib/audit'
import { getSuppliers, createSupplier } from '@/modules/suppliers/services'
import { createSupplierSchema } from '@/modules/suppliers/validators'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'suppliers', 'view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || undefined

  const suppliers = await getSuppliers(search)
  return NextResponse.json(suppliers)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'suppliers', 'create')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const parsed = createSupplierSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const supplier = await createSupplier(parsed.data)

  await createAuditLog({
    userId: session.user.id,
    action: 'CREATE',
    module: 'suppliers',
    entityType: 'supplier',
    entityId: supplier.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    after: supplier as any,
  })

  return NextResponse.json(supplier, { status: 201 })
}
