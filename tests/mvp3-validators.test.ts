import { describe, it, expect } from 'vitest'
import { createMaintenancePlanSchema } from '@/modules/maintenance-plans/validators'
import { createSupplierSchema } from '@/modules/suppliers/validators'
import { createItemSchema, createLocationSchema } from '@/modules/inventory/validators'
import { createRequisitionSchema } from '@/modules/requisitions/validators'
import { createReceiptSchema, completeReceiptSchema } from '@/modules/receipts/validators'
import { enterQuarantineSchema, decideQuarantineSchema } from '@/modules/quarantine/validators'

describe('createMaintenancePlanSchema', () => {
  const valid = {
    assetId: 'asset_1',
    type: 'PREVENTIVA',
    periodicityDays: 90,
    nextDueAt: '2026-10-01',
  }

  it('accepts a valid plan and applies defaults', () => {
    const result = createMaintenancePlanSchema.parse(valid)
    expect(result.active).toBe(true)
    expect(result.nextDueAt).toBeInstanceOf(Date)
  })

  it('rejects periodicity below one day', () => {
    expect(() => createMaintenancePlanSchema.parse({ ...valid, periodicityDays: 0 })).toThrow()
  })

  it('rejects unknown maintenance type', () => {
    expect(() => createMaintenancePlanSchema.parse({ ...valid, type: 'PREDITIVA' })).toThrow()
  })

  it('rejects missing asset', () => {
    expect(() => createMaintenancePlanSchema.parse({ ...valid, assetId: '' })).toThrow()
  })
})

describe('createSupplierSchema', () => {
  const valid = { name: 'MECA Ltda.', nif: '5417000000', leadTimeDays: 7 }

  it('accepts a valid supplier', () => {
    expect(createSupplierSchema.parse(valid)).toMatchObject(valid)
  })

  it('rejects invalid email', () => {
    expect(() => createSupplierSchema.parse({ ...valid, email: 'nao-e-email' })).toThrow()
  })

  it('rejects lead time below one day', () => {
    expect(() => createSupplierSchema.parse({ ...valid, leadTimeDays: 0 })).toThrow()
  })
})

describe('createItemSchema', () => {
  const valid = { sku: 'FIL-001', description: 'Filtro de óleo', minStock: 2, maxStock: 20, avgCost: 1500 }

  it('accepts a valid item and applies defaults', () => {
    const result = createItemSchema.parse(valid)
    expect(result.unit).toBe('UN')
    expect(result.active).toBe(true)
  })

  it('rejects negative average cost', () => {
    expect(() => createItemSchema.parse({ ...valid, avgCost: -1 })).toThrow()
  })

  it('rejects max stock of zero', () => {
    expect(() => createItemSchema.parse({ ...valid, maxStock: 0 })).toThrow()
  })
})

describe('createLocationSchema', () => {
  it('requires every segment of the location code', () => {
    expect(() => createLocationSchema.parse({ warehouse: 'A1', aisle: 'C02', shelf: 'P03' })).toThrow()
    expect(
      createLocationSchema.parse({ warehouse: 'A1', aisle: 'C02', shelf: 'P03', position: '05' })
    ).toEqual({ warehouse: 'A1', aisle: 'C02', shelf: 'P03', position: '05' })
  })
})

describe('createRequisitionSchema', () => {
  it('requires a work order', () => {
    expect(() =>
      createRequisitionSchema.parse({ workOrderId: '', lines: [{ itemId: 'i1', qtyRequested: 1 }] })
    ).toThrow()
  })

  it('rejects a line with zero quantity', () => {
    expect(() =>
      createRequisitionSchema.parse({ workOrderId: 'wo1', lines: [{ itemId: 'i1', qtyRequested: 0 }] })
    ).toThrow()
  })
})

describe('receipt schemas', () => {
  it('accepts a receipt without purchase order', () => {
    const result = createReceiptSchema.parse({ lines: [{ itemId: 'i1', qtyReceived: 3 }] })
    expect(result.purchaseOrderId).toBeUndefined()
  })

  it('only allows the statuses defined in the schema', () => {
    expect(completeReceiptSchema.parse({ status: 'RECEBIDA' }).status).toBe('RECEBIDA')
    expect(() => completeReceiptSchema.parse({ status: 'COMPLETA' })).toThrow()
  })
})

describe('quarantine schemas', () => {
  it('requires an asset to enter quarantine', () => {
    expect(() => enterQuarantineSchema.parse({ assetId: '' })).toThrow()
    expect(enterQuarantineSchema.parse({ assetId: 'a1' }).technicalOpinion).toBeUndefined()
  })

  it('accepts the four decisions and rejects others', () => {
    for (const decision of ['REPARAR', 'REAPROVEITAR', 'TRANSFERIR', 'ABATER']) {
      expect(decideQuarantineSchema.parse({ decision }).decision).toBe(decision)
    }
    expect(() => decideQuarantineSchema.parse({ decision: 'DESTRUIR' })).toThrow()
  })
})
