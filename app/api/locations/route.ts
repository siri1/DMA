import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/rbac'
import { createAuditLog } from '@/lib/audit'
import { getLocations, createLocation } from '@/modules/locations/services'
import { createLocationSchema } from '@/modules/locations/validators'

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'stocks', 'view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const locations = await getLocations()
  return NextResponse.json(locations)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!hasPermission(session.user.role as any, 'stocks', 'create')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const parsed = createLocationSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const location = await createLocation(parsed.data)

  await createAuditLog({
    userId: session.user.id,
    action: 'CREATE',
    module: 'stocks',
    entityType: 'location',
    entityId: location.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    after: location as any,
  })

  return NextResponse.json(location, { status: 201 })
}
