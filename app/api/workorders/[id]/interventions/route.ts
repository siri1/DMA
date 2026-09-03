import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/rbac'
import { createAuditLog } from '@/lib/audit'
import { getInterventionsByWorkOrder, createIntervention } from '@/modules/interventions/services'
import { createInterventionSchema } from '@/modules/interventions/validators'

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

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'interventions', 'create')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = createInterventionSchema.safeParse({
    ...body,
    workOrderId: params.id,
  })
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
  }

  const intervention = await createIntervention(parsed.data)

  await createAuditLog({
    userId: session.user.id,
    action: 'CREATE',
    module: 'interventions',
    entityType: 'intervention',
    entityId: intervention.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    after: intervention as any,
  })

  return NextResponse.json(intervention, { status: 201 })
}
