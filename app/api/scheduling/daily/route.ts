import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/rbac'
import { getDailySchedule } from '@/modules/scheduling/services'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'workorders', 'view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const dateParam = req.nextUrl.searchParams.get('date')
  const date = dateParam ? new Date(`${dateParam}T00:00:00`) : new Date()
  if (isNaN(date.getTime())) {
    return NextResponse.json({ error: 'Data inválida' }, { status: 400 })
  }

  const schedule = await getDailySchedule(date)
  return NextResponse.json(schedule)
}
