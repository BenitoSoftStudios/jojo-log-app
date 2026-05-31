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
    row.tummyCount += ((e.tummyTimeCount ?? 0) > 0 || e.tummyTime) ? 1 : 0
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

const ML_STEPS = [
  250, 500, 750, 1000, 1250, 1500, 1750, 2000, 2500, 3000,
  4000, 5000, 7500, 10000, 15000, 20000, 25000, 30000,
]

/**
 * Return a rounded axis maximum that is >= rawMax.
 * type: 'ml' | 'count'
 * Keeps the scale human-friendly (e.g. 840 mL → 1000, 21858 mL → 25000, 8 feeds → 10).
 */
export function niceMax(rawMax, type) {
  if (rawMax <= 0) return type === 'ml' ? 500 : 5
  if (type === 'ml') {
    const found = ML_STEPS.find(s => s >= rawMax)
    return found ?? Math.ceil(rawMax / 10000) * 10000
  }
  // counts (feeds, tummy sessions)
  if (rawMax <= 4)  return rawMax + 1
  if (rawMax <= 10) return 10
  return Math.ceil(rawMax / 5) * 5
}

/**
 * Format an axis value for compact display.
 * type: 'ml' → large numbers shown as "1k", "25k"; 'count' → plain string.
 */
export function formatAxisLabel(value, type) {
  if (type !== 'ml') return String(value)
  if (value >= 1000) return `${value / 1000}k`
  return String(value)
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

/**
 * Aggregate daily stats into calendar-month buckets.
 * Used for "Since birth" view when there are more than 30 days of data.
 *
 * @param {Array<{date, totalMl, feedCount, tummyCount}>} dailyStats sorted oldest-first
 * @returns {Array<{monthKey, label, totalMl, feedCount, tummyCount}>} sorted oldest-first
 */
export function groupByMonth(dailyStats) {
  const months = {}
  for (const d of dailyStats) {
    const key = d.date.slice(0, 7)  // 'YYYY-MM'
    if (!months[key]) {
      const [y, m] = key.split('-')
      months[key] = {
        monthKey:   key,
        label:      `${MONTHS[Number(m) - 1]} ${y}`,
        totalMl:    0,
        feedCount:  0,
        tummyCount: 0,
      }
    }
    months[key].totalMl    += d.totalMl
    months[key].feedCount  += d.feedCount
    months[key].tummyCount += d.tummyCount
  }
  return Object.values(months).sort((a, b) => a.monthKey.localeCompare(b.monthKey))
}
