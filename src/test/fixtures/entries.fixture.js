/**
 * Synthetic test fixture data.
 * No real Jojo dates, times, or amounts.
 * Covers every edge case required by the Phase 5 plan.
 *
 * Date reference (2026):
 *   Jan 1  = Thursday   →  weekOf = 2025-12-29
 *   Jan 26 = Monday     →  weekOf = 2026-01-26
 *   Jan 31 = Saturday   →  weekOf = 2026-01-26
 *   Feb  1 = Sunday     →  weekOf = 2026-01-26  (same week as Jan 31)
 *   Feb  2 = Monday     →  weekOf = 2026-02-02  (new week)
 *   Mar  9 = Monday     →  weekOf = 2026-03-09
 *
 *   Dec 29, 2025 = Monday
 *   Dec 31, 2025 = Wednesday  →  weekOf = 2025-12-29
 *   Jan  1, 2026 = Thursday   →  weekOf = 2025-12-29  (cross-year same week)
 */

function makeEntry(id, overrides) {
  return {
    id,
    entryDate:       '2026-01-15',
    entryTime:       '08:00',
    amountMl:        120,
    diaper:          'W',
    vitaminD:        false,
    medication:      false,
    tummyTime:       false,
    notes:           '',
    source:          'app',
    createdByUserId: 'uid-test',
    createdByLabel:  'Mum',
    createdAt:       null,
    updatedAt:       null,
    updatedByUserId: null,
    updatedByLabel:  null,
    deleted:         false,
    deletedAt:       null,
    deletedByUserId: null,
    deletedByLabel:  null,
    ...overrides,
  }
}

// ── Normal completed entries (2026-03-10, Tue, weekOf = 2026-03-09) ──────────
export const COMPLETE_ENTRY_W  = makeEntry('e001', { entryDate: '2026-03-10', entryTime: '07:00', amountMl: 120, diaper: 'W' })
export const COMPLETE_ENTRY_WP = makeEntry('e002', { entryDate: '2026-03-10', entryTime: '10:00', amountMl: 90,  diaper: 'WP' })

// ── 0 mL medication/diaper-only row ─────────────────────────────────────────
// complete (amountMl: 0 is not null), does NOT count as a feed, does NOT add to mL total
export const ZERO_ML_ENTRY = makeEntry('e003', { entryDate: '2026-03-10', entryTime: '13:00', amountMl: 0, diaper: 'P', medication: true })

// ── "-" diaper row (2026-03-11, Wed, weekOf = 2026-03-09) ───────────────────
// complete — no diaper event, but milk given; "-" is not null
export const DASH_DIAPER_ENTRY = makeEntry('e004', { entryDate: '2026-03-11', entryTime: '08:30', amountMl: 150, diaper: '-' })

// ── Incomplete rows ──────────────────────────────────────────────────────────
export const INCOMPLETE_NO_ML     = makeEntry('e005', { entryDate: '2026-03-11', entryTime: '12:00', amountMl: null, diaper: 'W' })
export const INCOMPLETE_NO_DIAPER = makeEntry('e006', { entryDate: '2026-03-12', entryTime: '09:00', amountMl: 90,   diaper: null })
export const INCOMPLETE_BOTH_NULL = makeEntry('e007', { entryDate: '2026-03-12', entryTime: '15:00', amountMl: null, diaper: null })

// ── Vitamin D row (2026-02-15, Sun, weekOf = 2026-02-09) ────────────────────
export const VITAMIND_ENTRY = makeEntry('e008', { entryDate: '2026-02-15', entryTime: '08:00', amountMl: 110, diaper: 'W', vitaminD: true })

// ── Medication with 0 mL (same day as vitaminD entry) ───────────────────────
export const MEDICATION_ZERO_ML = makeEntry('e009', { entryDate: '2026-02-15', entryTime: '14:00', amountMl: 0, diaper: 'W', medication: true })

// ── Notes entry (2026-02-16, Mon, weekOf = 2026-02-16) ──────────────────────
export const NOTES_ENTRY = makeEntry('e010', { entryDate: '2026-02-16', entryTime: '10:00', amountMl: 100, diaper: 'WP', notes: 'refused first 20ml, took rest after burp' })

// ── Deleted entry (excluded from all grouping and totals) ────────────────────
export const DELETED_ENTRY = makeEntry('e011', { entryDate: '2026-03-10', entryTime: '16:00', amountMl: 80, diaper: 'W', deleted: true })

// ── Cross-month week: Jan 31 and Feb 1 both in week of 2026-01-26 ───────────
// Jan 31 (Sat) → monthKey 2026-01, weekStartDate 2026-01-26
// Feb  1 (Sun) → monthKey 2026-02, weekStartDate 2026-01-26  (same week, different month)
export const CROSS_MONTH_JAN = makeEntry('e012', { entryDate: '2026-01-31', entryTime: '09:00', amountMl: 130, diaper: 'W' })
export const CROSS_MONTH_FEB = makeEntry('e013', { entryDate: '2026-02-01', entryTime: '09:00', amountMl: 125, diaper: 'WP' })

