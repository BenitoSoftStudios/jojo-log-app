# Phase 7E — Post-Migration UI and CSV Import Cleanup

**Date:** 2026-05-25
**Status:** Complete and committed.

## Changed files

| File | Change |
|------|--------|
| `src/entries/CareLedgerView.vue` | Add Day time input; Import CSV menu rename |
| `src/entries/CareEntryRow.vue` | Notes indicator → clickable button |
| `src/entries/useLedgerActions.js` | `createDay(date, time)` — time parameter |
| `src/admin/LegacyImportView.vue` | Full rewrite: new schema, no purge, renamed |
| `src/admin/useLegacyImportWriter.js` | Added `writeAppCsvEntries` |
| `src/utils/appCsvImporter.js` | **New**: app CSV parser |
| `src/test/appCsvImporter.test.js` | **New**: 35 tests |
| `src/entries/useAdminEntryPurge.js` | **Deleted**: no longer imported |

## Goal 1: + Day date and time

**Before**: clicking Today/Next day/Use this date immediately created the entry.

**After**: clicking a date option selects it (green highlight) and shows a time input + "Create entry" button below.

- `selectAddDay(date, isToday)`: sets `addDayDate` and `addDayTime`.
  - `isToday = true` → defaults to current local HH:MM.
  - `isToday = false` → defaults to `00:00`.
- Custom date: `@change` handler calls `selectAddDay` immediately after the date input changes.
- Time input: `<input type="time" v-model="addDayTime">` — user can edit.
- "Create entry" button: calls `doCreateDay()` with `addDayDate` and `addDayTime`.
- `useLedgerActions.createDay(date, time)`: spreads `defaults` then overrides with `entryTime: time ?? defaults.entryTime`.
- Usual bottle prefill unchanged: `buildNewEntryDefaults` still provides `amountMl`.
- "Use this date" button remains centered + semibold (uses `day-picker-btn--use-date` class).
- New `day-picker-btn--selected` CSS: mint border/bg when a date is active.

## Goal 2: Notes indicator opens details

`CareEntryRow.vue`: changed `<span class="sym-notes">` to `<button class="sym-notes">` with `@click="emit('open-detail', entry)"` and `aria-label="Open notes"`. Added button-reset styles (background: none, border: none, cursor: pointer, etc.). The `...` detail button continues to work independently.

## Goal 3: Rename Legacy Import → Import CSV

- `CareLedgerView.vue` menu: `Legacy Import` → `Import CSV`
- `LegacyImportView.vue` header: `Legacy Import` → `Import CSV`
- Route path `/admin/legacy-import` unchanged.
- Notice banner ("Import: preview only…") removed.

## Goal 4 + 5: Import CSV — new schema, no purge

### Parser: `src/utils/appCsvImporter.js`

Accepts only the 19-column Jojo app export CSV. Header mismatch → "This file does not match the Jojo export format." Blocking errors: blank `entryId` (row skipped + reported), duplicate `entryId`.

Field parsing rules:
- `amountMl`: blank → null; numeric string → number
- `diaper`: blank → null; only W/P/WP/- accepted, others → null
- `vitaminD`, `medication`, `deleted`: `"true"` → true, else false
- `tummyTimeCount`: blank → 0; numeric string → number
- `createdAt`, `updatedAt`, `deletedAt`: ISO string preserved; blank → null (stored as string)
- `notes`: preserved verbatim (no trim)

Not imported: `babyNickname`, `weekStartDate`, `usualBottleAmountMl`.

### Writer: `writeAppCsvEntries` in `useLegacyImportWriter.js`

Same batch-write pattern as `writeLegacyEntries` (chunk size 450). Uses `entry.id` (from CSV `entryId`) as doc ID. Idempotent via `batch.set()`. Preserves `createdAt` as string (not `serverTimestamp()`).

### LegacyImportView.vue rewrite

- Destination: any active baby (no Jojo name check).
- Confirmation phrase: `IMPORT CSV TO {BABY_NICKNAME_UPPERCASE}` (e.g. `IMPORT CSV TO JOJO`).
- Preview stats: row count, valid rows, skipped rows, deleted rows count, total mL (non-deleted), date range, source values.
- Import result: rows written, date range, total mL, sources.
- All `useEntries` / `deletedEntries` imports removed (were only used by purge).
- Purge panel fully removed.

### Deleted: `src/entries/useAdminEntryPurge.js`

No longer imported by any file. Deleted to eliminate the only remaining `deleteDoc`/`writeBatch.delete` path.

## Safety confirmations

- No feeds mutation
- No migration rerun
- No Firestore rules/indexes changed
- No PWA/Capacitor/SW/manifest
- No graphs
- No new `deleteDoc` use
- No purge/delete UI

## `deleteDoc` / `writeBatch` grep result

```
deleteDoc: 0 occurrences in src/
writeBatch: useLegacyImportWriter.js only (write path, no delete)
```

## Results

- Tests: 268 / 268 (10 test files; 35 new in appCsvImporter.test.js)
- Build: clean (pre-existing chunk-size warning only)
- main synced with origin/main: yes
- Vercel redeploy expected: yes
