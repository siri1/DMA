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
