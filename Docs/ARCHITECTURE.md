# Jojo's Log — Vue/Vite Rebuild Architecture Plan

_Produced from the `/improve-codebase-architecture` skill. Uses CONTEXT.md vocabulary throughout. Does not implement._

---

## What the current app actually does (codebase read)

The HTML app is 857 lines: CSS, HTML, and one `<script>` block. Every concern lives in that script:

| Concern | Current location |
|---|---|
| Firebase init + real-time listener | `initApp()` |
| Flat Entry array (global state) | `let feeds = []` |
| Grouping feeds into M/W/D | `group()` — the most important pure function |
| Collapse state | `CS = {M:{}, W:{}, D:{}}` global |
| Stats computation | `renderStats()` — scans `feeds` redundantly |
| Full ledger re-render | `render()` — builds an HTML string and sets `innerHTML` |
| Entry mutations | `upd()`, `updML()`, `setD()`, `togVitD()`, `delF()` — each calls Firestore directly |
| Modal (New Entry + Start Next Day) | `openFeedModal()`, `openDayModal()`, `saveModal()` |
| Graph data preparation | `renderGraph()` + `makeBars()` — SVG string generation |
| CSV export | `exportCSV()` |
| Clock | `tick()` + `setInterval` |

There is no seam between UI, state, and Firestore. Every mutation handler reaches directly into `COLL.doc(id).update(...)`. The `render()` function rebuilds the entire DOM on every change. This is fine for one file; it is a rebuild target, not a foundation.

---

## Observations that drive the module design

### O1 — Firestore is wired directly into every mutation

`upd()`, `updML()`, `setD()`, `togVitD()`, and `delF()` all call `COLL.doc(id).update(...)` or `.delete()` inline. There is no Entry module; Firestore is the Entry module. In the Vue app, this means there is nowhere to add soft-delete, provenance (`createdByUserId`), or completion validation without touching every handler.

**Consequence:** The Entry Service module is the most important seam to establish first.

### O2 — `group()` is the most valuable logic in the current app and must be preserved exactly

`group()` builds the Month → Week Segment → Day hierarchy. It handles cross-month weeks correctly: entries are bucketed by `f.date.slice(0,7)` (month key) and `weekOf(f.date)` (week start Monday) independently, so a feed on May 1 lands under `M["2026-05"].weeks["2026-04-27"]`, appearing correctly under both April and May Week Segments.

This is subtle. Getting it wrong produces duplicate or missing Week Segments. The Vue rebuild must preserve this exact bucketing logic in a pure, testable function.

### O3 — Stats computation is currently wrong in one place

`renderStats()` counts `tf.length` (all entries for today) as feed count. The data model requires feed count = entries where `amountMl > 0`. This is a known discrepancy to fix in the Vue rebuild.

### O4 — Collapse state is a clean three-key map, already pure

`CS = {M, W, D}` — open/closed keyed by month string, week start string, and date string. This maps cleanly to a Vue composable with reactive state. No logic to extract; just lift as-is.

### O5 — Modal is New Entry + Start Next Day in one form, distinguished by a flag

`openFeedModal(dk)` and `openDayModal()` share the same modal with `mdr` (the date row) shown or hidden. In Vue this should be two distinct Entry Editor states with shared field components — not flag-toggled visibility.

### O6 — Hard delete must become Soft Delete

`delF()` calls `COLL.doc(id).delete()`. The rebuild replaces this with a Firestore update setting `deleted: true`. All Entry queries must filter `deleted === false` by default. This is a behaviour change that must be communicated clearly in the feature parity checklist.

### O7 — No provenance, no auth, no Display Unit, no medication, no Weekly Usual Bottle Amount in the current app

These are all new in the rebuild. They do not need to be extracted from the current app — they need to be designed correctly the first time, informed by the data model doc.

### O8 — Seed data is embedded in the app; neither form ships in the Vue runtime

A 300-entry SEED array is in the script. In the Vue rebuild there is no seed data: Migration populates entries from `feeds`. The seed mechanism must not appear in the new app's runtime code.

