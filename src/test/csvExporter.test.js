import { describe, it, expect } from 'vitest'
import { escapeCell, buildCsvRow, generateCsv } from '@/utils/csvExporter.js'

describe('escapeCell', () => {
  it('returns empty string for null', () => {
    expect(escapeCell(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(escapeCell(undefined)).toBe('')
  })

  it('returns plain string unchanged', () => {
    expect(escapeCell('hello')).toBe('hello')
  })

  it('returns number as string', () => {
    expect(escapeCell(120)).toBe('120')
  })

  it('returns 0 as string', () => {
    expect(escapeCell(0)).toBe('0')
  })

  it('returns boolean false as string', () => {
    expect(escapeCell(false)).toBe('false')
  })

  it('returns boolean true as string', () => {
    expect(escapeCell(true)).toBe('true')
  })

  it('wraps value containing comma in double quotes', () => {
    expect(escapeCell('hello, world')).toBe('"hello, world"')
  })

  it('wraps value containing double quote and escapes it', () => {
    expect(escapeCell('say "hi"')).toBe('"say ""hi"""')
  })

  it('wraps value containing newline in double quotes', () => {
    expect(escapeCell('line1\nline2')).toBe('"line1\nline2"')
  })

  it('wraps value containing carriage return in double quotes', () => {
    expect(escapeCell('line1\rline2')).toBe('"line1\rline2"')
  })

  it('handles value with both comma and quote', () => {
    expect(escapeCell('a, "b"')).toBe('"a, ""b"""')
  })
})

const baseEntry = {
  id:              'entry-1',
  entryDate:       '2026-05-12',
  entryTime:       '09:30',
  amountMl:        120,
  diaper:          'W',
  vitaminD:        true,
  medication:      false,
  tummyTimeCount:  2,
  notes:           '',
  source:          'app',
  createdByLabel:  'Mama',
  createdAt:       null,
  updatedByLabel:  null,
  updatedAt:       null,
  deleted:         false,
  deletedAt:       null,
}

describe('buildCsvRow', () => {
  it('returns correct number of comma-separated fields', () => {
    // 20 columns; notes is empty, no quoting needed
    const row = buildCsvRow(baseEntry, 'Jojo', {})
    const cols = row.split(',')
    expect(cols).toHaveLength(20)
  })

  it('includes babyNickname as first field', () => {
    const row = buildCsvRow(baseEntry, 'Jojo', {})
    expect(row.startsWith('Jojo,')).toBe(true)
  })

  it('includes entryId as second field', () => {
    const row = buildCsvRow(baseEntry, 'Jojo', {})
    expect(row.split(',')[1]).toBe('entry-1')
  })

  it('fills usualBottleAmountMl from weeklyAmounts map', () => {
    const weeklyAmounts = { '2026-05-11': 150 }
    const row = buildCsvRow(baseEntry, 'Jojo', weeklyAmounts)
    const cols = row.split(',')
    expect(cols[18]).toBe('150')
  })

  it('outputs empty usualBottleAmountMl when week not in map', () => {
    const row = buildCsvRow(baseEntry, 'Jojo', {})
    const cols = row.split(',')
    expect(cols[18]).toBe('')
  })

  it('outputs tummyTimeDurationSeconds as last column', () => {
    const entry = { ...baseEntry, tummyTimeDurationSeconds: 330 }
    const row = buildCsvRow(entry, 'Jojo', {})
    const cols = row.split(',')
    expect(cols[19]).toBe('330')
  })

  it('outputs empty tummyTimeDurationSeconds when null', () => {
    const row = buildCsvRow(baseEntry, 'Jojo', {})
    const cols = row.split(',')
    expect(cols[19]).toBe('')
  })

  it('quotes notes containing comma', () => {
    const entry = { ...baseEntry, notes: 'fussy, tired' }
    const row = buildCsvRow(entry, 'Jojo', {})
    expect(row).toContain('"fussy, tired"')
  })

  it('quotes notes containing double quote', () => {
    const entry = { ...baseEntry, notes: 'said "hi"' }
    const row = buildCsvRow(entry, 'Jojo', {})
    expect(row).toContain('"said ""hi"""')
  })

  it('quotes notes containing newline', () => {
    const entry = { ...baseEntry, notes: 'line1\nline2' }
    const row = buildCsvRow(entry, 'Jojo', {})
    expect(row).toContain('"line1\nline2"')
  })

  it('outputs false for deleted when entry is not deleted', () => {
    const row = buildCsvRow(baseEntry, 'Jojo', {})
    expect(row).toContain(',false,')
  })

  it('outputs correct weekStartDate for entryDate 2026-05-12 (Monday)', () => {
    const row = buildCsvRow(baseEntry, 'Jojo', {})
    expect(row).toContain('2026-05-11')
  })

  it('handles null amountMl as empty cell', () => {
    const entry = { ...baseEntry, amountMl: null }
    const row = buildCsvRow(entry, 'Jojo', {})
    const cols = row.split(',')
    expect(cols[4]).toBe('')
  })

  it('handles amountMl of 0 as "0" cell', () => {
    const entry = { ...baseEntry, amountMl: 0 }
    const row = buildCsvRow(entry, 'Jojo', {})
    const cols = row.split(',')
    expect(cols[4]).toBe('0')
  })

  it('converts Firestore-like Timestamp to ISO string', () => {
    const fakeTimestamp = { toDate: () => new Date('2026-05-12T09:30:00.000Z') }
    const entry = { ...baseEntry, createdAt: fakeTimestamp }
    const row = buildCsvRow(entry, 'Jojo', {})
    expect(row).toContain('2026-05-12T09:30:00.000Z')
  })
})

describe('generateCsv', () => {
  it('starts with header row', () => {
    const csv = generateCsv([], 'Jojo', {})
    const firstLine = csv.split('\r\n')[0]
    expect(firstLine).toBe(
      'babyNickname,entryId,entryDate,entryTime,amountMl,diaper,vitaminD,medication,tummyTimeCount,notes,source,createdByLabel,createdAt,updatedByLabel,updatedAt,deleted,deletedAt,weekStartDate,usualBottleAmountMl,tummyTimeDurationSeconds'
    )
  })

  it('returns only header row for empty entries array', () => {
    const csv = generateCsv([], 'Jojo', {})
    expect(csv.split('\r\n')).toHaveLength(1)
  })

  it('returns header + one data row for one entry', () => {
    const csv = generateCsv([baseEntry], 'Jojo', {})
    expect(csv.split('\r\n')).toHaveLength(2)
  })

  it('uses CRLF line endings', () => {
    const csv = generateCsv([baseEntry], 'Jojo', {})
    expect(csv).toContain('\r\n')
  })
})
