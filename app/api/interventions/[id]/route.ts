import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/rbac'
import { createAuditLog } from '@/lib/audit'
import { getInterventionById, stopIntervention } from '@/modules/interventions/services'
import { stopInterventionSchema } from '@/modules/interventions/validators'

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'interventions', 'edit')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const before = await getInterventionById(params.id)
  if (!before) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Only the technician who started it (or an admin) can clock it out.
  if (before.technicianId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const parsed = stopInterventionSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  try {
    const intervention = await stopIntervention(params.id, parsed.data)

    await createAuditLog({
      userId: session.user.id,
      action: 'UPDATE',
      module: 'interventions',
      entityType: 'intervention',
      entityId: params.id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      before: before as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      after: intervention as any,
    })

    return NextResponse.json(intervention)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao terminar intervenção' },
      { status: 409 }
    )
  }
}
