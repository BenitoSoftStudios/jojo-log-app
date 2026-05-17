import { describe, it, expect } from 'vitest'
import { weekOf, isInWeek } from '@/utils/weekUtils.js'

describe('weekOf', () => {
  it('maps a Monday to itself', () => {
    expect(weekOf('2026-04-27')).toBe('2026-04-27')
  })

  it('maps a Friday to the previous Monday', () => {
    // 2026-05-01 is a Friday; previous Monday is 2026-04-27
    expect(weekOf('2026-05-01')).toBe('2026-04-27')
  })

  it('maps a Sunday to the previous Monday (Sunday is last day of ISO week)', () => {
    // 2026-02-01 is a Sunday; previous Monday is 2026-01-26
    expect(weekOf('2026-02-01')).toBe('2026-01-26')
  })

  it('handles Jan 1 year boundary (2026)', () => {
    // 2026-01-01 is a Thursday; Monday of that week is 2025-12-29
    expect(weekOf('2026-01-01')).toBe('2025-12-29')
  })

  it('handles Dec 31 year boundary (2025)', () => {
    // 2025-12-31 is a Wednesday; Monday of that week is 2025-12-29
    expect(weekOf('2025-12-31')).toBe('2025-12-29')
  })

  it('handles end-of-year (2026-12-31)', () => {
    // 2026-12-31 is a Thursday; Monday of that week is 2026-12-28
    expect(weekOf('2026-12-31')).toBe('2026-12-28')
  })

  it('cross-year: Dec 31 2025 and Jan 1 2026 resolve to the same Monday', () => {
    expect(weekOf('2025-12-31')).toBe(weekOf('2026-01-01'))
  })

  it('cross-month: Jan 31 and Feb 1 2026 resolve to the same Monday', () => {
    expect(weekOf('2026-01-31')).toBe(weekOf('2026-02-01'))
  })
})

describe('isInWeek', () => {
  it('returns true for the week start date itself', () => {
    expect(isInWeek('2026-04-27', '2026-04-27')).toBe(true)
  })

  it('returns true for a date within the week', () => {
    // 2026-05-01 (Fri) is within the week starting 2026-04-27 (Mon)
    expect(isInWeek('2026-05-01', '2026-04-27')).toBe(true)
  })

  it('returns true for Sunday (last day of the ISO week)', () => {
    // 2026-05-03 (Sun) is the last day of week starting 2026-04-27
    expect(isInWeek('2026-05-03', '2026-04-27')).toBe(true)
  })

  it('returns false for the Monday of the next week', () => {
    // 2026-05-04 (Mon) is the start of the next week
    expect(isInWeek('2026-05-04', '2026-04-27')).toBe(false)
  })

  it('returns false for a date before the week start', () => {
    expect(isInWeek('2026-04-26', '2026-04-27')).toBe(false)
  })
})
