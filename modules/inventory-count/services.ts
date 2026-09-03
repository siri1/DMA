import { prisma } from '@/lib/prisma'
import type { CreateInventoryCountInput } from './validators'

export async function createInventoryCount(input: CreateInventoryCountInput) {
  return prisma.inventoryCount.create({
    data: {
      status: 'DRAFT',
      lines: {
        create: input.lines.map((l) => ({
          itemId: l.itemId,
          expectedQty: l.expectedQty,
          countedQty: l.countedQty,
        })),
      },
    },
    include: { lines: true },
  })
}

export async function getInventoryCounts() {
  return prisma.inventoryCount.findMany({
    include: { lines: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getInventoryCountById(id: string) {
  return prisma.inventoryCount.findUnique({
    where: { id },
    include: { lines: true },
  })
}

/**
 * Finaliza uma contagem: para cada linha com divergência entre contado e
 * esperado, regista um StockMovement do tipo AJUSTE para reconciliar o
 * StockBalance. Marca a contagem como CONCLUIDA.
 */
export async function completeInventoryCount(id: string, userId: string) {
  const count = await prisma.inventoryCount.findUnique({
    where: { id },
    include: { lines: true },
  })
  if (!count) throw new Error('Contagem não encontrada')

  // Usa a primeira localização como referência para o ajuste (contagem
  // simplificada por artigo, sem localização específica por linha).
  const defaultLocation = await prisma.location.findFirst()
  if (!defaultLocation) throw new Error('Nenhuma localização configurada')

  for (const line of count.lines) {
    const diff = line.countedQty - line.expectedQty
    if (diff === 0) continue

    await prisma.stockMovement.create({
      data: {
        itemId: line.itemId,
        locationId: defaultLocation.id,
        type: 'AJUSTE',
        qty: Math.abs(diff),
        refType: 'inventory_count',
        refId: count.id,
        userId,
      },
    })

    const existing = await prisma.stockBalance.findFirst({
      where: { itemId: line.itemId, locationId: defaultLocation.id },
    })

    if (existing) {
      await prisma.stockBalance.update({
        where: { id: existing.id },
        data: { qty: Math.max(0, existing.qty + diff) },
      })
    } else if (diff > 0) {
      await prisma.stockBalance.create({
        data: { itemId: line.itemId, locationId: defaultLocation.id, qty: diff },
      })
    }
  }

  return prisma.inventoryCount.update({
    where: { id },
    data: { status: 'CONCLUIDA', countedAt: new Date() },
    include: { lines: true },
  })
}
