# Phase 10A - Public beta readiness audit and safe launch polish

## Summary

Audited all major flows against public beta readiness criteria. Applied three low-risk copy/copy polish fixes. Documented launch blockers and recommended next tasks.

---

## Changed files

| File | Change |
|------|--------|
| `src/settings/ProfileView.vue` | Removed developer language ("Firestore rules") from permission error; capitalized role display |
| `src/settings/SettingsView.vue` | Removed "fl oz display coming later" placeholder from Time and display card |
| `src/families/ManageCaregiversView.vue` | Capitalized role display (owner -> Owner, caregiver -> Caregiver) |

---

## Part 1 - Public beta readiness audit checklist

### 1. First load / signed-out state
**PASS** - Login page is clean. Title "Jojo's Log", subtitle "A shared care log for your household." Email/password fields with clear labels. Sign in / Create account toggle. Friendly error messages for all common auth error codes. No developer language visible to users.

### 2. Sign-in / account access
**PASS** - Auth flow is correct: Login -> setup-profile -> family-setup -> ledger. Router guard waits for Firebase Auth to resolve before redirecting. Invited caregivers join via `/join-family`. Setup profile and family setup pages are clear and complete.

### 3. Main Today ledger
**PASS** - Today panel shows: current member label, today mL total, feed count, last logged line, 7-day and month mL stats. Amber incomplete chip shows when entries need finishing. Header shows live date/time/sync status.

### 4. Add Entry / Day picker
**PASS** - Day picker offers Today, Next day, or custom date with time. 48px minimum height buttons. Labels are clear. "Create entry" button is clearly labeled.

### 5. Edit Entry
**PASS** - Inline editing for time, mL, diaper (W/P/WP/-), vitamin D, medication, and tummy time. Save flash feedback (... -> checkmark). EntryDetailSheet for notes and delete with confirmation flow.

### 6. Incomplete entry handling
**PASS** - Amber dot on entry rows. Amber outline on null mL and null diaper. "X needs finishing" chip in Today panel. "X need finishing" label on day headers. Consistent and clear.

### 7. Empty states
**PASS** - Ledger: "No entries yet" with example entry-type chips (Bottle only, Diaper only, etc.) and "+ Add first entry" button. No baby: "No active baby. Use the menu to add one." (owner only). Recently Deleted: "No deleted entries." Trends: "No entries in this range." or "No active baby selected." Loading: "Loading..." All empty states are useful.

### 8. Help page
**PASS** - Intro card, quick jump hub (6 chips anchoring to FAQs), reading guide, icon legend, full FAQ section with anchors, Trends, Baby Settings, caregivers, CSV, Recently Deleted, Timezone, and disclaimer. Hub chips work with scroll-margin-top for sticky header. 0 mL / dash / blank explanation is prominent.

### 9. Settings page
**PASS (after fix)** - Grouped nav cards: Your profile, Baby profile, Family and caregivers, Time and display (timezone), Tips, Backup and import (owner-only), Help. "fl oz display coming later" placeholder text removed. No incomplete placeholder UI sections remain.

### 10. Trends / graphs
**PASS** - 7d/30d/Since birth ranges. Volume, feeds, and tummy time charts. Notable days section. Day callout on tap. Explanatory banner. "Descriptive log only. Not feeding guidance." disclaimer is present.

### 11. CSV export
**PASS** - Owner-only in the menu (v-if isOwner). Exports all entries for the active baby. Error handling in place.

### 12. Multi-baby switcher
**PASS** - BabySwitcher shown if activeBabies.length > 1. Add baby in menu (owner-only). Baby archive in BabySettingsView (owner-only). Caregiver view in BabySettingsView is read-only with clear label.

### 13. Error states and loading states
**PASS** - Write errors shown as alert banners. Form errors shown inline. Loading spinners on async operations. Auth errors use friendly mapped messages.

### 14. Basic accessibility
**PASS** - Buttons have aria-labels or clear visible text. Diaper group has role="group" and aria-label. Today panel incomplete chip has aria-label. Day header button has aria-expanded. Entry incomplete dot has aria-label. Sync status has visible text. Symbol buttons (sun, Rx, star) all have descriptive aria-labels. Min touch targets: most buttons >= 36px, primary actions >= 44-48px. Focus: all interactive elements use browser defaults which are visible.

**FOLLOW-UP NEEDED** - EarlyUseTips "Got it" / "Hide tips" buttons are 28px min-height. Below the recommended 44px. Low risk for beta but worth noting.

### 15. Public launch copy
**PASS (after fix)** - Developer language removed from user-visible error in ProfileView. "fl oz display coming later" placeholder removed from Settings. Role display now shows "Owner" / "Caregiver" (capitalized) instead of lowercase strings. No Firebase, Firestore, migration, or admin language visible to end users in the main flows.

