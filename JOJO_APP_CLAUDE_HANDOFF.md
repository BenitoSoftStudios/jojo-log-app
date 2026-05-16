# Jojo App Vue Rebuild Handoff

## Purpose

This document is the handoff for rebuilding Jojo’s Log as a Vue/Vite app using the current HTML app as the reference implementation.

The current production app is a private baby care tracker hosted on Vercel. It tracks feeding, diapers, Vitamin D, notes, graphs, CSV export, daily totals, weekly totals, and monthly totals. It syncs to Firebase Firestore.

The rebuild should create a clean Vue foundation that can support the private Jojo family tracker now and a public free donationware version later.

This is not a patch of the existing HTML app. This is a Vue/Vite rebuild that preserves the current working behaviour while adding the correct future architecture.

## Hard Rule

Do not break the current live Jojo app.

The current HTML app remains the production source of truth until the Vue version passes feature parity.

Do not edit, delete, migrate away from, or lock down the existing `feeds` collection until cutover is complete.

Do not change Firestore security rules in a way that would break the current HTML app.

No destructive migration.

The Vue rebuild must run beside the current app first, ideally on a separate Vercel preview URL or local deployment.

## Current App Snapshot

Current app:

- Single HTML file app
- Hosted on Vercel
- Uses Firebase Firestore
- Current Firestore collection is `feeds`
- Each document in `feeds` is one care row
- Current fields include:
  - `date`
  - `time`
  - `ml`
  - `diaper`
  - `vitd`
  - `notes`
  - `id`
- Current Firestore rules are open:
  - `allow read, write: if true;`

Current CSV export columns:

- `Date`
- `Time`
- `Amount (mL)`
- `Diaper`
- `VitaminD`
- `Notes`

Current app behaviour must be treated as the product reference.

## Product Identity

The app is a free shared baby-care log for exhausted households.

It is a logging tool, not a parenting companion.

It should not become:

- a medical app
- a sleep coach
- a milestone tracker
- a social feed
- a parenting advice app
- a daycare administration system
- an AI recommendation system

Core promise:

A shared care ledger that tells every caregiver what happened while they were asleep, away, or off shift.

Product values:

- fast
- private
- free
- calm
- practical
- no ads
- no paid tier
- no guilt
- no medical advice
- no baby-talk copy
- no anxiety bait
- no unnecessary data collection

## Public Version Intent

The app may later be offered publicly for free as donationware.

Donationware means:

- no paid features
- no premium gate
- no paid export
- no paid caregiver sharing
- no paid extra babies
- optional donation link only
- donations may help cover hosting and maintenance

Do not call it “donationware” in parent-facing copy unless needed. Parent-facing language should be:

“Free. No ads. No paid tier. Donations optional.”

## Build Strategy

Use one Vue codebase.

Use two Firebase projects over time:

1. Private Firebase project for Jojo family use now
2. Separate public Firebase project later

Same code. Different environment configuration.

The private version should use the same architecture that the public version will need.

The Vue app should be built with:

- Vue
- Vite
- JavaScript
- Firebase Auth
- Firestore
- Vercel deployment
- Capacitor-compatible structure for possible future native wrapping

No custom API server is needed for MVP.

Firebase Auth and Firestore are enough for the private rebuild.

Cloud Functions may be considered later for public hardening of invite-code redemption, deletion workflows, or abuse protection.

## Matt Pocock Skill Order

Use the uploaded skills in this order:

1. `grill-with-docs`
2. `improve-codebase-architecture`

Do not run architecture work before the docs and decisions are locked.

### First Skill Goal: `grill-with-docs`

Create documentation that locks:

- product boundaries
- terminology
- technical direction
- non-goals
- data model
- migration rules
- cutover rules
- privacy posture
- release stages

Suggested docs:

- `CONTEXT.md`
- `docs/adr/0001-vue-vite-rebuild.md`
- `docs/adr/0002-firebase-auth-and-firestore.md`
- `docs/adr/0003-family-scoped-data-model.md`
- `docs/adr/0004-no-medical-advice.md`
- `docs/adr/0005-no-paid-feature-gating.md`
- `docs/adr/0006-parallel-rebuild-no-production-breakage.md`
- `docs/adr/0007-capacitor-later-not-now.md`
- `docs/data-model.md`
- `docs/migration-plan.md`
- `docs/feature-parity-checklist.md`
- `docs/privacy-notes.md`

