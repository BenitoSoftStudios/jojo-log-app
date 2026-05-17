/**
 * Pure migration check functions.
 * No Firebase SDK. No Firestore reads or writes. No db import.
 *
 * Each function accepts plain arrays and returns a result object.
 * The migration runner fetches the data and passes it in.
 */

/**
 * Compares document counts between legacy feeds and normalized entries.
 * @param {object[]} legacyFeeds       raw feeds documents
 * @param {object[]} normalizedEntries normalized entry data objects
 */
export function checkRowCount(legacyFeeds, normalizedEntries) {
  const legacyCount     = legacyFeeds.length
  const normalizedCount = normalizedEntries.length
  const match           = legacyCount === normalizedCount
  return { match, legacyCount, normalizedCount }
}

/**
 * Compares total mL between legacy feeds (ml field) and normalized entries (amountMl field).
 * Treats "" and NaN as 0 in legacy data; treats null as 0 in normalized data.
 */
export function checkTotalMl(legacyFeeds, normalizedEntries) {
  const legacyTotalMl = legacyFeeds.reduce((sum, f) => {
    const ml = Number(f.ml)
    return sum + (isNaN(ml) ? 0 : ml)
  }, 0)

  const normalizedTotalMl = normalizedEntries.reduce((sum, e) => {
    return sum + (typeof e.amountMl === 'number' ? e.amountMl : 0)
  }, 0)

  const match = legacyTotalMl === normalizedTotalMl
  return { match, legacyTotalMl, normalizedTotalMl }
}

/**
 * Compares the oldest and newest dates between legacy feeds and normalized entries.
 */
export function checkDateRange(legacyFeeds, normalizedEntries) {
  const legacyDates     = legacyFeeds.map(f => f.date).filter(Boolean).sort()
  const normalizedDates = normalizedEntries.map(e => e.entryDate).filter(Boolean).sort()

  const legacyOldest     = legacyDates[0]     ?? null
  const legacyNewest     = legacyDates[legacyDates.length - 1]         ?? null
  const normalizedOldest = normalizedDates[0]  ?? null
  const normalizedNewest = normalizedDates[normalizedDates.length - 1] ?? null

  const match = legacyOldest === normalizedOldest && legacyNewest === normalizedNewest
  return { match, legacyOldest, legacyNewest, normalizedOldest, normalizedNewest }
}
