# Phase 9J-1 - Partial-entry copy and empty-state polish

## Summary

Fixed incorrect instructional copy introduced in Phase 9J. The Phase 9J tips and Help FAQ implied that leaving amount or diaper blank is an acceptable way to log complete partial entries. This was wrong. The correct mental model:

- `0 mL` = explicitly recorded no feed (complete)
- `-` = explicitly recorded no diaper event (complete)
- Blank amount or blank diaper = not recorded yet = entry is incomplete

All three affected files were updated to teach this correctly. The empty ledger state was also polished: tips are now hidden while the active baby has no entries, example items are rendered as chips, and the Help and Legend link is now a secondary button.

---

## Changed files

| File | Change |
|------|--------|
| `src/ui/EarlyUseTips.vue` | Replaced all 10 tips with accurate, non-duplicative copy |
| `src/help/HelpView.vue` | Updated reading-ledger line; replaced FAQ section with correct 0 mL / - / blank instructions |
| `src/entries/CareLedgerView.vue` | Tips hidden when no entries; chips layout for examples; Help link styled as secondary button |

---

## Corrected tip list

| ID | ownerOnly | Text |
|----|-----------|------|
| 1 | no | Bottle only: enter the amount, then tap - for no diaper event. |
| 2 | no | Diaper only: enter 0 mL, then choose W, P, or WP. |
| 3 | no | Medication only: enter 0 mL, tap - for no diaper event, then tap Rx. |
| 4 | no | Tummy Time only: enter 0 mL, tap - for no diaper event, then tap the star. |
| 5 | no | Note only: enter 0 mL, tap - for no diaper event, then add your note in Entry Details. |
| 6 | no | Vitamin D only: enter 0 mL, tap - for no diaper event, then tap the sun icon. |
| 7 | no | Blank means unfinished: blank amount or blank diaper means the entry is incomplete. |
| 8 | no | Tap a note indicator to open Entry Details. |
| 9 | no | Trends describe what was logged. They are not feeding or medical guidance. |
| 10 | yes | Owners can export CSV to back up the active baby's log. |

Caregivers see tips 1-9 (9 total). Owners see tips 1-10 (10 total). No em dashes. No duplicates.

---

## Help FAQ correction summary

A clarification note was added at the top of the "How do I log..." FAQ:

> Use 0 mL when there was no feed. Use - when there was no diaper event. Blank means not recorded yet, so the entry stays incomplete.

Then each FAQ answer was corrected:

| Question | Old (wrong) | New (correct) |
|----------|------------|---------------|
| Bottle only | Enter amount and leave diaper blank | Enter the amount, then tap - for no diaper event. |
| Diaper only | Leave mL blank and choose W/P/WP | Enter 0 mL, then choose W, P, or WP. |
| Bottle with no diaper | (duplicate of bottle-only) | Removed — overlapped with bottle-only answer |
| Medication only | Tap Rx (missing 0 mL and -) | Enter 0 mL, tap - for no diaper event, tap Rx, add details if useful, then save. |
| Tummy Time only | Tap star (missing 0 mL and -) | Enter 0 mL, tap - for no diaper event, tap the star, add duration if useful, then save. |
| Note only | Open Entry Details (missing 0 mL and -) | Enter 0 mL, tap - for no diaper event, open Entry Details with the button, add the note, and tap Save Entry. |
| Vitamin D only | Tap sun icon (missing 0 mL and -) | Enter 0 mL, tap - for no diaper event, then tap the sun icon. It turns gold when on. |
| Edit note, clear, since birth, import | Unchanged (still accurate) | No change |

The reading-ledger section in Help was also updated:

Old: "Some entries have no feed or no diaper. That is normal for medication-only or Tummy Time entries."
New: "Care-only entries like medication or Tummy Time use 0 mL and - to stay complete. Blank amount or blank diaper means the entry is still incomplete."

---

## Empty state hierarchy summary

