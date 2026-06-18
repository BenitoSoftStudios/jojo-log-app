import { describe, it, expect } from 'vitest'
import { mlToFlOz, flOzToMl, formatAmount, parseAmountToMl } from '../utils/unitConverter.js'

describe('mlToFlOz', () => {
  it('converts 0 mL to 0 fl oz', () => {
    expect(mlToFlOz(0)).toBeCloseTo(0)
  })

  it('converts 29.5735 mL to 1 fl oz', () => {
    expect(mlToFlOz(29.5735)).toBeCloseTo(1, 4)
  })

  it('converts 90 mL to ~3.04 fl oz', () => {
    expect(mlToFlOz(90)).toBeCloseTo(3.043, 2)
  })

  it('returns null for null input', () => {
    expect(mlToFlOz(null)).toBe(null)
  })

  it('returns null for undefined input', () => {
    expect(mlToFlOz(undefined)).toBe(null)
  })
})

describe('flOzToMl', () => {
  it('converts 0 fl oz to 0 mL', () => {
    expect(flOzToMl(0)).toBeCloseTo(0)
  })

  it('converts 1 fl oz to 29.5735 mL', () => {
    expect(flOzToMl(1)).toBeCloseTo(29.5735, 2)
  })

  it('converts 3 fl oz to ~88.72 mL', () => {
    expect(flOzToMl(3)).toBeCloseTo(88.72, 0)
  })

  it('returns null for null input', () => {
    expect(flOzToMl(null)).toBe(null)
  })

  it('returns null for undefined input', () => {
    expect(flOzToMl(undefined)).toBe(null)
  })
})

describe('formatAmount', () => {
  it('formats mL by default', () => {
    expect(formatAmount(90)).toBe('90 mL')
  })

  it('formats mL explicitly', () => {
    expect(formatAmount(90, 'ml')).toBe('90 mL')
  })

  it('formats fl oz with one decimal', () => {
    expect(formatAmount(90, 'floz')).toBe('3.0 fl oz')
  })

  it('formats 0 mL', () => {
    expect(formatAmount(0, 'ml')).toBe('0 mL')
  })

  it('formats 0 mL as fl oz', () => {
    expect(formatAmount(0, 'floz')).toBe('0.0 fl oz')
  })

  it('returns empty string for null', () => {
    expect(formatAmount(null, 'ml')).toBe('')
    expect(formatAmount(null, 'floz')).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(formatAmount(undefined, 'ml')).toBe('')
    expect(formatAmount(undefined, 'floz')).toBe('')
  })

  it('formats large mL values', () => {
    expect(formatAmount(1000, 'ml')).toBe('1000 mL')
  })

  it('formats large values as fl oz', () => {
    expect(formatAmount(1000, 'floz')).toBe('33.8 fl oz')
  })
})

describe('parseAmountToMl', () => {
  it('parses mL string to number', () => {
    expect(parseAmountToMl('90', 'ml')).toBe(90)
  })

  it('parses fl oz string to mL', () => {
    const result = parseAmountToMl('3', 'floz')
    expect(result).toBeCloseTo(88.72, 0)
  })

  it('parses decimal fl oz string', () => {
    const result = parseAmountToMl('3.5', 'floz')
    expect(result).toBeCloseTo(103.5, 0)
  })

  it('returns null for empty string', () => {
    expect(parseAmountToMl('', 'ml')).toBe(null)
    expect(parseAmountToMl('', 'floz')).toBe(null)
  })

  it('returns null for null', () => {
    expect(parseAmountToMl(null, 'ml')).toBe(null)
  })

  it('returns null for undefined', () => {
    expect(parseAmountToMl(undefined, 'ml')).toBe(null)
  })

  it('returns null for non-numeric string', () => {
    expect(parseAmountToMl('abc', 'ml')).toBe(null)
    expect(parseAmountToMl('abc', 'floz')).toBe(null)
  })

  it('defaults to mL when no unit specified', () => {
    expect(parseAmountToMl('90')).toBe(90)
  })

  it('round-trips mL through fl oz with expected rounding loss', () => {
    const original = 90
    const floz = mlToFlOz(original)
    const displayed = floz.toFixed(1)
    const backToMl = Math.round(parseAmountToMl(displayed, 'floz'))
    expect(Math.abs(backToMl - original)).toBeLessThanOrEqual(1)
  })

  it('round-trips exact fl oz values without loss', () => {
    const original = 30
    const floz = mlToFlOz(original)
    const backToMl = Math.round(parseAmountToMl(floz.toFixed(1), 'floz'))
    expect(Math.abs(backToMl - original)).toBeLessThanOrEqual(1)
  })

  it('does not alter stored mL semantics — amountMl stays integer', () => {
    const userInput = '3.0'
    const ml = parseAmountToMl(userInput, 'floz')
    const stored = Math.round(ml)
    expect(Number.isInteger(stored)).toBe(true)
    expect(stored).toBeGreaterThan(0)
  })

  it('no-drift: displayed fl oz from a given mL re-parses to the same display', () => {
    for (const ml of [0, 30, 60, 89, 90, 100, 120, 150, 180, 240, 300]) {
      const displayed = mlToFlOz(ml).toFixed(1)
      const originalFlOz = parseFloat(displayed)
      const reconverted = Math.round(flOzToMl(originalFlOz))
      const redisplayed = mlToFlOz(reconverted).toFixed(1)
      expect(redisplayed).toBe(displayed)
    }
  })
})
