# Phase 9I - Redo Help and Legend

**Status:** Ready for implementation  
**Created:** 2026-06-02  
**Created by:** ChatGPT with user approval  
**Expected report:** `docs/reports/phase-9i-redo-help-and-legend.md`

## Goal

Completely rewrite the Help and Legend page so it feels like a useful parent-facing guide, not a build-era reference page.

This page should help a tired parent or caregiver understand what the app is for, how to read the ledger, what the icons mean, how to use Trends, how caregiver access works, and how import/export works.

This is a content and UI organization task for Help and Legend. Do not add new product features.

## Current state

- The app is now stable enough that Help and Legend needs a complete redo.
- Current Help and Legend has accumulated feature notes across many phases.
- Some copy may be stale, technical, too thin, or organized around implementation history instead of parent use.
- The app now includes:
  - Multi-user family access
  - Owner and caregiver roles
  - Baby Settings
  - Animal avatar selector
  - Optional birthdate with privacy copy
  - Trends page
  - Tummy Time bottom sheet with optional duration
  - Rx Medication bottom sheet with optional name/dosage
  - Notes in Entry Details
  - Save Entry button
  - Import CSV and Export CSV
  - Recently Deleted soft restore
  - Timezone setting
  - CSV duplicate prevention and wrong-baby blocking
- The Help page needs to explain these in plain language without medical advice.

## Required context

Read:

- `docs/agent-workflow.md`
- `docs/tasks/README.md`
- `docs/tasks/template.md`
- `docs/reports/phase-9f-baby-settings-animal-selector.md`
- `docs/reports/phase-9g-navigation-shell-and-quick-action-bottom-sheets.md`
- `docs/reports/phase-9g-1-fix-secondary-page-headers-and-bottom-spacing.md`
- `docs/reports/phase-9h-import-export-schema-audit.md`
- `src/help/HelpView.vue`
- `src/entries/CareEntryRow.vue`
- `src/entries/EntryDetailSheet.vue`
- `src/charts/GraphView.vue`
- `src/babies/BabySettingsView.vue`
- `src/families/ManageCaregiversView.vue`
- `src/admin/LegacyImportView.vue` or current Import CSV view
- existing style/layout tokens

## Part 1 - Rewrite the page around real parent use

The Help and Legend page should be organized around how someone uses the app, not around internal implementation.

Required sections:

1. What this app is for
2. Reading the ledger
3. Adding and editing entries
4. Icon legend
5. Tummy Time
6. Rx Medication
7. Notes and Entry Details
8. Trends
9. Baby Settings and privacy
10. Family members and caregivers
11. Import and Export CSV
12. Recently Deleted
13. Timezone
14. What this app is not

Use collapsible sections or cards if the current design supports it. The page should be scannable on iPhone.

## Part 2 - Tone and copy rules

Copy must be:

- Plain language
- Short
- Calm
- Parent-friendly
- Non-technical
- Useful for tired people
- Not cute to the point of being annoying
- No phase language
- No implementation language
- No references to Claude, ChatGPT, Firebase, Firestore, CSV schema versions, migrations, commits, tests, or reports

Avoid:

- Long paragraphs
- Dense bullets
- Developer wording
- Medical instructions
- Feeding advice
- Dosage advice
- Legal/privacy jargon
- Fear-based privacy language

Prefer:

- Short sections
- One or two sentence explanations
- Simple examples
- Clear labels

## Part 3 - Required copy concepts

### What this app is for

Explain that Jojo's Log is a simple family log for baby care entries.

It tracks what was recorded, such as:

- feeds
- diapers
- vitamin D
- medication notes
- Tummy Time
- notes

Required disclaimer concept:

`This is a descriptive log, not feeding or medical guidance.`

Do not say what a baby should eat, drink, take, or do.

### Reading the ledger

Explain:

- Entries are grouped by day.
- Time shows when the entry happened.
- Amount shows the logged feed volume when there is one.
- Diaper shows what was recorded.
- Icons show extra care notes.
- Some entries may be diaper-only, medication-only, Tummy Time-only, or note-only.

### Adding and editing entries

Explain:

- Add Entry creates a new entry for the current day.
- Add Day creates the first entry for another day.
- Entry Details lets the user edit notes and review details.
- Save Entry is there for reassurance.
- Closing with X may also save supported edits if that is current behavior.

Keep this accurate based on current app behavior.

### Icon legend

The icon legend must explain current row icons and controls.

Include current meanings for:

- bottle/feed amount
- diaper codes
- vitamin D
- Rx Medication
- Tummy Time star
- Notes
- three-dot or more menu if present
- deleted/restored state if visible anywhere

Use the actual labels/icons from the app. Do not invent icons that are not present.

### Tummy Time

Explain:

- Tap the star to record a Tummy Time session.
- A sheet opens where the user can enter minutes and seconds.
- Duration is optional.
- Saving without duration still records that a session happened.
- Clear Tummy Time removes it from that entry.

Do not mention the old multiplier behavior.

### Rx Medication

Explain:

- Tap Rx to record medication.
- A sheet opens where the user can type name and dosage.
- The note is optional.
- Saving blank still records that medication happened.
- Clear Medication removes it from that entry.

Do not give medication advice or dosage guidance.

### Notes and Entry Details

Explain:

- Notes can be used for anything the family wants to remember.
- Tapping a note opens Entry Details.
- Entry Details shows more context about the entry.
- Save Entry is available so parents know their edits are saved.

### Trends

Explain:

