# Phase X — Task Title

**Status:** Ready for implementation  
**Created:** YYYY-MM-DD  
**Created by:** ChatGPT with user approval  
**Expected report:** `docs/reports/phase-x-task-title.md`

## Goal

State the outcome this task should produce.

## Current state

Briefly describe the current app behavior, relevant recent phases, and known constraints.

## Required context

List files Claude should read before implementation, for example:

- `docs/agent-workflow.md`
- `docs/data-model.md`
- `docs/privacy-notes.md`

## Required behavior

Use clear numbered requirements.

1. Requirement one.
2. Requirement two.
3. Requirement three.

## Out of scope

List what must not be implemented in this task.

- No unrelated refactors.
- No migration unless named here.
- No Firestore rules/index changes unless named here.

## Allowed files

List expected file areas when useful. Omit this section only for broad docs-only work.

- `src/...`
- `docs/reports/phase-x-task-title.md`

## Safety restrictions

- Do not touch feeds.
- Do not run migration.
- Do not modify imported historical entries unless explicitly required.
- Do not change Firestore rules unless explicitly required.
- Do not change Firestore indexes unless explicitly required.
- Do not add PWA/Capacitor unless explicitly required.
- Do not use `deleteDoc` unless explicitly required and reviewed.

## Validation checklist

Run and report:

- `npm test`
- `npm run build`
- `git status`
- `git diff --stat`
- `grep deleteDoc src/`

Confirm task-specific acceptance criteria here.

## Claude reporting requirements

After implementation, create the matching immutable report:

`docs/reports/phase-x-task-title.md`

The report must include:

- Summary
- Changed files
- What was built
- Tests run
- Build result
- Safety confirmations
- Known issues or blockers
- Commit hash
- Main synced with origin/main: yes/no
- Recommended next phase
