# Phase 8B — Firestore Rules Deployment Package (Phase 8B-2)

**Date:** 2026-05-25
**Revision:** Phase 8B-2 — all three blockers addressed.
**Status:** Package only — no rules deployed. Manual deployment required.

---

## Revision history

| Revision | Date | Change |
|----------|------|--------|
| Original 8B | 2026-05-25 | Initial package. Member-create lacked invite enforcement. Entry update only protected `source`. |
| 8B-1 | 2026-05-25 | Added `joinedViaInviteId` to member-create rule. Added `sourceUnchanged` to entry update. `createdByUserId`/`createdByLabel`/`createdAt` still app-layer only. |
| **8B-2** | **2026-05-25** | **All three blockers resolved. Full protected-fields enforcement on entry update. Admin update bypass for batch.set re-imports.** |

---

## Data model reference

**No `memberIds` array on the family doc. No `ownerUid` on the family doc.**
All membership/ownership checks use `get()` on `families/{fId}/members/{uid}`.

| Path | Relevant fields |
|------|----------------|
| `families/{fId}` | name, timezone, unitPreference, createdByUserId |
| `families/{fId}/members/{uid}` | userId, role ('owner'/'caregiver'), active, legacyImportAdmin |
| `families/{fId}/babies/{bId}` | nickname, status |
| `families/{fId}/babies/{bId}/entries/{eId}` | entryDate, entryTime, amountMl, diaper, vitaminD, medication, tummyTime, tummyTimeCount, notes, source, createdByUserId, createdByLabel, createdAt, updatedByUserId, updatedByLabel, updatedAt, deleted, deletedAt, deletedByUserId, deletedByLabel |
| `families/{fId}/babies/{bId}/weeklySettings/{wk}` | usualBottleAmountMl, createdByUserId, updatedByUserId |
| `families/{fId}/invites/{iId}` | inviteId, code, role, status, createdByUserId, acceptedByUserId, revokedByUserId |

---

## 1. Blocker 1 — invite-enforced member create

### Status: already resolved in Phase 8B-1, confirmed here

The member-create rule requires `joinedViaInviteId` that points to an active
invite in the same `familyId`. This was added in Phase 8B-1. One additional
field constraint is added in 8B-2: `request.resource.data.userId == request.auth.uid`
ensures the `userId` field stored on the member doc matches the creating user.

### What `addMember()` writes

```js
{ userId, email, role, displayLabel, initials,
  joinedAt: serverTimestamp(),
  invitedByUserId: null,
  joinedViaInviteId,   // ← set to qInviteId from URL params
  active: true }
```

`joinedViaInviteId` is already present — no schema change needed.

### Can rules verify the invite CODE?

No. The 16-char hex `code` is in the URL but not stored on the member doc.
Rules verify that the `joinedViaInviteId` points to an invite that exists and
has `status == 'active'`. Code verification is app-side only.

For a private family app, the `inviteId` entropy (~160-bit Firestore auto-ID)
combined with the app-side code check is sufficient. A rogue write would require
knowing a valid, active `{familyId, inviteId}` pair — neither is guessable.

### Member-create rule

```
allow create: if request.auth != null
    && memberId == request.auth.uid
    && request.resource.data.userId == request.auth.uid
    && 'joinedViaInviteId' in request.resource.data
    && request.resource.data.joinedViaInviteId is string
    && request.resource.data.joinedViaInviteId != ''
    && exists(/databases/$(database)/documents/families/$(familyId)/invites/$(request.resource.data.joinedViaInviteId))
    && get(/databases/$(database)/documents/families/$(familyId)/invites/$(request.resource.data.joinedViaInviteId)).data.status == 'active'
    && request.resource.data.role == 'caregiver'
    && request.resource.data.active == true
    && !('legacyImportAdmin' in request.resource.data);
```

---

## 2. Blocker 2 — entry-create restricted by source and createdByLabel

### The problem

Any active member could create an entry with `source: 'legacy'` or
`createdByLabel: 'Legacy'` by bypassing the UI. The previous rule only restricted
`source != 'app'`; the brief additionally requires blocking `createdByLabel == 'Legacy'`.

### What each write path produces

| Writer | source | createdByLabel | createdByUserId |
|--------|--------|---------------|----------------|
| `entryService.createEntry()` | `'app'` | `member.displayLabel` | `member.userId` |
| `writeAppCsvEntries()` | from CSV (`'app'`, `'legacy'`, etc.) | from CSV | **not written** |
| `writeLegacyEntries()` | from CSV (`'legacy-csv'`, etc.) | from CSV | from CSV |

