# Phase 7C-3 — Today Stats Fix After Legacy Import

**Date:** 2026-05-24
**Status:** Complete and committed.

## Root cause

**Option A confirmed: UTC date bug in `todayString()`.**

`dateUtils.js` line 3:
```js
// Before (broken)
return new Date().toISOString().slice(0, 10)
```

`Date.toISOString()` returns the UTC date. In Eastern Time (UTC−4), at any time of day, the UTC date can be ahead of the local date (e.g., at 9pm ET on May 24, UTC is already May 25). The header clock shows the correct local date via `toLocaleDateString()`, but `todayString()` returned the UTC date.

`calculateStats(entries.value, todayString())` compared `entry.entryDate === today` where `today` was `2026-05-25` (UTC) while all imported entries had `entryDate: "2026-05-24"` (local). No entries matched → Today: 0 mL, Feeds Today: 0.

`statsCalculator.js` has **no source filter** — it counts all non-deleted entries regardless of `source`. The bug was entirely in `todayString()`.

## What changed

### src/utils/dateUtils.js

```js
// After (fixed)
export function todayString() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
```

Uses local date parts (`getFullYear`, `getMonth`, `getDate`) instead of `toISOString()`. `currentMonthKey()` calls `todayString()` and is automatically fixed. All callers (`useLedger.js` stats computed, `useLedger.js` month key, `CareLedgerView.vue` CSV filename and day picker) now receive the correct local date.

### src/test/statsCalculator.test.js

Added `describe('calculateStats — source field does not affect counts')` with 5 tests:
- `source: "legacy"` counted in todayMl ✓
- `source: "legacy"` counted in feedCount ✓
- `source: "app"` counted in todayMl ✓
- deleted `source: "legacy"` excluded ✓
- mixed legacy + app entries sum correctly ✓

### src/test/dateUtils.test.js (new)

5 tests:
- `todayString()` returns `YYYY-MM-DD` format ✓
- `todayString()` matches local date components ✓
- `todayString()` year matches local year ✓
- `currentMonthKey()` returns `YYYY-MM` format ✓
- `currentMonthKey()` equals `todayString().slice(0, 7)` ✓

## Other `toISOString()` uses — confirmed safe

- `weekUtils.js`: uses `dateString + 'T12:00:00'` — noon anchor, not `new Date()` ✓
- `entryUtils.js`: same noon anchor for next-day computation ✓
- `statsCalculator.js`: derives `sevenDayStartStr` from the `today` parameter (now correct) with a noon anchor ✓
- `csvExporter.js`: converts Firestore Timestamps to ISO — correct, timestamps are absolute ✓

## Imported entries untouched. No Firestore changes.
