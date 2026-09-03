import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/rbac'
import { createAuditLog } from '@/lib/audit'
import { decideQuarantine, getQuarantineById } from '@/modules/quarantine/services'
import { decideQuarantineSchema } from '@/modules/quarantine/validators'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'assets', 'approve')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const parsed = decideQuarantineSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Decisão inválida' }, { status: 400 })
  }

  const before = await getQuarantineById(params.id)
  if (!before) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const updated = await decideQuarantine(
    params.id,
    parsed.data,
    session.user.id,
    session.user.role
  )

  await createAuditLog({
    userId: session.user.id,
    action: 'STATE_CHANGE',
    module: 'quarantine',
    entityType: 'quarantine',
    entityId: params.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    before: before as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    after: updated as any,
  })

  return NextResponse.json(updated)
}
