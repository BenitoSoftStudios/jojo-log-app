# Phase 6.5 — Owner CSV Export

**Date:** 2026-05-24
**Status:** Complete and committed.

## What changed

### src/utils/csvExporter.js (new)

Pure utility with no Firebase dependency.

- `escapeCell(val)` — converts null/undefined to empty string; wraps strings containing commas, double-quotes, or line breaks in double quotes; doubles internal double quotes per RFC 4180.
- `buildCsvRow(entry, babyNickname, weeklyAmounts)` — computes `weekStartDate` via `getWeekStartForDate`, looks up `usualBottleAmountMl` from the passed map, emits one CSV row.
- `generateCsv(entries, babyNickname, weeklyAmounts)` — header row + data rows, CRLF line endings.
- `downloadCsv(csvString, filename)` — creates a Blob URL, clicks a temporary `<a>` element, revokes the URL.

CSV columns: `babyNickname`, `entryId`, `entryDate`, `entryTime`, `amountMl`, `diaper`, `vitaminD`, `medication`, `tummyTimeCount`, `notes`, `source`, `createdByLabel`, `createdAt`, `updatedByLabel`, `updatedAt`, `deleted`, `deletedAt`, `weekStartDate`, `usualBottleAmountMl`.

Timestamps export as ISO strings via `.toDate().toISOString()` when the value is a Firestore Timestamp. Null timestamps export as empty cells. Booleans export as `true`/`false`.

### src/test/csvExporter.test.js (new)

29 tests covering:
- `escapeCell`: null, undefined, plain string, number, 0, false, true, comma, double-quote, newline, carriage return, combined comma+quote.
- `buildCsvRow`: column count, field ordering, weeklyAmounts lookup, missing week, notes with comma, notes with quote, notes with newline, deleted flag, weekStartDate computation, null amountMl, 0 amountMl, Firestore Timestamp conversion.
- `generateCsv`: header row content, empty entries, single entry row count, CRLF line endings.

### src/entries/CareLedgerView.vue

- Added imports: `getWeekStartForDate`, `generateCsv`, `downloadCsv`, `useWeeklySettings`.
- Added `const { loadWeekSettings, getBottleAmount } = useWeeklySettings()`.
- Added `exporting` and `exportError` refs.
- Added `handleExportCsv()`: collects unique weekStartDates from active entries, loads weekly settings (cache-first, no duplicate reads), builds weeklyAmounts map, generates CSV, triggers download, closes menu.
- Added `Export CSV` button in menu (owner-only, `v-if="isOwner"`).
- Added inline `exportError` display below the button (owner-only).
- Added `.menu-export-error` CSS rule.

### docs/backlog/export.md

Updated with Phase 6.5 completion note and future items: include-deleted toggle, date-range filter, non-owner access.

## Architecture notes

- `useWeeklySettings` is a module-level singleton; when `CareWeekSegment` has already loaded a week, `loadWeekSettings` is a no-op. No duplicate Firestore reads.
- Export is client-side only. No backend, no Cloud Function.
- Active entries only (no deleted). See backlog for the include-deleted option (trivial to add with a UI toggle).

## No Firestore rules changes. No index changes.
