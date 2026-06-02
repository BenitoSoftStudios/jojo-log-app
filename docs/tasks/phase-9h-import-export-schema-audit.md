# Phase 9H - Import, export, and data schema audit

**Status:** Ready for implementation  
**Created:** 2026-06-02  
**Created by:** ChatGPT with user approval  
**Expected report:** `docs/reports/phase-9h-import-export-schema-audit.md`

## Goal

Audit and harden import/export behavior after recent schema additions.

This phase should confirm that CSV export/import remains safe, backward-compatible, baby-scoped, duplicate-aware, and reliable after adding:

- `tummyTimeDurationSeconds`
- `medicationNote`
- `animalAvatar`
- optional birthdate behavior
- Since birth behavior tied to birthdate

This is a safety and compatibility phase. Do not add new features.

## Current state

- Real Jojo legacy history is migrated and live.
- App CSV import/export exists.
- Legacy import has been renamed and narrowed to app CSV behavior after migration.
- Duplicate prevention and wrong-baby blocking were added earlier.
- Tummy Time changed from multiplier behavior to one session with optional duration.
- Rx Medication gained optional `medicationNote`.
- Baby Settings gained `animalAvatar` and optional birthdate.
- Since birth Trends now requires baby birthdate and does not infer from earliest entry.
- CSV export was extended from earlier schemas to include new columns.
- We need to verify that old exports, new exports, and re-import flows still behave correctly.

## Required context

Read:

- `docs/agent-workflow.md`
- `docs/tasks/README.md`
- `docs/tasks/template.md`
- `docs/reports/phase-9e-trends-axis-and-medication-details.md`
- `docs/reports/phase-9f-baby-settings-animal-selector.md`
- `docs/reports/phase-9g-navigation-shell-and-quick-action-bottom-sheets.md`
- `docs/reports/phase-9g-1-fix-secondary-page-headers-and-bottom-spacing.md`
- `src/utils/csvExporter.js`
- `src/utils/appCsvImporter.js`
- `src/utils/legacyCsvParser.js` if still present
- `src/admin/LegacyImportView.vue` or current Import CSV view
- `src/entries/entryService.js`
- `src/utils/entryUtils.js`
- existing import/export tests
- existing Firestore rules documentation if relevant

## Part 1 - Document current CSV schema

Create or update a concise schema reference if one does not already exist.

Preferred output:

- `docs/reports/phase-9h-import-export-schema-audit.md` should include a CSV schema table.
- If there is an existing durable schema doc, update it only if appropriate and low risk.

The schema table should list:

1. Column name
2. Whether it is required or optional
3. Type
4. Blank/null behavior
5. Notes on backward compatibility

Include all current export columns, including recent additions.

Expected recent columns include:

- `tummyTimeDurationSeconds`
- `medicationNote`

Do not include `animalAvatar` in entry CSV export unless it already exists there for a clear reason. `animalAvatar` is baby metadata, not entry history.

## Part 2 - Export audit

Audit current app CSV export behavior.

Required behavior:

1. Export active baby only.
2. Export should not include entries from inactive or other babies.
3. Export should include legacy and app entries unless filtered by existing UI behavior.
4. Export should exclude soft-deleted entries unless existing documented behavior says otherwise.
5. Export should preserve entry identity fields needed for re-import duplicate prevention.
6. Export should include `tummyTimeDurationSeconds` if present.
7. Export should include `medicationNote` if present.
8. Blank/null `tummyTimeDurationSeconds` should export as blank.
9. Blank/null `medicationNote` should export as blank.
10. CSV escaping should handle commas, quotes, and newlines in notes and medication notes.
11. Export column order should append newer optional columns at the end where possible.
12. Export should not leak user email addresses unless already intentional and documented.
13. Export should not include baby real name fields beyond the app's nickname/display value.

Add tests where practical.

## Part 3 - Import audit

Audit current app CSV import behavior.

Required behavior:

