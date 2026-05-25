/**
 * Pure CSV parse + transform + validate for the legacy care log CSV.
 * No Firebase imports. No side effects. Testable in isolation.
 *
 * Expected input columns: Date, Time, Amount (mL), Diaper, VitaminD, Notes
 */

// ── Low-level CSV parser ────────────────────────────────────────────────────
// Handles quoted fields, commas inside quotes, double-quote escaping (""),
// and newlines inside quoted fields (notes may span multiple lines).

function parseCsv(text) {
  const rows = []
  let i = 0
  const n = text.length

  while (i < n) {
    const row = []

    while (i < n) {
      if (text[i] === '"') {
        // Quoted field
        i++ // skip opening quote
        let field = ''
        while (i < n) {
          if (text[i] === '"') {
            if (i + 1 < n && text[i + 1] === '"') {
              field += '"'
              i += 2
            } else {
              i++ // skip closing quote
              break
            }
          } else {
            field += text[i++]
          }
        }
        row.push(field)
      } else {
        // Unquoted field — read until comma or line ending
        let field = ''
        while (i < n && text[i] !== ',' && text[i] !== '\n' && text[i] !== '\r') {
          field += text[i++]
        }
        row.push(field)
      }

      if (i < n && text[i] === ',') {
        i++ // move to next field
      } else {
        break // end of row
      }
    }

    // Skip CRLF or LF
    if (i < n && text[i] === '\r') i++
    if (i < n && text[i] === '\n') i++

    rows.push(row)
  }

  return rows
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Parse the raw CSV text into an array of raw row objects.
 * Header row is skipped. Blank rows are skipped.
 * Each row gets a 1-based _rowIndex used to generate deterministic IDs.
 */
export function parseRows(text) {
  const all = parseCsv(text)
  if (all.length === 0) return []

  const rawRows = []
  let rowIndex  = 0

  for (let i = 1; i < all.length; i++) {
    const cols = all[i]
    if (cols.length <= 1 && (cols[0] ?? '').trim() === '') continue
    rowIndex++
    rawRows.push({
      Date:          (cols[0] ?? '').trim(),
      Time:          (cols[1] ?? '').trim(),
      'Amount (mL)': (cols[2] ?? '').trim(),
      Diaper:        (cols[3] ?? '').trim(),
      VitaminD:      (cols[4] ?? '').trim(),
      Notes:         cols[5] ?? '',
      _rowIndex:     rowIndex,
    })
  }

  return rawRows
}

/**
 * Transform raw rows into entry-shaped objects with deterministic IDs.
 * IDs follow the pattern: legacy-csv-000001 … legacy-csv-NNNNNN
 * No Firestore timestamps are set here — that belongs in the write phase.
 */
export function transformRows(rawRows) {
  return rawRows.map(raw => {
    const id = 'legacy-csv-' + String(raw._rowIndex).padStart(6, '0')

    const amtStr   = raw['Amount (mL)']
    let amountMl   = null
    if (amtStr !== '') {
      const parsed = parseInt(amtStr, 10)
      if (!isNaN(parsed)) amountMl = parsed
    }

    const diaperRaw = raw.Diaper
    let diaper      = null
    if      (diaperRaw === 'none') diaper = '-'
    else if (diaperRaw !== '')     diaper = diaperRaw

    const vitaminD = raw.VitaminD.toLowerCase() === 'yes'

    return {
      id,
      entryDate:       raw.Date,
      entryTime:       raw.Time,
      amountMl,
      diaper,
      vitaminD,
      medication:      false,
      tummyTimeCount:  0,
      notes:           raw.Notes,
      source:          'legacy',
      createdByLabel:  'Legacy',
      createdByUserId: null,
      deleted:         false,
      deletedAt:       null,
      deletedByLabel:  null,
      deletedByUserId: null,
      updatedAt:       null,
      updatedByLabel:  null,
      updatedByUserId: null,
    }
  })
}

/**
 * Validate an array of transformed entries and return summary counts.
 * Errors block import. Warnings are shown but do not block.
 */
export function validateRows(entries) {
  let totalMl         = 0
  let blankAmountRows = 0
  let blankDiaperRows = 0
  let diaperNoneRows  = 0
  let zeroMlRows      = 0
  let vitaminDYesRows = 0
  let notesRows       = 0
  const dates         = []
  const dateTimeMap   = {}
  const errors        = []

  for (const e of entries) {
    if (e.amountMl === null) {
      blankAmountRows++
    } else {
      totalMl += e.amountMl
      if (e.amountMl === 0) zeroMlRows++
    }

    if (e.diaper === null) blankDiaperRows++
    if (e.diaper === '-')  diaperNoneRows++

    if (e.vitaminD) vitaminDYesRows++
    if (e.notes && e.notes.trim() !== '') notesRows++

    if (e.entryDate) dates.push(e.entryDate)

    const key = `${e.entryDate}|${e.entryTime}`
    if (!dateTimeMap[key]) dateTimeMap[key] = []
    dateTimeMap[key].push(e.id)
  }

  const duplicates = []
  for (const [key, ids] of Object.entries(dateTimeMap)) {
    if (ids.length > 1) {
      const [entryDate, entryTime] = key.split('|')
      duplicates.push({ entryDate, entryTime, ids })
    }
  }

  dates.sort()
  const dateRange = dates.length
    ? { min: dates[0], max: dates[dates.length - 1] }
    : null

  const warnings = duplicates.length > 0
    ? [`${duplicates.length} duplicate Date+Time pair(s) — each gets a unique ID`]
    : []

  return {
    rowCount:        entries.length,
    dateRange,
    totalMl,
    blankAmountRows,
    blankDiaperRows,
    diaperNoneRows,
    zeroMlRows,
    vitaminDYesRows,
    notesRows,
    duplicates,
    errors,
    warnings,
  }
}
