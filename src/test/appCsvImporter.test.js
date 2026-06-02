import { describe, it, expect } from 'vitest'
import { parseAppCsv, checkForExistingIds } from '@/utils/appCsvImporter.js'

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

// ── tummyTimeDurationSeconds ────────────────────────────────────────────────

const V1_HEADER = 'babyNickname,entryId,entryDate,entryTime,amountMl,diaper,vitaminD,medication,tummyTimeCount,notes,source,createdByLabel,createdAt,updatedByLabel,updatedAt,deleted,deletedAt,weekStartDate,usualBottleAmountMl'
const V2_HEADER = V1_HEADER + ',tummyTimeDurationSeconds'
const V3_HEADER = V2_HEADER + ',medicationNote'

describe('parseAppCsv — tummyTimeDurationSeconds', () => {
  it('v1 file (19 cols) parses with tummyTimeDurationSeconds = null', () => {
    const row = makeRow()
    const { entries, errors } = parseAppCsv([V1_HEADER, row].join('\n'))
    expect(errors).toHaveLength(0)
    expect(entries[0].tummyTimeDurationSeconds).toBeNull()
  })

  it('v2 file (20 cols) parses duration correctly', () => {
    const row = makeRow() + ',330'
    const { entries, errors } = parseAppCsv([V2_HEADER, row].join('\n'))
    expect(errors).toHaveLength(0)
    expect(entries[0].tummyTimeDurationSeconds).toBe(330)
  })

  it('v2 file with blank duration gives null', () => {
    const row = makeRow() + ','
    const { entries } = parseAppCsv([V2_HEADER, row].join('\n'))
    expect(entries[0].tummyTimeDurationSeconds).toBeNull()
  })

  it('v2 file with non-numeric duration gives null', () => {
    const row = makeRow() + ',abc'
    const { entries } = parseAppCsv([V2_HEADER, row].join('\n'))
    expect(entries[0].tummyTimeDurationSeconds).toBeNull()
  })
})

// ── medicationNote ──────────────────────────────────────────────────────────

