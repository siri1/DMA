import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/rbac'
import { createAuditLog } from '@/lib/audit'
import { getUserById, updateUser, resetPassword, deactivateUser } from '@/modules/users/services'
import { updateUserSchema, resetPasswordSchema } from '@/modules/users/validators'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'users', 'view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const user = await getUserById(params.id)
  if (!user) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(user)
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'users', 'edit')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()

  // Handle password reset separately
  if (body.newPassword) {
    const parsed = resetPasswordSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }
    await resetPassword(params.id, parsed.data)
    await createAuditLog({
      userId: session.user.id,
      action: 'UPDATE',
      module: 'users',
      entityType: 'user',
      entityId: params.id,
    })
    return NextResponse.json({ ok: true })
  }

  // Handle deactivation
  if (body.deactivate) {
    const before = await getUserById(params.id)
    const after = await deactivateUser(params.id)
    await createAuditLog({
      userId: session.user.id,
      action: 'UPDATE',
      module: 'users',
      entityType: 'user',
      entityId: params.id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      before: before as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      after: after as any,
    })
    return NextResponse.json(after)
  }

  // Handle regular update
  const parsed = updateUserSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const before = await getUserById(params.id)
  const after = await updateUser(params.id, parsed.data)

  await createAuditLog({
    userId: session.user.id,
    action: 'UPDATE',
    module: 'users',
    entityType: 'user',
    entityId: params.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    before: before as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    after: after as any,
  })

  return NextResponse.json(after)
}
