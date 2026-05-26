/** Returns today's date as "YYYY-MM-DD" using local date parts (not UTC). */
export function todayString() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Returns today's date as "YYYY-MM-DD" in the given IANA timezone. */
export function getTodayInTimezone(timezone, now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year:  'numeric',
    month: '2-digit',
    day:   '2-digit',
  }).format(now)
}

/** Returns the current time as "HH:MM" in the given IANA timezone. */
export function getCurrentHHMMInTimezone(timezone, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    hour:   '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now)
  const h = parts.find(p => p.type === 'hour').value.padStart(2, '0')
  const m = parts.find(p => p.type === 'minute').value.padStart(2, '0')
  return `${h}:${m}`
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
