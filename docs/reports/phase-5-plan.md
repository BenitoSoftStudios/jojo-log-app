# Phase 5 Plan — Pure Data Logic and Migration Readiness

Date: 2026-05-17 (revised)

## Goal

Build and verify all pure data logic needed before migration and ledger UI.
No Firestore reads or writes. No UI components. No migration runs.
Every module in this phase is a plain JavaScript function or set of functions
that can be called with an array of entries and return a deterministic result.

---

## Scope

Phase 5 adds:

- `src/utils/ledgerGrouper.js` — Month → Week Segment → Day tree builder
- `src/utils/statsCalculator.js` — summary chip totals and feed count
- `src/migration/legacyFeedNormalizer.js` — pure normalization and validation functions only
- `src/migration/migrationChecks.js` — pure comparison functions only (no Firebase)
- `src/test/fixtures/entries.fixture.js` — synthetic test fixture data
- `src/test/ledgerGrouper.test.js` — unit tests for grouper
- `src/test/statsCalculator.test.js` — unit tests for stats
- `src/test/entryUtils.test.js` — unit tests for isIncomplete and isCompletedFeed
- `src/test/weekUtils.test.js` — unit tests for weekOf and cross-month logic
- `src/test/legacyFeedNormalizer.test.js` — unit tests for field mapping transforms
- `vitest.config.js` — test runner configuration (Vitest)
- `package.json` — add `vitest` dev dependency and `"test": "vitest run"` script
- `package-lock.json` — updated automatically by `npm install` after adding Vitest

Phase 5 does NOT modify:

- `src/entries/entryService.js`
- `src/entries/useEntries.js`
- `src/entries/CareLedgerView.vue`
- `src/app/router.js`
- `src/auth/`
- `src/families/`
- `src/babies/`
- `firestore.indexes.json`
- Firestore security rules
- Any existing `src/utils/` file (additions only, no edits)
- The `feeds` Firestore collection (never touched)

---

## 1. Exact Files to Add or Change

### New files

1. `src/utils/ledgerGrouper.js`
2. `src/utils/statsCalculator.js`
3. `src/migration/legacyFeedNormalizer.js`
4. `src/migration/migrationChecks.js`
5. `src/test/fixtures/entries.fixture.js`
6. `src/test/ledgerGrouper.test.js`
7. `src/test/statsCalculator.test.js`
8. `src/test/entryUtils.test.js`
9. `src/test/weekUtils.test.js`
10. `src/test/legacyFeedNormalizer.test.js`
11. `vitest.config.js`

### Modified files

- `package.json` — add `vitest` to devDependencies and `"test": "vitest run"` script
- `package-lock.json` — updated by `npm install` after the above change

### Unchanged files

Everything else in `src/`, all config files, all Firestore files.

---

## 2. What Logic Is Pure and Testable

All Phase 5 logic is pure: given the same input, it always returns the same
output. No Firestore SDK import. No Vue reactivity. No `import.meta.env`.
No async. No side effects.

### `ledgerGrouper.groupEntries(entries)`

- Input: flat array of entry objects (the caller passes only non-deleted entries,
  or the grouper filters them — see section 3)
- Output: a plain object with a `months` array (see section 3 for full shape)
- Uses Maps internally during construction for O(1) lookup, converts to sorted
  arrays before returning

### `statsCalculator.calculateStats(entries, today)`

- Input: flat array of entries (including deleted), today as `"YYYY-MM-DD"` string
- Output: `{ todayMl, sevenDayMl, monthMl, feedCount }`
- Filters `deleted === false` internally before any calculation
- All four values are computed in a single pass

### `legacyFeedNormalizer.js` — three exported functions

All three are pure. No Firestore SDK. No `db` import. No reads. No writes.
No `setDoc`. No `getDocs`. No `collection`.

- `normalizeLegacyFeedToEntry(feedDoc)` — maps one raw feeds document to a
  normalized entry object. Input and output are plain JS objects.
- `validateNormalizedEntry(entry)` — checks that a normalized entry has all
  required fields and valid values. Returns `{ valid: boolean, errors: string[] }`.
