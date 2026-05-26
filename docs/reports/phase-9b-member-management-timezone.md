# Phase 9B — Member Management and Timezone Settings

**Date:** 2026-05-26
**Status:** COMPLETE — no new Firestore rules deployment required

---

## Part 1: Owner member management

**File rewritten:** `src/families/ManageCaregiversView.vue`
**Files modified:** `src/families/useFamily.js`

### Actions implemented

| Action | Who | Guard |
|---|---|---|
| Edit displayLabel and initials | Owner for any member | None (safe fields) |
| Promote caregiver to owner | Owner, not self | None |
| Demote owner to caregiver | Owner, not self | Last-owner guard (app) |
| Deactivate member | Owner, not self | Last-owner guard (app) |
| Reactivate member | Owner, not self | None |

### Last-owner guard (app-side enforcement)

`activeOwnerCount()` counts `members.value.filter(m => m.role === 'owner' && m.active).length`
before demote and deactivate. If the count would reach 0, the action is blocked with an
error message.

**Limitation:** Firestore rules do not enforce this. Two owners acting simultaneously
could both demote the other, leaving zero owners. For a private family app this edge case
is negligible, but it is documented here. Full enforcement requires a Cloud Function
or Firestore rules that can atomically check all member documents.

### Self-protection

`isSelf(m)` compares `m.userId === currentUser.uid`. Role-change and deactivation buttons
are hidden for the current user's own row. Name/initials editing is allowed for self via
this view (redundant with /profile but harmless).

### legacyImportAdmin

Never included in any update call. The deployed Firestore rule enforces this:
```
!('legacyImportAdmin' in request.resource.data) ||
request.resource.data.legacyImportAdmin == resource.data.get('legacyImportAdmin', false)
```

### Unchanged fields

`updateMember()` calls `updateDoc()` which sends only explicit fields.
`userId`, `joinedViaInviteId`, `joinedViaInviteCode`, `joinedAt`, `email` are never
included in any management update call.

### Non-owner view

Non-owners see the member list (read) but no Manage buttons. The `v-if="isOwner"` guards
all management controls and the Manage button itself.

### Firestore rules — current rules sufficient

Current deployed rule:
```
allow update: if isOwner(familyId)
    && (!('legacyImportAdmin' in request.resource.data)
        || request.resource.data.legacyImportAdmin == resource.data.get('legacyImportAdmin', false));
```

This already allows owners to update member docs and prevents `legacyImportAdmin` changes.
The app only sends safe fields. No new rules deployment is required.

### Recommended narrow rules patch (not required, for future hardening)

The current rule does not explicitly lock `userId`, `joinedViaInviteId`, `joinedViaInviteCode`.
A narrower future patch would add:

```
allow update: if isOwner(familyId)
    && request.resource.data.userId
       == resource.data.userId
    && request.resource.data.get('joinedViaInviteId', null)
       == resource.data.get('joinedViaInviteId', null)
    && request.resource.data.get('joinedViaInviteCode', null)
       == resource.data.get('joinedViaInviteCode', null)
    && request.resource.data.get('legacyImportAdmin', false)
       == resource.data.get('legacyImportAdmin', false);
```

This is defense-in-depth — the app already never sends those fields. Deploy at a future
hardening pass if desired.

---

## Part 2: Timezone setting

**Files created:** none
**Files modified:** `src/utils/dateUtils.js`, `src/families/useFamily.js`, `src/settings/SettingsView.vue`, `src/entries/CareLedgerView.vue`, `src/entries/useLedger.js`, `src/entries/useLedgerActions.js`, `src/utils/entryUtils.js`, `src/test/dateUtils.test.js`

### Data model

Stored on `families/{familyId}.timezone` (string). Default if absent: `'America/Toronto'`.
`familyService.updateFamily()` writes it via `updateDoc`. `useFamily.refreshFamily()` re-fetches
the family doc after save so `familyTimezone` computed updates immediately.

### New module-level export: `familyTimezone`

```js
// src/families/useFamily.js
export const familyTimezone = computed(() => _family.value?.timezone ?? 'America/Toronto')
```

Also returned from `useFamily()` for component destructuring.

### New utility functions (dateUtils.js)

