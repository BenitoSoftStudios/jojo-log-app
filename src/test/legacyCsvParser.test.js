import { describe, it, expect } from 'vitest'
import { parseRows, transformRows, validateRows } from '@/utils/legacyCsvParser.js'

function makeCsv(dataRows) {
  const header = 'Date,Time,Amount (mL),Diaper,VitaminD,Notes'
  return [header, ...dataRows].join('\r\n')
}

// ── parseRows ───────────────────────────────────────────────────────────────

describe('parseRows', () => {
  it('skips the header row', () => {
    const csv = makeCsv(['2026-03-23,07:00,120,W,,'])
    expect(parseRows(csv)).toHaveLength(1)
  })

  it('skips blank rows', () => {
    const csv = makeCsv(['2026-03-23,07:00,120,W,,', '', '2026-03-23,10:00,90,P,,'])
    expect(parseRows(csv)).toHaveLength(2)
  })

  it('returns empty array for header-only CSV', () => {
    expect(parseRows('Date,Time,Amount (mL),Diaper,VitaminD,Notes')).toHaveLength(0)
  })

  it('assigns _rowIndex starting at 1', () => {
    const csv = makeCsv(['2026-03-23,07:00,120,W,,', '2026-03-23,10:00,90,P,,'])
    const rows = parseRows(csv)
    expect(rows[0]._rowIndex).toBe(1)
    expect(rows[1]._rowIndex).toBe(2)
  })

  it('parses Date field', () => {
    const csv = makeCsv(['2026-03-23,07:00,120,W,,'])
    expect(parseRows(csv)[0].Date).toBe('2026-03-23')
  })

  it('parses Time field', () => {
    const csv = makeCsv(['2026-03-23,07:15,120,W,,'])
    expect(parseRows(csv)[0].Time).toBe('07:15')
  })

  it('parses Amount field', () => {
    const csv = makeCsv(['2026-03-23,07:00,120,W,,'])
    expect(parseRows(csv)[0]['Amount (mL)']).toBe('120')
  })

  it('parses blank Amount field as empty string', () => {
    const csv = makeCsv(['2026-03-23,07:00,,W,,'])
    expect(parseRows(csv)[0]['Amount (mL)']).toBe('')
  })

  it('trims whitespace from non-Notes fields', () => {
    const csv = makeCsv([' 2026-03-23 , 07:00 , 120 , W , yes ,notes'])
    const row = parseRows(csv)[0]
    expect(row.Date).toBe('2026-03-23')
    expect(row['Amount (mL)']).toBe('120')
    expect(row.Diaper).toBe('W')
    expect(row.VitaminD).toBe('yes')
  })

  it('parses Notes with comma inside double quotes', () => {
    const csv = makeCsv(['2026-03-23,07:00,120,W,,"fussy, tired"'])
    expect(parseRows(csv)[0].Notes).toBe('fussy, tired')
  })

  it('parses Notes with double-quote escaped as ""', () => {
    const csv = makeCsv(['2026-03-23,07:00,120,W,,"said ""hi"""'])
    expect(parseRows(csv)[0].Notes).toBe('said "hi"')
  })

  it('parses Notes with embedded newline inside quotes', () => {
    const csv = 'Date,Time,Amount (mL),Diaper,VitaminD,Notes\r\n2026-03-23,07:00,120,W,,"line1\nline2"\r\n'
    expect(parseRows(csv)[0].Notes).toBe('line1\nline2')
  })

  it('handles LF-only line endings', () => {
    const csv = 'Date,Time,Amount (mL),Diaper,VitaminD,Notes\n2026-03-23,07:00,120,W,,\n2026-03-24,08:00,90,P,,\n'
    expect(parseRows(csv)).toHaveLength(2)
  })
})

// ── transformRows ────────────────────────────────────────────────────────────

