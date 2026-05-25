# Phase 8B — Firestore Rules Deployment Package

**Date:** 2026-05-25
**Status:** Package only — no rules deployed. Manual deployment required.

---

## 0. Critical correction from Phase 8A

The Phase 8A report assumed the family doc has a `memberIds` array and an `ownerUid` field.
**Neither exists.** The actual schema:

- Membership: presence of an active doc at `families/{familyId}/members/{userId}`
  (field `active: true`).
- Ownership: `members/{userId}.role == 'owner'`.
- Import admin: `members/{userId}.role == 'owner'` AND
  `members/{userId}.legacyImportAdmin == true`.

All `isMember` / `isOwner` / `isLegacyImportAdmin` helpers must use `get()` on the
member subcollection — not array fields on the family doc.

---

## 1. Current loose-rules risk summary

The current Firebase Console rules are described as "loose private-rebuild rules."
This typically means something like:

```
allow read, write: if request.auth != null;
```

applied at the root or at `families/{familyId}`. The risks:

| Risk | Impact |
|------|--------|
| Any signed-in user can read any family's babies and entries | High — data leakage across families |
| Any signed-in user can write/modify any family's entries | High — data corruption |
| Any signed-in user can create or revoke invites in any family | High — account takeover vector |
| Any signed-in user can overwrite any baby doc | High |
| `legacyImportAdmin` flag can be self-granted by setting it on own member doc | High — privilege escalation |
| Hard `deleteDoc` on entries is allowed (even though app never calls it) | Medium — irreversible data loss |

There is no source-of-truth rules file in the repository. The current state is
unaudited.

---

## 2. Exact proposed rules snippet

