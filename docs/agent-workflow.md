# Agent Workflow

This repo uses Markdown files as the handoff layer between planning, implementation, and review.

## Roles

- ChatGPT: product planning, task writing, report review, next-step planning.
- `docs/tasks/`: approved task inbox.
- Claude Code: implementation agent.
- `docs/reports/`: immutable output reports.
- `docs/backlog/`: rough ideas only, not implementation instructions.

## Core workflow

1. User gives feedback or a request in chat.
2. ChatGPT turns it into a scoped task after user approval.
3. The task is written to `docs/tasks/`.
4. Claude Code implements the task.
5. Claude Code writes one matching report to `docs/reports/`.
6. ChatGPT reviews the report and recommends the next step.

## Filename convention

Task and report filenames should match.

```text
docs/tasks/phase-9e-example.md
docs/reports/phase-9e-example.md
```

## Before implementation

Claude should:

1. Read the task file in `docs/tasks/`.
2. Read any context files named in the task.
3. Confirm repo state is clean and synced if the task requires it.
4. Treat `docs/backlog/` as raw material only.
5. Avoid unrelated refactors.

## During implementation

Claude should:

1. Keep scope narrow.
2. Preserve existing user data.
3. Avoid touching feeds unless the task explicitly says so.
4. Avoid Firestore rules or index changes unless the task explicitly says so.
5. Avoid migrations unless the task explicitly says so.
6. Avoid PWA, Capacitor, broad styling, or new dependencies unless the task explicitly says so.

## After implementation

Claude should:

1. Run the checks named in the task.
2. Create one matching report in `docs/reports/`.
3. Include changed files, tests, build result, safety confirmations, known issues, commit hash, sync status, and next recommendation.
4. Do not overwrite old reports.
5. Do not create or overwrite a generic `latest.md` report.

## Backlog rule

Backlog items are not implementation instructions. A backlog item becomes buildable only after it is promoted into a task file in `docs/tasks/`.
