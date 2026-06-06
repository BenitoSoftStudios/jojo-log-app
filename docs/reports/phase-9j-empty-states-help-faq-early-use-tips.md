# Phase 9J - Empty states, Help FAQ, and early-use tips

## Summary

Added a polished empty ledger state, a dismissible early-use tip card (10 tips, localStorage only), and a practical "How do I log..." FAQ section in Help. Removed all em dash characters from HelpView.vue visible copy (16 removed). No new dependencies. No Firestore writes. No entry write behavior changed.

---

## Changed files

| File | Change |
|------|--------|
| `src/ui/EarlyUseTips.vue` | New component: 10 tips, one at a time, dismissible, localStorage state |
| `src/entries/CareLedgerView.vue` | Replaced simple empty state with richer empty-state card; added EarlyUseTips |
| `src/help/HelpView.vue` | Added 11-question FAQ section; removed 16 em dashes from visible copy |

---

## Empty ledger state summary

The simple `"No entries yet. Tap + Day..."` text was replaced with a structured empty-state card:

- Heading: "No entries yet"
- Sub: "Start with whatever you need to record."
- Examples list: Bottle only / Diaper only / Medication only / Tummy Time only / Note only
- Primary action button: "+ Add first entry" (triggers the same day-picker sheet as the header `+ Day` button)
- Help link: "Help and Legend" (routes to `/help`)

The card uses a dashed border and centered layout matching the existing empty-state visual language. It only appears when the active baby has no visible ledger entries. It does not appear when there is no active baby (that state is unchanged: "No active baby.").

---

## Early-use tips behavior summary

`src/ui/EarlyUseTips.vue` is a new component included in `CareLedgerView.vue` within the `<template v-else>` block (active baby exists), above the empty state and ledger.

Behavior:
- One tip shown at a time, in order
- Counter shows "Tip X of Y"
- "Got it" dismisses the current tip; next tip shows immediately
- "Hide tips" hides all tips permanently
- After all tips are dismissed, the component renders nothing
- Tip 10 (Export CSV) is `ownerOnly: true` and is filtered out for caregivers
- "Help" link in the tip card routes to `/help`

localStorage keys:
- `jojo_tips_dismissed`: JSON array of dismissed tip IDs
- `jojo_tips_hidden`: `'true'` string if user chose to hide all tips

localStorage failure is handled silently in all reads and writes — the ledger continues to function normally if localStorage is unavailable.

---

## Full list of ten tips

| ID | ownerOnly | Text |
|----|-----------|------|
| 1 | no | You can log a bottle-only entry by entering an amount and leaving diaper blank. |
| 2 | no | You can log a diaper-only entry by leaving amount blank and choosing a diaper result. |
| 3 | no | For a bottle with no diaper, enter the amount and tap - for no diaper change. |
| 4 | no | You can log medication-only by tapping Rx, then saving in the medication sheet. |
| 5 | no | You can log Tummy Time-only by tapping the star, then saving in the Tummy Time sheet. |
| 6 | no | You can add a note-only entry from Entry Details. |
| 7 | no | Tap a note indicator in the ledger to open Entry Details for that entry. |
| 8 | no | Save Entry is for peace of mind. Closing Entry Details also keeps your changes. |
| 9 | no | Trends describe what was logged. They are not feeding or medical guidance. |
| 10 | yes | Export CSV creates a backup of the active baby's log. Owner only. |

Caregivers see tips 1-9 (9 total). Owners see tips 1-10 (10 total).

---

## Help FAQ summary

A new section "How do I log..." was added to `HelpView.vue` between section 7 (Notes and Entry Details) and section 8 (Trends), renumbering sections 8-14 to 9-15.

11 questions covered:

1. How do I log a bottle only? — mL field + leave diaper blank (incomplete) or tap - (complete)
2. How do I log a diaper only? — blank mL + tap W/P/WP/-
3. How do I log a bottle with no diaper? — enter amount + tap -
4. How do I log medication only? — tap Rx + fill in details + tap Save
5. How do I log Tummy Time only? — tap star + save in TT sheet
6. How do I log a note only? — open Entry Details via ⋯ + type note + Save Entry
7. How do I add vitamin D? — tap sun icon; turns gold when on
8. How do I edit a note after saving? — tap ✎ notes or ⋯ + edit + Save Entry
9. How do I clear medication or Tummy Time? — tap Rx or star again + Clear button in sheet
10. Why does Since birth need a birthdate? — calculates from birthdate; set in Baby Settings
11. Why did Import CSV block my file? — wrong baby name, existing entries, or invalid file; owner-only