Test fixtures for pure module unit tests (e.g. `ledgerGrouper`, `statsCalculator`, `csvExportService`) may use sanitized legacy-like sample data — a small invented set of entries that exercises edge cases (cross-month weeks, 0 mL entries, incomplete entries, Legacy source). **The real SEED array from the HTML app must not be copied into the Vue codebase**, not into tests, not into fixtures, not into any file that ships with the app. If realistic volume is needed for a test, construct a small synthetic dataset that mimics the shape without containing real Jojo dates, times, or amounts.

---

## Module map

Each module is named using CONTEXT.md vocabulary. Each entry lists: **interface** (what callers know), **implementation** (what lives behind the seam), and **depth note** (how much behaviour the interface hides).

---

### Layer 1 — Firebase adapters (deepest)

#### `firebase.js` — Firebase initialisation
**Interface:** exports `db` (Firestore instance) and `auth` (Auth instance). Reads config from Vite env vars.
**Implementation:** calls `initializeApp`, `getFirestore`, `getAuth` once.
**Depth note:** shallow by design — one correct init, used everywhere. No caller logic here.
**Seam value:** all other modules import from here. Swapping Firebase projects means changing `.env` only.

---

### Layer 2 — Service modules (Firestore access, no Vue reactivity)

These modules contain raw Firestore logic. No `ref()`, no `onMounted`. They are plain async functions or functions that take callbacks. They can be tested with a Firestore emulator without a Vue component.

#### `entryService.js`
**Interface:**
```
subscribeToEntries(babyPath, onUpdate, onError) → unsubscribe fn
createEntry(babyPath, fields, member) → Promise<entryId>
updateEntry(babyPath, entryId, changes, member) → Promise
softDeleteEntry(babyPath, entryId, member) → Promise
restoreEntry(babyPath, entryId, member) → Promise
```
**Implementation:** Firestore real-time listener (`onSnapshot`), batch-aware writes, provenance fields (`createdByUserId`, `createdByLabel`, `updatedBy*`, `deletedBy*`), server timestamps.
**Depth note:** deep. Every caller gets soft-delete semantics, provenance, and Firestore error handling behind a single verb. Callers never touch `db` directly.
**Key invariant enforced here:** `deleted: false` is the default on all new entries. `createEntry` always sets `source: "app"`. Provenance fields are always stamped from the `member` argument — UI cannot spoof them.

#### `familyService.js`
**Interface:**
```
createFamily(fields, ownerUid) → Promise<familyId>
getFamily(familyId) → Promise<Family>
updateFamily(familyId, changes) → Promise
getMembers(familyId) → Promise<Member[]>
addMember(familyId, memberFields) → Promise
updateMember(familyId, userId, changes) → Promise
```
**Implementation:** Reads/writes `families/{familyId}` and `families/{familyId}/members/{userId}`.
**Depth note:** moderate. Wraps the family-scoped path so callers never construct Firestore paths manually.

#### `babyService.js`
**Interface:**
```
getBabies(familyId) → Promise<Baby[]>
createBaby(familyId, fields, ownerMember) → Promise<babyId>
updateBaby(familyId, babyId, changes) → Promise
archiveBaby(familyId, babyId) → Promise   // sets status: "inactive"
getWeeklySettings(babyPath, weekStartDate) → Promise<WeeklySettings | null>
setWeeklySettings(babyPath, weekStartDate, amountMl, member) → Promise
```
**Implementation:** Reads/writes `families/{familyId}/babies/{babyId}` and the `weeklySettings` subcollection.
**Depth note:** moderate. Hides subcollection path construction and the "archive vs delete" distinction.

#### `inviteService.js`
**Interface:**
```
generateInviteCode(familyId, createdByMember) → Promise<{ code, inviteUrl }>
redeemInviteCode(familyId, code, newMember) → Promise
```
**Implementation:** Writes `families/{familyId}/inviteCodes/{inviteCodeId}`. Invite URL carries both `familyId` and `code` as query params (per ADR note in data-model.md). Redemption reads `inviteCodes` where `code == value`, validates not used/revoked, writes `members/{userId}`, marks code `usedAt`.
**Depth note:** moderate. The `familyId` + `code` URL constraint is hidden from callers — they get a URL string.
**Future seam:** when public hardening requires a Cloud Function for redemption, only this module changes.

