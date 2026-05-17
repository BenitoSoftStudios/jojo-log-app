/**
 * Computes summary chip stats from a flat entries array.
 *
 * - today:      entries where entryDate === today
 * - sevenDayMl: rolling window [today - 6 days, today] inclusive (7 days total)
 * - monthMl:    entries in the same calendar month as today
 * - feedCount:  entries today where amountMl > 0 (bug-fix over old tf.length)
 *
 * Deleted entries are excluded from all calculations.
 *
 * @param {object[]} entries  flat array including deleted entries
 * @param {string}   today    "YYYY-MM-DD"
 * @returns {{ todayMl: number, sevenDayMl: number, monthMl: number, feedCount: number }}
 */
export function calculateStats(entries, today) {
  const todayMonth = today.slice(0, 7)

  const todayDate     = new Date(today + 'T12:00:00')
  const sevenDayStart = new Date(todayDate)
  sevenDayStart.setDate(todayDate.getDate() - 6)
  const sevenDayStartStr = sevenDayStart.toISOString().slice(0, 10)

  let todayMl   = 0
  let sevenDayMl = 0
  let monthMl   = 0
  let feedCount = 0

  for (const entry of entries) {
    if (entry.deleted) continue
    const ml = typeof entry.amountMl === 'number' ? entry.amountMl : 0

    if (entry.entryDate === today) {
      todayMl += ml
      if (typeof entry.amountMl === 'number' && entry.amountMl > 0) feedCount++
    }

    if (entry.entryDate >= sevenDayStartStr && entry.entryDate <= today) {
      sevenDayMl += ml
    }

    if (entry.entryDate.slice(0, 7) === todayMonth) {
      monthMl += ml
    }
  }

  return { todayMl, sevenDayMl, monthMl, feedCount }
}
