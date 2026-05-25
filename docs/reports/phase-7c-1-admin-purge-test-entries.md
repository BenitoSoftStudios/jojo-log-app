# Phase 7C-1 — Admin Purge Test Entries

**Date:** 2026-05-24
**Status:** Complete and committed.

## What changed

### src/entries/useAdminEntryPurge.js (new)

Isolated hard-delete utility. This is the **only** file in the codebase that uses `deleteDoc` / `writeBatch`. All other delete paths remain soft-delete (`deleted: true`).

- `purgeTestEntries(entries)` — takes an array of entry objects. Internally filters to `source !== 'legacy'` (safety double-check even if caller already filtered). Splits into batches of 450 (under Firestore 500-op batch limit). Calls `writeBatch.delete()` for each entry ref under `families/{familyId}/babies/{activeBabyId}/entries/{entryId}`. Returns `{ deleted, skipped }`.
- Throws `'No active family or baby'` if context is missing.
- Uses `familyId` and `activeBabyId` from module-level singleton composables (same pattern as rest of codebase).

### src/admin/LegacyImportView.vue

- Updated notice banner to reflect import is preview-only but purge is now available.
- Replaced preview-only purge panel with live purge panel:
  - Warning box: scope clearly stated ("permanently removes test entries for Jojo only; feeds, babies, family, members, weekly settings not touched").
  - Purgeable count and sample rows (up to 5).
  - Confirmation phrase input: must type `PURGE TEST ENTRIES` exactly.
  - Purge button: disabled until phrase matches; disabled during in-flight purge.
  - Success state: shows deleted count and skipped count (if any).
  - Error state: shows inline error if `purgeTestEntries` throws.
- After purge, `purgeableEntries` is a computed that reads from `liveEntries`/`deletedEntries` (reactive from `useEntries` Firestore listener). Purged docs disappear from the snapshot automatically — no manual state reset needed.
- Added `purge-btn` CSS (red border/text, opacity-disabled, touch-friendly).

## Hard-delete scope

```
families/{familyId}/babies/{activeBabyId}/entries/{entryId}
  where source !== "legacy"
```

Nothing else is touched.

## deleteDoc / writeBatch policy

`deleteDoc` and `writeBatch` appear **only** in `src/entries/useAdminEntryPurge.js`. Confirmed by grep across all `.js` and `.vue` files. All other delete paths in the app remain soft-delete.

## No Firestore rules changes. No index changes. No import writes.
