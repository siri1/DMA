import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/rbac'
import { getAssetById } from '@/modules/assets/services'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!hasPermission(session.user.role as any, 'assets', 'view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const asset = await getAssetById(params.id)

  if (!asset) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(asset)
}
