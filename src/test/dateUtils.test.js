import { describe, it, expect } from 'vitest'
import { todayString, currentMonthKey } from '@/utils/dateUtils.js'

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
