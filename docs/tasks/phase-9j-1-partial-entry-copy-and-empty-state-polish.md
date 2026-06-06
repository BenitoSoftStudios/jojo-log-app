# Phase 9J-1 - Partial-entry copy and empty-state polish

**Status:** Ready for implementation  
**Created:** 2026-06-05  
**Created by:** ChatGPT with user approval  
**Expected report:** `docs/reports/phase-9j-1-partial-entry-copy-and-empty-state-polish.md`

## Goal

Fix incorrect instructional copy introduced in Phase 9J and lightly polish the empty ledger state hierarchy.

Phase 9J added useful tips and Help FAQ content, but some partial-entry instructions are wrong. The app requires explicit values to make entries complete:

- `0 mL` means there was no feed.
- `-` means there was no diaper event.
- Blank amount or blank diaper means not recorded yet and makes the entry incomplete.

The tips and Help FAQ must teach that correctly.

This is a copy accuracy and hierarchy hotfix. Do not change entry write behavior.

## Current issues

### Tip issues

Current tips include incorrect or duplicate guidance:

1. Tip 1 says bottle-only can be logged by entering amount and leaving diaper blank. This is wrong for a complete entry. The user must tap `-` for no diaper event.
2. Tip 2 says diaper-only can be logged by leaving amount blank. This is wrong for a complete entry. The user must enter `0 mL`.
3. Tip 3 repeats the bottle-only/no-diaper idea and sounds awkward.
4. Medication-only, Tummy Time-only, note-only, and vitamin D-only guidance should teach `0 mL` plus `-` when no feed or diaper event happened.

### Help FAQ issues

The Help FAQ has the same accuracy problem:

- Bottle-only says leaving diaper blank is acceptable, but blank diaper means incomplete.
- Diaper-only says leaving mL blank is acceptable, but blank amount means incomplete.
- Medication-only, Tummy Time-only, and note-only do not explain the `0 mL` and `-` pattern.

### Empty state hierarchy issue

On a brand-new baby with no entries, the tip card appears above the empty state. This makes the first thing a user sees "Tip 1 of 10" before "No entries yet." The empty state should lead.

## Required context

Read:

- `docs/agent-workflow.md`
- `docs/tasks/README.md`
- `docs/tasks/template.md`
- `docs/reports/phase-9j-empty-states-help-faq-early-use-tips.md`
- `src/ui/EarlyUseTips.vue`
- `src/help/HelpView.vue`
- `src/entries/CareLedgerView.vue`
- `src/entries/CareEntryRow.vue`
- `src/entries/EntryDetailSheet.vue`

## Part 1 - Correct the mental model everywhere

Visible Help and tip copy must teach this clearly:

1. `0 mL` means no feed.
2. `-` means no diaper event.
3. Blank amount means not recorded yet.
4. Blank diaper means not recorded yet.
5. Blank amount or blank diaper means the entry is incomplete.
6. Care-only entries can still be complete when they use `0 mL` and `-`.

Add this explanation in Help near the icon legend or the "How do I log..." FAQ.

Suggested copy:

```text
Use 0 mL when there was no feed. Use - when there was no diaper event. Blank means not recorded yet, so the entry stays incomplete.
```

No em dashes.

## Part 2 - Replace the ten tips

Replace the current tip set with accurate, non-duplicative tips.

Use this tip set unless source inspection shows the exact UI wording needs adjustment:

1. `Bottle only: enter the amount, then tap - for no diaper event.`
2. `Diaper only: enter 0 mL, then choose W, P, or WP.`
3. `Medication only: enter 0 mL, tap - for no diaper event, then tap Rx.`
4. `Tummy Time only: enter 0 mL, tap - for no diaper event, then tap the star.`
5. `Note only: enter 0 mL, tap - for no diaper event, then add your note in Entry Details.`
6. `Vitamin D only: enter 0 mL, tap - for no diaper event, then tap the sun icon.`
7. `Blank means unfinished: blank amount or blank diaper means the entry is incomplete.`
8. `Tap a note indicator to open Entry Details.`
9. `Trends describe what was logged. They are not feeding or medical guidance.`
10. `Owners can export CSV to back up the active baby's log.`

Rules:

- Keep tip 10 owner-only.
- Caregivers should see tips 1-9.
- Owners should see tips 1-10.
- Do not include duplicate bottle-only/no-diaper tips.
- Do not say "leave amount blank" for complete care-only entries.
- Do not say "leave diaper blank" for complete bottle-only entries.
- No em dash characters.

## Part 3 - Correct Help FAQ answers

Update the "How do I log..." FAQ to match actual completion rules.

Required answers:

### How do I log a bottle only?

Correct concept:

```text
Enter the amount, then tap - for no diaper event.
```

