# Phase 6.4C — Weekly Usual Bottle Save Fix

**Date:** 2026-05-24
**Status:** Complete and committed.

## Root cause

Two iOS-specific failures caused consistent "does not save" on mobile:

1. **`type="number"` unreliable `input` event on iOS.** iOS does not always fire the `input` event for `type="number"` inputs, particularly when the user enters a value and the keyboard is still shown. Vue's `v-model` depends on `input` events, so `editVal.value` could remain stale/empty when `handleSave` ran. `parseInt('')` returns `NaN`, `parsed` falls through to `null`, and Firestore writes `usualBottleAmountMl: null` — a successful write that stored the wrong value. Display reverts to "not set" immediately, and reload confirms null.

2. **Ghost click after keyboard dismissal.** When the virtual keyboard is up and the user taps the Save button, iOS dismisses the keyboard first. The layout reflows during dismissal. The `click` event fires at the original tap coordinates, which no longer corresponds to the Save button. `handleSave` never fires. No error is shown because nothing ran.

Both failures are consistent on iOS Safari. The race condition fix in 6.4B was correct but did not address either of these.

## What changed

### CareWeekSegment.vue

- **Input `type` changed from `number` to `text`** with `inputmode="numeric"` and `pattern="[0-9]*"`. This shows the iOS numeric keypad while using the reliable `input`-event path of a text input. `v-model` sync is now consistent.
- **Added `initialEditVal` ref** — tracks the value string when editing started.
- **Updated `startEdit`** — sets both `editVal` and `initialEditVal`.
- **Updated `cancelEdit`** — resets `initialEditVal`.
- **Added `handleInputBlur`** — fires on input blur. Saves only if the value changed from `initialEditVal` and is valid (0–500 or blank). Deferred 150 ms to let the Save button's `click` fire first. If `saving` is already true (explicit Save ran), the deferred callback is a no-op. This handles the ghost-click case: keyboard dismiss → blur → deferred save.
- **`handleSave` success path** now resets `initialEditVal` to prevent a stale blur from re-saving.

## Behaviour unchanged

- Enter key saves.
- Escape cancels.
- Save button remains primary path.
- Error messages: missing context, permission-denied, and try-again are unchanged from 6.4B.
- Race condition guard from 6.4B (loadWeekSettings does not overwrite a save) is unchanged.

## No Firestore rules changes.