#### `migrationService.js` _(private rebuild only; not shipped to public)_
**Interface:**
```
migrateFeeds(familyId, babyId) → Promise<{ copied, skipped }>
validateMigration(familyId, babyId) → Promise<ValidationReport>
```
**Implementation:** Reads all docs from `feeds`, maps fields per the field-mapping table, writes to `entries` path in batches of 400. Idempotent (skips existing docs by ID). `validateMigration` compares row count, total mL, and date range.
**Depth note:** deep. All migration risk and idempotency logic lives here. Callers trigger it with two IDs and get a report back.

---

### Layer 3 — Pure utility modules (no Firebase, no Vue)

These are plain JS functions. They are the most testable modules in the app.

#### `ledgerGrouper.js`
**Interface:**
```
groupEntries(entries) → LedgerTree
```
where `LedgerTree = Map<monthKey, Month>` and each Month has `{ label, total, weekSegments: Map<weekStartDate, WeekSegment> }` etc.

**Implementation:** Preserves the exact bucketing logic from the current `group()` function — `monthKey = entryDate.slice(0,7)`, `weekKey = weekOf(entryDate)` — so cross-month weeks appear correctly in both months. Filters `deleted === false` entries. Accumulates mL totals per Day, per Week Segment, per Month. Does **not** compute stats (that is `statsCalculator.js`).

**Depth note:** deep. The cross-month Week Segment logic, the ordering, and the incomplete-entry detection are all hidden behind a single function call. Callers iterate the output tree.

**Test surface:** pure function — test with a known entry array and assert the tree shape. Edge cases: week crossing Jan/Feb, last day of month, single entry, zero entries.

