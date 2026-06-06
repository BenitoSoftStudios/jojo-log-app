# Phase 9L - Main ledger command panel and incomplete-state polish

## Summary

Replaced the four equal SummaryChips stat cards with a cohesive Today command panel as the primary surface of the main ledger. Added quick action pill buttons (Bottle, Diaper, Rx, Tummy) that create valid entries without requiring parents to remember hidden completion rules. Softened incomplete state from red error outlines to amber/sand draft styling across the entire ledger. Increased diaper button and sym button tap targets for one-thumb use. Demoted the member greeting to compact faint text inside the Today panel. No care model changes. No new tracking fields.

---

## Changed files

| File | Change |
|------|--------|
| `src/entries/CareLedgerView.vue` | Replace SummaryChips with Today panel; add quick action state, logic, and sheet; add QA pill CSS; move member greeting into panel |
| `src/entries/CareDay.vue` | Incomplete label color → `--color-incomplete` (amber); text → "X need finishing"; uses `incompleteCount` from day node |
| `src/entries/CareEntryRow.vue` | Null-field outline/background → amber; diaper buttons 28px → 36px height, WP 32px → 40px wide; sym buttons 28px → 36px height |
| `src/styles/main.css` | `.incomplete-dot` background → `var(--color-incomplete)` |
| `src/utils/ledgerGrouper.js` | Add `incompleteCount` to day node alongside `hasIncomplete` |

---

## Today command panel summary

The Today panel replaces `<SummaryChips>` and is rendered as a card above the ledger hierarchy. Contents (top to bottom):

1. **Top row** — "Today" title, incomplete chip ("2 need finishing" in amber), demoted member/role label
2. **Stats row** — today mL total + feed count (e.g. "260 mL today · 3 feeds")
3. **Last logged line** — time, mL, and diaper of the most recent non-deleted entry (e.g. "Last logged 06:30, 110 mL, W"), hidden if no entries
4. **Quick action pill row** — Bottle, Diaper, Rx, Tummy pill buttons
5. **Secondary stats row** — 7-day and month mL totals in compact faint text, separated from the primary surface by a soft border

The member greeting was removed from its own line and compacted into the panel top row as faint `xs` text. It takes no additional vertical space.

Early-use tips remain below the Today panel. Tips still show only when there are entries.

---

## Quick action summary

All four actions create entries using the same logic as manual entry creation. Fields not specific to the action are set to their blank defaults (`vitaminD: false`, `medication: false`, etc.).

| Action | amountMl | diaper | Other fields |
|--------|----------|--------|--------------|
| Bottle | user input (required, integer >= 0) | `-` | — |
| Diaper | `0` | W / P / WP (user chooses) | — |
| Rx | `0` | `-` | `medication: true`, `medicationNote: user input (optional)` |
| Tummy | `0` | `-` | `tummyTime: true`, `tummyTimeCount: 1`, `tummyTimeDurationSeconds: user input (optional)` |

Each action opens an `AppSheet` with the `qaSheetTitle` computed from the action type. After success, `openDay(todayDate)` is called so the new entry is immediately visible in the open day.

Bottle does not invent an amount — the user must enter one or the action shows an inline validation message. Diaper requires a type selection before the save button activates. Rx and Tummy note/duration fields are optional.

Note and Vitamin D quick actions were not implemented. The task marked these as "if it fits cleanly" and "if it fits cleanly and does not overcrowd the panel." The four pills already fill the row comfortably on iPhone width. Note and Vitamin D are deferred as a follow-up if needed.

---

## Incomplete-state summary

All incomplete state now uses `--color-incomplete` (amber, `#e8a020`) instead of `--color-error` (red):

| Location | Before | After |
|----------|--------|-------|
| `.incomplete-dot` in main.css | `var(--color-error)` | `var(--color-incomplete)` |
| `entry-row__ml--null` border | `var(--color-error)` | `var(--color-incomplete)` |
| `entry-row__ml--null` background | `rgba(201,64,64,0.05)` | `rgba(232,160,32,0.06)` |
| `entry-row__diaper-group--null` outline | `var(--color-error)` | `var(--color-incomplete)` |
| `.care-day__incomplete-label` color | `var(--color-error)` | `var(--color-incomplete)` |
| Day header incomplete text | "⚠ incomplete" | "X need finishing" (dynamic count) |
| Today panel incomplete chip | — | amber pill "X need finishing" |

