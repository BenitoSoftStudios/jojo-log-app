# Phase 7A — Admin Legacy CSV Import Plan

**Date:** 2026-05-24
**Status:** Plan only. No code changes.

---

## 1. Recommended Import Architecture

```
src/admin/LegacyImportView.vue       — upload, preview, confirm UI
src/utils/legacyCsvParser.js         — pure CSV parse + transform + validate
src/test/legacyCsvParser.test.js     — unit tests for parse/transform/validate
```

The write phase (Firestore batch writes) is deferred to Phase 7B.
This phase (7A) implements everything up to and including preview + confirmation phrase.

### Data flow

```
CSV file (browser FileReader)
  → legacyCsvParser.parseRows(text)        — raw rows
  → legacyCsvParser.transformRows(raw)     — mapped Entry objects with legacy-csv-NNNNNN IDs
  → legacyCsvParser.validateRows(entries)  — validation result: errors, warnings, counts
  → LegacyImportView preview panel
  → confirmation phrase "IMPORT TO JOJO"
  → [Phase 7B] batch setDoc writes to Firestore
```

All parsing is client-side. No backend, no Cloud Function.

---

## 2. Route and Menu Placement

### Route

Add to `src/app/router.js`:

```js
{
  path: '/admin/legacy-import',
  name: 'admin-legacy-import',
  component: () => import('@/admin/LegacyImportView.vue'),
  meta: { requiresAuth: true }
}
```

Lazy-loaded. The route guard already enforces auth. The component adds its own admin gate check.

### Menu item

In `CareLedgerView.vue` menu nav, after the `+ Add Baby` button:

```html
<button v-if="isLegacyImportAdmin" class="menu-item" type="button"
        @click="router.push('/admin/legacy-import'); menuOpen = false">
  Legacy Import
</button>
```

`isLegacyImportAdmin` is a computed exported from `useFamily()` (see §3).
Hidden from all non-admin users. No visual hint that the route exists.

---

## 3. Admin Gating Strategy (No Env Vars)

### Firestore field

Add `legacyImportAdmin: true` manually in the Firebase console to:

```
families/{familyId}/members/{ownerUid}
```

No code change to `addMember` — the field is one-off admin config, not part of normal member creation.

### Computed in useFamily

In `useFamily()`, add:

```js
const isLegacyImportAdmin = computed(() =>
  _currentMember.value?.role === 'owner' &&
  _currentMember.value?.legacyImportAdmin === true
)
```

Return it from `useFamily()`.
`getMember` already returns `snap.data()`, so any field present in Firestore is automatically available.

### Component-level gate

`LegacyImportView.vue` checks on mount:

```js
const { isLegacyImportAdmin } = useFamily()
if (!isLegacyImportAdmin.value) router.replace('/')
```

Double gate: menu item is hidden AND route redirects if accessed directly.

### Why not env vars

- `VITE_` env vars are compiled into the bundle and visible to anyone who inspects it.
- The Firestore member record is not public — it requires auth + correct familyId + matching userId.
- App-level gating is sufficient for this private rebuild phase.
- Note: Firestore rules do not yet enforce admin-only import writes. That is a Phase 7B task.

---

## 4. CSV Parsing and Validation Behavior

### Parser: `legacyCsvParser.parseRows(text)`

- Splits on `\r\n` or `\n`.
- Skips the header row.
- Skips blank rows.
- Returns array of raw row objects: `{ Date, Time, 'Amount (mL)', Diaper, VitaminD, Notes, _rowIndex }`.
- `_rowIndex` is 1-based (matches spreadsheet row numbers for debugging).

### Transformer: `legacyCsvParser.transformRows(rawRows)`

Returns array of entry objects ready for Firestore (minus Firestore-specific timestamps):

```js
{
  id:               'legacy-csv-000001',   // deterministic, 6-digit zero-padded row index
  entryDate:        '2026-03-23',
  entryTime:        '07:15',
  amountMl:         120,                  // null if blank
  diaper:           'W',                  // null if blank; 'none' → '-'
  vitaminD:         false,                // 'yes' → true; blank → false
  medication:       false,
  tummyTimeCount:   0,
  notes:            '',
  source:           'legacy',
  createdByLabel:   'Legacy',
  createdByUserId:  null,
  deleted:          false,
  deletedAt:        null,
  deletedByLabel:   null,
  deletedByUserId:  null,
  updatedAt:        null,
  updatedByLabel:   null,
  updatedByUserId:  null,
}
```