1. Import accepts current exported CSV.
2. Import remains backward-compatible with older app exports that lack newer optional columns.
3. Import accepts missing `tummyTimeDurationSeconds` as `null`.
4. Import accepts blank `tummyTimeDurationSeconds` as `null`.
5. Import parses numeric `tummyTimeDurationSeconds` correctly.
6. Import rejects invalid non-numeric `tummyTimeDurationSeconds` with a clear error or warning, based on existing validation style.
7. Import accepts missing `medicationNote` as `null`.
8. Import accepts blank `medicationNote` as `null`.
9. Import preserves medication notes containing commas, quotes, and newlines.
10. Import does not require birthdate.
11. Import does not infer or backfill baby birthdate.
12. Import does not write or update `animalAvatar`.
13. Import remains active-baby scoped.
14. Import blocks wrong-baby CSVs according to the current safety behavior.
15. Import handles duplicate entries according to current duplicate prevention rules.
16. Import preview clearly reports duplicates before write.
17. Import write should not create duplicate entries when re-importing the app's own export.

Add tests where practical.

## Part 4 - Duplicate prevention audit

Confirm duplicate handling is still sound after schema changes.

Required behavior:

1. Re-importing an exported CSV should not create duplicates.
2. Duplicate detection should not be broken by optional fields such as `medicationNote` or `tummyTimeDurationSeconds`.
3. If duplicate detection uses IDs, confirm exported IDs are stable and re-imported IDs map correctly.
4. If duplicate detection uses date/time/amount/etc., confirm notes and optional fields do not create false negatives.
5. Duplicate preview should be understandable to a non-technical owner.
6. Warnings should not block safe import unless current behavior already blocks them.
7. Errors should block import.

Do not change duplicate logic unless a real bug is found. If a bug is found, fix it narrowly and document it.

## Part 5 - Wrong-baby and active-baby safety audit

Confirm the baby safety guard still works.

Required behavior:

1. CSV import should target only the active baby.
2. If CSV contains a baby name that does not match the active baby, import should be blocked.
3. If CSV baby name is blank, behavior should match the current safety policy and be documented.
4. The preview should show the detected CSV baby name if available.
5. Import should not silently move data into the wrong baby profile.
6. Import should not update baby nickname, birthdate, avatar, or other baby metadata.
7. Import should not create a new baby.

## Part 6 - Soft delete and source audit

Confirm entry source and soft delete behavior still makes sense.

Required behavior:

1. Export should either exclude deleted entries or document if deleted entries are included.
2. Import should not restore deleted entries unless the user explicitly imports them as new records through the normal import behavior.
3. Import should preserve or set `source` according to current app CSV policy.
4. App-created entries should not be mislabelled as legacy.
5. Legacy imported entries should remain compatible with app export/import.
6. No hard delete behavior should be introduced.

## Part 7 - UI copy audit for Import CSV

Review the Import CSV page copy.

Required behavior:

1. The page should be named `Import CSV`, not Legacy Import.
2. Copy should explain that import targets the current active baby.
3. Copy should mention preview before import.
4. Copy should mention duplicate prevention.
5. Copy should mention wrong-baby blocking if CSV baby does not match active baby.
6. Copy should stay short and parent-friendly.
7. Hide old migration/purge language if any remains.
8. Do not expose admin-only implementation details to normal users.

Do not add a new import flow. Polish only if existing copy is wrong or stale.

## Part 8 - Tests and fixtures

Add or update tests for pure utilities where practical.

Target tests:

1. Current CSV export includes `tummyTimeDurationSeconds` and `medicationNote`.
2. Current CSV import accepts older CSV without those columns.
3. Current CSV import accepts current CSV with those columns.
4. Medication note with comma, quote, and newline round-trips.
5. General notes with comma, quote, and newline still round-trip.
6. `tummyTimeDurationSeconds` blank imports as null.
7. `tummyTimeDurationSeconds` numeric imports as number.
8. Duplicate detection still flags re-imported rows.
9. Wrong-baby CSV blocks import.
10. Active-baby scoping is preserved where testable.

