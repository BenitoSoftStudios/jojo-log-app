# Feature Parity Checklist

The Vue app is not ready for household Cutover until every item on this checklist passes. Both parents must verify before the household switches.

Check this list by running both the HTML app and the Vue app side by side on the same data set.

---

## Migration integrity

- [ ] Row count in new `entries` path equals row count in `feeds`
- [ ] Total mL across all Legacy Entries matches total mL in HTML app
- [ ] Oldest and newest entry dates match between old and new
- [ ] No diaper values were lost or corrupted during mapping
- [ ] CSV backup of `feeds` data exists before testing begins
- [ ] `feeds` collection is confirmed untouched after migration

---

## Auth and identity

- [ ] Owner (parent 1) can sign up and log in
- [ ] Owner (parent 2 / spouse) can sign up and join via invite code
- [ ] Both parents belong to the same Family in Firestore
- [ ] Both parents can see the same Baby and the same care history
- [ ] Display label is required before the first Entry can be created
- [ ] Each Entry stores the correct `createdByLabel` for who logged it
- [ ] `createdByLabel` appears in the row details view

---

## Care Entry creation

- [ ] New Entry creates a row in the Open Day
- [ ] New Entry prepopulates time to last Entry time + 3 hours
- [ ] New Entry time does not automatically roll into the next calendar day
- [ ] New Entry prefills amount if Weekly Usual Bottle Amount is set for the current week
- [ ] New Entry leaves amount blank if Weekly Usual Bottle Amount is not set
- [ ] New Entry starts with blank diaper, Vitamin D off, Medication off, Tummy Time off, notes empty
- [ ] Start Next Day / + Day is a global action (header or hamburger menu), not a per-day button
- [ ] Start Next Day creates the next calendar date and one starter Entry

---

## Entry field validation and completion

- [ ] `0 mL` is accepted as a valid amount (not treated as incomplete)
- [ ] `-` diaper is accepted as a valid diaper value (not treated as incomplete)
- [ ] Blank amount marks the Entry as Incomplete
- [ ] Blank diaper marks the Entry as Incomplete
- [ ] Incomplete Entries show a visible warning in the Day row
- [ ] Vitamin D toggle works (on/off), displays ☀ symbol when on
- [ ] Medication toggle works (on/off), displays Rx symbol when on
- [ ] Tummy Time toggle works (on/off), displays ★ symbol when on
- [ ] Notes field accepts free text; notes are added and edited in the Entry Detail Sheet, not inline on the row
- [ ] Notes save automatically on blur or with debounce via `updateEntry({ notes })`
- [ ] Vitamin D, Medication, and Tummy Time state do not affect completion status

---

## Entry editing and deletion

- [ ] Owner can edit any Entry
- [ ] Caregiver can edit only their own Entries
- [ ] Owner can delete any Entry (soft delete)
- [ ] Caregiver can delete only their own Entries (soft delete)
- [ ] Deleted Entries disappear from the main Care Ledger
- [ ] Deleted Entries disappear from graphs
- [ ] Deleted Entries disappear from totals
- [ ] Deleted Entries disappear from normal CSV export
- [ ] Only Owners can restore a deleted Entry from Recently Deleted (non-owner caregivers cannot)
- [ ] Restored Entry reappears in the main Care Ledger
- [ ] `updatedByLabel` is set correctly on edit

---

## Care Ledger structure

- [ ] Entries are grouped: Month → Week Segment → Day
- [ ] Entries within a Day are sorted by `entryTime` ascending
- [ ] Months collapse and expand
- [ ] Week Segments collapse and expand
- [ ] Days collapse and expand
- [ ] The most recent Month, Week Segment, and Day are open by default
- [ ] Multiple Days can be open at the same time
- [ ] A week that crosses a month boundary appears under both months as separate Week Segments
- [ ] Month totals are true calendar-month totals (not partial-week totals)
- [ ] Week Segment shows only the portion of that week within the month
- [ ] Days with Incomplete Entries show a warning indicator

---

## Weekly Usual Bottle Amount

- [ ] Owner can set a Weekly Usual Bottle Amount for the current week
- [ ] The amount is stored in mL
- [ ] It appears in the Week Segment header as "Usual bottle this week"
- [ ] New Entry prefills amount with this value when the baby is in that week
- [ ] If the Weekly Usual Bottle Amount is blank, New Entry amount is blank
- [ ] The label never says "target", "goal", or "recommended"
- [ ] Weekly Usual Bottle Amount appears in CSV export

