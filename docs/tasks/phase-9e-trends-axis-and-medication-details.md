# Phase 9E — Trends axis polish and medication details

**Status:** Ready for implementation  
**Created:** 2026-05-31  
**Created by:** ChatGPT with user approval  
**Expected report:** `docs/reports/phase-9e-trends-axis-and-medication-details.md`

## Goal

Polish the Trends chart readability by replacing floating max labels with proper chart axes and add an Rx Medication detail flow that mirrors the new Tummy Time duration flow.

This is a focused usability and data-model polish task. Do not add animal selector, broader styling, PWA, Capacitor, or unrelated features.

## Current state

- Phase 9D shipped Trends polish, Save Entry, and Tummy Time simplification.
- Tummy Time now works well as a single tracked session with optional duration.
- Trends page is better, but chart scale is still hard to read.
- Current chart max values float awkwardly in the card, especially on Daily volume, Monthly volume, Daily feeds, and Tummy Time.
- User wants proper y-axis scale and cleaner chart construction.
- Rx Medication currently behaves like a simple on/off flag with no detail note.
- User wants Rx to behave like Tummy Time: tap Rx, enter optional medication detail, save/cancel/clear, then display that detail in Entry Details.

## Required context

Read:

- `docs/agent-workflow.md`
- `docs/reports/phase-9d-trends-save-entry-tummy-time.md`
- `src/charts/GraphView.vue`
- `src/entries/CareEntryRow.vue`
- `src/entries/EntryDetailSheet.vue`
- `src/entries/entryService.js`
- `src/utils/csvExporter.js`
- `src/utils/appCsvImporter.js`
- `src/utils/entryUtils.js`
- `src/utils/graphData.js`

## Part 1 — Trends chart axis polish

### Problem

The charts currently use floating max labels such as `840 mL`, `8`, or `3`. These labels look visually awkward and do not create a clear sense of scale.

The user wants a proper, calm chart scale:

- y-axis line
- x-axis baseline
- 0 label at bottom
- max label at top
- optional midpoint label/gridline
- nice rounded max values instead of raw max values

### Required behavior

1. Replace floating max labels with a proper y-axis scale system on all Trends charts.
2. Add a visible left y-axis line and bottom x-axis baseline.
3. Add a `0` label near the bottom of the y-axis.
4. Add a rounded max label near the top of the y-axis.
5. Add an optional midpoint label/gridline if it improves readability.
6. Use light, subtle grid/axis colors consistent with the app.
7. Keep chart cards mobile-first and readable at iPhone width.
8. Avoid dense axis clutter.
9. Do not label every bar.
10. Keep selected-day/month detail banner at top of chart.
11. Keep tap-to-inspect behavior.

### Nice max scale examples

Use rounded, human-friendly max values rather than raw data maxes.

Examples:

- highest daily mL = 840 → y-axis max = 1000 mL
- highest monthly volume = 21858 → y-axis max = 25000 mL
- highest feed count = 8 → y-axis max = 10 feeds
- highest tummy sessions = 3 → y-axis max = 4 or 5 sessions

Implement a pure helper if useful, such as:

- `niceAxisMax(value, unitType)`
- `formatAxisLabel(value, unitType)`

Keep it simple and tested.

### Chart-specific requirements

Daily volume:

- y-axis max should be in mL.
- Use a rounded max such as 500, 750, 1000, 1250, etc. if helpful.
- Keep 7-day average line if it still looks clean.
- Keep selected day banner.

Monthly volume / Since birth:

- y-axis max should be rounded to a readable mL number.
- Example: 21858 mL should display with a top scale around 25000 mL.
- Since birth should remain grouped by month when daily bars would be unreadable.

Feeds:

- y-axis max should be a rounded count.
- Label can say `feeds` where needed, but avoid visual clutter.
- x-axis labels should remain visible and consistent.

Tummy Time:

- y-axis max should be a rounded session count.
- Continue counting historical tummyTimeCount > 0 as one session per entry.
- Do not reintroduce multipliers.

## Part 2 — Medication details flow

### Problem

Rx Medication currently tracks only whether medication happened. That is not enough for real use. Parents need to note what medication or dose was given without opening the general Notes field.

### New behavior

Medication should mirror the new Tummy Time pattern but use open text instead of duration fields.

Required interaction:

1. Tapping Rx opens an inline form, sheet, or small dialog.
2. Form title/copy should be clear, such as `Medication details`.
3. Input is open text.
4. Placeholder should be practical, for example: `Name, dosage, or note`.
5. Buttons:
   - Save
   - Cancel
   - Clear Medication if medication is already tracked
6. Saving with text marks medication as tracked and stores the note.
7. Saving with blank text should still allow medication to be tracked as recorded.
8. Clearing removes medication tracking and clears the note.
9. Existing medication rows with no note should still display as recorded.
10. Do not require structured name/dose fields in this phase.

