import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/rbac'
import { getAssets } from '@/modules/assets/services'
import type { AssetStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!hasPermission(session.user.role as any, 'assets', 'view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') as AssetStatus | null
  const family = searchParams.get('family')

  const assets = await getAssets({
    ...(status && { status }),
    ...(family && { family }),
  })

  return NextResponse.json(assets)
}
