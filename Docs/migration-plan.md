# Migration Plan

Migration copies data from the legacy `feeds` Firestore collection into the new family-scoped structure. It is **copy-only, non-destructive, and reversible** at any point before Cutover.

---

## Hard rules

1. **Never modify or delete documents in `feeds`.** The HTML app reads from this collection in production.
2. **Never change Firestore security rules** until the HTML app is no longer needed.
3. **Never run Migration in a way that could block or corrupt the live app.**
4. Migration can be run, re-run, or rolled back without consequence to the HTML app.
5. Always take a CSV backup before running Migration.

---

## Pre-migration steps

### 1. CSV backup
Export a full CSV from the live HTML app before Migration begins. This is the human-readable safety net. File naming convention: `jojos-log-backup-YYYY-MM-DD.csv`.

### 2. Row count snapshot
Note the document count in `feeds`. Migration must produce the same count in `entries`.

### 3. Create family structure manually (one-time setup)
This is done by the app owner during Vue app first-run setup, not by the migration script:

- Create `families/{familyId}` document (name, timezone, unitPreference)
- Create `families/{familyId}/members/{ownerUid}` for the first owner
- Create `families/{familyId}/babies/{babyId}` for Jojo

Save the `familyId` and `babyId` values — the migration script needs them.

---

## Migration script: `src/migration/migrateFeedsToFamily.js`

### What it does
1. Reads all documents from `feeds`
2. For each document, maps fields from the legacy schema to the new Entry schema
3. Writes each as a new document to `families/{familyId}/babies/{babyId}/entries/{entryId}`
4. Uses the legacy `id` field as the new document ID (preserves a stable reference for cross-checking)
5. Marks each written document as a Legacy Entry

### Field mapping

| Legacy field | New field         | Transform                       |
|--------------|-------------------|---------------------------------|
| `id`         | _(document ID)_   | direct                          |
| `date`       | `entryDate`       | direct                          |
| `time`       | `entryTime`       | direct                          |
| `ml`         | `amountMl`        | `""` → `null`; number → number  |
| `diaper`     | `diaper`          | `""` → `null`; string → string  |
| `vitd`       | `vitaminD`        | `0` → `false`; `1` → `true`    |
| `notes`      | `notes`           | direct                          |
| _(none)_     | `medication`      | always `false`                  |
| _(none)_     | `createdByLabel`  | `"Legacy"`                      |
| _(none)_     | `createdByUserId` | `null`                          |
| _(none)_     | `source`          | `"legacy"`                      |
| _(none)_     | `deleted`         | `false`                         |
| _(none)_     | `createdAt`       | Firestore server timestamp at migration time |
| _(none)_     | `updatedAt`       | Firestore server timestamp at migration time |
| _(none)_     | `updatedByUserId` | `null`                          |
| _(none)_     | `updatedByLabel`  | `null`                          |
| _(none)_     | `deletedAt`       | `null`                          |
| _(none)_     | `deletedByUserId` | `null`                          |
| _(none)_     | `deletedByLabel`  | `null`                          |

### Batching
Use Firestore batch writes (max 500 per batch) to keep writes atomic.

### Idempotency
The script checks whether each document already exists at the new path before writing. If it exists, skip it. This makes the script safe to re-run without creating duplicates.

---

## Validation steps (after Migration, before using Vue app)

Run these checks manually or via `src/migration/migrationChecks.js`:

### Row count
- Count documents in `feeds`
- Count documents in `families/{familyId}/babies/{babyId}/entries` where `source === "legacy"`
- They must match

### Total mL
- Sum `ml` from `feeds` (treating `""` as `0`)
- Sum `amountMl` from new entries where `source === "legacy"` (treating `null` as `0`)
- They must match

### Date range
- Oldest and newest `entryDate` in the new path must match the oldest and newest `date` in `feeds`

### Diaper values
- All unique diaper values in `feeds` must appear in new entries
- No unexpected null where the original had a value

### Graph comparison
- Open the Vue app (on the preview URL) and the HTML app side by side
- Compare the monthly bar charts for the last 3 months
- Values must match within rounding tolerance

### CSV comparison
- Export CSV from the HTML app
- Export CSV from the Vue app (active baby, no deleted rows)
- The mL column values for matching dates/times must agree

---

## Rollback

If anything looks wrong:

1. Do nothing to the HTML app or `feeds` collection — they were never touched
2. The household continues using the HTML app as normal
3. Investigate the Vue app or migration script on the preview URL
4. Re-run migration after fixing the issue (idempotency makes this safe)

There is no rollback step needed for the HTML app. It never stopped working.

---

## After successful validation

Do not yet:
- Switch the household to the Vue app (that is Cutover, a separate step)
- Delete or modify `feeds`
- Tighten Firestore rules

Continue using both apps in parallel for several days of testing first.

---

## Cutover sequence (separate from Migration)

After Migration is validated and the household has tested the Vue app on the preview URL:

1. Both parents confirm: "yes, the Vue app works for everything we need"
2. CSV backup confirmed
3. Switch the household to the Vue app URL
4. Monitor for 48–72 hours
5. Keep HTML app accessible as fallback
6. After confidence: archive `feeds` (lock rules, then remove)
7. Retire HTML app Vercel deployment

---

## Notes for public launch later

Migration is irrelevant for public users — they start fresh with no `feeds` data. The migration script is a private family tool only. It should not ship in the public codebase, or if it does, it must be behind an admin-only path not accessible to public users.
