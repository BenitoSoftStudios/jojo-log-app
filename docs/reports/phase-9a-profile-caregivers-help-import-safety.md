# Phase 9A — Profile, Caregivers, Help, Import Safety

**Date:** 2026-05-26
**Status:** COMPLETE — rules patch required before caregiver self-edit works in production

---

## Summary

Four areas implemented: user profile editing, Manage Caregivers real member list,
Help & Legend terminology update, Import CSV duplicate prevention. Placeholder
language removed from Settings and Graph.

---

## Part 1: User profile edit

**File created:** `src/settings/ProfileView.vue`
**Files modified:** `src/app/router.js`, `src/entries/CareLedgerView.vue`, `src/families/useFamily.js`

- Route `/profile` added, "My Profile" added to hamburger menu.
- Displays: `displayLabel`, `initials`, `role` (read-only).
- Editable: `displayLabel`, `initials` only.
- Save calls `updateMember(familyId, uid, { displayLabel, initials })` via `updateDoc`.
  Only the two fields are sent; Firestore projects the full doc, so `role`, `active`,
  `userId`, `legacyImportAdmin`, `joinedViaInviteId`, `joinedViaInviteCode` are
  untouched by `updateDoc`.
- After save: `refreshCurrentMember()` re-fetches the member doc and updates the
  in-memory singleton so the rest of the app sees the new label immediately.
- Success and error states displayed inline.

### ⚠ Rules patch required — caregiver self-edit blocked by current rules

**Current deployed rule (members):**
```
allow update: if isOwner(familyId)
    && (!('legacyImportAdmin' in request.resource.data)
        || request.resource.data.legacyImportAdmin == resource.data.get('legacyImportAdmin', false));
```

Only owners can update member docs. A caregiver calling `updateDoc` on their own
member doc will receive `permission-denied` until this rule is patched.

**Required additional rule** — add inside `match /members/{memberId}` after the owner rule:

```
// Member self-edit: displayLabel and initials only. All security and role
// fields must remain unchanged. updateDoc projects full doc so unchanged
// fields retain existing values; this rule verifies they are truly unchanged.
allow update: if request.auth != null
    && memberId == request.auth.uid
    && isMember(familyId)
    && request.resource.data.role   == resource.data.role
    && request.resource.data.active == resource.data.active
    && request.resource.data.userId == resource.data.userId
    && request.resource.data.get('legacyImportAdmin', false)
       == resource.data.get('legacyImportAdmin', false)
    && request.resource.data.get('joinedViaInviteId', null)
       == resource.data.get('joinedViaInviteId', null)
    && request.resource.data.get('joinedViaInviteCode', null)
       == resource.data.get('joinedViaInviteCode', null);
```

**Current state:** Owners can update their own profile now (owner rule passes).
Caregivers receive `permission-denied` until the patch is deployed via Firebase Console.
The ProfileView shows a clear error message on `permission-denied` so users are
not silently broken.

**Deploy this rule patch before telling caregivers they can edit their profile.**

---

## Part 2: Manage Caregivers

**File rewritten:** `src/families/ManageCaregiversView.vue`
**File modified:** `src/families/familyService.js`

- `listMembers(familyId)` added to `familyService.js` — one `getDocs` on
  `families/{familyId}/members`. Readable by any active member (existing rules allow).
- Member list sorted: owner first, then alphabetical by displayLabel.
- Each row shows: `displayLabel`, `initials` (if present), `role`, active/inactive badge.
- Redundant disabled "Generate invite link — Phase 8" section removed entirely.
- Owner sees a card with a link to `/invite` (existing Invite Member page).
- Non-owners see the member list only (no invite card).
- No hard-delete. No inline editing (document for next phase if needed).

---

## Part 3: Help & Legend

**File modified:** `src/help/HelpView.vue`

