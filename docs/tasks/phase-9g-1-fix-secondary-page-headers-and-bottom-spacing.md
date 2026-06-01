# Phase 9G-1 - Fix secondary page headers and bottom spacing

**Status:** Ready for implementation  
**Created:** 2026-05-31  
**Created by:** ChatGPT with user approval  
**Expected report:** `docs/reports/phase-9g-1-fix-secondary-page-headers-and-bottom-spacing.md`

## Goal

Hotfix the visual regression introduced in Phase 9G while keeping the successful Rx Medication and Tummy Time bottom sheets.

Phase 9G improved daily entry interactions, but the global header/safe-area change made secondary page headers look sloppy and inconsistent. Back arrows now float above titles on some pages, titles sit too close to dividers, and the layout feels worse than before.

Do not revert the bottom sheet work. Patch only the page header/layout damage and bottom browser spacing.

## Current state

- Rx Medication bottom sheet looks good and should stay.
- Tummy Time bottom sheet looks good and should stay.
- Ledger row compact display for `Rx Tylenol 2m...` and `★ 5m` looks good and should stay.
- Secondary page headers look wrong after Phase 9G:
  - On Trends, Manage Caregivers, and Baby Settings, the back arrow floats above the title.
  - Titles appear too close to the divider.
  - The header pattern is inconsistent across pages.
  - Recently Deleted looks closer to correct because its arrow and title appear on the same row, but it still needs to match the final shared pattern.
- On long pages such as Baby Settings, bottom actions like Save can sit too close to or behind the Brave/Safari bottom browser chrome.

## Required context

Read:

- `docs/agent-workflow.md`
- `docs/tasks/README.md`
- `docs/tasks/template.md`
- `docs/reports/phase-9g-navigation-shell-and-quick-action-bottom-sheets.md`
- `src/ui/AppLayout.vue`
- secondary page components using the header slot/back button
- `src/entries/CareEntryRow.vue` only to confirm bottom sheets remain intact
- existing layout CSS variables and spacing tokens

## Part 1 - Preserve successful 9G behavior

Do not revert these Phase 9G improvements:

1. Rx Medication uses a bottom sheet.
2. Tummy Time uses a bottom sheet.
3. Ledger rows no longer expand with inline Rx/Tummy forms.
4. Compact row display remains:
   - Rx note cue, such as `Rx Tylenol 2m...`
   - Tummy duration cue, such as `★ 5m`
5. Entry data model remains unchanged.

## Part 2 - Fix secondary page header layout

### Problem

The Phase 9G global header change made some secondary pages visually worse. The back arrow is no longer positioned as part of a clean header row. It floats above the title on several pages.

This is not acceptable. The app should use one consistent secondary-page header pattern.

### Required final design

The header should read visually as:

```text
[optional safe top spacing]

←        Page Title        [blank spacer]

[divider]
```

The back arrow and title must be on the same horizontal row.

Required behavior:

1. Back arrow and title sit on the same horizontal row.
2. Back arrow is left aligned with the page content, not floating centered above the title.
3. Back arrow has a minimum 44px by 44px tap target.
4. Title is visually centered in the header row.
5. Add a right-side 44px blank spacer if needed to center the title against the back button.
6. Title does not touch or overlap the bottom divider.
7. Header row should have enough vertical space to breathe but must not feel bulky.
8. Header should remain consistent across menu/secondary pages.
9. Avoid per-page hacks if a shared component/layout fix is practical.
10. Do not use a global padding hack that causes arrows to float above titles.

Recommended structure:

```text
secondary-header
  back button cell: 44px
  title cell: flex, centered
  right spacer cell: 44px
```

If there is already a shared layout/header mechanism, use it. If not, create the smallest shared pattern needed.

## Part 3 - Pages to verify

Fix and verify the header on:

1. My Profile
2. Settings
3. Baby Settings
4. Trends
5. Help & Legend
6. Manage Caregivers
7. Invite Member
8. Import CSV
9. Recently Deleted
10. Any other route opened from the hamburger/menu that uses the secondary back arrow pattern

