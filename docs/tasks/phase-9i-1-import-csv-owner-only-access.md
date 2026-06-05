# Phase 9I-1 - Import CSV owner-only access

**Status:** Ready for implementation  
**Created:** 2026-06-05  
**Created by:** ChatGPT with user approval  
**Expected report:** `docs/reports/phase-9i-1-import-csv-owner-only-access.md`

## Goal

Make Import CSV a true owner-only feature instead of an owner-plus-hidden-flag feature.

Right now Import CSV is gated by `isLegacyImportAdmin`, which means the user must be both:

1. `role === 'owner'`
2. `legacyImportAdmin === true` on the member document

That made sense during the one-time legacy migration, but the migration is complete. Import CSV is now a normal app backup/restore tool for Jojo app export CSVs. It should be available to owners and unavailable to caregivers.

This task must align the actual app gate, menu visibility, Help copy, and any Firestore rule implications.

## Current state

- The Import CSV page is named `Import CSV`.
- The visible UI still gates through `isLegacyImportAdmin`.
- Non-flagged users see `Access denied. Admin only.` and are redirected.
- Help copy was changed toward owner-only language, but the real app gate may still be `isLegacyImportAdmin`.
- `useFamily.js` currently exposes both `isOwner` and `isLegacyImportAdmin`.
- `LegacyImportView.vue` imports and uses `isLegacyImportAdmin`.
- Firestore rules may still allow certain import writes only for `isLegacyImportAdmin`, especially entries where `source` is not plain `app`.
- Phase 9H confirmed the CSV import preserves `source`, which means old migrated rows may still carry `legacy-csv-import` or similar source values.

## Required context

Read:

- `docs/agent-workflow.md`
- `docs/tasks/README.md`
- `docs/tasks/template.md`
- `docs/reports/phase-9h-import-export-schema-audit.md`
- `docs/reports/phase-9i-redo-help-and-legend.md`
- `src/families/useFamily.js`
- `src/admin/LegacyImportView.vue`
- `src/entries/CareLedgerView.vue` or menu file where Import CSV is linked
- `src/help/HelpView.vue`
- `src/families/ManageCaregiversView.vue`
- any Firestore rules file or rules documentation in `docs/`
- existing tests around family roles/import gates, if any

## Part 1 - Change the app gate from import-admin to owner

Update the Import CSV page so access is based on `isOwner`, not `isLegacyImportAdmin`.

Required behavior:

1. Owners can access Import CSV.
2. Caregivers cannot access Import CSV.
3. Non-owners should be redirected or shown an access-denied state consistent with current UX.
4. Visible denial copy should say owner-only, not admin-only.
5. The page should not mention `legacyImportAdmin`.
6. The page should not mention admin unless there is a real public-facing admin role, which there is not.
7. Preserve the existing active-baby, preview, wrong-baby, duplicate, and confirmation behavior.
8. Do not weaken import safety checks.
9. Do not change CSV parser/exporter behavior.
10. Do not change the data model.

Preferred copy:

`Access denied. Owner only.`

or, if it fits current tone better:

`Only owners can import CSV backups.`

## Part 2 - Menu visibility

Review the hamburger/menu entry for Import CSV.

Required behavior:

1. Owners should see Import CSV.
2. Caregivers should not see Import CSV, unless the current app intentionally shows restricted links and gates on the page. Prefer hiding it from caregivers if simple and consistent.
3. Do not hide Export CSV unless already intended. Export behavior can stay as-is unless a clear permission mismatch is found.
4. Do not change unrelated menu items.

## Part 3 - Help copy alignment

Update Help & Legend copy so it matches the real behavior.

Required behavior:

1. Import CSV should be described as owner-only.
2. Do not say admin-only.
3. Do not mention `legacyImportAdmin`.
4. Keep the copy parent-facing and non-technical.
5. Preserve the core concepts:
   - Export CSV creates a backup of the active baby's log.
   - Import CSV previews before writing.
   - Import targets the active baby.
   - Wrong-baby CSVs are blocked.
   - Duplicate entries are blocked.
   - Deleted entries are included in full backup export if that remains current behavior.

## Part 4 - Remove or quarantine stale legacy admin concept in app UI

Search for visible references to:

- `admin-only`
- `Admin only`
- `legacyImportAdmin`
- `legacy import admin`
- `Legacy Import`

Required behavior:

1. No parent-facing UI copy should expose `legacyImportAdmin`.
2. No parent-facing UI copy should say `admin-only` for Import CSV.
3. Developer comments may remain only if still technically accurate and not visible to users.
4. If `isLegacyImportAdmin` becomes unused in the app after this change, remove it from `useFamily.js` unless there is a clear reason to keep it.
5. Do not remove database fields from real data.
6. Do not mutate member documents.

## Part 5 - Firestore rules impact check

This task must explicitly check whether the deployed/current documented Firestore rules will allow owner-only Import CSV writes.

Reason:

