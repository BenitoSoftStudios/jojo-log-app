# Phase 9L - Main ledger command panel and incomplete-state polish

**Status:** Ready for implementation  
**Created:** 2026-06-06  
**Created by:** ChatGPT with user approval  
**Expected report:** `docs/reports/phase-9l-main-ledger-command-panel-and-incomplete-state-polish.md`

## Goal

Modernize the main ledger screen so it feels calmer, more premium, faster to use with one hand, and less punishing when entries are unfinished.

This phase is based on the UX benchmark against modern baby tracking, health logging, and family utility apps. The main finding was that Jojo's Log does not need more tracking features. It needs a better front porch: what happened last, what matters today, what needs finishing, and what should I tap next.

Do not add new care tracking features. Improve the main screen around existing workflows only.

## Product direction

Keep Jojo's existing soft pastel, calm, family utility style.

Use this direction:

- calm first
- glanceable
- one-thumb friendly
- low-noise
- tactile surfaces
- clear next action
- forgiving draft states
- accessible tap targets

Do not make the app louder. Do not make it feel like a generic startup dashboard.

## Current state

The main ledger currently shows:

1. Baby header
2. Date, clock, sync status
3. Signed-in role line
4. Four equal stat cards
5. Early-use tip card
6. Month, week, day ledger
7. Rows with amount, diaper controls, extras, and overflow

This works, but the hierarchy is not decisive. A tired parent must scan several elements before they get to the active logging surface.

Current issue areas:

- Four equal top stat cards summarize, but do not guide action.
- The role line takes premium space on the main screen.
- Tip card can compete with current-day work.
- Incomplete rows use red outlines that feel like errors.
- W, P, WP, and `-` controls look small and precision-heavy.
- Users still need to remember `0 mL` and `-` rules for partial entries.

## Required context

Read:

- `docs/agent-workflow.md`
- `docs/tasks/README.md`
- `docs/tasks/template.md`
- `docs/reports/phase-9k-visual-system-polish-settings-and-tip-controls.md`
- `docs/reports/phase-9j-1-partial-entry-copy-and-empty-state-polish.md`
- `src/entries/CareLedgerView.vue`
- `src/entries/CareEntryRow.vue`
- `src/entries/EntryDetailSheet.vue`
- `src/ui/EarlyUseTips.vue`
- `src/ui/AppCard.vue`
- `src/ui/AppLayout.vue`
- shared styles, tokens, and existing entry creation helpers

Inspect the current entry creation flow before changing anything. Preserve existing data rules.

## Part 1 - Create a Today command panel

Replace or condense the four equal stat cards into one stronger Today command panel above the ledger.

The panel should answer:

1. What was the last logged entry?
2. What has been logged today?
3. What needs finishing?
4. What should I tap next?

Suggested content model:

```text
Today
Last logged 06:30, 110 mL, W
260 mL today, 3 feeds, 2 need finishing

[Add entry] [Bottle] [Diaper] [Rx] [Tummy]
```

Implementation guidance:

- Keep this compact on iPhone.
- Keep the existing totals, but present them as a single cohesive surface.
- Do not remove information parents depend on.
- Use existing calculations where possible.
- If the four stat cards cannot be removed safely, de-emphasize them and add the Today panel above or around them.
- The Today panel should feel like the main control surface of the app.
- Early-use tips should sit below this panel, not above it.
- The signed-in role line should be demoted, compacted, or moved if safe. It should not compete with today's work.

## Part 2 - Add quick action presets for existing workflows

Add quick actions that help parents create valid entries without remembering hidden completion rules.

This is not new tracking. These actions should use existing fields and existing behavior.

Required quick actions:

1. Bottle
2. Diaper
3. Rx
4. Tummy
5. Note, if it fits cleanly
6. Vitamin D, if it fits cleanly and does not overcrowd the panel

Quick actions may be shown as a horizontal pill row, compact action grid, or bottom sheet launched from the Today panel. Choose the cleanest mobile pattern.

### Bottle action

Goal: start a bottle entry fast.

