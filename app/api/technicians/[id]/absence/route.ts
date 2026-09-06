import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/rbac'
import { createAuditLog } from '@/lib/audit'
import { markAbsent, markAvailable } from '@/modules/technicians/availability'
import { markAbsentSchema, markAvailableSchema } from '@/modules/technicians/validators'

/**
 * Uses the 'workorders' edit permission (same actors who assign/schedule
 * work) rather than 'users' - marking someone absent is a scheduling
 * action, not a user-account change.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'workorders', 'edit')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const parsed = markAbsentSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
  }

  const absence = await markAbsent(params.id, parsed.data.date, parsed.data.reason, session.user.id)

  await createAuditLog({
    userId: session.user.id,
    action: 'CREATE',
    module: 'workorders',
    entityType: 'technician_absence',
    entityId: params.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    after: absence as any,
  })

  return NextResponse.json(absence, { status: 201 })
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'workorders', 'edit')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const parsed = markAvailableSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
  }

  await markAvailable(params.id, parsed.data.date)

  await createAuditLog({
    userId: session.user.id,
    action: 'DELETE',
    module: 'workorders',
    entityType: 'technician_absence',
    entityId: params.id,
  })

  return NextResponse.json({ ok: true })
}
