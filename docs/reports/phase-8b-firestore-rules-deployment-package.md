# Phase 8B — Firestore Rules Deployment Package (Phase 8B-3)

**Date:** 2026-05-25
**Revision:** Phase 8B-3
**Status:** Package only — no rules deployed.

---

## ⛔ TOP-LEVEL VERDICT: NOT SAFE TO DEPLOY

**1 blocking requirement** must be implemented in app code before the rules in §6
can be deployed. See §2 for the exact required change.

Blockers 2 and 3 (entry create source gate, protected entry update fields) are
correctly resolved in the §6 rules and do not require app changes.

---

## Revision history

| Revision | Key change |
|----------|-----------|
| Original 8B | No invite enforcement in member-create. Entry update only protected `source`. |
| 8B-1 | Added `joinedViaInviteId` → invite exists + `status == 'active'`. `sourceUnchanged` on update. `createdByUserId/createdByLabel/createdAt` app-layer only. |
| 8B-2 | Added `protectedFieldsUnchanged` on member update. Admin bypass for batch.set re-imports. Declared "safe to deploy" — incorrect, see below. |
| **8B-3** | **Corrected verdict. Code verification gap documented. Exact app change specified. Rules snippet shows post-fix version only.** |

---

## 1. Data model reference

**No `memberIds` array on family doc. No `ownerUid` on family doc.**
All membership/ownership checks use `get()` on `families/{fId}/members/{uid}`.

| Path | Relevant fields |
|------|----------------|
| `families/{fId}` | name, timezone, unitPreference, createdByUserId |
| `families/{fId}/members/{uid}` | userId, role ('owner'/'caregiver'), active, legacyImportAdmin, joinedViaInviteId |
| `families/{fId}/babies/{bId}/entries/{eId}` | entryDate, entryTime, amountMl, diaper, vitaminD, medication, tummyTime, tummyTimeCount, notes, source, createdByUserId, createdByLabel, createdAt, updatedByUserId, updatedByLabel, updatedAt, deleted, deletedAt, deletedByUserId, deletedByLabel |
| `families/{fId}/babies/{bId}/weeklySettings/{wk}` | usualBottleAmountMl |
| `families/{fId}/invites/{iId}` | inviteId, **code**, role, status, createdByUserId, acceptedByUserId, revokedByUserId |

---

## 2. Blocking requirement — invite code verification needs app change

### Current gap

The Phase 8B-2 rules verify:
- `joinedViaInviteId` exists and is non-empty
- Invite doc exists at `families/{familyId}/invites/{joinedViaInviteId}`
- Invite `status == 'active'`

The Phase 8B-2 rules do NOT verify the invite code (`code` field on the invite doc).
The invite code is in the URL parameter (`qCode`) and is verified app-side in
`JoinFamilyView.validateAndAdvance()`. It is never written to Firestore.

Rules cannot read `qCode` from the URL. To verify the code in rules, the code
must be written to the member doc on creation so rules can compare
`get(inviteDoc).data.code == request.resource.data.joinedViaInviteCode`.

Without code verification, any signed-in user who knows a valid `{familyId, inviteId}`
pair can create their own caregiver member doc without possessing the invite link.
The `inviteId` is a Firestore auto-ID (~160-bit entropy) and is not guessable, but
it may appear in application logs, network traces, or error messages. Treating
entropy-only as the sole gate is not acceptable for hardened rules.

### Required app change (2 files, 3 lines)

**`src/families/familyService.js` — `addMember()` signature and write:**

```js
// Before:
export async function addMember(familyId, { userId, email, role, displayLabel, initials, joinedViaInviteId = null }) {
  await setDoc(doc(db, 'families', familyId, 'members', userId), {
    userId, email, role, displayLabel,
    initials: initials || '',
    joinedAt: serverTimestamp(),
    invitedByUserId: null,
    joinedViaInviteId,
    active: true
  })
}

// After:
export async function addMember(familyId, { userId, email, role, displayLabel, initials, joinedViaInviteId = null, joinedViaInviteCode = null }) {
  await setDoc(doc(db, 'families', familyId, 'members', userId), {
    userId, email, role, displayLabel,
    initials: initials || '',
    joinedAt: serverTimestamp(),
    invitedByUserId: null,
    joinedViaInviteId,
    joinedViaInviteCode,   // ← new field: invite code written to member doc
    active: true
  })
}
```

**`src/families/JoinFamilyView.vue` — `handleJoin()` call:**

