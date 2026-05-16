# Jojo's Log

A free, private, shared baby-care log for exhausted households. It records what happened so every caregiver knows when the baby last ate, what kind of diaper occurred, and whether vitamins or medication were given — without asking anyone to repeat themselves.

---

## Language

### People and structure

**Family**
The top-level shared workspace. One Family owns the Baby logs. Created by its first Owner; may have multiple Owners and Caregivers.
_Avoid_: account, household, group, team

**Owner**
A Family member who can manage the Family, invite/remove Caregivers, manage Baby profiles, edit or delete any Entry, and restore soft-deleted Entries.
_Avoid_: admin, parent (too narrow — a grandparent can be an Owner)

**Caregiver**
A Family member who can log, view, edit, and delete their own Entries. Cannot manage the Family or other Members' Entries.
_Avoid_: user, member, tracker, watcher

**Member**
Any Firebase Auth account that belongs to a Family, as either Owner or Caregiver. Use Owner or Caregiver when the role distinction matters.
_Avoid_: user (too vague)

**Display Label**
The short name or initials a Member sets for themselves. Appears on every Entry they create. Required before logging the first Entry.
_Avoid_: username, handle, name

### Babies

**Baby**
A child profile inside a Family. Has a nickname, optional birthdate, default next-entry interval, and an active/inactive status.
_Avoid_: child, infant, patient, subject

**Baby Switcher**
The UI control for selecting which active Baby's ledger to view.
_Avoid_: tab bar, child selector

**Active Baby**
A Baby whose status is `active`. Appears in the Baby Switcher and is eligible for CSV export.

**Inactive Baby**
A Baby that has been archived. Does not appear in the normal Baby Switcher but its history remains exportable by an Owner.
_Avoid_: deleted baby — Baby profiles are never permanently deleted from the normal UI

### Care logging

**Entry**
One row in the Care Ledger. Records an event at a specific time on a specific date for a specific Baby. The atomic unit of the app.
_Avoid_: feed, row, record, event, log item — "Entry" is canonical

**Incomplete Entry**
An Entry where `amountMl` is null/blank OR `diaper` is null/blank. Shown with a visual warning. Valid to save; planned slots may be incomplete intentionally.
_Avoid_: draft, pending, partial

**Completed Entry**
An Entry where `amountMl` has any value (including 0) AND `diaper` has any value (including `-`).
_Avoid_: filled, done, full

**Soft Delete**
Setting `deleted: true` on an Entry. The Entry disappears from the main ledger, graphs, totals, and normal CSV export, but is recoverable from Recently Deleted.
_Avoid_: delete (implies permanent), archive (reserved for Baby status)

**Restore**
Setting `deleted: false` on a soft-deleted Entry. Owners can restore any Entry.

**Legacy Entry**
An Entry copied from the old Feeds Collection during Migration. Marked `source: "legacy"`, `createdByLabel: "Legacy"`, `createdByUserId: null`.

### Ledger UI

**Care Ledger**
The main screen. A collapsible hierarchy: Month → Week Segment → Day → Entry.
_Avoid_: log, timeline, feed list

**Week Segment**
A portion of an ISO week that falls within one calendar Month. A week that crosses a month boundary appears as two Week Segments — one under each month. The underlying Weekly Settings document uses the full week's Monday date as its key regardless.
_Avoid_: week (implies a full 7-day unit)

**Open Day**
The Day that currently accepts new Entries via New Entry. New Entry always stays inside the Open Day and never jumps to the next calendar date automatically.
_Avoid_: active day, current day

**New Entry**
The UI action that adds an Entry to the Open Day. Prepopulates time to last Entry time plus the Baby's Default Next-Entry Interval (default: 3 hours). Does not cross into the next calendar day.

**Start Next Day**
The intentional action that creates the next calendar date as a new Day and adds one starter Entry. The only way to advance the Open Day.
_Avoid_: next day, advance day, new day

**Summary Chips**
The row of small stat pills near the top of the main screen. Shows today's mL total, 7-day total, this-month total, and feed count.
_Avoid_: stats bar, stats chips, summary bar

### Settings

**Weekly Usual Bottle Amount**
A manually-entered mL value stored per week per Baby. If set, it appears in the Week Segment header and prefills the amount field on New Entry within that week. If blank, nothing is prefilled.
_Avoid_: target, goal, recommended amount — "target" sounds prescriptive

**Display Unit**
The Family-level preference for showing amounts: `ml` or `floz`. Does not affect internal storage; all amounts are stored in mL.
_Avoid_: preferred unit, unit format

**Default Next-Entry Interval**
The Baby-level setting (default: 3 hours / 180 minutes) used to calculate the prepopulated time on New Entry.
_Avoid_: feeding interval, schedule

### Migration and data provenance

**Feeds Collection**
The original Firestore collection (`feeds/{entryId}`) used by the current HTML app. Treated as read-only during the rebuild; never modified.

**Migration**
A one-time, copy-only process: reads from the Feeds Collection and writes Legacy Entries into the new family-scoped structure. No deletions. No mutations to existing documents.

**Cutover**
The deliberate moment when the household switches from the HTML app to the Vue app. Happens only after feature parity is verified. The HTML app remains accessible briefly after Cutover.

---

## Relationships

- A **Family** has one or more **Members** (at least one Owner at all times; enforced client-side in the private rebuild, and server-side for the public app)
- A **Family** has one or more **Babies**
- A **Baby** has many **Entries**
- A **Baby** has zero or one **Weekly Settings** document per calendar week
- An **Entry** belongs to exactly one **Baby**
- A **Member** belongs to exactly one **Family** at MVP
- An **Entry** records which **Member** created it via `createdByUserId` and `createdByLabel`
- A **Week Segment** is a view construct — it exists only in UI grouping logic, not as a stored document

---

## Example dialogue

> **Dev:** "When a Caregiver logs 0 mL with a `-` diaper, is that a Completed Entry?"
> **Domain expert:** "Yes. Zero mL is valid and dash is a valid diaper value. Incomplete only means the field is blank. No warning on that row."

> **Dev:** "Should New Entry jump to the next day if the prepopulated time passes midnight?"
> **Domain expert:** "No. New Entry stays in the Open Day. The time can say 00:30 on the Open Day's date. Use Start Next Day to advance."

> **Dev:** "Does a Caregiver need a separate Viewer role if they just want to check the ledger?"
> **Domain expert:** "No. Not for MVP. If they can access the Family, they can log."

---

## Flagged ambiguities

- "row", "feed", and "entry" were used interchangeably in the original app — resolved: **Entry** is canonical. "row" is acceptable in UI layer code; "feed" is avoided except in legacy field names (`feeds` collection, `ml` field).
- "target" appeared in early planning for the weekly bottle amount — resolved: **Weekly Usual Bottle Amount** is canonical. "target" is banned in all UI copy.
- "child" and "baby" were used interchangeably — resolved: **Baby** is canonical in domain language. "child" is acceptable in generic utility code.
- "admin" was used for the managing role — resolved: **Owner** is canonical.
- "week" vs "Week Segment" — a stored ISO week (keyed to its Monday) is just a "week"; the portion visible under one month in the ledger is a **Week Segment**. These are different things.