The final visual behavior should not depend on which page happens to structure its header differently.

## Part 4 - Brave/Safari browser chrome and bottom spacing

### Problem

The app cannot control whether Brave/Safari places the address bar at the top or bottom. But the app can avoid cramped top headers and bottom actions hidden by browser chrome.

### Required behavior

1. Top header spacing should work with browser address bar at top or bottom.
2. Back arrow should not feel cramped against the top browser chrome.
3. Long forms must have enough bottom scroll padding for bottom browser chrome.
4. Bottom actions such as Save in Baby Settings should not be hidden behind the Brave/Safari bottom address bar.
5. Use `env(safe-area-inset-bottom)` where appropriate.
6. If additional fixed padding is needed beyond safe-area, add a modest app-level bottom breathing room.
7. Do not create huge blank gaps on pages without bottom browser chrome.
8. Bottom sheets from 9G should keep their safe-area bottom behavior.

## Part 5 - What not to change

Do not change:

- Rx Medication bottom sheet behavior
- Tummy Time bottom sheet behavior
- Rx/Tummy row compact display
- Entry data model
- Firestore rules
- Firestore indexes
- feeds calculations
- Trends chart logic
- baby settings logic
- animal avatars
- import/export logic
- Recently Deleted restore logic
- member management logic

This is a layout hotfix.

## Out of scope

Do not implement:

- broad visual redesign
- new styling system
- new typography system
- new animal avatars
- PWA
- Capacitor
- import/export changes
- CSV schema changes
- Firestore rules changes
- Firestore indexes
- migration
- bulk data cleanup
- public onboarding
- notification reminders
- medical guidance
- medication database
- dosage recommendations
- new chart features

## Allowed files

Likely files:

- `src/ui/AppLayout.vue`
- shared layout/header component if one exists or is created
- secondary page components only if needed to normalize header markup
- shared CSS or variables if needed
- `docs/reports/phase-9g-1-fix-secondary-page-headers-and-bottom-spacing.md`

Only inspect `src/entries/CareEntryRow.vue` if needed to confirm Rx/Tummy bottom sheets remain unchanged.

## Safety restrictions

- Do not touch feeds calculations.
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
- Do not add medical recommendation language.
- Do not add dependencies.

## Validation checklist

Run:

- `npm test`
- `npm run build`
- `git status`
- `git diff --stat`
- `grep deleteDoc src/`

Confirm:

1. Rx bottom sheet still works.
2. Tummy Time bottom sheet still works.
3. Ledger rows still do not expand with inline Rx/Tummy forms.
4. My Profile header has arrow and title on same row.
5. Settings header has arrow and title on same row.
6. Baby Settings header has arrow and title on same row.
7. Trends header has arrow and title on same row.
8. Help & Legend header has arrow and title on same row.
9. Manage Caregivers header has arrow and title on same row.
10. Invite Member header has arrow and title on same row.
11. Import CSV header has arrow and title on same row.
12. Recently Deleted header has arrow and title on same row.
13. Back arrow is left aligned, not floating above title.
14. Back arrow tap target is at least 44px by 44px.
15. Title is visually centered.
16. Title does not touch divider.
17. Header looks acceptable with Brave/Safari address bar at top.
18. Header looks acceptable with Brave/Safari address bar at bottom.
19. Baby Settings Save button can scroll above bottom browser chrome.
20. Other bottom actions are not hidden behind browser chrome.
21. No feeds path changed.
22. No Firestore rules/indexes changed.
23. No migration or bulk data mutation.
24. No deleteDoc.
25. No PWA/Capacitor/SW/manifest.

## Claude reporting requirements

After implementation, create:

`docs/reports/phase-9g-1-fix-secondary-page-headers-and-bottom-spacing.md`

The report must include:

- Summary
- Changed files
- Header layout fix summary
- Bottom spacing fix summary
- Confirmation that Rx/Tummy bottom sheets were preserved
- Tests result
- Build result
- Safety confirmations
- Known issues or follow-ups
- Commit hash
- Main synced with origin/main: yes/no
- Vercel redeploy expected: yes/no
