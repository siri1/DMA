import { prisma } from '@/lib/prisma'
import {
  RequisitionStatus,
  StockMovementType,
  WorkOrderStatus,
  type UserRole,
} from '@prisma/client'
import { canTransition } from '@/lib/state-machine'
import { transitionWorkOrderState } from '@/modules/states/services'
import { sendStateChangeEmail } from '@/modules/notifications/services'
import type { CreateRequisitionInput } from './validators'

export async function createRequisition(
  input: CreateRequisitionInput,
  userId: string,
  userRole: UserRole
) {
  const workOrder = await prisma.workOrder.findUnique({
    where: { id: input.workOrderId },
  })

  if (!workOrder) throw new Error('OT não encontrada')

  const requisition = await prisma.requisition.create({
    data: {
      workOrderId: input.workOrderId,
      status: RequisitionStatus.PENDENTE,
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
    // Only valid from EM_REPARACAO; otherwise the WO keeps its state (docs/ASSUMPTIONS.md 4.4)
    if (
      await canTransition('workorder', workOrder.status, WorkOrderStatus.AGUARDA_MATERIAL, userRole)
    ) {
      await transitionWorkOrderState(
        input.workOrderId,
        WorkOrderStatus.AGUARDA_MATERIAL,
        userId,
        userRole,
        'Requisição de material sem stock suficiente'
      )
    }
    await prisma.requisition.update({
      where: { id: requisition.id },
      data: { status: RequisitionStatus.AGUARDA_MATERIAL },
    })

    await draftPurchaseOrdersForShortfall(requisition.id)
  } else {
    // Reserve stock
    await reserveStock(requisition.id, userId)
    await prisma.requisition.update({
      where: { id: requisition.id },
      data: { status: RequisitionStatus.RESERVADA },
    })
  }

  return getRequisitionById(requisition.id)
}

/**
 * When a requisition can't be fully reserved, auto-draft a RASCUNHO
 * PurchaseOrder covering the shortfall — so Armazém has something to review
 * and submit rather than starting a PO from a blank page. There is no
 * concept of a "default supplier" per item in the schema, so this uses the
 * most recent PurchaseOrderLine for that item as a heuristic for which
 * supplier and price to reuse. Items with no purchase history are skipped
 * silently: the requisition still sits in AGUARDA_MATERIAL as before, which
 * remains the correct baseline signal even when no PO could be drafted.
 */
async function draftPurchaseOrdersForShortfall(requisitionId: string) {
  const requisition = await prisma.requisition.findUnique({
    where: { id: requisitionId },
    include: { lines: true },
  })
  if (!requisition) return

  const bySupplier = new Map<string, Array<{ itemId: string; qty: number; unitPrice: number }>>()

  for (const line of requisition.lines) {
    const balance = await prisma.stockBalance.aggregate({
      where: { itemId: line.itemId },
      _sum: { qty: true },
    })
    const available = balance._sum.qty || 0
    const deficit = line.qtyRequested - available
    if (deficit <= 0) continue

    const lastPurchase = await prisma.purchaseOrderLine.findFirst({
      where: { itemId: line.itemId },
      orderBy: { createdAt: 'desc' },
      select: { unitPrice: true, purchaseOrder: { select: { supplierId: true } } },
    })
    if (!lastPurchase) continue // no purchase history for this item — can't guess a supplier

    const supplierId = lastPurchase.purchaseOrder.supplierId
    const entry = { itemId: line.itemId, qty: deficit, unitPrice: Number(lastPurchase.unitPrice) }
    bySupplier.set(supplierId, [...(bySupplier.get(supplierId) || []), entry])
  }

  for (const [supplierId, lines] of bySupplier) {
    await prisma.purchaseOrder.create({
      data: {
        supplierId,
        status: 'RASCUNHO',
        lines: {
          create: lines.map((l) => ({
            itemId: l.itemId,
            qtyOrdered: l.qty,
            unitPrice: l.unitPrice,
          })),
        },
      },
    })
  }
}

export async function getRequisitionById(id: string) {
  return prisma.requisition.findUnique({
    where: { id },
    include: {
      workOrder: { select: { number: true, summary: true, status: true } },
      lines: { include: { item: true } },
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

export async function reserveStock(requisitionId: string, userId: string) {
  const req = await prisma.requisition.findUnique({
    where: { id: requisitionId },
    include: { lines: true, workOrder: true },
  })

  if (!req) return

  for (const line of req.lines) {
    // Find locations with stock
    const balances = await prisma.stockBalance.findMany({
      where: { itemId: line.itemId, qty: { gt: 0 } },
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
          userId,
          refType: 'requisition',
          refId: requisitionId,
        },
      })

      remainingQty -= qtyToReserve
      if (remainingQty === 0) break
    }
  }
}

/**
 * Declines a requisition before it's ever been delivered - distinct from
 * DEVOLVIDA (material given back after delivery). Releases any RESERVA
 * stock movements made for it back to available, so a rejection never
 * leaves stock silently locked up.
 */
export async function rejectRequisition(requisitionId: string, reason: string, userId: string) {
  const req = await prisma.requisition.findUnique({
    where: { id: requisitionId },
    include: { lines: true },
  })
  if (!req) throw new Error('Requisição não encontrada')
  if (req.status === 'ENTREGUE') throw new Error('Requisição já entregue — não pode ser rejeitada')
  if (req.status === 'CANCELADA') throw new Error('Requisição já rejeitada')

  const reservations = await prisma.stockMovement.findMany({
    where: { refType: 'requisition', refId: requisitionId, type: 'RESERVA' },
  })

  for (const movement of reservations) {
    await prisma.stockMovement.create({
      data: {
        itemId: movement.itemId,
        locationId: movement.locationId,
        type: 'DEVOLUCAO',
        qty: movement.qty,
        unitCost: movement.unitCost,
        userId,
        refType: 'requisition',
        refId: requisitionId,
      },
    })
  }

  return prisma.requisition.update({
    where: { id: requisitionId },
    data: { status: 'CANCELADA', rejectionReason: reason },
    include: { workOrder: true, lines: { include: { item: true } } },
  })
}

export async function deliverRequisition(
  requisitionId: string,
  userId: string,
  userRole: UserRole
) {
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
          userId,
          refType: 'requisition',
          refId: requisitionId,
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

  if (
    await canTransition('workorder', req.workOrder.status, WorkOrderStatus.EM_REPARACAO, userRole)
  ) {
    await transitionWorkOrderState(
      req.workOrderId,
      WorkOrderStatus.EM_REPARACAO,
      userId,
      userRole,
      'Material da requisição entregue'
    )

    if (req.workOrder.assignedToId) {
      await sendStateChangeEmail(
        req.workOrder.assignedToId,
        `OT ${req.workOrder.number}`,
        req.workOrderId,
        WorkOrderStatus.EM_REPARACAO
      )
    }
  }
}
