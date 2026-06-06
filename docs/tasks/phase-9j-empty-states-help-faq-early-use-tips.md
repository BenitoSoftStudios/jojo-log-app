# Phase 9J - Empty states, Help FAQ, and early-use tips

**Status:** Ready for implementation  
**Created:** 2026-06-05  
**Created by:** ChatGPT with user approval  
**Expected report:** `docs/reports/phase-9j-empty-states-help-faq-early-use-tips.md`

## Goal

Make the app easier for new parents and caregivers to understand without using a pop-up tutorial.

This phase should add a better empty ledger state, expand Help and Legend with practical "How do I log..." examples, and add a small early-use tip card with ten useful tips.

This is a usability phase. Do not add new care tracking features.

## Current state

- Owner smoke test passed.
- Caregiver smoke test passed.
- Import CSV is owner-only in the app and Firebase rules now match that behavior.
- Help and Legend was rewritten in Phase 9I, but it still needs more practical question-and-answer coverage.
- User specifically wants Help to explain partial entries:
  - Tummy Time only
  - Medication only
  - Note only
  - Diaper only
  - Bottle only with no diaper
- User does not want a generic welcome pop-up or modal onboarding.
- User wants around ten tips.
- User wants no em dash characters in visible copy.

## Required context

Read:

- `docs/agent-workflow.md`
- `docs/tasks/README.md`
- `docs/tasks/template.md`
- `docs/reports/phase-9i-redo-help-and-legend.md`
- `docs/reports/phase-9i-1-import-csv-owner-only-access.md`
- `src/help/HelpView.vue`
- `src/entries/CareLedgerView.vue`
- `src/entries/CareEntryRow.vue`
- `src/entries/EntryDetailSheet.vue`
- `src/ui/AppLayout.vue`
- existing app card, sheet, and button patterns
- existing localStorage usage if any

## Part 1 - Add a polished empty ledger state

When the active baby has no visible entries, the ledger should not feel broken or blank. It should teach the user what to do at the exact moment they need help.

Required behavior:

1. Show a friendly empty state when there are no visible ledger entries for the active baby.
2. Do not use a modal.
3. Do not interrupt returning users with entries.
4. Include a clear primary action to add the first entry.
5. Include a Help and Legend link.
6. Include short examples of valid partial entries.
7. Keep the empty state short enough for iPhone.
8. Use existing visual style and components.

Suggested copy direction:

```text
No entries yet

Start with whatever you need to record.

Common examples:
Bottle only
Diaper only
Medication only
Tummy Time only
Note only

[Add first entry]
[Help and Legend]
```

Claude should adjust button labels to match existing app language if needed.

## Part 2 - Add ten early-use tips on the ledger

Add a small, dismissible tip card on the ledger. This should teach practical use without feeling like a tutorial.

Required behavior:

1. Show one tip at a time.
2. Rotate through ten tips.
3. User can dismiss the current tip.
4. User can hide all tips.
5. After all ten tips are dismissed, tips stop showing.
6. Store tip state in localStorage for now.
7. Do not add backend storage.
8. Do not add Firestore rules.
9. Do not show random tips forever.
10. Do not show a modal or pop-up.
11. Keep the card visually small.
12. Include a Help and Legend link if it fits cleanly.
13. Tips should not block entry logging.
14. Tips should not appear in screenshots as urgent warnings.

Suggested tip actions:

- Got it
- Hide tips
- Help

Use existing button/link styles where possible.

## Part 3 - Tip content

Use ten practical tips. Verify the exact UI wording against current source before finalizing.

Required tip concepts:

1. Bottle-only entry:
   `You can log a bottle-only entry by adding an amount and leaving diaper blank.`

2. Diaper-only entry:
   `You can log a diaper-only entry by leaving amount blank and choosing a diaper result.`

3. Bottle with no diaper:
   `For a bottle with no diaper, enter the amount and leave diaper as none.`

4. Medication-only entry:
   `You can log medication-only by tapping Rx, then saving the entry.`

5. Tummy Time-only entry:
   `You can log Tummy Time-only by tapping the star, then saving the entry.`

6. Note-only entry:
   `You can add a note-only entry from Entry Details.`

7. Notes shortcut:
   `Tap a note in the ledger to open Entry Details.`

8. Save Entry reassurance:
   `Save Entry is there for peace of mind. Closing Entry Details also keeps supported edits.`

9. Trends disclaimer:
   `Trends describe what was logged. They are not feeding or medical guidance.`

10. CSV backup:
   `Export CSV creates a backup of the active baby's log.`

If any sentence conflicts with actual app behavior, adjust it. Do not lie to make the tip sound good.

No visible tip copy may contain an em dash character.

## Part 4 - Expand Help and Legend with practical FAQ

