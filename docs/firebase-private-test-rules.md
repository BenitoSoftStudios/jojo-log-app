# Firebase Private Rebuild Testing Rules

These are the temporary Firestore security rules required during Phase 3–N
parallel rebuild testing. They apply to the **jojos-log** Firebase project while
the Vue rebuild is being developed alongside the legacy app.

These are **not** the final production rules. They will be replaced at cutover
with hardened, family-scoped rules covering all collections.

---

## Rule requirements

### 1. Legacy feeds collection — must remain unchanged

The legacy `feeds` collection backs the production HTML app. Its existing rules
must not be altered until the cutover phase. Any rule set used during rebuild
testing must preserve whatever rule currently governs `feeds`.

### 2. Families — signed-in users only

The `families` collection and all sub-collections (`members`, `babies`) must be
readable and writable only by authenticated users. During private rebuild
testing a broad signed-in rule is acceptable because the project is not
publicly accessible.

```
match /families/{familyId} {
  allow read, write: if request.auth != null;
}

match /families/{familyId}/{document=**} {
  allow read, write: if request.auth != null;
}
```

### 3. Collection group read rule for returning-user recovery

The router guard calls `collectionGroup(db, 'members')` with
`where('userId', '==', uid)` to recover a returning user's `familyId` when
localStorage is empty (cross-device login, private browsing, cleared storage).

Firestore collection group queries are **not** covered by path-specific rules
such as `match /families/{familyId}/members/{userId}`. A separate wildcard rule
is required:

```
match /{path=**}/members/{userId} {
  allow read: if request.auth != null && request.auth.uid == userId;
}
```

Without this rule the collection group query returns `PERMISSION_DENIED`,
the router falls through to `/setup-profile`, and returning users are asked
to re-create their family on every private-tab or cross-device sign-in.

### 4. members.userId collection group index

The collection group query also requires a Firestore index. This is defined
in `firestore.indexes.json` under `fieldOverrides`:

- Collection group: `members`
- Field: `userId`
- Query scope: `COLLECTION_GROUP`
- Order: `ASCENDING`

Deploy with:

```
firebase deploy --only firestore:indexes
```

Or click the index-creation URL that Firestore prints in the browser console
when the query first runs without the index.

---

## What changes at cutover

At cutover the rules will be tightened to:

- Only family members may read their own family document and sub-collections
- The collection group rule will be scoped to `request.auth.uid == userId`
  (already done above) and reviewed against the full data model
- The legacy `feeds` rule will be evaluated for removal or archival
- All rules will be tested against the Firebase Rules Simulator before going live