// ── Cross-year boundary: Dec 31 2025 and Jan 1 2026 both in week of 2025-12-29 ──
// Dec 31, 2025 (Wed) → monthKey 2025-12, weekStartDate 2025-12-29
// Jan  1, 2026 (Thu) → monthKey 2026-01, weekStartDate 2025-12-29  (same week)
export const CROSS_YEAR_DEC = makeEntry('e014', { entryDate: '2025-12-31', entryTime: '08:00', amountMl: 115, diaper: 'W' })
export const CROSS_YEAR_JAN = makeEntry('e015', { entryDate: '2026-01-01', entryTime: '09:00', amountMl: 120, diaper: 'W' })

// ── Legacy-sourced entry (2026-01-15, Thu, weekOf = 2026-01-12) ─────────────
export const LEGACY_ENTRY = makeEntry('e016', {
  entryDate:       '2026-01-15',
  entryTime:       '08:00',
  amountMl:        100,
  diaper:          'W',
  source:          'legacy',
  createdByUserId: null,
  createdByLabel:  'Legacy',
  updatedAt:       null,
  updatedByUserId: null,
  updatedByLabel:  null,
})

// ── Tummy Time entry (2026-02-16, Mon) ──────────────────────────────────────
// tummyTime: true — complete entry, no effect on completion or mL totals
export const TUMMY_TIME_ENTRY = makeEntry('e020', { entryDate: '2026-02-16', entryTime: '11:00', amountMl: 95, diaper: 'W', tummyTime: true })

// ── Tummy Time count entries (NOT in ALL_ENTRIES — dedicated to count-model tests) ──
// e022: count-based model, single session
export const TUMMY_TIME_COUNT_1 = makeEntry('e022', { entryDate: '2026-02-17', entryTime: '11:00', amountMl: 100, diaper: 'W', tummyTime: false, tummyTimeCount: 1 })
// e023: count-based model, max sessions
export const TUMMY_TIME_COUNT_9 = makeEntry('e023', { entryDate: '2026-02-17', entryTime: '14:00', amountMl: 100, diaper: 'W', tummyTime: false, tummyTimeCount: 9 })

// ── Same-day multiple entries (2026-01-15, Thu) ──────────────────────────────
// Must sort ascending by entryTime: A (06:00) → B (09:00) → C (12:00)
export const SAME_DAY_A = makeEntry('e017', { entryDate: '2026-01-15', entryTime: '06:00', amountMl: 90,  diaper: 'W' })
export const SAME_DAY_B = makeEntry('e018', { entryDate: '2026-01-15', entryTime: '09:00', amountMl: 110, diaper: 'WP' })
export const SAME_DAY_C = makeEntry('e019', { entryDate: '2026-01-15', entryTime: '12:00', amountMl: 120, diaper: 'W' })

// ── Composite sets ───────────────────────────────────────────────────────────
export const ALL_ENTRIES = [
  COMPLETE_ENTRY_W, COMPLETE_ENTRY_WP, ZERO_ML_ENTRY, DASH_DIAPER_ENTRY,
  INCOMPLETE_NO_ML, INCOMPLETE_NO_DIAPER, INCOMPLETE_BOTH_NULL,
  VITAMIND_ENTRY, MEDICATION_ZERO_ML, NOTES_ENTRY, DELETED_ENTRY,
  CROSS_MONTH_JAN, CROSS_MONTH_FEB, CROSS_YEAR_DEC, CROSS_YEAR_JAN,
  LEGACY_ENTRY, TUMMY_TIME_ENTRY, SAME_DAY_A, SAME_DAY_B, SAME_DAY_C,
]

export const ACTIVE_ENTRIES = ALL_ENTRIES.filter(e => !e.deleted)

// ── Legacy feeds-shaped documents (for normalizer tests) ─────────────────────
function makeLegacyFeed(id, overrides) {
  return { id, date: '2026-01-15', time: '08:00', ml: 120, diaper: 'W', vitd: 0, notes: '', ...overrides }
}

export const LEGACY_FEEDS = {
  BLANK_ML:    makeLegacyFeed('lf001', { ml: '',     diaper: 'W'  }),
  ZERO_ML:     makeLegacyFeed('lf002', { ml: 0,      diaper: 'P'  }),
  NORMAL_ML:   makeLegacyFeed('lf003', { ml: 120,    diaper: 'W'  }),
  BLANK_DIAPER: makeLegacyFeed('lf004', { ml: 90,    diaper: ''   }),
  NONE_DIAPER:  makeLegacyFeed('lf005', { ml: 80,    diaper: 'none' }),
  DASH_DIAPER:  makeLegacyFeed('lf006', { ml: 70,    diaper: '-'  }),
  WP_DIAPER:    makeLegacyFeed('lf007', { ml: 110,   diaper: 'WP' }),
  VITD_OFF:     makeLegacyFeed('lf008', { vitd: 0,   diaper: 'W'  }),
  VITD_ON:      makeLegacyFeed('lf009', { vitd: 1,   diaper: 'W'  }),
  WITH_NOTES:   makeLegacyFeed('lf010', { notes: 'test note', diaper: 'W' }),
  EMPTY_NOTES:  makeLegacyFeed('lf011', { notes: '',  diaper: 'W'  }),
}
