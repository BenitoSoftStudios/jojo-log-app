# Phase 9B-1 — Login Loop Fix and Usual Bottle Auto-fill Removal

**Date:** 2026-05-27
**Status:** COMPLETE — no Firestore rules deployment required, no index changes

---

## Goal 1: Fix login/profile setup loop

### Symptom

Existing users were being routed to `/setup-profile` (the "Your display label" screen)
after Phase 9B. Although the router guard's fast path succeeds for active members with a
`displayLabel`, two failure modes could strand existing users on the setup screen and,
critically, route them to `/family-setup` where a duplicate family document would be created.

### Root cause

`SetupProfileView.vue` had two related bugs:

**Bug A — Form rendered before family state is known.**
The component rendered the form immediately (no loading gate). A user who landed on
`/setup-profile` due to a transient Firestore error or a cache miss would see the form
before `loadFamily` completed. If they submitted quickly, `familyId.value` would still be
`null` and the submit handler would take the new-user path.

**Bug B — `handleSubmit` treats any `familyId === null` as "new user".**
If `loadFamily` threw (permission error, network failure, index missing), `_error.value`
was set but `familyId.value` stayed `null`. The submit handler checked only
`if (familyId.value)` — so a failed load was indistinguishable from a genuine new user,
and the member was routed to `/family-setup` → `createFamily` → duplicate family doc.

### Fix

**File modified:** `src/auth/SetupProfileView.vue`

| Change | Detail |
|---|---|
| Added `checking: ref(true)` | Template hides the form while `loadFamily` runs |
| `onMounted` always awaits `loadFamily` | Ensures family/member state is resolved before any form is shown |
| Immediate redirect if `hasDisplayLabel` | Existing members with a label are sent to `/` before they see the form |
| `handleSubmit` guards `familyError` | If `loadFamily` threw, blocks the new-family path and shows an error message |
| Destructures `error: familyError` | Reads `useFamily._error` to distinguish a load failure from a confirmed no-family state |

#### Decision logic in `handleSubmit`

| State after `onMounted` | Action |
|---|---|
| `familyId.value` is set | `updateMember` → push `/` (existing member path) |
| `familyId.value` null + `familyError` set | Show error "Could not verify your account. Reload." — do NOT go to `/family-setup` |
| `familyId.value` null + no error | `pendingLabel` → push `/family-setup` (confirmed new user) |

### What is NOT changed

- `src/app/router.js` — router guard unchanged; direct Firestore calls still used
- Firestore rules — not touched, not deployed
- Firestore indexes — unchanged
- `ProfileView.vue` — unchanged (existing member self-edit; caregivers still get
  permission-denied if rules patch not deployed — that is a separate known limitation
  documented in the Phase 9A report)

### Limitation: caregiver self-edit still blocked by rules

`updateMember` for `familyId.value`-path calls from `SetupProfileView` will fail with
`permission-denied` for caregivers because the Firestore rules allow `update` only for
owners. This pre-existing limitation requires a rules patch (documented in Phase 9A). It
is tracked but NOT fixed here because it requires a Firestore deployment, which is out of
scope for this phase.

---

## Goal 2: Remove usual bottle auto-fill from new entries

### Symptom

`+ Add Entry` and `+ Day` pre-filled `amountMl` from the weekly "Usual bottle" value.
This was unintended — the usual bottle is meant to be a weekly reminder display only,
not an input that flows into new entries.

### Fix

**File modified:** `src/utils/entryUtils.js`

Changed `buildNewEntryDefaults`:

```js
// Before
amountMl: weeklySettings?.usualBottleAmountMl ?? null,

// After
amountMl: null,
```

The `weeklySettings` parameter is still accepted by the function (callers in
`useLedgerActions.js` still pass it) but is now unused for `amountMl`. The parameter is
kept to avoid a signature change that would touch more files than needed.

**File modified:** `src/help/HelpView.vue`

Added one sentence to the "Usual bottle" help section:

> "It does not auto-fill new entries — amount fields always start blank."

### What is NOT changed

- `useLedgerActions.js` — still loads `weekSettings` and passes it to
  `buildNewEntryDefaults`; the load is now a no-op for the auto-fill path but harmless.
  Cleanup is optional future work.
- Weekly Usual bottle display and edit — fully intact
- CSV export format — unchanged
- `buildStartNextDayEntry` — already returns `amountMl: null`, unchanged

### Optional future work

If auto-fill is desired in the future, a per-family setting (default off) should be added
rather than hard-coding it. The hook point is the `weeklySettings` parameter already
present in `buildNewEntryDefaults`.

---

## Validation checklist

| # | Check | Result |
|---|---|---|
| 1 | Existing member with displayLabel reaches ledger | ✓ (redirected from onMounted before form shows) |
| 2 | Existing member without displayLabel sees setup form | ✓ (form shown after loadFamily, no displayLabel → not redirected) |
| 3 | New user (no family) can proceed to /family-setup | ✓ (null familyId + no error → new user path) |
| 4 | Firestore error does not create duplicate family | ✓ (familyError guard blocks /family-setup on load failure) |
| 5 | Form hidden while family state is loading | ✓ (checking ref gates form render) |
| 6 | + Day amountMl is null | ✓ (buildNewEntryDefaults returns null) |
| 7 | + Add Entry amountMl is null | ✓ (buildNewEntryDefaults returns null) |
| 8 | Usual bottle display unchanged | ✓ (useLedger and CareWeek unchanged) |
| 9 | Usual bottle edit unchanged | ✓ (useWeeklySettings unchanged) |
| 10 | CSV export unchanged | ✓ (csvExporter unchanged) |
| 11 | Help text updated | ✓ (auto-fill note added) |
| 12 | No deleteDoc in src/ | ✓ |
| 13 | No feeds path touched | ✓ |
| 14 | No Firestore rules deployed | ✓ |
| 15 | No Firestore indexes changed | ✓ |
| — | Tests | All passing |
| — | Build | Clean |
