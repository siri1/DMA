import { prisma } from '@/lib/prisma'

export async function getExecutiveDashboardMetrics(fromDate?: Date, toDate?: Date) {
  const startDate = fromDate || new Date(new Date().setDate(new Date().getDate() - 30))
  const endDate = toDate || new Date()

  // Assets in maintenance (current state)
  const assetsInMaintenance = await prisma.asset.count({
    where: { status: { in: ['EM_MANUTENCAO', 'EM_OPERACAO'] } },
  })

  // WorkOrders — open, closed, overdue
  const workOrders = await prisma.workOrder.findMany({
    where: { createdAt: { gte: startDate, lte: endDate } },
    select: { status: true, closedAt: true, dueAt: true, openedAt: true },
  })

  const opened = workOrders.filter((w) => !w.closedAt).length
  const closed = workOrders.filter((w) => w.closedAt).length
  const overdue = workOrders.filter(
    (w) => !w.closedAt && w.dueAt && w.dueAt < new Date()
  ).length

  // Maintenance plans — overdue
  const overdueMaintenancePlans = await prisma.maintenancePlan.count({
    where: {
      active: true,
      nextDueAt: { lt: new Date() },
    },
  })

  // Average resolution time (days)
  const resolvedOrders = workOrders
    .filter((w) => w.closedAt && w.openedAt)
    .map((w) => (w.closedAt!.getTime() - w.openedAt!.getTime()) / (1000 * 60 * 60 * 24))

  const avgResolutionTime =
    resolvedOrders.length > 0
      ? resolvedOrders.reduce((a, b) => a + b, 0) / resolvedOrders.length
      : 0

  // Stock value (sum of all items: qty × avgCost)
  const stockBalances = await prisma.stockBalance.findMany({
    select: { qty: true, item: { select: { avgCost: true } } },
  })

  const totalStockValue = stockBalances.reduce((sum, sb) => {
    const cost = Number(sb.item.avgCost || 0)
    return sum + sb.qty * cost
  }, 0)

  return {
    assetsInMaintenance,
    workOrdersOpened: opened,
    workOrdersClosed: closed,
    workOrdersOverdue: overdue,
    overdueMaintenancePlans,
    avgResolutionTime: Math.round(avgResolutionTime * 100) / 100,
    totalStockValue,
    period: { from: startDate, to: endDate },
  }
}

export async function getOperationalDashboardMetrics() {
  // Assets by state
  const assetsByState = await prisma.asset.groupBy({
    by: ['status'],
    _count: true,
  })

  // WorkOrders overdue
  const overduWOs = await prisma.workOrder.findMany({
    where: {
      status: { not: 'RESOLVIDA' },
      dueAt: { lt: new Date() },
    },
    select: { id: true, number: true, dueAt: true, summary: true, asset: { select: { assetCode: true } } },
    orderBy: { dueAt: 'asc' },
    take: 10,
  })

  // Maintenance plans overdue
  const overdueMaintenancePlans = await prisma.maintenancePlan.findMany({
    where: {
      active: true,
      nextDueAt: { lt: new Date() },
    },
    select: {
      id: true,
      nextDueAt: true,
      asset: { select: { assetCode: true, description: true } },
    },
    orderBy: { nextDueAt: 'asc' },
    take: 10,
  })

  // Items below minimum stock
  const lowStockItems = await prisma.item.findMany({
    select: {
      id: true,
      sku: true,
      description: true,
      minStock: true,
    },
  })

  const lowStockWithBalance = await Promise.all(
    lowStockItems.map(async (item) => {
      const balance = await prisma.stockBalance.aggregate({
        where: { itemId: item.id },
        _sum: { qty: true },
      })
      const currentQty = balance._sum.qty || 0
      return currentQty < item.minStock
        ? { ...item, currentQty, deficit: item.minStock - currentQty }
        : null
    })
  )

  return {
    assetsByState: Object.fromEntries(
      assetsByState.map((s) => [s.status, s._count])
    ),
    overdueWorkOrders: overduWOs,
    overdueMaintenancePlans,
    lowStockItems: lowStockWithBalance.filter(Boolean),
  }
}

export interface EquipmentStatusRow {
  workOrderId: string
  assetId: string
  assetCode: string
  description: string
  brand: string | null
  model: string | null
  summary: string
  daysOpen: number
}

export interface EquipmentStatusBoard {
  totalAssets: number
  emReparacaoCount: number
  aguardaMaterialCount: number
  availableCount: number
  oldestOpen: EquipmentStatusRow | null
  emReparacao: EquipmentStatusRow[]
  aguardaMaterial: EquipmentStatusRow[]
}

function daysSince(date: Date): number {
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)))
}

/**
 * The "equipamento mais antigo na Oficina" / "dias em aberto" board from
 * CLAUDE.md sec5.2 - never actually built until now. One open WorkOrder
 * per asset (the oldest, if an asset somehow has more than one) splits
 * assets into exactly three buckets that sum to totalAssets: aguarda
 * material, em reparação (any other open status), and available (no open
 * WorkOrder at all).
 */
export async function getEquipmentStatusBoard(): Promise<EquipmentStatusBoard> {
  const totalAssets = await prisma.asset.count()

  const openWorkOrders = await prisma.workOrder.findMany({
    where: { status: { notIn: ['RESOLVIDA', 'CANCELADA'] } },
    include: { asset: true },
    orderBy: { openedAt: 'asc' },
  })

  // Keep only the oldest open WorkOrder per asset (openWorkOrders is
  // already sorted ascending, so the first one seen per asset wins).
  const openByAsset = new Map<string, (typeof openWorkOrders)[number]>()
  for (const wo of openWorkOrders) {
    if (!openByAsset.has(wo.assetId)) openByAsset.set(wo.assetId, wo)
  }

  const toRow = (wo: (typeof openWorkOrders)[number]): EquipmentStatusRow => ({
    workOrderId: wo.id,
    assetId: wo.assetId,
    assetCode: wo.asset.assetCode,
    description: wo.asset.description,
    brand: wo.asset.brand,
    model: wo.asset.model,
    summary: wo.summary,
    daysOpen: daysSince(wo.openedAt),
  })

  const openList = [...openByAsset.values()]
  const aguardaMaterial = openList.filter((wo) => wo.status === 'AGUARDA_MATERIAL')
  const emReparacao = openList.filter((wo) => wo.status !== 'AGUARDA_MATERIAL')
  const byDaysDesc = (a: (typeof openWorkOrders)[number], b: (typeof openWorkOrders)[number]) =>
    daysSince(a.openedAt) < daysSince(b.openedAt) ? 1 : -1

  return {
    totalAssets,
    emReparacaoCount: emReparacao.length,
    aguardaMaterialCount: aguardaMaterial.length,
    availableCount: totalAssets - openByAsset.size,
    oldestOpen: openWorkOrders.length > 0 ? toRow(openWorkOrders[0]) : null,
    emReparacao: emReparacao.sort(byDaysDesc).slice(0, 6).map(toRow),
    aguardaMaterial: aguardaMaterial.sort(byDaysDesc).slice(0, 6).map(toRow),
  }
}
