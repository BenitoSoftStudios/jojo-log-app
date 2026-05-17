import { describe, it, expect } from 'vitest'
import { groupEntries } from '@/utils/ledgerGrouper.js'
import {
  COMPLETE_ENTRY_W,
  COMPLETE_ENTRY_WP,
  ZERO_ML_ENTRY,
  DELETED_ENTRY,
  INCOMPLETE_NO_ML,
  INCOMPLETE_NO_DIAPER,
  SAME_DAY_A,
  SAME_DAY_B,
  CROSS_MONTH_JAN,
  CROSS_MONTH_FEB,
  CROSS_YEAR_DEC,
  CROSS_YEAR_JAN,
} from './fixtures/entries.fixture.js'

// Helper: flatten all entries across the tree
function allEntries(result) {
  return result.months
    .flatMap(m => m.weekSegments)
    .flatMap(w => w.days)
    .flatMap(d => d.entries)
}

// Helper: find a day node by date across the entire tree
function findDay(result, date) {
  return result.months
    .flatMap(m => m.weekSegments)
    .flatMap(w => w.days)
    .find(d => d.date === date)
}

describe('groupEntries — empty and single', () => {
  it('returns empty months array for empty input', () => {
    expect(groupEntries([])).toEqual({ months: [] })
  })

  it('groups a single entry into one month, one week segment, one day', () => {
    const result = groupEntries([COMPLETE_ENTRY_W])
    expect(result.months).toHaveLength(1)
    expect(result.months[0].weekSegments).toHaveLength(1)
    expect(result.months[0].weekSegments[0].days).toHaveLength(1)
    expect(result.months[0].weekSegments[0].days[0].entries).toHaveLength(1)
  })
})

describe('groupEntries — deleted entries', () => {
  it('excludes deleted entries from the tree', () => {
    const result = groupEntries([COMPLETE_ENTRY_W, DELETED_ENTRY])
    expect(allEntries(result)).toHaveLength(1)
    expect(allEntries(result)[0].id).toBe(COMPLETE_ENTRY_W.id)
  })

  it('returns empty months for an array of only deleted entries', () => {
    expect(groupEntries([DELETED_ENTRY])).toEqual({ months: [] })
  })
})

describe('groupEntries — mL totals', () => {
  it('accumulates amountMl on the month node', () => {
    const result = groupEntries([COMPLETE_ENTRY_W, COMPLETE_ENTRY_WP])
    // both on 2026-03-10, month 2026-03
    expect(result.months[0].totalMl).toBe(120 + 90)
  })

  it('does not add null amountMl to totalMl', () => {
    const result = groupEntries([INCOMPLETE_NO_ML])
    expect(result.months[0].totalMl).toBe(0)
    expect(result.months[0].weekSegments[0].days[0].totalMl).toBe(0)
  })

  it('does not add 0 amountMl to totalMl', () => {
    const result = groupEntries([ZERO_ML_ENTRY])
    expect(result.months[0].totalMl).toBe(0)
  })
})

describe('groupEntries — feedCount', () => {
  it('counts only entries where amountMl > 0', () => {
    // COMPLETE_W (120) + COMPLETE_WP (90) → 2 feeds; ZERO_ML (0) → not a feed
    const result = groupEntries([COMPLETE_ENTRY_W, COMPLETE_ENTRY_WP, ZERO_ML_ENTRY])
    expect(result.months[0].feedCount).toBe(2)
  })

  it('does not count null amountMl as a feed', () => {
    const result = groupEntries([INCOMPLETE_NO_ML])
    expect(result.months[0].feedCount).toBe(0)
  })
})

describe('groupEntries — hasIncomplete', () => {
  it('sets hasIncomplete true for a day with an incomplete entry', () => {
    const result = groupEntries([INCOMPLETE_NO_ML])
    expect(findDay(result, '2026-03-11').hasIncomplete).toBe(true)
  })

  it('sets hasIncomplete true when diaper is null', () => {
    const result = groupEntries([INCOMPLETE_NO_DIAPER])
    expect(findDay(result, '2026-03-12').hasIncomplete).toBe(true)
  })

  it('sets hasIncomplete false for a day with only complete entries', () => {
    const result = groupEntries([COMPLETE_ENTRY_W])
    expect(findDay(result, '2026-03-10').hasIncomplete).toBe(false)
  })

  it('does not set hasIncomplete for 0 mL with valid diaper', () => {
    // ZERO_ML_ENTRY has amountMl:0, diaper:"P" — both fields present → complete
    const result = groupEntries([ZERO_ML_ENTRY])
    expect(findDay(result, '2026-03-10').hasIncomplete).toBe(false)
  })
})

