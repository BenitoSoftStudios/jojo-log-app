# Phase 9C-2 — Real Graph Visuals and Trends Polish

**Date:** 2026-05-30
**Status:** COMPLETE

---

## Root cause of missing charts

Phase 9C left `v-if` and `v-for` on the same `<rect>` elements in Vue 3. In Vue 3, `v-if` has higher priority than `v-for` — it evaluates before the loop variable `row` is defined, so the condition throws and bars are never rendered.

**Fix:** Wrapped every bar group in `<template v-for>` with an inner `<rect v-if>`, separating the concerns.

---

## Files modified

| File | Action |
|---|---|
| `src/charts/GraphView.vue` | Rewritten — fixes, rename, monthly grouping, period avg line, default callout |
| `src/utils/graphData.js` | Added `groupByMonth()` |
| `src/test/graphData.test.js` | Added 6 `groupByMonth` tests (317 total) |

---

## Changes

### Page title
`Graph` → `Trends`

### Summary card labels
`mL / day avg` → `mL/day` · `feeds / day avg` → `feeds/day`

### Disclaimer
Added below stat cards: `Descriptive log only. Not feeding guidance.`

### Bar rendering bug fix
All bar `<rect>` elements now use `<template v-for>` + inner `<rect v-if>` pattern. Zero-height bars are suppressed; non-zero bars render correctly.

### Period average horizontal line
Thin dashed horizontal line (`--color-text-faint`, `stroke-dasharray: 3 4`) drawn across the volume chart at the average mL value for the period. Only shown when meaningfully above the baseline (> 4px gap).

### Default callout
`displayRow` defaults to today's bar (or the current month in monthly view, or the last row if today is out of range) — so the callout is always populated without requiring a tap. Shows "tap to inspect" hint when no explicit selection is active.

### Monthly grouping for Since birth
When `selectedRange === 'birth'` and `dailyStats.length > 30`, the charts switch to monthly view:
- Bars represent calendar-month aggregates (total mL, total feeds, total tummy sessions)
- Column width: 48px (≤12 months) / 36px (>12 months)
- Labels: abbreviated month name ("Mar", "Apr")
- Callout label: full "Mar 2026" format
- Volume chart title: "Monthly volume" · Feeds chart title: "Monthly feeds"
- 7-day rolling avg polyline hidden (not meaningful for monthly)
- Period avg horizontal line still shown

### `groupByMonth(dailyStats)`
New export in `graphData.js`. Groups `computeDailyStats` output into `{ monthKey, label, totalMl, feedCount, tummyCount }` rows sorted oldest-first. Label format: "May 2026" (hardcoded month array — no locale dependency).

---

## Validation checklist

| # | Check | Result |
|---|---|---|
| 1 | Page title says Trends | ✓ |
| 2 | 7 Days / 30 Days / Since birth remain | ✓ |
| 3 | Summary cards still render | ✓ |
| 4 | Daily volume chart is visible | ✓ (v-if+v-for bug fixed) |
| 5 | Feeds visual is visible | ✓ |
| 6 | Tummy time visual is visible | ✓ |
| 7 | Since birth does not cram unreadable daily bars | ✓ (monthly grouping for >30 days) |
| 8 | Notable days appears below charts | ✓ |
| 9 | No medical guidance language | ✓ |
| 10 | No new Firestore listeners | ✓ |
| 11 | No feeds path changed | ✓ |
| 12 | No deleteDoc | ✓ (grep confirms) |
| 13 | No Firestore rules/indexes changed | ✓ |
| 14 | No PWA/Capacitor/SW/manifest | ✓ |
| — | Tests | 317 / 317 |
| — | Build | Clean |