Add a practical FAQ or "How do I log..." section to Help and Legend.

Required questions:

1. How do I log a bottle only?
2. How do I log a diaper only?
3. How do I log a bottle with no diaper?
4. How do I log medication only?
5. How do I log Tummy Time only?
6. How do I log a note only?
7. How do I add vitamin D?
8. How do I edit a note after saving?
9. How do I clear medication or Tummy Time?
10. Why does Since birth need a birthdate?
11. Why did Import CSV block my file?

The FAQ should use plain language and short answers.

Suggested answer pattern:

- One sentence explanation.
- One short example if useful.
- No developer terms.
- No medical advice.

Important: verify exact controls before writing answers. For example, confirm whether the diaper empty state is displayed as blank, none, or `-` in the UI.

## Part 5 - Remove em dash characters from Help and visible new copy

The user has a hard preference: no em dash characters.

Required behavior:

1. No em dash characters in Help and Legend visible copy.
2. No em dash characters in new empty state copy.
3. No em dash characters in new tip copy.
4. Prefer commas, periods, colons, parentheses, or normal hyphens.
5. Do not do a risky global rewrite of the entire app just to remove punctuation.
6. If existing visible copy in files touched by this task has em dash characters, remove them.
7. Report whether any were found and removed.

## Part 6 - LocalStorage behavior

Use localStorage for early-use tips.

Suggested storage:

- dismissed tip ids
- hide all tips flag

Required behavior:

1. Store tip state per browser/device.
2. Do not require login profile changes.
3. Do not write tip state to Firestore.
4. Do not add rules.
5. If localStorage is unavailable, fail gracefully and keep the app usable.
6. Do not block ledger rendering if localStorage throws.

## Part 7 - Accuracy and caregiver check

Confirm the new Help and tips make sense for both owner and caregiver.

Required behavior:

1. Tips should not tell caregivers to use owner-only features except where clearly framed.
2. CSV export/import tips should not confuse caregivers if those menu items are owner-only.
3. If a tip mentions Export CSV and caregivers cannot export, hide that tip for caregivers or reword it as owner-only.
4. Help can mention owner-only features, but must say they are owner-only.
5. Entry logging tips should work for caregivers too.

## Part 8 - What not to do

Do not implement:

- modal onboarding
- pop-up welcome screen
- coach marks
- guided tour
- random tips every login forever
- database-backed tips
- new settings page toggle unless needed
- new onboarding route
- new care tracking fields
- import/export logic changes
- Firestore rules changes
- PWA install flow
- public launch flow

## Allowed files

Likely files:

- `src/help/HelpView.vue`
- `src/entries/CareLedgerView.vue`
- a small tip component if useful, such as `src/ui/EarlyUseTips.vue` or `src/entries/EarlyUseTips.vue`
- shared styles only if needed
- relevant tests if pure helpers are introduced
- `docs/reports/phase-9j-empty-states-help-faq-early-use-tips.md`

Do not touch app logic unrelated to empty state, tips, or Help copy.

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

1. Empty ledger state appears when active baby has no visible entries.
2. Empty ledger state does not appear when active baby has entries.
3. Empty ledger state includes Add first entry action.
4. Empty ledger state includes Help and Legend link.
5. Empty ledger state lists partial-entry examples.
6. Tip card appears on the ledger for users who have not hidden or completed tips.
7. Tip card shows one tip at a time.
8. Dismissing a tip advances or hides that tip.
9. Hide tips stops all tips.
10. All ten tips are present.
11. Tips use localStorage only.
12. localStorage failure does not break the ledger.
13. Tips do not block entry logging.
14. CSV tip is owner-only or hidden for caregivers if needed.
15. Help includes the required "How do I log..." questions.
16. Help answers partial-entry scenarios accurately.
17. Help says Since birth needs birthdate.
18. Help explains Import CSV blocks wrong-baby or duplicate files.
19. No em dash characters appear in Help visible copy.
20. No em dash characters appear in new tip or empty-state copy.
21. No modal onboarding was added.
22. No import/export logic changed.
23. No entry write behavior changed.
24. No Firestore rules/indexes changed.
25. No migration or bulk data mutation.
26. No deleteDoc.
27. No PWA/Capacitor/SW/manifest.
28. No new dependencies.

## Claude reporting requirements

After implementation, create:

`docs/reports/phase-9j-empty-states-help-faq-early-use-tips.md`

The report must include:

- Summary
- Changed files
- Empty ledger state summary
- Early-use tips behavior summary
- Full list of ten tips
- Help FAQ summary
- No em dash confirmation
- Owner/caregiver behavior notes
- Tests result
- Build result
- Safety confirmations
- Manual QA checklist
- Known issues or follow-ups
- Commit hash
- Main synced with origin/main: yes/no
- Vercel redeploy expected: yes/no