Paste the entire block below into Firebase Console → Firestore → Rules.
Do not edit it before reading the Notes section (§3) to understand constraints.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ── Helpers ───────────────────────────────────────────────────────────────

    function memberPath(familyId) {
      return /databases/$(database)/documents/families/$(familyId)/members/$(request.auth.uid);
    }

    // True if the requesting user has an active member doc in this family.
    function isMember(familyId) {
      return request.auth != null
          && exists(memberPath(familyId))
          && get(memberPath(familyId)).data.active == true;
    }

    // True if the requesting user is an active owner of this family.
    function isOwner(familyId) {
      return request.auth != null
          && exists(memberPath(familyId))
          && get(memberPath(familyId)).data.active == true
          && get(memberPath(familyId)).data.role == 'owner';
    }

    // Minimal type check for entry writes. Enum validation lives in app code.
    function validEntry(data) {
      return data.entryDate is string
          && (data.entryTime == null || data.entryTime is string)
          && (data.amountMl  == null || data.amountMl  is number)
          && (data.diaper    == null || data.diaper    is string);
    }

    // ── Family doc ────────────────────────────────────────────────────────────
    match /families/{familyId} {
      allow read:          if isMember(familyId);
      allow update:        if isOwner(familyId);
      allow create, delete: if false;

      // ── Members ──────────────────────────────────────────────────────────
      match /members/{memberId} {
        // Any active member can read member docs in their family.
        allow read: if isMember(familyId);

        // Owners can update any member doc in their family.
        // The legacyImportAdmin flag may not be changed via the app —
        // it must remain equal to its current value (or absent) on update.
        allow update: if isOwner(familyId)
            && (
              !('legacyImportAdmin' in request.resource.data)
              || request.resource.data.legacyImportAdmin
                 == resource.data.get('legacyImportAdmin', false)
            );

        // A signed-in user may create their own member doc (join-family flow).
        // Role is pinned to 'caregiver'; legacyImportAdmin must not be set.
        // The invite-code validation is handled in app code (JoinFamilyView).
        allow create: if request.auth != null
            && memberId == request.auth.uid
            && request.resource.data.role == 'caregiver'
            && request.resource.data.active == true
            && !('legacyImportAdmin' in request.resource.data);

        allow delete: if false;
      }

      // ── Babies ────────────────────────────────────────────────────────────
      match /babies/{babyId} {
        allow read:          if isMember(familyId);
        allow create, update: if isOwner(familyId);
        allow delete:         if false;

        // ── Entries ────────────────────────────────────────────────────────
        match /entries/{entryId} {
          allow read: if isMember(familyId);
          // Any active member (owner or caregiver) can create/update entries.
          // The Import CSV tool writes to this same path; it is additionally
          // gated in the app by legacyImportAdmin. Firestore enforces member
          // access; app code enforces the admin gate.
          allow create: if isMember(familyId) && validEntry(request.resource.data);
          allow update: if isMember(familyId) && validEntry(request.resource.data);
          // Hard delete is forbidden. Soft-delete only (deleted: true via update).
          allow delete: if false;
        }

        // ── Weekly settings ────────────────────────────────────────────────
        match /weeklySettings/{weekStartDate} {
          allow read:          if isMember(familyId);
          allow create, update: if isMember(familyId);
          allow delete:         if false;
        }
      }

      // ── Invites ───────────────────────────────────────────────────────────
      match /invites/{inviteId} {
        // Owners: full access (create, list, revoke, read).
        allow read, write: if isOwner(familyId);

        // Any signed-in user may GET (not list) a specific invite doc.
        // This is the minimum needed for the join-family flow —
        // JoinFamilyView fetches by inviteId after the user is authenticated.
        allow get: if request.auth != null;

        // Active members (non-owner) may mark an invite as accepted —
        // this happens in the join flow after addMember creates their doc.
        // Constrained: status must be 'accepted', acceptedByUserId must be self.
        allow update: if isMember(familyId)
            && request.resource.data.status == 'accepted'
            && request.resource.data.acceptedByUserId == request.auth.uid;
      }
    }
  }
}
```

---

## 3. Notes on the proposed rules

### `isMember` uses three `get()`/`exists()` calls per helper invocation

Firestore caches document reads within a single request evaluation. All calls to
`get(memberPath(familyId))` for the same path in the same rule check resolve to
a single backend read. Total extra reads per operation: 1 (the member doc).

### The family doc has no `memberIds` array and no `ownerUid` field

Correcting Phase 8A: membership is purely subcollection-based. Any app code or
external tooling that tries to maintain a `memberIds` array on the family doc
should not be trusted for access control.

### `legacyImportAdmin` can only be set via Firebase Console

The `update` rule for members blocks changing this flag via the app. An owner
trying to set `legacyImportAdmin: true` on their own member doc via
`updateMember()` will be denied. The flag must be set directly in the Firebase
Console (Firestore → Data → families → {id} → members → {uid} → Edit).

### Caregivers cannot manage invites

The `allow read, write: if isOwner(familyId)` rule on invites blocks
caregivers from creating or revoking invites. The `allow update` carve-out
for accepting invites is tightly scoped (status = 'accepted', own UID only).

### New joiners create their own member doc

The `allow create: if request.auth != null && memberId == request.auth.uid`
rule is required for the join-family flow. It allows any signed-in user to
create a member doc only under their own UID. The `role == 'caregiver'`
constraint prevents joining as owner. Invite-code validation is app-side.

### `allow delete: if false` on entries

The app uses soft-delete (`deleted: true`). Hard `deleteDoc` was removed in
Phase 7E. This rule enforces it at the database level.

### `/feeds` is intentionally absent

See §9.

---

## 4. Exact rollback rules snippet

**Before deploying: open Firebase Console → Firestore → Rules and copy the
current rules into a safe text file. That is your rollback snippet.**

Below is the canonical representation of "loose private-rebuild rules" for
reference. Use the Console copy if it differs:

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

To roll back: paste the above (or your saved copy) into Firebase Console →
Firestore → Rules → Replace all → Publish. Effective within 30 seconds.

---

## 5. Firebase Console deployment instructions

1. **Save current rules** — Firebase Console → Firestore → Rules → copy all
   text → paste into a local file. Keep it. This is the rollback.

2. **Copy proposed rules** — copy the entire block from §2 above (starts with
   `rules_version = '2';`, ends with the closing `}`).

3. **Open Firebase Console** → select your project → Firestore → Rules tab.

4. **Delete all existing rules text** in the editor.

5. **Paste the proposed rules** into the editor.

6. **Review visually** — confirm the closing braces are balanced and the text
   matches §2 exactly.

7. **Click "Publish"** — rules are live within ~30 seconds.

8. **Run the manual test checklists** (§6–§9) immediately after publishing.

9. **If any test fails** → immediately paste the rollback snippet (§4) and
   re-publish. Then investigate before retrying.

---

## 6. Owner manual test checklist

Perform as a signed-in user with `role: 'owner'` AND `legacyImportAdmin: true`.

- [ ] Ledger loads — entries visible for the active baby
- [ ] Add entry (+ button) creates a new entry in Firestore
- [ ] Edit entry field (time, mL, diaper) saves successfully
- [ ] Soft-delete an entry (delete button in detail sheet) — entry gets
      `deleted: true`, does not disappear from Firestore
- [ ] Weekly settings (bottle amount) save and reload correctly
- [ ] Baby profile — baby details readable
- [ ] Navigate to `/invite` — invite page loads
- [ ] Create an invite link — link generates without error
- [ ] Revoke an invite — invite status changes to 'revoked'
- [ ] Navigate to `/admin/legacy-import` — Import CSV page loads
- [ ] Upload a valid Jojo export CSV — preview appears, no access error
- [ ] Confirm import phrase and click Import — entries write to Firestore

---

## 7. Caregiver manual test checklist

Perform as a signed-in user with `role: 'caregiver'` (no `legacyImportAdmin`).

- [ ] Ledger loads — entries visible for the active baby
- [ ] Add entry creates a new entry successfully
- [ ] Edit entry field saves successfully
- [ ] Soft-delete an entry completes successfully
- [ ] Weekly settings readable
- [ ] Navigate to `/invite` — redirected away (app gate; owner-only)
- [ ] Navigate to `/admin/legacy-import` — redirected away (app gate;
      legacyImportAdmin-only)
- [ ] Attempting to manually write a member doc with `legacyImportAdmin: true`
      via browser console → should be blocked (permission-denied)
- [ ] Attempting to create or revoke an invite directly via browser console →
      should be blocked (permission-denied)

---

## 8. Invite acceptance manual test checklist

Perform with a fresh account that has never joined the family.

- [ ] Owner creates an invite link at `/invite`
- [ ] Open invite link (`/join-family?familyId=…&inviteId=…&code=…`) in a
      private/incognito window
- [ ] Page shows the sign-in/create-account form (not an error)
- [ ] Sign in or create a new account
- [ ] After auth, page shows the "Join as caregiver" form
- [ ] Fill in display name and submit — `addMember` creates member doc
- [ ] Invite status updates to 'accepted' — `acceptInvite` succeeds
- [ ] Page shows "You've joined the family" (or auto-redirects)
- [ ] Sign in as the owner and confirm new member appears in the family
- [ ] New member's `role` is 'caregiver', `legacyImportAdmin` is absent/false

---

## 9. Import CSV admin test checklist

Perform as owner with `legacyImportAdmin: true`.

- [ ] Navigate to `/admin/legacy-import`
- [ ] Upload a Jojo export CSV with matching baby name → preview shows, no error
- [ ] Upload a CSV with a different baby name → "CSV baby does not match" error
      blocks the import button
- [ ] Upload a valid CSV → type confirmation phrase → Import button appears
- [ ] Complete import → result summary shows rows written
- [ ] Re-import the same CSV → idempotent (no duplicate entries — same IDs
      overwrite existing docs)
- [ ] Check Firestore directly: entry docs exist under correct family/baby path,
      `deleted: false` entries are present, no hard deletes occurred

---

## 10. /feeds recommendation

**The app codebase contains no `/feeds` path references.** The feeds collection
is presumed to belong to a separate, older HTML app that is outside the scope of
this codebase.

**Option A — Old HTML app is still in use (retain current feeds rules):**
Do not add any `match /feeds/{document=**}` rule in this deployment. The proposed
rules in §2 contain no feeds rule, so the feeds collection retains whatever rules
were previously in effect. This is the correct default.

**Option B — Old HTML app is retired:**
Add the following block inside the `match /databases/{database}/documents` block
in §2 (after the families block) to explicitly deny all feeds access:

```
    // /feeds — retired HTML app; all access denied.
    match /feeds/{document=**} {
      allow read, write: if false;
    }
