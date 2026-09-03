import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/rbac'
import { createAuditLog } from '@/lib/audit'
import { getQuarantines, enterQuarantine } from '@/modules/quarantine/services'
import { enterQuarantineSchema } from '@/modules/quarantine/validators'

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'assets', 'view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json(await getQuarantines())
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'assets', 'edit')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const parsed = enterQuarantineSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const quarantine = await enterQuarantine(parsed.data, session.user.id, session.user.role)

  await createAuditLog({
    userId: session.user.id,
    action: 'CREATE',
    module: 'quarantine',
    entityType: 'quarantine',
    entityId: quarantine.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    after: quarantine as any,
  })

  return NextResponse.json(quarantine, { status: 201 })
}
