import { describe, it, expect } from 'vitest'
import {
  computeReorderPoint,
  computeMaxStock,
  computeDaysOfSupply,
  SAFETY_STOCK_DAYS,
} from '@/modules/inventory/optimization'

describe('computeReorderPoint', () => {
  it('covers usage during lead time plus the safety-stock buffer', () => {
    // 2 units/day, 5-day lead time → (5 + 7) * 2 = 24
    expect(computeReorderPoint(2, 5)).toBe(24)
    expect(SAFETY_STOCK_DAYS).toBe(7)
  })

  it('rounds up fractional usage', () => {
    expect(computeReorderPoint(1.2, 3)).toBe(Math.ceil(1.2 * 10))
  })

  it('is zero when there is no usage', () => {
    expect(computeReorderPoint(0, 10)).toBe(0)
  })
})

describe('computeMaxStock', () => {
  it('adds one more lead-time cycle of usage on top of the reorder point', () => {
    const reorderPoint = computeReorderPoint(2, 5)
    expect(computeMaxStock(reorderPoint, 2, 5)).toBe(reorderPoint + 10)
  })
})

describe('computeDaysOfSupply', () => {
  it('divides current quantity by average daily usage', () => {
    expect(computeDaysOfSupply(100, 5)).toBe(20)
  })

  it('returns null when there is no usage to divide by', () => {
    expect(computeDaysOfSupply(100, 0)).toBeNull()
  })
})
