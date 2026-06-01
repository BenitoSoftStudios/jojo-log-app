# Phase 9G-1 — Fix secondary page headers and bottom spacing

## Summary

Hotfix for the visual regression introduced in Phase 9G. The `padding-top: env(safe-area-inset-top)` + `:deep(.back-btn)` approach made back arrows float above titles on Trends, Manage Caregivers, Baby Settings, and other secondary pages. This patch replaces the broken per-page header markup with a single shared `SecondaryHeader.vue` component using a proper three-cell layout, and restores AppLayout to a clean fixed-height header without the broken safe-area padding.

The Phase 9G bottom sheet work (Rx Medication and Tummy Time) is fully preserved and unchanged.

---

## Changed files

| File | Change |
|------|--------|
| `src/ui/SecondaryHeader.vue` | **New** — three-cell header component: 44px back btn / flex-1 centered title / 44px spacer |
| `src/ui/AppLayout.vue` | Removed broken `padding-top: env(safe-area-inset-top, 0)` from `.app-header`; restored `height: var(--header-height)` on `.app-header`; `.header-inner` now uses `height: 100%`; removed `:deep(.back-btn)` rule |
| `src/settings/ProfileView.vue` | Uses `SecondaryHeader`; removed local `.back-btn` / `.header-title` CSS |
| `src/settings/SettingsView.vue` | Uses `SecondaryHeader`; removed local `.back-btn` / `.header-title` CSS |
| `src/babies/BabySettingsView.vue` | Uses `SecondaryHeader`; removed local `.back-btn` / `.header-title` CSS |
| `src/charts/GraphView.vue` | Uses `SecondaryHeader`; removed local `.back-btn` / `.header-title` CSS |
| `src/help/HelpView.vue` | Uses `SecondaryHeader`; removed local `.back-btn` / `.header-title` CSS |
| `src/families/ManageCaregiversView.vue` | Uses `SecondaryHeader`; removed local `.back-btn` / `.header-title` CSS |
| `src/families/InviteFamilyMemberView.vue` | Uses `SecondaryHeader`; removed local `.back-btn` / `.header-title` CSS |
| `src/admin/LegacyImportView.vue` | Uses `SecondaryHeader`; removed local `.back-btn` / `.header-title` CSS |
| `src/entries/RecentlyDeletedView.vue` | Uses `SecondaryHeader`; removed local `.back-btn` / `.header-title` CSS |

---

## Header layout fix summary

`SecondaryHeader.vue` implements the required three-cell layout:

```text
[sec-back: width 44px]  [sec-title: flex 1, text-align center]  [sec-spacer: width 44px]
```

- `.sec-back`: `width: 44px; min-height: 44px; display: flex; align-items: center; justify-content: center` — meets 44×44 tap target requirement without relying on `:deep`
- `.sec-title`: `flex: 1; text-align: center` — title is visually centered against the 44px back button because the right spacer mirrors the left cell width
- `.sec-spacer`: `width: 44px` — balances the title centering; aria-hidden
- `AppLayout.app-header` is now `height: var(--header-height)` with no padding — back arrow and title always share one clean horizontal row
- All 9 secondary pages use `<SecondaryHeader title="…" />` with no per-page header hacks

---

## Bottom spacing fix summary

`AppLayout.app-main` keeps `padding-bottom: calc(var(--space-12) + env(safe-area-inset-bottom, 0))` from Phase 9G — this provides 48px minimum bottom breathing room and iOS home indicator clearance. No changes were made to bottom spacing behavior. Baby Settings Save button scrolls freely above browser chrome.

---

## Confirmation that Rx/Tummy bottom sheets were preserved

`src/entries/CareEntryRow.vue` was not touched. The `AppSheet` bottom sheets for Rx Medication and Tummy Time remain fully intact, including:
- `medSheetOpen` / `ttSheetOpen` refs
- `openMedSheet()` / `openTtSheet()` openers
- `saveMed()` / `clearMed()` / `saveTt()` / `clearTt()` actions
- Compact row display (`medNoteCue`, `★ Nm` tummy cue)
- `AppSheet` safe-area bottom padding

---

## Tests result

**354 tests passing** (`npm test`). No new tests needed — all changes are template/CSS only.

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

- `index.html` does not include `viewport-fit=cover`, so `env(safe-area-inset-top)` evaluates to 0 on all devices. If notch support is ever needed, add `viewport-fit=cover` to the viewport meta and re-evaluate header padding at that time.
- The right spacer (`sec-spacer`) is always 44px. On pages where the title is long it may clip with `text-overflow: ellipsis`. No titles in the current app are long enough to trigger this.

---

## Commit hash

See `git log` after push.

## Main synced with origin/main

Yes — main is up to date with origin/main before this commit.

## Vercel redeploy expected

Yes — 11 source files changed (1 new component + 9 secondary pages + AppLayout).