- Trends summarizes what was logged.
- 7 Days and 30 Days work without birthdate.
- Since birth requires a birthdate in Baby Settings.
- A nearby date is fine for privacy.
- Trends are descriptive only.

Do not present Trends as health advice.

### Baby Settings and privacy

Explain:

- Baby Settings lets the owner edit nickname, birthdate, and animal avatar.
- Use a nickname instead of the baby's real name.
- Birthdate is optional.
- A nearby date can be used instead of the exact birthday.
- Animal avatars help identify babies without photos.
- The app does not use baby photo uploads.

Do not overpromise security.

### Family members and caregivers

Explain:

- Owner can manage family members.
- Caregivers can help log care.
- Some settings are owner-only.
- Display names or initials help show who made updates.

Keep it simple and do not include access-rule implementation details.

### Import and Export CSV

Explain:

- Export CSV creates a backup of the active baby's log.
- Import CSV previews before writing.
- Import targets the active baby.
- If the CSV baby name does not match the active baby, import is blocked.
- Duplicate entries are detected before import.
- Export includes deleted entries as part of the full backup, if that remains current behavior.

Use parent-facing language. Avoid schema detail.

### Recently Deleted

Explain:

- Deleted entries are not erased immediately.
- Recently Deleted lets the owner restore entries if needed.
- Do not describe Firestore soft delete implementation.

### Timezone

Explain:

- Timezone controls how dates and days are grouped.
- Families should set it to where they normally log care.
- Keep it short.

### What this app is not

Include a short section making clear:

- It is not medical advice.
- It is not a feeding recommendation tool.
- It does not replace a doctor, nurse, lactation consultant, or emergency care.
- For urgent concerns, contact a qualified professional or local emergency service.

Keep it calm. No fear-based wording.

## Part 4 - UI organization

The Help page should be easy to scan.

Required behavior:

1. Use the existing secondary header pattern.
2. Keep content mobile-first.
3. Use cards, sections, or accordions based on the existing app style.
4. Avoid one giant wall of text.
5. Important disclaimers should be visible but not aggressive.
6. The icon legend should be compact and visual if practical.
7. Do not add new route complexity unless needed.
8. Do not add new dependencies.
9. Do not create a separate onboarding system.

## Part 5 - Accuracy check

Do not write help copy that conflicts with the app.

Before finalizing, verify the Help copy against current behavior:

1. Entry row icons and labels are accurate.
2. Tummy Time opens bottom sheet, not inline form.
3. Rx opens bottom sheet, not inline form.
4. Medication placeholder is `Name, dosage`.
5. Since birth requires birthdate.
6. Birthdate is optional.
7. Export is active-baby scoped.
8. Export includes soft-deleted entries if that remains true.
9. Import blocks wrong-baby CSVs.
10. Import blocks duplicate entry IDs.
11. Caregiver permissions are described correctly.
12. Recently Deleted behavior is described correctly.

If any behavior is unclear, inspect the source and report uncertainty. Do not guess.

## Out of scope

Do not implement:

- new onboarding flow
- tutorial modals
- coach marks
- PWA install guidance
- legal Terms or Privacy Policy
- medical guidance
- medication database
- dosage recommendations
- feeding recommendations
- import/export schema changes
- CSV logic changes
- Firestore rules changes
- Firestore indexes
- migration
- new permissions model
- broad visual redesign
- new animal avatars
- image upload
- Firebase Storage
- new dependencies

## Allowed files

Likely files:

- `src/help/HelpView.vue`
- shared UI components only if needed for the help page layout
- relevant tests only if a pure helper is introduced
- `docs/reports/phase-9i-redo-help-and-legend.md`

Do not touch data logic unless required to verify existing labels or behavior.

## Safety restrictions

- Do not touch feeds calculations.
- Do not touch entry write behavior.
- Do not touch import/export logic.
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
- Do not add dependencies.

## Validation checklist

Run:

- `npm test`
- `npm run build`
- `git status`
- `git diff --stat`
- `grep deleteDoc src/`

Confirm:

1. Help and Legend is completely rewritten around parent use.
2. Page is scannable on iPhone.
3. Page uses the current secondary header pattern.
4. No stale phase language appears.
5. No implementation terms such as Firebase, Firestore, migration, schema, commit, tests, or reports appear in visible copy.
6. Icon legend matches current UI.
7. Tummy Time help matches bottom sheet behavior.
8. Rx Medication help matches bottom sheet behavior.
9. Trends copy says descriptive only.
10. Since birth copy says birthdate is required for that range.
11. Baby privacy copy recommends nickname and nearby date.
12. Family/caregiver copy is accurate.
13. Import/export copy is accurate and parent-facing.
14. Recently Deleted copy is accurate.
15. Timezone copy is accurate.
16. What this app is not section avoids medical guidance and keeps a calm disclaimer.
17. No feeds path changed.
18. No import/export logic changed.
19. No Firestore rules/indexes changed.
20. No migration or bulk data mutation.
21. No deleteDoc.
22. No PWA/Capacitor/SW/manifest.
23. No new dependencies.

## Claude reporting requirements

After implementation, create:

`docs/reports/phase-9i-redo-help-and-legend.md`

The report must include:

- Summary
- Changed files
- Help page structure summary
- Copy and tone summary
- Accuracy checks performed
- Medical guidance safety confirmation
- Tests result
- Build result
- Safety confirmations
- Known issues or follow-ups
- Commit hash
- Main synced with origin/main: yes/no
- Vercel redeploy expected: yes/no
