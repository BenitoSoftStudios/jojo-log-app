# Phase 7D — Family Member Invite Flow

**Date:** 2026-05-25
**Status:** Complete and committed.

## What changed

### src/families/familyService.js

Updated `addMember` to accept and persist `joinedViaInviteId` (default `null`).

Added five invite functions:
- `createInvite(familyId, { createdByUserId, createdByLabel, role })` — auto-generates a 16-char hex code via `crypto.getRandomValues`, writes `families/{familyId}/invites/{inviteId}` with full audit fields, returns `{ inviteId, code }`.
- `getInvite(familyId, inviteId)` — single doc fetch.
- `listActiveInvites(familyId)` — query `status == 'active'` on the invites sub-collection.
- `revokeInvite(familyId, inviteId, { revokedByUserId, revokedByLabel })` — sets status to `'revoked'` + timestamp.
- `acceptInvite(familyId, inviteId, { acceptedByUserId, acceptedByLabel })` — sets status to `'accepted'` + timestamp.

### src/families/InviteFamilyMemberView.vue (new)

Route: `/invite` (`requiresAuth: true`, owner-gated via `isOwner` check on mount).
- Loads active invites on mount via `listActiveInvites`.
- "New invite link" button: calls `createInvite`, refreshes list, shows full URL in a mint-bordered box.
- Each active invite row shows creator label + "Copy link" + "Revoke" buttons.
- Copy uses `navigator.clipboard.writeText` (silently no-ops on non-HTTPS dev).
- Revoke calls `revokeInvite`, removes row from list immediately.

### src/families/JoinFamilyView.vue (new)

Route: `/join-family?familyId=&inviteId=&code=` (`requiresAuth: false` — public link, auth handled inline).

Step machine: `init → invalid | auth | existing-member | form → done → /`

- `init`: wait for `authReady`, fetch invite + family in parallel (`Promise.allSettled`).
- Validation: checks `status === 'active'` and `code` match; shows specific reason for rejected/accepted/revoked.
- `auth`: inline sign-in / create-account form using existing `useAuth().signIn/signUp`. After auth success, calls `advanceFromAuth()`.
- `advanceFromAuth`: checks `findFamilyIdForUser` — if existing family found, shows `existing-member` error state instead of proceeding.
- `form`: display label + initials fields. On submit: `addMember` → `acceptInvite` → `localStorage.setItem('jojo_familyId')` → `loadFamily` → `router.push('/')`.
- `existing-member`: hard stop — account already linked to another family.
- `invalid`: shows specific reason + link back to sign in.

### src/app/router.js

Added two routes before the admin route:
- `{ path: '/invite', name: 'invite', meta: { requiresAuth: true } }` — lazy-loaded.
- `{ path: '/join-family', name: 'join-family', meta: { requiresAuth: false } }` — bypasses family check via public meta flag; auth handled in component.

### src/entries/CareLedgerView.vue

Added owner-only menu item "Invite member" → `/invite`, after "Manage Caregivers".

## Invite data model

```
families/{familyId}/invites/{inviteId}
```

Fields: `inviteId`, `code` (16-char hex), `role`, `status` (active/accepted/revoked),
`createdAt`, `createdByUserId`, `createdByLabel`,
`acceptedAt`, `acceptedByUserId`, `acceptedByLabel`,
`revokedAt`, `revokedByUserId`, `revokedByLabel`.

Member doc on join: `joinedViaInviteId` field added; `role` taken from invite doc.

## Invite URL format

```
https://{origin}/join-family?familyId={familyId}&inviteId={inviteId}&code={code}
```

## Security posture note

This implementation does not include Firestore security rules enforcement.
In production:
- Only `role === 'owner'` members should be allowed to write to `families/{familyId}/invites`.
- `acceptInvite` and `addMember` should only succeed when a matching active invite with the correct code exists.
- Consider expiry (TTL field) and rate limiting for invite creation.

No email, no Cloud Functions, no public hardening implemented in this phase (per spec).

## Tests

233 / 233 passing. No new tests required (invite functions are pure Firestore I/O with no logic to unit-test independently).