describe('transformRows', () => {
  function makeRaw(overrides = {}) {
    return [{
      Date:          '2026-03-23',
      Time:          '07:00',
      'Amount (mL)': '120',
      Diaper:        'W',
      VitaminD:      '',
      Notes:         '',
      _rowIndex:     1,
      ...overrides,
    }]
  }

  it('generates ID legacy-csv-000001 for _rowIndex 1', () => {
    expect(transformRows(makeRaw({ _rowIndex: 1 }))[0].id).toBe('legacy-csv-000001')
  })

  it('generates ID legacy-csv-000652 for _rowIndex 652', () => {
    expect(transformRows(makeRaw({ _rowIndex: 652 }))[0].id).toBe('legacy-csv-000652')
  })

  it('zero-pads ID to 6 digits', () => {
    expect(transformRows(makeRaw({ _rowIndex: 42 }))[0].id).toBe('legacy-csv-000042')
  })

  it('maps Amount (mL) number string to integer', () => {
    expect(transformRows(makeRaw({ 'Amount (mL)': '120' }))[0].amountMl).toBe(120)
  })

  it('maps blank Amount to null', () => {
    expect(transformRows(makeRaw({ 'Amount (mL)': '' }))[0].amountMl).toBeNull()
  })

  it('maps 0 Amount to integer 0', () => {
    expect(transformRows(makeRaw({ 'Amount (mL)': '0' }))[0].amountMl).toBe(0)
  })

  it('maps Diaper W → W', () => {
    expect(transformRows(makeRaw({ Diaper: 'W' }))[0].diaper).toBe('W')
  })

  it('maps Diaper P → P', () => {
    expect(transformRows(makeRaw({ Diaper: 'P' }))[0].diaper).toBe('P')
  })

  it('maps Diaper WP → WP', () => {
    expect(transformRows(makeRaw({ Diaper: 'WP' }))[0].diaper).toBe('WP')
  })

  it('maps Diaper none → -', () => {
    expect(transformRows(makeRaw({ Diaper: 'none' }))[0].diaper).toBe('-')
  })

  it('maps blank Diaper → null', () => {
    expect(transformRows(makeRaw({ Diaper: '' }))[0].diaper).toBeNull()
  })

  it('maps VitaminD yes → true', () => {
    expect(transformRows(makeRaw({ VitaminD: 'yes' }))[0].vitaminD).toBe(true)
  })

  it('maps blank VitaminD → false', () => {
    expect(transformRows(makeRaw({ VitaminD: '' }))[0].vitaminD).toBe(false)
  })

  it('sets source to legacy', () => {
    expect(transformRows(makeRaw())[0].source).toBe('legacy')
  })

  it('sets createdByLabel to Legacy', () => {
    expect(transformRows(makeRaw())[0].createdByLabel).toBe('Legacy')
  })

  it('sets createdByUserId to null', () => {
    expect(transformRows(makeRaw())[0].createdByUserId).toBeNull()
  })

  it('sets medication to false', () => {
    expect(transformRows(makeRaw())[0].medication).toBe(false)
  })

  it('sets tummyTimeCount to 0', () => {
    expect(transformRows(makeRaw())[0].tummyTimeCount).toBe(0)
  })

  it('sets deleted to false', () => {
    expect(transformRows(makeRaw())[0].deleted).toBe(false)
  })

  it('copies notes verbatim including commas and quotes', () => {
    expect(transformRows(makeRaw({ Notes: 'fussy, said "hi"' }))[0].notes).toBe('fussy, said "hi"')
  })

  it('copies notes verbatim including newlines', () => {
    expect(transformRows(makeRaw({ Notes: 'line1\nline2' }))[0].notes).toBe('line1\nline2')
  })

  it('sets blank notes to empty string', () => {
    expect(transformRows(makeRaw({ Notes: '' }))[0].notes).toBe('')
  })
})

// ── validateRows ─────────────────────────────────────────────────────────────

