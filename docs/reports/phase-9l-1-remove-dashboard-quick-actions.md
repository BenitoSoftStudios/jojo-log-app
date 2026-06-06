# Phase 9L-1 - Remove dashboard quick actions and preserve Today panel

## Summary

Removed the Bottle, Diaper, Rx, and Tummy quick action pills from the Today command panel, along with the associated bottom sheet, all quick action state, helper functions, and CSS. The Today panel itself, amber incomplete styling, "X need finishing" labels, last logged line, and secondary stats row remain. No care model, data, or entry creation behavior was changed.

---

## Changed files

| File | Change |
|------|--------|
| `src/entries/CareLedgerView.vue` | Removed pill row from template; removed quick action sheet; removed 11 refs, 2 functions, 1 computed, and 1 constant from script; removed `.today-panel__actions`, `.qa-pill`, and the full quick action sheet CSS block |

---

## What was preserved from 9L

All non-quick-action work from Phase 9L is intact:

1. Today command panel (title, totals, last logged, secondary stats)
2. Amber "X need finishing" chip in the Today panel top row
3. Amber incomplete styling on null mL field, null diaper group, and day header label
4. "X need finishing" dynamic text on day headers
5. `incompleteCount` in the ledgerGrouper day node
6. `todayIncompleteCount` computed in CareLedgerView
7. `lastEntry` and `lastEntryLine` computeds in CareLedgerView
8. Larger W/P/WP/`-` diaper button tap targets (36px height, WP 40px wide)
9. Larger sun/Rx/star sym button tap targets (36px height)
10. Demoted member/role label inside the Today panel top row
11. Secondary 7-day and month stats row inside the Today panel
12. Amber `.incomplete-dot` in main.css
13. Accessibility improvements from 9L (aria-labels on Today panel elements, aria-label on day incomplete label)

---

## What was removed or hidden

All quick action code was fully removed (not hidden or commented). Removal was safe because the code was entirely self-contained in CareLedgerView.vue with no external callers.

**From template:**
- `<div class="today-panel__actions">` — pill row with Bottle, Diaper, Rx, Tummy buttons
- `<AppSheet v-model="qaSheetOpen">` — full quick action sheet with all four action variants (Bottle amount input, Diaper W/P/WP picker, Rx note input, Tummy Time min/sec input)

**From script:**
- `QA_DIAPER_OPTS` constant
- `qaSheetOpen`, `qaType`, `qaDiaper`, `qaBottleAmount`, `qaRxNote`, `qaMinutes`, `qaSeconds`, `qaCreating`, `qaError`, `qaBottleInputRef`, `qaRxInputRef` refs (11 refs)
- `qaSheetTitle` computed
- `openQuickAction(type)` function
- `doQuickAction()` async function
- `nextTick` (no longer imported — was only used by openQuickAction)
- `createEntry` from `useEntries()` destructuring (only used in doQuickAction)
- `openDay` from `useLedger()` destructuring (only used in doQuickAction)

**From styles:**
- `.today-panel__actions` and `.qa-pill` styles
- The full quick action sheet CSS section: `.qa-body`, `.qa-hint`, `.qa-subhint`, `.qa-error`, `.qa-amount-row`, `.qa-amount-input`, `.qa-amount-unit`, `.qa-diaper-row`, `.qa-diaper-btn`, `.qa-diaper-btn--selected`, `.qa-input`, `.tt-row`, `.tt-duration-input`, `.tt-duration-unit`, `.qa-btns`, `.qa-btn` and all modifiers

---

## Code cleanup summary

The cleanup was a straight deletion with no leftover dead code. No comments were needed because the code no longer exists. The `isIncomplete` import remains because it is still used by `todayIncompleteCount`. The `getCurrentHHMMInTimezone` import remains because it is used by `selectAddDay` in the day picker flow. The `buildStartNextDayEntry` import remains because it is used by `nextDayDate`.

Net change: 3 insertions, 402 deletions in one file.

---

## Future Add Entry preset note

Quick actions may return inside the `+ Add Entry` flow as entry presets, not as dashboard buttons. The correct future mental model:

```
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

This keeps the app centered on one entry as one care moment cluster. A bottle and a diaper that happen together belong in one row, not two separate quick-action entries. This future preset flow is not implemented in 9L-1.

---

## Tests result

**374 tests passing** (`npm test --run`). No test changes needed.

---

## Build result

`npm run build` — clean (0 errors). CSS bundle dropped from 63.73 kB to 59.14 kB gzip-equivalent. Pre-existing chunk size advisory unchanged.

---

## Safety confirmations

- No feeds path changed
- No entry write behavior changed
- No import/export logic changed
- No Firestore rules deployed
- No Firestore indexes changed
- No migration or bulk data mutation
- `grep -rn "deleteDoc" src/` — 0 matches
- No PWA/Capacitor/SW/manifest changes
- No image upload / Firebase Storage changes
- No new dependencies
- No new Firestore listeners
- No Trends calculations changed
- No em dash characters in new or remaining visible copy

---

## Manual QA checklist

1. Open ledger as owner. Today panel shows title, totals, last logged line, and secondary stats. No Bottle/Diaper/Rx/Tummy pills visible.
2. Today panel feels balanced without pills. Secondary stats provide context without requiring the removed pills.
3. Tips appear below the Today panel.
4. Tap "+ Day" in the header. Day picker sheet opens and works normally.
5. Open a day and use "+ Add Entry". New row added and editable normally.
6. Tap W, P, WP, `-` in an entry row. Tap targets are comfortable (kept from 9L).
7. Tap sun, Rx, star buttons in an entry row. Tap targets comfortable (kept from 9L).
8. Create an incomplete entry (blank amount). Amber outline appears on the field. Day header shows "1 needs finishing" in amber.
9. Open as caregiver. Ledger loads, Today panel shows, entry editing works.
10. Confirm no quick action sheet is reachable from anywhere on the Today panel.

---

## Known issues or follow-ups

- The Today panel now ends with the secondary stats row after the last logged line. If no last logged line is present, the panel goes directly from stats to secondary stats. This is clean and compact.
- The future Add Entry preset flow (see Future Direction note above) is the natural next step when entry presets are ready for implementation.

---

## Commit hash

`6bf165e`

## Main synced with origin/main

Yes — pushed to `origin/main`.

## Vercel redeploy expected

Yes — 1 source file changed.
