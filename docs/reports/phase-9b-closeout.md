# Phase 9B Closeout

**Date:** 2026-05-29
**Status:** COMPLETE

---

## What shipped

### Phase 9B — Member management and timezone settings

| Commit | Description |
|---|---|
| `5619c37` | Add member management and timezone settings |

**Part 1 — Owner member management (`ManageCaregiversView.vue`, `useFamily.js`)**

Owners can promote a caregiver to owner, demote another owner to caregiver, deactivate a
member, and reactivate a member — all from an inline management panel in the member list.
App-side last-owner guard prevents removing the last active owner. `isSelf()` guard hides
role-change and deactivation controls on the current user's own row. `legacyImportAdmin`
is never sent in update calls.

**Part 2 — Timezone setting (`SettingsView.vue`, `useFamily.js`, `dateUtils.js`,
`CareLedgerView.vue`, `useLedger.js`, `useLedgerActions.js`, `entryUtils.js`)**

Family timezone stored on `families/{familyId}.timezone`. Module-level `familyTimezone`
computed exported from `useFamily.js`. Header date/time, today stats, and new entry time
defaults all use the family timezone. Owner can save; non-owner sees read-only label.
7 new tests added (`dateUtils.test.js`). Total: 286 tests.

**Part 3 — Settings cleanup**

Display unit section simplified to "Coming later" note. Timezone section functional.

---

### Phase 9B-1 — Emergency login loop fix and usual bottle auto-fill removal

| Commit | Description |
|---|---|
| `b83ec1c` | Fix login loop and remove bottle autofill |

**Login loop fix (`SetupProfileView.vue`)**

See "Emergency login loop issue" section below for full root cause. Fix summary:
- Added `checking: ref(true)` gate — form hidden while `loadFamily` runs
- After load, if `hasDisplayLabel` → redirect to `/` before form is shown
- In `handleSubmit`, `familyError` guard blocks `/family-setup` path when Firestore
  load failed — prevents duplicate family creation for existing members

**Usual bottle auto-fill removal (`entryUtils.js`, `HelpView.vue`)**

`buildNewEntryDefaults` now always returns `amountMl: null`. The usual bottle weekly
reminder is display-only and no longer pre-fills `+ Day` or `+ Add Entry`. Help text
updated: "It does not auto-fill new entries — amount fields always start blank."

---

## Emergency login loop issue

### Symptom

After Phase 9B shipped, existing users were routed to the "Your display label" setup
screen instead of the Care Ledger. If they submitted the form before family state was
confirmed, they could be sent to `/family-setup`, creating a duplicate family document.

### Root cause (app-side)

`SetupProfileView.onMounted` rendered the form immediately before `loadFamily` completed.
`handleSubmit` treated any `familyId === null` result as "new user", including the case
where `loadFamily` threw a Firestore error. The form submission would then route to
`/family-setup` and call `createFamily`, producing a duplicate.

### Root cause (Firestore rules — manual fix required)

The router guard uses a collection-group query (`findFamilyIdForUser`) as a fallback when
`localStorage` does not have the cached `familyId` (new device, cleared storage, or after
the fast-path `getMember` threw). This query requires a collection-group read rule.

The deployed rules from Phase 8B only had:

```
match /families/{familyId}/members/{memberId} {
  allow read: if isMember(familyId);
  ...
}
```

There was no `/{path=**}/members/{memberId}` collection-group rule, so
`collectionGroup("members")` queries were denied with `permission-denied`. Without the
cached `familyId`, the guard could not discover the user's family → routed to
`/setup-profile` → `loadFamily` also failed → user stuck.

### Manual Firebase rules patch applied

Added directly in the Firebase Console (Firestore → Rules):

```
match /{path=**}/members/{memberId} {
  allow read: if request.auth != null
    && resource.data.userId == request.auth.uid;
}
```

### Why this rule is safe

| Property | Analysis |
|---|---|
| Auth required | `request.auth != null` — unauthenticated callers are rejected |
| Self-read only | `resource.data.userId == request.auth.uid` — a user can only read documents where the stored `userId` field matches their own UID; no cross-family reads are possible |
| Write path unaffected | The rule is `allow read` only; all write rules are unchanged |
| `userId` field set at creation | `familyService.addMember` always sets `userId` equal to the member's Firebase Auth UID; the field is never updated by any app code |
| Scope | This covers the collection-group `members` path (`/{path=**}/members/{memberId}`), which is only used by `findFamilyIdForUser` — a single `collectionGroup` query in `familyService.js` |
| Existing per-family rule still applies | The `match /families/{familyId}/members/{memberId}` rule continues to cover all in-family reads (member list, manage caregivers). The new rule only adds collection-group discovery. |

---

## Live checklist (all passed)

| # | Check | Result |
|---|---|---|
| 1 | Owner login reaches ledger | ✓ |
| 2 | Caregiver login reaches ledger | ✓ |
| 3 | My Profile works (owner) | ✓ |
| 4 | Manage Caregivers works | ✓ |
| 5 | Timezone setting works (owner save, caregiver read-only) | ✓ |
| 6 | `+ Add Entry` and `+ Day` do NOT auto-fill amount | ✓ |
| 7 | Usual bottle display and edit remain intact | ✓ |
| 8 | Import CSV and Invite Member hidden from caregiver | ✓ |

---

## Current app status

| Area | Status |
|---|---|
| Auth / login | Working — owner and caregiver reach ledger |
| Member management | Working — promote, demote, deactivate, reactivate |
| Timezone | Working — owner can set, all views use family timezone |
| Profile self-edit (owner) | Working |
| Profile self-edit (caregiver) | **Blocked by Firestore rules** — `updateMember` for own doc is denied for caregivers; requires a rules patch deploying `allow update: if request.auth.uid == resource.data.userId && <field whitelist>`. Documented in Phase 9A report. Low priority until caregivers need to change their own label. |
| Usual bottle | Reminder display only — does not auto-fill entries |
| CSV export / import | Working and unchanged |
| Invite flow | Working and unchanged |
| Tests | 286 / 286 passing |
| Build | Clean |

---

## Recommended next phase: Graphs

The `/graphs` route (`GraphView.vue`) exists in the router and is reachable from the
hamburger menu but the view content is a placeholder. The natural next phase is to
implement the graphs feature:

- Feed volume over time (daily mL, 7-day rolling average)
- Daily feed count
- Date-range picker (7 days, 30 days, all time)
- Timezone-aware x-axis (already available via `familyTimezone`)
- Per-baby scoping (already available via `activeBaby`)
- Suggested library: Chart.js via `vue-chartjs` (lightweight, no heavy dependency)
- No new Firestore reads required — `useEntries` already streams all entries

No Firestore rules, index, or data model changes are required for a read-only graphs view.