All answers were verified against current source (CareEntryRow.vue, EntryDetailSheet.vue, BabySettingsView.vue, LegacyImportView.vue).

---

## No em dash confirmation

16 em dash characters were removed from `HelpView.vue` visible copy. Replacements used: commas, colons, periods.

- Developer comments in `CareLedgerView.vue` retain 5 em dashes (not visible to users; task rule 5 does not require removing punctuation from comments).
- `EarlyUseTips.vue` and the new empty state contain 0 em dashes.

`grep` confirms 0 em dashes in `HelpView.vue`, 0 in `EarlyUseTips.vue`, 0 in new CareLedgerView.vue template content.

---

## Owner/caregiver behavior notes

- Tip 10 (Export CSV) has `ownerOnly: true`. It is shown only when the parent component passes `:is-owner="true"`. CareLedgerView passes `:is-owner="isOwner"` from `useFamily()`.
- Caregivers see 9 tips (tips 1-9), owners see 10 tips.
- All 9 caregiver-visible tips are about features available to caregivers (entry logging, notes, TT, Rx, Trends).
- Help FAQ mentions Import CSV as owner-only ("Import is owner-only."). Caregivers see this in Help.
- Help mentions "Some settings are owner-only." in the family/caregiver section. This is accurate and unchanged.
- Empty state "Add first entry" and "Help and Legend" are visible to all users who have an active baby with no entries.

---

## Tests result

**374 tests passing** (`npm test`). No new unit tests added — the new code is Vue UI with localStorage state and no pure-logic functions that require unit testing. Manual QA checklist is provided below.

---

## Build result

`npm run build` — clean (0 errors). Pre-existing chunk size advisory unchanged.

---

## Safety confirmations

- No feeds path changed ✓
- No entry write behavior changed ✓
- No import/export logic changed ✓
- No Firestore rules deployed ✓
- No Firestore indexes changed ✓
- No migration or bulk data mutation ✓
- `grep -r "deleteDoc" src/` — 0 matches ✓
- No PWA/Capacitor/SW/manifest ✓
- No image upload / Firebase Storage / external image URLs ✓
- No new dependencies ✓
- No modal onboarding added ✓
- No Firestore listeners added ✓
- No pop-up welcome screen ✓

---

## Manual QA checklist

1. Log in as owner with no entries for the active baby.
2. Confirm empty ledger state shows "No entries yet", examples list, "+ Add first entry" button, and "Help and Legend" link.
3. Tap "+ Add first entry" — confirm the day picker sheet opens (same as `+ Day`).
4. Tap "Help and Legend" — confirm navigation to Help page.
5. Confirm tip card appears above the empty state (if tips not yet dismissed).
6. Dismiss a tip with "Got it" — confirm next tip appears immediately.
7. Dismiss all 9 non-owner tips as caregiver — confirm card disappears after tip 9.
8. As owner, dismiss all 10 tips — confirm card disappears.
9. Tap "Hide tips" — confirm tip card disappears permanently (page reload should keep it gone).
10. Confirm localStorage keys `jojo_tips_dismissed` and `jojo_tips_hidden` are set correctly.
11. Log in as caregiver — confirm tip 10 (Export CSV) does not appear.
12. Add an entry — confirm empty state disappears and ledger shows normally.
13. Confirm tip card appears above the ledger (not blocking entries).
14. Navigate to Help and Legend.
15. Confirm new "How do I log..." section appears after "Notes and Entry Details".
16. Confirm FAQ answers partial-entry scenarios (bottle only, diaper only, medication only, Tummy Time only, note only).
17. Confirm FAQ says Import is owner-only.
18. Confirm FAQ explains why Since birth needs a birthdate.
19. Confirm no em dash characters appear in Help visible copy.
20. Confirm no em dash characters appear in tips or empty state.

---

## Known issues or follow-ups

- Tip state is per-browser/device (localStorage). A user who dismisses tips on one device will see them again on a new device or after clearing browser data. This is expected and matches the task's localStorage-only requirement.
- The empty state "Add first entry" button uses the same `handleOpenDayPicker` flow as `+ Day`. This is intentional — no new path was introduced.
- The "Help" link in the tip card is always visible. On very small screens it sits at the far right of the action row. This is acceptable.
- If a future phase adds per-user tip state to Firestore, the localStorage keys (`jojo_tips_dismissed`, `jojo_tips_hidden`) are the natural migration source.

---

## Commit hash

See `git log` after push.

## Main synced with origin/main

Yes — merged origin/main before implementation (fast-forward, task file only).

## Vercel redeploy expected

Yes — 3 source files changed.