- `compareLegacyAndNormalizedTotals(legacyFeeds, normalizedEntries)` — accepts
  two plain arrays and compares row count, total mL, and date range.
  Returns `{ rowCountMatch, totalMlMatch, dateRangeMatch, errors }`.

### `migrationChecks.js` — pure comparison functions

Accepts arrays of plain objects. No Firebase import. No Firestore reads or writes.

- `checkRowCount(legacyFeeds, normalizedEntries)` — returns match status and counts
- `checkTotalMl(legacyFeeds, normalizedEntries)` — sums ml from legacy and amountMl
  from normalized, returns match status and values
- `checkDateRange(legacyFeeds, normalizedEntries)` — compares oldest and newest dates

These functions are designed to accept data that was fetched elsewhere and passed in.
The migration runner (a separate Phase script, not built in Phase 5) will fetch the
data and pass it to these functions.

---

## 3. Month → Week Segment → Day Grouping

### Output shape

`groupEntries` returns a plain object with ordered arrays at every level.
Arrays are pre-sorted so the Vue UI can iterate them directly with `v-for`
without any additional transformation.

```js
{
  months: [
    {
      monthKey: "YYYY-MM",
      label: "May 2026",
      totalMl: number,
      feedCount: number,
      weekSegments: [
        {
          weekStartDate: "YYYY-MM-DD",
          label: "Week of Apr 27",
          totalMl: number,
          days: [
            {
              date: "YYYY-MM-DD",
              label: "Fri 1 May",
              totalMl: number,
              hasIncomplete: boolean,
              entries: [ /* sorted by entryTime ASC */ ]
            }
          ]
        }
      ]
    }
  ]
}
```

Why arrays instead of Maps: Vue's `v-for` iterates arrays directly. A Map
requires `Array.from(map.values())` at the template boundary or a computed
wrapper. Since ordering is always required and lookup by key is not needed in
the UI, pre-sorted arrays are the correct output for a function whose only
consumer is a Vue template.

### Bucketing rule

For each non-deleted entry:

```
monthKey      = entry.entryDate.slice(0, 7)   // "YYYY-MM"
weekStartDate = weekOf(entry.entryDate)        // Monday of ISO week
```

The entry goes into `months[monthKey].weekSegments[weekStartDate].days[entry.entryDate]`.

During construction this uses temporary Maps for O(1) insertion. After all entries
are processed, the Maps are converted to sorted arrays.

### Cross-month week example

Entries on 2026-04-29 (Wed), 2026-04-30 (Thu), 2026-05-01 (Fri):

- `weekOf("2026-04-29")` → `"2026-04-27"` (Mon)
- `weekOf("2026-04-30")` → `"2026-04-27"` (Mon)
- `weekOf("2026-05-01")` → `"2026-04-27"` (Mon)

Result in the output:

```
months[0] = May ("2026-05")
  weekSegments[0] = Week of Apr 27 ("2026-04-27")
    days[0] = Fri May 1
      entries: [ entry on 2026-05-01 ]

months[1] = April ("2026-04")
  weekSegments[0] = Week of Apr 27 ("2026-04-27")
    days[0] = Thu Apr 30
      entries: [ entry on 2026-04-30 ]
    days[1] = Wed Apr 29
      entries: [ entry on 2026-04-29 ]
```

The April total for "Week of Apr 27" includes only Apr 29 + Apr 30.
The May total for "Week of Apr 27" includes only May 1.
This matches the HTML app's `group()` behaviour exactly.

### Ordering

- `months` array: descending by `monthKey` (newest first)
- `weekSegments` array within a month: descending by `weekStartDate`
- `days` array within a week segment: descending by `date`
- `entries` array within a day: ascending by `entryTime`

### No new Firestore index required

The entire grouping is computed client-side from the already-subscribed
flat `entries` array. `ledgerGrouper.groupEntries` will be called as a Vue
computed property in `useLedger.js` (Phase 6). No `orderBy`, no
`where` on `entryDate`, no composite index.

---

## 4. How Incomplete Entries Are Detected

An entry is Incomplete if:

```
entry.amountMl === null || entry.amountMl === undefined
  || entry.diaper === null || entry.diaper === undefined
```

