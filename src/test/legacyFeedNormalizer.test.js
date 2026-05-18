import { describe, it, expect } from 'vitest'
import {
  normalizeLegacyFeedToEntry,
  validateNormalizedEntry,
  compareLegacyAndNormalizedTotals,
} from '@/migration/legacyFeedNormalizer.js'
import { LEGACY_FEEDS } from './fixtures/entries.fixture.js'

// ── normalizeLegacyFeedToEntry — amountMl ─────────────────────────────────────

describe('normalizeLegacyFeedToEntry — amountMl', () => {
  it('maps ml: "" to amountMl: null', () => {
    expect(normalizeLegacyFeedToEntry(LEGACY_FEEDS.BLANK_ML).data.amountMl).toBeNull()
  })

  it('maps ml: 0 to amountMl: 0', () => {
    expect(normalizeLegacyFeedToEntry(LEGACY_FEEDS.ZERO_ML).data.amountMl).toBe(0)
  })

  it('maps ml: 120 to amountMl: 120', () => {
    expect(normalizeLegacyFeedToEntry(LEGACY_FEEDS.NORMAL_ML).data.amountMl).toBe(120)
  })
})

// ── normalizeLegacyFeedToEntry — diaper ───────────────────────────────────────

describe('normalizeLegacyFeedToEntry — diaper', () => {
  it('maps diaper: "" to null (blank = incomplete)', () => {
    expect(normalizeLegacyFeedToEntry(LEGACY_FEEDS.BLANK_DIAPER).data.diaper).toBeNull()
  })

  it('maps diaper: "none" to "-" (intentional no-event)', () => {
    expect(normalizeLegacyFeedToEntry(LEGACY_FEEDS.NONE_DIAPER).data.diaper).toBe('-')
  })

  it('maps diaper: "-" to "-" (already normalized)', () => {
    expect(normalizeLegacyFeedToEntry(LEGACY_FEEDS.DASH_DIAPER).data.diaper).toBe('-')
  })

  it('maps diaper: "WP" to "WP" (direct copy)', () => {
    expect(normalizeLegacyFeedToEntry(LEGACY_FEEDS.WP_DIAPER).data.diaper).toBe('WP')
  })
})

// ── normalizeLegacyFeedToEntry — vitaminD ─────────────────────────────────────

describe('normalizeLegacyFeedToEntry — vitaminD', () => {
  it('maps vitd: 0 to vitaminD: false', () => {
    expect(normalizeLegacyFeedToEntry(LEGACY_FEEDS.VITD_OFF).data.vitaminD).toBe(false)
  })

  it('maps vitd: 1 to vitaminD: true', () => {
    expect(normalizeLegacyFeedToEntry(LEGACY_FEEDS.VITD_ON).data.vitaminD).toBe(true)
  })
})

// ── normalizeLegacyFeedToEntry — provenance and identity ─────────────────────

describe('normalizeLegacyFeedToEntry — provenance', () => {
  const normalized = () => normalizeLegacyFeedToEntry(LEGACY_FEEDS.NORMAL_ML)

  it('sets source to "legacy"',          () => expect(normalized().data.source).toBe('legacy'))
  it('sets createdByLabel to "Legacy"',  () => expect(normalized().data.createdByLabel).toBe('Legacy'))
  it('sets createdByUserId to null',     () => expect(normalized().data.createdByUserId).toBeNull())
  it('sets medication to false',         () => expect(normalized().data.medication).toBe(false))
  it('sets tummyTime to false',          () => expect(normalized().data.tummyTime).toBe(false))
  it('sets tummyTimeCount to 0',         () => expect(normalized().data.tummyTimeCount).toBe(0))
  it('sets deleted to false',            () => expect(normalized().data.deleted).toBe(false))
  it('sets updatedAt to null',           () => expect(normalized().data.updatedAt).toBeNull())
  it('sets updatedByUserId to null',     () => expect(normalized().data.updatedByUserId).toBeNull())
  it('sets updatedByLabel to null',      () => expect(normalized().data.updatedByLabel).toBeNull())

  it('docId equals the input id field', () => {
    const { docId } = normalizeLegacyFeedToEntry(LEGACY_FEEDS.NORMAL_ML)
    expect(docId).toBe(LEGACY_FEEDS.NORMAL_ML.id)
  })

  it('copies notes verbatim', () => {
    expect(normalizeLegacyFeedToEntry(LEGACY_FEEDS.WITH_NOTES).data.notes)
      .toBe(LEGACY_FEEDS.WITH_NOTES.notes)
  })

  it('sets notes to empty string when notes field is empty', () => {
    expect(normalizeLegacyFeedToEntry(LEGACY_FEEDS.EMPTY_NOTES).data.notes).toBe('')
  })
})

// ── validateNormalizedEntry ───────────────────────────────────────────────────

