# Phase 9M - Menu and Help hub polish

**Status:** Ready for implementation  
**Created:** 2026-06-06  
**Created by:** ChatGPT with user approval  
**Expected report:** `docs/reports/phase-9m-menu-and-help-hub-polish.md`

## Goal

Modernize the hamburger menu and Help page so they feel like polished navigation and support surfaces, not long utility lists.

This phase should improve discoverability, grouping, scannability, and one-handed use. Do not add new care tracking features.

## Product direction

Jojo's Log should feel like a calm family utility with a premium mobile-app finish.

Use this direction:

- grouped navigation
- clearer mental model
- fewer flat lists
- task-first Help
- large touch targets
- parent-friendly language
- no developer terms
- no noisy visuals

## Current state

Recent phases completed:

- Phase 9K cleaned Settings and added tip controls.
- Phase 9L added the Today panel, amber incomplete styling, and larger row controls.
- Phase 9L-1 removed dashboard quick actions to preserve the one-row-one-care-moment model.

The remaining rough spots:

1. The hamburger/menu still risks feeling like a flat utility list.
2. Help is accurate, but it still reads more like a manual than a task-first help hub.
3. Common logging questions should be easier to jump to.
4. Owner-only and caregiver-available actions should be clear without making caregiver mode feel broken.

## Required context

Read:

- `docs/agent-workflow.md`
- `docs/tasks/README.md`
- `docs/tasks/template.md`
- `docs/reports/phase-9k-visual-system-polish-settings-and-tip-controls.md`
- `docs/reports/phase-9l-main-ledger-command-panel-and-incomplete-state-polish.md`
- `docs/reports/phase-9l-1-remove-dashboard-quick-actions.md`
- `src/help/HelpView.vue`
- menu or layout files that render hamburger navigation, likely `src/ui/AppLayout.vue` or related components
- `src/settings/SettingsView.vue` for section language consistency
- route definitions if needed

## Part 1 - Redesign the hamburger/menu as grouped navigation

Convert the menu from a flat list into grouped navigation.

Suggested groups:

```text
Track
Trends
Recently Deleted
Help and Legend

Family
Baby Settings
Manage Caregivers
Invite Member

Backup
Export CSV
Import CSV

Account
Settings
My Profile
Sign out
```

Adjust exact labels to match current routes and existing language.

Requirements:

1. Use grouped sections with clear section labels.
2. Keep touch targets comfortable, at least 44px high where practical.
3. Use existing visual language from Settings 9K where appropriate.
4. Owner-only items should only appear for owners.
5. Caregiver menu should still feel complete and useful.
6. Do not expose admin, legacy, Firebase, migration, or developer language.
7. Keep Export CSV behavior unchanged.
8. Keep Import CSV owner-only.
9. Keep Invite owner-only.
10. Keep Sign out visible and clear.
11. Do not change route behavior.

If any route does not exist, do not invent it. Use the existing route structure.

## Part 2 - Make owner-only behavior clear but calm

For owner-only sections or items:

1. Hide items caregivers cannot use, where current app already hides them.
2. If an owner-only item is visible for context, mark it with a small `Owner only` chip and prevent confusion.
3. Prefer hiding over disabled dead rows unless there is a strong reason to show context.
4. Do not make caregiver mode feel broken.

Potential owner-only items:

- Invite Member
- Import CSV
- Manage Caregivers if edit-only, depending on current behavior
- Baby Settings if editing is owner-only but view is allowed

Verify actual current behavior before changing labels.

## Part 3 - Help page as a task-first hub

Keep all accurate Help content from 9J-1 and 9K, but add a task-first top section.

Add quick jump tiles/chips near the top of Help:

```text
What do you want to log?
Bottle only
Diaper only
Medication
Tummy Time
Note only
Vitamin D
```

Requirements:

1. Tapping a tile should jump/scroll to the relevant FAQ section or answer.
2. Use anchors, refs, or simple in-page navigation. Keep it simple.
3. Do not add routing complexity.
4. Do not duplicate the full answer in the tile.
5. Keep the existing correct FAQ answers.
6. Keep the `0 mL`, `-`, blank/incomplete explanation prominent.
7. No medical or feeding guidance.
8. No em dash characters.