This rule already exists in `src/utils/entryUtils.js:isIncomplete`.
No change to the function. Phase 5 adds tests to confirm it.

The grouper sets `hasIncomplete = true` on a DayNode if any entry in that
day satisfies `isIncomplete(entry)` and `entry.deleted === false`.

Deleted entries are excluded from the tree entirely and do not trigger
the incomplete warning.

---

## 5. How 0 mL Plus "-" Diaper Remains Complete

The completion rule is strictly null-based:

- `amountMl === 0` → NOT null → complete on that field
- `diaper === "-"` → NOT null → complete on that field
- An entry with `amountMl: 0, diaper: "-"` → both fields present → Complete

The legacy HTML app's `isInc` function checks `f.ml === "" || f.ml == null`.
After normalization, `ml: ""` becomes `amountMl: null` and `ml: 0` stays
`amountMl: 0`. The new `isIncomplete` function is correct for the new schema.

A 0 mL entry (e.g. medication-only, diaper-only) must appear in the ledger
without an incomplete indicator.

---

## 6. How Feed Count Differs from the Old Bug

### Old app behavior

`renderStats()` in the HTML app counts `tf.length` — the number of entries
logged for today — as "Feeds". This includes 0 mL and incomplete entries.

### New app behavior

Feed count = entries where `amountMl > 0 AND deleted === false`.

This is a deliberate bug fix, not a data loss. "Feeds" means completed
feeding events with milk given.

### Expected visible difference during side-by-side testing

The feed count in the Vue app will be lower than the HTML app whenever:

- Any 0 mL entries exist (medication-only or diaper-only rows)
- Any incomplete entries exist (amountMl is null)

This discrepancy must be communicated to both parents during Phase 9
feature parity testing. It is documented here so it is not mistaken
for a regression.

---

## 7. How Migrated Legacy Entries Will Be Labeled

All entries produced by `normalizeLegacyFeedToEntry` carry:

```
source:           "legacy"
createdByLabel:   "Legacy"
createdByUserId:  null
updatedAt:        null
updatedByUserId:  null
updatedByLabel:   null
```

Migration is not a user edit. The `updatedAt`, `updatedByUserId`, and
`updatedByLabel` fields are left null to correctly indicate that no user
has ever edited the entry. Setting them to the migration timestamp would
falsely imply that a user made a change at that time.

`createdAt` is set to the migration server timestamp. This records when
the document was written to Firestore, which is accurate and useful for
audit purposes.

When an owner edits a legacy entry after migration, `updatedAt`,
`updatedByUserId`, and `updatedByLabel` are stamped by `entryService.updateEntry`
at that time. The `source: "legacy"` field remains unchanged permanently.

In the ledger UI (Phase 6), the "Created by" field shows `"Legacy"` for
these entries. The `source` field is not editable.

---

## 8. Tests That Must Be Written Before Migration

All tests live in `src/test/`. All run with `npm test` via Vitest.
Migration must not run until all tests pass.

### `weekUtils.test.js`

- `weekOf("2026-05-01")` returns `"2026-04-27"` (Friday → previous Monday)
- `weekOf("2026-04-27")` returns `"2026-04-27"` (Monday → itself)
- `weekOf("2026-01-01")` returns `"2025-12-29"` (year boundary)
- `weekOf("2026-12-31")` returns `"2026-12-28"` (end of year)
- `isInWeek("2026-05-01", "2026-04-27")` returns `true`
- `isInWeek("2026-05-04", "2026-04-27")` returns `false` (Monday of next week)

### `entryUtils.test.js`

- `isIncomplete({ amountMl: null, diaper: "W" })` → `true`
- `isIncomplete({ amountMl: 90, diaper: null })` → `true`
- `isIncomplete({ amountMl: 0, diaper: "-" })` → `false` (complete)
- `isIncomplete({ amountMl: 0, diaper: "W" })` → `false`
- `isIncomplete({ amountMl: 90, diaper: "WP" })` → `false`
- `isCompletedFeed({ amountMl: 90, deleted: false })` → `true`
- `isCompletedFeed({ amountMl: 0, deleted: false })` → `false`
- `isCompletedFeed({ amountMl: 90, deleted: true })` → `false`
- `isCompletedFeed({ amountMl: null, deleted: false })` → `false`

