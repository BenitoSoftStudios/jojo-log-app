# Phase 7B — Admin Legacy Import Preview Tool

**Date:** 2026-05-24
**Status:** Complete and committed.
**Write phase:** Deferred to Phase 7C.

## What changed

### src/utils/legacyCsvParser.js (new)

Pure utility — no Firebase imports, no side effects.

Three exported functions:

- `parseRows(text)` — low-level CSV parser handles quoted fields, commas inside quotes, double-quote escaping (`""`), and newlines inside quoted fields (notes). Header row is skipped. Blank rows are skipped. Each row gets a 1-based `_rowIndex` used for deterministic ID generation.
- `transformRows(rawRows)` — maps raw rows to entry-shaped objects. IDs: `legacy-csv-000001` … `legacy-csv-NNNNNN`. Amount (mL) blank → null, number → integer. Diaper none → `-`, blank → null. VitaminD yes → true, blank → false. source: `"legacy"`, createdByLabel: `"Legacy"`.
- `validateRows(entries)` — returns counts: rowCount, totalMl, dateRange, blankAmountRows, blankDiaperRows, diaperNoneRows, zeroMlRows, vitaminDYesRows, notesRows, duplicates array, errors array, warnings array. Errors block import; warnings do not.

### src/test/legacyCsvParser.test.js (new)

56 tests covering parseRows (header skip, blank rows, _rowIndex, field parsing, quoted commas, escaped quotes, embedded newlines, LF endings), transformRows (ID format, zero-padding, Amount variants, all Diaper values, VitaminD, source fields, notes verbatim), and validateRows (totalMl, blankAmountRows, zeroMlRows, diaperNoneRows, vitaminDYesRows, notesRows, duplicates, dateRange, warnings).

### src/families/useFamily.js

Added `isLegacyImportAdmin` computed:
```js
const isLegacyImportAdmin = computed(() =>
  _currentMember.value?.role === 'owner' &&
  _currentMember.value?.legacyImportAdmin === true
)
```
Returned from `useFamily()`. No Firestore field is written here — the `legacyImportAdmin: true` field must be set manually in the Firebase console on the owner's member document (`families/{familyId}/members/{ownerUid}`) before Phase 7B can be tested.

### src/app/router.js

Added lazy-loaded route:
```js
{
  path: '/admin/legacy-import',
  name: 'admin-legacy-import',
  component: () => import('@/admin/LegacyImportView.vue'),
  meta: { requiresAuth: true }
}
```
The route guard enforces auth. The component adds its own `isLegacyImportAdmin` check on mount, redirecting non-admins to `/`.

### src/entries/CareLedgerView.vue

- Added `isLegacyImportAdmin` to `useFamily()` destructure.
- Added `<router-link v-if="isLegacyImportAdmin">Legacy Import</router-link>` in menu nav. Hidden from all non-admin users.

### src/admin/LegacyImportView.vue (new)

Mobile-first admin view. Sections:

1. **Admin gate** — shows "Access denied" and redirects if `isLegacyImportAdmin` is false.
2. **Preview-only notice** — persistent banner explaining no writes occur in this phase.
3. **Destination** — shows `activeBaby.nickname`. Blocks the upload/preview flow if `activeBaby` is null or `nickname !== 'Jojo'`.
4. **Upload** — `<input type="file">`, reads via `file.text()` (client-side only, never uploaded).
5. **Preview** — after parsing: all 11 stat rows, duplicate pair list (warnings), error list (blocks import). Confirmation phrase input: `IMPORT TO JOJO`. When phrase matches and no errors, shows "Preview confirmed" notice (no writes).
6. **Purge panel** — shows purgeable count (`source !== 'legacy'`), sample of up to 5 rows, and the future phrase requirement (`PURGE TEST ENTRIES`). No deletion calls.

## Pre-test manual step required

Set `legacyImportAdmin: true` on the owner member document in Firebase console:
```
families/{familyId}/members/{ownerUid}
→ legacyImportAdmin: true
```

## No Firestore writes. No Firestore rules changes. No index changes.

## Next phase

Phase 7C: Batch setDoc import writes with progress bar and result summary.
- Prerequisite: preview confirmed with real CSV (652 rows, 42,998 mL, 4 duplicates).
- Purge (soft-delete of source ≠ "legacy" entries) can be added in 7C or as a separate step before import.