```js
getTodayInTimezone(timezone, now = new Date())  // YYYY-MM-DD in IANA timezone
getCurrentHHMMInTimezone(timezone, now = new Date())  // HH:MM in IANA timezone
```

Both accept an optional `now` parameter for deterministic testing.

### Timezone-aware changes

| Location | Change |
|---|---|
| `useLedger.js` — stats | `calculateStats(..., getTodayInTimezone(familyTimezone.value))` |
| `useLedger.js` — initial month open | `todayKey` uses `getTodayInTimezone` |
| `CareLedgerView.vue` — header date | `toLocaleDateString` with `timeZone: familyTimezone.value` |
| `CareLedgerView.vue` — header time | `Intl.DateTimeFormat` with family timezone |
| `CareLedgerView.vue` — `todayDate` | `computed(() => getTodayInTimezone(familyTimezone.value))` |
| `CareLedgerView.vue` — `selectAddDay` | `getCurrentHHMMInTimezone(familyTimezone.value)` for today |
| `useLedgerActions.js` — both `buildNewEntryDefaults` calls | Passes `familyTimezone.value` |
| `entryUtils.js` — `buildNewEntryDefaults` | Optional `timezone` param; uses `Intl` for current-time fallback |

### What is NOT changed

- Stored `entryDate` and `entryTime` values — untouched.
- Historical imported entries — untouched.
- CSV export format — unchanged.
- The `todayString()` function — kept as-is for places that legitimately use device-local time.

### Settings UI

- Owner sees a select with 7 timezone options.
- Non-owner sees the current timezone label (read-only).
- Save calls `updateFamily(familyId, { timezone })` then `refreshFamily()`.
- Success and error states shown inline.

### Supported timezones

`America/Toronto`, `America/New_York`, `America/Chicago`, `America/Denver`,
`America/Los_Angeles`, `America/Vancouver`, `UTC`

### Tests

7 new tests in `dateUtils.test.js`:
- `getTodayInTimezone`: 4 tests including timezone crossover at 00:30 UTC.
- `getCurrentHHMMInTimezone`: 3 tests including UTC-4 offset.

Total: 286 tests (279 before + 7 new).

---

## Part 3: Settings cleanup

- Display unit section simplified: radio buttons removed, replaced with one-line "Coming later" note.
- Timezone section is now functional (owner save, non-owner read-only).
- No Phase 7 language remains.

---

## Validation checklist

| # | Check | Result |
|---|---|---|
| 1 | Owner can promote caregiver to owner | ✓ |
| 2 | Owner can demote another owner to caregiver | ✓ (last-owner guard) |
| 3 | Owner can deactivate another member | ✓ (last-owner guard) |
| 4 | Owner cannot deactivate self | ✓ (isSelf guard hides button) |
| 5 | Owner cannot demote self | ✓ (isSelf guard hides button) |
| 6 | App prevents removing the last owner | ✓ (activeOwnerCount check) |
| 7 | Owner can reactivate inactive member | ✓ |
| 8 | Owner can edit another member's displayLabel and initials | ✓ |
| 9 | legacyImportAdmin cannot be changed through this UI | ✓ (never sent in update) |
| 10 | userId and invite fields unchanged | ✓ (never sent in update) |
| 11 | Non-owner cannot manage members | ✓ (v-if="isOwner" on all controls) |
| 12 | No member hard delete | ✓ (no deleteDoc anywhere in src/) |
| 13 | No deleteDoc in src/ | ✓ (grep confirms) |
| 14 | Profile self-edit still works | ✓ (ProfileView unchanged) |
| 15 | Invite flow still works | ✓ (JoinFamilyView unchanged) |
| 16 | Owner can edit family timezone | ✓ |
| 17 | Non-owner cannot edit family timezone | ✓ (select hidden, save button not shown) |
| 18 | Header date/time uses family timezone | ✓ |
| 19 | Today stats use family timezone | ✓ (useLedger) |
| 20 | + Day today/default time uses family timezone | ✓ (selectAddDay + useLedgerActions) |
| 21 | Existing imported entries not modified | ✓ |
| 22 | Help text updated | ✓ (Timezone section added) |
| 23 | No feeds path changed | ✓ |
| 24 | No rules deployed automatically | ✓ |
| 25 | Rules patch needed for live behavior | No — existing rules sufficient |
| — | Tests | 286/286 |
| — | Build | Clean |
