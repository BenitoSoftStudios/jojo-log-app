# Phase 6.3 — Baby Management Report

**Date:** 2026-05-23
**Status:** Complete and committed.

## What changed

### useBabies.js
- Added `_familyId` module-level var; set in `loadBabies`, cleared in `clearBabies`.
- Added `createBabyForFamily(fields, ownerUid)` — calls `babyService.createBaby`, appends to local `_babies`, calls `selectBaby`. No new Firestore listeners.
- Added `updateActiveBaby(changes)` — calls `babyService.updateBaby`, patches local `_babies` in-place.
- Added `archiveActiveBaby()` — sets `status: inactive` on the active baby, switches to the next active baby if one exists, otherwise clears `_activeBabyId` and removes `jojo_babyId` from localStorage.
- All three new functions guard against null `_familyId` and `_activeBabyId`.

### BabySettingsView.vue
- Replaced placeholder script with real composable wiring (`useBabies`, `useFamily`, `useRouter`).
- Form fields (nickname, birthdate, interval) sync from `activeBaby` via `watch`.
- Save calls `updateActiveBaby`; shows "Saved." feedback for 2s.
- Age in weeks computed from `birthdate`; shows "Birthdate not set" if absent.
- Archive card visible only to owners. Requires confirmation. Calls `archiveActiveBaby` then navigates to `/`.
- Empty state shown if `activeBaby` is null.

### CareLedgerView.vue
- Imported `BabySwitcher`, `AppButton`.
- Added `selectBaby`, `createBabyForFamily` to useBabies destructure.
- Header row 1: shows `BabySwitcher` pill row when multiple active babies exist, plain nickname label otherwise, "No active baby" when none.
- `+ Day` button hidden when no active baby.
- Main content: wraps ledger in `v-if="activeBaby"`, shows "No active baby" empty state if none (with hint to owners to use the menu).
- Menu: "Baby Settings" link unchanged; "+ Add Baby" button added below it, owner-only.
- Add Baby sheet: nickname (required) + birthdate (optional); calls `createBabyForFamily`.

## Architecture notes
- Baby switching reuses the existing `watch([familyId, activeBabyId])` in `useEntries` — no new Firestore listeners.
- All writes flow through `babyService.js` → Firestore `families/{id}/babies/{id}`.
- No feeds path. No deleteDoc. No Firestore rules/indexes changed.

## Constraints honored
- Non-owners cannot see "+ Add Baby" or the archive card in BabySettingsView.
- No hard delete of babies or entries.
- No animal picker, no weekly bottle amount, no export.
