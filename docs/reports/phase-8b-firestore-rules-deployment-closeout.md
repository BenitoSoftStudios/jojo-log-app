# Phase 8B — Firestore Rules Deployment Closeout

**Date:** 2026-05-26
**Status:** CLOSED — deployed, tested, no rollback

---

## 1. Deployment Summary

Hardened Firestore security rules were manually deployed to Firebase Console on 2026-05-26, completing the Phase 8B work begun in planning phases 8B through 8B-4. All three test scenarios passed. No rollback was required.

---

## 2. Deployment Method

Rules were applied manually via the Firebase Console (Firestore → Rules editor). The rules correspond exactly to §6 of `docs/reports/phase-8b-firestore-rules-deployment-package.md`. No CLI tooling (`firebase deploy`) was used. The deployed revision is the final rules snapshot from the Phase 8B-4 report.

---

## 3. Owner Test Checklist — PASSED

- Owner can read their own family doc
- Owner can read/write entries under their family's babies
- Owner can create and revoke invites
- Owner cannot grant themselves `legacyImportAdmin` via the app
- Owner member doc is not affected by the invite-create rule path

---

## 4. Caregiver Test Checklist — PASSED

- Active caregiver can read family doc
- Active caregiver can create and update entries under the family's babies
- Active caregiver cannot write to another family's data
- Active caregiver cannot create or revoke invites
- Active caregiver cannot elevate their own role or set `legacyImportAdmin`

---

## 5. Fresh Invite Acceptance Checklist — PASSED

- New user signed up via invite link and was granted caregiver membership
- `joinedViaInviteId` and `joinedViaInviteCode` were written to the new member doc (Phase 8B-4 app change confirmed working in live Firestore)
- Firestore rules verified invite `status == 'active'` and `code` match at the database level before allowing the member write
- Resulting member doc had `role: 'caregiver'`, `active: true`, `legacyImportAdmin` absent

---

## 6. Rollback

Not needed. All tests passed on first deployment. The previous rules (permissive) were in effect until this deployment; the hardened rules produced no permission-denied errors for legitimate operations.

---

## 7. Current Security Posture

| Area | Status |
|---|---|
| Unauthenticated reads | Denied on all collections |
| Cross-family data access | Denied — all rules scope to `familyId` path segment |
| Invite forgery | Blocked — rules verify `inviteId` exists, `status == 'active'`, and `code` matches the value written by the app |
| Role escalation | Blocked — `role` is immutable after member create; `legacyImportAdmin` is immutable via app writes |
| Unauthorized entry creation | Blocked — non-members cannot write; `source: 'legacy'` entries require `legacyImportAdmin` flag |
| Legacy import re-import | Admin bypass rule allows `batch.set` re-imports without triggering `protectedFieldsUnchanged` conflict |
| `legacyImportAdmin` self-grant | Blocked — field must equal its existing value on every member update; can only be set via Firebase Console |

---

## 8. Remaining Future Hardening Items

These were out of scope for Phase 8B and are not blockers:

- **Rate limiting / abuse prevention:** Firestore rules cannot enforce write-rate limits. If invite spamming or entry-flood becomes a concern, consider Cloud Functions triggers or App Check enforcement.
- **App Check:** Not currently enforced. Adding App Check attestation would prevent non-app clients from hitting the Firestore API at all, complementing the rules layer.
- **`weeklySettings` write rules:** Currently allow any active member to write. If per-baby access control is ever required (e.g., read-only caregivers), tighten this subcollection.
- **Invite expiry:** Invites have no TTL in rules or data. A `createdAt` + expiry window check in rules (or a Cloud Function cleanup job) would limit the window of a leaked invite link.
- **Audit logging:** No server-side write audit trail beyond Firestore's native history. A Cloud Function trigger on member writes could log membership changes to a protected audit collection.

---

## 9. Recommended Next Phase

**Phase 9 — Baby management hardening or UX polish**

The core data security posture is now sound. Recommended candidates for Phase 9:

- Baby add/edit/archive flow review (confirm no data leaks between families on baby operations)
- Entry export / download feature (currently no CSV export path from the live app)
- Caregiver profile edit (display label and initials update) — currently no in-app path for a caregiver to update their own member doc after joining

Select whichever aligns with the current product priority.
