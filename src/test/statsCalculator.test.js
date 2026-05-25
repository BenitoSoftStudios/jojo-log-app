import { describe, it, expect } from 'vitest'
import { calculateStats } from '@/utils/statsCalculator.js'

const TODAY = '2026-03-15'

function makeEntry(id, overrides) {
  return {
    id,
    entryDate: TODAY,
    entryTime: '08:00',
    amountMl:  100,
    diaper:    'W',
    deleted:   false,
    ...overrides,
  }
}

describe('calculateStats — zero state', () => {
  it('returns zeros for empty array', () => {
    expect(calculateStats([], TODAY)).toEqual({ todayMl: 0, sevenDayMl: 0, monthMl: 0, feedCount: 0 })
  })
})

describe('calculateStats — todayMl and feedCount', () => {
  it('accumulates todayMl from entries on today', () => {
    const entries = [makeEntry('e1', { amountMl: 120 }), makeEntry('e2', { amountMl: 80 })]
    const stats = calculateStats(entries, TODAY)
    expect(stats.todayMl).toBe(200)
  })

  it('counts entries with amountMl > 0 as feeds', () => {
    const entries = [makeEntry('e1', { amountMl: 120 }), makeEntry('e2', { amountMl: 90 })]
    expect(calculateStats(entries, TODAY).feedCount).toBe(2)
  })

  it('does not count a 0 mL entry as a feed', () => {
    const entries = [makeEntry('e1', { amountMl: 0 })]
    const stats = calculateStats(entries, TODAY)
    expect(stats.todayMl).toBe(0)
    expect(stats.feedCount).toBe(0)
  })

  it('does not count a null amountMl entry as a feed or add to mL', () => {
    const entries = [makeEntry('e1', { amountMl: null })]
    const stats = calculateStats(entries, TODAY)
    expect(stats.todayMl).toBe(0)
    expect(stats.feedCount).toBe(0)
  })
})

describe('calculateStats — deleted entries', () => {
  it('excludes deleted entries from all totals', () => {
    const entries = [makeEntry('e1', { amountMl: 120, deleted: true })]
    const stats = calculateStats(entries, TODAY)
    expect(stats.todayMl).toBe(0)
    expect(stats.sevenDayMl).toBe(0)
    expect(stats.monthMl).toBe(0)
    expect(stats.feedCount).toBe(0)
  })
})

describe('calculateStats — sevenDayMl rolling window', () => {
  it('includes an entry 6 days ago (within the 7-day window)', () => {
    // TODAY = 2026-03-15; 6 days ago = 2026-03-09 (inclusive boundary)
    const entries = [makeEntry('e1', { entryDate: '2026-03-09', amountMl: 80 })]
    expect(calculateStats(entries, TODAY).sevenDayMl).toBe(80)
  })

  it('excludes an entry 7 days ago (outside the 7-day window)', () => {
    // 7 days ago = 2026-03-08 (exclusive boundary)
    const entries = [makeEntry('e1', { entryDate: '2026-03-08', amountMl: 80 })]
    expect(calculateStats(entries, TODAY).sevenDayMl).toBe(0)
  })

  it('includes today in the sevenDayMl window', () => {
    const entries = [makeEntry('e1', { amountMl: 100 })]
    expect(calculateStats(entries, TODAY).sevenDayMl).toBe(100)
  })
})

describe('calculateStats — monthMl', () => {
  it('includes an entry earlier in the same month', () => {
    // 2026-03-01 is in the same month as TODAY (2026-03-15)
    const entries = [makeEntry('e1', { entryDate: '2026-03-01', amountMl: 90 })]
    const stats = calculateStats(entries, TODAY)
    expect(stats.monthMl).toBe(90)
    expect(stats.todayMl).toBe(0)   // not today
    expect(stats.sevenDayMl).toBe(0) // > 6 days ago
  })

  it('excludes an entry from the previous month', () => {
    const entries = [makeEntry('e1', { entryDate: '2026-02-28', amountMl: 100 })]
    const stats = calculateStats(entries, TODAY)
    expect(stats.todayMl).toBe(0)
    expect(stats.sevenDayMl).toBe(0)
    expect(stats.monthMl).toBe(0)
    expect(stats.feedCount).toBe(0)
  })

  it('includes today in monthMl', () => {
    const entries = [makeEntry('e1', { amountMl: 110 })]
    expect(calculateStats(entries, TODAY).monthMl).toBe(110)
  })
})

describe('calculateStats — source field does not affect counts', () => {
  it('counts a source:legacy entry in todayMl', () => {
    const entries = [makeEntry('e1', { amountMl: 150, source: 'legacy' })]
    expect(calculateStats(entries, TODAY).todayMl).toBe(150)
  })

  it('counts a source:legacy entry in feedCount', () => {
    const entries = [makeEntry('e1', { amountMl: 150, source: 'legacy' })]
    expect(calculateStats(entries, TODAY).feedCount).toBe(1)
  })

  it('counts a source:app entry in todayMl', () => {
    const entries = [makeEntry('e1', { amountMl: 90, source: 'app' })]
    expect(calculateStats(entries, TODAY).todayMl).toBe(90)
  })

  it('excludes a deleted source:legacy entry', () => {
    const entries = [makeEntry('e1', { amountMl: 150, source: 'legacy', deleted: true })]
    const stats = calculateStats(entries, TODAY)
    expect(stats.todayMl).toBe(0)
    expect(stats.feedCount).toBe(0)
  })

  it('mixes legacy and app entries for correct totals', () => {
    const entries = [
      makeEntry('e1', { amountMl: 120, source: 'legacy' }),
      makeEntry('e2', { amountMl: 80,  source: 'app' }),
    ]
    const stats = calculateStats(entries, TODAY)
    expect(stats.todayMl).toBe(200)
    expect(stats.feedCount).toBe(2)
  })
})