```js
// Before:
await addMember(qFamilyId, {
  userId: uid,
  email,
  role: invite.value.role ?? 'caregiver',
  displayLabel: displayLabel.value.trim(),
  initials: initials.value.trim(),
  joinedViaInviteId: qInviteId,
})

// After:
await addMember(qFamilyId, {
  userId: uid,
  email,
  role: invite.value.role ?? 'caregiver',
  displayLabel: displayLabel.value.trim(),
  initials: initials.value.trim(),
  joinedViaInviteId: qInviteId,
  joinedViaInviteCode: qCode,   // ← new: passes URL code to member doc
})
```

### Why storing the code on the member doc is acceptable

`qCode` is the 16-char hex invite code from the invite URL. It is already known to
the person who received the invite link. Storing it on the member doc means family
members who can read member docs will also see it. For a private family app where
members are trusted relatives/caregivers, this is acceptable. The code is
single-use (invite is marked `accepted` after one join).

### What rules enforce after the app change

After `joinedViaInviteCode` is present on the member doc, rules can verify:
1. The invite doc exists under this `familyId`
2. The invite is `status == 'active'` (not revoked or already used)
3. The `code` on the invite doc matches `joinedViaInviteCode` on the new member doc
4. `memberId == request.auth.uid` (doc ID = auth UID)
5. `userId == request.auth.uid` (userId field also = auth UID)
6. `role == 'caregiver'` (cannot self-elevate)
7. `legacyImportAdmin` absent

This provides rules-level enforcement of the full invite flow — no app-only gates.

---

## 3. Blocker 2 status — entry-create source gate (RESOLVED)

The Phase 8B-2 entry-create rule is correct and carries forward unchanged:

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
- Normal members: `source == 'app'` and `createdByLabel != 'Legacy'` only
- `source: 'legacy'`, `source: 'legacy-csv'`, or `createdByLabel: 'Legacy'` requires
  `isLegacyImportAdmin`
- Both import writers (`writeAppCsvEntries`, `writeLegacyEntries`) require
  `isLegacyImportAdmin` because their entries carry non-app source values or
  legacy labels

**Write-path source values for reference:**

| Writer | source | createdByLabel | createdByUserId |
|--------|--------|---------------|----------------|
| `entryService.createEntry()` | `'app'` | member.displayLabel | member.userId |
| `writeAppCsvEntries()` | from CSV | from CSV | **not written** |
| `writeLegacyEntries()` | from CSV | from CSV | from CSV |

**Known edge case:** A user with display label literally "Legacy" cannot create normal
app entries. Relax the `createdByLabel` check if this becomes an issue.

---

## 4. Blocker 3 status — protected entry fields on update (RESOLVED)

The Phase 8B-2 entry-update rules are correct and carry forward unchanged.

### The conflict and its resolution

`writeAppCsvEntries` does a `batch.set()` full overwrite and does NOT write
`createdByUserId`. A re-import of an app-created entry would fail a strict
`protectedFieldsUnchanged` check because `resource.data.createdByUserId == 'uid'`
but `request.resource.data.createdByUserId == null` (absent from batch.set payload).

