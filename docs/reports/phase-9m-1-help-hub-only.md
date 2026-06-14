# Phase 9M-1 - Help hub only

## Summary

Added a task-first "What do you want to log?" quick jump hub to the Help page. The hub contains six chips that anchor-scroll to the matching FAQ answers. No menu, ledger, router, or Firestore files were changed. This is the safe isolated retry of the Help portion of Phase 9M.

---

## Changed files

| File | Change |
|------|--------|
| `src/help/HelpView.vue` | Added hub card, id anchors on 6 FAQ rows, hub CSS, scroll-margin-top |

---

## Help hub summary

A new card was inserted as card 2 (after the intro card, before Reading the ledger):

```
What do you want to log?

[ Bottle only ]  [ Diaper only ]  [ Medication ]
[ Tummy Time ]   [ Note only ]    [ Vitamin D  ]
```

Six `<a href="#id">` chips in a wrapping flex row. Each chip links to the matching FAQ row in the "How do I log..." section lower on the page. No routing was added or changed.

---

## Anchor/jump behavior summary

| Chip | Target id |
|------|-----------|
| Bottle only | `#faq-bottle` |
| Diaper only | `#faq-diaper` |
| Medication  | `#faq-rx` |
| Tummy Time  | `#faq-tummy` |
| Note only   | `#faq-note` |
| Vitamin D   | `#faq-vitd` |

Each of the 6 target `<div class="faq-row">` elements received a matching `id` attribute. `scroll-margin-top: calc(var(--header-height) + var(--space-4))` was added via `.faq-row[id]` so the sticky 68px header does not cover the jump target.

---

## Help accuracy confirmation

All existing FAQ answers, 0 mL explanation, dash explanation, and blank/incomplete explanation remain unchanged and accurate:

- "Use 0 mL when there was no feed. Use - when there was no diaper event. Blank means not recorded yet, so the entry stays incomplete." -- preserved verbatim in the FAQ intro.
- All individual FAQ answers are unchanged.
- No medical guidance was added.
- No em dash characters in new visible copy.

---

## Scope confirmation

`src/entries/CareLedgerView.vue` was not changed. Confirmed with `git diff --stat`: only `src/help/HelpView.vue` appears in the diff.

---

## Tests result

**374 tests passing** (`npm test --run`). No test changes needed.

---

## Build result

`npm run build` -- clean (0 errors). CSS bundle 59.82 kB gzip. Pre-existing chunk size advisory unchanged.

---

## Safety confirmations

- Only `src/help/HelpView.vue` changed
- No entry write behavior changed
- No Trends calculations changed
- No feed-count logic changed
- No CSV import/export logic changed
- No Firestore rules deployed
- No Firestore indexes changed
- No migration or bulk data mutation
- `grep -rn "deleteDoc" src/` -- 0 matches
- No PWA/Capacitor/SW/manifest changes
- No image upload / Firebase Storage changes
- No new dependencies
- No new Firestore listeners
- No menu files changed
- No router changes
- No em dash characters in new visible copy

---

## Watcher patch note

No `scripts/` directory exists in this repository. The watcher patch described in the task context is a local-only concern and no file was created or modified for it.

---

## Manual QA checklist

1. Open Help. Hub card "What do you want to log?" appears near the top, after the intro card.
2. Tap Bottle only -- page scrolls to "How do I log a bottle only?" FAQ row. Not hidden under header.
3. Tap Diaper only -- page scrolls to "How do I log a diaper only?" FAQ row.
4. Tap Medication -- page scrolls to "How do I log medication only?" FAQ row.
5. Tap Tummy Time -- page scrolls to "How do I log Tummy Time only?" FAQ row.
6. Tap Note only -- page scrolls to "How do I log a note only?" FAQ row.
7. Tap Vitamin D -- page scrolls to "How do I add vitamin D?" FAQ row.
8. Help remains readable. Chips wrap cleanly on iPhone width.
9. 0 mL, -, and blank/incomplete explanation remains in the FAQ intro above the answers.
10. Return to the main ledger and confirm it is not blank.

---

## Known issues or follow-ups

- The HTML comment numbering in HelpView.vue has a minor stale label (two comments both labeled "9.") from the insert. This is a cosmetic code comment issue only -- no visible content is affected.

---

## Commit hash

TBD -- set after commit.

## Main synced with origin/main

Yes -- will be pushed to `origin/main` after commit.

## Vercel redeploy expected

Yes -- 1 source file changed.
