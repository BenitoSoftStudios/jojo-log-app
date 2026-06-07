# Phase 9M-1 - Help hub only

**Status:** Ready for implementation  
**Created:** 2026-06-06  
**Created by:** ChatGPT with user approval  
**Expected report:** `docs/reports/phase-9m-1-help-hub-only.md`

## Goal

Add a task-first Help hub to the Help page only.

This is the safe retry of the Help portion of Phase 9M after the combined menu/help task caused a blank deployed app and was reverted. This task must not touch the main ledger shell or hamburger menu.

## Product direction

Help should feel useful to a tired parent who needs a fast answer.

Use this direction:

- task-first
- scannable
- short labels
- calm visual treatment
- no new routes
- no menu changes
- no main ledger changes

## Current state

The Help page already contains accurate guidance from 9J-1 and 9K, including the key completion model:

- `0 mL` means no feed.
- `-` means no diaper event.
- Blank amount or blank diaper means not recorded yet and the entry stays incomplete.

The page is accurate but still reads like a manual. Add quick jump chips so parents can get to common logging instructions faster.

## Required context

Read:

- `docs/agent-workflow.md`
- `docs/tasks/README.md`
- `docs/tasks/template.md`
- `docs/reports/phase-9j-1-partial-entry-copy-and-empty-state-polish.md`
- `docs/reports/phase-9k-visual-system-polish-settings-and-tip-controls.md`
- `docs/reports/phase-9m-menu-and-help-hub-polish.md`
- `src/help/HelpView.vue`

Do not inspect or edit `src/entries/CareLedgerView.vue` for this task unless needed only to confirm it was not touched. The implementation file should be `src/help/HelpView.vue` only.

## Part 1 - Add task-first Help hub

Add a new Help card near the top of the Help page, after the intro card and before the detailed manual sections.

Suggested heading:

```text
What do you want to log?
```

Add six quick jump chips:

```text
Bottle only
Diaper only
Medication
Tummy Time
Note only
Vitamin D
```

Each chip should jump to the existing matching FAQ answer.

## Part 2 - Add anchors to existing FAQ rows

Add stable anchors or refs to the existing FAQ answers for:

1. Bottle only
2. Diaper only
3. Medication only
4. Tummy Time only
5. Note only
6. Vitamin D

Requirements:

1. Use simple in-page anchors or a simple scroll helper.
2. Do not change Vue router behavior.
3. Do not add a new route.
4. Do not alter the main app shell.
5. Ensure sticky headers do not cover the target answer after jumping. Use `scroll-margin-top` if needed.
6. Keep the current correct FAQ answers.

## Part 3 - Preserve Help accuracy

Do not rework the Help page broadly.

Keep the current accurate concepts:

- Use `0 mL` when there was no feed.
- Use `-` when there was no diaper event.
- Blank means not recorded yet.
- Blank amount or blank diaper means incomplete.
- The app is descriptive only, not feeding or medical guidance.

If you find a clear typo or stale sentence inside Help, fix it only if it is directly related to the Help hub task.

## Part 4 - Visual treatment

The Help hub should fit the current app style.

Requirements:

1. Use the existing card/pill language.
2. Chips should be easy to tap.
3. Chips should wrap cleanly on iPhone width.
4. Avoid heavy shadows, gradients, or glassmorphism.
5. Keep the Help page calm and readable.
6. No em dash characters.

## Hard scope boundary

Allowed implementation file:

- `src/help/HelpView.vue`

Allowed report file:

- `docs/reports/phase-9m-1-help-hub-only.md`

Do not edit:

- `src/entries/CareLedgerView.vue`
- `src/ui/AppLayout.vue`
- menu components
- routes
- Firestore files
- import/export files
- entry logic files
- graph/trends files
- package files

If touching any other file seems necessary, stop and write that as a known issue in the report instead of implementing it.

## Out of scope

Do not implement:

- menu grouping
- menu redesign
- hamburger changes
- route changes
- dashboard quick actions
- Add Entry presets
- new tracking fields
- chart redesign
- PWA install flow
- service worker or manifest changes
- notification flow
- account deletion
- donation flow
- landing page
- new animal avatars
- import/export behavior changes
- Firestore rules changes
- Firestore indexes
- data migration
- new dependencies

## Safety restrictions

- Do not change entry write behavior.
- Do not change Trends calculations.
- Do not change feed-count logic.
- Do not change CSV import/export logic.
- Do not change Firestore rules.
- Do not change Firestore indexes.
- Do not run migrations.
- Do not bulk modify Firestore data.
- Do not modify existing entries.
- Do not use `deleteDoc`.
- Do not add dependencies.
- Do not add PWA, manifest, service worker, or notification work.
- Do not add image upload or Firebase Storage.

## Validation checklist

Run:

- `npm.cmd test`
- `npm.cmd run build`
- `git status`
- `git diff --stat`
- PowerShell equivalent of `grep deleteDoc src/` if grep is unavailable

Confirm:

1. Only `src/help/HelpView.vue` and the report file changed.
2. Help has a task-first hub near the top.
3. Hub has six chips: Bottle only, Diaper only, Medication, Tummy Time, Note only, Vitamin D.
4. Each chip jumps to the matching existing FAQ answer.
5. Jump target is not hidden under the sticky header.
6. Existing FAQ answers remain accurate.
7. `0 mL`, `-`, and blank/incomplete explanation remains prominent.
8. No em dash characters in new visible copy.
9. No menu files changed.
10. No `CareLedgerView.vue` changes.
11. No entry write behavior changed.
12. No import/export logic changed.
13. No Firestore rules/indexes changed.
14. No migration or bulk data mutation.
15. No deleteDoc.
16. No new dependencies.
17. No PWA, manifest, service worker, or notification work.

## Manual QA checklist

Test on iPhone width if possible:

1. Open Help.
2. Confirm the new hub appears near the top.
3. Tap Bottle only.
4. Tap Diaper only.
5. Tap Medication.
6. Tap Tummy Time.
7. Tap Note only.
8. Tap Vitamin D.
9. Confirm each chip lands on the expected answer.
10. Confirm Help remains readable and not bloated.
11. Return to the main ledger and confirm it is not blank.

## Claude reporting requirements

After implementation, create:

`docs/reports/phase-9m-1-help-hub-only.md`

The report must include:

- Summary
- Changed files
- Help hub summary
- Anchor/jump behavior summary
- Help accuracy confirmation
- Scope confirmation that `CareLedgerView.vue` was not changed
- Tests result
- Build result
- Safety confirmations
- Manual QA checklist
- Known issues or follow-ups
- Commit hash
- Main synced with origin/main: yes/no
- Vercel redeploy expected: yes/no