describe('parseAppCsv — medicationNote', () => {
  it('v1 file (19 cols) parses with medicationNote = null', () => {
    const { entries, errors } = parseAppCsv([V1_HEADER, makeRow()].join('\n'))
    expect(errors).toHaveLength(0)
    expect(entries[0].medicationNote).toBeNull()
  })

  it('v2 file (20 cols) parses with medicationNote = null', () => {
    const { entries } = parseAppCsv([V2_HEADER, makeRow() + ','].join('\n'))
    expect(entries[0].medicationNote).toBeNull()
  })

  it('v3 file (21 cols) parses medicationNote correctly', () => {
    const { entries, errors } = parseAppCsv([V3_HEADER, makeRow() + ',,Tylenol 2.5 mL'].join('\n'))
    expect(errors).toHaveLength(0)
    expect(entries[0].medicationNote).toBe('Tylenol 2.5 mL')
  })

  it('v3 file with blank medicationNote gives null', () => {
    const { entries } = parseAppCsv([V3_HEADER, makeRow() + ',330,'].join('\n'))
    expect(entries[0].medicationNote).toBeNull()
  })

  it('v3 file with medicationNote but no duration gives null duration and non-null note', () => {
    const { entries } = parseAppCsv([V3_HEADER, makeRow() + ',,Ibuprofen'].join('\n'))
    expect(entries[0].tummyTimeDurationSeconds).toBeNull()
    expect(entries[0].medicationNote).toBe('Ibuprofen')
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

// ── checkForExistingIds ─────────────────────────────────────────────────────

describe('checkForExistingIds', () => {
  function makeEntries(ids) {
    return ids.map(id => ({ id }))
  }

  it('returns all new when no overlap', () => {
    const result = checkForExistingIds(makeEntries(['a', 'b']), new Set(['c', 'd']))
    expect(result.overlapCount).toBe(0)
    expect(result.overlapIds).toEqual([])
    expect(result.newCount).toBe(2)
  })

  it('detects full overlap', () => {
    const result = checkForExistingIds(makeEntries(['a', 'b']), new Set(['a', 'b']))
    expect(result.overlapCount).toBe(2)
    expect(result.overlapIds).toEqual(['a', 'b'])
    expect(result.newCount).toBe(0)
  })

  it('detects partial overlap', () => {
    const result = checkForExistingIds(makeEntries(['a', 'b', 'c']), new Set(['b']))
    expect(result.overlapCount).toBe(1)
    expect(result.overlapIds).toEqual(['b'])
    expect(result.newCount).toBe(2)
  })

  it('returns zero counts for empty csvEntries', () => {
    const result = checkForExistingIds([], new Set(['a', 'b']))
    expect(result.overlapCount).toBe(0)
    expect(result.newCount).toBe(0)
  })

  it('returns all new when existingIdSet is empty', () => {
    const result = checkForExistingIds(makeEntries(['x', 'y']), new Set())
    expect(result.overlapCount).toBe(0)
    expect(result.newCount).toBe(2)
  })
})

// ── special characters: medicationNote ─────────────────────────────────────

const V3_HDR = 'babyNickname,entryId,entryDate,entryTime,amountMl,diaper,vitaminD,medication,tummyTimeCount,notes,source,createdByLabel,createdAt,updatedByLabel,updatedAt,deleted,deletedAt,weekStartDate,usualBottleAmountMl,tummyTimeDurationSeconds,medicationNote'

function makeV3Row(medNote = '') {
  const base = [
    'TestBaby', 'rt-1', '2026-04-01', '09:00', '120', 'W', 'false', 'true',
    '0', '', 'app', 'Tester', '', '', '', 'false', '', '2026-03-31', '120', '',
  ]
  const escaped = medNote.includes('"') || medNote.includes(',') || medNote.includes('\n')
    ? '"' + medNote.replace(/"/g, '""') + '"'
    : medNote
  return base.join(',') + ',' + escaped
}

describe('parseAppCsv — medicationNote special characters', () => {
  it('preserves medicationNote with comma', () => {
    const { entries } = parseAppCsv([V3_HDR, makeV3Row('Tylenol, 2.5 mL')].join('\n'))
    expect(entries[0].medicationNote).toBe('Tylenol, 2.5 mL')
  })

  it('preserves medicationNote with double quote', () => {
    const { entries } = parseAppCsv([V3_HDR, makeV3Row('say "hi"')].join('\n'))
    expect(entries[0].medicationNote).toBe('say "hi"')
  })

  it('preserves medicationNote with embedded newline', () => {
    const { entries } = parseAppCsv([V3_HDR, makeV3Row('line1\nline2')].join('\n'))
    expect(entries[0].medicationNote).toBe('line1\nline2')
  })
})

// ── special characters: notes ───────────────────────────────────────────────

function makeRowWithQuotedNotes(notesValue) {
  const escaped = notesValue.includes('"') || notesValue.includes(',') || notesValue.includes('\n')
    ? '"' + notesValue.replace(/"/g, '""') + '"'
    : notesValue
  const cols = [
    'TestBaby', 'rn-1', '2026-04-01', '09:00', '120', 'W', 'false', 'false',
    '0', escaped, 'app', 'Tester', '', '', '', 'false', '', '2026-03-31', '120',
  ]
  return cols.join(',')
}

describe('parseAppCsv — notes special characters', () => {
  it('preserves notes with comma', () => {
    const { entries } = parseAppCsv([HEADER, makeRowWithQuotedNotes('fussy, tired')].join('\n'))
    expect(entries[0].notes).toBe('fussy, tired')
  })

  it('preserves notes with double quote', () => {
    const { entries } = parseAppCsv([HEADER, makeRowWithQuotedNotes('said "hi"')].join('\n'))
    expect(entries[0].notes).toBe('said "hi"')
  })

  it('preserves notes with embedded newline', () => {
    const { entries } = parseAppCsv([HEADER, makeRowWithQuotedNotes('first line\nsecond line')].join('\n'))
    expect(entries[0].notes).toBe('first line\nsecond line')
  })
})

// ── duplicate detection after schema changes ────────────────────────────────

describe('duplicate detection with optional fields', () => {
  it('flags re-imported rows by ID regardless of medicationNote', () => {
    const entry = makeRow({ entryId: 'dup-check-1', medication: 'true' })
    const v3Row = entry + ',,Tylenol'
    const { entries } = parseAppCsv([V3_HDR, v3Row].join('\n'))
    const dupResult = checkForExistingIds(entries, new Set(['dup-check-1']))
    expect(dupResult.overlapCount).toBe(1)
    expect(dupResult.overlapIds).toEqual(['dup-check-1'])
  })

  it('flags re-imported rows by ID regardless of tummyTimeDurationSeconds', () => {
    const v3Row = makeRow({ entryId: 'dup-check-2' }) + ',90,'
    const { entries } = parseAppCsv([V3_HDR, v3Row].join('\n'))
    const dupResult = checkForExistingIds(entries, new Set(['dup-check-2']))
    expect(dupResult.overlapCount).toBe(1)
  })
})

// ── wrong-baby blocking (pure utility level) ────────────────────────────────

describe('wrong-baby detection', () => {
  it('reports mismatch when CSV has a different baby name', () => {
    const { preview } = parseAppCsv(csv(makeRow({ entryId: 'e1', babyNickname: 'OtherBaby' })))
    expect(preview.babyNames).toContain('OtherBaby')
  })

  it('reports hasBlankBabyName when any row has blank name', () => {
    const { preview } = parseAppCsv(csv(makeRow({ entryId: 'e1', babyNickname: '' })))
    expect(preview.hasBlankBabyName).toBe(true)
  })

  it('reports multiple distinct names when CSV mixes baby names', () => {
    const { preview } = parseAppCsv(csv(
      makeRow({ entryId: 'e1', babyNickname: 'Alpha' }),
      makeRow({ entryId: 'e2', babyNickname: 'Beta' }),
    ))
    expect(preview.babyNames).toEqual(['Alpha', 'Beta'])
  })
})