Do not suggest leaving diaper blank unless explaining that it stays incomplete.

### How do I log a diaper only?

Correct concept:

```text
Enter 0 mL, then choose W, P, or WP.
```

Do not suggest leaving mL blank for a complete entry.

### How do I log a bottle with no diaper?

This overlaps with bottle-only. Either remove the duplicate question or rewrite it as a short clarification:

```text
Use the - diaper option when there was no diaper event.
```

If keeping both questions, make sure they are not redundant and awkward.

### How do I log medication only?

Correct concept:

```text
Enter 0 mL, tap - for no diaper event, tap Rx, add details if useful, then save.
```

### How do I log Tummy Time only?

Correct concept:

```text
Enter 0 mL, tap - for no diaper event, tap the star, add duration if useful, then save.
```

### How do I log a note only?

Correct concept:

```text
Enter 0 mL, tap - for no diaper event, open Entry Details, add the note, then save.
```

### How do I add vitamin D only?

Add or update a question if useful:

```text
Enter 0 mL, tap - for no diaper event, then tap the sun icon.
```

Keep the existing general vitamin D question if it still helps.

## Part 4 - Review other Help copy for related inaccuracies

Review `HelpView.vue` for copy that conflicts with the completion rules.

Likely places to adjust:

- Reading the ledger
- Icon legend
- Adding and editing entries
- FAQ

Make sure Help does not imply blank amount or blank diaper is the normal way to create a complete partial entry.

Keep accurate statements such as:

- blank amount means not recorded
- blank diaper means not recorded
- amber dot means incomplete
- `-` means no diaper event

## Part 5 - Empty state hierarchy polish

For active babies with no visible entries:

Preferred behavior:

1. Show the empty ledger state first.
2. Either hide tips until after the first entry, or place the tip card below the empty state.

Use this product rule:

- Empty state teaches the first action.
- Tips support ongoing use.

Preferred implementation:

- Hide the tip card while the active baby has zero visible entries.
- Show tips once there is at least one visible entry.

If that is awkward in the current component structure, place tips below the empty state instead.

## Part 6 - Empty state visual polish

Lightly improve the empty state if simple:

1. Make partial-entry examples more scannable.
2. Consider chips or a compact two-column list.
3. Make the `Help and Legend` link more visible, either a clear text link or secondary button.
4. Keep the `+ Add first entry` button as the main action.
5. Do not overdesign.

## Out of scope

Do not implement:

- modal onboarding
- new tutorial system
- database-backed tips
- new settings toggle
- entry behavior changes
- new tracking fields
- import/export changes
- Firestore rules changes
- visual redesign outside the empty state/tip/help area

## Allowed files

Likely files:

- `src/ui/EarlyUseTips.vue`
- `src/help/HelpView.vue`
- `src/entries/CareLedgerView.vue`
- `docs/reports/phase-9j-1-partial-entry-copy-and-empty-state-polish.md`

Do not touch data-writing logic unless needed only to inspect behavior.

## Safety restrictions

- Do not touch feeds calculations.
- Do not change entry write behavior.
- Do not change import/export logic.
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

1. Tip 1 says bottle-only requires `-` for no diaper event.
2. Tip 2 says diaper-only requires `0 mL`.
3. No tip says leave amount blank for complete care-only entries.
4. No tip says leave diaper blank for complete bottle-only entries.
5. Tips are not duplicative.
6. Tip 10 remains owner-only.
7. Help explains `0 mL`, `-`, and blank/incomplete behavior.
8. Help FAQ gives correct steps for bottle-only.
9. Help FAQ gives correct steps for diaper-only.
10. Help FAQ gives correct steps for medication-only.
11. Help FAQ gives correct steps for Tummy Time-only.
12. Help FAQ gives correct steps for note-only.
13. Help FAQ gives correct steps for vitamin D-only or general vitamin D logging.
14. Empty ledger state appears before tips, or tips are hidden until there is at least one entry.
15. Empty state examples are more scannable.
16. Help and Legend link in empty state is clearly visible.
17. No em dash characters appear in visible Help copy.
18. No em dash characters appear in visible tip copy.
19. No entry write behavior changed.
20. No import/export logic changed.
21. No Firestore rules/indexes changed.
22. No migration or bulk data mutation.
23. No deleteDoc.
24. No new dependencies.

## Claude reporting requirements

After implementation, create:

`docs/reports/phase-9j-1-partial-entry-copy-and-empty-state-polish.md`

The report must include:

- Summary
- Changed files
- Corrected tip list
- Help FAQ correction summary
- Empty state hierarchy summary
- No em dash confirmation
- Tests result
- Build result
- Safety confirmations
- Manual QA checklist
- Known issues or follow-ups
- Commit hash
- Main synced with origin/main: yes/no
- Vercel redeploy expected: yes/no