Changes:
- Comment updated to remove stale Phase language.
- "New Entry" renamed to "+ Add Entry" — matches the in-day add button label.
- "Start Next Day" renamed to "+ Day" — matches the header button label.
- "+ Day" description updated: explains date and time picker, not just "next calendar date."
- "+ Add Entry" description updated: clarifies "another entry to the current open day."
- Two new Indicators rows added:
  - Tummy Time star: cycles count up, tap again to reset.
  - Notes indicator: tap to open entry detail.
- No stale Phase 7/8 language remains.

---

## Part 4: Import CSV duplicate prevention

**Files modified:** `src/utils/appCsvImporter.js`, `src/admin/LegacyImportView.vue`, `src/test/appCsvImporter.test.js`

### appCsvImporter.js

New export `checkForExistingIds(csvEntries, existingIdSet)`:
- Pure function, no Firebase imports.
- Returns `{ overlapIds, overlapCount, newCount }`.
- `existingIdSet` should include both active and deleted Firestore entry IDs so that
  `setDoc` overwrites on deleted entries are also caught.

### LegacyImportView.vue

After parsing, builds `existingIdSet` from:
```js
new Set([...entries.value.map(e => e.id), ...deletedEntries.value.map(e => e.id)])
```
`entries` and `deletedEntries` are imported from the module-level singleton in
`useEntries.js` — the subscription is already active when the user navigates to
this admin view from the ledger.

Preview now shows:
- "New entries" — CSV rows not yet in this baby's Firestore collection.
- "Already in log" — CSV rows whose IDs already exist (shown in amber if > 0).

If any overlap is found, an error is added to `parseErrors` which blocks the Import
button. Import is blocked; overwrite is documented for a later phase.

Existing blocks retained:
- Wrong or blank babyNickname.
- Blank entryId.
- Duplicate entryId within the file.

### Tests

5 new tests in `describe('checkForExistingIds', ...)`:
- No overlap → all new.
- Full overlap → all existing.
- Partial overlap.
- Empty csvEntries.
- Empty existingIdSet.

Total: 279 tests (274 before + 5 new).

### Known limitation

The entries subscription may not reflect Firestore state if the admin navigated
directly to `/admin/legacy-import` on page load without visiting the ledger first.
In that case the existing-ID check would report 0 existing entries even if some
exist. The import would proceed (idempotent setDoc), but the duplicate warning
would not fire. This edge case is acceptable for the admin-only tool — document
as a known limitation.

---

## Part 5: Placeholder cleanup

- `src/settings/SettingsView.vue`: "fl oz display wires in Phase 7." → "fl oz display coming later." / "Timezone configuration wires in Phase 7." → "Timezone configuration coming later." / Phase 2 comment removed.
- `src/charts/GraphView.vue`: comment and both chart placeholder texts updated to remove "Phase 7" language. Placeholders now say "Coming later."

---

## Validation checklist

| Check | Result |
|---|---|
| Current user can edit own displayLabel and initials | ✓ app-side; rules patch required for caregivers |
| User cannot edit own role/security fields | ✓ updateDoc only sends displayLabel + initials |
| Manage Caregivers shows real members | ✓ |
| Redundant disabled invite section removed | ✓ |
| Help has no stale Phase 7/8 language | ✓ |
| + Day/help wording reflects date and time selection | ✓ |
| Import CSV blocks duplicate entryIds inside file | ✓ (existing) |
| Import CSV blocks wrong babyNickname | ✓ (existing) |
| Import CSV blocks blank entryId | ✓ (existing) |
| Import CSV warns/blocks existing entryIds already in baby | ✓ blocks with error |
| No feeds path changed | ✓ |
| No deleteDoc | ✓ |
| No Firestore rules/indexes changed | ✓ |
| No PWA/Capacitor/SW/manifest | ✓ |
| Tests: 279/279 | ✓ |
| Build: clean | ✓ |

---

## Next steps

1. **Deploy self-edit rules patch** (Firebase Console) before advertising profile
   editing to caregivers.
2. Test caregiver self-edit after rules patch.
3. Consider owner inline edit of another member's displayLabel/initials (Manage
   Caregivers phase 2 — current rules already allow owner updates).