Do not use the real old SEED array or real Jojo data in tests. Use sanitized synthetic fixtures only.

## Part 9 - Optional manual test script

Add a short manual QA checklist to the report.

Include:

1. Export current active baby CSV.
2. Preview re-import into same baby.
3. Confirm duplicate warning/prevention.
4. Confirm no write unless confirmed.
5. Try old app CSV fixture if available.
6. Try CSV with wrong baby name if easy.
7. Confirm medication note and Tummy Time duration survive export/import.

## Out of scope

Do not implement:

- new CSV format redesign
- JSON export
- PDF export
- chart export
- baby metadata import
- animal avatar import/export
- birthdate import/export
- import from Google Sheets
- import from Apple Health or other apps
- bulk data migration
- hard delete
- Firestore rules changes
- Firestore indexes
- new family onboarding
- PWA
- Capacitor
- public launch work
- broad visual redesign

## Allowed files

Likely files:

- `src/utils/csvExporter.js`
- `src/utils/appCsvImporter.js`
- `src/utils/legacyCsvParser.js` if still relevant
- `src/admin/LegacyImportView.vue` or current Import CSV page
- `src/test/csvExporter.test.js`
- `src/test/appCsvImporter.test.js`
- `src/test/legacyCsvParser.test.js` if still relevant
- sanitized fixtures under existing test folders if needed
- `docs/reports/phase-9h-import-export-schema-audit.md`

Only touch app UI files if stale Import CSV copy needs correction.

## Safety restrictions

- Do not touch feeds calculations unless required to fix import/export tests and documented.
- Do not run migration.
- Do not bulk modify Firestore data.
- Do not modify imported legacy entries.
- Do not change Firestore rules.
- Do not change Firestore indexes.
- Do not add new Firestore listeners.
- Do not add PWA/Capacitor/service worker/manifest work.
- Do not add image upload.
- Do not add Firebase Storage.
- Do not add external image assets.
- Do not add image generation.
- Do not use `deleteDoc`.
- Do not add medical recommendation language.
- Do not add dependencies unless unavoidable and documented.
- Do not use real Jojo data or the original SEED array in tests.

## Validation checklist

Run:

- `npm test`
- `npm run build`
- `git status`
- `git diff --stat`
- `grep deleteDoc src/`

Confirm:

1. Current export schema is documented in the report.
2. Export includes `tummyTimeDurationSeconds`.
3. Export includes `medicationNote`.
4. Import accepts older CSVs without newer optional columns.
5. Import accepts current CSVs with newer optional columns.
6. Medication note round-trips with comma, quote, and newline.
7. Notes round-trip with comma, quote, and newline.
8. Tummy Time duration blank imports as null.
9. Tummy Time duration numeric imports correctly.
10. Re-importing own export does not create duplicates.
11. Duplicate preview remains understandable.
12. Wrong-baby CSV is blocked.
13. Active-baby scoping is preserved.
14. Import does not update nickname, birthdate, or animal avatar.
15. Import does not infer or backfill birthdate.
16. Import does not create babies.
17. Import/export does not add hard delete behavior.
18. Import CSV copy has no stale Legacy Import or purge language unless intentionally admin-only.
19. No real Jojo data or original SEED array added to tests.
20. No feeds path changed unless explicitly documented.
21. No Firestore rules/indexes changed.
22. No migration or bulk data mutation.
23. No deleteDoc.
24. No PWA/Capacitor/SW/manifest.

## Claude reporting requirements

After implementation, create:

`docs/reports/phase-9h-import-export-schema-audit.md`

The report must include:

- Summary
- Changed files
- CSV schema table
- Export behavior summary
- Import behavior summary
- Duplicate prevention summary
- Wrong-baby and active-baby safety summary
- Soft delete/source behavior summary
- UI copy summary if changed
- Tests result
- Build result
- Safety confirmations
- Manual QA checklist
- Known issues or follow-ups
- Commit hash
- Main synced with origin/main: yes/no
- Vercel redeploy expected: yes/no
