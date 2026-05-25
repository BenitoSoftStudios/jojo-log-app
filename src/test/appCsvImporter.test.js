import { describe, it, expect } from 'vitest'
import { parseAppCsv } from '@/utils/appCsvImporter.js'

const HEADER = 'babyNickname,entryId,entryDate,entryTime,amountMl,diaper,vitaminD,medication,tummyTimeCount,notes,source,createdByLabel,createdAt,updatedByLabel,updatedAt,deleted,deletedAt,weekStartDate,usualBottleAmountMl'

function makeRow(overrides = {}) {
  const defaults = {
    babyNickname:        'Jojo',
    entryId:             'abc123',
    entryDate:           '2026-03-15',
    entryTime:           '08:00',
    amountMl:            '120',
    diaper:              'W',
    vitaminD:            'false',
    medication:          'false',
    tummyTimeCount:      '0',
    notes:               '',
    source:              'app',
    createdByLabel:      'Dad',
    createdAt:           '2026-03-15T08:00:00.000Z',
    updatedByLabel:      '',
    updatedAt:           '',
    deleted:             'false',
    deletedAt:           '',
    weekStartDate:       '2026-03-09',
    usualBottleAmountMl: '120',
  }
  const row = { ...defaults, ...overrides }
  return Object.values(row).join(',')
}

function csv(...rows) {
  return [HEADER, ...rows].join('\n')
}

// ── Header validation ───────────────────────────────────────────────────────

describe('parseAppCsv — header validation', () => {
  it('accepts correct headers', () => {
    const { errors } = parseAppCsv(csv(makeRow()))
    expect(errors).toHaveLength(0)
  })

  it('rejects wrong headers', () => {
    const badCsv = 'Date,Time,Amount (mL),Diaper,VitaminD,Notes\n2026-03-15,08:00,120,W,false,'
    const { errors, preview } = parseAppCsv(badCsv)
    expect(errors[0]).toContain('does not match the Jojo export format')
    expect(preview).toBeNull()
  })

  it('rejects empty file', () => {
    const { errors, preview } = parseAppCsv('')
    expect(errors[0]).toContain('empty')
    expect(preview).toBeNull()
  })

  it('rejects header-only with missing columns', () => {
    const { errors } = parseAppCsv('babyNickname,entryId,entryDate')
    expect(errors[0]).toContain('does not match the Jojo export format')
  })
})

// ── entryId validation ──────────────────────────────────────────────────────

describe('parseAppCsv — entryId validation', () => {
  it('rejects blank entryId', () => {
    const { errors, entries } = parseAppCsv(csv(makeRow({ entryId: '' })))
    expect(errors.some(e => e.includes('blank entryId'))).toBe(true)
    expect(entries).toHaveLength(0)
  })

  it('rejects duplicate entryId', () => {
    const { errors } = parseAppCsv(csv(makeRow({ entryId: 'dup1' }), makeRow({ entryId: 'dup1' })))
    expect(errors.some(e => e.includes('Duplicate entryId'))).toBe(true)
  })

  it('accepts unique entryIds', () => {
    const { errors } = parseAppCsv(csv(makeRow({ entryId: 'a1' }), makeRow({ entryId: 'a2' })))
    expect(errors).toHaveLength(0)
  })

  it('uses entryId as entry.id', () => {
    const { entries } = parseAppCsv(csv(makeRow({ entryId: 'myId' })))
    expect(entries[0].id).toBe('myId')
  })
})

// ── amountMl parsing ────────────────────────────────────────────────────────

describe('parseAppCsv — amountMl', () => {
  it('parses numeric string to number', () => {
    const { entries } = parseAppCsv(csv(makeRow({ amountMl: '120' })))
    expect(entries[0].amountMl).toBe(120)
  })

  it('parses blank to null', () => {
    const { entries } = parseAppCsv(csv(makeRow({ amountMl: '' })))
    expect(entries[0].amountMl).toBeNull()
  })

  it('parses 0 to 0', () => {
    const { entries } = parseAppCsv(csv(makeRow({ amountMl: '0' })))
    expect(entries[0].amountMl).toBe(0)
  })

  it('parses non-numeric string to null', () => {
    const { entries } = parseAppCsv(csv(makeRow({ amountMl: 'abc' })))
    expect(entries[0].amountMl).toBeNull()
  })
})

