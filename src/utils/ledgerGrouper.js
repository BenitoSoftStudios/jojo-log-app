import { weekOf, weekLabel } from './weekUtils.js'
import { isIncomplete } from './entryUtils.js'
import { formatDateLabel, formatMonthLabel } from './dateUtils.js'

/**
 * Groups a flat entry array into the Month → Week Segment → Day hierarchy.
 *
 * Deleted entries are excluded. Ordering:
 *   months DESC, weekSegments DESC, days DESC, entries ASC by entryTime.
 *
 * Cross-month weeks appear under both months with isolated totals — each
 * month node accumulates only its own calendar-month entries.
 *
 * Returns { months: MonthNode[] }.
 */
export function groupEntries(entries) {
  // Build with Maps for O(1) insertion, convert to sorted arrays at the end.
  const monthMap = new Map()

  for (const entry of entries) {
    if (entry.deleted) continue

    const monthKey      = entry.entryDate.slice(0, 7)
    const weekStartDate = weekOf(entry.entryDate)
    const ml            = typeof entry.amountMl === 'number' ? entry.amountMl : 0

    // ── month ──────────────────────────────────────────────────────────────
    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, {
        monthKey,
        label:     formatMonthLabel(monthKey),
        totalMl:   0,
        feedCount: 0,
        _weekMap:  new Map(),
      })
    }
    const month = monthMap.get(monthKey)
    month.totalMl += ml
    if (typeof entry.amountMl === 'number' && entry.amountMl > 0) month.feedCount++

    // ── week segment ────────────────────────────────────────────────────────
    if (!month._weekMap.has(weekStartDate)) {
      month._weekMap.set(weekStartDate, {
        weekStartDate,
        label:   weekLabel(weekStartDate),
        totalMl: 0,
        _dayMap: new Map(),
      })
    }
    const week = month._weekMap.get(weekStartDate)
    week.totalMl += ml

    // ── day ─────────────────────────────────────────────────────────────────
    if (!week._dayMap.has(entry.entryDate)) {
      week._dayMap.set(entry.entryDate, {
        date:            entry.entryDate,
        label:           formatDateLabel(entry.entryDate),
        totalMl:         0,
        hasIncomplete:   false,
        incompleteCount: 0,
        _entries:        [],
      })
    }
    const day = week._dayMap.get(entry.entryDate)
    day.totalMl += ml
    if (isIncomplete(entry)) { day.hasIncomplete = true; day.incompleteCount++ }
    day._entries.push(entry)
  }

  // ── convert Maps → sorted arrays ─────────────────────────────────────────
  const months = Array.from(monthMap.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([, month]) => {
      const weekSegments = Array.from(month._weekMap.entries())
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([, week]) => {
          const days = Array.from(week._dayMap.entries())
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([, day]) => ({
              date:            day.date,
              label:           day.label,
              totalMl:         day.totalMl,
              hasIncomplete:   day.hasIncomplete,
              incompleteCount: day.incompleteCount,
              entries:         day._entries
                .slice()
                .sort((a, b) => (a.entryTime < b.entryTime ? -1 : a.entryTime > b.entryTime ? 1 : 0)),
            }))
          return { weekStartDate: week.weekStartDate, label: week.label, totalMl: week.totalMl, days }
        })
      return { monthKey: month.monthKey, label: month.label, totalMl: month.totalMl, feedCount: month.feedCount, weekSegments }
    })

  return { months }
}