### Validator: `legacyCsvParser.validateRows(entries)`

Returns:

```js
{
  rowCount:        652,
  dateRange:       { min: '2026-03-23', max: '2026-05-24' },
  totalMl:         42998,
  blankAmountRows: 1,
  blankDiaperRows: 1,
  zeroMlRows:      103,
  vitaminDYesRows: 54,
  notesRows:       137,
  duplicates:      [{ entryDate, entryTime, rows: [n, m] }, ...],  // 4 expected
  errors:          [],   // fatal: unparseable date, invalid time, unknown diaper value
  warnings:        [],   // non-fatal: duplicate date+time, blank amount, blank diaper
}
```

Errors block import. Warnings are shown in preview but do not block.

### Preview panel

Shows:
- Destination: **Jojo** (baby nickname, from `activeBaby.value.nickname`)
- Row count, date range, total mL
- Blank amount rows, blank diaper rows, 0 mL rows
- Duplicate date+time pairs (listed by date/time)
- VitaminD yes count, notes rows
- Error list (if any — import blocked)
- Warning list

### Confirmation phrase

A text input the user must type exactly:

```
IMPORT TO JOJO
```

Where `JOJO` is `activeBaby.value.nickname.toUpperCase()`.
The Import button stays disabled until the phrase matches exactly (case-sensitive).
Import button is not shown in Phase 7A (write phase is deferred).

---

## 5. Column Mapping Rules

| CSV column     | Entry field      | Transform                                     |
|----------------|------------------|-----------------------------------------------|
| Date           | entryDate        | Already YYYY-MM-DD; validate parseable        |
| Time           | entryTime        | Already HH:MM; validate format                |
| Amount (mL)    | amountMl         | blank → null; number string → parseInt        |
| Diaper         | diaper           | W/P/WP → as-is; none → "-"; blank → null      |
| VitaminD       | vitaminD         | "yes" → true; blank → false                   |
| Notes          | notes            | blank → ""; text → verbatim                   |
| —              | source           | "legacy" (hardcoded)                          |
| —              | createdByLabel   | "Legacy" (hardcoded)                          |
| —              | medication       | false                                         |
| —              | tummyTimeCount   | 0                                             |
| —              | deleted          | false                                         |

All other entry fields (deletedAt, deletedByLabel, etc.) → null.

---

## 6. Entry ID Strategy

**Format:** `legacy-csv-NNNNNN` where NNNNNN is the 1-based CSV row index, zero-padded to 6 digits.

- Row 1 → `legacy-csv-000001`
- Row 652 → `legacy-csv-000652`

**Why deterministic:**
- `setDoc` with a known ID is idempotent — re-running the import overwrites with the same data rather than creating duplicates.
- The row index is stable: the CSV is fixed, never regenerated.
- No random IDs, no Date+Time IDs (not unique — 4 duplicates exist).

**Phase 7B write:** use `setDoc(entryRef(familyId, babyId, entry.id), data)` for each row.
Wrap in batches of 500 (Firestore batch limit) for atomicity and progress reporting.

---

## 7. Destination Baby Safety

- Destination is **always** the currently active baby (`activeBaby.value`).
- The baby nickname is shown prominently before the file upload step.
- If `activeBaby.value` is null or not Jojo, the import tool shows an error and does nothing.
- The confirmation phrase includes the baby nickname: `IMPORT TO {NICKNAME.toUpperCase()}`.
- The import tool **does not** accept a babyId prop, query param, or env var.
- The import tool **does not** create a new baby.
- The import tool **does not** allow selecting a different baby (switching babies changes `activeBaby` globally — the user must be on Jojo before opening the tool).

---

## 8. Dummy Purge Plan

A separate panel within `LegacyImportView.vue` (or a sibling route `/admin/purge-test-entries`).

### Scope

Entries for the active baby where `source !== 'legacy'` (i.e., `source === 'app'` or source is missing).
Does **not** touch feeds, babies, weeklySettings, or members.

