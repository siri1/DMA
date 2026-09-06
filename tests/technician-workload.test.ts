import { describe, it, expect } from 'vitest'
import { startOfWeek, STANDARD_SHIFT_HOURS, WEEKLY_TARGET_HOURS } from '@/modules/technicians/workload'

function dateParts(d: Date) {
  return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() }
}

describe('startOfWeek', () => {
  it('returns the same Monday for any day in that week', () => {
    const monday = dateParts(new Date('2026-09-07T00:00:00'))
    const wednesday = new Date('2026-09-09T15:30:00')
    const sunday = new Date('2026-09-13T23:00:00')

    expect(dateParts(startOfWeek(wednesday))).toEqual(monday)
    expect(dateParts(startOfWeek(sunday))).toEqual(monday)
  })

  it('rolls a Sunday back to the previous Monday, not forward', () => {
    const sunday = new Date('2026-09-06T10:00:00') // Sunday
    expect(dateParts(startOfWeek(sunday))).toEqual(dateParts(new Date('2026-08-31T00:00:00')))
  })

  it('zeroes the time of day', () => {
    const result = startOfWeek(new Date('2026-09-09T15:30:45'))
    expect(result.getHours()).toBe(0)
    expect(result.getMinutes()).toBe(0)
  })
})

describe('weekly target constants', () => {
  it('derives the weekly target from a 5-day, 8h shift', () => {
    expect(STANDARD_SHIFT_HOURS).toBe(8)
    expect(WEEKLY_TARGET_HOURS).toBe(40)
  })
})