Expected behavior:

- Create or prepare an entry using the current entry creation pattern.
- Amount should remain the required user input.
- Diaper should default to `-` only if that matches existing completion logic and does not create surprising data.
- Focus or surface amount input if practical.
- Do not silently invent amount.

### Diaper action

Goal: start a diaper-only entry fast.

Expected behavior:

- Use `0 mL` for no feed.
- Ask or let the user pick W, P, or WP.
- Do not use blank amount for a complete diaper-only entry.
- Do not default diaper to `-` for a diaper-only action.

### Rx action

Goal: start medication-only entry fast.

Expected behavior:

- Use `0 mL` for no feed.
- Use `-` for no diaper event.
- Open or trigger the existing medication detail sheet.
- Preserve existing medication note behavior.

### Tummy action

Goal: start Tummy Time-only entry fast.

Expected behavior:

- Use `0 mL` for no feed.
- Use `-` for no diaper event.
- Open or trigger the existing Tummy Time duration sheet.
- Preserve existing Tummy Time behavior.

### Note action

Goal: start note-only entry fast.

Expected behavior:

- Use `0 mL` for no feed.
- Use `-` for no diaper event.
- Open Entry Details with note field visible or focused if practical.
- Preserve existing note behavior.

### Vitamin D action

Goal: support the existing vitamin D toggle if it fits.

Expected behavior:

- Use `0 mL` for no feed.
- Use `-` for no diaper event.
- Toggle the existing vitamin D field.
- Do not add a new vitamin D model.

If a quick action would be risky or too large, implement the safer subset and document what was deferred.

## Part 3 - Soften incomplete state

Incomplete entries should feel like drafts or unfinished care logs, not errors.

Change incomplete visual treatment from aggressive red outlines to a calmer amber or sand draft state.

Required behavior:

1. Day summary should say something like `2 need finishing` instead of making the day feel broken.
2. Row-level incomplete state should use a soft left rail, chip, dot, or subtle amber outline.
3. Missing fields should remain clear.
4. Use red only for destructive actions, true errors, or failed sync.
5. Do not hide incomplete status.
6. Do not make incomplete entries look complete.
7. Keep screen-reader labels accurate.

Suggested wording:

```text
2 need finishing
Needs amount
Needs diaper
Needs amount and diaper
```

No em dash characters.

## Part 4 - Improve row control tap targets and affordance

Make the main ledger row controls feel easier to tap.

Focus on:

- W
- P
- WP
- `-`
- overflow button
- amount input area
- Rx button
- star button
- sun button

Requirements:

1. Visible controls should look more comfortable to tap.
2. Hit targets should aim for at least 44 by 44 CSS pixels where practical.
3. If a visible button stays smaller, the invisible hit box should still be comfortable.
4. Preserve row density enough that the ledger remains useful.
5. Do not make rows huge.
6. Selected states must remain readable without color alone.
7. Disabled or inactive states must not look broken.

## Part 5 - Main ledger visual rhythm

Refine the main ledger so it feels closer to the polish level of Trends.

Look for:

- top spacing
- card hierarchy
- day header weight
- month and week header weight
- tip placement
- role/status treatment
- current-day focus
- action priority

Requirements:

1. The main screen should lead with Today and the current open day.
2. Older days and prior months should feel secondary.
3. Tips should support, not compete.
4. Sync status should stay visible but calm.
5. Do not make the ledger harder to scan for doctors or parents reviewing history.

## Part 6 - Preserve existing behavior

Do not change the care model.

Preserve:

- entries
- amountMl behavior
- diaper behavior
- `0 mL` completion behavior
- `-` no diaper event behavior
- medication detail behavior
- Tummy Time duration behavior
- vitamin D behavior
- notes behavior
- soft delete behavior
- restore behavior
- CSV import/export behavior
- Trends calculations
- family/caregiver permissions

Any quick action must write the same kind of entry the user could create manually today.

## Part 7 - Accessibility and labels

Improve accessibility where touched.

Requirements:

