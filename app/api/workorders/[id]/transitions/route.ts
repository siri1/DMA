import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/rbac'
import { getAvailableTransitions } from '@/lib/state-machine'
import { getWorkOrderById } from '@/modules/workorders/services'

/** Which state changes the current user may make from this WO's current
 * state - drives the "Mudar Estado" panel without duplicating the
 * transition table in the client. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'workorders', 'view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const workOrder = await getWorkOrderById(params.id)
  if (!workOrder) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transitions = getAvailableTransitions('workorder', workOrder.status, session.user.role as any)
  return NextResponse.json(transitions)
}
