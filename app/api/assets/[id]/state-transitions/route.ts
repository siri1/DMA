import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/rbac'
import { getStateTransitionHistory } from '@/modules/states/services'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'assets', 'view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const transitions = await getStateTransitionHistory('asset', params.id)

  return NextResponse.json(transitions)
}