### Data model

Use:

- `medication: boolean`
- `medicationNote: string | null`

Existing entries:

- If `medication === true` and no `medicationNote`, display as `Rx Medication: recorded`.
- No Firestore migration.
- No bulk mutation.

New saves:

- medication tracked with note: `medication: true`, `medicationNote: "..."`
- medication tracked without note: `medication: true`, `medicationNote: null`
- medication cleared: `medication: false`, `medicationNote: null`

### Row display

- inactive Rx: normal gray Rx
- active Rx: green active Rx
- if note exists, show a compact medication note cue if space allows
- avoid making the row cluttered

### Entry Details display

When medication is tracked:

- With note: `Rx Medication: Tylenol 1.25 mL` or whatever the user entered.
- Without note: `Rx Medication: recorded`.

The display should appear beside or directly after the existing green Rx Medication indicator, not hidden only in the general Notes box.

## Part 3 — CSV export/import compatibility

Update export/import only if needed for medicationNote.

Required behavior:

1. Add `medicationNote` to CSV export if it is not already present.
2. Append it at the end if adding a column, to avoid disturbing existing column order.
3. Import must remain backward-compatible with existing exports that do not have the new column.
4. Missing medicationNote should import as null.
5. Blank medicationNote should import as null.
6. Existing app CSV import should still accept the current exported files.
7. Do not break legacy/import safety checks.

## Part 4 — Help and Legend update

Update Help & Legend for Rx Medication:

- Explain that tapping Rx marks medication and lets the user add an optional name/dosage/note.
- Keep the language short.
- Do not include medical advice.
- Do not say what a baby should take.

## Out of scope

- No animal selector.
- No broad styling redesign.
- No PWA.
- No Capacitor.
- No Firestore rules changes.
- No Firestore indexes.
- No migration.
- No bulk cleanup of historical entries.
- No medical guidance.
- No structured medication database.
- No dosage recommendations.
- No reminders/alerts.

## Allowed files

Likely files:

- `src/charts/GraphView.vue`
- `src/utils/graphData.js`
- `src/test/graphData.test.js`
- `src/utils/entryUtils.js`
- `src/entries/CareEntryRow.vue`
- `src/entries/EntryDetailSheet.vue`
- `src/entries/entryService.js`
- `src/utils/csvExporter.js`
- `src/utils/appCsvImporter.js`
- `src/test/csvExporter.test.js`
- `src/test/appCsvImporter.test.js`
- `src/help/HelpView.vue`
- `docs/reports/phase-9e-trends-axis-and-medication-details.md`

## Safety restrictions

- Do not touch feeds.
- Do not run migration.
- Do not bulk modify historical entries.
- Do not modify imported legacy entries.
- Do not change Firestore rules.
- Do not change Firestore indexes.
- Do not add new Firestore listeners.
- Do not add PWA/Capacitor/service worker/manifest work.
- Do not add animal selector.
- Do not add medical recommendation language.
- Do not use `deleteDoc`.

## Validation checklist

Run:

- `npm test`
- `npm run build`
- `git status`
- `git diff --stat`
- `grep deleteDoc src/`

Confirm:

1. Trends charts no longer use awkward floating max numbers.
2. Daily volume has a visible y-axis scale and x-axis baseline.
3. Monthly volume has a visible y-axis scale and x-axis baseline.
4. Daily feeds has a visible y-axis scale and x-axis baseline.
5. Tummy Time has a visible y-axis scale and x-axis baseline.
6. Axis max values are rounded/nice values.
7. Since birth monthly volume can show a rounded max such as 25000 mL when appropriate.
8. Charts remain readable at iPhone width.
9. Rx opens a medication details input.
10. Rx can be saved with a note.
11. Rx can be saved as recorded with no note.
12. Rx can be cleared.
13. Entry Details shows medication note or `recorded`.
14. Existing medication entries without notes still display correctly.
15. CSV export/import remains backward-compatible.
16. Help & Legend explains Rx details without medical guidance.
17. No feeds path changed.
18. No Firestore rules/indexes changed.
19. No migration or bulk data mutation.
20. No new Firestore listeners.
21. No deleteDoc.
22. No PWA/Capacitor/SW/manifest.

## Claude reporting requirements

After implementation, create:

`docs/reports/phase-9e-trends-axis-and-medication-details.md`

The report must include:

- Summary
- Changed files
- Chart axis summary
- Medication data model summary
- CSV compatibility summary
- Tests result
- Build result
- Safety confirmations
- Known issues or follow-ups
- Commit hash
- Main synced with origin/main: yes/no
- Vercel redeploy expected: yes/no