**Tips visibility:** `<EarlyUseTips>` now has `v-if="displayGrouped.months.length > 0"`. Tips are hidden while the active baby has zero visible ledger entries. Tips appear once there is at least one entry. The empty ledger state leads; tips support ongoing use.

**Examples chips:** The `<ul class="empty-state__examples">` list was replaced with:

```html
<div class="empty-state__chips">
  <span class="empty-state__chip">Bottle only</span>
  <span class="empty-state__chip">Diaper only</span>
  <span class="empty-state__chip">Medication only</span>
  <span class="empty-state__chip">Tummy Time only</span>
  <span class="empty-state__chip">Vitamin D only</span>
  <span class="empty-state__chip">Note only</span>
</div>
```

"Vitamin D only" was added. The chips use flex-wrap with pill borders for compact, scannable layout.

**Help link:** The `router-link` Help and Legend link is now styled as a secondary button with a mint border, matching the visual weight of the `+ Add first entry` primary button. It is clearly visible and tappable (min-height 36px).

---

## No em dash confirmation

- `EarlyUseTips.vue`: 0 em dashes in tip copy.
- `HelpView.vue`: 0 em dashes in visible copy (confirmed from Phase 9J; no new em dashes introduced).
- `CareLedgerView.vue` template (empty state, chip labels): 0 em dashes.

---

## Tests result

**374 tests passing** (`npm test --run`). No new unit tests added. The changed code is Vue UI with localStorage state; no new pure-logic functions require unit testing.

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
- No new Firestore listeners ✓

---

## Manual QA checklist

1. Log in as owner with a brand-new baby (no entries).
2. Confirm empty ledger state shows "No entries yet", chips row (Bottle only, Diaper only, Medication only, Tummy Time only, Vitamin D only, Note only), "+ Add first entry" button, and "Help and Legend" secondary button.
3. Confirm tip card does NOT appear while there are no entries.
4. Tap "+ Add first entry" and confirm the day picker sheet opens.
5. Tap "Help and Legend" and confirm navigation to Help page.
6. Create the first entry. Confirm the empty state disappears and the ledger appears.
7. Confirm the tip card now appears above the ledger after the first entry exists.
8. Dismiss tips with "Got it". Confirm each subsequent tip shows.
9. Tap "Hide tips". Confirm tip card disappears permanently.
10. Log in as caregiver. Confirm tip 10 (Export CSV) does not appear.
11. Navigate to Help. Confirm "How do I log..." FAQ section appears.
12. Confirm clarification note appears: "Use 0 mL when there was no feed. Use - when there was no diaper event. Blank means not recorded yet, so the entry stays incomplete."
13. Confirm bottle-only answer says: "Enter the amount, then tap - for no diaper event."
14. Confirm diaper-only answer says: "Enter 0 mL, then choose W, P, or WP."
15. Confirm "How do I log a bottle with no diaper?" question is removed.
16. Confirm medication-only answer includes "0 mL" and "-".
17. Confirm Tummy Time-only answer includes "0 mL" and "-".
18. Confirm note-only answer includes "0 mL" and "-".
19. Confirm vitamin D-only answer includes "0 mL" and "-".
20. Confirm reading-ledger section says "Care-only entries like medication or Tummy Time use 0 mL and - to stay complete."
21. Confirm no em dash characters appear in any visible Help copy.
22. Confirm no em dash characters appear in tips.

---

## Known issues or follow-ups

- Tip state is per-browser/device (localStorage). A user who dismisses tips on one device will see them again on a new device or after clearing browser data. This is expected and matches the task's localStorage-only requirement.
- Tips are hidden until the first entry exists. A new user who dismisses the app before creating any entries will see tips again on the next visit, which is correct behavior.
- If a future phase adds per-user tip state to Firestore, the localStorage keys (`jojo_tips_dismissed`, `jojo_tips_hidden`) are the natural migration source.

---

## Commit hash

See `git log` after push.

## Main synced with origin/main

Confirmed — branch is at origin/main as merged before Phase 9J-1 implementation began.

## Vercel redeploy expected

Yes — 3 source files changed.
