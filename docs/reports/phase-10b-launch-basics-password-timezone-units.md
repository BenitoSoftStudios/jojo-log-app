# Phase 10B - Launch basics: password reset, timezone default, and measurement units

## Summary

Implemented three launch-critical features for public beta: forgot password flow on the login page, browser timezone detection for new family creation, and mL/fl oz display preference. All changes are additive or display-only. `amountMl` remains the canonical stored field. mL remains the default unit.

---

## Changed files

| File | Change |
|------|--------|
| `src/auth/useAuth.js` | Added `sendPasswordReset()` using Firebase `sendPasswordResetEmail` |
| `src/auth/LoginView.vue` | Added "Forgot password?" link, reset state, non-enumerating success message |
| `src/families/FamilySetupView.vue` | Replaced hardcoded `'America/Toronto'` with browser timezone detection via `Intl.DateTimeFormat()` |
| `src/families/useFamily.js` | Exported `unitPreference` computed from family doc (default: `'ml'`) |
| `src/settings/SettingsView.vue` | Added "Bottle units" selector (mL/fl oz) under Time and display; timezone list now includes unknown family timezone if not in static list |
| `src/entries/CareEntryRow.vue` | Unit-aware amount display and input (fl oz shows 1 decimal, converts back to integer mL on blur) |
| `src/entries/CareLedgerView.vue` | Today panel stats and last-entry line use `formatAmount()` with unit preference |
| `src/entries/EntryDetailSheet.vue` | Amount display uses `formatAmount()` with unit preference |
| `src/charts/GraphView.vue` | Summary stats, axis labels, day callout, rolling average, and notable days use unit preference |
| `src/test/unitConverter.test.js` | 30 tests for mlToFlOz, flOzToMl, formatAmount, parseAmountToMl |

---

## Part 1 - Forgot password implementation

### Flow

1. User is on the sign-in tab.
2. "Forgot password?" link appears below the Sign in button.
3. User enters email in the existing email field.
4. Taps "Forgot password?"
5. If email is blank: shows "Enter your email first, then try again."
6. If email is provided: calls `sendPasswordResetEmail()`, always shows "If an account exists for that email, a reset link has been sent." (non-enumerating).
7. Firebase errors are silently caught — the success message always appears to avoid revealing whether the email exists.

### Files changed

- `src/auth/useAuth.js`: imported `sendPasswordResetEmail` from `firebase/auth`, added `sendPasswordReset(email)` function, exported it from `useAuth()`.
- `src/auth/LoginView.vue`: added `resetLoading`, `resetMsg`, `resetError` refs; added `handleForgotPassword()` handler; added template elements for the link, success message, and error message; added CSS for `.forgot-link` and `.reset-msg`.

### No new routes or dependencies

The forgot password flow works entirely within the existing login page. No new route, no new dependency.

---

## Part 2 - Timezone implementation

### Browser detection

In `FamilySetupView.vue`, the hardcoded `timezone: 'America/Toronto'` was replaced with:

```javascript
let detectedTz = 'America/Toronto'
try { detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone || detectedTz } catch {}
```

This detects the browser's IANA timezone (e.g., `'Europe/London'`, `'Australia/Sydney'`, `'America/Los_Angeles'`) and falls back to `'America/Toronto'` if detection fails.

### Unknown timezone handling in Settings

`SettingsView.vue` now computes `effectiveTimezones` — if the family's current timezone is not in the static `TIMEZONES` list (e.g., a detected `'Europe/London'`), it is prepended to the dropdown so the owner can see and keep it.

### No migration

Existing families are not affected. Only new families created after this change will get the browser timezone.

---

## Part 3 - Measurement unit implementation

### Storage model

- `amountMl` remains the canonical stored field (integer mL).
- `unitPreference` is stored on the family document (values: `'ml'` or `'floz'`, default `'ml'`).
- The family document already included `unitPreference` in the `createFamily` service. No schema change.
- No migration. No Firestore rules change.

### Conversion helpers

`src/utils/unitConverter.js` (pre-existing, unchanged):
- `mlToFlOz(ml)` — divides by 29.5735
- `flOzToMl(flOz)` — multiplies by 29.5735
- `formatAmount(ml, unit)` — returns `"90 mL"` or `"3.0 fl oz"`
- `parseAmountToMl(value, unit)` — parses user input to mL

### Where unit preference applies

| Location | Before | After (fl oz selected) |
|----------|--------|------------------------|
| CareEntryRow input | `90` + `mL` label | `3.0` + `fl oz` label, decimal input, converts to mL on blur |
| Today panel: today total | `90 mL today` | `3.0 fl oz today` |
| Today panel: 7-day / month | `630 mL · 7 days` | `21.3 fl oz · 7 days` |
| Today panel: last entry | `Last logged 08:30, 90 mL` | `Last logged 08:30, 3.0 fl oz` |
| Entry detail sheet: Amount | `90 mL` | `3.0 fl oz` |
| Trends: summary stat | `90 mL/day` | `3.0 fl oz/day` |
| Trends: volume axis label | `1k` (mL) | `33.8` (fl oz) |
| Trends: day callout | `90 mL` | `3.0 fl oz` |
| Trends: rolling average | `7-day avg 85 mL` | `7-day avg 2.9 fl oz` |
| Trends: notable days | `90 mL` | `3.0 fl oz` |