### Behavior

1. Load list of purgeable entries from the existing `entries` + `deletedEntries` refs.
2. Show count, date range, a sample of up to 5 rows.
3. Require confirmation phrase: `PURGE TEST ENTRIES`
4. On confirm: call `softDeleteEntry` for each entry (sets `deleted: true`).
5. Show progress count.

### Constraint

Uses `softDeleteEntry` only — no `deleteDoc`. Purged entries move to Recently Deleted.
If permanent removal is needed, that requires a separate decision to relax the no-deleteDoc rule.

### Why not hard delete now

The no-deleteDoc rule is standing policy for the private rebuild phase. Soft-deleted entries do not appear in the ledger or CSV export (export uses `entries.value` which excludes deleted). They are invisible to the app in normal use.

---

## 9. Wife Account / Member Plan

### Short-term (manual, no invite flow)

1. She creates a Firebase Auth account using the app's sign-in page (Google or email).
2. After sign-in, the app routes her to `/setup-profile` (no family found).
3. She stops at setup profile — does not create a new family.
4. Admin (owner) finds her UID in Firebase Auth console → Authentication → Users.
5. Admin runs a one-time member add in the browser console or via Firebase console:

   ```js
   // families/{familyId}/members/{herUid}
   {
     userId: '<her-uid>',
     email: '<her-email>',
     role: 'caregiver',
     displayLabel: 'Mama',
     initials: 'M',
     joinedAt: <serverTimestamp>,
     invitedByUserId: <ownerUid>,
     active: true
   }
   ```

6. She reloads the app — `findFamilyIdForUser` resolves her UID to the existing family.
7. She now sees the ledger under the correct family.

### Risks

- She must not click through setup screens and accidentally create a new family before the member record is added.
- Mitigation: brief her to stop at `/setup-profile` and wait.
- The router guard checks for a member record and will not proceed without one — so even if she lands on `/family-setup`, creating a family there would make a second family. She must be told explicitly: do not click "Create Family."

### Long-term (future)

Implement an invite flow: owner generates an invite token stored in Firestore; invitee redeems it to join the existing family rather than creating a new one. This is out of scope for Phase 7.

---

## 10. Risks and Blockers

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| 1 | Firestore rules do not enforce admin-only writes for legacy import path | Medium | App-level gate is sufficient for private rebuild. Enforce in rules before any multi-user production rollout. |
| 2 | Duplicate Date+Time rows (4 known) | Low | Deterministic row-index IDs mean duplicates get separate IDs. Preview shows them as warnings. Reviewer decides whether to proceed. |
| 3 | Active baby is wrong when import is triggered | Low | Import tool shows baby nickname prominently; confirmation phrase includes it; aborts if activeBaby is null. |
| 4 | `legacyImportAdmin` field not yet set in Firestore | Low-blocker | Must be set manually in Firebase console before testing. Step 1 of Phase 7B setup. |
| 5 | Wife creates a second family before member record is added | Medium | Brief her; router will leave her at /setup-profile until the member record exists. |
| 6 | Soft-delete purge does not free Firestore storage | Low | Accepted for now. Hard delete can be revisited. |
| 7 | 652-row import in 500-item batches — second batch could fail leaving partial import | Low | Idempotent IDs allow safe retry. Partial state is visible in preview counts on next attempt. |

---

## 11. Recommended Next Phase

**Phase 7B: Implement admin tools**

Order:
1. Set `legacyImportAdmin: true` on owner member record in Firebase console (pre-step, manual).
2. Implement `legacyCsvParser.js` + tests.
3. Implement `LegacyImportView.vue` (upload → parse → validate → preview → confirm phrase).
4. Add route `/admin/legacy-import` to router.
5. Add menu item (admin-gated) in CareLedgerView.
6. Add `isLegacyImportAdmin` computed to `useFamily`.
7. Implement purge panel (soft-delete test entries).
8. Test end-to-end with the real CSV: verify preview counts match known values (652 rows, 42,998 mL, 4 duplicates).
9. Phase 7C: write phase — batch setDoc with progress bar and result summary.

Write phase (7C) is deliberately separate so the preview + confirmation can be validated before any Firestore writes occur.
