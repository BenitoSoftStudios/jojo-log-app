/**
 * Applies the user's display sort order to a grouped ledger tree produced by
 * groupEntries(). Returns a new tree — does not mutate the input.
 *
 * newest-first (default): months DESC → weeks DESC → days DESC → entries ASC
 *   CareDay reverses the ASC entries to DESC via the sortOrder prop.
 *
 * oldest-first: months ASC → weeks ASC → days ASC → entries ASC
 *   CareDay keeps the ASC entries as-is via the sortOrder prop.
 *
 * Any unrecognised order value falls back to newest-first.
 */

function stableSortEntriesAsc(entries) {
  return [...entries].sort((a, b) => {
    if (a.entryTime !== b.entryTime) return a.entryTime < b.entryTime ? -1 : 1
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
  })
}

export function applyLedgerSortOrder(grouped, order) {
  const flip = order === 'oldest-first'

  const months = (flip ? [...grouped.months].reverse() : grouped.months).map(month => ({
    ...month,
    weekSegments: (flip ? [...month.weekSegments].reverse() : month.weekSegments).map(week => ({
      ...week,
      days: (flip ? [...week.days].reverse() : week.days).map(day => ({
        ...day,
        entries: stableSortEntriesAsc(day.entries),
      })),
    })),
  }))

  return { ...grouped, months }
}
