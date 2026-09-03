import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission, canViewCosts } from '@/lib/rbac'
import { getItemById } from '@/modules/inventory/services'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'items', 'view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const item = await getItemById(params.id)
  if (!item) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (canViewCosts(session.user.role)) {
    return NextResponse.json(item)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { avgCost, ...withoutCost } = item
  return NextResponse.json(withoutCost)
}
