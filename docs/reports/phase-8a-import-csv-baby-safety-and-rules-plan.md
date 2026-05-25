# Phase 8A — Import CSV Baby Safety + Firestore Rules Hardening Plan

**Date:** 2026-05-25
**Status:** Part 1 implemented and committed. Part 2 is a plan only — no rules deployed.

## Part 1: Import CSV Baby Safety (implemented)

### Changes

| File | Change |
|------|--------|
| `src/utils/appCsvImporter.js` | Collect `babyNickname` per row into `seenBabyNames` Set + `hasBlankBabyName` boolean; expose in preview |
| `src/test/appCsvImporter.test.js` | 6 new tests for baby name tracking |
| `src/admin/LegacyImportView.vue` | Safety check: push error if babyNames ≠ active baby; show "Baby name in CSV" in preview |

### Parser changes (`appCsvImporter.js`)

After the blank-entryId `continue` (skipped rows do not contribute):

```js
const babyNickname = get('babyNickname')
if (babyNickname === '') { hasBlankBabyName = true } else { seenBabyNames.add(babyNickname) }
```

Preview now includes: `babyNames: [...seenBabyNames].sort()` and `hasBlankBabyName`.
`babyNickname` is NOT stored on the entry object — only tracked for safety.

### Safety check in `LegacyImportView.vue`

After a successful parse:

```js
const { babyNames, hasBlankBabyName } = result.preview
const expectedName = activeBaby.value?.nickname ?? ''
if (hasBlankBabyName || babyNames.length !== 1 || babyNames[0] !== expectedName) {
  parseErrors.value.push('CSV baby does not match the active baby.')
}
```

This blocks import (same `parseErrors` array that gates the Import button) when:
- Any row has a blank `babyNickname`
- CSV contains more than one distinct baby name
- The single baby name does not match the active baby's nickname (case-sensitive)

---

## Part 2: Firestore Rules Hardening Plan (plan only — not deployed)

### Current state

No `firestore.rules` file exists in the repository. The app relies on whatever rules were last deployed manually via the Firebase console or CLI outside this codebase. This is a risk: there is no source-of-truth for the rules, no review process, and no way to test them in CI.

### Current risk assessment

| Path | Known risk |
|------|-----------|
| `families/{familyId}` | Unknown — may be open read/write |
| `families/{familyId}/babies/{babyId}` | Unknown |
| `families/{familyId}/babies/{babyId}/entries/{entryId}` | Unknown |
| `families/{familyId}/invites/{inviteId}` | Unknown — invite codes are sensitive |
| `/feeds/**` (if it exists) | Must remain untouched by these rules |

### Recommended rules structure

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ── Family ─────────────────────────────────────────────────────────
    match /families/{familyId} {
      // Any authenticated user may read a family doc they belong to.
      allow read: if request.auth != null
                  && request.auth.uid in resource.data.memberIds;

      // Only family owners may update family metadata.
      allow update: if isOwner(familyId);

      // No external creation — families are created via server-side logic only.
      allow create, delete: if false;

      // ── Members subcollection ─────────────────────────────────────
      match /members/{memberId} {
        allow read:   if isMember(familyId);
        allow write:  if isOwner(familyId);
      }

      // ── Babies ────────────────────────────────────────────────────
      match /babies/{babyId} {
        allow read:   if isMember(familyId);
        allow create: if isOwner(familyId);
        allow update: if isOwner(familyId);
        allow delete: if false;

        // ── Entries ─────────────────────────────────────────────────
        match /entries/{entryId} {
          allow read:   if isMember(familyId);
          allow create: if isMember(familyId)
                        && validEntry(request.resource.data);
          allow update: if isMember(familyId)
                        && validEntry(request.resource.data);
          allow delete: if false; // soft-delete only via `deleted: true`
        }
      }

      // ── Invites ───────────────────────────────────────────────────
      match /invites/{inviteId} {
        // Owner: full access to create/list/revoke.
        allow read, write: if isOwner(familyId);

        // Any authenticated user may read a specific invite doc
        // (needed for join-family flow to validate the invite code).
        // They cannot list all invites (no collection-level read).
        allow get: if request.auth != null;
      }
    }

    // ── Helper functions ────────────────────────────────────────────────
    function isMember(familyId) {
      return request.auth != null
          && request.auth.uid in
             get(/databases/$(database)/documents/families/$(familyId)).data.memberIds;
    }

    function isOwner(familyId) {
      return isMember(familyId)
          && get(/databases/$(database)/documents/families/$(familyId)).data.ownerUid
             == request.auth.uid;
    }

    function validEntry(data) {
      return data.entryDate is string
          && data.entryTime is string
          && (data.amountMl == null || data.amountMl is number)
          && (data.diaper   == null || data.diaper   is string);
    }
  }
}
```

### Notes on the rules above

- **`delete: false` on entries**: the app uses `deleted: true` (soft delete). Hard deletion via `deleteDoc` was removed in Phase 7E. This rule enforces that.
- **Invite `get` vs `list`**: the join-family flow calls `getInvite(inviteId)` — a single doc get. We only need to allow `get` for unauthenticated reads of invites during the join flow. Actually, `JoinFamilyView.vue` waits for auth before any Firestore call (Phase 7D-2 fix), so authenticated-only `get` is correct here.
- **`memberIds` field**: assumes the family doc has a `memberIds` array that is kept in sync when members join/leave. If the current schema does not have this field, `isMember` needs to be implemented differently (e.g., checking the `/members/{uid}` subcollection).
- **`/feeds/**`**: the plan deliberately does not include any rule for feeds paths. Feeds are out of scope and must not be touched.
- **`validEntry` function**: intentionally minimal — it only checks types, not value ranges. Tight enum validation (e.g., diaper ∈ {W,P,WP,-}) belongs in app code, not rules, to avoid deployment friction.

### Access matrix

| Actor | families | babies | entries | invites |
|-------|----------|--------|---------|---------|
| Unauthenticated | ✗ | ✗ | ✗ | get only (if invited) |
| Member (non-owner) | read | read | read + write | ✗ |
| Owner | read + update | read + write | read + write | full |

### Deployment steps (when ready)

1. Add `firestore.rules` to repo root.
2. Add `firebase.json` pointing at it (if not present).
3. Run `firebase emulators:start --only firestore` locally.
4. Write and run rules unit tests with `@firebase/rules-unit-testing`.
5. Deploy to staging project: `firebase deploy --only firestore:rules --project staging`.
6. Smoke test all app flows: ledger read/write, invite create/accept, CSV import.
7. Deploy to production: `firebase deploy --only firestore:rules --project production`.

### Test checklist for rules

- [ ] Unauthenticated user cannot read any family/baby/entry doc
- [ ] Authenticated member can read their family's entries
- [ ] Authenticated member can create/update entries in their family
- [ ] Authenticated member cannot create/update entries in another family
- [ ] `delete` on an entry doc is denied (soft-delete only)
- [ ] Owner can create/revoke invites; non-owner member cannot
- [ ] Invite `get` succeeds for any authenticated user (for join flow)
- [ ] Invite collection `list` is denied for non-owners
- [ ] Non-member cannot read any path under another family

### Rollback plan

Firebase Rules support instant rollback from the Firebase console (Rules tab → History). A rollback restores the previous deployed version in under 30 seconds with no code change required.

### `/feeds` recommendation

Do not add any rule for `/feeds/**` until the feeds feature is fully understood and scoped. The safest interim state is to leave the feeds path under whatever rules currently govern it (or deny-all if it is an unreachable path). A separate phase should audit and lock down feeds rules.