### `ledgerGrouper.test.js`

- Empty array → `{ months: [] }`
- Single entry → one month, one week segment, one day, one entry
- Two entries on the same day → one day, two entries sorted by `entryTime` ascending
- Entry on 2026-04-30 and entry on 2026-05-01 in same ISO week → appear in
  separate month nodes, both under `weekStartDate: "2026-04-27"`
- April month total includes only Apr 30 entry; May total includes only May 1 entry
- `deleted: true` entries are excluded from the output entirely
- `amountMl: null` entries do not contribute to `totalMl`
- `amountMl: 0` entries do not contribute to `totalMl` but appear in the day
- A day with one incomplete entry has `hasIncomplete: true`
- A day with no incomplete entries has `hasIncomplete: false`
- `months` array is sorted descending (newest first)
- `weekSegments` within a month are sorted descending by `weekStartDate`
- `days` within a week segment are sorted descending by `date`
- `entries` within a day are sorted ascending by `entryTime`

### `statsCalculator.test.js`

- Zero entries → `{ todayMl: 0, sevenDayMl: 0, monthMl: 0, feedCount: 0 }`
- Entry today with `amountMl: 120` → `todayMl: 120`, `feedCount: 1`
- Entry today with `amountMl: 0` → `todayMl: 0`, `feedCount: 0`
- Entry today with `amountMl: null` → `todayMl: 0`, `feedCount: 0`
- Entry today with `deleted: true` → excluded from all totals
- Entry 6 days ago with `amountMl: 80` → appears in `sevenDayMl`
- Entry 7 days ago with `amountMl: 80` → does NOT appear in `sevenDayMl`
  (rolling window is today through 6 days prior, inclusive)
- Entry in current month but not today → appears in `monthMl` only
- Entry in previous month → excluded from all four totals

### `legacyFeedNormalizer.test.js`

`ml` field transforms:

- `ml: ""` → `amountMl: null`
- `ml: 0` → `amountMl: 0`
- `ml: 120` → `amountMl: 120`

`diaper` field transforms:

- `diaper: ""` → `diaper: null` (blank = incomplete)
- `diaper: null` → `diaper: null` (missing = incomplete)
- `diaper: undefined` → `diaper: null` (absent = incomplete)
- `diaper: "none"` → `diaper: "-"` (no event intended; see note below)
- `diaper: "-"` → `diaper: "-"` (already normalized)
- `diaper: "W"` → `diaper: "W"`
- `diaper: "P"` → `diaper: "P"`
- `diaper: "WP"` → `diaper: "WP"`

`vitd` field transforms:

- `vitd: 0` → `vitaminD: false`
- `vitd: 1` → `vitaminD: true`

Provenance fields on every normalized entry:

- `source: "legacy"`
- `createdByLabel: "Legacy"`
- `createdByUserId: null`
- `medication: false`
- `deleted: false`
- `deletedAt: null`
- `deletedByUserId: null`
- `deletedByLabel: null`
- `updatedAt: null`
- `updatedByUserId: null`
- `updatedByLabel: null`
- Document ID equals the input `id` field
- `notes` copied verbatim

`validateNormalizedEntry` tests:

- Valid complete entry → `{ valid: true, errors: [] }`
- Missing `entryDate` → error reported
- `amountMl` is a string → error reported
- `diaper` is `"none"` → error reported (should have been normalized before validation)

---

## 9. What Must Not Be Touched

- `feeds` Firestore collection — never read or written in Phase 5 code
- Firestore security rules — no changes
- `firestore.indexes.json` — no changes
- All existing `src/utils/` files — `entryUtils.js`, `dateUtils.js`,
  `weekUtils.js`, `unitConverter.js` are tested but not modified
- `src/entries/` — entryService, useEntries, CareLedgerView unchanged
- `src/auth/`, `src/families/`, `src/babies/` — no changes
- `src/app/router.js`, `src/app/firebase.js` — no changes
- HTML app production URL — untouched throughout

