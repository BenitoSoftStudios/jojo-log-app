# Phase 9G — Navigation shell and quick-action bottom sheets

## Summary

Two-part mobile polish pass. Part 1: `AppLayout.vue` now applies `env(safe-area-inset-top)` to the sticky header so secondary-page back arrows never sit flush against browser chrome, and a `:deep(.back-btn)` rule ensures every back button in the app gets a 44×44 minimum tap target — no per-page changes required. Part 2: the inline Tummy Time and Rx Medication edit forms have been removed from `CareEntryRow.vue` and replaced with `AppSheet` bottom sheets; the existing `AppSheet` component (with `teleport`, safe-area bottom padding, and slide animation) is reused for both.

---

## Changed files

| File | Change |
|------|--------|
| `src/ui/AppLayout.vue` | Added `padding-top: env(safe-area-inset-top, 0)` to header; moved `height` from `.app-header` to `.header-inner`; added `:deep(.back-btn)` for 44×44 tap target; updated `.app-main` bottom padding to include `env(safe-area-inset-bottom, 0)` |
| `src/entries/CareEntryRow.vue` | Removed inline med-form and tt-form HTML/CSS; added `AppSheet` for Medication and Tummy Time; replaced `openMedForm`/`openTtForm` with `openMedSheet`/`openTtSheet`; imported `nextTick` for input auto-focus |

---

## Secondary header / page shell summary

- `AppLayout.vue` header is now `padding-top: env(safe-area-inset-top, 0)` + fixed `height: var(--header-height)` in `.header-inner`. On devices with a notch or top browser chrome, the 68 px content band sits cleanly below the safe area; on devices without, it is unchanged.
- `:deep(.back-btn)` in AppLayout scoped CSS adds `min-width: 44px; min-height: 44px; display: flex; align-items: center; justify-content: center` to every back arrow across all secondary pages (My Profile, Settings, Baby Settings, Trends, Help & Legend, Manage Caregivers, Invite Member, Import CSV, Recently Deleted) without touching any of those files.
- All pages were confirmed to use `<router-link class="back-btn">` inside `AppLayout`'s `#header` slot, so `:deep` reaches them all.
- Header title (right of back button) stays in the natural flex flow; it is not cramped.

---

## Safe area behavior summary

- Header: `padding-top: env(safe-area-inset-top, 0)` — content never overlaps notch or browser top chrome.
- Footer/main: `padding-bottom: calc(var(--space-12) + env(safe-area-inset-bottom, 0))` — 48 px minimum bottom breathing room plus iOS home indicator clearance.
- `AppSheet` already carried `padding-bottom: env(safe-area-inset-bottom, 0)` on the panel — unchanged, still effective for all sheets.

---

## Tummy Time bottom sheet summary

- Tapping ★ calls `openTtSheet()`, which opens `AppSheet` with title "How long was Tummy Time?"
- Sheet shows large minute/second numeric inputs centred in the panel.
- Hint text below inputs: "Leave blank to record the session without a duration."
- **Save**: stores `tummyTime: true, tummyTimeCount: 1, tummyTimeDurationSeconds: total > 0 ? total : null`. Zero or blank inputs = session tracked without duration (null).
- **Clear Tummy Time** (visible only when `tummyActive`): stores `tummyTime: false, tummyTimeCount: 0, tummyTimeDurationSeconds: null`.
- **Cancel**: closes sheet, no write.
- Ledger row no longer expands; it stays compact at all times.
- Data model (`tummyTime`, `tummyTimeCount`, `tummyTimeDurationSeconds`) unchanged.
- Historical `tummyTimeCount > 0` entries still display as one session.

---

## Rx Medication bottom sheet summary

- Tapping Rx calls `openMedSheet()`, which opens `AppSheet` with title "Medication details".
- Sheet shows a full-width text input (placeholder: `Name, dosage`, maxlength 200) that auto-focuses via `nextTick`.
- **Save with text**: `medication: true, medicationNote: trimmed text`.
- **Save blank**: `medication: true, medicationNote: null` (still recorded).
- **Clear Medication** (visible only when `entry.medication`): `medication: false, medicationNote: null`.
- **Cancel**: closes sheet, no write.
- `medNoteCue` compact cue on the Rx button (up to 10 chars + "…") is unchanged.
- Data model (`medication`, `medicationNote`) unchanged.

---

## Entry Details behavior summary

- `EntryDetailSheet.vue` not modified.
- Save Entry above Delete Entry — unchanged.
- X close path: `AppSheet` fires `update:modelValue = false`; textarea `@blur` flushes pending notes before focus leaves — unchanged.
- Delete Entry with confirmation — unchanged.
- All entry types (medication-only, diaper-only, tummy-only, note-only) unaffected.

---

## Permission / data model impact

- No new Firestore fields.
- No new Firestore listeners.
- No Firestore rules changes.
- Data model for all entry fields unchanged.

---

## Tests result

**354 tests passing** (`npm test`). No new tests added — no pure-logic changes were made; all changes are UI/template.

---

## Build result

`npm run build` — clean (0 errors). Pre-existing chunk size advisory unchanged.

---

## Safety confirmations

- No feeds path changed ✓
- No Firestore rules/indexes changed ✓
- No migration or bulk data mutation ✓
- No new Firestore listeners ✓
- `grep -r "deleteDoc" src/` — no matches ✓
- No PWA/Capacitor/SW/manifest ✓
- No image upload / Firebase Storage / external image URLs ✓
- No medical recommendation language ✓
- No new dependencies ✓

---

## Known issues or follow-ups

- iOS Safari keyboard behaviour: when the keyboard appears over the Medication sheet, the sheet slides up with the viewport in most configurations. The form is compact (input + buttons), so Save remains visible or near-visible with minimal scrolling. Full `env(keyboard-inset-height)` handling is not implemented as it is not yet widely standardised.
- On landscape iPhone, the TT sheet with keyboard open may require scrolling to reach the Save button. Acceptable for a first pass.
- The `openMedSheet` / `openTtSheet` functions now simply return if the sheet is already open (no toggle-close). This means tapping Rx while the sheet is open has no effect. Closing must be done via ✕, backdrop tap, or Cancel. This is intentional and consistent with standard sheet UX.

---

## Commit hash

See `git log` after push.

## Main synced with origin/main

Yes — merged before implementing.

## Vercel redeploy expected

Yes — 2 source files changed.
