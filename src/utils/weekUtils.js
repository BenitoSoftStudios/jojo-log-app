/**
 * Returns the Monday date string (YYYY-MM-DD) for the ISO week containing dateString.
 * Uses T12:00:00 to avoid DST edge cases — matches the current HTML app's weekOf().
 */
export function weekOf(dateString) {
  const d = new Date(dateString + 'T12:00:00')
  const day = d.getDay() // 0 = Sun, 1 = Mon, …
  const diff = (day === 0 ? -6 : 1 - day) // shift to Monday
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

/** Alias — named for call-site clarity in composables. */
export function getWeekStartForDate(dateString) {
  return weekOf(dateString)
}

/** Returns true if dateString falls within the week starting on weekStartDate. */
export function isInWeek(dateString, weekStartDate) {
  const dayMs = 86400000
  const start = new Date(weekStartDate + 'T12:00:00').getTime()
  const end   = start + 7 * dayMs
  const d     = new Date(dateString + 'T12:00:00').getTime()
  return d >= start && d < end
}

/** Human-readable week label, e.g. "Week of Apr 27". */
export function weekLabel(weekStartDate) {
  const d = new Date(weekStartDate + 'T12:00:00')
  return 'Week of ' + d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
}
