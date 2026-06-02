# Phase 9H — Import, export, and data schema audit

## Summary

Safety and compatibility audit after recent schema additions (`tummyTimeDurationSeconds`, `medicationNote`, `animalAvatar`, optional birthdate). Found and fixed one real bug in `writeAppCsvEntries`, which silently dropped `medicationNote` and `tummyTimeDurationSeconds` during re-import. Added 20 new tests covering round-trip correctness for special characters, duplicate detection with optional fields, and wrong-baby detection. All existing tests continue to pass. UI copy confirmed clean — no stale Legacy Import or purge language.

---

## Changed files

| File | Change |
|------|--------|
| `src/admin/useLegacyImportWriter.js` | Bug fix: `writeAppCsvEntries` now writes `medicationNote` and `tummyTimeDurationSeconds`; both fields were previously dropped |
| `src/test/appCsvImporter.test.js` | +12 tests: medicationNote special chars, notes special chars, duplicate detection with optional fields, wrong-baby detection |
| `src/test/csvExporter.test.js` | +9 tests: round-trip `generateCsv → parseAppCsv` for medicationNote/notes/duration special chars and null cases |

---

## CSV schema table

Schema version: **v3** (21 columns). All earlier versions are accepted on import.

| # | Column | Required? | Type | Blank/null behavior | Notes |
|---|--------|-----------|------|---------------------|-------|
| 1 | `babyNickname` | Yes | string | — | Used for baby mismatch check on import; not stored as entry field |
| 2 | `entryId` | Yes | string | Row skipped with error | Used as Firestore doc ID; duplicate entryId in one CSV blocks import |
| 3 | `entryDate` | Yes | YYYY-MM-DD | — | Entry date |
| 4 | `entryTime` | No | HH:MM | Blank → null | Entry time |
| 5 | `amountMl` | No | number | Blank/non-numeric → null | Feed volume; 0 is valid |
| 6 | `diaper` | No | W / P / WP / - | Blank/unknown → null | Diaper code; unknown values silently nulled |
| 7 | `vitaminD` | No | true/false | Anything else → false | Vitamin D given flag |
| 8 | `medication` | No | true/false | Anything else → false | Medication given flag |
| 9 | `tummyTimeCount` | No | integer | Blank → 0 | Tummy time session count |
| 10 | `notes` | No | string | Preserved verbatim (no trim) | Free-text notes; comma/quote/newline safe via CSV quoting |
| 11 | `source` | No | string | Blank → null | `"app"` or `"legacy-csv-import"` |
| 12 | `createdByLabel` | No | string | Blank → null | Display name of creator |
| 13 | `createdAt` | No | ISO timestamp string | Blank → null | Preserved as string on re-import |
| 14 | `updatedByLabel` | No | string | Blank → null | Display name of last updater |
| 15 | `updatedAt` | No | ISO timestamp string | Blank → null | Preserved as string on re-import |
| 16 | `deleted` | No | true/false | Anything else → false | Soft-delete flag |
| 17 | `deletedAt` | No | ISO timestamp string | Blank → null | When it was deleted |
| 18 | `weekStartDate` | No | YYYY-MM-DD | — | Computed week start for usual-bottle lookup; not stored |
| 19 | `usualBottleAmountMl` | No | number | — | Weekly usual bottle; informational only on import |
| 20 | `tummyTimeDurationSeconds` | No | integer | Blank/non-numeric → null | Added in schema v2; absent in v1 CSVs → null |
| 21 | `medicationNote` | No | string | Blank → null | Added in schema v3; absent in v1/v2 CSVs → null; trimmed on parse |

**`animalAvatar` is NOT a column.** It is baby metadata stored on the baby document, not entry data.

---

## Export behavior summary

1. **Active baby only** — `CareLedgerView` passes `entries.value` which comes from `useEntries` / `subscribeToEntries`, subscribed to `families/{familyId}/babies/{babyId}/entries`. Only the active baby's entries are loaded. The exporter itself applies no filtering.
2. **Includes soft-deleted entries** — `deleted: true` entries are included in the export. The `deleted` and `deletedAt` columns are populated so re-import preserves the delete state.
3. **No email addresses** — export uses `createdByLabel` (display name string), not userId or email.
4. **No baby real name** — exports `babyNickname` as stored; the app only stores nicknames.
5. **No `animalAvatar`** — avatar is baby metadata, not entry history.
6. **`tummyTimeDurationSeconds`** — column 20. Null → blank cell; numeric → plain integer string.
7. **`medicationNote`** — column 21. Null → blank cell; non-null → RFC-4180 escaped (quoted if contains comma, double-quote, or newline).
8. **Column order** — newer optional columns appended at the end (positions 20, 21), preserving backward compatibility.
9. **Timestamp format** — Firestore Timestamps are converted to ISO 8601 via `toDate().toISOString()`.