## Part 4 - Improve Help scannability

Review Help visual structure after adding the hub.

Requirements:

1. The `How do I log...` section should be easy to find.
2. Each FAQ answer should be short and scannable.
3. The icon legend should not compete with the task-first hub.
4. Use cards, pills, or section spacing in line with the current app style.
5. Avoid making Help longer in a way that feels heavy.
6. Keep existing correct content unless a clear inaccuracy is found.
7. Do not remove important safety/disclaimer copy.

## Part 5 - Menu visual polish

The menu should feel like part of the same system as Settings and the Today panel.

Look for:

- section labels
- row spacing
- row dividers
- chevrons or icons if already used elsewhere
- owner-only tags
- destructive/sign-out treatment
- safe-area padding
- bottom spacing for mobile browser chrome

Requirements:

1. Avoid heavy shadows or glassmorphism.
2. Avoid noisy gradients.
3. Avoid tiny text rows.
4. Avoid cramped edge buttons.
5. Keep the menu easy to dismiss.
6. Keep keyboard/focus behavior if currently present.

## Part 6 - Accessibility

Improve or preserve accessibility where touched.

Requirements:

1. Menu groups should have clear text labels.
2. Menu buttons/links should have accessible names.
3. Help jump chips should be buttons or links with accessible labels.
4. Focus should remain visible.
5. Do not rely on color alone for owner-only or destructive meaning.
6. Respect existing reduced-motion behavior if adding scroll behavior.

## Part 7 - What not to do

Do not implement:

- new tracking fields
- Add Entry preset picker
- dashboard quick actions
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

## Allowed files

Likely files:

- `src/help/HelpView.vue`
- `src/ui/AppLayout.vue` or menu component
- shared styles if needed
- route definitions only if needed for existing route names
- `docs/reports/phase-9m-menu-and-help-hub-polish.md`

Touch other files only if needed for menu/help polish. Keep the scope tight.

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
- `grep deleteDoc src/` or PowerShell equivalent if grep is unavailable

Confirm:

1. Menu is grouped into clear sections.
2. Menu items route to the same destinations as before.
3. Owner sees owner-only menu items.
4. Caregiver does not see hidden owner-only items.
5. Caregiver menu still feels useful.
6. Import CSV remains owner-only.
7. Invite remains owner-only.
8. Export CSV behavior unchanged.
9. Sign out remains clear.
10. Help has a task-first top hub.
11. Help jump tiles/chips scroll to relevant FAQ answers.
12. `0 mL`, `-`, blank/incomplete explanation remains prominent.
13. Help FAQ answers remain accurate.
14. No em dash characters in new visible copy.
15. No entry write behavior changed.
16. No import/export logic changed.
17. No Firestore rules/indexes changed.
18. No migration or bulk data mutation.
19. No deleteDoc.
20. No new dependencies.
21. No PWA, manifest, service worker, or notification work.

## Manual QA checklist

Test on iPhone width if possible:

1. Open menu as owner.
2. Confirm grouped sections look polished and clear.
3. Tap each owner menu item and confirm routing.
4. Open menu as caregiver.
5. Confirm owner-only items are hidden or clearly unavailable.
6. Confirm caregiver still has useful navigation.
7. Open Help.
8. Tap each Help quick tile/chip.
9. Confirm the page jumps to the expected answer.
10. Confirm Help remains readable and not bloated.
11. Confirm no stale admin, legacy, migration, Firebase, or developer language appears.

## Claude reporting requirements

After implementation, create:

`docs/reports/phase-9m-menu-and-help-hub-polish.md`

The report must include:

- Summary
- Changed files
- Menu grouping summary
- Owner/caregiver behavior summary
- Help hub summary
- Help scannability summary
- Accessibility summary
- Tests result
- Build result
- Safety confirmations
- Manual QA checklist
- Known issues or follow-ups
- Commit hash
- Main synced with origin/main: yes/no
- Vercel redeploy expected: yes/no