### Where unit preference does NOT apply (by design)

- `amountMl` stored value — unchanged, always integer mL
- Feed count logic — unchanged
- CSV export — unchanged, exports mL
- CSV import — unchanged, imports mL
- Graph bar height calculations — unchanged, computed from mL
- Firestore rules — unchanged
- Firestore indexes — unchanged

### Settings UI

Added under "Time and display" card with a divider:
- Label: "Bottle units"
- Helper text: "Entries are stored in mL. You can display bottles in either unit."
- Select: mL / fl oz
- Save button (owner-only, same pattern as timezone)

### Input behavior in fl oz mode

- `step="0.1"` and `inputmode="decimal"` for decimal keyboard on mobile
- On blur, the entered fl oz value is converted to mL via `Math.round(flOzToMl(n))`
- Rounding to nearest integer mL means a ±1 mL difference is possible (e.g., 3.0 fl oz → 89 mL, not 90 mL). This is expected and documented.

---

## Storage / data model confirmation

- `amountMl` is never renamed, removed, or retyped
- `unitPreference` was already in the family document schema (set in `createFamily`)
- No new Firestore fields were added to entry documents
- No migration was run
- CSV export still uses `amountMl` directly

---

## Tests result

**404 tests passing** (`npx vitest run`).

30 new tests in `src/test/unitConverter.test.js`:
- `mlToFlOz`: null, undefined, 0, conversion accuracy
- `flOzToMl`: null, undefined, 0, conversion accuracy
- `formatAmount`: mL default, explicit mL, fl oz formatting, null/undefined, 0, large values
- `parseAmountToMl`: mL parsing, fl oz parsing, empty/null/undefined, non-numeric, default unit, round-trip accuracy, integer storage semantics

---

## Build result

`npm run build` — clean (0 errors). CSS bundle 60.26 kB gzip (was 59.82 kB). Pre-existing chunk size advisory unchanged.

---

## Safety confirmations

- `amountMl` remains the canonical stored field
- mL remains the default unit
- No entry write behavior changed (storage is always integer mL)
- No Trends calculations changed (bar heights computed from mL)
- No feed-count logic changed
- No CSV import/export logic changed
- No Firestore rules deployed
- No Firestore indexes changed
- No migration or bulk data mutation
- `deleteDoc` — 0 matches in any changed file
- `package.json` and `package-lock.json` — 0 changes
- No PWA/Capacitor/SW/manifest changes
- No new dependencies
- No router changes
- No auth provider changes (only added `sendPasswordResetEmail` import from existing `firebase/auth`)
- No new Firestore listeners
- No em dash characters in new visible copy

---

## Forbidden file check

| Pattern | Result |
|---------|--------|
| `deleteDoc` in changed files | 0 matches |
| `firestore.rules` changed | No |
| `firestore.indexes` changed | No |
| `package.json` changed | No |
| `package-lock.json` changed | No |

---

## Manual QA checklist

1. Sign-in page shows "Forgot password?" link below Sign in button.
2. Forgot password with blank email shows "Enter your email first, then try again."
3. Forgot password with email shows "If an account exists for that email, a reset link has been sent."
4. New family setup uses browser timezone when available.
5. Existing timezone setting still works. Unknown timezones appear in dropdown.
6. Default bottle unit is mL.
7. Settings can switch bottle unit to fl oz (owner-only).
8. Add/Edit entry still stores amountMl as integer.
9. Entry display changes units correctly (mL ↔ fl oz).
10. Today total changes units correctly.
11. CSV export still works and does not lose mL.
12. Trends still render with correct unit labels.
13. Main ledger is not blank.

---

## Known issues or follow-ups

### Rounding in fl oz mode

When displaying in fl oz, the 1-decimal display introduces a ±1 mL rounding difference. Example: 90 mL → 3.0 fl oz → user re-saves → 89 mL. This is inherent to the 1-decimal precision and acceptable for a baby care log.

### Timezone list is not exhaustive

The static TIMEZONES list has 7 entries (North American zones + UTC). If the browser detects a timezone not in the list (e.g., `Europe/London`), it is added dynamically to the dropdown. A future task could expand the static list to cover more regions.

### Unit preference is family-level

The unit preference is stored on the family document, meaning all family members see the same unit. A future enhancement could make this per-member if needed.

### Help page not updated for fl oz

The Help page still references mL in its copy. A follow-up task could add a note about fl oz display. Low priority since the Help page explains the data model (mL storage) which remains true.

---

## Commit hash

TBD — set after commit.

## Main synced with origin/main

Yes — will be pushed to `origin/main` after commit.

## Vercel redeploy expected

Yes — 9 source files changed, 1 test file added.
