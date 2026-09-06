import { describe, it, expect } from 'vitest'
import { toDateOnly } from '@/modules/technicians/availability'

describe('toDateOnly', () => {
  it('zeroes the time of day while keeping the date', () => {
    const result = toDateOnly(new Date('2026-09-09T15:30:45'))
    expect(result.getHours()).toBe(0)
    expect(result.getMinutes()).toBe(0)
    expect(result.getSeconds()).toBe(0)
    expect(result.getDate()).toBe(9)
  })

  it('does not mutate the input date', () => {
    const input = new Date('2026-09-09T15:30:45')
    const original = input.getTime()
    toDateOnly(input)
    expect(input.getTime()).toBe(original)
  })
})
