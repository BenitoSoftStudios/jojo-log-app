import { describe, it, expect } from 'vitest'
import {
  addDays,
  buildDateRange,
  computeDailyStats,
  sevenDayRollingAvg,
  groupByMonth,
} from '@/utils/graphData.js'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeEntry(id, date, overrides = {}) {
  return {
    id,
    entryDate:      date,
    amountMl:       120,
    tummyTime:      false,
    tummyTimeCount: undefined,
    deleted:        false,
    source:         'app',
    ...overrides,
  }
}

// ── addDays ───────────────────────────────────────────────────────────────────

describe('addDays', () => {
  it('adds positive days', () => {
    expect(addDays('2026-05-28', 2)).toBe('2026-05-30')
  })
  it('subtracts days with negative n', () => {
    expect(addDays('2026-05-30', -6)).toBe('2026-05-24')
  })
  it('crosses month boundary', () => {
    expect(addDays('2026-01-30', 3)).toBe('2026-02-02')
  })
})

// ── buildDateRange ────────────────────────────────────────────────────────────

describe('buildDateRange', () => {
  it('returns a single date when start equals end', () => {
    expect(buildDateRange('2026-05-30', '2026-05-30')).toEqual(['2026-05-30'])
  })
  it('returns all dates inclusive', () => {
    expect(buildDateRange('2026-05-28', '2026-05-30')).toEqual([
      '2026-05-28', '2026-05-29', '2026-05-30',
    ])
  })
  it('returns empty when start is after end', () => {
    expect(buildDateRange('2026-05-31', '2026-05-30')).toEqual([])
  })
})

// ── computeDailyStats ─────────────────────────────────────────────────────────

describe('computeDailyStats', () => {
  it('returns empty array for empty entries list', () => {
    expect(computeDailyStats([], null, '2026-05-30')).toEqual([])
  })

  it('returns empty array when all entries are deleted', () => {
    const entries = [makeEntry('e1', '2026-05-30', { deleted: true })]
    expect(computeDailyStats(entries, null, '2026-05-30')).toEqual([])
  })

  it('excludes deleted entries from sums', () => {
    const entries = [
      makeEntry('e1', '2026-05-30', { amountMl: 120 }),
      makeEntry('e2', '2026-05-30', { amountMl: 80, deleted: true }),
    ]
    const result = computeDailyStats(entries, '2026-05-30', '2026-05-30')
    expect(result[0].totalMl).toBe(120)
    expect(result[0].feedCount).toBe(1)
  })

  it('includes both app and legacy source entries', () => {
    const entries = [
      makeEntry('e1', '2026-05-30', { amountMl: 100, source: 'app' }),
      makeEntry('e2', '2026-05-30', { amountMl: 80,  source: 'legacy' }),
    ]
    const result = computeDailyStats(entries, '2026-05-30', '2026-05-30')
    expect(result[0].totalMl).toBe(180)
    expect(result[0].feedCount).toBe(2)
  })

  it('0 mL does not count as a feed', () => {
    const entries = [makeEntry('e1', '2026-05-30', { amountMl: 0 })]
    const result = computeDailyStats(entries, '2026-05-30', '2026-05-30')
    expect(result[0].feedCount).toBe(0)
    expect(result[0].totalMl).toBe(0)
  })

  it('null amountMl is excluded from totalMl and feedCount', () => {
    const entries = [makeEntry('e1', '2026-05-30', { amountMl: null })]
    const result = computeDailyStats(entries, '2026-05-30', '2026-05-30')
    expect(result[0].totalMl).toBe(0)
    expect(result[0].feedCount).toBe(0)
  })

  it('counts each entry with tummyTimeCount > 0 as one session', () => {
    const entries = [
      makeEntry('e1', '2026-05-30', { tummyTimeCount: 3 }),
      makeEntry('e2', '2026-05-30', { tummyTimeCount: 2 }),
    ]
    const result = computeDailyStats(entries, '2026-05-30', '2026-05-30')
    expect(result[0].tummyCount).toBe(2)
  })

  it('falls back to legacy tummyTime boolean (1 session per entry)', () => {
    const entries = [
      makeEntry('e1', '2026-05-30', { tummyTime: true, tummyTimeCount: undefined }),
    ]
    const result = computeDailyStats(entries, '2026-05-30', '2026-05-30')
    expect(result[0].tummyCount).toBe(1)
  })

  it('legacy tummyTime false contributes 0 sessions', () => {
    const entries = [
      makeEntry('e1', '2026-05-30', { tummyTime: false, tummyTimeCount: undefined }),
    ]
    const result = computeDailyStats(entries, '2026-05-30', '2026-05-30')
    expect(result[0].tummyCount).toBe(0)
  })

  it('groups multiple entries on the same date', () => {
    const entries = [
      makeEntry('e1', '2026-05-30', { amountMl: 120 }),
      makeEntry('e2', '2026-05-30', { amountMl: 90 }),
      makeEntry('e3', '2026-05-30', { amountMl: 100 }),
    ]
    const result = computeDailyStats(entries, '2026-05-30', '2026-05-30')
    expect(result[0].totalMl).toBe(310)
    expect(result[0].feedCount).toBe(3)
  })

  it('filters out entries outside the date range', () => {
    const entries = [
      makeEntry('e1', '2026-05-28', { amountMl: 100 }),
      makeEntry('e2', '2026-05-30', { amountMl: 120 }),
    ]
    const result = computeDailyStats(entries, '2026-05-30', '2026-05-30')
    expect(result).toHaveLength(1)
    expect(result[0].date).toBe('2026-05-30')
    expect(result[0].totalMl).toBe(120)
  })

  it('null startDate uses earliest entry date', () => {
    const entries = [
      makeEntry('e1', '2026-05-28', { amountMl: 100 }),
      makeEntry('e2', '2026-05-30', { amountMl: 120 }),
    ]
    const result = computeDailyStats(entries, null, '2026-05-30')
    expect(result).toHaveLength(3) // 28, 29, 30
    expect(result[0].date).toBe('2026-05-28')
    expect(result[2].date).toBe('2026-05-30')
  })

  it('fills zero rows for dates with no entries within the range', () => {
    const entries = [
      makeEntry('e1', '2026-05-28', { amountMl: 100 }),
      makeEntry('e2', '2026-05-30', { amountMl: 120 }),
    ]
    const result = computeDailyStats(entries, '2026-05-28', '2026-05-30')
    expect(result).toHaveLength(3)
    expect(result[1]).toEqual({ date: '2026-05-29', totalMl: 0, feedCount: 0, tummyCount: 0 })
  })

  it('returns dates sorted oldest-first', () => {
    const entries = [
      makeEntry('e1', '2026-05-30', { amountMl: 120 }),
      makeEntry('e2', '2026-05-28', { amountMl: 100 }),
    ]
    const result = computeDailyStats(entries, '2026-05-28', '2026-05-30')
    expect(result[0].date).toBe('2026-05-28')
    expect(result[2].date).toBe('2026-05-30')
  })
})

