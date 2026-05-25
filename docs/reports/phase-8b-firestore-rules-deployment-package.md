# Phase 8B — Firestore Rules Deployment Package (Revised)

**Date:** 2026-05-25
**Revision:** Phase 8B-1 — both blockers resolved, rules revised.
**Status:** Package only — no rules deployed. Manual deployment required.

---

## 0. Corrections from Phase 8A / original Phase 8B

| Issue | Correction |
|-------|-----------|
| Phase 8A assumed `memberIds` array on family doc | Does not exist. Membership is determined by presence of active doc in `members/{uid}` subcollection. |
| Phase 8A assumed `ownerUid` field on family doc | Does not exist. Ownership is determined by `members/{uid}.role == 'owner'`. |
| Original Phase 8B member-create rule allowed arbitrary family joining | Fixed — see Blocker 1 resolution. |
| Original Phase 8B entry-create rule allowed caregivers to write any source | Fixed — see Blocker 2 resolution. |

---

## 1. Current loose-rules risk summary

The current Firebase Console rules are described as loose private-rebuild rules.
This typically means something like:

```
allow read, write: if request.auth != null;
```

applied broadly. The risks:

| Risk | Severity |
|------|----------|
| Any signed-in user can read any family's babies and entries | High |
| Any signed-in user can write/modify any family's entries | High |
| Any signed-in user can create or revoke invites in any family | High |
| Any signed-in user can overwrite any baby doc | High |
| `legacyImportAdmin` can be self-granted on own member doc | High |
| Hard `deleteDoc` on entries is allowed (app never calls it, but rule doesn't block it) | Medium |
| Any signed-in user can join any family without an invite | High |

---

## 2. Blocker 1 resolution — invite-validated member create

### The problem

The previous rule allowed any signed-in user to create a caregiver member doc in
ANY family as long as they knew or guessed the `familyId`. The report admitted
"invite-code validation is handled in app code" — this is insufficient for
hardened rules.

### Investigation results

**What `addMember()` writes to `families/{familyId}/members/{userId}`:**
```js
{
  userId, email, role, displayLabel, initials,
  joinedAt: serverTimestamp(),
  invitedByUserId: null,
  joinedViaInviteId,   // ← already present; set to qInviteId from URL
  active: true
}
```

`joinedViaInviteId` is already present on every member doc created via the join
flow. No app or schema change is required.

**What the invite doc contains** (`families/{familyId}/invites/{inviteId}`):
```
inviteId, code, role, status, createdAt, createdByUserId, createdByLabel,
acceptedAt, acceptedByUserId, acceptedByLabel,
revokedAt, revokedByUserId, revokedByLabel
```

**Can rules verify the invite CODE?**
No. The 16-char hex `code` is in the URL but not stored on the member doc.
Rules can only verify that `joinedViaInviteId` points to an invite that exists
and has `status == 'active'`. Code verification is app-side only
(`JoinFamilyView.validateAndAdvance()` checks `inv.code !== qCode` before
allowing the user to proceed to the join form).

**Is inviteId entropy sufficient without code verification in rules?**
Yes — for a private family app. The `inviteId` is a Firebase auto-generated
document ID (~160-bit address space, cryptographically random). Combined with
the invite `code` (64 bits, verified app-side), the probability of guessing a
valid `{familyId, inviteId}` pair is negligible. The Firestore rule verifying
invite existence and active status provides meaningful hardening: a rogue write
requires knowing a valid, active `inviteId` under the target `familyId`.

### The fix

No app or schema change is needed. The rules use `joinedViaInviteId` (already
on the member doc) to do a `get()` on the invite doc at rules evaluation time:

```
allow create: if request.auth != null
    && memberId == request.auth.uid
    && 'joinedViaInviteId' in request.resource.data
    && request.resource.data.joinedViaInviteId is string
    && request.resource.data.joinedViaInviteId != ''
    && exists(/databases/$(database)/documents/families/$(familyId)/invites/$(request.resource.data.joinedViaInviteId))
    && get(/databases/$(database)/documents/families/$(familyId)/invites/$(request.resource.data.joinedViaInviteId)).data.status == 'active'
    && request.resource.data.role == 'caregiver'
    && request.resource.data.active == true
    && !('legacyImportAdmin' in request.resource.data);
```

This enforces:
- Doc ID must match the creating user's own UID (cannot create a member doc for another user)
- `joinedViaInviteId` must reference an invite that EXISTS under this same `familyId`
- That invite must currently be `status: 'active'` (not revoked or already accepted)
- Role is pinned to `'caregiver'` (cannot self-elevate to owner)
- `legacyImportAdmin` flag must not be present (Console-only flag)

**Residual limitation:** A race condition exists where two users could
simultaneously accept the same active invite before either `acceptInvite()`
call marks it as `'accepted'`. For a private family app, this is acceptable.
Eliminating it would require a Cloud Function transaction.

---

## 3. Blocker 2 resolution — Import CSV restricted to legacyImportAdmin

### The problem

The previous rules allowed any active member to create entries with any `source`
value. Import CSV is app-gated by `legacyImportAdmin`, but a technically
sophisticated caregiver could bypass the UI via direct Firestore writes.

### Investigation results

**Source values used by each write path:**
- `entryService.createEntry()` — always writes `source: 'app'`
- `writeAppCsvEntries()` — preserves `source` from the CSV row (may be `'app'`,
  `'legacy'`, or others depending on the original export)
- `writeLegacyEntries()` — writes `source: 'legacy-csv'`

**`MUTABLE_FIELDS` in `entryService.updateEntry()`:**
```js
const MUTABLE_FIELDS = new Set([
  'entryDate', 'entryTime', 'amountMl', 'diaper',
  'vitaminD', 'medication', 'tummyTime', 'tummyTimeCount', 'notes'
])
```
`source` is not in `MUTABLE_FIELDS`. The app service layer never changes `source`
on update. Rules will enforce this at the database level.

**Can rules distinguish a batch.set() re-import from a normal updateDoc()?**
No. Both trigger the `update` rule when the doc already exists. However:
- `batch.set()` on re-import writes `source: entry.source` (same value as before)
- `updateDoc()` in normal app flow never includes `source` in the payload, so
  `request.resource.data.source` equals the existing `resource.data.source`
- In both cases, `sourceUnchanged()` returns true ✓

**Why not also protect `createdByUserId`, `createdByLabel`, `createdAt` in the update rule?**
`writeAppCsvEntries` does NOT include `createdByUserId` in its `batch.set()` payload.
A re-import that overwrites a doc previously created via the normal app flow would
have `resource.data.createdByUserId == 'someUid'` but `request.resource.data.createdByUserId`
absent/null — the rule would block legitimate re-imports. These fields are
protected by the app service layer (`MUTABLE_FIELDS` never includes them) and are
not enforced at the Firestore rules level. This is a documented limitation.

### The fix

**Entry create — source gate:**
```
allow create: if isMember(familyId)
    && validEntry(request.resource.data)
    && (
      request.resource.data.source == 'app'
      || isLegacyImportAdmin(familyId)
    );
```

This enforces:
- Caregivers can only create entries with `source == 'app'` (normal app flow)
- Entries with any other source (`'legacy'`, `'legacy-csv'`, etc.) require
  `legacyImportAdmin`
- `writeAppCsvEntries` entries with `source: 'app'` are allowed for all members
  at the rules level; the Import CSV UI gate prevents caregiver access

**Entry update — source immutability:**
```
allow update: if isMember(familyId)
    && validEntry(request.resource.data)
    && sourceUnchanged(request.resource.data, resource.data);

function sourceUnchanged(newData, oldData) {
  return newData.source == oldData.source;
}
```

This prevents any user (including owners) from changing an entry's `source` field
after creation. The app never needs to do this.

**`isLegacyImportAdmin` helper:**
```
function isLegacyImportAdmin(familyId) {
  return request.auth != null
      && exists(memberPath(familyId))
      && get(memberPath(familyId)).data.active == true
      && get(memberPath(familyId)).data.role == 'owner'
      && get(memberPath(familyId)).data.get('legacyImportAdmin', false) == true;
}
```

The `.get('legacyImportAdmin', false)` default handles member docs where the
field is absent (all existing caregivers and owners without the flag).

### What rules DO NOT restrict for caregivers

- Writing individual entries with `source: 'app'` via direct Firestore calls
  (equivalent to creating normal app entries — not a new capability)
- Access to `createdByUserId`, `createdByLabel`, `createdAt` (protected by app
  service layer via `MUTABLE_FIELDS`)

---

## 4. Other reviews (per Phase 8B-1 brief)

### Entry update protected fields

| Field | Protection method |
|-------|------------------|
| `source` | Rules: `sourceUnchanged()` on update |
| `createdByUserId` | App layer: not in `MUTABLE_FIELDS` |
| `createdByLabel` | App layer: not in `MUTABLE_FIELDS` |
| `createdAt` | App layer: not in `MUTABLE_FIELDS` |
| `deletedByUserId` | Intentionally mutable (softDelete/restore) |
| `deletedByLabel` | Intentionally mutable (softDelete/restore) |

### Baby settings and weeklySettings for caregivers

Caregivers can read and write `weeklySettings` (usual bottle amount). This is
intentional — caregivers need to see and set the weekly bottle target.
Baby doc `create` and `update` remain owner-only. ✓

### Owner invite create/revoke

`allow read, write: if isOwner(familyId)` covers all owner invite operations.
Caregivers are gated out of invite management except for the single acceptance
write (tightly scoped to `status == 'accepted'` and own UID). ✓

### /feeds recommendation

Same as before: deploy with NO feeds rule (Option A). See §11 for detail.

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

    // True if requesting user has an active member doc in this family.
    function isMember(familyId) {
      return request.auth != null
          && exists(memberPath(familyId))
          && get(memberPath(familyId)).data.active == true;
    }

    // True if requesting user is an active owner of this family.
    function isOwner(familyId) {
      return request.auth != null
          && exists(memberPath(familyId))
          && get(memberPath(familyId)).data.active == true
          && get(memberPath(familyId)).data.role == 'owner';
    }

    // True if requesting user is owner AND has legacyImportAdmin flag.
    // legacyImportAdmin must be set via Firebase Console only —
    // the app never writes this field, and the update rule prevents
    // owners from changing it via the app.
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

    function sourceUnchanged(newData, oldData) {
      return newData.source == oldData.source;
    }

    // ── Family doc ────────────────────────────────────────────────────────────
    match /families/{familyId} {
      allow read:           if isMember(familyId);
      allow update:         if isOwner(familyId);
      allow create, delete: if false;

      // ── Members ──────────────────────────────────────────────────────────
      match /members/{memberId} {
        // Any active member can read member docs in their family.
        allow read: if isMember(familyId);

        // Owners can update member docs. The legacyImportAdmin flag may not
        // change via the app — it must be set via Firebase Console only.
        allow update: if isOwner(familyId)
            && (
              !('legacyImportAdmin' in request.resource.data)
              || request.resource.data.legacyImportAdmin
                 == resource.data.get('legacyImportAdmin', false)
            );

        // A signed-in user may create their own member doc (join-family flow)
        // only if they supply a joinedViaInviteId that references an active
        // invite in this same family. Invite code is verified app-side;
        // inviteId entropy (~160 bits) is sufficient for private-family use.
        allow create: if request.auth != null
            && memberId == request.auth.uid
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

          // Any active member may create entries with source == 'app'.
          // Any other source value (legacy, legacy-csv, etc.) requires
          // legacyImportAdmin. The Import CSV UI gate enforces this in the
          // app for all caregiver users.
          allow create: if isMember(familyId)
              && validEntry(request.resource.data)
              && (
                request.resource.data.source == 'app'
                || isLegacyImportAdmin(familyId)
              );

          // Any active member may update entries. source may not change.
          // Fields like createdByUserId, createdByLabel, createdAt are
          // protected at the app service layer (not in MUTABLE_FIELDS).
          allow update: if isMember(familyId)
              && validEntry(request.resource.data)
              && sourceUnchanged(request.resource.data, resource.data);

          // Hard delete is forbidden. Soft-delete only (deleted: true via update).
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
        // Needed for the join-family flow: JoinFamilyView fetches the invite
        // by ID after the user is authenticated, before any member write.
        allow get: if request.auth != null;

        // Active members (non-owner) may mark an invite as accepted.
        // Called in the join flow after addMember() creates the member doc.
        // Constrained: status must be 'accepted', acceptedByUserId must be
        // the requesting user's own UID.
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

**None.** Both blockers are resolved with the current schema:
- Blocker 1: `joinedViaInviteId` already written by `addMember()` ✓
- Blocker 2: `source` field already written by all entry create paths ✓

---

## 7. Rollback rules snippet

**Before deploying: open Firebase Console → Firestore → Rules and copy the
current rules to a safe text file. That is your rollback snippet.**

Canonical representation of loose private-rebuild rules (use your saved copy
if it differs):

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

To roll back: paste into Firebase Console → Firestore → Rules → Publish.
Effective within ~30 seconds.

---

## 8. Firebase Console deployment instructions

1. **Save current rules** — Console → Firestore → Rules → copy all text →
   save locally. This is the rollback.
2. **Copy §5 rules** — start with `rules_version = '2';`, end with closing `}`.
3. Open Console → Firestore → Rules. Delete all existing text.
4. Paste the §5 rules.
5. Verify closing braces are balanced and the text matches §5 exactly.
6. Click **Publish**. Rules are live within ~30 seconds.
7. Run the manual test checklists (§9–§12) immediately.
8. On any test failure → paste §7 rollback and re-publish immediately.

---

## 9. Owner manual test checklist

Perform as a signed-in user with `role: 'owner'` AND `legacyImportAdmin: true`.

- [ ] Ledger loads — entries visible for the active baby
- [ ] Add entry (+ button) creates a new entry successfully
- [ ] Edit entry field (time, mL, diaper) saves successfully
- [ ] Soft-delete an entry — entry gets `deleted: true`; not removed from Firestore
- [ ] Weekly settings (bottle amount) saves and reloads correctly
- [ ] Baby profile — baby details readable
- [ ] Navigate to `/invite` — page loads, no permission error
- [ ] Create an invite link — link generates, invite doc written to Firestore
- [ ] Revoke an invite — invite `status` changes to `'revoked'`
- [ ] Navigate to `/admin/legacy-import` — Import CSV page loads
- [ ] Upload a valid Jojo export CSV matching active baby — preview appears
- [ ] Confirm import phrase and click Import — entries write without error
- [ ] Re-import the same CSV — idempotent, no new errors (existing docs overwritten)
- [ ] Attempt to update own member doc with `legacyImportAdmin: true` via browser
      console → should be blocked (permission-denied)

---

## 10. Caregiver manual test checklist

Perform as a signed-in user with `role: 'caregiver'` (no `legacyImportAdmin`).

- [ ] Ledger loads — entries visible for the active baby
- [ ] Add entry creates a new entry successfully
- [ ] Edit entry field saves successfully
- [ ] Soft-delete an entry completes successfully
- [ ] Weekly settings readable and editable (usual bottle amount)
- [ ] Navigate to `/invite` — redirected away (app gate; owner-only)
- [ ] Navigate to `/admin/legacy-import` — redirected away (app gate)
- [ ] Attempting to create an entry with `source: 'legacy'` via browser console
      → blocked (permission-denied)
- [ ] Attempting to create own member doc without a valid `joinedViaInviteId`
      → blocked (permission-denied)
- [ ] Attempting to change `source` on an existing entry via `updateDoc`
      → blocked (permission-denied)
- [ ] Attempting to create or revoke an invite directly
      → blocked (permission-denied)
- [ ] Attempting to set `legacyImportAdmin: true` on own member doc
      → blocked (permission-denied)

---

## 11. Invite acceptance manual test checklist

Perform with a fresh account that has never joined the family.

- [ ] Owner creates an invite link at `/invite`
- [ ] Open invite link in a private/incognito window
- [ ] Page shows sign-in/create-account form
- [ ] Sign in or create a new account
- [ ] After auth, page shows the "Join as caregiver" form
- [ ] Fill in display label and submit
  - [ ] `addMember` writes member doc with `joinedViaInviteId` = valid invite ID
  - [ ] Firestore rules verify invite exists and is `status: 'active'` ✓
  - [ ] Member doc is written successfully
  - [ ] `acceptInvite` updates invite `status` to `'accepted'` ✓
- [ ] Page shows "Joined! Redirecting…"
- [ ] Sign in as owner and confirm new member appears in the family
- [ ] New member's `role` is `'caregiver'`, `legacyImportAdmin` is absent/false
- [ ] Try to accept the same invite link again (now `status: 'accepted'`) →
      page shows "This invite has already been accepted." (app-side check)
- [ ] Attempting to write a member doc with a fake/non-existent `joinedViaInviteId`
      directly via browser console → blocked (permission-denied)
- [ ] Attempting to write a member doc with `joinedViaInviteId` pointing to
      a revoked invite → blocked (permission-denied)

---

## 12. Import CSV admin test checklist

Perform as owner with `legacyImportAdmin: true`.

- [ ] Navigate to `/admin/legacy-import`
- [ ] Upload a CSV with matching baby name → preview, no error
- [ ] Upload a CSV with mismatched baby name → "CSV baby does not match" error,
      import button disabled
- [ ] Upload valid CSV → type confirmation phrase → Import button active
- [ ] Complete import → result summary shows rows written
- [ ] Re-import same CSV → completes without error (idempotent)
- [ ] Check Firestore: entries exist at `families/{id}/babies/{id}/entries/{entryId}`
- [ ] Entries with `source: 'legacy'` or `source: 'legacy-csv'` in the CSV
      were written successfully (legacyImportAdmin allows any source)
- [ ] Attempting same import as a caregiver (direct batch.set with source:'legacy')
      → blocked (permission-denied)

---

## 13. /feeds recommendation

The app codebase contains no `/feeds` path references. The proposed rules in §5
contain no feeds rule, so the feeds collection retains its existing rules.

**Option A — Old app still in use:** Deploy §5 as-is. No feeds rule is added. ✓ (Recommended)

**Option B — Old app retired:** Add inside the `match /databases/{database}/documents`
block in §5:
```
    // /feeds — retired app; all access denied.
    match /feeds/{document=**} {
      allow read, write: if false;
    }
```
Only apply after confirming the old app is fully offline.

---

## 14. Known risks and rollback trigger conditions

| Risk | Severity | Notes |
|------|----------|-------|
| `isMember`/`isOwner`/`isLegacyImportAdmin` each call `get()` on the member doc | Low | Firebase caches per-request; single backend read |
| Member-create rule adds a second `get()` on the invite doc | Low | ~1–5 ms extra; acceptable for join flow (infrequent) |
| Two users accepting the same invite simultaneously | Low | Both writes allowed if invite is still 'active' at evaluation time; acceptable for private-family use |
| Caregivers can write individual entries with `source: 'app'` via direct calls | Low | Equivalent capability to normal app entry creation; UI gate prevents bulk import |
| `createdByUserId`, `createdByLabel`, `createdAt` immutability enforced only at app layer | Low | Service layer `MUTABLE_FIELDS` prevents this in all normal flows |
| Feeds break if Option B is applied prematurely | High | §5 contains no feeds rule; only triggered by manual addition of Option B |

### Rollback trigger conditions

Roll back immediately (paste §7 and republish) if any of these occur:

1. Ledger fails to load entries for any family member.
2. Caregivers receive `permission-denied` creating or editing entries.
3. Join-family flow returns `permission-denied` at any step.
4. Import CSV returns `permission-denied` for a confirmed `legacyImportAdmin` user.
5. Weekly settings fail to save for any member.
6. Any feature that was working before deployment returns `permission-denied`.

Rollback takes effect within ~30 seconds. No code change required.

---

## 15. Final verdict

**Safe to deploy — with the revised §5 rules.**

Both blockers are resolved without any app or schema changes:

- **Blocker 1:** Member create requires a `joinedViaInviteId` pointing to an
  active invite in the same family. No schema change needed.
- **Blocker 2:** Entry create requires `source == 'app'` for non-admin members.
  Legacy/import sources require `legacyImportAdmin`. Source immutability is
  enforced on update.

Run the §9–§12 checklists immediately after deployment. Roll back via §7 if
any failure occurs.
