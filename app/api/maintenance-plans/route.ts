import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/rbac'
import { getMaintenancePlans } from '@/modules/maintenance-plans/services'

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'maintenance', 'view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const plans = await getMaintenancePlans()
  return NextResponse.json(plans)
}
