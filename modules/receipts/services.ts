import { prisma } from '@/lib/prisma'
import { ReceiptStatus, StockMovementType } from '@prisma/client'
import type { Receipt, ReceiptLine, Item } from '@prisma/client'
import type { CreateReceiptInput, CompleteReceiptInput } from './validators'

type ReceiptWithLines = Receipt & { lines: ReceiptLine[] }
type ReceiptWithItems = Receipt & { lines: (ReceiptLine & { item: Item | null })[] }

// ReceiptLine has no Prisma relation to Item; resolve items by id in one query
async function attachItems(receipt: ReceiptWithLines): Promise<ReceiptWithItems> {
  const itemIds = [...new Set(receipt.lines.map((l) => l.itemId))]
  const items = await prisma.item.findMany({ where: { id: { in: itemIds } } })
  const byId = new Map(items.map((i) => [i.id, i]))
  return {
    ...receipt,
    lines: receipt.lines.map((l) => ({ ...l, item: byId.get(l.itemId) ?? null })),
  }
}

async function getReceivingLocation() {
  return prisma.location.findFirst({ where: { warehouse: 'RECEIVING' } })
}

export async function createReceipt(input: CreateReceiptInput, userId: string) {
  const receipt = await prisma.receipt.create({
    data: {
      purchaseOrderId: input.purchaseOrderId,
      status: ReceiptStatus.PARCIAL,
      lines: {
        create: input.lines.map((line) => ({
          itemId: line.itemId,
          qtyReceived: line.qtyReceived,
        })),
      },
    },
    include: { lines: true },
  })

  const location = await getReceivingLocation()
  if (location) {
    for (const line of input.lines) {
      await prisma.stockMovement.create({
        data: {
          itemId: line.itemId,
          locationId: location.id,
          type: StockMovementType.ENTRADA,
          qty: line.qtyReceived,
          unitCost: 0,
          userId,
          refType: 'receipt',
          refId: receipt.id,
        },
      })
    }
  }

  return attachItems(receipt)
}

export async function getReceiptById(id: string) {
  const receipt = await prisma.receipt.findUnique({
    where: { id },
    include: { lines: true },
  })
  return receipt ? attachItems(receipt) : null
}

export async function getReceipts(filter?: { status?: ReceiptStatus }) {
  const receipts = await prisma.receipt.findMany({
    where: filter?.status ? { status: filter.status } : undefined,
    include: { lines: true },
    orderBy: { createdAt: 'desc' },
  })
  return Promise.all(receipts.map(attachItems))
}

export async function completeReceipt(id: string, input: CompleteReceiptInput, userId: string) {
  const receipt = await prisma.receipt.findUnique({
    where: { id },
    include: { lines: true },
  })

  if (!receipt) throw new Error('Recepção não encontrada')

  const receivingLoc = await getReceivingLocation()
  const defaultLoc = await prisma.location.findFirst({
    where: { warehouse: { not: 'RECEIVING' } },
  })

  if (receivingLoc && defaultLoc) {
    for (const line of receipt.lines) {
      await prisma.stockMovement.create({
        data: {
          itemId: line.itemId,
          locationId: defaultLoc.id,
          type: StockMovementType.TRANSFERENCIA,
          qty: line.qtyReceived,
          unitCost: 0,
          userId,
          refType: 'receipt',
          refId: id,
        },
      })

      await prisma.stockBalance.deleteMany({
        where: { itemId: line.itemId, locationId: receivingLoc.id },
      })

      await prisma.stockBalance.upsert({
        where: { itemId_locationId: { itemId: line.itemId, locationId: defaultLoc.id } },
        create: { itemId: line.itemId, locationId: defaultLoc.id, qty: line.qtyReceived },
        update: { qty: { increment: line.qtyReceived } },
      })
    }
  }

  const updated = await prisma.receipt.update({
    where: { id },
    data: { status: input.status },
    include: { lines: true },
  })

  return attachItems(updated)
}
