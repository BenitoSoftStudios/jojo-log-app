import { describe, it, expect } from 'vitest'
import { applyLedgerSortOrder } from '@/utils/ledgerSort.js'

// ── Minimal fixture helpers ────────────────────────────────────────────────

function mkEntry(id, date, time) {
  return { id, entryDate: date, entryTime: time, amountMl: 100, diaper: 'W',
           vitaminD: false, medication: false, tummyTimeCount: 0, notes: '', deleted: false }
}

function mkDay(date, ...entries) {
  return { date, label: date, totalMl: 0, hasIncomplete: false, entries }
}

function mkWeek(weekStartDate, ...days) {
  return { weekStartDate, label: weekStartDate, totalMl: 0, days }
}

function mkMonth(monthKey, ...weekSegments) {
  return { monthKey, label: monthKey, totalMl: 0, feedCount: 0, weekSegments }
}

/**
 * Grouped fixture mirroring groupEntries() output:
 *   months DESC (2026-05 first, 2026-04 second)
 *   weeks  DESC within each month
 *   days   DESC within each week
 *   entries ASC by entryTime within each day
 *
 * Structure:
 *   2026-05
 *     week 2026-05-11
 *       day 2026-05-15 → entries 09:00, 12:00
 *       day 2026-05-14 → entry   08:00
 *   2026-04
 *     week 2026-04-27
 *       day 2026-04-30 → entry   10:00
 */
const GROUPED = {
  months: [
    mkMonth('2026-05',
      mkWeek('2026-05-11',
        mkDay('2026-05-15',
          mkEntry('e-may15-a', '2026-05-15', '09:00'),
          mkEntry('e-may15-b', '2026-05-15', '12:00'),
        ),
        mkDay('2026-05-14',
          mkEntry('e-may14-a', '2026-05-14', '08:00'),
        ),
      ),
    ),
    mkMonth('2026-04',
      mkWeek('2026-04-27',
        mkDay('2026-04-30',
          mkEntry('e-apr30-a', '2026-04-30', '10:00'),
        ),
      ),
    ),
  ],
}

// ── newest-first (default) ─────────────────────────────────────────────────

describe('applyLedgerSortOrder — newest-first', () => {
  const result = applyLedgerSortOrder(GROUPED, 'newest-first')

  it('newest month is first', () => {
    expect(result.months[0].monthKey).toBe('2026-05')
    expect(result.months[1].monthKey).toBe('2026-04')
  })

  it('newest day in the week is first', () => {
    const days = result.months[0].weekSegments[0].days
    expect(days[0].date).toBe('2026-05-15')
    expect(days[1].date).toBe('2026-05-14')
  })

  it('entries within a day are sorted ASC (for CareDay to reverse to newest-first)', () => {
    const entries = result.months[0].weekSegments[0].days[0].entries
    expect(entries[0].entryTime).toBe('09:00')
    expect(entries[1].entryTime).toBe('12:00')
  })

  it('does not mutate the original grouped tree', () => {
    expect(GROUPED.months[0].weekSegments[0].days[0].entries[0].entryTime).toBe('09:00')
  })
})

// ── oldest-first ───────────────────────────────────────────────────────────

describe('applyLedgerSortOrder — oldest-first', () => {
  const result = applyLedgerSortOrder(GROUPED, 'oldest-first')

  it('oldest month is first', () => {
    expect(result.months[0].monthKey).toBe('2026-04')
    expect(result.months[1].monthKey).toBe('2026-05')
  })

  it('oldest day in the week is first', () => {
    const days = result.months[1].weekSegments[0].days  // 2026-05 is now index 1
    expect(days[0].date).toBe('2026-05-14')
    expect(days[1].date).toBe('2026-05-15')
  })

  it('entries within a day are sorted ASC (oldest first, for CareDay to keep as-is)', () => {
    const entries = result.months[1].weekSegments[0].days[1].entries  // 2026-05-15
    expect(entries[0].entryTime).toBe('09:00')
    expect(entries[1].entryTime).toBe('12:00')
  })

  it('does not mutate the original grouped tree', () => {
    expect(GROUPED.months[0].monthKey).toBe('2026-05')
  })
})

// ── same-time entries: id tiebreaker ──────────────────────────────────────

describe('applyLedgerSortOrder — same entryTime stable sort', () => {
  const sameTimeGrouped = {
    months: [
      mkMonth('2026-05',
        mkWeek('2026-05-11',
          mkDay('2026-05-15',
            mkEntry('id-b', '2026-05-15', '09:00'),  // intentionally out of id order
            mkEntry('id-a', '2026-05-15', '09:00'),
            mkEntry('id-c', '2026-05-15', '10:00'),
          ),
        ),
      ),
    ],
  }

  it('entries with same entryTime are ordered ASC by id', () => {
    const result = applyLedgerSortOrder(sameTimeGrouped, 'newest-first')
    const entries = result.months[0].weekSegments[0].days[0].entries
    expect(entries[0].id).toBe('id-a')   // 'id-a' < 'id-b'
    expect(entries[1].id).toBe('id-b')
    expect(entries[2].id).toBe('id-c')
  })
})

// ── invalid / unknown order value ─────────────────────────────────────────

describe('applyLedgerSortOrder — invalid order falls back to newest-first', () => {
  it('unknown string behaves as newest-first', () => {
    const result = applyLedgerSortOrder(GROUPED, 'garbage-value')
    expect(result.months[0].monthKey).toBe('2026-05')
  })

  it('undefined behaves as newest-first', () => {
    const result = applyLedgerSortOrder(GROUPED, undefined)
    expect(result.months[0].monthKey).toBe('2026-05')
  })
})

// ── empty input ────────────────────────────────────────────────────────────

describe('applyLedgerSortOrder — empty grouped', () => {
  it('handles empty months array for newest-first', () => {
    expect(applyLedgerSortOrder({ months: [] }, 'newest-first')).toEqual({ months: [] })
  })

  it('handles empty months array for oldest-first', () => {
    expect(applyLedgerSortOrder({ months: [] }, 'oldest-first')).toEqual({ months: [] })
  })
})
