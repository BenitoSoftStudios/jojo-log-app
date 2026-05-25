/** Returns today's date as "YYYY-MM-DD" using local date parts (not UTC). */
export function todayString() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Returns the current month key as "YYYY-MM". */
export function currentMonthKey() {
  return todayString().slice(0, 7)
}

/** Format a date string for display: "Mon 16 May". */
export function formatDateLabel(dateString) {
  const d = new Date(dateString + 'T12:00:00')
  return d.toLocaleDateString('en-CA', { weekday: 'short', day: 'numeric', month: 'short' })
}

/** Format a month key "YYYY-MM" for display: "May 2026". */
export function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-')
  const d = new Date(Number(year), Number(month) - 1, 1)
  return d.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })
}

/** Returns age in whole weeks from birthdate string to today. */
export function ageInWeeks(birthdate) {
  if (!birthdate) return null
  const born = new Date(birthdate + 'T12:00:00').getTime()
  const now  = Date.now()
  return Math.floor((now - born) / (7 * 86400000))
}
