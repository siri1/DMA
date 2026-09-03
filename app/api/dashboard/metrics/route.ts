import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/rbac'
import { getExecutiveDashboardMetrics, getOperationalDashboardMetrics } from '@/modules/dashboards/services'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'workorders', 'view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'executive'
  const fromDate = searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined
  const toDate = searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined

  try {
    const metrics =
      type === 'operational'
        ? await getOperationalDashboardMetrics()
        : await getExecutiveDashboardMetrics(fromDate, toDate)

    return NextResponse.json(metrics)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao carregar métricas' }, { status: 500 })
  }
}
