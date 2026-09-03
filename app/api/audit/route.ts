import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/rbac'
import { getAuditLogs, exportAuditLogs } from '@/modules/audit/services'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'audit', 'view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId') || undefined
  const moduleFilter = searchParams.get('module') || undefined
  const entityType = searchParams.get('entityType') || undefined
  const action = searchParams.get('action') || undefined
  const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined
  const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined
  const limit = parseInt(searchParams.get('limit') || '100')
  const offset = parseInt(searchParams.get('offset') || '0')
  const format = searchParams.get('format')

  const filter = {
    userId,
    module: moduleFilter,
    entityType,
    action,
    fromDate: from,
    toDate: to,
    limit: Math.min(limit, 1000),
    offset,
  }

  if (format === 'csv' || format === 'xlsx') {
    const logs = await exportAuditLogs(filter)
    const csvRows = logs.map((l) => [
      new Date(l.createdAt).toLocaleString('pt-PT', { timeZone: 'Africa/Luanda' }),
      l.user?.name || l.userId,
      l.action,
      l.module,
      `${l.entityType}:${l.entityId}`,
      `${l.before ? 'before=' + JSON.stringify(l.before).slice(0, 50) : ''}${l.after ? ' after=' + JSON.stringify(l.after).slice(0, 50) : ''}`,
    ])

    const headers = ['Timestamp', 'Utilizador', 'Acção', 'Módulo', 'Entidade', 'Detalhes']
    const csv = [headers, ...csvRows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="audit-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  }

  const { logs, total } = await getAuditLogs(filter)
  return NextResponse.json({ logs, total, limit, offset })
}