### Entry-create rule

```
allow create: if isMember(familyId)
    && validEntry(request.resource.data)
    && (
      (request.resource.data.source == 'app'
       && request.resource.data.get('createdByLabel', '') != 'Legacy')
      || isLegacyImportAdmin(familyId)
    );
```

This enforces:
- Normal members may only create entries with `source == 'app'` AND
  `createdByLabel != 'Legacy'`
- Any other source value OR `createdByLabel == 'Legacy'` requires `legacyImportAdmin`
- Both `writeAppCsvEntries` and `writeLegacyEntries` require `isLegacyImportAdmin`
  because their entries may have non-app source values

**Note:** A user whose display label is literally "Legacy" cannot create normal
app entries with the current rule. This is a known limitation: it is an extremely
unlikely display label, and the rule can be relaxed if needed.

---

## 3. Blocker 3 — entry-update protected fields + admin bypass

### The problem

The Phase 8B-1 update rule only protected `source` via `sourceUnchanged()`.
`createdByUserId`, `createdByLabel`, `createdAt` remained unprotected at the
rules level (only app-layer `MUTABLE_FIELDS` in `entryService` prevented changes).

The brief requires rules-level enforcement of all four protected fields on update.

### The re-import conflict

`writeAppCsvEntries` does a `batch.set()` full overwrite. It does **not** write
`createdByUserId` to the document. For an existing entry originally created via
the app (which has `createdByUserId: 'uid123'`), the re-import produces:

- `request.resource.data.createdByUserId` → null (absent from `batch.set()` payload)
- `resource.data.createdByUserId` → `'uid123'` (existing doc)
- Comparison: `null != 'uid123'` → blocked

This means `protectedFieldsUnchanged` **cannot** be applied to the re-import path
without breaking idempotent re-imports of app-created entries.

### Solution: two separate update rules

Firestore allows multiple `allow` rules for the same operation — they are OR'd.

```
// Normal member update: mutable care fields + soft-delete fields only.
// Protected provenance fields must not change.
allow update: if isMember(familyId)
    && validEntry(request.resource.data)
    && protectedFieldsUnchanged(request.resource.data, resource.data);

// Admin update: unrestricted full overwrite.
// Covers batch.set() re-imports from both writeAppCsvEntries and writeLegacyEntries.
allow update: if isLegacyImportAdmin(familyId);
```

The `protectedFieldsUnchanged` helper:

```
function protectedFieldsUnchanged(newData, oldData) {
  return newData.source          == oldData.source
      && newData.createdByUserId == oldData.get('createdByUserId', null)
      && newData.createdByLabel  == oldData.get('createdByLabel', null)
      && newData.createdAt       == oldData.get('createdAt', null);
}
```

Using `.get(field, null)` handles fields absent from CSV-imported entries.

### Why `updateDoc()` passes `protectedFieldsUnchanged`

`updateDoc()` sends only the changed fields. Firestore projects the result as a
full document in `request.resource.data`. Unchanged fields (including protected
ones) retain their existing values. Therefore:

- `entryService.updateEntry()`: `MUTABLE_FIELDS` only → protected fields
  unchanged → passes ✓
- `softDeleteEntry()`: deleted, deletedAt, deletedByUserId, deletedByLabel,
  updatedAt → protected fields unchanged → passes ✓
- `restoreEntry()`: deleted, deletedAt, deletedByUserId, deletedByLabel,
  updatedAt → protected fields unchanged → passes ✓

### Why the admin bypass is needed

`writeAppCsvEntries` `batch.set()` is a full document overwrite that does not
include `createdByUserId`. On re-import of an app-created entry, the comparison
`null == 'uid123'` fails. The admin update rule bypasses this check.

**This is intentional and acceptable:** `legacyImportAdmin` is a Console-only
flag. An admin doing a CSV re-import is explicitly trusted to overwrite provenance
fields. The app-level baby safety check (Phase 8A) prevents accidental cross-baby
imports.

### Side effect of writeAppCsvEntries re-import

When `writeAppCsvEntries` overwrites an app-created entry, the resulting doc will
not have `createdByUserId`, `tummyTime`, `deletedByUserId`, `deletedByLabel`, or
`updatedByUserId` (none of these are in the `batch.set()` payload). This is an
existing data behaviour — not introduced by these rules — but is worth noting as
a reason to avoid re-importing unless necessary.

---

## 4. Current loose-rules risk summary

