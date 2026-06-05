# Phase 9I — Redo Help and Legend

## Summary

Complete rewrite of `src/help/HelpView.vue`. The old page was organized around build history (indicators card, completion rules card, sync status card, usual bottle card, baby profile card, privacy note card) rather than around how a parent actually uses the app. The new page is organized into 14 clear parent-facing sections, each in its own AppCard. All copy is plain, calm, and non-technical. No implementation language, no medical advice, no phase references.

---

## Changed files

| File | Change |
|------|--------|
| `src/help/HelpView.vue` | Complete rewrite — 14 sections, parent-facing copy, accurate icon legend, all bottom sheet behavior documented |

---

## Help page structure summary

14 sections, each in an AppCard:

1. **What Jojo's Log is** — one-sentence purpose + calm disclaimer ("descriptive log, not feeding or medical guidance")
2. **Reading the ledger** — how entries are grouped, what rows show, usual bottle note
3. **Adding and editing entries** — Add Day, Add Entry, ⋯ details button, inline editing, Save Entry
4. **Icon legend** — visual legend using `dl`/`dt`/`dd` with actual icons and colors (mL, W/P/WP/–/blank, sun SVG, Rx, ★, ✎ notes, ⋯, amber incomplete dot, sync dots)
5. **Tummy Time** — bottom sheet flow, optional duration, Clear Tummy Time
6. **Rx Medication** — bottom sheet flow, optional note, example "Tylenol, 2.5 mL", Clear Medication, calm disclaimer
7. **Notes and Entry Details** — notes purpose, ✎ notes / ⋯ to open, Save Entry
8. **Trends** — 7 Days, 30 Days, Since birth with birthdate requirement, descriptive-only note
9. **Baby Settings and privacy** — nickname, optional birthdate, nearby date OK, animal avatars, caregiver read-only
10. **Family members and caregivers** — owner/caregiver roles, display names, Manage Caregivers
11. **Import and Export CSV** — export creates full backup (including deleted), import previews first, active-baby scoped, wrong-baby blocked, duplicates blocked, admin-only
12. **Recently Deleted** — soft delete, owner can restore, returns to original date
13. **Timezone** — controls "today" in ledger and Trends, entries unchanged on update
14. **What this app is not** — calm disclaimer: not medical advice, not a recommendation tool, does not replace professional care

---

## Copy and tone summary

- Plain language throughout.
- Short paragraphs and bullet lists — no walls of text.
- No phase references, no Firebase/Firestore/migration/schema/commit/test language in visible copy.
- No medical instructions or dosage advice.
- Calm disclaimer phrases: "This is a descriptive log, not feeding or medical guidance" and "This app does not give dosage or medication advice. Follow your doctor's guidance."
- "What this app is not" section ends the page with a calm list.
- No cute/annoying emojis; icons match the actual app controls.

---

## Accuracy checks performed

1. **Entry row icons** — verified from `CareEntryRow.vue`: sun SVG (vitamin D), `Rx` button, `★` tummy time, `✎ notes`, `⋯` details button. All described accurately.
2. **Tummy Time** — verified opens `AppSheet` (`v-model="ttSheetOpen"`, title "How long was Tummy Time?"), minutes/seconds inputs, optional duration, Clear Tummy Time button. ✓
3. **Rx Medication** — verified opens `AppSheet` (`v-model="medSheetOpen"`, title "Medication details"), text input with `placeholder="Name, dosage"`, optional note, Clear Medication button. ✓
4. **Medication placeholder** — confirmed `placeholder="Name, dosage"` in `CareEntryRow.vue` line 133. ✓
5. **Since birth requires birthdate** — confirmed in `GraphView.vue` (`sinceBirthMissingBirthdate` computed). ✓
6. **Birthdate is optional** — confirmed in `BabySettingsView.vue` (field optional, saves null). ✓
7. **Export is active-baby scoped** — confirmed in `CareLedgerView.vue` (passes `entries.value` from active-baby subscription). ✓
8. **Export includes soft-deleted entries** — confirmed from Phase 9H audit: `deleted: true` entries are included in the export CSV. ✓
9. **Import blocks wrong-baby CSVs** — confirmed in `LegacyImportView.vue` (compares `preview.babyNames` to `activeBaby.nickname`). ✓
10. **Import blocks duplicate entry IDs** — confirmed in `appCsvImporter.js` (`checkForExistingIds`) and `LegacyImportView.vue` (overlap blocks import). ✓
11. **Caregiver permissions** — confirmed caregivers cannot edit baby settings (`!isOwner` guard in `BabySettingsView.vue`). ✓
12. **Recently Deleted** — confirmed soft-delete pattern: `softDeleteEntry` sets `deleted: true`; `RecentlyDeletedView.vue` shows restored entries. ✓
13. **Import is admin-only** — confirmed `isLegacyImportAdmin` gate in `LegacyImportView.vue`. ✓

---

## Medical guidance safety confirmation

- No feeding amounts, volumes, or frequencies recommended.
- No medication dosages given.
- No medical conditions described.
- Rx section explicitly states: "This app does not give dosage or medication advice. Follow your doctor's guidance."
- "What this app is not" section states clearly it does not replace professional care.
- Trends section notes: "Trends describe what was recorded. They are not feeding guidance."

---

## Tests result

**374 tests passing** (`npm test`). No new tests — no pure-logic changes were made; all changes are template and copy.

---

## Build result

`npm run build` — clean (0 errors). Pre-existing chunk size advisory unchanged.

---

## Safety confirmations

- No feeds path changed ✓
- No import/export logic changed ✓
- No Firestore rules/indexes changed ✓
- No migration or bulk data mutation ✓
- No new Firestore listeners ✓
- `grep -r "deleteDoc" src/` — no matches ✓
- No PWA/Capacitor/SW/manifest ✓
- No image upload / Firebase Storage / external image URLs ✓
- No medical recommendation language in copy ✓
- No new dependencies ✓

---

## Known issues or follow-ups

- The Help page is currently only accessible via the secondary menu (hamburger). There is no in-app link from the main ledger. If discoverability becomes an issue, a future phase could add a "?" button or footer link.
- The `Import CSV` section notes it is "admin-only." If the admin gate is ever relaxed in a future phase, this copy should be updated.
- The icon legend uses the actual icons (`Rx`, `★`, `✎`) as text. On some devices or font configurations, `✎` (pencil) may render differently. Acceptable for now.

---

## Commit hash

See `git log` after push.

## Main synced with origin/main

Yes — merged origin/main before implementation.

## Vercel redeploy expected

Yes — 1 source file changed (`HelpView.vue`).
