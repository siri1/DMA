import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/rbac'
import { createAuditLog } from '@/lib/audit'
import { getWorkOrderById } from '@/modules/workorders/services'
import { assignTechnician } from '@/modules/scheduling/services'
import { assignTechnicianSchema } from '@/modules/scheduling/validators'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'workorders', 'edit')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const before = await getWorkOrderById(params.id)
  if (!before) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const parsed = assignTechnicianSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const result = await assignTechnician(params.id, parsed.data.technicianId, parsed.data.force)

    if (!result.assigned) {
      return NextResponse.json(
        {
          error: result.absent
            ? 'Técnico está marcado como indisponível'
            : 'Técnico não tem as qualificações necessárias',
          gap: result.gap,
          absent: result.absent,
          absenceReason: result.absenceReason,
        },
        { status: 409 }
      )
    }

    await createAuditLog({
      userId: session.user.id,
      action: 'UPDATE',
      module: 'workorders',
      entityType: 'workorder',
      entityId: params.id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      before: before as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      after: result.workOrder as any,
    })

    return NextResponse.json(result.workOrder)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao atribuir técnico' },
      { status: 409 }
    )
  }
}