describe('validateNormalizedEntry', () => {
  function normalized(feed = LEGACY_FEEDS.NORMAL_ML) {
    return normalizeLegacyFeedToEntry(feed).data
  }

  it('returns valid for a correctly normalized entry', () => {
    const result = validateNormalizedEntry(normalized())
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('returns valid for an entry with null amountMl (incomplete is allowed)', () => {
    const entry = { ...normalized(), amountMl: null }
    expect(validateNormalizedEntry(entry).valid).toBe(true)
  })

  it('returns valid for an entry with null diaper (incomplete is allowed)', () => {
    const entry = { ...normalized(), diaper: null }
    expect(validateNormalizedEntry(entry).valid).toBe(true)
  })

  it('reports error when entryDate is missing', () => {
    const result = validateNormalizedEntry({ ...normalized(), entryDate: undefined })
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('reports error when entryDate is malformed', () => {
    const result = validateNormalizedEntry({ ...normalized(), entryDate: '15-03-2026' })
    expect(result.valid).toBe(false)
  })

  it('reports error when amountMl is a string (should be number or null)', () => {
    const result = validateNormalizedEntry({ ...normalized(), amountMl: '120' })
    expect(result.valid).toBe(false)
  })

  it('reports error for unnormalized diaper value "none"', () => {
    const result = validateNormalizedEntry({ ...normalized(), diaper: 'none' })
    expect(result.valid).toBe(false)
  })

  it('reports error when source is not "legacy"', () => {
    const result = validateNormalizedEntry({ ...normalized(), source: 'app' })
    expect(result.valid).toBe(false)
  })

  it('reports error when tummyTime is not a boolean', () => {
    const result = validateNormalizedEntry({ ...normalized(), tummyTime: 0 })
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('returns valid when tummyTime is false (legacy default)', () => {
    const result = validateNormalizedEntry({ ...normalized(), tummyTime: false })
    expect(result.valid).toBe(true)
  })

  it('returns valid when tummyTimeCount is 0', () => {
    expect(validateNormalizedEntry({ ...normalized(), tummyTimeCount: 0 }).valid).toBe(true)
  })

  it('returns valid when tummyTimeCount is 1', () => {
    expect(validateNormalizedEntry({ ...normalized(), tummyTimeCount: 1 }).valid).toBe(true)
  })

  it('returns valid when tummyTimeCount is 9', () => {
    expect(validateNormalizedEntry({ ...normalized(), tummyTimeCount: 9 }).valid).toBe(true)
  })

  it('reports error when tummyTimeCount is -1 (below range)', () => {
    expect(validateNormalizedEntry({ ...normalized(), tummyTimeCount: -1 }).valid).toBe(false)
  })

  it('reports error when tummyTimeCount is 10 (above range)', () => {
    expect(validateNormalizedEntry({ ...normalized(), tummyTimeCount: 10 }).valid).toBe(false)
  })

  it('reports error when tummyTimeCount is a string', () => {
    expect(validateNormalizedEntry({ ...normalized(), tummyTimeCount: '1' }).valid).toBe(false)
  })

  it('reports error when tummyTimeCount is undefined', () => {
    expect(validateNormalizedEntry({ ...normalized(), tummyTimeCount: undefined }).valid).toBe(false)
  })
})

// ── compareLegacyAndNormalizedTotals ─────────────────────────────────────────

describe('compareLegacyAndNormalizedTotals', () => {
  const legacyFeeds = [
    { id: 'a', date: '2026-01-01', time: '08:00', ml: 100, diaper: 'W',  vitd: 0, notes: '' },
    { id: 'b', date: '2026-01-02', time: '09:00', ml: 80,  diaper: 'WP', vitd: 0, notes: '' },
  ]
  // normalize without firebase — data objects only
  const normalizedData = legacyFeeds.map(f => normalizeLegacyFeedToEntry(f).data)

  it('reports rowCountMatch true when counts are equal', () => {
    expect(compareLegacyAndNormalizedTotals(legacyFeeds, normalizedData).rowCountMatch).toBe(true)
  })

  it('reports totalMlMatch true when mL sums are equal', () => {
    expect(compareLegacyAndNormalizedTotals(legacyFeeds, normalizedData).totalMlMatch).toBe(true)
  })

  it('reports dateRangeMatch true when oldest and newest dates match', () => {
    expect(compareLegacyAndNormalizedTotals(legacyFeeds, normalizedData).dateRangeMatch).toBe(true)
  })

  it('reports no errors when everything matches', () => {
    expect(compareLegacyAndNormalizedTotals(legacyFeeds, normalizedData).errors).toHaveLength(0)
  })

  it('detects row count mismatch', () => {
    const result = compareLegacyAndNormalizedTotals(legacyFeeds, [normalizedData[0]])
    expect(result.rowCountMatch).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('detects total mL mismatch', () => {
    const tweaked = [{ ...normalizedData[0], amountMl: 999 }, normalizedData[1]]
    const result  = compareLegacyAndNormalizedTotals(legacyFeeds, tweaked)
    expect(result.totalMlMatch).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('detects date range mismatch', () => {
    const tweaked = [{ ...normalizedData[0], entryDate: '2026-02-01' }, normalizedData[1]]
    const result  = compareLegacyAndNormalizedTotals(legacyFeeds, tweaked)
    expect(result.dateRangeMatch).toBe(false)
  })
})
