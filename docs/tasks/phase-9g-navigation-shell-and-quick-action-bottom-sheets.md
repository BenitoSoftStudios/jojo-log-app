# Phase 9G - Navigation shell and quick action bottom sheets

**Status:** Ready for implementation  
**Created:** 2026-05-31  
**Created by:** ChatGPT with user approval  
**Expected report:** `docs/reports/phase-9g-navigation-shell-and-quick-action-bottom-sheets.md`

## Goal

Polish the mobile navigation shell and daily entry interactions so the app feels calmer and more reliable on iPhone browsers.

This phase has two focused goals:

1. Standardize secondary page headers so the back arrow is not cramped against browser chrome or page edges.
2. Move Rx Medication and Tummy Time detail editing out of inline ledger rows and into focused bottom sheets.

This is a daily-use polish phase, not a broad visual redesign.

## Current state

- Phase 9F is live and tested.
- Baby Settings, animal selector, optional birthdate privacy copy, and Since birth empty state work.
- Trends charts have improved axis scaling.
- Rx Medication supports optional `medicationNote`.
- Tummy Time supports one tracked session with optional duration.
- Current issue: secondary page back arrows sit too close to the top/left edge on some mobile browser layouts, especially Brave with the address bar at the top.
- Current issue: Rx and Tummy Time edit forms appear inline inside dense ledger rows. This works, but can make rows jump, stretch, and feel cramped on mobile.
- User wants to try bottom sheets for Rx and Tummy Time editing.

## Required context

Read:

- `docs/agent-workflow.md`
- `docs/tasks/README.md`
- `docs/tasks/template.md`
- `docs/reports/phase-9f-baby-settings-animal-selector.md`
- `src/entries/CareLedgerView.vue`
- `src/entries/CareEntryRow.vue`
- `src/entries/EntryDetailSheet.vue`
- `src/app/router.js`
- existing page components opened from the menu
- existing CSS variables and layout patterns
- existing bottom sheet/modal patterns
- existing test patterns

## Part 1 - Standardize secondary page headers

### Problem

Secondary pages have a back arrow near the top of the page. In some mobile browser configurations, the arrow appears too close to the browser address bar and too close to the page edge.

This is visible on pages like My Profile when Brave has the address bar at the top. With the address bar at the bottom, it feels less cramped, but the app cannot control browser chrome placement. The app should be robust in both layouts.

### Required behavior

Create or standardize a reusable secondary page header pattern.

Header requirements:

1. Back arrow must not sit tight against the top browser chrome.
2. Back arrow must not sit tight against the left edge.
3. Back arrow must have a comfortable tap target, minimum 44px by 44px.
4. Header should use safe-area-aware top spacing where appropriate.
5. Header should look correct with Brave/Safari address bar at top or bottom.
6. Page title should remain visually centered.
7. Header should include a bottom divider if that matches the current app style.
8. Header should avoid excess height. It should feel calm, not bulky.
9. Header should not overlap content.
10. Header should be consistent across secondary/menu pages.

Suggested shell layout:

```text
[safe top spacing]
[44px back tap target] [centered title]
[divider]
[page content with consistent padding]
[safe bottom spacing]
```

### Pages to review and update

Apply the standardized header to menu/secondary pages where applicable:

- My Profile
- Settings
- Baby Settings
- Trends
- Help & Legend
- Manage Caregivers
- Invite Member
- Import CSV
- Recently Deleted
- any other route opened from the menu that uses the same back arrow pattern

Do not redesign the content of those pages unless needed for header spacing.

## Part 2 - Safe area and browser chrome spacing

### Problem

Mobile browsers can place controls at the top or bottom. Long forms and bottom sheets must not collide with the iOS home indicator or Brave/Safari bottom browser chrome.

### Required behavior

1. Add or standardize bottom safe-area padding where needed.
2. Bottom sheets must not collide with the iOS home indicator.
3. Bottom sheets must not hide Save, Cancel, Clear, or Delete actions behind browser chrome.
4. Long forms should scroll so final actions remain reachable.
5. Use `env(safe-area-inset-bottom)` where appropriate.
6. Use `env(safe-area-inset-top)` where appropriate, but do not create excessive blank space.
7. Ensure the app still looks acceptable when the browser address bar is at the top or bottom.

## Part 3 - Move Tummy Time editing to bottom sheet

### Current behavior

Tummy Time is edited inside the ledger row using an inline form.

### New behavior

Tapping the Tummy Time star should open a bottom sheet.

Bottom sheet content:

- Title: `How long was Tummy Time?`
- Inputs:
  - minutes
  - seconds
- Buttons:
  - Save
  - Cancel
  - Clear Tummy Time, only if Tummy Time is already tracked

Required behavior:

1. Ledger rows should no longer expand with an inline Tummy Time form.
2. Tapping star opens the bottom sheet.
3. Saving marks Tummy Time as one tracked session.
4. Saving duration stores `tummyTimeDurationSeconds`.
5. Saving blank or zero duration still allows a tracked session if the user chooses Save.
6. Clear removes Tummy Time tracking and clears duration.
7. Cancel closes without saving.
8. Existing data model remains unchanged:
   - `tummyTime`
   - `tummyTimeCount`
   - `tummyTimeDurationSeconds`
9. Do not reintroduce multipliers.
10. Historical `tummyTimeCount > 0` still displays as one session.
11. Row display after saving remains compact.
12. Entry Details display remains correct.

## Part 4 - Move Rx Medication editing to bottom sheet

### Current behavior

Rx Medication is edited inside the ledger row using an inline form.

### New behavior

Tapping Rx should open a bottom sheet.

Bottom sheet content:

