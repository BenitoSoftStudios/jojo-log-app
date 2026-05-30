# Phase 9C-1 — Graph Readability Redesign

**Date:** 2026-05-30
**Status:** COMPLETE

---

## Overview

Full rewrite of `src/charts/GraphView.vue` for mobile-first readability. No changes to `graphData.js`, no new Firestore listeners, no new tests (existing 25 graph tests unchanged and still passing).

---

## Files modified

| File | Action |
|---|---|
| `src/charts/GraphView.vue` | Rewritten — full readability redesign |

---

## Design changes

### Range controls

Replaced pill buttons with a **segmented control** (single bordered container, active segment filled mint).

| Key | Label | Start date |
|---|---|---|
| `7d` | 7 Days | `today − 6 days` |
| `30d` | 30 Days | `today − 29 days` |
| `birth` | Since birth | First day of baby's birth month (`YYYY-MM-01`); falls back to earliest entry if no birthdate |

Default range: **30 Days**.

### Summary stat cards

Three cards displayed horizontally above the charts:

| Card | Value | Denominator |
|---|---|---|
| mL / day | avg daily mL | Days where feedCount > 0 OR totalMl > 0 |
| feeds / day | avg feed count | Same — days with data only |
| tummy sessions | total in range | All days in range |

"Days with data" denominator avoids misleading averages from zero-data days.

No medical/goal/recommendation language anywhere.

### Daily mL chart

- SVG height: 175 px (baseline y = 140, max bar height = 125 px)
- **Today's bar**: `--color-success` (#4a9e6e, darker mint)
- Other bars: `--color-mint`
- **7-day rolling average line**: dashed `<polyline>` (`stroke-dasharray: 4 3`, 55% opacity)
- **Tap/click callout**: tapping any column shows a pill callout (`--color-mint-soft` bg) with date, mL, feeds, tummy — tapping again dismisses. Transparent full-height `<rect>` hit areas drawn last for correct z-order.
- Selected column background: `--color-mint-soft` tint
- Today column background (unselected): `--color-surface-alt` tint
- No value labels above bars (too cramped on mobile)
- Max mL shown at top-left for y-axis reference

### Feed count chart

- SVG height: 72 px (90 px when date labels shown below)
- Bars: `--color-mint`, secondary visual weight
- Compact date labels only shown for "Since birth" range (>30 days), skipped for 7d/30d (date axis shared visually with mL chart above)

### Tummy time chart

- SVG height: 72 px (90 px when date labels shown below)
- Bars: `--color-lavender` (#a89ec9) for distinct visual identity
- "No sessions recorded in this range." shown when tummyCount is zero for all days in range

### Column widths

| Days in range | Column width | Total chart width |
|---|---|---|
| ≤ 7 | 44 px | 308 px — fits iPhone (no scroll) |
| ≤ 30 | 11 px | 330 px — fits iPhone (no scroll) |
| ≤ 90 | 10 px | scrollable |
| > 90 | 8 px | scrollable |

### Date labels

| Column width | Label format | Frequency |
|---|---|---|
| ≥ 30 px | Weekday abbrev (Mon, Tue…) | Every column |
| ≥ 10 px | Day number only (1, 5, 12…) | Every 5th + last |
| < 10 px | M/D (1/15, 2/3…) | Every 14th + last |

### Notable days section

Shown only when at least one notable day exists (highest mL, most feeds, most tummy sessions). Hidden if all are null. No ranking tiers, no comparison to any target.

---

## Validation checklist

| # | Check | Result |
|---|---|---|
| 1 | Range: 7 Days / 30 Days / Since birth | ✓ |
| 2 | Segmented control (not pills) | ✓ |
| 3 | "Since birth" = first day of birth month; falls back to earliest entry | ✓ |
| 4 | Summary stat cards: mL/day, feeds/day, tummy sessions | ✓ |
| 5 | Daily mL bar chart with today highlight | ✓ |
| 6 | 7-day rolling average dashed polyline | ✓ |
| 7 | Tap-to-inspect day callout | ✓ |
| 8 | Feed count compact chart | ✓ |
| 9 | Tummy time chart — lavender bars | ✓ |
| 10 | Notable days section (highest mL, most feeds, most tummy) | ✓ |
| 11 | No medical / goal / recommendation language | ✓ |
| 12 | `graphData.js` unchanged | ✓ |
| 13 | No new Firestore listeners | ✓ |
| 14 | No deleteDoc in src/ | ✓ (grep confirms) |
| 15 | No Firestore rules/indexes changed | ✓ |
| 16 | No PWA/Capacitor/SW/manifest | ✓ |
| 17 | No chart library added | ✓ (pure SVG) |
| — | Tests | 311 / 311 |
| — | Build | Clean |