```

**Risk if Option B is applied prematurely:** If the old app is still making reads
or writes to `/feeds`, this rule will immediately break it with `permission-denied`
errors. There is no gradual rollout. Only apply Option B after confirming the old
app is fully offline and no clients are making feeds requests.

**Recommended action:** Deploy Option A (no feeds rule) for now. Schedule a
separate audit to confirm old-app retirement, then add Option B in a follow-up
deployment.

---

## 11. Known risks and rollback trigger conditions

### Risks after deploying the proposed rules

| Risk | Severity | Notes |
|------|----------|-------|
| `isMember` `get()` adds latency to every read/write (member doc lookup) | Low | Firebase caches within request; typically < 5 ms |
| Join flow may fail if member doc creation races with invite acceptance | Low | `addMember` awaits before `acceptInvite`; sequential in app code |
| Owner cannot invite another owner (join pinned to 'caregiver') | Low | Current app only creates caregiver invites; update rule if needed |
| A member doc with `legacyImportAdmin: true` set before these rules were deployed will remain effective | Low | Existing flag is respected; only new self-grants are blocked |
| Feeds access breaks if old app is still in use AND rules were accidentally extended to cover feeds | High | §2 rules do NOT include a feeds rule, so this risk is only triggered by manual error |

### Rollback trigger conditions

Roll back immediately if any of the following occur after deployment:

1. The ledger fails to load entries for any family member.
2. Caregivers receive `permission-denied` on creating or editing entries.
3. The join-family flow returns `permission-denied` at any step.
4. The Import CSV tool returns `permission-denied` for a confirmed
   `legacyImportAdmin` user.
5. Any previously working feature returns a Firestore `permission-denied` error
   that was not present before deployment.

Rollback procedure: Firebase Console → Firestore → Rules → paste §4 rollback
snippet → Publish. Effective within ~30 seconds. No code change required.
