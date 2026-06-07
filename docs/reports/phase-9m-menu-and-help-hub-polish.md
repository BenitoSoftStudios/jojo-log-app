# Phase 9M - Menu and Help hub polish

## Summary

Converted the hamburger menu from a flat utility list into four grouped navigation sections with 46px touch targets, section labels, and owner-only item hiding. Added a task-first quick jump hub to the Help page with six anchor chips that scroll to the matching FAQ rows, offset correctly for the sticky header.

---

## Changed files

| File | Change |
|------|--------|
| `src/entries/CareLedgerView.vue` | Menu template and CSS replaced with grouped section layout |
| `src/help/HelpView.vue` | Added quick jump hub card, id anchors on FAQ rows, hub CSS |

---

## Menu grouping summary

Four groups with section labels, each rendered as a card-style block with `border-radius`, `border`, and `border-top` dividers between rows.

```
Track
  Trends                   → /graphs
  Recently Deleted         → /recently-deleted
  Help and Legend          → /help

Family
  Baby Settings            → /baby-settings
  Manage Caregivers        → /manage-caregivers
  Invite a Caregiver       → /invite           (owner only, v-if)
  Add Baby                 → openAddBaby()      (owner only, v-if)

Backup                     (entire section owner only, v-if)
  Export CSV               → handleExportCsv()
  Import CSV               → /admin/legacy-import

Account
  Settings                 → /settings
  My Profile               → /profile
  Entry order              → toggleSortOrder()
  Sign out                 → handleSignOut()   (red destructive color)
```

All routes and JavaScript functions are unchanged. Only the template structure and CSS were modified.

---

## Owner/caregiver behavior summary

| Item | Owner | Caregiver |
|------|-------|-----------|
| Trends | visible | visible |
| Recently Deleted | visible | visible |
| Help and Legend | visible | visible |
| Baby Settings | visible | visible |
| Manage Caregivers | visible | visible |
| Invite a Caregiver | visible | hidden (v-if isOwner) |
| Add Baby | visible | hidden (v-if isOwner) |
| Backup section | visible | hidden (v-if isOwner) |
| Export CSV | visible | hidden (inside owner section) |
| Import CSV | visible | hidden (inside owner section) |
| Settings | visible | visible |
| My Profile | visible | visible |
| Entry order | visible | visible |
| Sign out | visible | visible |

Caregiver menu includes Track, Family (minus owner items), and Account. It remains useful and complete. No owner-only items appear for caregivers. No "disabled dead rows" were used -- all hiding is via `v-if`.

---

## Help hub summary

Added a new "What do you want to log?" card as the second card in Help (between the intro card and "Reading the ledger"). It contains six anchor chips in a wrapping flex row:

| Chip label | Target anchor |
|------------|---------------|
| Bottle only | `#faq-bottle` |
| Diaper only | `#faq-diaper` |
| Medication | `#faq-rx` |
| Tummy Time | `#faq-tummy` |
| Note only | `#faq-note` |
| Vitamin D | `#faq-vitd` |

Each chip is an `<a href="#id">` anchor link. The six target FAQ rows received matching `id` attributes. No routing was changed.

---

## Help scannability summary

- The quick jump hub appears at the top of Help for immediate discoverability.
- The existing FAQ section ("How do I log...") is unchanged and follows naturally after the legend and intro cards.
- Each FAQ row retains its short answer format from 9J-1 and 9K.
- The icon legend card sits after the intro and hub cards, before the FAQ section -- it does not compete with the hub because the hub is above it.
- No content was removed or shortened. No new heavy sections were added.
- The `0 mL`, `-`, and blank/incomplete explanation remains in the "Reading the ledger" section.

---

## Accessibility summary

- Menu groups use `<p class="menu-group-label">` visible text labels.
- The `<nav>` wrapper has `aria-label="Main navigation"`.
- Each menu row is a `<router-link>` or `<button>` with clear visible label text.
- Hub chips list has `role="list"` and `aria-label="Jump to logging instructions"`.
- Each hub chip has `role="listitem"`.
- Sign out uses `color: var(--color-error)` plus its label text -- not color alone.
- Focus styles are inherited from the existing app focus ring.
- `scroll-margin-top: calc(var(--header-height) + var(--space-4))` applied to `[id]` FAQ rows ensures anchors do not land under the 68px sticky header.
- No reduced-motion behavior was added or removed.

---

## Tests result

**374 tests passing** (`npm test --run`). No test changes needed.

---

## Build result

`npm run build` -- clean (0 errors). Pre-existing chunk size advisory unchanged.

---

## Safety confirmations

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
- No em dash characters in new visible copy

---

## Manual QA checklist

1. Open menu as owner -- four grouped sections (Track, Family, Backup, Account) render cleanly with section labels and card-style group blocks.
2. Tap Trends -- routes to /graphs and menu closes.
3. Tap Recently Deleted -- routes to /recently-deleted and menu closes.
4. Tap Help and Legend -- routes to /help and menu closes.
5. Tap Baby Settings -- routes to /baby-settings and menu closes.
6. Tap Manage Caregivers -- routes to /manage-caregivers and menu closes.
7. Tap Invite a Caregiver -- routes to /invite and menu closes (owner only).
8. Tap Export CSV -- triggers export (owner only section).
9. Tap Import CSV -- routes to /admin/legacy-import (owner only section).
10. Tap Settings -- routes to /settings and menu closes.
11. Tap My Profile -- routes to /profile and menu closes.
12. Tap Entry order -- toggles sort order and value label updates.
13. Tap Sign out -- signs out. Sign out row appears in red.
14. Open menu as caregiver -- Track, Family (no Invite/Add Baby), Account visible. No Backup section. Menu feels complete and useful.
15. Open Help -- quick jump hub card appears near the top with six chips.
16. Tap each chip -- page scrolls to the matching FAQ row, not hidden under the sticky header.
17. Help remains readable. FAQ answers, icon legend, and disclaimer copy unchanged.
18. No admin, legacy, migration, Firebase, or developer language visible in menu or Help.

---

## Known issues or follow-ups

- The Import CSV route (`/admin/legacy-import`) still contains the word "admin" and "legacy" in the URL path, which is an existing condition not introduced in this phase. The visible label shown to the user is "Import CSV" (no developer language).
- The feature branch `claude/jojo-vue-planning-GB6T8` diverged from main prior to this session. All work is on `origin/main`. The feature branch was not updated because force-push was not authorized.

---

## Commit hash

`16d94c1`

## Main synced with origin/main

Yes -- pushed to `origin/main`.

## Vercel redeploy expected

Yes -- 2 source files changed.
