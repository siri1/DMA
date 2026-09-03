import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/rbac'
import { createAuditLog } from '@/lib/audit'
import { getUsers, createUser } from '@/modules/users/services'
import { createUserSchema } from '@/modules/users/validators'

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'users', 'view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const users = await getUsers()
  return NextResponse.json(users)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'users', 'create')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const parsed = createUserSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const user = await createUser(parsed.data)

  await createAuditLog({
    userId: session.user.id,
    action: 'CREATE',
    module: 'users',
    entityType: 'user',
    entityId: user.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    after: user as any,
  })

  return NextResponse.json(user, { status: 201 })
}
