# Phase 5.5 — Tummy Time Data Support

**Status:** Implemented. No UI changes. No Firestore rules changes.

---

## Goal

Add `tummyTime` as a first-class boolean field on the entry data model before the Phase 6 ledger UI is built. Establishes the field in the service layer, migration normalizer, default builders, and tests so Phase 6 can use it without data-model uncertainty.

---

## Changed Files

1. `src/entries/entryService.js`
   — Added `'tummyTime'` to `MUTABLE_FIELDS`. Added `tummyTime: fields.tummyTime ?? false` to `createEntry`.

2. `src/utils/entryUtils.js`
   — Added `tummyTime: false` to the return value of `buildNewEntryDefaults` and to `entryFields` in `buildStartNextDayEntry`.

3. `src/migration/legacyFeedNormalizer.js`
   — Added `tummyTime: false` to `normalizeLegacyFeedToEntry` data output. Added `typeof entry.tummyTime !== 'boolean'` check to `validateNormalizedEntry`.

4. `src/test/fixtures/entries.fixture.js`
   — Added `tummyTime: false` to `makeEntry` defaults (all existing fixtures inherit this). Added `TUMMY_TIME_ENTRY` (`e020`) with `tummyTime: true` to cover the true case.

5. `src/test/entryUtils.test.js`
   — Added three `describe` blocks:
   - `tummyTime does not affect completion or feed count` — 5 tests
   - `buildNewEntryDefaults — tummyTime` — 2 tests
   - `buildStartNextDayEntry — tummyTime` — 1 test

6. `src/test/legacyFeedNormalizer.test.js`
   — Added `sets tummyTime to false` to the provenance describe block. Added 2 tests to `validateNormalizedEntry` for tummyTime type validation.

7. `docs/data-model.md`
   — Added `tummyTime: boolean` to the entries schema. Updated the completion rule note.

---

## Field Specification

- Field name: `tummyTime`
- Type: `boolean`
- Default: `false`
- Stored in: `families/{familyId}/babies/{babyId}/entries/{entryId}`
- Added to `MUTABLE_FIELDS`: yes — callers may update it via `updateEntry`
- Affects completion: no
- Affects mL totals: no
- Affects feed count: no

---

## Legacy Entry Behaviour

Legacy entries migrated from `feeds` receive `tummyTime: false`. The `feeds` collection did not track tummy time. This is not a data loss — it accurately reflects that no tummy time data was captured for those rows.

The migration runner (Phase 10) will write `tummyTime: false` for all migrated documents as part of the normalized data returned by `normalizeLegacyFeedToEntry`.

---

## What Was Not Changed

- No Firestore rules
- No migration runner
- No UI components
- No router
- No Firebase imports in migration or utility files
- No `feeds` collection access
- No `deleteDoc`
- `isIncomplete` — unchanged (tummyTime never gates completion)
- `isCompletedFeed` — unchanged (tummyTime never gates feed count)
- `ledgerGrouper.js` — unchanged
- `statsCalculator.js` — unchanged
- All existing 96 Phase 5 tests — unchanged and still passing

---

## Test Count

Phase 5 baseline: 96 tests.
Phase 5.5 additions: 11 tests.
Total after Phase 5.5: 107 tests.
