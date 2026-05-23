# Phase 6.4 — Weekly Usual Bottle Reminder

**Date:** 2026-05-23
**Status:** Complete and committed.

## What changed

### babyService.js
- Added `getWeeklySettings(familyId, babyId, weekStartDate)` — one-time `getDoc` read from `families/{familyId}/babies/{babyId}/weeklySettings/{weekStartDate}`. Returns null if the document does not exist.
- Added `setWeeklySettings(familyId, babyId, weekStartDate, fields, member)` — reads the doc first, then `updateDoc` if it exists or `setDoc` if it doesn't. Preserves `createdAt`/`createdByUserId`/`createdByLabel` on creation; updates `updatedAt`/`updatedByUserId`/`updatedByLabel` on every write.

### src/entries/useWeeklySettings.js (new)
- Module-level singleton composable. Maintains a `reactive({})` cache keyed by `${familyId}:${babyId}:${weekStartDate}`.
- `loadWeekSettings(weekStartDate)` — one-time getDoc, de-duplicated with a pending Set. Safe to call on every mount of CareWeekSegment.
- `getBottleAmount(weekStartDate)` — reads from cache; returns null until loaded (reactive, so templates update when data arrives).
- `saveBottleAmount(weekStartDate, amountMl)` — writes via babyService, then updates cache.
- **No Firestore listeners** — only `getDoc` reads and `setDoc`/`updateDoc` writes.
- **Cache safety on baby switch** — keys embed `activeBabyId`, so stale entries are never accessed after a switch. No explicit invalidation needed.

### CareWeekSegment.vue
- Imports `useWeeklySettings`; calls `loadWeekSettings` in `onMounted`.
- Adds a "usual bottle" sub-row below the toggle header, always visible while the week segment is rendered.
- Display: "Usual bottle: 80 mL" or "Usual bottle: not set".
- Inline edit: tap Edit → number input (0–500 mL, blank to clear) + Save/× buttons + disclaimer text + error state.
- Enter key saves; Escape cancels. Input auto-focuses on open.

### HelpView.vue
- Added "Usual bottle" card: "Usual bottle is an optional parent-entered reminder for the week. It does not calculate, recommend, or replace medical feeding guidance."

### docs/backlog/export.md
- Added note that future CSV export should join `usualBottleAmountMl` from `weeklySettings` by week.

## Firestore read behavior
- Reads: one `getDoc` per unique weekStartDate per session (cached after first load).
- Writes: one `getDoc` + one `updateDoc`/`setDoc` per save.
- No `onSnapshot` listeners added anywhere in this phase.

## Firestore rules note
The `weeklySettings` subcollection is nested under `babies`, which is nested under `families`. Existing rules for the private rebuild may already allow reads/writes by authenticated family members. If rules are restrictive, add a rule matching `families/{familyId}/babies/{babyId}/weeklySettings/{weekStartDate}` allowing read/write by authenticated members of that family. This is not changed in this phase per the hard restriction on rule changes.

## Not implemented (by design)
- New entry auto-fill from usual bottle amount — deferred. `buildNewEntryDefaults` is unchanged.
- Medical language — none used. Copy says "Optional reminder", "does not calculate or recommend intake".
