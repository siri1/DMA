import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/rbac'
import { createAuditLog } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { createRequisition } from '@/modules/requisitions/services'
import { createRequisitionSchema } from '@/modules/requisitions/validators'

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'requisitions', 'view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const requisitions = await prisma.requisition.findMany({
    include: {
      workOrder: { select: { number: true, summary: true, status: true } },
      lines: { include: { item: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(requisitions)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'requisitions', 'create')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const parsed = createRequisitionSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const requisition = await createRequisition(parsed.data, session.user.id, session.user.role)
  if (!requisition) {
    return NextResponse.json({ error: 'Erro ao criar requisição' }, { status: 500 })
  }

  await createAuditLog({
    userId: session.user.id,
    action: 'CREATE',
    module: 'requisitions',
    entityType: 'requisition',
    entityId: requisition.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    after: requisition as any,
  })

  return NextResponse.json(requisition, { status: 201 })
}