Solution: two separate update rules (OR'd by Firestore).

```
// Normal member: strict. Protected provenance fields must not change.
allow update: if isMember(familyId)
    && validEntry(request.resource.data)
    && protectedFieldsUnchanged(request.resource.data, resource.data);

// Admin: unrestricted. Covers batch.set() re-imports from both import writers.
allow update: if isLegacyImportAdmin(familyId);

function protectedFieldsUnchanged(newData, oldData) {
  return newData.source          == oldData.source
      && newData.createdByUserId == oldData.get('createdByUserId', null)
      && newData.createdByLabel  == oldData.get('createdByLabel', null)
      && newData.createdAt       == oldData.get('createdAt', null);
}
```

Why `updateDoc()` always passes `protectedFieldsUnchanged`:
- `updateDoc()` sends only changed fields; Firestore projects the full doc into
  `request.resource.data`. Protected fields retain their existing values.
- `entryService.updateEntry()` uses `MUTABLE_FIELDS` — protected fields never
  appear in the update payload. ✓
- `softDeleteEntry()` and `restoreEntry()` only change soft-delete fields. ✓

Why the admin bypass is needed:
- `writeAppCsvEntries` omits `createdByUserId` from `batch.set()` data.
- On re-import of an app-created entry: `null != 'uid'` → fails member rule.
- Admin rule allows the overwrite. Admin is trusted; Console-only `legacyImportAdmin`
  flag cannot be self-granted via the app.

---

## 5. Current loose-rules risk summary

| Risk | Severity |
|------|----------|
| Any signed-in user can read any family's data | High |
| Any signed-in user can write entries in any family | High |
| Any signed-in user can join any family without an invite | High |
| Any signed-in user can create or revoke invites in any family | High |
| `legacyImportAdmin` can be self-granted | High |
| Hard `deleteDoc` on entries is allowed (app never calls it) | Medium |

---

## 6. Proposed rules snippet

**These rules require the app change in §2 to be deployed first.**
The `joinedViaInviteCode` field must exist on the member doc at creation time
for the member-create rule to verify it against the invite's `code` field.
Deploying these rules before the app change will break the join-family flow
(new members cannot create their member doc).

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
        // via the app — it must remain equal to its current stored value.
        allow update: if isOwner(familyId)
            && (
              !('legacyImportAdmin' in request.resource.data)
              || request.resource.data.legacyImportAdmin
                 == resource.data.get('legacyImportAdmin', false)
            );

        // A signed-in user may create their own member doc only when all of:
        //   1. Doc ID and userId field both match the creating user's UID.
        //   2. joinedViaInviteId references an invite doc in this same family.
        //   3. That invite is status == 'active'.
        //   4. joinedViaInviteCode matches the code field on the invite doc.
        //      (Rules-level code verification — requires app change in §2.)
        //   5. Role is pinned to 'caregiver'.
        //   6. legacyImportAdmin must not be set.
        //
        // REQUIRES: addMember() must write joinedViaInviteCode to the member doc.
        // Deploying without the §2 app change will break the join-family flow.
        allow create: if request.auth != null
            && memberId == request.auth.uid
            && request.resource.data.userId == request.auth.uid
            && 'joinedViaInviteId' in request.resource.data
            && 'joinedViaInviteCode' in request.resource.data
            && request.resource.data.joinedViaInviteId is string
            && request.resource.data.joinedViaInviteId != ''
            && request.resource.data.joinedViaInviteCode is string
            && request.resource.data.joinedViaInviteCode != ''
            && exists(/databases/$(database)/documents/families/$(familyId)/invites/$(request.resource.data.joinedViaInviteId))
            && get(/databases/$(database)/documents/families/$(familyId)/invites/$(request.resource.data.joinedViaInviteId)).data.status == 'active'
            && get(/databases/$(database)/documents/families/$(familyId)/invites/$(request.resource.data.joinedViaInviteId)).data.code == request.resource.data.joinedViaInviteCode
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

          // Normal members: source == 'app' and createdByLabel != 'Legacy' only.
          // Legacy/import sources or the 'Legacy' label require legacyImportAdmin.
          allow create: if isMember(familyId)
              && validEntry(request.resource.data)
              && (
                (request.resource.data.source == 'app'
                 && request.resource.data.get('createdByLabel', '') != 'Legacy')
                || isLegacyImportAdmin(familyId)
              );

          // Normal member update: mutable care + soft-delete fields only.
          // Protected provenance fields (source, createdByUserId,
          // createdByLabel, createdAt) must remain unchanged.
          allow update: if isMember(familyId)
              && validEntry(request.resource.data)
              && protectedFieldsUnchanged(request.resource.data, resource.data);

          // Admin update: unrestricted. Covers idempotent batch.set()
          // re-imports that omit createdByUserId from their payload.
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
        // Required for join-family flow: JoinFamilyView reads the invite
        // to validate the code before creating the member doc.
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

## 7. Deployment sequence

**Step 1 — App change (Phase 8B-3 required)**

Implement the changes in §2:
- `src/families/familyService.js`: add `joinedViaInviteCode = null` to `addMember()`;
  write it to the member doc.
- `src/families/JoinFamilyView.vue`: pass `joinedViaInviteCode: qCode` when calling
  `addMember()`.

Test the join flow end-to-end: generate invite, open link in incognito, sign in,
join → member doc in Firestore must have `joinedViaInviteCode` field.

**Step 2 — Deploy rules (only after Step 1 is in production)**

1. Save current Console rules to a local file (rollback copy).
2. Paste §6 rules into Console → Firestore → Rules.
3. Publish. Live in ~30 s.
4. Run test checklists (§9–§12) immediately.
5. On any failure → paste §8 rollback and republish.

**Why the order matters:**
The §6 rules require `joinedViaInviteCode` on member doc create. If the rules are
deployed before the app change, new join attempts will fail with `permission-denied`
because the member doc won't have `joinedViaInviteCode`.

Existing members are not affected — their docs already exist and don't go through
the create rule again.

---

## 8. Rollback rules snippet

**Before deploying: open Firebase Console → Firestore → Rules, copy all text to
a local file. That is the authoritative rollback.**

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

Rollback takes effect within ~30 s. No code change required.

---

## 9. Owner test checklist

Perform as `role: 'owner'` with `legacyImportAdmin: true`.

- [ ] Ledger loads and entries are visible
- [ ] Add entry writes successfully
- [ ] Edit entry field saves
- [ ] Soft-delete an entry — `deleted: true` in Firestore, not removed
- [ ] Weekly settings (bottle amount) saves and reloads
- [ ] Baby profile readable
- [ ] `/invite` page loads
- [ ] Create invite — invite doc written
- [ ] Revoke invite — `status: 'revoked'`
- [ ] `/admin/legacy-import` page loads
- [ ] Upload matching-baby CSV — preview shown, no error
- [ ] Complete import — entries written
- [ ] Re-import same CSV — no error (idempotent)
- [ ] Via browser console: try to `updateDoc` own member doc with
      `legacyImportAdmin: true` → permission-denied

---

## 10. Caregiver test checklist

Perform as `role: 'caregiver'` (no `legacyImportAdmin`).

- [ ] Ledger loads
- [ ] Add entry writes
- [ ] Edit entry field saves
- [ ] Soft-delete entry completes
- [ ] Weekly settings readable and writable
- [ ] `/invite` — redirected (app gate)
- [ ] `/admin/legacy-import` — redirected (app gate)
- [ ] Via browser console: `setDoc` entry with `source: 'legacy'` → permission-denied
- [ ] Via browser console: `setDoc` entry with `source: 'app'`, `createdByLabel: 'Legacy'`
      → permission-denied
- [ ] Via browser console: `updateDoc` entry changing `source` → permission-denied
- [ ] Via browser console: `updateDoc` entry changing `createdByUserId` → permission-denied
- [ ] Via browser console: create member doc without `joinedViaInviteCode` → permission-denied
- [ ] Via browser console: create member doc with wrong `joinedViaInviteCode` → permission-denied
- [ ] Via browser console: create or revoke an invite → permission-denied

---

## 11. Invite acceptance test checklist

Requires §2 app change deployed first.

- [ ] Owner creates invite at `/invite`
- [ ] Open invite link in incognito
- [ ] Auth form shown (no Firestore error)
- [ ] Sign in or create account
- [ ] "Join as caregiver" form shown
- [ ] Fill in display label and submit:
  - [ ] `addMember()` writes member doc WITH `joinedViaInviteCode` field
  - [ ] Rules verify: invite exists + `status == 'active'` + `code` matches ✓
  - [ ] Member doc written successfully
  - [ ] `acceptInvite()` marks invite `status: 'accepted'` ✓
- [ ] Redirected to ledger
- [ ] Owner confirms new member appears with `role: 'caregiver'`
- [ ] New member's doc has `joinedViaInviteCode` in Firestore
- [ ] Try same link again (status accepted) → app shows "already accepted"
- [ ] Via browser console: create member doc with non-existent `joinedViaInviteId`
      → permission-denied
- [ ] Via browser console: create member doc with correct `joinedViaInviteId`
      but wrong code → permission-denied
- [ ] Via browser console: create member doc for a revoked invite
      → permission-denied

---

## 12. Import CSV test checklist

Perform as owner with `legacyImportAdmin: true`.

- [ ] Upload matching-baby CSV — preview shown
- [ ] Upload mismatched-baby CSV — "CSV baby does not match" error, button disabled
- [ ] Complete import — all entries written, sources preserved
- [ ] Re-import same CSV — no errors (idempotent)
- [ ] Entries with `source: 'legacy'` written correctly
- [ ] Re-imported entries remain readable in ledger
- [ ] As caregiver: `batch.set()` with `source: 'legacy'` → permission-denied

---

## 13. /feeds recommendation

§6 rules contain no feeds rule. Feeds collection retains its existing rules.

**Option A (recommended) — old app still in use:** Deploy §6 as-is after the §2
app change. ✓

**Option B — old app confirmed retired:** Add inside the `§6`
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
| Deploying §6 rules BEFORE §2 app change | **Critical** | Join flow breaks with permission-denied. Rollback via §8. |
| Two users accepting same invite simultaneously | Low | Both writes allowed if invite still 'active'; acceptable for private use |
| User display label "Legacy" blocks entry creation | Low | Relax `createdByLabel` check if needed |
| `writeAppCsvEntries` removes provenance fields on re-import | Low | Existing behaviour; admin bypass covers it |
| Feeds break if Option B is applied prematurely | High | §6 has no feeds rule; only triggered manually |

### Rollback trigger conditions

Roll back immediately (§8 → Publish) if:

1. Ledger fails to load for any member.
2. Any member gets permission-denied creating or editing entries.
3. Join-family flow returns permission-denied.
4. Import CSV returns permission-denied for a `legacyImportAdmin` user.
5. Weekly settings fail to save.
6. Any previously working feature returns permission-denied.