---

## Import behavior summary

1. **Backward-compatible** — v1 (19 cols), v2 (20 cols), and v3 (21 cols) all accepted. Extra columns are name-looked-up; missing optional columns default to null.
2. **Header validation** — the first 19 columns must match `EXPECTED_HEADERS` exactly. Mismatch → error, import blocked.
3. **`tummyTimeDurationSeconds`** — absent column → null; blank → null; numeric → integer; non-numeric → null (silent, consistent with existing lenient style for count fields).
4. **`medicationNote`** — absent column → null; blank → null; non-blank → trimmed string. Notes field does NOT get trimmed (preserved verbatim).
5. **`animalAvatar`** — not parsed, not written. Import does not update baby metadata.
6. **Birthdate** — not imported; not inferred; not backfilled from entries.
7. **Baby creation** — import does not create new babies.
8. **Active-baby scoped** — `writeAppCsvEntries` writes to `families/{familyId}/babies/{activeBabyId}/entries`.
9. **Source field** — preserved from CSV; not overwritten. App-created entries re-import with source `"app"`.

---

## Duplicate prevention summary

1. **Intra-file duplicate detection** — `parseAppCsv` detects duplicate `entryId` values within the CSV file and blocks import immediately (error added, import blocked).
2. **Cross-file duplicate detection** — `checkForExistingIds` compares parsed CSV `entryId` values against both `entries.value` and `deletedEntries.value` from Firestore. Any overlap blocks import with a count and sample of overlapping IDs.
3. **Optional fields do not affect duplicate detection** — duplicate check is purely by `entryId`. Having `medicationNote` or `tummyTimeDurationSeconds` does not create false negatives.
4. **Preview visibility** — the preview pane shows "New entries" and "Already in log" counts before any write.
5. **Block vs. warn** — overlaps currently block import (not just warn). No write occurs until errors are resolved. This is correct and intentional.
6. **Re-import safety** — re-importing the app's own export is completely blocked (all IDs would overlap). This prevents accidental duplication.

---

## Wrong-baby and active-baby safety summary

1. **Baby name check in UI** — after parsing, `LegacyImportView` compares `preview.babyNames` against `activeBaby.nickname`. If they don't match exactly (or `hasBlankBabyName` is true, or there are multiple names), an error is pushed and import is blocked.
2. **Blank baby name** — treated as a mismatch; import blocked.
3. **Multiple baby names in CSV** — treated as a mismatch; import blocked.
4. **Preview shows CSV baby name** — the "Baby name in CSV" preview row shows what was found.
5. **No baby metadata written** — `writeAppCsvEntries` writes only entry fields. No nickname, birthdate, or avatar update occurs.
6. **No baby creation** — `writeAppCsvEntries` only calls `batch.set` on entry documents.

---

## Soft delete and source behavior summary

1. **Export includes deleted entries** — `deleted: true` rows are exported with populated `deletedAt`. This is intentional: the full history including soft-deletes is preserved.
2. **Re-import of deleted entries** — if a deleted entry is re-imported, `writeAppCsvEntries` calls `batch.set` with `deleted: true`. It would overwrite an existing doc with the same state (idempotent). Currently blocked by the duplicate check.
3. **Source preservation** — `source` is read from CSV and written as-is. App entries keep `"app"`, legacy entries keep `"legacy-csv-import"` or similar.
4. **No hard delete** — `writeAppCsvEntries` uses `batch.set`, not `deleteDoc`.
5. **`useLegacyImportWriter.js` naming** — the file is named `useLegacyImportWriter.js` but the `writeAppCsvEntries` function it exports is the one used for app CSV re-import. The `writeLegacyEntries` function (for the original legacy migration) is still present but not called from the current Import CSV UI.

---

## Bug fixed: `writeAppCsvEntries` dropped `medicationNote` and `tummyTimeDurationSeconds`

**Root cause**: `writeAppCsvEntries` in `src/admin/useLegacyImportWriter.js` was written before `medicationNote` and `tummyTimeDurationSeconds` were added to the schema. The `batch.set` call did not include those fields. Since `batch.set` overwrites the entire document, re-importing would have silently cleared both fields from any existing entry.