// ── sevenDayRollingAvg ────────────────────────────────────────────────────────

describe('sevenDayRollingAvg', () => {
  it('returns empty array for empty input', () => {
    expect(sevenDayRollingAvg([])).toEqual([])
  })

  it('single day returns that day total', () => {
    expect(sevenDayRollingAvg([{ totalMl: 700 }])).toEqual([700])
  })

  it('averages only available days when fewer than 7', () => {
    const stats = [
      { totalMl: 400 },
      { totalMl: 600 },
      { totalMl: 800 },
    ]
    const result = sevenDayRollingAvg(stats)
    expect(result[0]).toBe(400)            // window = [400]
    expect(result[1]).toBe(500)            // window = [400, 600] → 500
    expect(result[2]).toBe(600)            // window = [400, 600, 800] → 600
  })

  it('uses exactly 7 days once 7 or more are available', () => {
    const stats = Array.from({ length: 8 }, () => ({ totalMl: 700 }))
    const result = sevenDayRollingAvg(stats)
    // All days equal 700; rolling avg at index 7 uses indices 1–7 (7 items, all 700)
    expect(result[7]).toBe(700)
  })

  it('excludes the 8th-previous day from the 7-day window', () => {
    // index 0: 1000, indices 1-7: 100 each
    const stats = [{ totalMl: 1000 }, ...Array.from({ length: 7 }, () => ({ totalMl: 100 }))]
    const result = sevenDayRollingAvg(stats)
    // At index 7: window = indices 1..7 → 7 × 100 = 700 / 7 = 100
    expect(result[7]).toBe(100)
  })
})

// ── groupByMonth ──────────────────────────────────────────────────────────────

describe('groupByMonth', () => {
  it('returns empty array for empty input', () => {
    expect(groupByMonth([])).toEqual([])
  })

  it('groups multiple days in the same month into one row', () => {
    const daily = [
      { date: '2026-01-15', totalMl: 500, feedCount: 4, tummyCount: 1 },
      { date: '2026-01-20', totalMl: 450, feedCount: 3, tummyCount: 0 },
    ]
    const result = groupByMonth(daily)
    expect(result).toHaveLength(1)
    expect(result[0].monthKey).toBe('2026-01')
    expect(result[0].totalMl).toBe(950)
    expect(result[0].feedCount).toBe(7)
    expect(result[0].tummyCount).toBe(1)
  })

  it('produces separate rows for different months', () => {
    const daily = [
      { date: '2026-01-15', totalMl: 500, feedCount: 4, tummyCount: 0 },
      { date: '2026-02-01', totalMl: 600, feedCount: 5, tummyCount: 2 },
    ]
    const result = groupByMonth(daily)
    expect(result).toHaveLength(2)
    expect(result[0].monthKey).toBe('2026-01')
    expect(result[1].monthKey).toBe('2026-02')
    expect(result[1].totalMl).toBe(600)
  })

  it('sorts months oldest-first', () => {
    const daily = [
      { date: '2026-03-01', totalMl: 100, feedCount: 1, tummyCount: 0 },
      { date: '2026-01-01', totalMl: 200, feedCount: 2, tummyCount: 0 },
    ]
    const result = groupByMonth(daily)
    expect(result[0].monthKey).toBe('2026-01')
    expect(result[1].monthKey).toBe('2026-03')
  })

  it('labels months with abbreviated name and year', () => {
    const daily = [{ date: '2026-05-15', totalMl: 300, feedCount: 3, tummyCount: 0 }]
    const result = groupByMonth(daily)
    expect(result[0].label).toBe('May 2026')
  })

  it('zero-fill months carry through correctly', () => {
    const daily = [
      { date: '2026-04-10', totalMl: 0, feedCount: 0, tummyCount: 0 },
      { date: '2026-04-11', totalMl: 0, feedCount: 0, tummyCount: 0 },
    ]
    const result = groupByMonth(daily)
    expect(result).toHaveLength(1)
    expect(result[0].totalMl).toBe(0)
    expect(result[0].feedCount).toBe(0)
  })
})
