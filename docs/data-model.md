# Data Model

All data lives under `families/{familyId}`. Nothing is stored in global collections except the legacy `feeds` collection, which is read-only and will be archived after Cutover.

---

## `families/{familyId}`

```js
{
  name: string,                        // e.g. "Jojo Family"
  timezone: string,                    // IANA tz, default "America/Toronto"
  unitPreference: "ml" | "floz",       // display unit; storage is always mL
  createdAt: Timestamp,
  createdByUserId: string,
  updatedAt: Timestamp
}
```

**Notes**
- `timezone` affects CSV audit timestamps, weekly grouping logic, and public user support. The ledger itself uses plain `entryDate`/`entryTime` strings, so timezone does not change Entry rendering for existing private use.
- `unitPreference` defaults to `"ml"`. All amounts are stored in mL regardless.

---

## `families/{familyId}/members/{userId}`

Document ID is the Firebase Auth UID.

```js
{
  userId: string,
  email: string,
  role: "owner" | "caregiver",
  displayLabel: string,                // required before logging; e.g. "Mum" or "JS"
  initials: string,                    // short form for tight UI spaces
  joinedAt: Timestamp,
  invitedByUserId: string | null,      // null for the founding owner
  active: boolean                      // false = removed/suspended, not deleted
}
```

**Notes**
- A Family must always have at least one Member where `role === "owner"` and `active === true`. In the private rebuild this is enforced in the client (the UI blocks the last Owner from removing or demoting themselves). For the public app, this invariant should be enforced server-side via a Cloud Function or Firestore security rule, because client-side checks can be bypassed.
- `displayLabel` is required. New Members must set it before the app allows them to create Entries.
- `email` is stored for owner reference only; it is not displayed to other caregivers.

---

## `families/{familyId}/babies/{babyId}`

```js
{
  nickname: string,                              // e.g. "Jojo"
  birthdate: "YYYY-MM-DD" | null,               // optional; used to show age in weeks
  defaultNextEntryIntervalMinutes: number,       // default 180 (3 hours)
  status: "active" | "inactive",
  createdAt: Timestamp,
  createdByUserId: string,
  updatedAt: Timestamp
}
```

**Notes**
- Baby profiles never require full legal name, sex, weight, doctor, health card, or photos.
- `status: "inactive"` means the Baby is archived. History remains queryable and exportable by Owners.
- `defaultNextEntryIntervalMinutes` drives the time prepopulation on New Entry.

---

## `families/{familyId}/babies/{babyId}/entries/{entryId}`

Each Entry is its own document. Document ID is a client-generated ID (e.g. `Date.now().toString(36) + random`).

```js
{
  entryDate: "YYYY-MM-DD",              // the care date; not a Firestore timestamp
  entryTime: "HH:mm",                  // 24-hour; the logged time of the event
  amountMl: number | null,             // null = blank/incomplete; 0 is valid
  diaper: "W" | "P" | "WP" | "-" | null, // null = blank/incomplete; "-" is valid
  vitaminD: boolean,                   // default false
  medication: boolean,                 // default false; details go in notes
  notes: string,                       // default ""
  createdByUserId: string | null,      // null for Legacy Entries
  createdByLabel: string,              // display label at time of creation; "Legacy" for migrated rows
  createdAt: Timestamp,
  updatedByUserId: string | null,
  updatedByLabel: string | null,
  updatedAt: Timestamp,
  deleted: boolean,                    // soft delete flag; default false
  deletedAt: Timestamp | null,
  deletedByUserId: string | null,
  deletedByLabel: string | null,
  source: "legacy" | "app"             // "legacy" for migrated rows, "app" for all new rows
}
```

**Completion rule**
- An Entry is Incomplete if `amountMl === null` OR `diaper === null`.
- An Entry is Complete if `amountMl` has any value (including `0`) AND `diaper` has any value (including `"-"`).
- `vitaminD`, `medication`, and `notes` never affect completion status.

