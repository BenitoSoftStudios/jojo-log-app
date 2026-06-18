# Phase 10B-1 - Post-units QA and Help polish

**Status:** Ready for implementation  
**Created:** 2026-06-18  
**Created by:** ChatGPT with user approval  
**Expected report:** `docs/reports/phase-10b-1-post-units-qa-and-help-polish.md`

## Goal

Do a focused QA and polish pass after Phase 10B added password reset, browser timezone defaults, and mL / fl oz display preference.

This task is deliberately small. Verify the new launch-basics work, fix only low-risk issues, and update Help so fl oz does not feel surprising to beta users.

## Core principles

- Protect the main ledger.
- Do not redesign.
- Do not change Firestore rules.
- Do not change Firestore indexes.
- Do not migrate data.
- Do not add dependencies.
- Do not change CSV schema.
- Do not change feed-count logic.
- Do not change graph calculations except display-only formatting if there is a clear bug.
- `amountMl` remains the canonical stored field.
- mL remains the default unit.
- fl oz remains a display/input preference only.

## Read first

- `docs/agent-workflow.md`
- `docs/tasks/README.md`
- `docs/tasks/template.md`
- `docs/reports/phase-10a-public-beta-readiness.md`
- `docs/reports/phase-10b-launch-basics-password-timezone-units.md`
- `src/auth/LoginView.vue`
- `src/families/FamilySetupView.vue`
- `src/families/useFamily.js`
- `src/settings/SettingsView.vue`
- `src/entries/CareEntryRow.vue`
- `src/entries/CareLedgerView.vue`
- `src/entries/EntryDetailSheet.vue`
- `src/charts/GraphView.vue`
- `src/help/HelpView.vue`
- `src/utils/unitConverter.js`
- `src/test/unitConverter.test.js`

## Part 1 - Verify Phase 10B implementation

Audit and manually reason through the changed flows:

1. Sign-in page shows Forgot password only in sign-in mode.
2. Forgot password with blank email shows friendly message.
3. Forgot password with an email shows non-enumerating success copy.
4. Browser timezone detection is used for new family creation.
5. Timezone Settings still works and can show a detected timezone not in the static list.
6. mL is default.
7. fl oz can be selected in Settings by an owner.
8. CareEntryRow input displays selected unit.
9. CareEntryRow still stores integer `amountMl`.
10. Today panel total and last logged text use selected unit.
11. Entry detail sheet amount uses selected unit.
12. GraphView labels and callouts use selected unit without changing mL-based calculations.
13. CSV export/import remain mL and unchanged.
14. Main ledger is not blank.

Fix only clear low-risk issues found during this audit.

## Part 2 - Review fl oz rounding behavior

Phase 10B report notes this behavior:

```text
90 mL -> 3.0 fl oz -> user re-saves -> 89 mL
```

This is acceptable only if it does not create obvious user confusion or repeated drift.

Review `CareEntryRow.vue` and `unitConverter.js`.

Preferred behavior:

- If a user opens an existing entry in fl oz mode and does not change the amount, saving or blurring should not unnecessarily rewrite `amountMl` to a different number.
- If a user changes the fl oz value, converting to the nearest integer mL is fine.
- Display can remain 1 decimal place unless there is a simple safe reason to use more precision.

If this can be fixed safely with a narrow change, implement it.

If it would require risky state tracking or broad rewrites, do not implement it. Document the issue and recommended future task in the report.

## Part 3 - Help page fl oz note

Update Help copy so fl oz support is understandable.

Requirements:

- Keep Help concise.
- Do not overhaul Help.
- Add a small note near existing mL / blank / dash guidance or near the Help FAQ section.
- Required meaning:

```text
Bottle amounts are stored in mL. If your family uses fl oz, Jojo's Log converts display and entry amounts for you.
```

You may adjust wording to match the Help page tone.

Do not use em dash characters.

## Part 4 - Low-risk launch polish only

Allowed fixes:

- copy clarity
- Help copy consistency
- unit label clarity
- accessible labels for new controls if missing
- obvious mobile wrapping issue in new unit controls
- missing disabled/loading state for password reset if obvious
- tests for unit handling if needed

Not allowed:

- new route
- new dependency
- data migration
- Firestore rules/indexes
- CSV schema changes
- refactor of CareLedgerView
- rewrite of GraphView
- account deletion
- family invite redesign
- PWA install flow
- push notifications
- donation flow
- landing page

## Part 5 - Tests

Run:

- `npm.cmd test`
- `npm.cmd run build`
- `git status --porcelain`
- `git diff --stat`

If you change unit conversion behavior, add or update focused tests in `src/test/unitConverter.test.js` or the relevant existing test file.

Check forbidden changes:

- `package.json` should not change.
- `package-lock.json` should not change.
- `firestore.rules` should not change.
- `firestore.indexes` should not change.
- No new `deleteDoc` usage.

## Part 6 - Report

Create:

`docs/reports/phase-10b-1-post-units-qa-and-help-polish.md`

Report must include:

- Summary
- Changed files
- Phase 10B verification checklist
- Rounding behavior review
- Help fl oz note summary
- Tests result
- Build result
- Safety confirmations
- Manual QA checklist
- Known issues or follow-ups
- Commit hash
- Main synced with origin/main: yes/no
- Vercel redeploy expected: yes/no

## Part 7 - Commit

If you made source changes:

```text
chore: add Phase 10B-1 post-units QA polish
```

If you only created the report:

```text
docs: add Phase 10B-1 post-units QA report
```

Push to `origin/main`.