- Import CSV preserves the CSV `source` field.
- Some exported rows may have source values like `legacy-csv-import`.
- Prior rules may have allowed those writes only for `isLegacyImportAdmin`.
- If the app gate becomes owner-only but rules still require `legacyImportAdmin`, owners without the flag may reach the page but fail at write time.

Required behavior:

1. Inspect any Firestore rules file or rules documentation in the repo.
2. Determine whether changing the app gate to owner-only also requires a Firestore rules patch.
3. If no rules patch is needed, explain why in the report.
4. If a rules patch is needed, include the exact rule change in the report.
5. Do not deploy Firestore rules.
6. Do not weaken rules broadly.
7. Do not allow caregivers to import.
8. Keep import write access owner-only.

Preferred rule direction if a patch is needed:

- Replace import-write dependency on `isLegacyImportAdmin(familyId)` with `isOwner(familyId)` for owner CSV import writes.
- Keep ordinary member app entry creation behavior unchanged.
- Preserve protected-field behavior for normal entry updates.
- Do not introduce hard delete.

If the safest solution is to keep a separate rule helper, rename the concept to owner import permission rather than legacy admin. Document the reasoning.

## Part 6 - Tests

Add or update tests where practical.

Suggested tests:

1. Import page uses owner gate, not legacy import admin gate.
2. Owner can access Import CSV without `legacyImportAdmin`.
3. Caregiver cannot access Import CSV.
4. Help copy says owner-only and not admin-only.
5. No visible copy references `legacyImportAdmin`.

If existing tests do not cover routing/gates and adding them would be excessive, document manual QA instead.

## Part 7 - Manual QA checklist

Add a short manual QA checklist to the report:

1. Log in as owner without relying on the hidden flag if possible.
2. Confirm Import CSV is visible/reachable.
3. Log in as caregiver.
4. Confirm Import CSV is hidden or blocked.
5. Confirm denial copy says owner-only.
6. Confirm Help says owner-only.
7. Confirm export still works.
8. Confirm import preview still blocks duplicates/wrong baby.
9. If rules patch is required, confirm the app should not be considered fully owner-import-ready until rules are manually updated.

## Out of scope

Do not implement:

- import overwrite support
- new CSV schema
- JSON export
- PDF export
- baby metadata import
- birthdate import/export
- animal avatar import/export
- hard delete
- bulk migration
- new family onboarding
- new permissions model beyond owner-only import
- Firestore rules deployment
- Firestore indexes
- PWA
- Capacitor
- broad visual redesign

## Allowed files

Likely files:

- `src/admin/LegacyImportView.vue`
- `src/families/useFamily.js`
- `src/entries/CareLedgerView.vue` or menu component where Import CSV appears
- `src/help/HelpView.vue`
- relevant tests if they exist
- Firestore rules documentation only if the repo maintains it
- `docs/reports/phase-9i-1-import-csv-owner-only-access.md`

Do not touch parser/exporter logic unless a direct permission-related bug is found and documented.

## Safety restrictions

- Do not touch feeds calculations.
- Do not change CSV parser/exporter behavior.
- Do not run migration.
- Do not bulk modify Firestore data.
- Do not modify imported legacy entries.
- Do not deploy Firestore rules.
- Do not change Firestore indexes.
- Do not add new Firestore listeners.
- Do not add PWA/Capacitor/service worker/manifest work.
- Do not add image upload.
- Do not add Firebase Storage.
- Do not add external image assets.
- Do not add image generation.
- Do not use `deleteDoc`.
- Do not add dependencies.

## Validation checklist

Run:

- `npm test`
- `npm run build`
- `git status`
- `git diff --stat`
- `grep deleteDoc src/`

Confirm:

1. Import CSV page gate uses owner access, not `legacyImportAdmin`.
2. Owner can access Import CSV.
3. Caregiver cannot access Import CSV.
4. Visible denial copy says owner-only, not admin-only.
5. Help copy says owner-only.
6. No visible UI copy exposes `legacyImportAdmin`.
7. Import preview behavior is unchanged.
8. Wrong-baby blocking is unchanged.
9. Duplicate blocking is unchanged.
10. Export CSV behavior is unchanged.
11. Firestore rules impact is explicitly assessed in the report.
12. If rules patch is needed, exact patch is included in the report.
13. No feeds path changed.
14. No CSV parser/exporter behavior changed unless explicitly justified.
15. No Firestore rules deployed.
16. No Firestore indexes changed.
17. No migration or bulk data mutation.
18. No deleteDoc.
19. No PWA/Capacitor/SW/manifest.
20. No new dependencies.

## Claude reporting requirements

After implementation, create:

`docs/reports/phase-9i-1-import-csv-owner-only-access.md`

The report must include:

- Summary
- Changed files
- Import access behavior summary
- Menu visibility summary
- Help copy summary
- Legacy admin cleanup summary
- Firestore rules impact assessment
- Exact Firestore rules patch if needed
- Tests result
- Build result
- Safety confirmations
- Manual QA checklist
- Known issues or follow-ups
- Commit hash
- Main synced with origin/main: yes/no
- Vercel redeploy expected: yes/no
