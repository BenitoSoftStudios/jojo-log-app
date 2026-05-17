Audit the Firebase rules and index configuration for this project. Do not modify any rules, indexes, or app code.

Read:
- `docs/firebase-private-test-rules.md`
- `firestore.indexes.json`

Check all of the following:

1. Legacy feeds: Is there a note confirming the legacy `feeds` collection rule must not be changed before cutover?
2. Families access: Is the `families` collection and sub-collections gated on `request.auth != null`?
3. Collection group read: Is there a `/{path=**}/members/{userId}` wildcard rule allowing collection group reads scoped to `request.auth.uid == userId`? This is required for cross-device returning-user recovery.
4. Index defined: Does `firestore.indexes.json` define a collectionGroup index for collectionGroup: `members` with fieldPath: `userId` ordered ASCENDING?
5. Scope: Do any rules grant broader access than required for the current phase (e.g., `allow read, write: if true`)?
6. Cutover note: Is there a clear note that these are private rebuild testing rules, not final production rules?

Report each check as PASS, FAIL, or NOT FOUND. If anything is missing or overly broad, explain what is required and why.

Do not modify rules, indexes, or any files.
