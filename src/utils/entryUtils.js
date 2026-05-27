/**
 * Returns the tummy time count for an entry.
 * Reads tummyTimeCount when present; falls back to legacy boolean tummyTime.
 */
export function getTummyTimeCount(entry) {
  return entry.tummyTimeCount ?? (entry.tummyTime ? 1 : 0)
}

/**
 * An entry is Incomplete when amountMl is null OR diaper is null.
 * 0 mL is valid (not incomplete). "-" diaper is valid (not incomplete).
 */
export function isIncomplete(entry) {
  return entry.amountMl === null || entry.amountMl === undefined
    || entry.diaper === null || entry.diaper === undefined
}

/**
 * A completed feed is one that contributes to mL totals and feed count:
 * amountMl > 0 AND not deleted.
 */
export function isCompletedFeed(entry) {
  return !entry.deleted && typeof entry.amountMl === 'number' && entry.amountMl > 0
}

/**
 * Build the default field values for a New Entry in the Open Day.
 *
 * Rules:
 * - time = lastEntry.entryTime + baby.defaultNextEntryIntervalMinutes
 * - time is capped so it never crosses into the next calendar date
 * - amount = null (not pre-filled; usual bottle is a display reminder only)
 * - diaper, vitaminD, medication, tummyTime, notes all blank/default
 * - timezone: IANA timezone string for the current-time fallback (no lastEntry)
 */
export function buildNewEntryDefaults(lastEntry, baby, weeklySettings, timezone = 'America/Toronto') {
  const intervalMinutes = baby?.defaultNextEntryIntervalMinutes ?? 180

  let prepopTime = null
  if (lastEntry?.entryTime) {
    const [hh, mm] = lastEntry.entryTime.split(':').map(Number)
    const totalMinutes = hh * 60 + mm + intervalMinutes
    const clampedMinutes = Math.min(totalMinutes, 23 * 60 + 59) // cap at 23:59 same day
    const newHh = String(Math.floor(clampedMinutes / 60)).padStart(2, '0')
    const newMm = String(clampedMinutes % 60).padStart(2, '0')
    prepopTime = `${newHh}:${newMm}`
  } else {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(new Date())
    const h = parts.find(p => p.type === 'hour').value.padStart(2, '0')
    const m = parts.find(p => p.type === 'minute').value.padStart(2, '0')
    prepopTime = `${h}:${m}`
  }

  return {
    entryTime:      prepopTime,
    amountMl:       null,
    diaper:         null,
    vitaminD:       false,
    medication:     false,
    tummyTime:      false,
    tummyTimeCount: 0,
    notes:          ''
  }
}

/**
 * Build the date and starter entry fields for Start Next Day.
 * Returns the next calendar date after lastEntryDate.
 */
export function buildStartNextDayEntry(lastEntryDate, baby) {
  const d = new Date(lastEntryDate + 'T12:00:00')
  d.setDate(d.getDate() + 1)
  const nextDate = d.toISOString().slice(0, 10)

  return {
    date: nextDate,
    entryFields: {
      entryTime:      '00:00',
      amountMl:       null,
      diaper:         null,
      vitaminD:       false,
      medication:     false,
      tummyTime:      false,
      tummyTimeCount: 0,
      notes:          ''
    }
  }
}
