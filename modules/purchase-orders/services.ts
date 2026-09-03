import { prisma } from '@/lib/prisma'
import type { CreatePurchaseOrderInput, UpdatePurchaseOrderStatusInput } from './validators'

export async function createPurchaseOrder(input: CreatePurchaseOrderInput) {
  return prisma.purchaseOrder.create({
    data: {
      supplierId: input.supplierId,
      status: 'RASCUNHO',
      lines: {
        create: input.lines.map((line) => ({
          itemId: line.itemId,
          qtyOrdered: line.qtyOrdered,
          unitPrice: line.unitPrice,
        })),
      },
    },
    include: {
      supplier: true,
      lines: { include: { item: true } },
    },
  })
}

export async function getPurchaseOrders() {
  return prisma.purchaseOrder.findMany({
    include: {
      supplier: true,
      lines: { include: { item: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getPurchaseOrderById(id: string) {
  return prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      lines: { include: { item: true } },
    },
  })
}

export async function updatePurchaseOrderStatus(id: string, input: UpdatePurchaseOrderStatusInput) {
  return prisma.purchaseOrder.update({
    where: { id },
    data: { status: input.status },
    include: {
      supplier: true,
      lines: { include: { item: true } },
    },
  })
}
