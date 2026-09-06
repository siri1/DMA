import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission, canViewCosts } from '@/lib/rbac'
import { getPartsDashboardMetrics } from '@/modules/dashboards/parts'

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'items', 'view') || !canViewCosts(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const metrics = await getPartsDashboardMetrics()
  return NextResponse.json(metrics)
}
