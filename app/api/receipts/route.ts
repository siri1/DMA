import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/rbac'
import { createAuditLog } from '@/lib/audit'
import { getReceipts, createReceipt } from '@/modules/receipts/services'
import { createReceiptSchema } from '@/modules/receipts/validators'

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'stocks', 'view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json(await getReceipts())
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

  const parsed = createReceiptSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const receipt = await createReceipt(parsed.data, session.user.id)

  await createAuditLog({
    userId: session.user.id,
    action: 'CREATE',
    module: 'inventory',
    entityType: 'receipt',
    entityId: receipt!.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    after: receipt as any,
  })

  return NextResponse.json(receipt, { status: 201 })
}
