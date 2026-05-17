import { describe, it, expect } from 'vitest'
import { isIncomplete, isCompletedFeed } from '@/utils/entryUtils.js'

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