---

## 10. Rollback Plan

Phase 5 adds only new files plus Vitest in `package.json` and `package-lock.json`.
No existing functionality is modified.

If Phase 5 must be reverted:

1. Delete `src/utils/ledgerGrouper.js`
2. Delete `src/utils/statsCalculator.js`
3. Delete the `src/migration/` directory
4. Delete the `src/test/` directory
5. Delete `vitest.config.js`
6. Revert `package.json` to remove Vitest and the `test` script
7. Run `npm install` to restore `package-lock.json`

The app builds and runs identically to Phase 4. The HTML app is unaffected.

---

## 11. How Legacy Feed Fields Map to Normalized Entry Fields

```
feeds field    →   entry field        Transform
──────────────────────────────────────────────────────────────────
id             →   (document ID)      direct — stable cross-reference
date           →   entryDate          direct copy
time           →   entryTime          direct copy
ml             →   amountMl           "" → null; number → number
diaper         →   diaper             see diaper mapping below
vitd           →   vitaminD           0 → false; 1 → true
notes          →   notes              direct copy
(absent)       →   medication         always false
(absent)       →   createdByLabel     always "Legacy"
(absent)       →   createdByUserId    always null
(absent)       →   source             always "legacy"
(absent)       →   deleted            always false
(absent)       →   deletedAt          always null
(absent)       →   deletedByUserId    always null
(absent)       →   deletedByLabel     always null
(absent)       →   updatedAt          always null (see section 7)
(absent)       →   updatedByUserId    always null
(absent)       →   updatedByLabel     always null
(absent)       →   createdAt          migration server timestamp
```

### Diaper mapping in full

```
Legacy value   →   Normalized value   Reason
──────────────────────────────────────────────────────────────────
""             →   null               blank = incomplete
null           →   null               missing = incomplete
undefined      →   null               absent = incomplete
"none"         →   "-"                no diaper event (intended)
"-"            →   "-"                already normalized
"W"            →   "W"                wet
"P"            →   "P"                poo
"WP"           →   "WP"               both
```

Note on `"none"`: the HTML app's seed data uses `"none"` to mean "no diaper
event occurred" — a deliberate entry, not a blank. The current assumption is
that `"none"` maps to `"-"` (complete, no event), not `null` (incomplete).
This assumption must be verified against the real `feeds` collection before
migration runs. If any `"none"` values in production actually meant "I forgot
to fill this in", they must be mapped to `null` instead. This is a manual
check, not an automated one.

### Special cases to verify before migration runs

- Check whether any `feeds` document has `diaper: "none"` and confirm the
  intended meaning (no event vs. left blank)
- Check whether any `feeds` document has `ml` stored as a string (e.g. `"120"`
  instead of `120`). If so, coerce with `Number(ml)` before writing
- Check whether any `feeds` document is missing the `id` field (the HTML app
  writes `id` into the document body; confirm it is present in all documents)

---

## 12. What Fixture Data Must Cover

All fixtures in `src/test/fixtures/entries.fixture.js` are synthetic.
No real dates, times, or amounts from the actual Jojo dataset.
The fixture is a small invented set covering all edge cases.

### Required coverage

**Normal completed entries**
- Entry with `amountMl: 120`, `diaper: "W"` — fully complete, contributes to totals
- Entry with `amountMl: 90`, `diaper: "WP"` — fully complete

**0 mL medication/diaper-only rows**
- Entry with `amountMl: 0`, `diaper: "P"` — complete; does NOT contribute to
  mL total; does NOT count as a feed

**"-" diaper rows**
- Entry with `amountMl: 150`, `diaper: "-"` — complete (no event, milk given)

**Incomplete rows**
- Entry with `amountMl: null`, `diaper: "W"` — incomplete (amount missing)
- Entry with `amountMl: 90`, `diaper: null` — incomplete (diaper missing)
- Entry with `amountMl: null`, `diaper: null` — both fields missing

**Vitamin D row**
- Entry with `vitaminD: true` — appears normally; does not affect completion

**Medication row**
- Entry with `medication: true`, `amountMl: 0` — valid 0 mL entry