| Risk | Severity |
|------|----------|
| Any signed-in user can read any family's babies and entries | High |
| Any signed-in user can write entries in any family | High |
| Any signed-in user can join any family without an invite | High |
| Any signed-in user can create or revoke invites in any family | High |
| `legacyImportAdmin` can be self-granted | High |
| Hard `deleteDoc` on entries is allowed (app never calls it) | Medium |

---

## 5. Exact proposed rules snippet

Paste the entire block below into Firebase Console → Firestore → Rules.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ── Path helper ──────────────────────────────────────────────────────────

    function memberPath(familyId) {
      return /databases/$(database)/documents/families/$(familyId)/members/$(request.auth.uid);
    }

    // ── Access helpers ───────────────────────────────────────────────────────

    function isMember(familyId) {
      return request.auth != null
          && exists(memberPath(familyId))
          && get(memberPath(familyId)).data.active == true;
    }

    function isOwner(familyId) {
      return request.auth != null
          && exists(memberPath(familyId))
          && get(memberPath(familyId)).data.active == true
          && get(memberPath(familyId)).data.role == 'owner';
    }

    // legacyImportAdmin must be set via Firebase Console only.
    // The app never writes this field; the member-update rule prevents
    // owners from granting it via the app.
    function isLegacyImportAdmin(familyId) {
      return request.auth != null
          && exists(memberPath(familyId))
          && get(memberPath(familyId)).data.active == true
          && get(memberPath(familyId)).data.role == 'owner'
          && get(memberPath(familyId)).data.get('legacyImportAdmin', false) == true;
    }

    // ── Validation helpers ───────────────────────────────────────────────────

    function validEntry(data) {
      return data.entryDate is string
          && (data.entryTime == null || data.entryTime is string)
          && (data.amountMl  == null || data.amountMl  is number)
          && (data.diaper    == null || data.diaper    is string);
    }

    // Protects source, createdByUserId, createdByLabel, createdAt from
    // being changed via normal member updates. Not applied to admin updates.
    function protectedFieldsUnchanged(newData, oldData) {
      return newData.source          == oldData.source
          && newData.createdByUserId == oldData.get('createdByUserId', null)
          && newData.createdByLabel  == oldData.get('createdByLabel', null)
          && newData.createdAt       == oldData.get('createdAt', null);
    }

    // ── Family doc ────────────────────────────────────────────────────────────
    match /families/{familyId} {
      allow read:           if isMember(familyId);
      allow update:         if isOwner(familyId);
      allow create, delete: if false;

      // ── Members ──────────────────────────────────────────────────────────
      match /members/{memberId} {
        allow read: if isMember(familyId);

        // Owners can update member docs but cannot grant legacyImportAdmin
        // via the app — that field must remain equal to its current stored
        // value (or absent) on any owner-driven update.
        allow update: if isOwner(familyId)
            && (
              !('legacyImportAdmin' in request.resource.data)
              || request.resource.data.legacyImportAdmin
                 == resource.data.get('legacyImportAdmin', false)
            );

        // A signed-in user may create their own member doc only when:
        //   - Doc ID and userId field both match the creating user's UID.
        //   - joinedViaInviteId references an active invite in this family.
        //   - Role is pinned to 'caregiver'.
        //   - legacyImportAdmin must not be present.
        // Invite code is verified app-side; inviteId entropy is sufficient
        // for private-family use.
        allow create: if request.auth != null
            && memberId == request.auth.uid
            && request.resource.data.userId == request.auth.uid
            && 'joinedViaInviteId' in request.resource.data
            && request.resource.data.joinedViaInviteId is string
            && request.resource.data.joinedViaInviteId != ''
            && exists(/databases/$(database)/documents/families/$(familyId)/invites/$(request.resource.data.joinedViaInviteId))
            && get(/databases/$(database)/documents/families/$(familyId)/invites/$(request.resource.data.joinedViaInviteId)).data.status == 'active'
            && request.resource.data.role == 'caregiver'
            && request.resource.data.active == true
            && !('legacyImportAdmin' in request.resource.data);

        allow delete: if false;
      }

      // ── Babies ────────────────────────────────────────────────────────────
      match /babies/{babyId} {
        allow read:           if isMember(familyId);
        allow create, update: if isOwner(familyId);
        allow delete:         if false;

        // ── Entries ────────────────────────────────────────────────────────
        match /entries/{entryId} {
          allow read: if isMember(familyId);

          // Normal members may create entries with source == 'app' and
          // createdByLabel != 'Legacy'. Any other source or the 'Legacy'
          // label requires legacyImportAdmin (covers both import writers).
          allow create: if isMember(familyId)
              && validEntry(request.resource.data)
              && (
                (request.resource.data.source == 'app'
                 && request.resource.data.get('createdByLabel', '') != 'Legacy')
                || isLegacyImportAdmin(familyId)
              );

          // Normal member update: mutable care fields + soft-delete fields
          // only. Protected provenance fields (source, createdByUserId,
          // createdByLabel, createdAt) must remain unchanged.
          allow update: if isMember(familyId)
              && validEntry(request.resource.data)
              && protectedFieldsUnchanged(request.resource.data, resource.data);

          // Admin update: unrestricted. Covers idempotent batch.set()
          // re-imports from writeAppCsvEntries and writeLegacyEntries,
          // which may not include all provenance fields in their payload.
          allow update: if isLegacyImportAdmin(familyId);

          // Hard delete forbidden. Soft-delete only via update (deleted: true).
          allow delete: if false;
        }

        // ── Weekly settings ───────────────────────────────────────────────
        match /weeklySettings/{weekStartDate} {
          allow read:           if isMember(familyId);
          allow create, update: if isMember(familyId);
          allow delete:         if false;
        }
      }

      // ── Invites ───────────────────────────────────────────────────────────
      match /invites/{inviteId} {
        // Owners: full access (create, list, revoke, read).
        allow read, write: if isOwner(familyId);

        // Any signed-in user may GET (not list) a specific invite doc.
        // Required for the join-family flow before the user is a member.
        allow get: if request.auth != null;

        // Active members (non-owner) may mark their own invite as accepted.
        // Called after addMember() creates the member doc.
        allow update: if isMember(familyId)
            && request.resource.data.status == 'accepted'
            && request.resource.data.acceptedByUserId == request.auth.uid;
      }
    }
  }
}
```

---

## 6. Required app/schema changes before deployment

**None.** All three blockers are resolved with the current schema and app code:

| Blocker | Resolution | App change? |
|---------|-----------|------------|
| 1 — arbitrary family joining | `joinedViaInviteId` already written by `addMember()` | No |
| 2 — import-shaped entry create | `source == 'app' && createdByLabel != 'Legacy'` gate | No |
| 3 — protected fields on update | Dual update rule: member (strict) + admin (bypass) | No |

The admin update bypass handles `writeAppCsvEntries` re-imports without requiring
`writeAppCsvEntries` to be modified to include `createdByUserId`.

---

## 7. Rollback rules snippet

**Before deploying: open Firebase Console → Firestore → Rules and save the
current rules text to a local file. That is the authoritative rollback.**

Canonical loose private-rebuild rules (use your saved copy if it differs):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

To roll back: paste into Console → Firestore → Rules → Publish. Live in ~30 s.

---

## 8. Firebase Console deployment instructions

1. Save current rules to a local file (rollback copy).
2. Copy the §5 block (from `rules_version` to the final `}`).
3. Console → Firestore → Rules → delete all existing text → paste §5.
4. Verify balanced braces and that the text matches §5 exactly.
5. Click **Publish**. Live in ~30 s.
6. Run §9–§12 checklists immediately.
7. On any failure → paste §7 rollback and re-publish immediately.

---

## 9. Owner manual test checklist

Perform as `role: 'owner'` with `legacyImportAdmin: true`.

- [ ] Ledger loads — entries visible for active baby
- [ ] Add entry (+ Day / + Entry) writes successfully
- [ ] Edit entry field (time, mL, diaper) saves successfully
- [ ] Soft-delete an entry — `deleted: true` in Firestore, not removed
- [ ] Weekly settings (bottle amount) saves and reloads
- [ ] Baby profile readable
- [ ] `/invite` page loads
- [ ] Create invite — invite doc written to Firestore
- [ ] Revoke invite — `status: 'revoked'` in Firestore
- [ ] `/admin/legacy-import` page loads
- [ ] Upload matching-baby CSV — preview shown, no error
- [ ] Complete import — entries written
- [ ] Re-import same CSV — no error (idempotent)
- [ ] Via browser console: try `updateDoc` on own member doc setting
      `legacyImportAdmin: true` → expect permission-denied

---

## 10. Caregiver manual test checklist

Perform as `role: 'caregiver'` (no `legacyImportAdmin`).

- [ ] Ledger loads — entries visible
- [ ] Add entry writes successfully
- [ ] Edit entry field saves successfully
- [ ] Soft-delete entry completes
- [ ] Weekly settings readable and editable
- [ ] `/invite` — redirected (app gate)
- [ ] `/admin/legacy-import` — redirected (app gate)
- [ ] Via browser console: try `setDoc` with `source: 'legacy'` →
      expect permission-denied
- [ ] Via browser console: try `setDoc` with `source: 'app'` and
      `createdByLabel: 'Legacy'` → expect permission-denied
- [ ] Via browser console: try `updateDoc` changing `source` on existing entry →
      expect permission-denied
- [ ] Via browser console: try `updateDoc` changing `createdByUserId` on existing
      entry → expect permission-denied
- [ ] Via browser console: try to create member doc for own UID without
      `joinedViaInviteId` → expect permission-denied
- [ ] Via browser console: try to create or revoke an invite → expect
      permission-denied

---

## 11. Invite acceptance manual test checklist

Perform with a fresh account that has never joined the family.

- [ ] Owner creates invite at `/invite`
- [ ] Open invite link in incognito window
- [ ] Page shows auth form (not a Firestore error)
- [ ] Sign in or create account
- [ ] After auth, "Join as caregiver" form appears
- [ ] Fill in display label and submit:
  - [ ] `addMember()` writes member doc with `joinedViaInviteId`
  - [ ] Rules verify invite exists and `status == 'active'` → allowed
  - [ ] `acceptInvite()` updates invite `status: 'accepted'` → allowed
- [ ] Redirected to ledger, entries visible
- [ ] Owner confirms new member appears with `role: 'caregiver'`
- [ ] Try same link again (`status: 'accepted'`) → app shows "already accepted"
- [ ] Via browser console: try to create member doc with fake `joinedViaInviteId`
      → expect permission-denied
- [ ] Via browser console: try to create member doc with revoked invite ID
      → expect permission-denied

---

## 12. Import CSV admin test checklist

Perform as owner with `legacyImportAdmin: true`.

- [ ] Upload matching-baby CSV — preview shown
- [ ] Upload mismatched-baby CSV — "CSV baby does not match" error (Phase 8A
      gate), import button disabled
- [ ] Complete first import — all entries written, sources preserved
- [ ] Re-import same CSV — no errors, same entry IDs overwrite (idempotent)
- [ ] Verify Firestore: entries with `source: 'legacy'` or `source: 'legacy-csv'`
      written correctly
- [ ] Entries from first import that had `source: 'app'` remain readable via
      the ledger
- [ ] As caregiver: attempt `batch.set()` with `source: 'legacy'` directly
      → expect permission-denied

---

## 13. /feeds recommendation

The `§5` rules contain no feeds rule. The feeds collection retains its current
rules.

**Option A (recommended) — old app still in use:** Deploy `§5` as-is. ✓

**Option B — old app confirmed retired:** Add inside `§5`'s
`match /databases/{database}/documents` block:
```
    match /feeds/{document=**} {
      allow read, write: if false;
    }
