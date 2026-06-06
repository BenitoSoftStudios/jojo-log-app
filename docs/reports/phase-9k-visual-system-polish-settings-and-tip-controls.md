# Phase 9K - Visual system polish, Settings cleanup, and tip controls

## Summary

Refactored Settings into a structured control panel with 7 organized sections, added localStorage tip controls (Show tips toggle + Reset tips), refined the tip card (mint primary action, shadow, fade transition), improved the Help FAQ intro note visibility, made the "Baby Settings" link in the Trends empty state tappable, and added a `View only` badge to the Baby profile row for caregivers. No new care tracking features. No data behavior changed.

---

## Changed files

| File | Change |
|------|--------|
| `src/settings/SettingsView.vue` | Full restructure into 7 organized sections; new tip controls; nav-style rows with chevrons |
| `src/ui/EarlyUseTips.vue` | Mint "Got it" button, font-size fix, box-shadow, fade-out transition |
| `src/help/HelpView.vue` | Added `.faq-intro` CSS with mint-soft background to make the clarification note stand out |
| `src/charts/GraphView.vue` | "Baby Settings" in "Since birth" empty state is now a tappable router-link |

---

## Settings cleanup summary

Settings was restructured from 2 cards (Timezone, Display unit) into a proper 7-section control panel.

### Structure

| Section | Visible to | Contents |
|---------|-----------|----------|
| Your profile | All | Link to /profile |
| Baby profile | All | Link to /baby-settings; "View only" chip for caregivers |
| Family and caregivers | All | Link to /manage-caregivers; Invite link (owner only) |
| Time and display | All (owners can edit) | Timezone select + Display unit placeholder |
| Tips | All | Show tips toggle + Reset tips + device note |
| Backup and import | Owners only | Link to /admin/legacy-import; note about Export CSV in menu |
| Help | All | Link to /help |

### Design pattern

Navigation-style sections (profile, baby, family, backup, help) use `AppCard` with `:padded="false"` and internal rows that have:
- Full-width touchable rows (min-height 46px)
- Chevron `›` on the right for clarity
- Border-top separators between rows
- Active state background tint

Inline-control sections (timezone, tips) use standard padded `AppCard` with section headings.

### Caregiver view

Caregivers see: Your profile, Baby profile (View only badge), Family and caregivers (manage-caregivers only), Time and display (read-only timezone), Tips, Help.

They do not see the Backup and import section (`v-if="isOwner"`).

---

## Tip controls summary

A new Tips card was added to Settings with:

1. **Show tips toggle** — iOS-style pill toggle switch. ON (mint) = tips visible; OFF (grey) = hidden.
   - Toggle ON: removes `jojo_tips_hidden` from localStorage
   - Toggle OFF: sets `jojo_tips_hidden = 'true'`
2. **Reset tips** — ghost-style button. Removes both `jojo_tips_dismissed` and `jojo_tips_hidden`.
3. **"Tips are stored on this device."** — faint copy below the button.

localStorage keys used (same keys as EarlyUseTips.vue):
- `jojo_tips_dismissed`
- `jojo_tips_hidden`

localStorage failures are handled silently. Toggle transition respects `prefers-reduced-motion`.

---

## Visual system polish summary

### Tip card (EarlyUseTips.vue)

- "Got it" button now has mint border and mint text (was neutral grey), making the primary dismissal action clearly visible.
- Counter font changed from hardcoded `10px` to `var(--font-size-xs)` (11px) for design-system consistency.
- Added `box-shadow: var(--shadow-sm)` to match AppCard visual depth.
- Added Vue `<Transition name="tip-fade">` for fade-out on dismiss. Fade respects `prefers-reduced-motion`.

### Help FAQ intro note (HelpView.vue)

The clarification note at the top of "How do I log..." now has a `mint-soft` background with padding and border-radius, making it visually distinct from the FAQ list items below. Previously it was plain text with no differentiation.

### Trends empty state (GraphView.vue)

The "Add a birthdate in Baby Settings" text in the "Since birth needs birthdate" banner now uses a `router-link` so users can tap directly to Baby Settings from Trends. Previously it was unlinked text.

---

## Empty states summary

Empty states reviewed:

| View | State | Change |
|------|-------|--------|
| CareLedgerView | No active baby | No change — clear and appropriate |
| CareLedgerView | No entries | No change — already polished in 9J-1 |
| RecentlyDeletedView | No deleted entries | No change — intentional empty, no action needed |
| GraphView | No active baby | No change — header back button handles navigation |
| GraphView | No entries in range | No change — clear and appropriate |
| GraphView | Since birth, no birthdate | Baby Settings now a tappable link |

No empty state text was changed. No empty state data behavior was changed.

---

## Help page scan summary