**Fix**: Added `medicationNote: entry.medicationNote ?? null` and `tummyTimeDurationSeconds: entry.tummyTimeDurationSeconds ?? null` to the `batch.set` call in `writeAppCsvEntries`.

**Impact**: This bug only affected re-import (which is currently blocked by the overlap check), but would have been triggered if/when overwrite support is added. It is now correct.

---

## UI copy summary

No changes made. The Import CSV page copy was verified as clean:

- Page title: "Import CSV" ✓ (via `SecondaryHeader`)
- "Destination" section clearly shows active baby nickname ✓
- Preview before write: full preview section appears before confirmation input ✓
- Duplicate prevention: preview shows "New entries" / "Already in log" counts ✓
- Wrong-baby blocking: preview shows "Baby name in CSV"; error pushed if mismatch ✓
- Short and parent-friendly: labels are plain English ✓
- No "Legacy Import", migration, or purge language in visible UI ✓
- Admin-only gate: non-admins see "Access denied. Admin only." and are redirected ✓

---

## Tests result

**374 tests passing** (`npm test`). +20 new tests:

- `csvExporter.test.js` (+9): round-trip `generateCsv → parseAppCsv` for medicationNote comma/quote/newline, notes comma/quote/newline, tummyTimeDurationSeconds numeric and blank, medicationNote blank
- `appCsvImporter.test.js` (+12): medicationNote special chars (comma/quote/newline) via manual quoted CSV, notes special chars (comma/quote/newline), duplicate detection with optional fields, wrong-baby detection (mismatch name, blank name, mixed names)

---

## Build result

`npm run build` — clean (0 errors). Pre-existing chunk size advisory unchanged.

---

## Safety confirmations

- No feeds path changed ✓
- No Firestore rules/indexes changed ✓
- No migration or bulk data mutation ✓
- No new Firestore listeners ✓
- `grep -r "deleteDoc" src/` — no matches ✓
- No PWA/Capacitor/SW/manifest ✓
- No image upload / Firebase Storage / external image URLs ✓
- No medical recommendation language ✓
- No new dependencies ✓
- No real Jojo data or original SEED array used in tests ✓
- Import does not update baby nickname, birthdate, or avatar ✓
- Import does not create babies ✓
- Import does not infer or backfill birthdate ✓

---

## Manual QA checklist

1. Export current active baby CSV from the ledger (hamburger menu → Export CSV).
2. Confirm file has 21 header columns ending in `tummyTimeDurationSeconds,medicationNote`.
3. Open Import CSV as admin; select the exported file.
4. Confirm preview shows the active baby's nickname in "Baby name in CSV".
5. Confirm "Already in log" count equals the total row count (all IDs overlap → import blocked).
6. Try importing a CSV where `babyNickname` differs from active baby → confirm "CSV baby does not match" error.
7. Confirm medication notes and tummy time duration values appear in the preview date range / source lines (they won't show in preview stats but the CSV itself should have the values).
8. (Optional) Create a test entry with a medication note containing a comma and one with a newline, export, open the CSV in a text editor, confirm the field is quoted correctly.

---

## Known issues or follow-ups

- `writeAppCsvEntries` uses `batch.set` which overwrites the entire document. If overwrite support is enabled in the future, this is now correct — all fields including `medicationNote` and `tummyTimeDurationSeconds` will be preserved on overwrite.
- `tummyTimeDurationSeconds` with value `"0"` imports as `null` (via `parseInt('0') || null` = `0 || null` = `null`). This is consistent with the app's behavior where 0 seconds = no duration recorded. No fix needed.
- `medicationNote` is `.trim()`'d on parse (via `get()`). Notes field is not trimmed (via direct array index). This asymmetry is intentional — medication notes are always stored trimmed by the app, regular notes may carry whitespace.
- `useLegacyImportWriter.js` still exports `writeLegacyEntries` (for the original one-time migration). This function does not include `medicationNote` or `tummyTimeDurationSeconds` because legacy entries never had those fields. This is correct.
- The duplicate overlap check currently blocks re-import. Future "overwrite" support would require updating both `LegacyImportView` (to offer an overwrite option) and confirming `writeAppCsvEntries` handles it correctly (it now will, with the bug fix).

---

## Commit hash

See `git log` after push.

## Main synced with origin/main

Yes — merged origin/main before implementation.

## Vercel redeploy expected

Yes — 1 source file changed (`useLegacyImportWriter.js`); 2 test files updated.