### Second Skill Goal: `improve-codebase-architecture`

After docs exist, inspect the current HTML app and propose the Vue rebuild architecture.

Do not implement during the architecture pass.

The output should include:

- candidate modules
- seams between UI, state, Firebase, stats, export, and migration
- migration plan
- testing plan
- risks
- launch blockers
- items that can wait

## Recommended Module Structure

The Vue app should separate concerns.

Suggested structure:

```text
/src
  /app
    App.vue
    router.js
    firebase.js
  /auth
    authService.js
    useAuth.js
    LoginView.vue
    SetupProfileView.vue
  /families
    familyService.js
    useFamily.js
    FamilySetupView.vue
    ManageCaregiversView.vue
    InviteCodeView.vue
  /babies
    babyService.js
    useBabies.js
    BabySwitcher.vue
    BabySettingsView.vue
  /entries
    entryService.js
    useEntries.js
    CareLedger.vue
    CareDay.vue
    CareRow.vue
    EntryEditor.vue
    RowDetailsSheet.vue
    RecentlyDeletedView.vue
  /stats
    statsService.js
    useStats.js
    SummaryChips.vue
  /charts
    ChartView.vue
    volumeChartService.js
  /export
    csvExportService.js
  /migration
    migrateFeedsToFamily.js
    migrationChecks.js
  /settings
    SettingsView.vue
    UnitSettings.vue
    TimezoneSettings.vue
  /help
    HelpView.vue
    LegendSheet.vue
    OnboardingFlow.vue
  /ui
    AppButton.vue
    AppCard.vue
    AppModal.vue
    AppSheet.vue
    IconBadge.vue
    SyncStatus.vue
  /utils
    dateUtils.js
    unitUtils.js
    weekUtils.js
    validationUtils.js
```

Exact structure can vary, but these boundaries should be preserved:

- UI components should not contain raw Firestore logic
- Firebase access should live in service/composable layers
- Stats and graph calculations should be testable without Vue components
- CSV export should be isolated
- Migration code should be isolated and non-destructive
- Unit conversion should be centralized
- Completion logic should be centralized

## Environment Strategy

Firebase config must not be hardcoded into components.

