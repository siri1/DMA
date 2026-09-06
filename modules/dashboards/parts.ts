import { prisma } from '@/lib/prisma'
import { getInventoryOptimizationSummary } from '@/modules/inventory/optimization'

const ACTIONABLE_REQUISITION_STATUSES = ['PENDENTE', 'AGUARDA_MATERIAL', 'RESERVADA'] as const
const OPEN_PO_STATUSES = ['RASCUNHO', 'ENVIADA', 'PARCIAL'] as const

export interface LowStockRow {
  id: string
  sku: string
  description: string
  currentQty: number
  minStock: number
  deficit: number
}

export interface PendingRequisitionRow {
  id: string
  status: string
  createdAt: Date
  workOrderNumber: string
  lineCount: number
}

export interface OpenPurchaseOrderRow {
  id: string
  status: string
  createdAt: Date
  supplierName: string
  lineCount: number
  totalValue: number
}

export interface RecentMovementRow {
  id: string
  type: string
  qty: number
  createdAt: Date
  itemSku: string
  itemDescription: string
}

export interface PartsDashboardMetrics {
  totalInventoryValue: number
  slowMovingValue: number
  deadStockValue: number
  lowStockCount: number
  outOfStockCount: number
  actionableRequisitionsCount: number
  draftPurchaseOrdersCount: number
  sentPurchaseOrdersCount: number
  partialReceiptsCount: number
  activeSuppliersCount: number
  lowStockItems: LowStockRow[]
  pendingRequisitions: PendingRequisitionRow[]
  openPurchaseOrders: OpenPurchaseOrderRow[]
  recentMovements: RecentMovementRow[]
}

/**
 * One aggregation for the Parts Manager's landing dashboard. Reuses the
 * existing inventory-optimization summary for value/slow-moving/dead-stock
 * figures rather than recomputing them, and otherwise sticks to counts and
 * short "needs attention" lists - no supplier scoring or cost-forecasting,
 * since neither has the underlying data (see docs/ASSUMPTIONS.md).
 */
export async function getPartsDashboardMetrics(): Promise<PartsDashboardMetrics> {
  const [
    optimization,
    lowStockItemsRaw,
    actionableRequisitionsCount,
    pendingRequisitionsRaw,
    draftPurchaseOrdersCount,
    sentPurchaseOrdersCount,
    partialReceiptsCount,
    activeSuppliersCount,
    openPurchaseOrdersRaw,
    recentMovementsRaw,
  ] = await Promise.all([
    getInventoryOptimizationSummary(),
    prisma.item.findMany({
      where: { active: true },
      include: { stockBalances: { where: { qty: { gt: 0 } } } },
    }),
    prisma.requisition.count({ where: { status: { in: [...ACTIONABLE_REQUISITION_STATUSES] } } }),
    prisma.requisition.findMany({
      where: { status: { in: [...ACTIONABLE_REQUISITION_STATUSES] } },
      include: { workOrder: { select: { number: true } }, lines: true },
      orderBy: { createdAt: 'asc' },
      take: 8,
    }),
    prisma.purchaseOrder.count({ where: { status: 'RASCUNHO' } }),
    prisma.purchaseOrder.count({ where: { status: 'ENVIADA' } }),
    prisma.receipt.count({ where: { status: 'PARCIAL' } }),
    prisma.supplier.count({ where: { active: true } }),
    prisma.purchaseOrder.findMany({
      where: { status: { in: [...OPEN_PO_STATUSES] } },
      include: { supplier: true, lines: true },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    prisma.stockMovement.findMany({
      include: { item: { select: { sku: true, description: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  const lowStock = lowStockItemsRaw
    .map((item) => {
      const currentQty = item.stockBalances.reduce((sum, b) => sum + b.qty, 0)
      return { item, currentQty }
    })
    .filter(({ item, currentQty }) => currentQty < item.minStock)

  const deficitOf = ({ item, currentQty }: { item: { minStock: number }; currentQty: number }) =>
    item.minStock - currentQty

  const lowStockItems: LowStockRow[] = lowStock
    .sort((a, b) => deficitOf(b) - deficitOf(a))
    .slice(0, 8)
    .map(({ item, currentQty }) => ({
      id: item.id,
      sku: item.sku,
      description: item.description,
      currentQty,
      minStock: item.minStock,
      deficit: item.minStock - currentQty,
    }))

  const outOfStockCount = lowStock.filter(({ currentQty }) => currentQty === 0).length

  const pendingRequisitions: PendingRequisitionRow[] = pendingRequisitionsRaw.map((r) => ({
    id: r.id,
    status: r.status,
    createdAt: r.createdAt,
    workOrderNumber: r.workOrder.number,
    lineCount: r.lines.length,
  }))

  const openPurchaseOrders: OpenPurchaseOrderRow[] = openPurchaseOrdersRaw.map((po) => ({
    id: po.id,
    status: po.status,
    createdAt: po.createdAt,
    supplierName: po.supplier.name,
    lineCount: po.lines.length,
    totalValue: po.lines.reduce((sum, l) => sum + l.qtyOrdered * Number(l.unitPrice), 0),
  }))

  const recentMovements: RecentMovementRow[] = recentMovementsRaw.map((m) => ({
    id: m.id,
    type: m.type,
    qty: m.qty,
    createdAt: m.createdAt,
    itemSku: m.item.sku,
    itemDescription: m.item.description,
  }))

  return {
    totalInventoryValue: optimization.totalInventoryValue,
    slowMovingValue: optimization.slowMovingValue,
    deadStockValue: optimization.deadStockValue,
    lowStockCount: lowStock.length,
    outOfStockCount,
    actionableRequisitionsCount,
    draftPurchaseOrdersCount,
    sentPurchaseOrdersCount,
    partialReceiptsCount,
    activeSuppliersCount,
    lowStockItems,
    pendingRequisitions,
    openPurchaseOrders,
    recentMovements,
  }
}
