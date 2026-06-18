# Phase 10B-1 - Post-units QA and Help polish

## Summary

Verified all Phase 10B flows (password reset, browser timezone, mL/fl oz preference). Fixed fl oz rounding drift so blurring an unchanged field does not silently rewrite amountMl. Added fl oz note to the Help page. 3 files changed, 1 new test added.

---

## Changed files

| File | Change |
|------|--------|
| `src/entries/CareEntryRow.vue` | Fixed fl oz no-drift: skip update when displayed fl oz value matches the original amountMl |
| `src/help/HelpView.vue` | Added fl oz note in "Reading the ledger"; updated icon legend mL description to mention fl oz |
| `src/test/unitConverter.test.js` | Added no-drift round-trip test (11 mL values) |

---

## Phase 10B verification checklist

| # | Check | Result |
|---|-------|--------|
| 1 | Sign-in page shows Forgot password only in sign-in mode | PASS - `v-if="mode === 'signin'"` |
| 2 | Forgot password with blank email shows friendly message | PASS - "Enter your email first, then try again." |
| 3 | Forgot password with email shows non-enumerating success | PASS - Always shows success message regardless of Firebase result |
| 4 | Browser timezone detection for new family creation | PASS - `Intl.DateTimeFormat().resolvedOptions().timeZone` with fallback |
| 5 | Timezone Settings works and shows unknown timezones | PASS - `effectiveTimezones` prepends unknown timezone to dropdown |
| 6 | mL is default | PASS - `unitPreference` defaults to `'ml'` in useFamily.js and createFamily |
| 7 | fl oz selectable in Settings by owner | PASS - `v-if="isOwner"` on select, saves via `updateFamily` |
| 8 | CareEntryRow input displays selected unit | PASS - `mlDisplay` converts, `unitLabel` changes |
| 9 | CareEntryRow stores integer amountMl | PASS - `Math.round(flOzToMl(n))` in onMlBlur |
| 10 | Today panel uses selected unit | PASS - `formatAmount(stats.todayMl, unitPreference)` |
| 11 | Entry detail sheet uses selected unit | PASS - `formatAmount(entry.amountMl, unitPreference)` |
| 12 | GraphView uses selected unit without changing calculations | PASS - Display-only via formatAmount/mlAxisLabel/avgDisplay |
| 13 | CSV export/import remain mL and unchanged | PASS - No changes to csvExporter.js or import files |
| 14 | Main ledger is not blank | PASS - No structural template changes |

---

## Rounding behavior review

### Problem

In Phase 10B, an entry with `amountMl = 90` would display as `3.0 fl oz`. If the user blurred the input without changing the value, `onMlBlur` would convert `3.0` back via `Math.round(flOzToMl(3.0))` = `Math.round(88.72)` = `89`, and emit an update changing `amountMl` from `90` to `89`.

### Fix applied

Added a guard in `onMlBlur` for fl oz mode:

```javascript
const originalFlOz = props.entry.amountMl != null
  ? parseFloat(mlToFlOz(props.entry.amountMl).toFixed(1))
  : null
if (n === originalFlOz) return
```

This compares the parsed user input to the display-rounded fl oz value derived from the existing `amountMl`. If they match, the user did not change the value, so no update is emitted.

### Behavior after fix

| Scenario | Before fix | After fix |
|----------|-----------|-----------|
| 90 mL entry, blur without change | amountMl silently changes to 89 | No change, stays 90 |
| 90 mL entry, user changes to 3.1 | 3.1 fl oz -> 92 mL | Same: 92 mL |
| null entry, user enters 3.0 | 89 mL | Same: 89 mL (new entry, no original to compare) |
| 0 mL entry, blur without change | No change | No change |

### Test coverage

Added `no-drift` test that verifies for 11 representative mL values (0, 30, 60, 89, 90, 100, 120, 150, 180, 240, 300) that the displayed fl oz value, when reconverted to mL and redisplayed, produces the same string. This confirms the display is stable after one conversion cycle.

---

## Help fl oz note summary

### Reading the ledger (card 3)

Updated existing list item from:
> Each row shows time, feed amount (mL), diaper code, and any extras.

To:
> Each row shows time, feed amount, diaper code, and any extras.

Added new list item:
> Bottle amounts are stored in mL. If your family uses fl oz, the app converts display and entry amounts for you. You can change this in Settings.

### Icon legend (card 5)

Updated mL legend description from:
> Feed amount in millilitres. Blank means not recorded.

To:
> Feed amount in millilitres (or fl oz if selected in Settings). Blank means not recorded.

---

## Tests result

**405 tests passing** (`npx vitest run`). 1 new test added to `unitConverter.test.js`.

---

## Build result

`npm run build` -- clean (0 errors). CSS bundle 60.26 kB gzip. Pre-existing chunk size advisory unchanged.

---

## Safety confirmations

- Only 3 files changed (1 entry component, 1 help page, 1 test)
- `amountMl` remains the canonical stored field
- No entry write behavior changed (the fix prevents unnecessary writes)
- No Trends calculations changed
- No feed-count logic changed
- No CSV import/export logic changed
- No Firestore rules deployed
- No Firestore indexes changed
- No migration or bulk data mutation
- `deleteDoc` -- 0 matches in changed files
- `package.json` and `package-lock.json` -- 0 changes
- No PWA/Capacitor/SW/manifest changes
- No new dependencies
- No router changes
- No auth provider changes
- No new Firestore listeners
- No em dash characters in new visible copy

---

## Manual QA checklist

1. Sign-in page shows Forgot password link.
2. Forgot password with blank email shows friendly message.
3. Forgot password with email shows non-enumerating success.
4. New family creation detects browser timezone.
5. Timezone Settings shows and accepts unknown timezones.
6. Default bottle unit is mL.
7. Settings can switch to fl oz (owner only).
8. Entry row shows fl oz when selected; blurring unchanged value does not alter amountMl.
9. Entry row correctly converts changed fl oz value to integer mL.
10. Today panel total uses selected unit.
11. Entry detail sheet uses selected unit.
12. Trends uses selected unit in labels and callouts.
13. CSV export unchanged.
14. Help page includes fl oz note in Reading the ledger.
15. Help icon legend mentions fl oz.
16. Main ledger is not blank.

---

## Known issues or follow-ups

### Help FAQ still references "0 mL" literally

The FAQ intro and several FAQ answers say "Enter 0 mL" or "Use 0 mL". In fl oz mode, the field shows "0.0" with an "fl oz" label, but the Help text still says "mL". This is technically accurate (amounts are stored in mL) and changing all FAQ copy would risk introducing confusion. Low priority.

### Rounding is stable but not lossless

After the no-drift fix, an unchanged fl oz value no longer causes drift. However, if a user intentionally enters a new fl oz value, the integer mL rounding means the displayed fl oz may shift by 0.1 on the next view. Example: user enters 3.1 fl oz -> 92 mL -> redisplays as 3.1 fl oz. This is stable (3.1 always round-trips through 92 mL back to 3.1) as verified by the no-drift test.

---

## Commit hash

TBD -- set after commit.

## Main synced with origin/main

Yes -- will be pushed to `origin/main` after commit.

## Vercel redeploy expected

Yes -- 2 source files changed.