Use Vite environment variables:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
```

Support at least:

- local development
- private Jojo deployment
- public beta later
- public production later

The same codebase should be deployable against different Firebase projects.

## Firebase Auth

Use Firebase Auth.

Private rebuild starts with email/password.

Do not use phone/SMS login.

Do not use anonymous auth for this app because caregiver identity matters.

Google sign-in can be added later.

Apple sign-in can be added later if the Apple Developer Program is in place.

Each caregiver must have their own account.

Each member must set initials/display label before logging entries.

## Family Model

One user can create a family as the first owner.

One owner can start alone. This matters for single parents.

A family can have multiple owners.

A family can have multiple caregivers.

Multiple families per user are not MVP.

Roles:

### Owner

Can:

- manage family settings
- invite caregivers
- remove caregivers
- promote caregivers to owner
- add babies
- edit baby profiles
- archive babies
- export active baby data
- edit any row
- delete any row
- restore deleted rows
- request or handle deletion process later

### Caregiver

Can:

- view family baby logs
- log rows
- edit own rows
- delete own rows
- view row details

Caregivers cannot:

- manage family
- invite caregivers
- remove caregivers
- promote members
- archive babies
- permanently delete data
- edit other people’s rows

A family must always have at least one owner.

## Invite Code Model

Use custom invite-code flow built with Firebase Auth and Firestore.

Flow:

1. Owner opens Manage Caregivers
2. Owner taps Invite Caregiver
3. App generates one-time invite code
4. Invite code is stored in Firestore
5. Caregiver signs up or logs in
6. Caregiver enters invite code
7. App validates code
8. User joins family as Caregiver by default
9. Owner can promote Caregiver to Owner later

Invite code should be:

- one-time use
- created by owner
- revocable eventually
- expiring eventually
- default role: Caregiver

For private rebuild, this can be simpler if needed, but the data model should not prevent public hardening later.

Public hardening may use Cloud Functions for code redemption.

## Firestore Data Model

Use family-scoped data.

Recommended path:

```text
families/{familyId}
families/{familyId}/members/{userId}
families/{familyId}/babies/{babyId}
families/{familyId}/babies/{babyId}/entries/{entryId}
families/{familyId}/babies/{babyId}/weeklySettings/{weekStartDate}
families/{familyId}/inviteCodes/{inviteCodeId}
```

Do not keep public data in a global `feeds` collection.

### `families/{familyId}`

Fields:

```js
{
  name: string,
  timezone: "America/Toronto",
  unitPreference: "ml" | "floz",
  createdAt: timestamp,
  createdByUserId: string,
  updatedAt: timestamp
}
```

Private default timezone:

```text
America/Toronto
```

UI label:

```text
Eastern Time
```

### `members/{userId}`

Fields:

```js
{
  userId: string,
  email: string,
  role: "owner" | "caregiver",
  displayLabel: string,
  initials: string,
  joinedAt: timestamp,
  invitedByUserId: string | null,
  active: boolean
}
```

### `babies/{babyId}`

Fields:

```js
{
  nickname: string,
  birthdate: "YYYY-MM-DD" | null,
  defaultNextEntryIntervalMinutes: 180,
  status: "active" | "inactive",
  createdAt: timestamp,
  createdByUserId: string,
  updatedAt: timestamp
}
```

Baby profile should not require:

- full legal name
- sex
- weight
- doctor
- health card
- address
- medical diagnosis
- photos

Birthdate is optional and used to show age in weeks.

### `entries/{entryId}`

Each care row is its own Firestore document.

Fields:

```js
{
  entryDate: "YYYY-MM-DD",
  entryTime: "HH:mm",
  amountMl: number | null,
  diaper: "W" | "P" | "WP" | "-" | null,
  vitaminD: boolean,
  medication: boolean,
  notes: string,
  createdByUserId: string | null,
  createdByLabel: string,
  createdAt: timestamp,
  updatedByUserId: string | null,
  updatedByLabel: string | null,
  updatedAt: timestamp,
  deleted: boolean,
  deletedAt: timestamp | null,
  deletedByUserId: string | null,
  deletedByLabel: string | null,
  source: "legacy" | "app"
}
```

Legacy migrated rows can use:

```js
createdByUserId: null
createdByLabel: "Legacy"
source: "legacy"
```

Future rows use the signed-in user ID and initials/display label.

### `weeklySettings/{weekStartDate}`

Use week start date as ID or field.

Fields:

```js
{
  weekStartDate: "YYYY-MM-DD",
  usualBottleAmountMl: number | null,
  createdAt: timestamp,
  updatedAt: timestamp,
  updatedByUserId: string
}
```

Weekly usual bottle amount is manual only.

No auto-suggestions.

If blank, do not prefill new entries.

If set, display in weekly header and prefill New Entry amount for that week.

Use label:

```text
Usual bottle this week
```

Do not use “target” language.

### `inviteCodes/{inviteCodeId}`

Fields:

```js
{
  code: string,
  familyId: string,
  role: "caregiver",
  createdByUserId: string,
  createdAt: timestamp,
  expiresAt: timestamp | null,
  usedAt: timestamp | null,
  usedByUserId: string | null,
  revokedAt: timestamp | null
}
```

## Firestore Security Rules Concept

Do not apply new restrictive rules until the Vue app is ready and current HTML app is no longer needed.

Future rules should enforce:

- user must be signed in
- user can only access families where `members/{uid}` exists and is active
- only owners can manage members, family settings, babies, invite codes, and restore deleted rows
- caregivers can create entries
- caregivers can edit/delete only their own entries
- owners can edit/delete any entries
- clients cannot spoof `createdByUserId`
- clients cannot write arbitrary fields
- deleted rows are excluded by queries in the app

The old `feeds` collection should not be public in the final app.

## Migration Plan

Migration must be copy-only.

Do not delete old data.

Do not move old data.

Do not mutate old `feeds` documents.

Steps:

1. Export current CSV as a human-readable backup.
2. Create Vue app in separate deployment.
3. Add Firebase Auth.
4. Create family document for private Jojo family.
5. Create owner member for the user.
6. Add second owner member for spouse after account setup.
7. Create baby profile for Jojo.
8. Copy each document from `feeds` into new family/baby entries path.
9. Preserve:
   - date
   - time
   - ml
   - diaper
   - vitd
   - notes
10. Add new fields:
   - medication false
   - createdByLabel Legacy
   - createdByUserId null
   - deleted false
   - source legacy
11. Compare Vue totals to current app.
12. Compare CSV export to current app.
13. Compare graphs to current app.
14. Test new row creation and sync.
15. Test spouse login and shared sync.
16. Test side-by-side for several days.
17. Only then consider cutover.

## Cutover Plan

Before cutover:

- Vue app must pass feature parity checklist
- Current app must remain available
- New app must run on separate preview URL
- Both parents should test
- CSV backup should exist
- Old `feeds` collection should remain untouched

Cutover:

1. Switch family to Vue app URL
2. Continue monitoring
3. Do not immediately delete old app
4. Keep old app as fallback briefly
5. Only later tighten rules and archive old `feeds`

## Feature Parity Checklist

Vue app is not ready for household cutover until all of this works:

- can log a new row
- can edit existing rows
- can delete rows into Recently Deleted
- can restore deleted rows
- can add a new day
- New Entry defaults to last row time + 3 hours
- New Entry does not cross days
- Start Next Day creates the next day and first row
- amount and diaper completion rules work
- `0 mL` is valid
- `-` diaper is valid
- Vitamin D works
- Medication indicator works
- Notes work
- rows sort by selected entry time
- months collapse and expand
- week segments collapse and expand
- days collapse and expand
- summary chips match current app
- graph matches current app
- CSV export matches current app plus new fields
- sync status works
- auth works for both parents
- rows show created/updated details in row details view
- no lost historical data
- old app still works during testing

## Core UI Model

The app is a collapsible care history ledger.

The main screen uses this hierarchy:

```text
Month
  Week segment
    Day
      Care row