describe('validateRows', () => {
  function makeEntry(overrides = {}) {
    return {
      id:          'legacy-csv-000001',
      entryDate:   '2026-03-23',
      entryTime:   '07:00',
      amountMl:    120,
      diaper:      'W',
      vitaminD:    false,
      notes:       '',
      ...overrides,
    }
  }

  it('counts total rows', () => {
    const r = validateRows([makeEntry(), makeEntry({ id: 'legacy-csv-000002', entryTime: '10:00' })])
    expect(r.rowCount).toBe(2)
  })

  it('sums totalMl for non-null amounts', () => {
    const r = validateRows([makeEntry({ amountMl: 100 }), makeEntry({ amountMl: 50, entryTime: '10:00' })])
    expect(r.totalMl).toBe(150)
  })

  it('excludes null amountMl from totalMl', () => {
    const r = validateRows([makeEntry({ amountMl: 100 }), makeEntry({ amountMl: null, entryTime: '10:00' })])
    expect(r.totalMl).toBe(100)
  })

  it('includes 0 mL in totalMl (adds 0)', () => {
    const r = validateRows([makeEntry({ amountMl: 0 })])
    expect(r.totalMl).toBe(0)
  })

  it('counts blank amount rows', () => {
    expect(validateRows([makeEntry({ amountMl: null })]).blankAmountRows).toBe(1)
  })

  it('counts zero mL rows', () => {
    expect(validateRows([makeEntry({ amountMl: 0 })]).zeroMlRows).toBe(1)
  })

  it('does not count 0 mL row as blank amount row', () => {
    expect(validateRows([makeEntry({ amountMl: 0 })]).blankAmountRows).toBe(0)
  })

  it('counts blank diaper rows (null)', () => {
    expect(validateRows([makeEntry({ diaper: null })]).blankDiaperRows).toBe(1)
  })

  it('counts diaper none rows (diaper === "-")', () => {
    expect(validateRows([makeEntry({ diaper: '-' })]).diaperNoneRows).toBe(1)
  })

  it('does not count "-" diaper as blank', () => {
    expect(validateRows([makeEntry({ diaper: '-' })]).blankDiaperRows).toBe(0)
  })

  it('counts vitaminD yes rows', () => {
    expect(validateRows([makeEntry({ vitaminD: true })]).vitaminDYesRows).toBe(1)
  })

  it('does not count vitaminD false rows', () => {
    expect(validateRows([makeEntry({ vitaminD: false })]).vitaminDYesRows).toBe(0)
  })

  it('counts non-blank notes rows', () => {
    expect(validateRows([makeEntry({ notes: 'fussy' })]).notesRows).toBe(1)
  })

  it('does not count blank notes', () => {
    expect(validateRows([makeEntry({ notes: '' })]).notesRows).toBe(0)
  })

  it('does not count whitespace-only notes', () => {
    expect(validateRows([makeEntry({ notes: '   ' })]).notesRows).toBe(0)
  })

  it('detects duplicate Date+Time rows', () => {
    const r = validateRows([
      makeEntry({ id: 'legacy-csv-000001', entryDate: '2026-03-23', entryTime: '07:00' }),
      makeEntry({ id: 'legacy-csv-000002', entryDate: '2026-03-23', entryTime: '07:00' }),
    ])
    expect(r.duplicates).toHaveLength(1)
    expect(r.duplicates[0].entryDate).toBe('2026-03-23')
    expect(r.duplicates[0].entryTime).toBe('07:00')
    expect(r.duplicates[0].ids).toHaveLength(2)
  })

  it('does not flag unique Date+Time as duplicate', () => {
    const r = validateRows([
      makeEntry({ id: 'legacy-csv-000001', entryTime: '07:00' }),
      makeEntry({ id: 'legacy-csv-000002', entryTime: '10:00' }),
    ])
    expect(r.duplicates).toHaveLength(0)
  })

  it('computes date range min and max', () => {
    const r = validateRows([
      makeEntry({ id: 'legacy-csv-000001', entryDate: '2026-05-24', entryTime: '07:00' }),
      makeEntry({ id: 'legacy-csv-000002', entryDate: '2026-03-23', entryTime: '10:00' }),
    ])
    expect(r.dateRange).toEqual({ min: '2026-03-23', max: '2026-05-24' })
  })

  it('returns null dateRange for empty entries', () => {
    expect(validateRows([]).dateRange).toBeNull()
  })

  it('returns no errors for valid entries', () => {
    expect(validateRows([makeEntry()]).errors).toHaveLength(0)
  })

  it('adds a warning for duplicate Date+Time pairs', () => {
    const r = validateRows([
      makeEntry({ id: 'legacy-csv-000001', entryTime: '07:00' }),
      makeEntry({ id: 'legacy-csv-000002', entryTime: '07:00' }),
    ])
    expect(r.warnings.length).toBeGreaterThan(0)
  })
})
