import { prisma } from '@/lib/prisma'
import { StockMovementType } from '@prisma/client'

/**
 * Thresholds and buffers not supplied by the client — documented as
 * assumptions in docs/ASSUMPTIONS.md rather than invented silently.
 */
export const SLOW_MOVING_DAYS = 90
export const DEAD_STOCK_DAYS = 180
export const CONSUMPTION_WINDOW_DAYS = 90
export const SAFETY_STOCK_DAYS = 7

export interface ItemOptimization {
  itemId: string
  currentQty: number
  inventoryValue: number
  avgDailyUsage: number
  daysOfSupply: number | null
  daysSinceLastOutMovement: number | null
  isSlowMoving: boolean
  isDeadStock: boolean
  leadTimeDays: number | null
  recommendedReorderPoint: number | null
  recommendedMaxStock: number | null
  currentMinStock: number
  currentMaxStock: number
}

/**
 * Computes the recommended reorder point from real consumption + supplier
 * lead time: enough stock to cover usage during the lead time, plus a fixed
 * safety-stock buffer (SAFETY_STOCK_DAYS) for demand/delivery variability.
 * Pure so it can be unit tested without touching the database.
 */
export function computeReorderPoint(avgDailyUsage: number, leadTimeDays: number): number {
  return Math.ceil(avgDailyUsage * (leadTimeDays + SAFETY_STOCK_DAYS))
}

/** Optimal max: the reorder point plus roughly one more lead-time cycle of usage. */
export function computeMaxStock(reorderPoint: number, avgDailyUsage: number, leadTimeDays: number): number {
  return Math.ceil(reorderPoint + avgDailyUsage * leadTimeDays)
}

export function computeDaysOfSupply(currentQty: number, avgDailyUsage: number): number | null {
  if (avgDailyUsage <= 0) return null
  return Math.round(currentQty / avgDailyUsage)
}

async function getItemLeadTimeDays(itemId: string): Promise<number | null> {
  const lastPurchase = await prisma.purchaseOrderLine.findFirst({
    where: { itemId },
    orderBy: { createdAt: 'desc' },
    select: { purchaseOrder: { select: { supplier: { select: { leadTimeDays: true } } } } },
  })
  return lastPurchase?.purchaseOrder.supplier.leadTimeDays ?? null
}

export async function getItemOptimization(itemId: string): Promise<ItemOptimization | null> {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { stockBalances: true },
  })
  if (!item) return null

  const currentQty = item.stockBalances.reduce((sum, b) => sum + b.qty, 0)
  const inventoryValue = currentQty * Number(item.avgCost)

  const windowStart = new Date()
  windowStart.setDate(windowStart.getDate() - CONSUMPTION_WINDOW_DAYS)

  const consumption = await prisma.stockMovement.aggregate({
    where: { itemId, type: StockMovementType.SAIDA, createdAt: { gte: windowStart } },
    _sum: { qty: true },
  })
  const avgDailyUsage = (consumption._sum.qty || 0) / CONSUMPTION_WINDOW_DAYS

  const lastOutMovement = await prisma.stockMovement.findFirst({
    where: { itemId, type: StockMovementType.SAIDA },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  })
  const daysSinceLastOutMovement = lastOutMovement
    ? Math.floor((Date.now() - lastOutMovement.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    : null

  const isSlowMoving =
    currentQty > 0 && (daysSinceLastOutMovement === null || daysSinceLastOutMovement > SLOW_MOVING_DAYS)
  const isDeadStock =
    currentQty > 0 && (daysSinceLastOutMovement === null || daysSinceLastOutMovement > DEAD_STOCK_DAYS)

  const leadTimeDays = await getItemLeadTimeDays(itemId)
  const recommendedReorderPoint =
    leadTimeDays !== null && avgDailyUsage > 0 ? computeReorderPoint(avgDailyUsage, leadTimeDays) : null
  const recommendedMaxStock =
    recommendedReorderPoint !== null && leadTimeDays !== null
      ? computeMaxStock(recommendedReorderPoint, avgDailyUsage, leadTimeDays)
      : null

  return {
    itemId,
    currentQty,
    inventoryValue,
    avgDailyUsage,
    daysOfSupply: computeDaysOfSupply(currentQty, avgDailyUsage),
    daysSinceLastOutMovement,
    isSlowMoving,
    isDeadStock,
    leadTimeDays,
    recommendedReorderPoint,
    recommendedMaxStock,
    currentMinStock: item.minStock,
    currentMaxStock: item.maxStock,
  }
}

export interface InventoryOptimizationSummary {
  totalInventoryValue: number
  slowMovingValue: number
  deadStockValue: number
  flaggedItems: {
    itemId: string
    sku: string
    description: string
    qty: number
    value: number
    daysSinceLastOutMovement: number | null
    isDeadStock: boolean
  }[]
}

export async function getInventoryOptimizationSummary(): Promise<InventoryOptimizationSummary> {
  const items = await prisma.item.findMany({
    where: { active: true },
    include: { stockBalances: true },
  })

  let totalInventoryValue = 0
  let slowMovingValue = 0
  let deadStockValue = 0
  const flaggedItems: InventoryOptimizationSummary['flaggedItems'] = []

  for (const item of items) {
    const qty = item.stockBalances.reduce((sum, b) => sum + b.qty, 0)
    if (qty === 0) continue

    const value = qty * Number(item.avgCost)
    totalInventoryValue += value

    const lastOutMovement = await prisma.stockMovement.findFirst({
      where: { itemId: item.id, type: StockMovementType.SAIDA },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    })
    const daysSinceLastOutMovement = lastOutMovement
      ? Math.floor((Date.now() - lastOutMovement.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : null

    const isSlowMoving = daysSinceLastOutMovement === null || daysSinceLastOutMovement > SLOW_MOVING_DAYS
    const isDeadStock = daysSinceLastOutMovement === null || daysSinceLastOutMovement > DEAD_STOCK_DAYS

    if (isSlowMoving) {
      slowMovingValue += value
      flaggedItems.push({
        itemId: item.id,
        sku: item.sku,
        description: item.description,
        qty,
        value,
        daysSinceLastOutMovement,
        isDeadStock,
      })
    }
    if (isDeadStock) deadStockValue += value
  }

  flaggedItems.sort((a, b) => b.value - a.value)

  return { totalInventoryValue, slowMovingValue, deadStockValue, flaggedItems }
}