// ── diaper parsing ──────────────────────────────────────────────────────────

describe('parseAppCsv — diaper', () => {
  it.each(['W', 'P', 'WP', '-'])('accepts diaper value %s', (val) => {
    const { entries } = parseAppCsv(csv(makeRow({ diaper: val })))
    expect(entries[0].diaper).toBe(val)
  })

  it('parses blank diaper to null', () => {
    const { entries } = parseAppCsv(csv(makeRow({ diaper: '' })))
    expect(entries[0].diaper).toBeNull()
  })

  it('parses unknown diaper value to null', () => {
    const { entries } = parseAppCsv(csv(makeRow({ diaper: 'X' })))
    expect(entries[0].diaper).toBeNull()
  })
})

// ── boolean fields ──────────────────────────────────────────────────────────

describe('parseAppCsv — boolean fields', () => {
  it('parses vitaminD "true" → true', () => {
    const { entries } = parseAppCsv(csv(makeRow({ vitaminD: 'true' })))
    expect(entries[0].vitaminD).toBe(true)
  })

  it('parses vitaminD "false" → false', () => {
    const { entries } = parseAppCsv(csv(makeRow({ vitaminD: 'false' })))
    expect(entries[0].vitaminD).toBe(false)
  })

  it('parses medication "true" → true', () => {
    const { entries } = parseAppCsv(csv(makeRow({ medication: 'true' })))
    expect(entries[0].medication).toBe(true)
  })

  it('parses deleted "true" → true', () => {
    const { entries } = parseAppCsv(csv(makeRow({ deleted: 'true' })))
    expect(entries[0].deleted).toBe(true)
  })

  it('parses deleted "false" → false', () => {
    const { entries } = parseAppCsv(csv(makeRow({ deleted: 'false' })))
    expect(entries[0].deleted).toBe(false)
  })
})

// ── tummyTimeCount ──────────────────────────────────────────────────────────

describe('parseAppCsv — tummyTimeCount', () => {
  it('parses blank to 0', () => {
    const { entries } = parseAppCsv(csv(makeRow({ tummyTimeCount: '' })))
    expect(entries[0].tummyTimeCount).toBe(0)
  })

  it('parses "3" to 3', () => {
    const { entries } = parseAppCsv(csv(makeRow({ tummyTimeCount: '3' })))
    expect(entries[0].tummyTimeCount).toBe(3)
  })
})

// ── timestamp fields ────────────────────────────────────────────────────────

describe('parseAppCsv — timestamp fields', () => {
  it('preserves ISO createdAt string', () => {
    const ts = '2026-03-15T08:00:00.000Z'
    const { entries } = parseAppCsv(csv(makeRow({ createdAt: ts })))
    expect(entries[0].createdAt).toBe(ts)
  })

  it('converts blank createdAt to null', () => {
    const { entries } = parseAppCsv(csv(makeRow({ createdAt: '' })))
    expect(entries[0].createdAt).toBeNull()
  })

  it('converts blank updatedAt to null', () => {
    const { entries } = parseAppCsv(csv(makeRow({ updatedAt: '' })))
    expect(entries[0].updatedAt).toBeNull()
  })

  it('converts blank deletedAt to null', () => {
    const { entries } = parseAppCsv(csv(makeRow({ deletedAt: '' })))
    expect(entries[0].deletedAt).toBeNull()
  })
})

// ── preview stats ───────────────────────────────────────────────────────────