---

## Summary Chips

- [ ] Today's mL total is correct
- [ ] 7-day mL total is correct (rolling 7 days)
- [ ] This-month mL total is correct
- [ ] Feed count is correct (rows where `amountMl > 0`)
- [ ] All chip values match the HTML app for the same data set

---

## Graphs

- [ ] Monthly daily bar chart is present
- [ ] Year-by-month chart is present
- [ ] Bar chart values match the HTML app for the same data
- [ ] Current (incomplete) day is handled correctly in the chart
- [ ] Chart respects the Display Unit setting (mL or fl oz labels)
- [ ] Deleted Entries do not appear in graph totals

---

## CSV Export

- [ ] Export covers the active Baby only
- [ ] Normal export excludes deleted Entries
- [ ] CSV includes these columns: Date, Time, Baby, Amount (mL), Amount (fl oz), Display Unit, Diaper, Vitamin D, Medication, Notes, Logged By, Created At, Updated At, Usual Bottle This Week
- [ ] `Amount (fl oz)` is a conversion of `amountMl`, not a stored value
- [ ] Legacy Entries show "Legacy" in the Logged By column
- [ ] CSV filename includes the current date

---

## Units

- [ ] Family setting controls Display Unit (`ml` or `floz`)
- [ ] Amount input accepts values in the selected Display Unit
- [ ] Stored value is always in mL
- [ ] Graphs display axis labels and values in the selected Display Unit
- [ ] CSV exports both mL and fl oz columns regardless of Display Unit setting

---

## Sync and offline UX

- [ ] Sync status indicator is visible in the header
- [ ] Status shows "synced" when Firestore is connected
- [ ] Status shows "offline" when the device has no connection
- [ ] Status shows "sync issue" on a Firestore error
- [ ] Two devices (parent 1 and parent 2) see each other's new Entries in real time
- [ ] HTML app still loads and functions normally during the testing period

---

## Row details

- [ ] Each Entry row has a visible details button (i, ⋯, chevron, or initials chip) — not swipe or long-press
- [ ] Tapping the details button opens the Entry Detail Sheet
- [ ] Detail Sheet shows: time, amount, diaper, Vitamin D (☀), Medication (Rx), Tummy Time (★)
- [ ] Detail Sheet shows an editable notes textarea (add, edit, or clear notes from here)
- [ ] Notes save on blur or with debounce — no separate Save button for notes
- [ ] Detail Sheet shows: Created by, Created at
- [ ] Detail Sheet shows: Updated by, Updated at (if edited)
- [ ] Detail Sheet shows source label "Legacy entry" for migrated entries
- [ ] Delete action is in the Detail Sheet (with confirmation step)
- [ ] Core fields (time, mL, diaper, vitaminD, medication, tummyTime) are edited inline on the row, not in the Detail Sheet
- [ ] Detail Sheet is not a general edit form

---

## Baby profile

- [ ] Baby nickname is shown in the Baby Switcher
- [ ] Baby birthdate (if set) is used to show age in weeks in the UI
- [ ] Baby with `status: "inactive"` does not appear in the Baby Switcher
- [ ] Owner can archive a Baby (set to inactive)

---

## Recently Deleted

- [ ] Recently Deleted screen lists all soft-deleted Entries for the active Baby
- [ ] All members can view the Recently Deleted list
- [ ] Only Owners can restore an Entry from Recently Deleted
- [ ] Restored Entry reappears in the Care Ledger at the correct date

---

## Legend and Help

- [ ] Legend is accessible from the main screen
- [ ] Legend explains: W, P, WP, -, Vitamin D (☀), Medication (Rx), Tummy Time (★), incomplete row indicator
- [ ] Legend explains New Entry and + Day / Start Next Day
- [ ] Legend explains sync status dots

---

## Non-regression: HTML app

- [ ] HTML app loads at the production Vercel URL
- [ ] HTML app can create new Entries
- [ ] HTML app's `feeds` collection document count is unchanged from before Migration began

---

## Sign-off

Both parents must confirm the following before Cutover:

- [ ] Parent 1 confirms: "The Vue app covers everything I use the current app for."
- [ ] Parent 2 confirms: "The Vue app covers everything I use the current app for."
- [ ] At least 2–3 days of real household use on the Vue preview URL without issues.