**FOLLOW-UP NEEDED** - `/admin/legacy-import` path still contains "admin" and "legacy" in the browser URL bar for owners. The button label shown is "Import CSV" (correct), but the URL is visible. Low impact for a small beta.

**FOLLOW-UP NEEDED** - "Legacy entry" source label in EntryDetailSheet (line 73) is visible to users for any imported entries. Confusing for new parents who never imported anything and stumble on old data.

---

## Part 2 - Safe launch polish applied

| Fix | File | Before | After |
|-----|------|--------|-------|
| Firestore error message | `ProfileView.vue` | "This account may need a Firestore rules update before self-edit is supported." | "Permission denied. Please try again or contact the family owner." |
| fl oz placeholder | `SettingsView.vue` | "fl oz display coming later. Amounts are stored in mL." (plus divider and label) | Removed entirely |
| Role capitalization | `ManageCaregiversView.vue` | `{{ m.role }}` -> "owner" / "caregiver" | "Owner" / "Caregiver" |
| Role capitalization | `ProfileView.vue` | `{{ currentMember.role }}` -> "owner" / "caregiver" | "Owner" / "Caregiver" |

---

## Part 3 - Launch blocker list

### BLOCKER: No password reset flow

- **Severity:** blocker
- **Area:** Auth
- **Description:** There is no forgot password link, no password reset email trigger, and no reset confirmation page in the app.
- **Why it matters for public beta:** Any beta user who forgets their password has no self-service recovery. They will be locked out permanently unless they contact the developer directly.
- **Suggested next task:** Phase 10B - Add forgot password / reset password flow. Add a "Forgot password?" link on the login page that triggers Firebase's `sendPasswordResetEmail()`. Add a confirmation message. No new dependencies needed.
- **Files likely involved:** `src/auth/LoginView.vue`, `src/auth/useAuth.js`
- **Risk level:** Low - additive only, no existing code changed

---

### HIGH: Default timezone hardcoded to America/Toronto on family creation

- **Severity:** high
- **Area:** Onboarding / Settings
- **Description:** `FamilySetupView.vue` hardcodes `timezone: 'America/Toronto'` on family creation. The Settings page allows the owner to change it, but many beta users outside Eastern time will see wrong "today" groupings until they find and fix it.
- **Why it matters for public beta:** A parent in the UK, Australia, or US Pacific who creates a family will see "today" start at the wrong time until they manually correct the timezone in Settings.
- **Suggested next task:** Phase 10C - Default timezone to browser timezone on family creation. Use `Intl.DateTimeFormat().resolvedOptions().timeZone` as the default, falling back to 'America/Toronto' if unavailable. Copy-only change in the timezone select to show the detected zone.
- **Files likely involved:** `src/families/FamilySetupView.vue`, `src/settings/SettingsView.vue` (TIMEZONES constant may need expansion)
- **Risk level:** Low on new families, zero on existing families (no data migration)

---

### MEDIUM: "Legacy entry" source label visible to users in Entry Details

- **Severity:** medium
- **Area:** Entry detail sheet
- **Description:** `EntryDetailSheet.vue` line 72-75 shows `<span class="text-faint">Legacy entry</span>` for entries where `entry.source === 'legacy'`. "Legacy" is a developer term.
- **Why it matters for public beta:** If any beta user imported data or sees entries with this source, they will see a confusing internal label. New parents do not understand "legacy."
- **Suggested next task:** Rename to "Imported entry" in the display only (no data model change). Single line change in `EntryDetailSheet.vue`.
- **Files likely involved:** `src/entries/EntryDetailSheet.vue`
- **Risk level:** Minimal - display-only change

---

### MEDIUM: Import CSV route URL contains "admin" and "legacy"

- **Severity:** medium
- **Area:** URL / navigation
- **Description:** The Import CSV feature lives at `/admin/legacy-import`. The word "admin" and "legacy" are visible in the browser address bar when an owner uses Import CSV.
- **Why it matters for public beta:** Could confuse or alarm a first-time user. "Legacy import" implies obsolete tooling. Only owners can reach this page, so the surface area is small.
- **Suggested next task:** Phase 10D - Rename route to `/import-csv`. Update router.js, SettingsView.vue, and CareLedgerView.vue references.
- **Files likely involved:** `src/app/router.js`, `src/settings/SettingsView.vue`, `src/entries/CareLedgerView.vue`, `src/admin/LegacyImportView.vue` (file rename optional)
- **Risk level:** Low - route rename only, no data changes

---

### LOW: EarlyUseTips buttons are below 44px minimum touch target

- **Severity:** low
- **Area:** Accessibility / mobile usability
- **Description:** "Got it" and "Hide tips" buttons in `EarlyUseTips.vue` use `min-height: 28px`. Apple HIG recommends 44px minimum for interactive elements.
- **Why it matters for public beta:** Harder to tap accurately on a phone, especially one-handed with a baby.
- **Suggested next task:** Bump `min-height` from 28px to 36px on `.tips-btn`. Single CSS change.
- **Files likely involved:** `src/ui/EarlyUseTips.vue`
- **Risk level:** Minimal