- Title: `Medication details`
- Input:
  - open text field
  - placeholder: `Name, dosage`
- Buttons:
  - Save
  - Cancel
  - Clear Medication, only if medication is already tracked

Required behavior:

1. Ledger rows should no longer expand with an inline medication form.
2. Tapping Rx opens the bottom sheet.
3. Saving with text stores `medication: true` and `medicationNote` as trimmed text.
4. Saving blank stores `medication: true` and `medicationNote: null`.
5. Clear stores `medication: false` and `medicationNote: null`.
6. Cancel closes without saving.
7. Existing data model remains unchanged:
   - `medication`
   - `medicationNote`
8. Existing medication entries without notes still display as recorded.
9. Row display after saving remains compact.
10. Entry Details display remains correct.

## Part 5 - Shared quick action sheet pattern

Use a shared bottom sheet pattern if practical.

Preferred approach:

- A reusable component such as `EntryQuickActionSheet.vue`, `QuickActionSheet.vue`, or an equivalent local pattern.
- The same visual pattern should be used for both Tummy Time and Rx.
- Do not leave one action inline and the other as a sheet unless there is a clear technical blocker explained in the report.

Sheet requirements:

1. Mobile-first.
2. Large tap targets.
3. Clear title.
4. Clear Save and Cancel actions.
5. Clear dangerous/destructive action for Clear, visually secondary to Save.
6. Safe bottom padding.
7. Tap outside or X close behavior should be intentional and not cause data loss.
8. Keyboard should not hide Save on iPhone.
9. Works at 375px width.
10. Does not introduce a new dependency.

## Part 6 - Entry Details and row interaction polish

Keep Entry Details behavior stable.

Required behavior:

1. Entry Details still has Save Entry above Delete Entry.
2. X close still saves notes as it currently does.
3. Delete Entry remains separated and visually dangerous.
4. Medication-only entries should still feel natural.
5. Diaper-only entries should still feel natural.
6. Tummy-only entries should still feel natural.
7. Note-only entries should still feel natural.
8. Row spacing should not get worse.
9. Row tap targets should not shrink.
10. Notes tap behavior should still open details when notes are present.

## Part 7 - Scope guard

This phase is a trial of the bottom sheet interaction for Rx and Tummy Time. Keep the implementation easy to revise if the user wants to revert or refine later.

Do not make broader product changes.

## Out of scope

Do not implement:

- broad visual redesign
- new animal avatars
- image upload
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

- `src/entries/CareEntryRow.vue`
- `src/entries/EntryDetailSheet.vue`
- `src/components/*Sheet*.vue` if a shared sheet component is added
- `src/app/router.js` only if route/page shell requires it
- secondary page components that need header spacing fixes
- shared layout/page shell components if they exist
- shared CSS or variables if needed
- relevant tests
- `docs/reports/phase-9g-navigation-shell-and-quick-action-bottom-sheets.md`

Possible page files:

- `src/profile/ProfileView.vue` or equivalent My Profile component
- `src/settings/SettingsView.vue`
- `src/babies/BabySettingsView.vue`
- `src/charts/GraphView.vue`
- `src/help/HelpView.vue`
- caregiver/invite/import/recently deleted views if they use the cramped header

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
- Do not add dependencies unless there is a strong reason and it is documented.

## Validation checklist

Run:

- `npm test`
- `npm run build`
- `git status`
- `git diff --stat`
- `grep deleteDoc src/`

Confirm:

1. My Profile header/back arrow has comfortable top and left spacing.
2. Settings header/back arrow has comfortable spacing.
3. Baby Settings header/back arrow has comfortable spacing.
4. Trends header/back arrow has comfortable spacing.
5. Help & Legend header/back arrow has comfortable spacing.
6. Manage Caregivers header/back arrow has comfortable spacing.
7. Invite Member header/back arrow has comfortable spacing.
8. Import CSV header/back arrow has comfortable spacing.
9. Recently Deleted header/back arrow has comfortable spacing.
10. Back arrow tap target is at least 44px by 44px.
11. Header title remains centered.
12. Layout works with browser address bar at top.
13. Layout works with browser address bar at bottom.
14. Tummy Time star opens a bottom sheet.
15. Tummy Time no longer opens an inline row form.
16. Tummy Time Save works with duration.
17. Tummy Time Save works with blank or zero duration as session tracked.
18. Tummy Time Clear works.
19. Tummy Time Cancel does not save changes.
20. Rx opens a bottom sheet.
21. Rx no longer opens an inline row form.
22. Rx Save works with note.
23. Rx Save works blank as recorded.
24. Rx Clear works.
25. Rx Cancel does not save changes.
26. Bottom sheets respect safe-area bottom spacing.
27. Keyboard does not hide Save action on iPhone width.
28. Entry Details Save Entry still works.
29. X close still saves notes.
30. Notes tap still opens details when notes exist.
31. Medication-only entries still work.
32. Diaper-only entries still work.
33. Tummy-only entries still work.
34. No feeds path changed.
35. No Firestore rules/indexes changed.
36. No migration or bulk data mutation.
37. No deleteDoc.
38. No PWA/Capacitor/SW/manifest.

## Claude reporting requirements

After implementation, create:

`docs/reports/phase-9g-navigation-shell-and-quick-action-bottom-sheets.md`

The report must include:

- Summary
- Changed files
- Secondary header/page shell summary
- Safe area behavior summary
- Tummy Time bottom sheet summary
- Rx bottom sheet summary
- Entry Details behavior summary
- Permission/data model impact
- Tests result
- Build result
- Safety confirmations
- Known issues or follow-ups
- Commit hash
- Main synced with origin/main: yes/no
- Vercel redeploy expected: yes/no