1. Add or preserve accessible labels for W, P, WP, and `-` controls.
2. Use labels like `Wet diaper`, `Poop diaper`, `Wet and poop diaper`, and `No diaper event` where practical.
3. Add or preserve labels for Rx, Tummy Time, vitamin D, and note actions.
4. Make focus visible for keyboard/browser navigation.
5. Do not rely on color alone for selected or incomplete states.
6. Respect reduced motion if adding transitions.

## Part 8 - What not to do

Do not implement:

- new tracking fields
- new health guidance
- AI logging
- voice logging
- widgets
- Live Activities
- Apple Watch
- PWA install flow
- browser notification flow
- chart redesign
- menu redesign
- Help hub redesign
- import/export changes
- Firestore rules changes
- Firestore indexes
- data migration
- new onboarding
- new animal avatars
- new dependencies

Menu and Help hub polish should be a separate future task.

## Allowed files

Likely files:

- `src/entries/CareLedgerView.vue`
- `src/entries/CareEntryRow.vue`
- `src/entries/EntryDetailSheet.vue`
- `src/ui/EarlyUseTips.vue`
- shared UI components if needed
- shared styles or tokens if needed
- focused tests if helper logic is introduced
- `docs/reports/phase-9l-main-ledger-command-panel-and-incomplete-state-polish.md`

Touch other files only if needed for the ledger polish. Keep scope tight.

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

1. Main ledger shows a Today command panel or equivalent stronger current-state surface.
2. The old four stat cards are removed, condensed, or de-emphasized.
3. Today panel shows last logged entry when available.
4. Today panel shows today's totals.
5. Today panel shows unfinished count when entries need completion.
6. Today panel provides quick actions for existing workflows.
7. Quick actions do not add new tracking fields.
8. Bottle action does not invent an amount.
9. Diaper action uses `0 mL` for no feed.
10. Rx action uses `0 mL` and `-` if creating medication-only entry.
11. Tummy action uses `0 mL` and `-` if creating Tummy Time-only entry.
12. Note action uses `0 mL` and `-` if implemented.
13. Vitamin D action uses existing field only if implemented.
14. Incomplete state is amber or sand draft styling, not aggressive red field outlines.
15. Incomplete status remains clear.
16. Red remains available for destructive or true error states.
17. W, P, WP, and `-` controls feel easier to tap.
18. Row controls have accessible labels where practical.
19. Selected states are not color-only.
20. Tips do not compete with Today panel.
21. Ledger remains readable for history review.
22. No entry write behavior was changed outside quick action preset paths.
23. No import/export logic changed.
24. No Firestore rules/indexes changed.
25. No migration or bulk data mutation.
26. No deleteDoc.
27. No new dependencies.
28. No PWA, manifest, service worker, or notification work.
29. No em dash characters in new visible copy.

## Manual QA checklist

Test on iPhone width if possible:

1. Open ledger as owner.
2. Confirm Today panel looks like the primary surface.
3. Confirm current day is easy to find.
4. Confirm tips sit below the main action hierarchy.
5. Use quick action Bottle.
6. Use quick action Diaper.
7. Use quick action Rx.
8. Use quick action Tummy.
9. Use quick action Note if implemented.
10. Confirm each created entry matches the same data rules as manual entry.
11. Create an incomplete entry.
12. Confirm incomplete styling is clear but not harsh.
13. Tap W, P, WP, and `-` with one thumb.
14. Open as caregiver and confirm allowed actions still work.
15. Confirm caregiver cannot access owner-only behavior.
16. Confirm existing Jojo entries are unchanged.

## Claude reporting requirements

After implementation, create:

`docs/reports/phase-9l-main-ledger-command-panel-and-incomplete-state-polish.md`

The report must include:

- Summary
- Changed files
- Today command panel summary
- Quick action summary
- Incomplete-state summary
- Row control/tap target summary
- Accessibility summary
- Tests result
- Build result
- Safety confirmations
- Manual QA checklist
- Known issues or follow-ups
- Commit hash
- Main synced with origin/main: yes/no
- Vercel redeploy expected: yes/no