- "How do I log..." FAQ section remains accurate from 9J-1.
- FAQ intro note now visually stands out with mint-soft background.
- No em dashes in visible Help copy.
- No stale admin, migration, or developer language found.
- Help is scannable; sections separated by AppCard gaps.
- No content changes — visual polish only.

---

## Mobile browser spacing summary

- `AppLayout` already has `padding-bottom: calc(var(--space-12) + env(safe-area-inset-bottom, 0))` — 48px plus safe area. No change needed.
- Settings nav rows have `min-height: 46px` — comfortable touch targets.
- Toggle button is 44px wide, 26px tall — tappable without being oversized.
- No fixed/sticky elements conflict with content.
- No PWA or manifest changes.

---

## No em dash confirmation

All new visible copy added in this phase:
- Settings section labels, row labels, badge text, tips UI copy — 0 em dashes.
- GraphView "Baby Settings" link text — 0 em dashes.
- Pre-existing timezone option labels ("Eastern — Toronto / New York") were not modified and are carried over as-is.

---

## Tests result

**374 tests passing** (`npm test --run`). No new unit tests added. All changed code is Vue UI with localStorage state only.

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
- `grep -rn "deleteDoc" src/` — exit code 1, 0 matches ✓
- No PWA/Capacitor/SW/manifest ✓
- No image upload / Firebase Storage / external image assets ✓
- No new dependencies ✓
- No new Firestore listeners ✓
- No modal onboarding added ✓

---

## Manual QA checklist

### Settings

1. Open Settings as owner. Confirm 7 sections appear: Your profile, Baby profile, Family and caregivers, Time and display, Tips, Backup and import, Help.
2. Tap "Name and initials" — confirm navigation to /profile.
3. Tap "Name, birthdate, and avatar" — confirm navigation to /baby-settings.
4. Tap "Manage caregivers" — confirm navigation to /manage-caregivers.
5. Tap "Invite a caregiver" — confirm navigation to /invite.
6. Change timezone, tap "Save timezone" — confirm saves and shows "Saved."
7. Tap "Import CSV" in Backup and import — confirm navigation to /admin/legacy-import.
8. Confirm "Export CSV is in the main menu." note appears.
9. Tap "Help and Legend" — confirm navigation to /help.
10. Open Settings as caregiver. Confirm Backup and import section does not appear.
11. Confirm Baby profile row shows "View only" badge for caregivers.
12. Confirm "Invite a caregiver" row does not appear for caregivers.
13. Confirm timezone is shown read-only for caregivers.

### Tip controls

14. In Settings, confirm Tips section shows "Show tips" toggle and "Reset tips" button.
15. With tips visible in ledger: toggle "Show tips" OFF — confirm tips disappear from ledger immediately after next page visit.
16. Toggle "Show tips" ON — confirm tips reappear in ledger.
17. Dismiss a few tips in ledger. Go to Settings, tap "Reset tips". Return to ledger — confirm all tips are back from tip 1.
18. Confirm `jojo_tips_hidden` and `jojo_tips_dismissed` localStorage keys are set/cleared correctly.

### Tip card

19. Confirm "Got it" button has mint border and mint text.
20. Confirm tip counter font matches other small text (not notably smaller than xs).
21. Confirm tip card has a subtle shadow consistent with AppCard.
22. Dismiss a tip — confirm a gentle fade-out occurs.

### Help FAQ

23. Navigate to Help. Confirm "How do I log..." section is present.
24. Confirm the clarification note ("Use 0 mL when there was no feed...") has a mint-tinted background and stands out visually.

### Trends empty state

25. Switch to "Since birth" range with no birthdate set. Confirm "Baby Settings" is a tappable link that navigates to /baby-settings.

### General

26. Confirm no em dash characters appear in Settings visible copy.
27. Confirm no em dash characters appear in new visible Help copy.
28. Confirm no glassmorphism, heavy shadows, or noisy gradients were added.
29. Confirm no modal onboarding was added.

---

## Known issues or follow-ups

- The "Show tips" toggle state in Settings is read from localStorage on component mount. If a user dismisses all tips in the ledger (not using "Hide tips"), the toggle still shows ON — because `jojo_tips_hidden` is not set. The tips are effectively exhausted. This is expected behavior: the toggle controls the hidden flag, not the dismissed-all state. "Reset tips" restores both.
- Export CSV remains in the hamburger menu only. The Settings Backup section notes this. A future phase could add a dedicated export page.
- Timezone labels use em dashes (pre-existing copy, unchanged). These are not new copy introduced in this phase.

---

## Commit hash

See `git log` after push.

## Main synced with origin/main

Yes — `git fetch && git merge --ff-only` was run before implementation.

## Vercel redeploy expected

Yes — 4 source files changed.