```
Apply only after confirming the old app is fully offline.

---

## 14. Known risks and rollback triggers

| Risk | Severity | Notes |
|------|----------|-------|
| `isMember`/`isOwner`/`isLegacyImportAdmin` call `get()` on member doc | Low | Firebase caches per request; ~1 backend read |
| Member create calls `get()` on invite doc | Low | Infrequent operation; acceptable latency |
| Two users simultaneously accepting same invite | Low | Both writes allowed if invite still 'active'; acceptable for private use |
| User with display label "Legacy" cannot create normal app entries | Low | Extremely unlikely; relax rule if needed |
| `writeAppCsvEntries` removes provenance fields on re-import of app entries | Low | Existing behaviour; admin is trusted; avoid re-import unless necessary |
| Feeds break if Option B is applied prematurely | High | §5 has no feeds rule; only triggered by manual error |

### Rollback trigger conditions

Roll back immediately (§7 → Publish) if:

1. Ledger fails to load entries for any member.
2. Any member receives permission-denied creating or editing entries.
3. Join-family flow returns permission-denied at any step.
4. Import CSV returns permission-denied for a confirmed `legacyImportAdmin` user.
5. Weekly settings fail to save.
6. Any previously working feature returns permission-denied.

---

## 15. Final verdict

**Safe to deploy with the §5 rules.**

All three blockers are resolved without any app or schema changes:

- **Blocker 1:** Member create requires `joinedViaInviteId` pointing to an active
  invite in the same family. `userId` field on the doc must match the auth UID.
- **Blocker 2:** Entry create allows `source == 'app'` and `createdByLabel != 'Legacy'`
  for members; any other combination requires `isLegacyImportAdmin`.
- **Blocker 3:** Entry update has two paths — members get strict
  `protectedFieldsUnchanged` enforcement; admins get an unrestricted bypass that
  covers idempotent `batch.set()` re-imports from both import writers.
