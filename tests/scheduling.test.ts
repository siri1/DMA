import { describe, it, expect } from 'vitest'
import { getQualificationGap } from '@/modules/scheduling/services'
import { scheduleWorkOrderSchema, assignTechnicianSchema } from '@/modules/scheduling/validators'

describe('getQualificationGap', () => {
  it('is empty when the technician has every required qualification', () => {
    expect(getQualificationGap(['Hidráulica', 'Electricidade'], ['Electricidade', 'Hidráulica', 'Soldadura'])).toEqual([])
  })

  it('lists the missing qualifications', () => {
    expect(getQualificationGap(['Hidráulica', 'Electricidade'], ['Electricidade'])).toEqual(['Hidráulica'])
  })

  it('is empty when nothing is required', () => {
    expect(getQualificationGap([], [])).toEqual([])
  })

  it('matches case-insensitively', () => {
    expect(getQualificationGap(['hidráulica'], ['Hidráulica'])).toEqual([])
  })
})

describe('scheduleWorkOrderSchema', () => {
  const valid = { scheduledStart: '2026-09-07T08:00:00', estimatedDurationMinutes: 120 }

  it('accepts a valid schedule and defaults qualifications to empty', () => {
    const result = scheduleWorkOrderSchema.parse(valid)
    expect(result.requiredQualifications).toEqual([])
    expect(result.scheduledStart).toBeInstanceOf(Date)
  })

  it('rejects a duration under 15 minutes', () => {
    expect(() => scheduleWorkOrderSchema.parse({ ...valid, estimatedDurationMinutes: 5 })).toThrow()
  })

  it('rejects a duration over 24 hours', () => {
    expect(() => scheduleWorkOrderSchema.parse({ ...valid, estimatedDurationMinutes: 24 * 60 + 1 })).toThrow()
  })
})

describe('assignTechnicianSchema', () => {
  it('requires a technicianId', () => {
    expect(() => assignTechnicianSchema.parse({})).toThrow()
  })

  it('accepts an optional force flag', () => {
    expect(assignTechnicianSchema.parse({ technicianId: 't1', force: true })).toEqual({ technicianId: 't1', force: true })
  })
})
