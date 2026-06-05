# Phase 9I-1 — Import CSV owner-only access

## Summary

Changed the Import CSV access gate from `isLegacyImportAdmin` (owner + Console-only flag) to `isOwner` (owner role only). The Import CSV page, menu entry, and gate are now aligned with plain owner-only access. `isLegacyImportAdmin` is removed from `useFamily.js` and from all UI files. Help copy was already updated to say owner-only in a prior quick fix and required no further change. Firestore rules impact is assessed in §5 below.

---

## Changed files

| File | Change |
|------|--------|
| `src/admin/LegacyImportView.vue` | Gate changed from `isLegacyImportAdmin` to `isOwner`; denial copy changed from "Access denied. Admin only." to "Only owners can import CSV backups."; file comment updated; `onMounted` redirect updated |
| `src/entries/CareLedgerView.vue` | Import CSV menu `v-if` changed from `isLegacyImportAdmin` to `isOwner`; `isLegacyImportAdmin` removed from `useFamily()` destructure |
| `src/families/useFamily.js` | `isLegacyImportAdmin` computed removed; removed from return object |
| `src/families/ManageCaregiversView.vue` | Stale developer comment referencing `legacyImportAdmin` removed from file header |

---

## Import access behavior summary

| Role | Before | After |
|------|--------|-------|
| Owner with `legacyImportAdmin: true` | Allowed | Allowed |
| Owner without `legacyImportAdmin` | Blocked | **Allowed** |
| Caregiver | Blocked | Blocked |

Gate is now `isOwner` (role === 'owner'). The `legacyImportAdmin` Firestore field is no longer read by the app.

Denial copy (non-owner): `Only owners can import CSV backups.`

`onMounted` redirect: owners stay on page; caregivers are redirected to `/`.

All existing import behavior is preserved: active-baby scoping, wrong-baby blocking, duplicate detection, preview before write, confirmation phrase, batch write progress, import result display.

---

## Menu visibility summary

- Import CSV is now visible in the hamburger menu to all owners (`v-if="isOwner"`).
- Caregivers do not see Import CSV.
- Export CSV visibility (`v-if="isOwner"`) is unchanged.
- No other menu items were changed.

---

## Help copy summary

`src/help/HelpView.vue` already contains the line:

> The import tool is owner-only.

No further change required. No "admin-only" language remains in visible copy.

---

## Legacy admin cleanup summary

All `isLegacyImportAdmin` and `legacyImportAdmin` references have been removed from app UI and logic:

- `useFamily.js`: computed removed, not returned
- `LegacyImportView.vue`: import and usage replaced with `isOwner`
- `CareLedgerView.vue`: import and usage replaced with `isOwner`
- `ManageCaregiversView.vue`: stale developer comment removed

`grep -r "legacyImportAdmin\|isLegacyImportAdmin\|Admin only\|admin-only" src/` — **0 matches**.

The `legacyImportAdmin` Firestore field may still exist on existing owner member documents. This is acceptable: the app no longer reads or uses it. Database fields are not touched (task safety restriction; no member document mutation).

---

## Firestore rules impact assessment

**Current deployed rules status:** The deployed rules are the loose rebuild rules (`allow read, write: if request.auth != null`). They do not reference `isLegacyImportAdmin`. No deployed rules change is required for this phase to work correctly in production.

**Proposed Phase 8B hardened rules (not yet deployed):** The Phase 8B rules package (`docs/reports/phase-8b-firestore-rules-deployment-package.md`) uses `isLegacyImportAdmin` in two entry rules:

1. **Entry create** — `|| isLegacyImportAdmin(familyId)` allows CSV import entries where `source != 'app'` or `createdByLabel == 'Legacy'`.
2. **Entry update (admin bypass)** — `allow update: if isLegacyImportAdmin(familyId)` allows `batch.set()` re-imports that omit `createdByUserId`.

If the Phase 8B rules are deployed as written, owners without `legacyImportAdmin: true` will reach the Import CSV page (app gate now passes) but their `writeAppCsvEntries` batch writes will fail with `permission-denied`. The app gate and the rules gate would be mismatched.

**A rules patch is required before deploying the Phase 8B hardened rules.**

---

## Firestore rules patch

Replace `isLegacyImportAdmin` with `isOwner` in the two entry rules. Remove the `isLegacyImportAdmin` helper function.

**Entry create rule — replace:**

