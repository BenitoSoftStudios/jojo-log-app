/**
 * Pure normalization and validation functions for legacy feeds → entry schema.
 * No Firebase SDK. No db import. No Firestore reads or writes.
 * No setDoc, getDocs, collection, writeBatch, or serverTimestamp.
 *
 * The migration runner (a future Phase script) is responsible for:
 *   - reading feeds documents from Firestore
 *   - setting createdAt to serverTimestamp() at write time
 *   - calling setDoc with the docId and data returned here
 */
import { checkRowCount, checkTotalMl, checkDateRange } from './migrationChecks.js'

const VALID_DIAPER_VALUES = new Set(['W', 'P', 'WP', '-'])

function normalizeMl(ml) {
  if (ml === '' || ml === null || ml === undefined) return null
  const n = Number(ml)
  return isNaN(n) ? null : n
}

function normalizeDiaper(diaper) {
  if (diaper === null || diaper === undefined || diaper === '') return null
  if (diaper === 'none') return '-'  // no-event intended; see plan section 11 note
  return diaper                       // "W", "P", "WP", "-" → direct copy
}

/**
 * Maps one raw feeds document to a normalized entry object.
 *
 * Returns { docId, data } where:
 *   - docId is the Firestore document ID to use (equals feedDoc.id)
 *   - data is the plain object to write (caller adds createdAt: serverTimestamp())
 *
 * @param {object} feedDoc  raw feeds document from Firestore
 * @returns {{ docId: string, data: object }}
 */
export function normalizeLegacyFeedToEntry(feedDoc) {
  return {
    docId: feedDoc.id,
    data: {
      entryDate:       feedDoc.date,
      entryTime:       feedDoc.time,
      amountMl:        normalizeMl(feedDoc.ml),
      diaper:          normalizeDiaper(feedDoc.diaper),
      vitaminD:        feedDoc.vitd === 1,
      medication:      false,
      notes:           feedDoc.notes ?? '',
      source:          'legacy',
      createdByUserId: null,
      createdByLabel:  'Legacy',
      createdAt:       null,       // migration runner sets to serverTimestamp()
      updatedAt:       null,       // migration is not a user edit
      updatedByUserId: null,
      updatedByLabel:  null,
      deleted:         false,
      deletedAt:       null,
      deletedByUserId: null,
      deletedByLabel:  null,
    },
  }
}

/**
 * Validates that a normalized entry data object has all required fields
 * and expected values.
 *
 * @param {object} entry  the data object from normalizeLegacyFeedToEntry
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateNormalizedEntry(entry) {
  const errors = []

  if (!entry.entryDate || !/^\d{4}-\d{2}-\d{2}$/.test(entry.entryDate)) {
    errors.push('entryDate is missing or not in YYYY-MM-DD format')
  }
  if (!entry.entryTime || !/^\d{2}:\d{2}$/.test(entry.entryTime)) {
    errors.push('entryTime is missing or not in HH:mm format')
  }
  if (entry.amountMl !== null && typeof entry.amountMl !== 'number') {
    errors.push(`amountMl must be a number or null; got ${typeof entry.amountMl}`)
  }
  if (entry.diaper !== null && !VALID_DIAPER_VALUES.has(entry.diaper)) {
    errors.push(`diaper value "${entry.diaper}" is not valid; expected W, P, WP, -, or null`)
  }
  if (entry.source !== 'legacy') {
    errors.push('source must be "legacy"')
  }
  if (entry.createdByLabel !== 'Legacy') {
    errors.push('createdByLabel must be "Legacy"')
  }
  if (entry.createdByUserId !== null) {
    errors.push('createdByUserId must be null for legacy entries')
  }
  if (entry.deleted !== false) {
    errors.push('deleted must be false for freshly migrated entries')
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Convenience wrapper: compares a legacy feeds array against a normalized
 * entries array for row count, total mL, and date range.
 *
 * @param {object[]} legacyFeeds       raw feeds documents
 * @param {object[]} normalizedEntries normalized entry data objects
 * @returns {{ rowCountMatch, totalMlMatch, dateRangeMatch, errors: string[] }}
 */
export function compareLegacyAndNormalizedTotals(legacyFeeds, normalizedEntries) {
  const errors = []

  const rowResult  = checkRowCount(legacyFeeds, normalizedEntries)
  const mlResult   = checkTotalMl(legacyFeeds, normalizedEntries)
  const dateResult = checkDateRange(legacyFeeds, normalizedEntries)

  if (!rowResult.match) {
    errors.push(`Row count mismatch: legacy ${rowResult.legacyCount}, normalized ${rowResult.normalizedCount}`)
  }
  if (!mlResult.match) {
    errors.push(`Total mL mismatch: legacy ${mlResult.legacyTotalMl}, normalized ${mlResult.normalizedTotalMl}`)
  }
  if (!dateResult.match) {
    errors.push(`Date range mismatch: legacy [${dateResult.legacyOldest} – ${dateResult.legacyNewest}], normalized [${dateResult.normalizedOldest} – ${dateResult.normalizedNewest}]`)
  }

  return {
    rowCountMatch:  rowResult.match,
    totalMlMatch:   mlResult.match,
    dateRangeMatch: dateResult.match,
    errors,
  }
}