```

Month-first grouping stays.

Weeks start Monday for now.

If a week crosses months, it can appear in both months as separate visible week segments.

Example:

```text
April
  Week of Apr 27
    Apr 27
    Apr 28
    Apr 29
    Apr 30

May
  Week of Apr 27
    May 1
    May 2
    May 3
```

This is intended behaviour.

Month totals are true month totals.

Week rows inside months show the portion of the week that falls inside that month.

Weekly usual bottle amount is keyed to full week start date and can appear across split segments.

## Main Screen Layout

Top area:

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
- Donate, later

Primary action:

- Add Entry stays at the bottom of the open day
- This is the most-used action and must not be hidden

## Care Row Model

Rows are flexible planned/logged care rows.

A row can be:

- planned feeding slot
- completed feeding
- medication-only record
- diaper-only record
- partial record
- incomplete future row
- extra feeding row

Fields shown:

- time
- amount
- diaper
- Vitamin D indicator
- Medication indicator
- notes
- optional initials chip if space allows

Fields in details:

- created by
- created at
- updated by
- updated at
- amount
- diaper
- Vitamin D
- medication
- notes
- edit/delete/restore options based on role

Tap row opens detail sheet.

Do not rely on swipe as the only way to see audit details.

Swipe can be a bonus interaction later.

## Completion Rules

Time is always required.

Amount is required.

Diaper is required.

Blank amount means incomplete.

Blank diaper means incomplete.

`0 mL` is valid.

`-` diaper is valid.

Vitamin D is optional.

Medication is optional.

Notes are optional.

Vitamin D, Medication, and Notes do not affect completion status.

Future planned rows can be incomplete. This is useful for frazzled parents.

## Entry Behaviour

### New Entry

New Entry:

- belongs to currently open day
- never changes day automatically
- prepopulates time to last row time plus baby default interval
- default interval is 3 hours
- does not cross into next day automatically
- prepopulates amount only if weekly usual bottle amount is set
- leaves amount blank if weekly usual bottle amount is blank
- diaper defaults blank
- Vitamin D defaults off
- Medication defaults off
- Notes default blank

If the last row is 21:00, New Entry should not automatically create 00:00 tomorrow. It should stay in the same day unless the user uses Start Next Day.

### Start Next Day

Start Next Day:

- creates the next calendar day
- creates one starter row for that next day
- is the intentional day-boundary action

Help text should explain:

Use New Entry to add another row to the open day. Use Start Next Day when the next feed belongs to tomorrow.

## Feeding Totals

Feed totals include only rows where `amountMl > 0`.

Feed count includes only rows where `amountMl > 0`.

Medication-only row with 0 mL does not affect feed total or feed count.

## Vitamin D

Vitamin D gets its own dedicated light-up column.

Reason: newborns commonly need Vitamin D once a day.

No dosage advice.

## Medication

Medication gets its own optional light-up column.

Medication details stay in Notes.

Do not build a medication schedule engine.

Do not build medication dosage logic.

Do not structure medication names as a formal medical record at MVP.

Medication flag examples:

- pill icon
- `M`
- `Med`

Use whichever fits UI best.

Legend must explain it.

## Notes

Each row has one optional note.

No comments.

No threads.

No family chat.

No activity feed.

## Legend and Help

Add an information button or legend.

Legend should explain:

- W = Wet
- P = Poop
- WP = Wet + Poop
- - = No diaper event
- Vitamin D indicator
- Medication indicator
- incomplete row
- New Entry
- Start Next Day
- CSV export
- sync status
- unit display

Onboarding can be a first-run tutorial and also available under Help.

## Units

Default unit is mL.

Support fl oz for future/public users.

Store all feeding amounts internally in mL.

Family setting controls display/input unit:

```js
unitPreference: "ml" | "floz"
```

CSV exports both mL and fl oz.

Graphs use selected display unit for axis labels and displayed values, but calculations can use mL internally.

Unit conversion must be centralized in `unitUtils.js`.

## Weekly Usual Bottle Amount

Weekly usual bottle amount is manual only.

No auto-suggestions.

If blank, do not prefill new entries.

If set:

- show in weekly header
- prefill New Entry amount for rows in that week
- include in CSV

Use label:

```text
Usual bottle this week
```

Avoid:

```text
target
recommended
goal
should
```

because those sound medical or prescriptive.

## Graphs

Graph focus remains feeding volume.

Preserve current graph concepts:

- monthly daily bar chart
- year-by-month chart
- summary chips
- current/incomplete day handling

Graph should respect selected display unit:

- mL mode: labels in mL
- fl oz mode: labels in fl oz

Do not add diaper, Vitamin D, or medication graphs for MVP.

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

Current CSV compatibility matters, but new columns are needed for family/caregiver model.

## Recently Deleted

Soft delete entries.

Deleted rows:

- disappear from main ledger
- disappear from graphs
- disappear from totals
- disappear from normal CSV export
- appear in Recently Deleted

Owners can restore.

Caregiver restore can wait.

## Baby Profile

Baby profile fields:

```text
Nickname
Optional birthdate
Default next-entry interval, default 3 hours
Status: active or inactive
```

Birthdate is used to show baby age in weeks.

Active means shown in normal baby switcher.

Inactive means archived/hidden from normal switcher but history remains exportable.

Do not require full legal name.

## Sync and Offline UX

Show sync status.

Statuses:

```text
synced
offline, changes may sync later
sync issue, keep this screen open and check connection
```

Help language:

If the app shows a sync issue, avoid closing the tab until it reconnects. If you are worried, take a screenshot of the open day.

Do not make export/re-add the normal offline recommendation.

## Privacy Requirements

Collect as little as possible.

Do not require:

- child full legal name
- parent full legal name
- address
- health card number
- precise location
- photos
- contact list
- doctor name
- medical diagnosis

Use:

- baby nickname
- caregiver initials/display label
- optional birthdate

No ads.

No selling data.

No analytics on baby events.

No medical advice.

No dosage guidance.

No growth interpretation.

No “your baby should” language.

Notes may contain sensitive information because parents type freely. Add gentle guidance in Help:

Avoid entering health card numbers, addresses, or sensitive medical details.

## Public Launch Later

Public version should use separate Firebase project.

Before public launch:

- secure Firestore rules
- Firebase Auth fully working
- family-scoped access
- public privacy page
- public terms or usage note
- contact email for deletion requests
- App Check considered
- no personal seed data
- no Jojo data
- no screenshots with private data
- no open global collections
- public landing page
- donation link only outside core workflow

## Non-Goals for MVP

Do not build:

- AI advice
- sleep coaching
- milestone tracking
- doctor portal
- daycare admin
- community features
- chat
- push notifications
- native app
- Apple sign-in
- phone/SMS login
- medical recommendations
- dosage calculations
- medication schedules
- growth percentile interpretation
- paid tier
- subscriptions
- ad tracking
- demo mode

## Testing Requirements

At minimum, test:

### Migration

- old row count equals copied row count
- totals match current app
- graphs match current app
- CSV backup exists
- old `feeds` untouched

### Auth

- owner can log in
- spouse can log in
- both belong to same family
- initials required
- row stores creator details

### Entries

- create row
- edit row
- delete row
- restore row
- 0 mL valid
- - diaper valid
- blank amount incomplete
- blank diaper incomplete
- Vitamin D optional
- Medication optional
- notes optional
- rows sort by time

### Ledger

- month collapse works
- week segment collapse works
- day collapse works
- split week across months works
- summaries correct

### Export

- active baby only
- deleted rows excluded
- mL and fl oz included
- usual bottle amount included
- logged by included

### Graph

- volume only
- monthly daily chart correct
- year-by-month chart correct
- unit labels correct

### Sync

- sync status visible
- two users see updates
- old app still works

## Suggested Build Phases

### Phase 0: Docs

Use `grill-with-docs`.

Create context, ADRs, data model, migration plan, and feature parity checklist.

No implementation.

### Phase 1: Architecture Review

Use `improve-codebase-architecture`.

Inspect current app.

Design Vue module structure and implementation phases.

No implementation unless explicitly approved.

### Phase 2: Vue Foundation

Create Vue/Vite project.

Add routing, layout, environment config, Firebase init, design tokens, base UI components.

No production cutover.

### Phase 3: Auth and Family Setup

Add Firebase Auth.

Add owner profile setup.

Add family creation.

Add baby creation.

Add required initials/display label.

### Phase 4: Firestore New Structure

Create family-scoped Firestore services.

Add entries under baby path.

Add members path.

Add baby profile path.

No security rule tightening yet.

### Phase 5: Migration Copy

Create non-destructive migration from `feeds` to new entries path.

Copy only.

Do not delete old data.

Mark migrated rows as Legacy.

Validate totals.

### Phase 6: Ledger UI

Rebuild month/week/day/row ledger.

Add New Entry, Start Next Day, completion rules, row details, Recently Deleted.

### Phase 7: Stats, Graphs, CSV

Rebuild summary chips.

Rebuild graph views.

Rebuild CSV export with new fields.

Add unit conversion.

### Phase 8: Shared Caregiver Flow

Add invite code.

Add spouse/caregiver join.

Add roles.

Add row created/updated metadata.

### Phase 9: Feature Parity Testing

Run full checklist.

Compare old and new app side by side.

Fix gaps.

### Phase 10: Private Cutover

Switch family only after feature parity.

Keep old app available temporarily.

Tighten rules only after old app no longer needed.

### Phase 11: Public Hardening Later

Separate Firebase project.

Secure rules.

Privacy page.

Deletion contact.

App Check.

Public landing page.

No Jojo data.

## Final Instruction to Claude

Do not optimize away the current working care ledger.

The existing UI works because it matches real tired-parent behaviour.

Preserve:

- flexible rows
- future incomplete rows
- month/week/day collapsing
- active baby export
- graph usefulness
- CSV usefulness
- New Entry at bottom of day
- Start Next Day for midnight boundary
- no medical advice
- no production breakage

If a proposed change makes the app more “standard” but less useful to the current household workflow, reject it unless explicitly approved.