```
// Before:
allow create: if isMember(familyId)
    && validEntry(request.resource.data)
    && (
      (request.resource.data.source == 'app'
       && request.resource.data.get('createdByLabel', '') != 'Legacy')
      || isLegacyImportAdmin(familyId)
    );

// After:
allow create: if isMember(familyId)
    && validEntry(request.resource.data)
    && (
      (request.resource.data.source == 'app'
       && request.resource.data.get('createdByLabel', '') != 'Legacy')
      || isOwner(familyId)
    );
```

**Entry update admin bypass — replace:**

```
// Before:
// Admin update: unrestricted. Covers idempotent batch.set()
// re-imports that omit createdByUserId from their payload.
allow update: if isLegacyImportAdmin(familyId);

// After:
// Owner update: unrestricted. Covers idempotent batch.set()
// re-imports that omit createdByUserId from their payload.
allow update: if isOwner(familyId);
```

**Remove the `isLegacyImportAdmin` helper function entirely:**

```
// Remove this function:
function isLegacyImportAdmin(familyId) {
  return request.auth != null
      && exists(memberPath(familyId))
      && get(memberPath(familyId)).data.active == true
      && get(memberPath(familyId)).data.role == 'owner'
      && get(memberPath(familyId)).data.get('legacyImportAdmin', false) == true;
}
```

**Also update the member-update rule comment** (the Phase 8B rule says "Owners can update member docs but cannot grant legacyImportAdmin via the app"). Update this comment to remove the `legacyImportAdmin` reference since the app no longer uses the field. The `legacyImportAdmin` field constraint in the rule (`!('legacyImportAdmin' in request.resource.data) || ...`) may be kept or removed — it is a harmless safety constraint and removing it is optional.

Do not deploy Firestore rules as part of this phase.

---

## Tests result

**374 tests passing** (`npm test`). No new tests added — the gate change is a Vue template and composable change with no pure-logic functions to unit test. Manual QA checklist is provided below.

---

## Build result

`npm run build` — clean (0 errors). Pre-existing chunk size advisory unchanged.

---

## Safety confirmations

- No feeds path changed ✓
- No CSV parser/exporter behavior changed ✓
- No Firestore rules deployed ✓
- No Firestore indexes changed ✓
- No migration or bulk data mutation ✓
- No member documents mutated ✓
- `grep -r "deleteDoc" src/` — 0 matches ✓
- No PWA/Capacitor/SW/manifest ✓
- No image upload / Firebase Storage / external image URLs ✓
- No new dependencies ✓
- Import preview behavior unchanged ✓
- Wrong-baby blocking unchanged ✓
- Duplicate blocking unchanged ✓
- Export CSV behavior unchanged ✓

---

## Manual QA checklist

1. Log in as owner (no `legacyImportAdmin` flag required).
2. Confirm Import CSV is visible in the hamburger menu.
3. Navigate to Import CSV — confirm page loads and shows Destination section.
4. Log in as caregiver.
5. Confirm Import CSV is not visible in the hamburger menu.
6. Navigate directly to `/admin/legacy-import` as caregiver — confirm "Only owners can import CSV backups." is shown and user is redirected to `/`.
7. Confirm Help & Legend says "The import tool is owner-only."
8. As owner, export CSV from hamburger menu — confirm export works.
9. As owner, import the exported CSV — confirm preview shows "Baby name in CSV" correctly, duplicate blocking fires (all IDs overlap with existing log), import is blocked before any write.
10. Note: the app is NOT fully owner-import-ready at the rules level until the Phase 8B rules patch is applied. Under the current loose deployed rules, owner imports will succeed. If hardened rules are deployed without the patch, owner imports will fail at write time with `permission-denied`.

---

## Known issues or follow-ups

- The `legacyImportAdmin` Firestore field may still exist on some owner member documents. It is now unused by the app and can be ignored. Do not bulk-remove it from real data.
- The Phase 8B hardened rules package (`docs/reports/phase-8b-firestore-rules-deployment-package.md`) must be patched before deployment — replace `isLegacyImportAdmin` with `isOwner` in the two entry rules and remove the helper function.
- The `createdByLabel != 'Legacy'` guard in the entry-create rule is a pre-existing edge case: any member with display label literally "Legacy" cannot create normal app entries. This is unchanged by this phase.

---

## Commit hash

See `git log` after push.

## Main synced with origin/main

Yes — on main branch, up to date with origin/main before implementation.

## Vercel redeploy expected

Yes — 4 source files changed.
