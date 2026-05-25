# Phase 7C-2 — Admin Legacy CSV Import Write

**Date:** 2026-05-24
**Status:** Complete and committed.

## What changed

### src/admin/useLegacyImportWriter.js (new)

Isolated write utility. Uses `writeBatch` + `batch.set()` (setDoc equivalent) to write deterministic legacy-csv-* entry docs.

- `writeLegacyEntries(entries, onProgress)` — takes the transformed entry array from `legacyCsvParser.transformRows()`. Splits into chunks of 450 (below Firestore 500-op batch limit). For each entry, calls `batch.set(doc(entriesCol, entry.id), {...})` using the deterministic ID already in `entry.id`. Commits each chunk and calls `onProgress({ batchIndex, batchCount, written })` after each commit. Returns `{ written, batchCount }`.
- **Idempotent**: `batch.set()` overwrites an existing doc — re-running the import produces the same 652 docs, no duplicates.
- `createdAt`: set to `serverTimestamp()` at write time (matches the normal entry schema).
- `updatedAt`: explicitly `null` (per spec — legacy entries have no update history).
- Uses `familyId` and `activeBabyId` from module-level singleton composables. Throws `'No active family or baby'` if context is missing.

### src/admin/LegacyImportView.vue

Added to script:
- `parsedEntries` ref — stores the transformed entry array from `handleFile` for use in the write phase.
- `importing`, `importProgress`, `importError`, `importResult` refs.
- Updated `handleFile` to reset all import state on new file load and store `parsedEntries.value`.
- `handleImport()` — calls `writeLegacyEntries`, tracks progress, sets `importResult` on success and `importError` on failure (includes batch progress context in the error message if mid-import).

Added to template (inside the confirmation section):
- Import button: visible only when `importReady && !importResult`. Disabled while importing. Label shows row count and destination baby name.
- Progress indicator: shows current batch / total batches and rows written so far.
- Success summary: rows imported, expected row count, total mL, date range, source.
- Error message: shows on failure, includes how many rows/batches completed before failure.
- Confirmation phrase input disabled while importing or after success.

Added to style: `.import-btn` (mint border/text, semibold), `.alert--info` (neutral progress state), `.import-result-list`.

## Write scope

```
families/{familyId}/babies/{activeBabyId}/entries/{legacy-csv-NNNNNN}
```

Nothing else is written.

## Firestore write operations

`writeBatch`/`batch.set()` appear only in `src/admin/useLegacyImportWriter.js`.
Confirmed by grep — no other non-service files use these operations.

## Batch math for 652 rows at chunk size 450

- Batch 1: rows 1–450 (450 writes)
- Batch 2: rows 451–652 (202 writes)
- Both well under the 500-op Firestore batch limit.

## No Firestore rules changes. No index changes. No feeds writes. No deleteDoc added.