**Feed total rule**
- Feed totals and feed count include only Entries where `amountMl > 0` AND `deleted === false`.
- A row with `amountMl === 0` (e.g. medication-only) is valid but does not contribute to mL totals or feed count.

**Ordering**
- Entries within a Day are sorted by `entryTime` ascending.

---

## `families/{familyId}/babies/{babyId}/weeklySettings/{weekStartDate}`

Document ID is the Monday date of the ISO week: `"YYYY-MM-DD"`.

```js
{
  weekStartDate: "YYYY-MM-DD",         // Monday of the ISO week; same as document ID
  usualBottleAmountMl: number | null,  // null = not set; do not prefill New Entry amount
  createdAt: Timestamp,
  updatedAt: Timestamp,
  updatedByUserId: string
}
```

**Notes**
- This document is optional. If it does not exist, treat as no Weekly Usual Bottle Amount set.
- The label in all UI and CSV is "Usual bottle this week". Never "target".
- A Week Segment that crosses a month boundary shows the same `weeklySettings` document in both months (it is keyed to the full week's Monday date).

---

## `families/{familyId}/inviteCodes/{inviteCodeId}`

```js
{
  code: string,                        // short human-readable code, e.g. "DUCK-4821"
  familyId: string,
  role: "caregiver",                   // always caregiver at MVP; owner can promote later
  createdByUserId: string,
  createdAt: Timestamp,
  expiresAt: Timestamp | null,         // null = does not expire (private rebuild); set for public
  usedAt: Timestamp | null,
  usedByUserId: string | null,
  revokedAt: Timestamp | null
}
```

**Notes**
- Invite codes are single-use. Once `usedAt` is set, the code cannot be redeemed again.
- Because invite codes are stored under `families/{familyId}/inviteCodes/{inviteCodeId}`, a client cannot look up a code without already knowing the `familyId`. **For the private rebuild, invite links must carry both the `familyId` and the `code` in the URL** (e.g. `?familyId=abc&code=DUCK-4821`). The redemption flow reads `families/{familyId}/inviteCodes` where `code == value`, then adds the user to that family.
- If code-only redemption is needed later (e.g. the Owner shares just "DUCK-4821" verbally without a link), that requires either a top-level `inviteCodes/{code}` collection where documents are looked up by code alone, or a Cloud Function that accepts a code and resolves the `familyId` server-side. Neither is built in the private rebuild — the link-based flow is sufficient for a two-parent household.
- For public hardening, move redemption to a Cloud Function regardless of which collection shape is used, to prevent race conditions and abuse.

---

## Legacy: `feeds/{entryId}` (read-only after Migration)

The original collection used by the HTML app. Fields:

```js
{
  id: string,
  date: "YYYY-MM-DD",
  time: "HH:mm",
  ml: number | "",
  diaper: "W" | "P" | "WP" | "-" | "",
  vitd: 0 | 1,
  notes: string
}
```

This collection is never modified. Migration reads from it and writes to the new path. The collection will be archived (rules locked, then removed) only after the HTML app is permanently retired.

---

## Field mapping: legacy → new

| Legacy field | New field       | Transform                        |
|--------------|-----------------|----------------------------------|
| `date`       | `entryDate`     | direct copy                      |
| `time`       | `entryTime`     | direct copy                      |
| `ml`         | `amountMl`      | `""` → `null`; number → number   |
| `diaper`     | `diaper`        | `""` → `null`; string → string   |
| `vitd`       | `vitaminD`      | `0` → `false`; `1` → `true`      |
| `notes`      | `notes`         | direct copy                      |
| _(none)_     | `medication`    | `false`                          |
| _(none)_     | `createdByLabel`| `"Legacy"`                       |
| _(none)_     | `createdByUserId`| `null`                          |
| _(none)_     | `source`        | `"legacy"`                       |
| _(none)_     | `deleted`       | `false`                          |
| _(none)_     | `createdAt`     | migration timestamp               |
| _(none)_     | `updatedAt`     | migration timestamp               |
