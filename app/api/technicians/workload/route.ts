import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission, canViewCosts } from '@/lib/rbac'
import { getWorkloadForWeek } from '@/modules/technicians/workload'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'interventions', 'view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const weekParam = req.nextUrl.searchParams.get('week')
  const weekOf = weekParam ? new Date(`${weekParam}T00:00:00`) : new Date()
  if (isNaN(weekOf.getTime())) {
    return NextResponse.json({ error: 'Data inválida' }, { status: 400 })
  }

  const workload = await getWorkloadForWeek(weekOf, canViewCosts(session.user.role))
  return NextResponse.json(workload)
}
