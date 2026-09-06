import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission, canViewCosts } from '@/lib/rbac'
import { getItemOptimization } from '@/modules/inventory/optimization'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'items', 'view') || !canViewCosts(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const optimization = await getItemOptimization(params.id)
  if (!optimization) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(optimization)
}