Red (`var(--color-error)`) is still used for: write error banner, sync error dot/label, sign-out button in menu, save-error flash, and add-baby error — all destructive or true-error states.

`ledgerGrouper.js` now tracks `incompleteCount` on each day node alongside the existing `hasIncomplete` boolean. The day's label uses this count for the aria-label and the human-readable text.

---

## Row control / tap target summary

| Control | Before | After |
|---------|--------|-------|
| Diaper buttons (W, P, -) height | 28px | 36px |
| Diaper button W, P, - min-width | 26px | 32px |
| Diaper button WP min-width | 32px | 40px |
| Diaper button padding | 2px 4px | 4px 6px |
| Sym buttons (sun, Rx, star) height | 28px | 36px |
| Sym buttons min-width | 32px | 36px |
| Details button (⋯) | already 44x44px | unchanged |

Row density is maintained. Lines 1 and 2 together are ~84px per entry, which is comfortable without being oversized.

---

## Accessibility summary

- All quick action pill buttons have explicit `aria-label` attributes ("Quick log bottle", etc.)
- Incomplete chip has `aria-label` with count ("2 entries need finishing")
- Diaper quick action picker uses `role="group"` with `aria-label="Diaper type"` and each button has `aria-pressed` and `aria-label` ("Wet diaper", "Poop diaper", "Wet and poop diaper")
- Quick action sheet error messages use `role="alert"` for screen-reader announcements
- CareDay incomplete label uses dynamic `aria-label` with count
- CareEntryRow diaper group keeps its existing `role="group"` and per-button `aria-label`
- Selected states for quick action diaper picker use both color and a distinct border (not color-only)
- Incomplete states use color + left-rail or outline indicator (not color-only)
- Focus styles are inherited from browser defaults (no focus-visible suppression)
- No transitions added in this phase; `prefers-reduced-motion` not newly relevant

---

## Tests result

**374 tests passing** (`npm test --run`). No new unit tests added — all changed code is Vue UI with in-memory state. The `ledgerGrouper.test.js` suite (22 tests) passed without changes, confirming the `incompleteCount` addition is backward-compatible.

---

## Build result

`npm run build` — clean (0 errors). Pre-existing chunk size advisory unchanged.

---

## Safety confirmations

- No feeds path changed
- No entry write behavior changed outside quick action preset paths
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
- No modal onboarding added
- No em dash characters in new visible copy

---

## Manual QA checklist

1. Open ledger as owner. Today panel appears as the primary surface above the ledger.
2. Today panel shows today mL, feed count, last logged entry line.
3. If entries need finishing, amber "X need finishing" chip appears in the panel top row.
4. Tips appear below the Today panel, not above it.
5. Tap Bottle pill. Sheet opens with amount input. Enter mL, tap Add entry. Entry appears in today's open day with diaper `-` and correct mL.
6. Tap Diaper pill. Sheet shows W/P/WP. Select one. Entry appears with 0 mL and chosen diaper.
7. Tap Rx pill. Sheet shows optional med note. Tap Add entry. Entry appears with 0 mL, diaper `-`, medication on.
8. Tap Tummy pill. Sheet shows min/sec inputs. Tap Add entry. Entry appears with 0 mL, diaper `-`, tummy time on.
9. Create an incomplete entry (leave amount blank). Day header shows "1 needs finishing" in amber. Entry row shows amber outline on the blank field, not red.
10. Amount field null indicator is amber border, not red.
11. Diaper group null indicator is amber outline, not red.
12. Tap W, P, WP, and `-` with one thumb. Targets are comfortable.
13. Open as caregiver. Today panel and quick actions visible. Caregiver can use quick actions.
14. Caregiver cannot access owner-only menu items (Import CSV, Invite).
15. Existing entries unchanged. No data regression.

---

## Known issues or follow-ups

- Note and Vitamin D quick actions not implemented. The four pills fill the action row well on iPhone width. If needed in a future phase, they could be added as a second row or a "More" overflow pill.
- The feature branch `claude/jojo-vue-planning-GB6T8` has diverged from main (same state as prior phases). All work is on `origin/main`. Force-pushing to the feature branch requires user authorization due to destructive history rewrite risk.
- Bottle quick action creates a complete entry if mL >= 0 is entered. The entry will not be marked incomplete as long as the user provides a number. If the user closes the sheet without saving, no entry is created.

---

## Commit hash

`0692eea`

## Main synced with origin/main

Yes — pushed to `origin/main`.

## Vercel redeploy expected

Yes — 5 source files changed.