**Notes**
- Entry with non-empty `notes` field — copied verbatim, not tested for content

**Deleted rows**
- Entry with `deleted: true` — excluded from all grouping, totals, and stats

**Cross-month week entries**
- Entry on the last day of a month (e.g. "2026-01-31") and entry on the first
  day of the following month (e.g. "2026-02-01"), both in the same ISO week
- Must appear under separate month nodes with the same `weekStartDate` key

**Cross-year boundary**
- Entry on "2025-12-31" and entry on "2026-01-01" — separate months, same week
- `weekOf("2025-12-31")` must return `"2025-12-29"` (not a 2026 date)

**Legacy-sourced entries**
- Entry with `source: "legacy"`, `createdByLabel: "Legacy"`, `createdByUserId: null`,
  `updatedAt: null`
- Must group and total correctly alongside `source: "app"` entries

**Same-day multiple entries**
- Three entries on the same date with different times — sorted ascending by `entryTime`

**Multi-month span**
- Fixture must cover at least 3 calendar months to verify month ordering

### Legacy feed fixture (for normalizer tests)

A separate fixture of raw `feeds`-shaped objects covering:

- `ml: ""` (blank amount)
- `ml: 0` (zero amount)
- `ml: 120` (normal amount)
- `diaper: ""` (blank diaper)
- `diaper: "none"` (no-event value)
- `diaper: "-"` (already normalized)
- `diaper: "WP"` (normal value)
- `vitd: 0` and `vitd: 1`
- Document with `notes` field
- Document with empty `notes` field

---

## 13. What Must Stay Client-Side to Avoid New Firestore Indexes

The following must remain computed client-side in Phase 5 and beyond:

- Month → Week Segment → Day grouping (all sorting by `entryDate`, `entryTime`)
- Today's total mL
- 7-day rolling total mL
- This-month total mL
- Feed count
- Incomplete entry detection
- Cross-month week detection and splitting

Avoiding these as Firestore queries means no composite index on
`(entryDate, entryTime)` or `(deleted, entryDate)` is needed.
The single `onSnapshot` on the full entries collection (already in place)
provides all raw data; everything above is derived in memory.

If the household grows beyond one baby with years of history, a composite
index could be added later with no code change to the grouper. For now,
client-side is the correct default.

---

## 14. What Must Be Proven Before Phase 6 Ledger UI Starts

Phase 6 (ledger hierarchy UI) must not begin until:

1. `npm test` passes — all unit tests green with no skips
2. `ledgerGrouper` cross-month fixture test passes with correct isolated month totals
3. `statsCalculator` feed count is lower than entry count for the fixture containing
   0 mL and null entries (confirming the bug fix over the old `tf.length` approach)
4. `isIncomplete` returns `false` for `{ amountMl: 0, diaper: "-" }` (confirmed)
5. `npm run build` still passes after Phase 5 files are added
6. No new Firestore indexes introduced
7. User approves Phase 6 after reviewing Phase 5 test results

---

## 15. What Must Be Proven Before Any Migration Runs

Migration is a separate action from Phase 5 (code and tests) and Phase 6 (UI).
Migration must not run until:

1. All Phase 5 tests pass (`npm test` green)
2. A CSV backup of `feeds` exists and the row count is recorded
3. `normalizeLegacyFeedToEntry` has been tested against every edge case in the
   fixture including `ml: ""`, `diaper: ""`, `diaper: "none"`, `vitd: 0`, `vitd: 1`
4. The user has manually inspected the `feeds` collection for:
   - Any `diaper: "none"` values and confirmed their intended meaning
   - Any `ml` values stored as strings instead of numbers
   - Any documents missing the `id` field
5. `migrationChecks.js` functions have been reviewed and their logic confirmed
6. The migration runner script (a future Phase, not Phase 5) includes a
   dry-run mode that logs what would be written without calling `setDoc`
7. The Vue app is accessible on a preview URL distinct from the production
   Vercel URL
8. Both parents have confirmed they understand migration is non-destructive
   and the HTML app will keep working throughout

Migration runs in a separate session, after explicit approval.
