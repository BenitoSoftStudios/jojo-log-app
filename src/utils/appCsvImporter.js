/**
 * Parser and validator for the Jojo app export CSV format.
 * Accepts only the current app export schema — not the legacy care log CSV.
 * No Firebase imports. No side effects. Testable in isolation.
 *
 * Expected headers (in order):
 *   babyNickname, entryId, entryDate, entryTime,
 *   amountMl, diaper, vitaminD, medication,
 *   tummyTimeCount, notes, source, createdByLabel,
 *   createdAt, updatedByLabel, updatedAt,
 *   deleted, deletedAt, weekStartDate, usualBottleAmountMl
 */

const EXPECTED_HEADERS = [
  'babyNickname', 'entryId', 'entryDate', 'entryTime',
  'amountMl', 'diaper', 'vitaminD', 'medication',
  'tummyTimeCount', 'notes', 'source', 'createdByLabel',
  'createdAt', 'updatedByLabel', 'updatedAt',
  'deleted', 'deletedAt', 'weekStartDate', 'usualBottleAmountMl',
]

const ALLOWED_DIAPER = new Set(['W', 'P', 'WP', '-'])

// ── CSV parser ──────────────────────────────────────────────────────────────
// Handles quoted fields, commas inside quotes, double-quote escaping (""),
// and newlines inside quoted fields.

