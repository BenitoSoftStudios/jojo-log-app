import { describe, it, expect } from 'vitest'
import { todayString, currentMonthKey, getTodayInTimezone, getCurrentHHMMInTimezone } from '@/utils/dateUtils.js'

describe('todayString', () => {
  it('returns a string in YYYY-MM-DD format', () => {
    expect(todayString()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('returns the local calendar date (not UTC)', () => {
    const d = new Date()
    const expected = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0'),
    ].join('-')
    expect(todayString()).toBe(expected)
  })

  it('returns a date whose year matches the local year', () => {
    expect(todayString().slice(0, 4)).toBe(String(new Date().getFullYear()))
  })
})

describe('currentMonthKey', () => {
  it('returns a string in YYYY-MM format', () => {
    expect(currentMonthKey()).toMatch(/^\d{4}-\d{2}$/)
  })

  it('is the first 7 chars of todayString', () => {
    expect(currentMonthKey()).toBe(todayString().slice(0, 7))
  })
})

// ── getTodayInTimezone ───────────────────────────────────────────────────────

describe('getTodayInTimezone', () => {
  // 00:30 UTC = 20:30 EST (prev day) / 01:30 CET (same day)
  const midnight = new Date('2026-05-27T00:30:00Z')

  it('returns YYYY-MM-DD string', () => {
    expect(getTodayInTimezone('UTC', midnight)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('UTC date matches UTC wall clock', () => {
    expect(getTodayInTimezone('UTC', midnight)).toBe('2026-05-27')
  })

  it('America/Toronto is previous calendar day at 00:30 UTC', () => {
    expect(getTodayInTimezone('America/Toronto', midnight)).toBe('2026-05-26')
  })

  it('America/Vancouver also behind UTC', () => {
    expect(getTodayInTimezone('America/Vancouver', midnight)).toBe('2026-05-26')
  })
})

// ── getCurrentHHMMInTimezone ─────────────────────────────────────────────────

describe('getCurrentHHMMInTimezone', () => {
  // 15:30 UTC = 11:30 EDT
  const ref = new Date('2026-05-26T15:30:00Z')

  it('returns HH:MM string', () => {
    expect(getCurrentHHMMInTimezone('UTC', ref)).toMatch(/^\d{2}:\d{2}$/)
  })

  it('UTC returns 15:30', () => {
    expect(getCurrentHHMMInTimezone('UTC', ref)).toBe('15:30')
  })

  it('America/Toronto (EDT, UTC-4) returns 11:30', () => {
    expect(getCurrentHHMMInTimezone('America/Toronto', ref)).toBe('11:30')
  })
})
