# Phase 6.4D — Usual Bottle Prefill for New Entries

**Date:** 2026-05-24
**Status:** Complete and committed.

## What changed

### useLedgerActions.js

- Added imports: `useWeeklySettings`, `getWeekStartForDate`.
- `createDay` and `addEntry` both now call `await loadWeekSettings(weekStart)` before creating an entry, then read `getBottleAmount(weekStart)` from the shared module-level cache.
- If a usual bottle amount is set for that week, `{ usualBottleAmountMl: weeklyAmt }` is passed as `weekSettings` to `buildNewEntryDefaults`; otherwise `null` is passed (behaviour unchanged).
- `buildNewEntryDefaults` already accepted this parameter and used it to set `amountMl`; no changes needed in `entryUtils.js`.

### CareLedgerView.vue

- `.day-picker-btn--use-date`: added `justify-content: center` and `font-weight: var(--font-weight-semibold)` so the "Use this date" button text is centred and reads as a button.

## Architecture notes

- `useWeeklySettings` is a module-level singleton. When `CareWeekSegment` has already loaded the week's settings, `loadWeekSettings` is a no-op (key already in cache). No duplicate Firestore reads.
- When usual bottle is not set (`null`), `buildNewEntryDefaults` returns `amountMl: null` — identical to prior behaviour.

## Behaviour unchanged

- Existing entries are not modified.
- The weekly settings Firestore path is read-only here (no writes in this phase).
- No Firestore rules changes.
- No index changes.