function parseCsv(text) {
  const rows = []
  let i = 0
  const n = text.length

  while (i < n) {
    const row = []

    while (i < n) {
      if (text[i] === '"') {
        i++
        let field = ''
        while (i < n) {
          if (text[i] === '"') {
            if (i + 1 < n && text[i + 1] === '"') {
              field += '"'
              i += 2
            } else {
              i++
              break
            }
          } else {
            field += text[i++]
          }
        }
        row.push(field)
      } else {
        let field = ''
        while (i < n && text[i] !== ',' && text[i] !== '\n' && text[i] !== '\r') {
          field += text[i++]
        }
        row.push(field)
      }

      if (i < n && text[i] === ',') {
        i++
      } else {
        break
      }
    }

    if (i < n && text[i] === '\r') i++
    if (i < n && text[i] === '\n') i++

    rows.push(row)
  }

  return rows
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Parse and validate an app export CSV.
 *
 * Returns:
 *   { entries, errors, preview }
 *
 *   - entries: array of entry objects with `id` set from `entryId` column.
 *     Empty if errors are blocking.
 *   - errors: string array. Any entry here blocks import in the UI.
 *   - preview: summary stats object, or null if headers are wrong.
 */
export function parseAppCsv(text) {
  const all = parseCsv(text)

  if (all.length === 0 || !all[0] || all[0].every(c => !c.trim())) {
    return { entries: [], errors: ['File is empty.'], preview: null }
  }

  // Validate header row.
  const headerRow = all[0].map(h => h.trim())
  const headersMatch = EXPECTED_HEADERS.every((h, i) => headerRow[i] === h)
  if (!headersMatch || headerRow.length < EXPECTED_HEADERS.length) {
    return {
      entries: [],
      errors: ['This file does not match the Jojo export format.'],
      preview: null,
    }
  }

  const idx = {}
  headerRow.forEach((h, i) => { idx[h] = i })

  const entries        = []
  const errors         = []
  let   skippedRows    = 0
  let   hasBlankBabyName = false
  const seenBabyNames  = new Set()

  for (let i = 1; i < all.length; i++) {
    const cols = all[i]
    if (cols.length <= 1 && (cols[0] ?? '').trim() === '') continue

    const get = key => (cols[idx[key]] ?? '').trim()

    const entryId = get('entryId')
    if (!entryId) {
      skippedRows++
      errors.push(`Row ${i}: blank entryId — row skipped.`)
      continue
    }

    const babyNickname = get('babyNickname')
    if (babyNickname === '') { hasBlankBabyName = true } else { seenBabyNames.add(babyNickname) }

    // amountMl: blank → null, numeric string → number
    const amtStr   = get('amountMl')
    let   amountMl = null
    if (amtStr !== '') {
      const n = Number(amtStr)
      if (!isNaN(n)) amountMl = n
    }

    // diaper: blank → null; only allowed values accepted
    const diaperRaw = get('diaper')
    const diaper    = diaperRaw === '' ? null : (ALLOWED_DIAPER.has(diaperRaw) ? diaperRaw : null)

    // booleans: "true" → true, anything else → false
    const vitaminD   = get('vitaminD') === 'true'
    const medication = get('medication') === 'true'
    const deleted    = get('deleted') === 'true'

    // tummyTimeCount: blank → 0, numeric → number
    const ttStr          = get('tummyTimeCount')
    const tummyTimeCount = ttStr === '' ? 0 : (parseInt(ttStr, 10) || 0)

    // tummyTimeDurationSeconds: optional column added in schema v2 — absent in v1 files
    const ttDurStr               = idx['tummyTimeDurationSeconds'] !== undefined ? get('tummyTimeDurationSeconds') : ''
    const tummyTimeDurationSeconds = ttDurStr === '' ? null : (parseInt(ttDurStr, 10) || null)

    // medicationNote: optional column added in schema v3 — absent in v1/v2 files
    const medNoteRaw   = idx['medicationNote'] !== undefined ? get('medicationNote') : ''
    const medicationNote = medNoteRaw === '' ? null : medNoteRaw

    // timestamps preserved as strings; blank → null
    const createdAt  = get('createdAt')  || null
    const updatedAt  = get('updatedAt')  || null
    const deletedAt  = get('deletedAt')  || null

    // notes: preserve verbatim (may include whitespace)
    const notes = cols[idx['notes']] ?? ''

    entries.push({
      id:             entryId,
      entryDate:      get('entryDate'),
      entryTime:      get('entryTime') || null,
      amountMl,
      diaper,
      vitaminD,
      medication,
      medicationNote,
      tummyTimeCount,
      tummyTimeDurationSeconds,
      notes,
      source:         get('source')         || null,
      createdByLabel: get('createdByLabel') || null,
      createdAt,
      updatedByLabel: get('updatedByLabel') || null,
      updatedAt,
      deleted,
      deletedAt,
    })
  }

  // Duplicate entryId check.
  const seen      = new Set()
  const dupIds    = []
  for (const e of entries) {
    if (seen.has(e.id)) dupIds.push(e.id)
    seen.add(e.id)
  }
  if (dupIds.length > 0) {
    const sample = dupIds.slice(0, 3).join(', ')
    errors.push(`Duplicate entryId values: ${sample}${dupIds.length > 3 ? '…' : ''} — import blocked.`)
  }

  const babyNamesArr = [...seenBabyNames].sort()
  const preview = buildPreview(entries, skippedRows, babyNamesArr, hasBlankBabyName)
  return { entries, errors, preview }
}

/**
 * Check which CSV entry IDs already exist in the destination baby.
 * Call this after parseAppCsv(), passing a Set of IDs already in Firestore
 * (include both active and deleted entries so setDoc overwrites are caught).
 *
 * @param {Array}  csvEntries    - from parseAppCsv().entries
 * @param {Set}    existingIdSet - all Firestore entry IDs for the active baby
 * @returns {{ overlapIds: string[], overlapCount: number, newCount: number }}
 */
export function checkForExistingIds(csvEntries, existingIdSet) {
  const overlapIds = []
  for (const e of csvEntries) {
    if (existingIdSet.has(e.id)) overlapIds.push(e.id)
  }
  return {
    overlapIds,
    overlapCount: overlapIds.length,
    newCount: csvEntries.length - overlapIds.length,
  }
}

function buildPreview(entries, skippedRows, babyNames, hasBlankBabyName) {
  let totalMl      = 0
  let deletedCount = 0
  const dates      = []
  const sources    = new Set()

  for (const e of entries) {
    if (e.deleted) deletedCount++
    if (typeof e.amountMl === 'number' && !e.deleted) totalMl += e.amountMl
    if (e.entryDate) dates.push(e.entryDate)
    if (e.source) sources.add(e.source)
  }

  dates.sort()

  return {
    rowCount:     entries.length,
    validRows:    entries.length,
    skippedRows,
    deletedCount,
    totalMl,
    dateRange:    dates.length ? { min: dates[0], max: dates[dates.length - 1] } : null,
    sources:      [...sources].sort(),
    babyNames,
    hasBlankBabyName,
  }
}