---

### LOW: No account deletion flow

- **Severity:** low
- **Area:** Account management
- **Description:** There is no way for a user to delete their account from the app. This matters if any beta users are in jurisdictions with right-to-erasure requirements.
- **Why it matters for public beta:** Low risk for a small closed beta of known parents. Becomes a concern at wider launch.
- **Suggested next task:** Add a "Delete account" option in Settings or Profile. Requires Firebase auth account deletion + Firestore data cleanup.
- **Files likely involved:** `src/settings/SettingsView.vue`, `src/settings/ProfileView.vue`, `src/auth/useAuth.js`
- **Risk level:** Medium - destructive action requires careful implementation and Firestore rules review

---

## Part 4 - Recommended next tasks

### 1. Must do before sharing

**Phase 10B - Forgot password flow**
Add a "Forgot password?" link on the login page. Trigger `sendPasswordResetEmail()`. Show a confirmation. No new dependencies. Single file change in LoginView.vue and one line in useAuth.js. This is the only true launch blocker that can strand beta users permanently.

### 2. Should do before wider sharing

**Phase 10C - Default timezone from browser**
Detect `Intl.DateTimeFormat().resolvedOptions().timeZone` on family creation and use it as the default timezone. Fall back to 'America/Toronto' if unavailable. Small change in FamilySetupView.vue. Prevents UK/AU/Pacific parents from seeing the wrong "today" after onboarding.

**Phase 10D - Rename import route away from /admin/legacy-import**
Move to `/import-csv` or similar. Requires updating router.js, the two places that link to it (SettingsView, CareLedgerView), and optionally renaming the component file. Low risk, removes the only developer-facing URL in the public app.

### 3. Can wait

**Phase 10E - Entry source label "Legacy entry" -> "Imported entry"**
Single display-only change in EntryDetailSheet.vue. Low urgency since imported entries only appear for users who ran the CSV import.

**Phase 10F - EarlyUseTips tap target fix**
Bump `.tips-btn` min-height from 28px to 36px. Minor accessibility improvement.

**Phase 10G - Account deletion**
Medium-complexity feature (auth deletion + Firestore data cleanup). Important for any wider launch but not urgent for a small known-user beta.

---

## Tests result

**374 tests passing** (`npm test --run`). No test changes needed.

---

## Build result

`npm run build` -- clean (0 errors). CSS bundle 59.82 kB gzip. Pre-existing chunk size advisory unchanged.

---

## Safety confirmations

- Only 3 source files changed (copy/template only, no logic)
- No entry write behavior changed
- No Trends calculations changed
- No CSV import/export logic changed
- No Firestore rules deployed
- No Firestore indexes changed
- No migration or bulk data mutation
- `grep -rn "deleteDoc" src/` -- 0 matches in changed files (2 pre-existing comments in router.js and familyService.js unchanged)
- `package.json` and `package-lock.json` -- 0 changes
- No PWA/Capacitor/SW/manifest changes
- No new dependencies
- No router changes
- No auth provider changes
- No new Firestore listeners
- No em dash characters in new visible copy

---

## Forbidden file check

| Pattern | Result |
|---------|--------|
| `deleteDoc` in src/ | 0 matches in any changed file |
| `firestore.rules` in src/ | 0 matches (pre-existing comments in router.js and familyService.js, unchanged) |
| `firestore.indexes` in src/ | 0 matches (same pre-existing comments) |
| `package.json` changed | No |
| `package-lock.json` changed | No |

---

## Manual QA checklist

1. Sign in -- clean login page, no developer language, friendly errors on wrong password.
2. Create account -- setup profile page and family setup page are clear.
3. Ledger loads -- Today panel, entries, header all render.
4. Open My Profile -- role now shows "Owner" or "Caregiver" (capitalized). Error on permission denied no longer mentions Firestore.
5. Open Settings -- Time and display card no longer shows "fl oz display coming later" placeholder. Timezone selector works.
6. Open Manage Caregivers -- member list shows "Owner" / "Caregiver" (capitalized) role labels.
7. Open Help -- hub shows near top, chips scroll to FAQ answers, 0 mL / dash / blank explanation is present.
8. Open Trends -- 7d/30d/Since birth ranges work, disclaimer text present.
9. Open Recently Deleted -- empty state or list shows correctly.
10. Export CSV from menu (owner) -- downloads file.
11. Ledger empty state -- shows "No entries yet" with example chips and "+ Add first entry" button.

---

## Known issues or follow-ups

See Part 3 above for the full launch blocker list. The most important remaining issue is the missing password reset flow (blocker), followed by the timezone default for non-Eastern users (high).

---

## Commit hash

`74fe086`

## Main synced with origin/main

Yes -- pushed to `origin/main`.

## Vercel redeploy expected

Yes -- 3 source files changed.
