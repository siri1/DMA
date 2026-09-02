import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const [assetCount, workOrderCount, itemCount] = await Promise.all([
      prisma.asset.count(),
      prisma.workOrder.count(),
      prisma.item.count(),
    ])

    const openWorkOrders = await prisma.workOrder.count({
      where: { status: { not: 'RESOLVIDA' } },
    })

    return NextResponse.json({
      assets: assetCount,
      workOrders: workOrderCount,
      openWorkOrders,
      items: itemCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
