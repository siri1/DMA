import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/rbac'
import { getInterventionsByWorkOrder } from '@/modules/interventions/services'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'interventions', 'view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const interventions = await getInterventionsByWorkOrder(params.id)
  return NextResponse.json(interventions)
}
