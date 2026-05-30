// Pure graph data utilities — no Vue reactivity. All functions are testable in isolation.

/** Add n calendar days to a YYYY-MM-DD date string. n may be negative. */
export function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

/**
 * Build a complete list of YYYY-MM-DD strings from startDate to endDate (inclusive),
 * sorted oldest-first.
 */
export function buildDateRange(startDate, endDate) {
  const dates = []
  let cur = startDate
  while (cur <= endDate) {
    dates.push(cur)
    cur = addDays(cur, 1)
  }
  return dates
}

/**
 * Compute per-day stats for the given entries.
 *
 * Rules:
 * - Deleted entries are excluded.
 * - Both 'app' and 'legacy' source entries are included.
 * - startDate null → uses the earliest non-deleted entry's date.
 * - Every date in [startDate, endDate] is represented; days with no entries have zero values.
 * - tummyCount uses tummyTimeCount field when present; falls back to legacy boolean tummyTime.
 *
 * @param {Array}       entries   raw entry objects (may include deleted)
 * @param {string|null} startDate YYYY-MM-DD, or null to use earliest entry date
 * @param {string}      endDate   YYYY-MM-DD
 * @returns {Array<{date, totalMl, feedCount, tummyCount}>} sorted oldest-first
 */
export function computeDailyStats(entries, startDate, endDate) {
  const active = entries.filter(e => !e.deleted)
  if (active.length === 0) return []

  let start = startDate
  if (!start) {
    start = active.reduce(
      (min, e) => (e.entryDate < min ? e.entryDate : min),
      active[0].entryDate
    )
  }

  const dates = buildDateRange(start, endDate)
  const byDate = Object.fromEntries(
    dates.map(d => [d, { date: d, totalMl: 0, feedCount: 0, tummyCount: 0 }])
  )

  for (const e of active) {
    const row = byDate[e.entryDate]
    if (!row) continue
    if (typeof e.amountMl === 'number') {
      row.totalMl += e.amountMl
      if (e.amountMl > 0) row.feedCount++
    }
    row.tummyCount += e.tummyTimeCount ?? (e.tummyTime ? 1 : 0)
  }

  return dates.map(d => byDate[d])
}

/**
 * Compute the 7-day trailing rolling average of totalMl for each position in dailyStats.
 * For the first N < 7 days, averages only the available days.
 *
 * @param {Array<{totalMl}>} dailyStats sorted oldest-first
 * @returns {Array<number>} one rounded integer per input row
 */
export function sevenDayRollingAvg(dailyStats) {
  return dailyStats.map((_, i) => {
    const win = dailyStats.slice(Math.max(0, i - 6), i + 1)
    return Math.round(win.reduce((s, d) => s + d.totalMl, 0) / win.length)
  })
}
