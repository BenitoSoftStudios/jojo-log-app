# Phase 9L-1 - Remove dashboard quick actions and preserve Today panel

**Status:** Ready for implementation  
**Created:** 2026-06-06  
**Created by:** ChatGPT with user approval  
**Expected report:** `docs/reports/phase-9l-1-remove-dashboard-quick-actions.md`

## Goal

Keep the strong Today command panel from Phase 9L, but remove the dashboard quick action pills because they create the wrong mental model.

The Today panel is useful. The quick actions are working technically, but they may confuse parents by implying that each care event should become its own separate entry. Jojo's core model is that one row can represent a care moment cluster, such as bottle, diaper, medication, Tummy Time, vitamin D, and notes around the same time.

This is a UX correction. Do not roll back the Today panel, amber incomplete styling, or row tap target improvements.

## Current issue

Phase 9L added quick action pills on the Today panel:

- Bottle
- Diaper
- Rx
- Tummy

The problem scenario:

1. Parent taps Bottle because the baby took a bottle.
2. Two minutes later the baby has a diaper.
3. Parent taps Diaper.
4. The app now has two entries, even though this was probably one care moment cluster.

This can teach the wrong logging pattern and may create duplicate or over-fragmented logs.

## Required context

Read:

- `docs/agent-workflow.md`
- `docs/tasks/README.md`
- `docs/tasks/template.md`
- `docs/reports/phase-9l-main-ledger-command-panel-and-incomplete-state-polish.md`
- `src/entries/CareLedgerView.vue`
- `src/entries/CareEntryRow.vue`
- `src/entries/CareDay.vue`
- `src/styles/main.css`

## Part 1 - Preserve the good Phase 9L changes

Keep:

1. Today command panel.
2. Today totals.
3. Last logged line.
4. Amber `X need finishing` chip.
5. Demoted member/role label inside the panel, if it still looks good.
6. Secondary 7-day/month stats row.
7. Amber incomplete styling.
8. `X need finishing` day label.
9. Larger W/P/WP/`-` controls.
10. Larger sun/Rx/star controls.
11. Accessibility improvements from 9L.

## Part 2 - Remove dashboard quick actions

Remove or hide the quick action pill row from the Today panel:

- Bottle
- Diaper
- Rx
- Tummy

Required behavior:

1. No quick action pills appear on the Today panel.
2. The Today panel still feels useful and balanced without them.
3. `+ Day` and `+ Add Entry` remain the primary entry creation model.
4. No quick action sheet should be reachable from the Today panel.
5. If quick action code can be removed safely, remove it.
6. If removal risks breaking more code, leave it internal but unused and document it in the report.
7. Do not leave dead visible UI.

## Part 3 - Preserve or simplify code safely

If removing quick action code:

1. Remove unused quick action state.
2. Remove unused quick action sheet markup.
3. Remove unused quick action helper functions.
4. Remove unused quick action CSS.
5. Keep unrelated entry creation logic unchanged.

If keeping internal code:

1. Add a short comment explaining it is reserved for possible future Add Entry preset work.
2. Ensure no lint/build issues.
3. Explain why it was safer to keep in the report.

Prefer removal if safe.

## Part 4 - Future direction note

Add a note in the report:

Quick actions may return later inside the `+ Add Entry` flow as entry presets, not as dashboard buttons.

Correct future mental model:

```text
Tap + Add Entry first.
Then choose entry type or preset:
Regular entry
Bottle only
Diaper only
Medication only
Tummy Time only
Note only
Vitamin D only
```

This keeps the app centered on one entry as one care moment.

Do not implement this future preset flow in 9L-1.

## Out of scope

Do not implement:

- Add Entry preset picker
- new quick action placement
- dashboard action redesign
- menu redesign
- Help redesign
- chart changes
- new tracking fields
- import/export changes
- Firestore rules changes
- PWA work
- notification work
- data migration

## Safety restrictions

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

- `npm test`
- `npm run build`
- `git status`
- `git diff --stat`
- `grep deleteDoc src/`

Confirm:

1. Today panel remains visible.
2. Today panel shows today's totals.
3. Today panel shows last logged entry when available.
4. Today panel shows amber `X need finishing` chip when applicable.
5. No Bottle/Diaper/Rx/Tummy quick action pills appear in the Today panel.
6. No quick action sheet is reachable from the Today panel.
7. `+ Day` still works.
8. `+ Add Entry` still works.
9. Manual entry editing still works.
10. Amber incomplete styling remains.
11. Larger row controls remain.
12. Caregiver ledger still works.
13. No import/export logic changed.
14. No Firestore rules/indexes changed.
15. No migration or bulk data mutation.
16. No deleteDoc.
17. No new dependencies.
18. No PWA, manifest, service worker, or notification work.
19. No em dash characters in new visible copy.

## Manual QA checklist

Test on iPhone width if possible:

1. Open ledger as owner.
2. Confirm Today panel looks balanced without quick action pills.
3. Confirm the quick action row is gone.
4. Confirm tips sit below the Today panel if visible.
5. Open current day and use `+ Add Entry`.
6. Confirm normal row editing still supports bottle, diaper, Rx, Tummy Time, vitamin D, and notes.
7. Create an incomplete entry and confirm amber draft styling.
8. Open as caregiver and confirm ledger still works.

## Claude reporting requirements

After implementation, create:

`docs/reports/phase-9l-1-remove-dashboard-quick-actions.md`

The report must include:

- Summary
- Changed files
- What was preserved from 9L
- What was removed or hidden
- Code cleanup summary
- Future Add Entry preset note
- Tests result
- Build result
- Safety confirmations
- Manual QA checklist
- Known issues or follow-ups
- Commit hash
- Main synced with origin/main: yes/no
- Vercel redeploy expected: yes/no