#### `statsCalculator.js`
**Interface:**
```
calculateStats(entries, today) → { todayMl, sevenDayMl, monthMl, feedCount }
```
**Implementation:** Filters `deleted === false`. Today: entries where `entryDate === today`. 7-day: rolling 7. Month: `entryDate.startsWith(currentMonth)`. Feed count: entries where `amountMl > 0` (fix over the current app's `tf.length`).
**Depth note:** deep for its size. One call, four numbers, no DOM.
**Test surface:** pure — spot-check totals against known datasets including the migration validation numbers.

#### `volumeChartService.js`
**Interface:**
```
buildMonthlyDailyData(entries, monthKey, today) → DayBar[]
buildYearByMonthData(entries, year, today) → MonthBar[]
```
**Implementation:** Aggregates `amountMl` by date or month. Marks current day. Stops at today. Does not convert units — caller applies `unitConverter.formatAmount()` for labels.
**Depth note:** moderate. Pure aggregation with today-boundary logic hidden from the chart component.
**Test surface:** pure — assert bar values match expected totals.

#### `csvExportService.js`
**Interface:**
```
buildCsvString(entries, baby, weeklySettingsMap, family) → string
triggerDownload(csvString, filename) → void
```
**Implementation:** Sorts entries by date+time, maps all columns (including fl oz conversion and `usualBottleThisWeek` lookup from `weeklySettingsMap`), escapes quotes, joins with newlines. `triggerDownload` is the only browser-specific side effect and is isolated.
**Depth note:** deep. All column ordering, quoting, unit conversion, and `Logged By` / `Legacy` logic are behind one call. Callers don't construct CSV.
**Test surface:** `buildCsvString` is pure and testable. Assert column headers, Legacy entry labels, fl oz values, excluded deleted rows.

#### `unitConverter.js`
**Interface:**
```
mlToFlOz(ml) → number
flOzToMl(flOz) → number
formatAmount(ml, unit) → string     // e.g. "90 mL" or "3.0 fl oz"
parseAmountToMl(value, unit) → number | null
```
**Implementation:** Conversion factor `1 mL = 0.033814 fl oz`. Rounding rules (1 decimal for fl oz). Null passthrough for incomplete entries.
**Depth note:** shallow but essential. Centralised so there is exactly one conversion factor in the codebase. Every amount display goes through here.

#### `weekUtils.js`
**Interface:**
```
weekOf(dateString) → weekStartDateString   // Monday of the ISO week
weekLabel(weekStartDate) → string           // "Week of Apr 27"
isInWeek(dateString, weekStartDate) → boolean
getWeekStartForDate(dateString) → string   // same as weekOf; named for callers
```
**Implementation:** Date arithmetic using fixed `T12:00:00` offset (matching current app) to avoid DST edge cases.
**Depth note:** shallow but load-bearing. The current app's `weekOf()` function is the single source of truth for all Week Segment grouping; it must be reproduced exactly.

#### `entryUtils.js`
**Interface:**
```
isIncomplete(entry) → boolean
isCompletedFeed(entry) → boolean   // amountMl > 0 AND not deleted
buildNewEntryDefaults(lastEntry, baby, weeklySettings) → EntryFields
buildStartNextDayEntry(lastEntryDate, baby) → { date, entryFields }
```
**Implementation:** Completion rules from data-model.md. `buildNewEntryDefaults` computes time prepopulation (last entry time + defaultNextEntryIntervalMinutes, capped at same day's date). `buildStartNextDayEntry` computes next calendar date.
**Depth note:** deep. The "never cross the Open Day" rule and the "prefill only if weekly usual bottle is set" rule are both enforced here, not scattered across components.
**Test surface:** pure — test the midnight boundary case, the 0 mL valid case, the blank-means-incomplete case.

---

### Layer 4 — Vue composables (reactivity + subscription management)

Composables wrap services with `ref`, `computed`, and subscription lifecycle. They are the interface between the Vue component tree and the service layer.

#### `useAuth.js`
**Exposes:** `currentUser` (ref), `isSignedIn` (computed), `signIn(email, password)`, `signOut()`, `onAuthReady(cb)`.
**Internal:** `onAuthStateChanged` listener, cleaned up on `onUnmounted`.

#### `useFamily.js`
**Exposes:** `family` (ref), `members` (ref), `currentMember` (computed from auth uid), `isOwner` (computed), `loadFamily(familyId)`.
**Internal:** calls `familyService`. Members list is used for role checks throughout.

#### `useBabies.js`
**Exposes:** `activeBabies` (computed), `activeBaby` (ref — the selected Baby), `selectBaby(babyId)`, `weeklySettings` (ref — for the current week).
**Internal:** calls `babyService`. Persists the selected `babyId` to `localStorage` (acceptable here: it is a UI preference, not sensitive data).

#### `useEntries.js`
**Exposes:** `entries` (ref — all non-deleted entries for active Baby, live-updated), `deletedEntries` (ref — deleted entries for Recently Deleted), `syncStatus` (ref — "synced" | "offline" | "error"), `createEntry(fields)`, `updateEntry(id, changes)`, `softDeleteEntry(id)`, `restoreEntry(id)`.
**Internal:** calls `entryService.subscribeToEntries`. Manages the Firestore `onSnapshot` unsubscribe on `onUnmounted`. Passes `currentMember` from `useFamily` to service for provenance. Sets `syncStatus` from snapshot metadata and error events.
**Key constraint:** components never call `entryService` directly. All Entry writes go through this composable so that `currentMember` provenance is always applied.

#### `useLedger.js`
**Exposes:** `ledgerTree` (computed from `entries` via `ledgerGrouper`), `collapseState` (reactive — month/week/day open map), `toggleMonth(key)`, `toggleWeekSegment(key)`, `toggleDay(key)`, `openDay` (computed — the most recent Day key).
**Internal:** Initialises collapse state on first load (latest month/week/day open, rest closed). Uses `ledgerGrouper.groupEntries` as a computed dependency — reactive re-grouping on every entries change.
**Depth note:** this composable is the heart of the Care Ledger view. The component tree reads from it and calls its toggle functions; it knows nothing about Firestore.

#### `useStats.js`
**Exposes:** `todayMl`, `sevenDayMl`, `monthMl`, `feedCount` — all computed from `entries`.
**Internal:** delegates to `statsCalculator.calculateStats`.

---

### Layer 5 — Vue components (UI only)

Components read from composables and emit user intent. No Firestore logic. No stats calculations. No date arithmetic.

**Structural components (Care Ledger)**

| Component | Responsibility |
|---|---|
| `CareLedger.vue` | Iterates `ledgerTree` months; delegates to `CareMonth` |
| `CareMonth.vue` | Month header (label, total, collapse toggle); iterates week segments |
| `CareWeekSegment.vue` | Week header (label, total, usual bottle, collapse toggle); iterates days |
| `CareDay.vue` | Day header (label, total, incomplete warning, collapse toggle); iterates entries; renders Add Entry button at bottom |
| `CareRow.vue` | One Entry row: time, amount, diaper chips, VitD button, medication button, notes preview, initials chip; tap opens `RowDetailsSheet` |
| `RowDetailsSheet.vue` | Full Entry detail: all fields, audit trail (created/updated by/at), edit/delete/restore based on role |
| `EntryEditor.vue` | Create or edit an Entry: time, amount, diaper picker, VitD, medication, notes; used for both New Entry and editing existing |

**Screen-level views**

| View | Route |
|---|---|
| `LoginView.vue` | Email/password sign-in |
| `SetupProfileView.vue` | First-run: set Display Label before first log |
| `FamilySetupView.vue` | Create family + first baby (owner only) |
| `MainView.vue` | Care Ledger + header + Summary Chips |
| `GraphView.vue` | Monthly daily chart + year-by-month chart |
| `RecentlyDeletedView.vue` | Soft-deleted entries; restore action |
| `ManageCaregiversView.vue` | Member list; invite code generation |
| `BabySettingsView.vue` | Edit baby profile; archive |
| `SettingsView.vue` | Unit preference; timezone |
| `HelpView.vue` | Legend + onboarding |

**Shared UI primitives**

`AppButton.vue`, `AppSheet.vue` (bottom sheet), `AppModal.vue`, `SyncStatus.vue`, `BabySwitcher.vue`, `SummaryChips.vue`

---

## Data flow diagram

```
Firestore
    │
    ▼
entryService.subscribeToEntries()
    │  (onSnapshot — raw Entry docs)
    ▼
useEntries.entries (ref — reactive array, filtered deleted=false)
    │
    ├──▶ useLedger.ledgerTree (computed via ledgerGrouper)
    │         │
    │         └──▶ CareLedger → CareMonth → CareWeekSegment → CareDay → CareRow
    │
    ├──▶ useStats (computed via statsCalculator)
    │         │
    │         └──▶ SummaryChips
    │
    ├──▶ volumeChartService (called on demand)
    │         │
    │         └──▶ GraphView
    │
    └──▶ csvExportService (called on demand)

User action (e.g. "Save entry")
    │
    ▼
EntryEditor.vue emits intent
    │
    ▼
useEntries.createEntry(fields)
    │
    ▼
entryService.createEntry(babyPath, fields, currentMember)
    │  (stamps provenance, sets source:"app", deleted:false)
    ▼
Firestore write → onSnapshot fires → entries ref updates → ledger + stats recompute
```

---

## Seams and their value

| Seam | What changes independently behind it |
|---|---|
| `entryService` interface | Soft-delete logic, provenance stamping, batch writes, future Cloud Function redirection |
| `ledgerGrouper` interface | Week Segment algorithm, future sorting options |
| `statsCalculator` interface | Feed count definition, rolling window calculation |
| `csvExportService.buildCsvString` | Column order, new columns, fl oz conversion |
| `unitConverter` | Conversion factor, rounding, future unit additions |
| `entryUtils.buildNewEntryDefaults` | New Entry time prepopulation rules, Open Day boundary |
| Firebase adapter (`firebase.js`) | Swap Firebase projects via env only |

---

## What does NOT need to be a module

The following are shallow in the current app and should stay inline or in components:

- **The clock.** `setInterval` in the header component. Not worth a module.
- **Diaper colour mapping.** CSS classes are the right level of abstraction.
- **Collapse toggle.** Handled in `useLedger` — no separate module needed.
- **Sync dot colour.** One prop on `SyncStatus.vue`.

---

## Risks

### R1 — Week Segment cross-month bucketing (high)
The current `group()` function handles this correctly. Rewriting it risks breaking the split-week behaviour. Mitigation: extract `ledgerGrouper` first, write unit tests against the current app's output before any other Vue work.

### R2 — Completion rule: 0 mL and `-` must not be treated as incomplete (high)
The current `isInc` function is `(f.ml===''||f.ml==null) || (f.diaper===''||f.diaper==null)`. The rebuild must use the same semantics. Mitigation: test `isIncomplete` in `entryUtils.js` with explicit cases for `0`, `null`, `""`, `"-"`, `"W"`.

### R3 — Feed count discrepancy (medium)
Current app counts all entries as feeds; rebuild counts only `amountMl > 0`. This will surface as a number difference during feature parity testing. Mitigation: document the discrepancy, communicate to both parents that this is a bug fix, not a data loss.

### R4 — Provenance on legacy entries (low)
Legacy Entries have `createdByUserId: null` and `createdByLabel: "Legacy"`. Components must handle null userId gracefully — not render a broken initials chip.

### R5 — Real-time listener cleanup (medium)
If `useEntries` is mounted/unmounted repeatedly (e.g. during baby switching), listener leaks can cause stale updates or duplicate renders. Mitigation: always call the `unsubscribe` returned by `entryService.subscribeToEntries` in `onUnmounted`.

### R6 — Firestore rules timing (medium)
Rules must not be tightened before the HTML app is retired (ADR-0006). But the Vue app should be written as if rules are enforced — all Firestore access goes through service modules that construct correct family-scoped paths. This makes rules enforcement a deploy-time switch, not a code change.

### R7 — `diaper: "none"` vs `diaper: "-"` (low but observable)
The current modal uses `"none"` as the value for "no diaper event" but the seed data uses `""`. The new data model uses `"-"`. Migration maps `""` → `null` (incomplete) and should check whether any `"none"` values appear in `feeds`. The Vue Entry Editor must write `"-"` for "no event". The ledger display must render `-` for stored `"-"` and an empty indicator for `null`.

---

## Testing approach

### Test what is worth testing at each layer

**Unit tests (pure modules — no Firebase, no DOM)**

| Module | What to test |
|---|---|
| `ledgerGrouper` | Cross-month week, single entry, empty input, ordering |
| `statsCalculator` | Feed count (amountMl > 0), rolling 7-day boundary, month boundary |
| `entryUtils.isIncomplete` | `0 mL` + valid diaper = complete; null amount = incomplete; `-` diaper = complete |
| `entryUtils.buildNewEntryDefaults` | Time prepopulation; no day rollover; weekly usual bottle fill/no-fill |
| `entryUtils.buildStartNextDayEntry` | Next calendar date; end of month; end of year |
| `unitConverter` | mL→fl oz and back; formatting; null passthrough |
| `weekUtils.weekOf` | Monday boundary; end of year; DST month |
| `csvExportService.buildCsvString` | Column headers; Legacy label; deleted rows excluded; fl oz column |
| `migrationService.validateMigration` | Row count match; total mL match; date range |

Use Vitest (ships with Vite). No component mounting needed for any of the above.

**Integration tests (migration script)**

Run against a Firestore emulator, not production:
- Row count before and after Migration must match
- Total mL before and after must match within floating point tolerance
- No `feeds` document is modified
- Re-running migration produces same row count (idempotency)

**Manual / feature parity testing**

Everything that requires Firebase Auth, a browser, and real-time sync is tested via the feature parity checklist. The checklist is the testing spec for the Care Ledger, Ledger UI, Recently Deleted, Invite Code flow, and cross-device sync.

Do not write component tests for this app at MVP. The component surface changes fast during early builds; the checklist is more reliable signal.

---

## Phase order

Phases map to the ADR-0006 constraint: Vue app runs in parallel, no production breakage.

### Phase 2 — Vue Foundation
_Goal: a working Vue/Vite app deployed to a preview URL. No data yet._

- `npm create vite@latest` with Vue template
- Copy design tokens from current app CSS (cream, mint, lavender, sand, muted, etc.) into `src/styles/tokens.css`
- `firebase.js` with env-var config; verify it initialises against the private Firebase project
- `vue-router` with placeholder routes for all views
- `AppButton`, `AppSheet`, `AppModal`, `SyncStatus` UI primitives
- `AppLayout.vue` with sticky header slot + content slot
- Vercel deployment confirmed on preview URL

**Nothing reads from Firestore yet.**

### Phase 3 — Auth and Family Setup
_Goal: both parents can sign in, belong to the same Family, have required Display Labels._

- `useAuth` composable + `LoginView`
- `SetupProfileView` — Display Label required gate
- `FamilySetupView` — creates `families/{familyId}` + `members/{ownerUid}`
- `useFamily` composable
- `BabySettingsView` — creates first Baby profile
- `useBabies` composable
- Owner (parent 1) creates their account through the app's normal sign-up flow
- **Spouse (parent 2) must have a working Firebase Auth account and a `members/{uid}` document before private Cutover.** For the private rebuild, if the invite code UI is not yet built, the spouse's member document may be written directly in the Firestore console — this is a **temporary private-only shortcut** and must be noted as such. The member document must still conform to the full members schema (role, displayLabel, initials, joinedAt, active). This shortcut is not acceptable for the public app; the invite code flow (Phase 8) is the correct path for all non-owner members.
- Manual Firestore check: both parent accounts visible in `members` with correct role and active fields

**No entries yet.**

### Phase 4 — Entry Service and Real-time Listener
_Goal: `useEntries` reactive array subscribes to entries subcollection. Create/edit/soft-delete work._

- `entryService.js` — subscribe, create, update, softDelete, restore
- `useEntries.js` composable
- Smoke test: create a manual Entry via a temporary debug button; verify it appears in Firestore and re-renders
- `SyncStatus` wired to `syncStatus` from `useEntries`

**No ledger UI yet.**

### Phase 5 — Migration
_Goal: all historical data appears in the new entries path. Validated against current app._

- `weekUtils.js` — extract and unit-test first
- `ledgerGrouper.js` — extract and unit-test against sanitized sample fixture data (not the SEED array from the HTML app; see O8)
- `statsCalculator.js` — unit-test
- `migrationService.js` — run against the private Firebase project
- `migrationService.validateMigration` — confirm row count + total mL
- Side-by-side: open the HTML app and the Vue app (with a temporary flat entry list) and compare total mL

**This is the riskiest phase for data integrity. Do not proceed to ledger UI until validation passes.**

### Phase 6 — Care Ledger UI
_Goal: Care Ledger looks and works like the current app._

- `entryUtils.js` — with full unit tests
- `unitConverter.js` — built and unit-tested here; required in Phase 6 even though fl oz display is not yet surfaced in the UI. It is the single conversion seam that CSV export and graph code will depend on from Phase 7 onward.
- `useLedger.js` — wires grouper to entries, manages collapse state
- `CareLedger`, `CareMonth`, `CareWeekSegment`, `CareDay`, `CareRow` components
- `EntryEditor.vue` — New Entry (in Open Day) and Start Next Day
- `RowDetailsSheet.vue` — audit trail, edit, soft-delete, restore (Owner only)
- `RecentlyDeletedView.vue`
- `Weekly Usual Bottle Amount` in `CareWeekSegment` header (preferred enhancement — see launch blockers)
- `babyService.getWeeklySettings` + `setWeeklySettings`
- Begin running feature parity checklist items

### Phase 7 — Stats, Graphs, and CSV Export
_Goal: Summary Chips, graph views, and CSV export complete. Both mL and fl oz columns in CSV. Graph displays mL for private cutover but uses the unit conversion seam throughout._

- `useStats.js` composable + `SummaryChips.vue`
- `volumeChartService.js` + `GraphView.vue` (SVG-based; reuse the `makeBars` approach in Vue render). Graph axis labels and bar values call `unitConverter.formatAmount(ml, displayUnit)`. For private cutover `displayUnit` is always `"ml"` — no settings toggle needed yet. The seam exists so fl oz graph display can be switched on later without rewriting chart logic.
- `csvExportService.js` + download trigger in hamburger menu. **Both `Amount (mL)` and `Amount (fl oz)` columns are required in the CSV before private cutover** — this is not a fl oz display feature, it is a data completeness requirement. The fl oz column is always computed via `unitConverter.mlToFlOz`, regardless of the family's Display Unit setting.
- `SettingsView` — unit preference toggle can wait; mL is the only active display unit for private cutover

### Phase 8 — Caregiver Invite Flow and Role Enforcement
_Goal: spouse can join via invite link. Role differences visible in UI._

- `inviteService.generateInviteCode` + `inviteService.redeemInviteCode`
- `ManageCaregiversView.vue`
- Role checks in `RowDetailsSheet` (Caregiver cannot edit others' rows)
- One-Owner client guard in `ManageCaregiversView`

### Phase 9 — Feature Parity Testing
_Goal: both parents sign off on the feature parity checklist._

- Run all checklist items
- Run both apps side by side on same data for 2–3 days
- Fix gaps

### Phase 10 — Private Cutover
_Per ADR-0006 cutover sequence. Old app stays live briefly._

### Phase 11 — Public Hardening (later, separate project)

---

## Launch blockers vs items that can wait

### Must pass before household Cutover (hard blockers)

- Auth working for both parents (Firebase Auth accounts + `members` documents confirmed)
- Migration validated (row count + mL totals match)
- `ledgerGrouper` correct (cross-month Week Segments)
- `isIncomplete` correct (0 mL + `-` diaper cases)
- Soft delete and Recently Deleted working
- New Entry and Start Next Day working
- Summary Chips matching current app (noting the feed count fix)
- Graph matching current app values (mL display is sufficient; fl oz graph display can wait)
- CSV export includes all required columns — including **both `Amount (mL)` and `Amount (fl oz)`**; this is a data completeness requirement, not a fl oz display feature
- `unitConverter.js` built and used by CSV export and graph code (the seam must exist even if fl oz display is not yet active in the UI)
- Sync status visible; two-device sync works
- Row details with audit trail visible
- Old app confirmed still working

### Preferred before first enhanced Vue release (not required for emergency feature-parity cutover)

- **Weekly Usual Bottle Amount** — this is a first-wave enhancement beyond strict feature parity with the old app. It is not in the current HTML app, so its absence does not break the Cutover. However it is a requested improvement and should ship in the first or second post-cutover release. Mark it on the feature parity checklist as "enhanced target, not emergency blocker."

### Can wait until after private Cutover

- `fl oz` Display Unit toggle in Settings — the UI preference for switching display between mL and fl oz. The conversion seam (`unitConverter.js`) and the CSV fl oz column must exist before Cutover; the Settings toggle that changes the active display unit can wait.
- Medication indicator (new feature; parents can use notes in the interim)
- Legend / Help view
- Settings view beyond basic unit preference
- **Invite code UI** — the in-app invite flow (generate link, redeem code) can wait for private Cutover. However, both parents must have working Auth access before Cutover; see Phase 3 for the temporary manual Firestore shortcut that is acceptable only for the private rebuild. The invite code UI is the required path for all future members and for the public app.
- `BabySettingsView` — baby profile editing (nickname won't change before Cutover)

### Explicitly out of scope until public hardening (ADR-0004, ADR-0005, ADR-0007)

- Firestore security rules tightening
- Firebase App Check
- Capacitor wrapping
- Cloud Functions for invite redemption
- Apple sign-in, Google sign-in
- Public privacy page
- Donation link
