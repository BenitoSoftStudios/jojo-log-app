# Jojo App Overview README

## What This Project Is

Jojo’s Log is a private baby-care logging app built to track feeding, diapers, Vitamin D, notes, daily totals, weekly totals, monthly totals, graphs, and CSV export.

The current version is an HTML app hosted on Vercel with Firebase Firestore sync.

The next version should be a Vue/Vite rebuild that preserves the working behaviour while creating a scalable foundation for a future free public version.

## Product Summary

Jojo’s Log is a free shared baby-care log for exhausted households.

It helps parents and caregivers answer:

- when did the baby last eat?
- how much did they take?
- did they have a wet diaper, poop, both, or neither?
- was Vitamin D given?
- was medication given?
- who logged the row?
- what happened while I was asleep, away, or off shift?
- what can we show at a doctor visit?

It is not a medical advice app.

It is not a parenting companion.

It is not a sleep coach.

It is not a milestone tracker.

It is a practical care ledger.

## Current Production App

The current app:

- is a single HTML/CSS/JS app
- is hosted on Vercel
- syncs to Firebase Firestore
- uses a global `feeds` collection
- has open Firestore rules
- must remain live during the Vue rebuild

Current Firestore structure:

```text
feeds/{entryId}
```

Current row fields include:

```text
date
time
ml
diaper
vitd
notes
id
```

Current CSV export:

```text
Date
Time
Amount (mL)
Diaper
VitaminD
Notes
```

## Rebuild Direction

The Vue version should be built as a fresh Vue/Vite app.

The HTML app is the reference implementation, not the long-term foundation.

The Vue app should use:

- Vue
- Vite
- JavaScript
- Firebase Auth
- Firestore
- Vercel
- environment-based Firebase config

Capacitor may be used later to wrap the Vue app as a native iOS/Android app, but native app work is not part of MVP.

## Deployment Strategy

Use one codebase.

Use separate Firebase projects over time:

1. private Firebase project for Jojo family testing
2. public Firebase project later

The current live app must not break.

The Vue version should first run on a separate preview URL.

## Core Data Model

Future Firestore structure:

```text
families/{familyId}
families/{familyId}/members/{userId}
families/{familyId}/babies/{babyId}
families/{familyId}/babies/{babyId}/entries/{entryId}
families/{familyId}/babies/{babyId}/weeklySettings/{weekStartDate}
families/{familyId}/inviteCodes/{inviteCodeId}
```

Each care row is its own document.

Vue builds the visible care ledger by grouping rows into:

```text
Month
  Week segment
    Day
      Care row
```

## Family and Role Model

A family can have:

- multiple owners
- multiple caregivers
- multiple babies

One owner can start alone.

Roles:

### Owner

Can manage family, babies, caregivers, export, archive babies, edit any row, delete any row, and restore deleted rows.

### Caregiver

Can log rows, view rows, edit own rows, and delete own rows.

Caregiver cannot manage family settings or edit other people’s rows.

## Baby Profile

Baby profile fields:

```text
Nickname
Optional birthdate
Default next-entry interval, default 3 hours
Status: active or inactive
```

Birthdate is used to show age in weeks.

No full legal name is required.

## Care Row Fields

A care row includes:

```text
Time
Amount
Diaper
Vitamin D indicator
Medication indicator
Notes
Created by
Created at
Updated by
Updated at
Deleted state
```

Completion rules:

- time is required
- amount is required
- diaper is required
- blank amount means incomplete
- blank diaper means incomplete
- 0 mL is valid
- - diaper is valid
- Vitamin D is optional
- Medication is optional
- Notes are optional

## New Entry Rule

New Entry stays inside the open day.

It prepopulates time to last row time plus 3 hours.

It never jumps to the next day automatically.

If the weekly usual bottle amount is set, New Entry prepopulates the amount.

If the weekly usual bottle amount is blank, amount remains blank.

## Start Next Day Rule

Start Next Day is the intentional day-boundary action.

It creates the next calendar day and one starter row.

This avoids confusion around 00:00 or 00:30 feeds.

## Weekly Usual Bottle Amount

Weekly usual bottle amount is manual.

Use label:

```text
Usual bottle this week
```

Avoid “target” language.

If set, it appears in the weekly header and prepopulates New Entry amount for that week.

If blank, it does not prepopulate anything.

## Units

mL is default.

fl oz should be supported.

Store all amounts internally in mL.

Display and input unit come from family setting.

CSV exports both mL and fl oz.

Graphs display using selected unit.

## Main UI

The main screen should keep the collapsible care ledger:

```text
Month
  Week segment
    Day
      Row
```

The top area should include:

- baby switcher
- sync status
- summary chips
- hamburger menu

Summary chips:

- today
- 7-day
- this month
- feed count

Hamburger menu:

- CSV export
- Graph
- Start Next Day
- Recently Deleted
- Settings
- Manage Caregivers
- Manage Babies
- Help
- Donate later

Add Entry stays at the bottom of the open day.

## Graphs

Graphs focus on feeding volume only.

Preserve:

- monthly daily bar chart
- year-by-month chart
- summary chips
- current/incomplete day handling

No diaper, Vitamin D, or medication graphs for MVP.

## CSV Export

Export active baby only.

Normal export excludes deleted rows.

CSV should include:

```text
Date
Time
Baby
Amount (mL)
Amount (fl oz)
Display Unit
Diaper
Vitamin D
Medication
Notes
Logged By
Created At
Updated At
Usual Bottle This Week
```

## Migration

Migration from the old `feeds` collection must be copy-only.

Do not delete old data.

Do not modify old `feeds` documents.

Do not lock Firestore rules until the old app is no longer needed.

Legacy rows should be marked:

```text
createdByLabel: Legacy
createdByUserId: null
source: legacy
deleted: false
```

## Privacy Principles

Collect less.

Do not require:

- full child legal name
- full parent names
- address
- health card number
- precise location
- photos
- contact list
- doctor name
- diagnosis

Use:

- baby nickname
- caregiver initials
- optional birthdate

No ads.

No medical advice.

No dosage guidance.

No selling data.

No event-level analytics on baby care data.

## Public Launch Later

Before public launch:

- use separate Firebase project
- remove all Jojo/private data
- secure Firestore rules
- add privacy page
- add contact email for deletion
- consider App Check
- verify family-scoped data isolation
- verify export and deletion process
- keep free/no paid tier promise

## Development Rule

The current household workflow is the source of truth.

Do not “simplify” it into a generic tracker if that loses the working behaviour.

Preserve:

- planned and logged rows
- incomplete future rows
- month/week/day collapsing
- New Entry at bottom of day
- Start Next Day
- CSV export
- graphs
- active baby export
- medication as a simple flag
- Vitamin D as a dedicated flag
- row details with created/updated by
- no medical advice

## Feature Parity Before Cutover

The Vue app must pass the full feature parity checklist before replacing the current app.

The old app remains live until then.
