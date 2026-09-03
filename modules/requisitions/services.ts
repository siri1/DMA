import { prisma } from '@/lib/prisma'
import { RequisitionStatus, StockMovementType } from '@prisma/client'
import type { CreateRequisitionInput, UpdateRequisitionLineInput } from './validators'

export async function createRequisition(input: CreateRequisitionInput, userId: string) {
  const workOrder = await prisma.workOrder.findUnique({
    where: { id: input.workOrderId },
  })

  if (!workOrder) throw new Error('OT não encontrada')

  const requisition = await prisma.requisition.create({
    data: {
      workOrderId: input.workOrderId,
      status: RequisitionStatus.PENDENTE,
      createdById: userId,
      lines: {
        create: input.lines.map((line) => ({
          itemId: line.itemId,
          qtyRequested: line.qtyRequested,
          qtyDelivered: 0,
        })),
      },
    },
    include: { lines: { include: { item: true } } },
  })

  // Check stock availability
  const insufficientStock = await checkStockAvailability(requisition.id)
  if (insufficientStock) {
    // Transition WO to AGUARDA_MATERIAL
    await prisma.workOrder.update({
      where: { id: input.workOrderId },
      data: { status: 'AGUARDA_MATERIAL' },
    })
    await prisma.requisition.update({
      where: { id: requisition.id },
      data: { status: RequisitionStatus.AGUARDA_MATERIAL },
    })
  } else {
    // Reserve stock
    await reserveStock(requisition.id)
    await prisma.requisition.update({
      where: { id: requisition.id },
      data: { status: RequisitionStatus.RESERVADA },
    })
  }

  return getRequisitionById(requisition.id)
}

export async function getRequisitionById(id: string) {
  return prisma.requisition.findUnique({
    where: { id },
    include: {
      workOrder: { select: { number: true, summary: true, status: true } },
      lines: { include: { item: true } },
      createdBy: { select: { name: true } },
    },
  })
}

export async function getRequisitionsByWorkOrder(workOrderId: string) {
  return prisma.requisition.findMany({
    where: { workOrderId },
    include: { lines: { include: { item: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function checkStockAvailability(requisitionId: string): Promise<boolean> {
  const req = await prisma.requisition.findUnique({
    where: { id: requisitionId },
    include: { lines: true },
  })

  if (!req) return false

  for (const line of req.lines) {
    const balance = await prisma.stockBalance.aggregate({
      where: { itemId: line.itemId },
      _sum: { qty: true },
    })

    const availableQty = balance._sum.qty || 0
    if (availableQty < line.qtyRequested) {
      return true // Insufficient stock found
    }
  }

  return false
}

export async function reserveStock(requisitionId: string) {
  const req = await prisma.requisition.findUnique({
    where: { id: requisitionId },
    include: { lines: true, workOrder: true },
  })

  if (!req) return

  for (const line of req.lines) {
    // Find locations with stock
    const balances = await prisma.stockBalance.findMany({
      where: { itemId: line.itemId, qty: { gt: 0 } },
      orderBy: { createdAt: 'asc' },
      take: 100,
    })

    let remainingQty = line.qtyRequested
    for (const balance of balances) {
      const qtyToReserve = Math.min(remainingQty, balance.qty)
      await prisma.stockMovement.create({
        data: {
          itemId: line.itemId,
          locationId: balance.locationId,
          type: StockMovementType.RESERVA,
          qty: qtyToReserve,
          unitCost: 0,
          userId: req.createdById,
          refType: 'requisition',
          refId: requisitionId,
          at: new Date(),
        },
      })

      remainingQty -= qtyToReserve
      if (remainingQty === 0) break
    }
  }
}

export async function deliverRequisition(requisitionId: string) {
  const req = await prisma.requisition.findUnique({
    where: { id: requisitionId },
    include: { lines: true, workOrder: true },
  })

  if (!req) throw new Error('Requisição não encontrada')

  for (const line of req.lines) {
    await prisma.requisitionLine.update({
      where: { id: line.id },
      data: { qtyDelivered: line.qtyRequested },
    })

    // Record SAIDA movement
    const balances = await prisma.stockBalance.findMany({
      where: { itemId: line.itemId, qty: { gt: 0 } },
      orderBy: { createdAt: 'asc' },
    })

    let remainingQty = line.qtyRequested
    for (const balance of balances) {
      const qtyToRemove = Math.min(remainingQty, balance.qty)
      await prisma.stockMovement.create({
        data: {
          itemId: line.itemId,
          locationId: balance.locationId,
          type: StockMovementType.SAIDA,
          qty: qtyToRemove,
          unitCost: 0,
          userId: req.createdById,
          refType: 'requisition',
          refId: requisitionId,
          at: new Date(),
        },
      })

      await prisma.stockBalance.update({
        where: { itemId_locationId: { itemId: line.itemId, locationId: balance.locationId } },
        data: { qty: balance.qty - qtyToRemove },
      })

      remainingQty -= qtyToRemove
      if (remainingQty === 0) break
    }
  }

  await prisma.requisition.update({
    where: { id: requisitionId },
    data: { status: RequisitionStatus.ENTREGUE },
  })

  // Transition WO back to EM_REPARACAO
  await prisma.workOrder.update({
    where: { id: req.workOrderId },
    data: { status: 'EM_REPARACAO' },
  })
}
