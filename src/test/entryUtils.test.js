import { describe, it, expect } from 'vitest'
import { isIncomplete, isCompletedFeed, buildNewEntryDefaults, buildStartNextDayEntry } from '@/utils/entryUtils.js'

describe('isIncomplete', () => {
  it('returns true when amountMl is null', () => {
    expect(isIncomplete({ amountMl: null, diaper: 'W' })).toBe(true)
  })

  it('returns true when amountMl is undefined', () => {
    expect(isIncomplete({ amountMl: undefined, diaper: 'W' })).toBe(true)
  })

  it('returns true when diaper is null', () => {
    expect(isIncomplete({ amountMl: 90, diaper: null })).toBe(true)
  })

  it('returns true when diaper is undefined', () => {
    expect(isIncomplete({ amountMl: 90, diaper: undefined })).toBe(true)
  })

  it('returns true when both amountMl and diaper are null', () => {
    expect(isIncomplete({ amountMl: null, diaper: null })).toBe(true)
  })

  it('returns false for 0 mL with "-" diaper — both fields present', () => {
    expect(isIncomplete({ amountMl: 0, diaper: '-' })).toBe(false)
  })

  it('returns false for 0 mL with "W" diaper', () => {
    expect(isIncomplete({ amountMl: 0, diaper: 'W' })).toBe(false)
  })

  it('returns false for a normal complete entry', () => {
    expect(isIncomplete({ amountMl: 90, diaper: 'WP' })).toBe(false)
  })

  it('returns false for "-" diaper with a non-zero amount', () => {
    expect(isIncomplete({ amountMl: 150, diaper: '-' })).toBe(false)
  })
})

describe('isCompletedFeed', () => {
  it('returns true for amountMl > 0 and not deleted', () => {
    expect(isCompletedFeed({ amountMl: 90, deleted: false })).toBe(true)
  })

  it('returns false for amountMl === 0 (does not count as a feed)', () => {
    expect(isCompletedFeed({ amountMl: 0, deleted: false })).toBe(false)
  })

  it('returns false when deleted is true', () => {
    expect(isCompletedFeed({ amountMl: 90, deleted: true })).toBe(false)
  })

  it('returns false for null amountMl', () => {
    expect(isCompletedFeed({ amountMl: null, deleted: false })).toBe(false)
  })

  it('returns false for undefined amountMl', () => {
    expect(isCompletedFeed({ amountMl: undefined, deleted: false })).toBe(false)
  })
})

// ── tummyTime — completion and feed count ────────────────────────────────────

describe('tummyTime does not affect completion or feed count', () => {
  it('isIncomplete returns false when tummyTime is true and mL/diaper are set', () => {
    expect(isIncomplete({ amountMl: 90, diaper: 'W', tummyTime: true })).toBe(false)
  })

  it('isIncomplete still returns true when amountMl is null regardless of tummyTime', () => {
    expect(isIncomplete({ amountMl: null, diaper: 'W', tummyTime: true })).toBe(true)
  })

  it('isIncomplete still returns true when diaper is null regardless of tummyTime', () => {
    expect(isIncomplete({ amountMl: 90, diaper: null, tummyTime: true })).toBe(true)
  })

  it('isCompletedFeed returns true when tummyTime is true and amountMl > 0', () => {
    expect(isCompletedFeed({ amountMl: 90, deleted: false, tummyTime: true })).toBe(true)
  })

  it('isCompletedFeed returns false when tummyTime is true but amountMl is 0', () => {
    expect(isCompletedFeed({ amountMl: 0, deleted: false, tummyTime: true })).toBe(false)
  })
})

// ── buildNewEntryDefaults — tummyTime ────────────────────────────────────────

describe('buildNewEntryDefaults — tummyTime', () => {
  it('includes tummyTime: false in defaults', () => {
    const defaults = buildNewEntryDefaults(null, null, null)
    expect(defaults.tummyTime).toBe(false)
  })

  it('includes tummyTime: false when a lastEntry is provided', () => {
    const defaults = buildNewEntryDefaults({ entryTime: '08:00' }, null, null)
    expect(defaults.tummyTime).toBe(false)
  })
})

// ── buildStartNextDayEntry — tummyTime ───────────────────────────────────────

describe('buildStartNextDayEntry — tummyTime', () => {
  it('includes tummyTime: false in entryFields', () => {
    const result = buildStartNextDayEntry('2026-03-15', null)
    expect(result.entryFields.tummyTime).toBe(false)
  })
})