describe('groupEntries — sorting', () => {
  it('sorts months descending (newest first)', () => {
    const result = groupEntries([CROSS_MONTH_JAN, CROSS_MONTH_FEB])
    expect(result.months[0].monthKey).toBe('2026-02')
    expect(result.months[1].monthKey).toBe('2026-01')
  })

  it('sorts entries within a day ascending by entryTime', () => {
    // Pass B (09:00) before A (06:00); output should be A then B
    const result = groupEntries([SAME_DAY_B, SAME_DAY_A])
    const day = findDay(result, '2026-01-15')
    expect(day.entries[0].id).toBe(SAME_DAY_A.id)  // 06:00
    expect(day.entries[1].id).toBe(SAME_DAY_B.id)  // 09:00
  })

  it('sorts days within a week segment descending', () => {
    // DASH_DIAPER_ENTRY (2026-03-11) and INCOMPLETE_NO_ML (2026-03-11) are on same day;
    // INCOMPLETE_NO_DIAPER (2026-03-12) is a different day.
    // Days should be: 2026-03-12 (newer) then 2026-03-11 (older)
    const result = groupEntries([COMPLETE_ENTRY_W, INCOMPLETE_NO_DIAPER])
    const week = result.months.find(m => m.monthKey === '2026-03').weekSegments[0]
    expect(week.days[0].date).toBe('2026-03-12')
    expect(week.days[1].date).toBe('2026-03-10')
  })
})

describe('groupEntries — cross-month week', () => {
  it('places Jan 31 and Feb 1 in separate month nodes', () => {
    const result = groupEntries([CROSS_MONTH_JAN, CROSS_MONTH_FEB])
    expect(result.months).toHaveLength(2)
    const janMonth = result.months.find(m => m.monthKey === '2026-01')
    const febMonth = result.months.find(m => m.monthKey === '2026-02')
    expect(janMonth).toBeDefined()
    expect(febMonth).toBeDefined()
  })

  it('both months reference the same weekStartDate (2026-01-26)', () => {
    const result = groupEntries([CROSS_MONTH_JAN, CROSS_MONTH_FEB])
    const janWeek = result.months.find(m => m.monthKey === '2026-01').weekSegments[0].weekStartDate
    const febWeek = result.months.find(m => m.monthKey === '2026-02').weekSegments[0].weekStartDate
    expect(janWeek).toBe('2026-01-26')
    expect(febWeek).toBe('2026-01-26')
  })

  it('Jan month total includes only Jan entries', () => {
    const result = groupEntries([CROSS_MONTH_JAN, CROSS_MONTH_FEB])
    const janMonth = result.months.find(m => m.monthKey === '2026-01')
    expect(janMonth.totalMl).toBe(CROSS_MONTH_JAN.amountMl)  // 130
  })

  it('Feb month total includes only Feb entries', () => {
    const result = groupEntries([CROSS_MONTH_JAN, CROSS_MONTH_FEB])
    const febMonth = result.months.find(m => m.monthKey === '2026-02')
    expect(febMonth.totalMl).toBe(CROSS_MONTH_FEB.amountMl)  // 125
  })
})

describe('groupEntries — cross-year boundary', () => {
  it('places Dec 31 2025 and Jan 1 2026 in separate month nodes', () => {
    const result = groupEntries([CROSS_YEAR_DEC, CROSS_YEAR_JAN])
    const decMonth = result.months.find(m => m.monthKey === '2025-12')
    const janMonth = result.months.find(m => m.monthKey === '2026-01')
    expect(decMonth).toBeDefined()
    expect(janMonth).toBeDefined()
  })

  it('both cross-year entries share weekStartDate 2025-12-29', () => {
    const result = groupEntries([CROSS_YEAR_DEC, CROSS_YEAR_JAN])
    const decWeek = result.months.find(m => m.monthKey === '2025-12').weekSegments[0].weekStartDate
    const janWeek = result.months.find(m => m.monthKey === '2026-01').weekSegments[0].weekStartDate
    expect(decWeek).toBe('2025-12-29')
    expect(janWeek).toBe('2025-12-29')
  })
})