describe('parseAppCsv — preview stats', () => {
  it('reports rowCount', () => {
    const { preview } = parseAppCsv(csv(makeRow({ entryId: 'e1' }), makeRow({ entryId: 'e2' })))
    expect(preview.rowCount).toBe(2)
  })

  it('reports totalMl from non-deleted entries only', () => {
    const { preview } = parseAppCsv(csv(
      makeRow({ entryId: 'e1', amountMl: '100', deleted: 'false' }),
      makeRow({ entryId: 'e2', amountMl: '80',  deleted: 'true' }),
    ))
    expect(preview.totalMl).toBe(100)
  })

  it('reports deletedCount', () => {
    const { preview } = parseAppCsv(csv(
      makeRow({ entryId: 'e1', deleted: 'false' }),
      makeRow({ entryId: 'e2', deleted: 'true' }),
    ))
    expect(preview.deletedCount).toBe(1)
  })

  it('reports dateRange min/max', () => {
    const { preview } = parseAppCsv(csv(
      makeRow({ entryId: 'e1', entryDate: '2026-03-01' }),
      makeRow({ entryId: 'e2', entryDate: '2026-03-15' }),
    ))
    expect(preview.dateRange).toEqual({ min: '2026-03-01', max: '2026-03-15' })
  })

  it('reports unique sources', () => {
    const { preview } = parseAppCsv(csv(
      makeRow({ entryId: 'e1', source: 'app' }),
      makeRow({ entryId: 'e2', source: 'legacy' }),
      makeRow({ entryId: 'e3', source: 'app' }),
    ))
    expect(preview.sources).toEqual(['app', 'legacy'])
  })

  it('reports skippedRows for blank entryId', () => {
    const { preview } = parseAppCsv(csv(
      makeRow({ entryId: '' }),
      makeRow({ entryId: 'ok1' }),
    ))
    expect(preview.skippedRows).toBe(1)
    expect(preview.rowCount).toBe(1)
  })
})

// ── baby name tracking ──────────────────────────────────────────────────────

describe('parseAppCsv — baby name tracking', () => {
  it('reports single consistent babyNickname', () => {
    const { preview } = parseAppCsv(csv(
      makeRow({ entryId: 'e1', babyNickname: 'Jojo' }),
      makeRow({ entryId: 'e2', babyNickname: 'Jojo' }),
    ))
    expect(preview.babyNames).toEqual(['Jojo'])
    expect(preview.hasBlankBabyName).toBe(false)
  })

  it('reports multiple distinct babyNicknames sorted', () => {
    const { preview } = parseAppCsv(csv(
      makeRow({ entryId: 'e1', babyNickname: 'Zoe' }),
      makeRow({ entryId: 'e2', babyNickname: 'Jojo' }),
    ))
    expect(preview.babyNames).toEqual(['Jojo', 'Zoe'])
    expect(preview.hasBlankBabyName).toBe(false)
  })

  it('sets hasBlankBabyName when any row has blank babyNickname', () => {
    const { preview } = parseAppCsv(csv(
      makeRow({ entryId: 'e1', babyNickname: 'Jojo' }),
      makeRow({ entryId: 'e2', babyNickname: '' }),
    ))
    expect(preview.hasBlankBabyName).toBe(true)
    expect(preview.babyNames).toEqual(['Jojo'])
  })

  it('reports empty babyNames and hasBlankBabyName when all rows blank', () => {
    const { preview } = parseAppCsv(csv(
      makeRow({ entryId: 'e1', babyNickname: '' }),
    ))
    expect(preview.babyNames).toEqual([])
    expect(preview.hasBlankBabyName).toBe(true)
  })

  it('does not include babyNickname in entry fields', () => {
    const { entries } = parseAppCsv(csv(makeRow({ babyNickname: 'Jojo' })))
    expect(entries[0]).not.toHaveProperty('babyNickname')
  })

  it('skipped rows do not contribute to babyNames', () => {
    const { preview } = parseAppCsv(csv(
      makeRow({ entryId: '', babyNickname: 'Ghost' }),
      makeRow({ entryId: 'e1', babyNickname: 'Jojo' }),
    ))
    expect(preview.babyNames).toEqual(['Jojo'])
  })
})
