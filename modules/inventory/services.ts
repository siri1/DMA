import { prisma } from '@/lib/prisma'
import { StockMovementType } from '@prisma/client'
import type { CreateItemInput, UpdateItemInput, CreateLocationInput } from './validators'

export async function createItem(input: CreateItemInput) {
  return prisma.item.create({
    data: {
      sku: input.sku,
      description: input.description,
      brand: input.brand,
      unit: input.unit,
      minStock: input.minStock,
      maxStock: input.maxStock,
      avgCost: input.avgCost,
      barcode: input.barcode,
      active: input.active,
    },
  })
}

export async function getItemById(id: string) {
  return prisma.item.findUnique({
    where: { id },
    include: {
      stockBalances: { include: { location: true } },
      stockMovements: { take: 10, orderBy: { createdAt: 'desc' } },
    },
  })
}

export async function getItems(search?: string) {
  return prisma.item.findMany({
    where: search
      ? {
          OR: [
            { sku: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }
      : undefined,
    orderBy: { sku: 'asc' },
  })
}

export async function updateItem(id: string, input: UpdateItemInput) {
  return prisma.item.update({
    where: { id },
    data: {
      ...(input.description && { description: input.description }),
      ...(input.minStock !== undefined && { minStock: input.minStock }),
      ...(input.maxStock !== undefined && { maxStock: input.maxStock }),
      ...(input.avgCost !== undefined && { avgCost: input.avgCost }),
      ...(input.active !== undefined && { active: input.active }),
    },
  })
}

export async function getItemsLowStock() {
  const items = await prisma.item.findMany({
    where: { active: true },
    include: {
      stockBalances: {
        where: { qty: { gt: 0 } },
        include: { location: true },
      },
    },
  })

  return items.filter((item) => {
    const totalQty = item.stockBalances.reduce((sum, sb) => sum + sb.qty, 0)
    return totalQty < item.minStock
  })
}

export async function createLocation(input: CreateLocationInput) {
  const code = `${input.warehouse}-${input.aisle}-${input.shelf}-${input.position}`
  return prisma.location.create({
    data: {
      warehouse: input.warehouse,
      aisle: input.aisle,
      shelf: input.shelf,
      position: input.position,
      code,
    },
  })
}

export async function getLocations(warehouse?: string) {
  return prisma.location.findMany({
    where: warehouse ? { warehouse } : undefined,
    orderBy: { code: 'asc' },
  })
}

export async function recordStockMovement(
  itemId: string,
  locationId: string,
  type: StockMovementType,
  qty: number,
  unitCost: number,
  userId: string,
  refType?: string,
  refId?: string
) {
  const movement = await prisma.stockMovement.create({
    data: {
      itemId,
      locationId,
      type,
      qty,
      unitCost,
      userId,
      refType,
      refId,
      at: new Date(),
    },
  })

  // Recalculate CMP for ENTRADA
  if (type === StockMovementType.ENTRADA) {
    await recalculateCMP(itemId)
  }

  // Update balance
  const balance = await prisma.stockBalance.findUnique({
    where: { itemId_locationId: { itemId, locationId } },
  })

  if (balance) {
    await prisma.stockBalance.update({
      where: { itemId_locationId: { itemId, locationId } },
      data: { qty: balance.qty + (type === StockMovementType.ENTRADA ? qty : -qty) },
    })
  } else if (type === StockMovementType.ENTRADA) {
    await prisma.stockBalance.create({
      data: { itemId, locationId, qty },
    })
  }

  return movement
}

export async function recalculateCMP(itemId: string) {
  const movements = await prisma.stockMovement.findMany({
    where: { itemId, type: StockMovementType.ENTRADA },
    orderBy: { at: 'asc' },
  })

  if (movements.length === 0) return

  let totalQty = 0
  let totalCost = 0

  for (const m of movements) {
    totalQty += m.qty
    totalCost += m.qty * m.unitCost
  }

  const cmp = totalCost / totalQty

  await prisma.item.update({
    where: { id: itemId },
    data: { avgCost: cmp },
  })
}
