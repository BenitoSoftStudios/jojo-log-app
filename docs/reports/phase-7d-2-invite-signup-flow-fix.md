# Phase 7D-2 — Invite Signup Flow Fix

**Date:** 2026-05-25
**Status:** Complete and committed.

## Root cause

`onMounted` in `JoinFamilyView.vue` called `getInvite()` and `getFamily()` (Firestore reads) before checking `currentUser`. An unauthenticated user hits Firestore with no auth token → permission-denied error → `Promise.allSettled` resolves with `status: 'rejected'` → `invite.value = null` → the `!invite.value` check triggers → "Invite invalid" shown immediately.

The user never saw the sign-in form.

## What changed

### src/families/JoinFamilyView.vue

**Step order rewritten:**

| Before | After |
|--------|-------|
| Wait for authReady | Wait for authReady |
| Validate URL params | Validate URL params (same) |
| **Fetch Firestore immediately** | **If not signed in → `step = 'auth'` (zero Firestore calls)** |
| Check auth state | — |
| Show auth form only if Firestore succeeded | Show auth form with invite context copy |
| Advance to form | After auth → `validateAndAdvance()` → form |

**New `validateAndAdvance()` function** — called only after the user is authenticated:
- Fetches `getInvite()` with distinct `permission-denied` error handling
- Fetches `getFamily()` opportunistically (non-blocking on failure) for the family name
- Validates `status`, `code` match in order: not-found → accepted → revoked → inactive
- Calls `findFamilyIdForUser()` to detect existing family membership:
  - Same family as invite → `step = 'already-joined'` → auto-redirect to ledger after 1.5s
  - Different family → `step = 'existing-member'` (blocked, clear message)
  - No family → `step = 'form'`

**New `'validating'` step** — brief spinner shown between auth success and Firestore response.

**New `'already-joined'` step** — shown and auto-redirects when user is already a member of this exact family.

**`handleAuth()`** — now calls `validateAndAdvance()` after sign-in/sign-up instead of the removed `advanceFromAuth()`. Invite params survive in the URL query string; no sessionStorage needed.

**Error messages:**
- `permission-denied` after auth → "Could not verify invite permissions. Make sure you are signed in to the right account."
- Network/other error → "Could not load invite. Check your connection and try again."
- Code mismatch / not found → "This invite link is not valid."
- Accepted → "This invite has already been accepted."
- Revoked → "This invite has been revoked by the owner."
- Inactive → "This invite is no longer active."

## Correct product flow (post-fix)

1. Family member opens invite link → URL params parsed.
2. Auth check: not signed in → `step = 'auth'` (no Firestore).
3. Family member signs in or creates account inline on same page.
4. Auth succeeds → `validateAndAdvance()` → Firestore queried.
5. Valid active invite → `step = 'form'` → choose display label.
6. Submit → `addMember` + `acceptInvite` + `loadFamily` → redirect to `/`.
7. Router guard passes: `localStorage.jojo_familyId` set, member doc exists with displayLabel.

## Safety confirmations

- No invite data modified
- No Firestore rules/indexes changed
- No feeds path referenced
- No deleteDoc
- No migration
- No PWA/Capacitor/SW/manifest
- No route paths changed
- No `familyService.js` changed

## Results

- Tests: 233 / 233 passing
- Build: clean (pre-existing chunk-size warning only)
- Commit: `ce80edd`
- main synced with origin/main: yes
- Vercel redeploy expected: yes
