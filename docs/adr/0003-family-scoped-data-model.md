# Store all data under a family-scoped Firestore path, not a global collection

The current app stores entries in a global `feeds/{entryId}` collection with open rules (`allow read, write: if true`). This is safe for a private app where the Firebase config is never shared, but it cannot support multiple families, per-family security, or a public release. The new structure scopes all data under `families/{familyId}`, with subcollections for `members`, `babies`, entries, weekly settings, and invite codes. This means security rules can enforce that a signed-in user can only access a Family where their uid appears in `members/{uid}` with an active record.

```
families/{familyId}
families/{familyId}/members/{userId}
families/{familyId}/babies/{babyId}
families/{familyId}/babies/{babyId}/entries/{entryId}
families/{familyId}/babies/{babyId}/weeklySettings/{weekStartDate}
families/{familyId}/inviteCodes/{inviteCodeId}
```

## Considered options

- **Keep global `feeds` and add a `familyId` field** — rejected. A global collection with a filter field cannot be secured with Firestore rules as reliably as a subcollection path, and it leaves legacy data intermingled with new data in ambiguous ways.
- **One collection per baby** — rejected. Puts babies at the top level rather than inside a Family, making it impossible to scope access to the family unit.

## Consequences

The old `feeds` collection must be kept intact and treated as read-only until Cutover. Migration copies documents into the new path and marks them as Legacy Entries. The old collection is not deleted until the HTML app is permanently retired.
