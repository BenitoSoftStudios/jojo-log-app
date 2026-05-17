# Phase 6 Plan — Care Ledger UI

**Status:** Planning only. No code changes in this document.
**Last revised:** 2026-05-17 — updated with native-first direction and UX decisions.

---

## 1. Goal

Replace the Phase 4 smoke-test panel in `CareLedgerView.vue` with the real care ledger UI. The ledger renders the Month → Week Segment → Day → Entry Row hierarchy produced by Phase 5's `groupEntries()`. Stats chips become live. Entry creation, inline editing, and soft delete flow through the existing Phase 4 service layer. The UI is designed as a touch-first, native-style mobile experience.

---

## 2. Files to Add or Change

### New files

1. `src/entries/useLedger.js`
   — Composable. Calls `groupEntries` and `calculateStats`. Owns collapse state.

2. `src/entries/CareMonth.vue`
   — Collapsible month accordion header with label and mL total.

3. `src/entries/CareWeekSegment.vue`
   — Collapsible week segment accordion header with label and mL total.

4. `src/entries/CareDay.vue`
   — Collapsible day row. Contains the inline entry list and Add Entry button.

5. `src/entries/CareEntryRow.vue`
   — Single inline-editable entry row. Shows time, mL, diaper, symbols, and a details button.

6. `src/entries/EntryDetailSheet.vue`
   — Bottom sheet. Full entry metadata view with delete action. Accessed via explicit button on the row.

### Modified files

7. `src/entries/CareLedgerView.vue`
   — Remove smoke-test panel. Wire `useLedger`. Wire stats chips. Mount ledger hierarchy. Add + Day / Start Next Day as a global action in header or hamburger menu. Keep all auth/family/baby loading and menu sheet logic.

8. `src/entries/RecentlyDeletedView.vue`
   — Wire `deletedEntries` from `useEntries`. Render a flat list of deleted entries. Restore button visible to owners only (see Section 11).

### Data model change

9. `src/entries/entryService.js`
   — Add `tummyTime` to `MUTABLE_FIELDS` and to `createEntry` defaults. This is the only permitted entryService change in Phase 6. All other entryService behaviour is unchanged.

Note: `EntryFormSheet.vue` is NOT created. Row editing is inline (see Section 9). There is no separate save-form sheet.

---

## 3. How ledgerGrouper Feeds the UI

`useLedger.js` exposes a single `computed` called `grouped`:

```js
import { computed } from 'vue'
import { entries } from './useEntries.js'
import { groupEntries } from '@/utils/ledgerGrouper.js'

const grouped = computed(() => groupEntries(entries.value))
```

`grouped.value` has this shape:

```
{
  months: [
    {
      monthKey: '2026-05',
      label: 'May 2026',
      totalMl: 1400,
      feedCount: 14,
      weekSegments: [
        {
          weekStartDate: '2026-05-11',
          label: 'Week of May 11',
          totalMl: 680,
          days: [
            {
              date: '2026-05-17',
              label: 'Sat 17 May',
              totalMl: 340,
              hasIncomplete: false,
              entries: [ ...entry objects in entryTime ASC order ]
            }
          ]
        }
      ]
    }
  ]
}
```

`CareLedgerView.vue` iterates `grouped.value.months` using `v-for`. All arrays are pre-sorted by `groupEntries` — no additional sorting in the template.

Stats are also computed in `useLedger.js`:

```js
import { calculateStats } from '@/utils/statsCalculator.js'
import { todayString } from '@/utils/dateUtils.js'

const stats = computed(() => calculateStats(entries.value, todayString()))
```

`stats.value` feeds directly into `SummaryChips` props: `todayMl`, `sevenDayMl`, `monthMl`, `feedCount`.

Collapse state is pure local UI state. `groupEntries` and `calculateStats` are called only once per snapshot update via `computed`. Opening or closing a day, week, or month does not trigger any Firestore read, listener, or query.

---

## 4. How Collapse State is Stored

Collapse state lives in `useLedger.js` as module-level refs so it persists across re-renders but resets on baby switch.

```js
const openMonths   = ref(new Set())   // Set<monthKey string>
const openWeekKeys = ref(new Set())   // Set<`${monthKey}:${weekStartDate}`>
const openDays     = ref(new Set())   // Set<date string> — multiple days may be open
```

Multiple days may be open simultaneously. There is no single-open-day constraint.

### Initialization

A `watch` on `grouped` fires once when entries first load (size goes from 0 to non-zero):

```
if (openMonths.value.size > 0) return   // already initialized
if (grouped.value.months.length === 0) return

const todayKey = todayString().slice(0, 7)
const targetMonth = months.find(m => m.monthKey === todayKey) ?? months[0]
openMonths.value.add(targetMonth.monthKey)

const targetWeek = targetMonth.weekSegments[0]
openWeekKeys.value.add(`${targetMonth.monthKey}:${targetWeek.weekStartDate}`)

const targetDay = targetWeek.days[0]   // most recent day in the open week
openDays.value.add(targetDay.date)
```

This opens the current month (or the most recent month if today has no entries), the most recent week segment within it, and the most recent day within that week.

### Reset on baby switch

A `watch` on `entries` resets all collapse state when entries are cleared:

```
watch(entries, (e) => {
  if (e.length === 0) {
    openMonths.value   = new Set()
    openWeekKeys.value = new Set()
    openDays.value     = new Set()
  }
})
```

### Toggle functions

- `toggleMonth(monthKey)` — adds or removes from `openMonths`. If closing, also removes all week keys for that month and removes any open days that fall in that month.
- `toggleWeek(monthKey, weekStartDate)` — adds or removes from `openWeekKeys`. If closing, removes any open days that fall in that week.
- `toggleDay(date)` — adds or removes from `openDays`. Multiple days may be in the set at once. Toggling one day does not affect others.

`useLedger` returns `openMonths`, `openWeekKeys`, `openDays`, and the three toggle functions alongside `grouped` and `stats`.

### Firestore isolation

Opening more days is local UI state only. It does not create more Firestore listeners, queries, or reads. The single `onSnapshot` listener in `useEntries.js` covers all entries for the active baby. This must not change.

---

## 5. How New Entry Chooses the Open Day

The `Add Entry` button appears at the bottom of the entry list inside `CareDay` when `openDays.has(day.date)`.

Multiple days may have `Add Entry` visible at once (since multiple days can be open). Each `Add Entry` button is scoped to its own day.

When tapped:

1. `CareDay` emits `add-entry` with its `day.date` and `day.entries`.
2. `CareLedgerView` handles the event:
   - `newEntryDate` is set to `day.date`.
   - The last entry in `day.entries` (highest index, since entries are sorted ASC by `entryTime`) is passed as `lastEntry`.
   - `buildNewEntryDefaults(lastEntry, activeBaby.value, null)` is called to compute pre-populated time and amount.
   - A new inline entry row is inserted at the bottom of that day with the defaults pre-filled, ready for the user to complete and save.

---

## 6. How New Entry Uses buildNewEntryDefaults

`buildNewEntryDefaults` is already implemented and exported from `src/utils/entryUtils.js`.

Signature:

```js
buildNewEntryDefaults(lastEntry, baby, weeklySettings)
```

- `lastEntry` — the most recent entry on the open day, or `null` if the day is empty.
- `baby` — `activeBaby.value` from `useBabies()`. Provides `defaultNextEntryIntervalMinutes`.
- `weeklySettings` — `null` in Phase 6 (weekly settings not yet implemented).

Returns:

```
{
  entryTime:  '10:00',   // lastEntry.entryTime + intervalMinutes, capped at 23:59
  amountMl:   null,
  diaper:     null,
  vitaminD:   false,
  medication: false,
  notes:      ''
}
```

`tummyTime` is not returned by `buildNewEntryDefaults` in Phase 6 since the function predates the field. The inline new-entry row defaults `tummyTime` to `false` independently.

---

## 7. How Start Next Day / + Day Behaves

`buildStartNextDayEntry` is already implemented and exported from `src/utils/entryUtils.js`.

### Location

"+ Day" (or "Start Next Day") is a global action, not a per-day button. It lives in the header bar or the hamburger menu, not inside any `CareDay` component. The button is always accessible regardless of which days are open.

### Trigger condition

The button is always visible. Its label may adapt:

- If the most recent date in the ledger is today: label is "Add Today's Entry" or just "+ Entry" (and it opens a new entry on today's day, creating the day node if it does not exist).
- If the most recent date is before today: label is "Start Next Day" or "+ Day".

### Behaviour when tapped

1. Find the most recent `entryDate` across `grouped.value` (first day in the first week of the first month).
2. If that date is today, open Add Entry for today (creating the day node if absent).
3. If that date is before today:
   - Call `buildStartNextDayEntry(mostRecentDate, activeBaby.value)` to get `{ date, entryFields }`.
   - Create a new empty entry with that date and blank defaults via `useEntries().createEntry(...)`.
   - The new day node appears in the ledger. Open it in `openDays`.

No sheet or modal is used. The action creates the entry immediately and the ledger re-renders reactively.

---

## 8. How Row Details Open and Close

Row details are accessed via an explicit visible details button on each entry row. The button may be styled as an `i` icon, a `⋯` (ellipsis), a chevron, or the initials chip. It must be a clear tap target — not a swipe action, not a long-press, not the only result of tapping the entire row.

Tapping the details button:

1. Sets `detailEntry.value = entry` and `detailSheetOpen.value = true`.
2. `EntryDetailSheet` (an `AppSheet`) slides up from the bottom.

`EntryDetailSheet` displays:

- Time and date
- Amount in mL (or "—" if null)
- Diaper value with colour chip (W / P / WP / - / —)
- Vitamin D: shown as "☀ Vitamin D" or hidden
- Medication: shown as "Rx Medication" or hidden
- Tummy Time: shown as "★ Tummy Time" or hidden
- Notes — an editable textarea showing the full notes text (or empty/placeholder when blank). Notes save via `updateEntry(entry.id, { notes })` on blur or with a short debounce. This is the only field in the detail sheet that writes to Firestore.
- Provenance section:
  - Created by `entry.createdByLabel` (or "Legacy" for migrated entries)
  - Created at — formatted from `entry.createdAt` Firestore timestamp, or "—" if null
  - Updated by `entry.updatedByLabel` (if set)
  - Updated at — formatted from `entry.updatedAt` timestamp, or "—" if null
  - Source label — shown as "Legacy entry" when `entry.source === 'legacy'`
- Delete button (danger style)

No Edit button appears in the detail sheet. The detail sheet is not a general edit form. The editable notes textarea is the sole exception — all other core fields (`entryTime`, `amountMl`, `diaper`, `vitaminD`, `medication`, `tummyTime`) are edited inline on the row (see Section 9).

Closing: tapping the backdrop or the sheet's × button closes the sheet.

---

## 9. How Inline Edit Mode Works

Entry rows are inline-editable. There is no separate Save button. There is no form sheet for editing.

### Core inline fields

Each entry row displays and allows editing of:

- `entryTime` — time input (HH:MM)
- `amountMl` — number input (mL)
- `diaper` — segmented control or tap-cycle: W / P / WP / - / (blank)
- `vitaminD` — toggle, displays ☀ when true
- `medication` — toggle, displays Rx when true
- `tummyTime` — toggle, displays ★ when true

Notes are not inline on the row. The row shows only a compact indicator when notes are non-empty. Notes are read and edited in the Entry Detail Sheet (see Section 8).

### Save behaviour

Each field saves on change or blur. There is no explicit Save button. Behaviour:

- For toggles (`vitaminD`, `medication`, `tummyTime`): call `updateEntry(entry.id, { fieldName: newValue })` immediately on toggle.
- For text/number fields (`entryTime`, `amountMl`): save on blur or on pressing Enter/Done.
- For diaper: save immediately on selection.
- For `notes` (in the detail sheet): save on blur, or with a short debounce (e.g. 800 ms) while the user is typing. Call `updateEntry(entry.id, { notes: newValue })`.

Each `updateEntry` call goes through `useEntries().updateEntry`, which calls `entryService.updateEntry`. Provenance (`updatedByLabel`, `updatedAt`) is stamped by the service — the UI does not set these.

### New entry rows

When Add Entry creates a new inline row, it behaves identically to an existing row edit. The user fills in the fields, and each field is saved as it is committed. The entry is created in Firestore when the first field is committed (using `createEntry`). Subsequent field commits use `updateEntry`.

An alternative is to collect all fields first and call `createEntry` once when the row loses focus entirely. The implementation may choose either approach, but must not leave the Firestore document in an inconsistent state if the user abandons the row mid-entry.

### What does not change in entryService

All changes go through existing service methods. The only entryService change permitted in Phase 6 is adding `tummyTime` to `MUTABLE_FIELDS` and to `createEntry`'s default field set. No other entryService logic changes.

---

## 10. How Soft Delete Works from the Row Detail Sheet

From `EntryDetailSheet`, tapping `Delete`:

1. A confirmation step appears inline within the sheet:
   - Show "Delete this entry?" with Confirm and Cancel buttons.
2. On confirm:
   - Call `useEntries().softDeleteEntry(entry.id)`.
   - On success: close the detail sheet.
   - The `onSnapshot` removes the entry from `entries.value`. The entry disappears from the ledger reactively.
   - The entry appears in `deletedEntries.value`, visible in `RecentlyDeletedView`.
3. On cancel: return to the detail view, no change.
4. On rejection: show inline error, keep sheet open.

No hard delete. No `deleteDoc`. `softDeleteEntry` calls `updateDoc` only.

---

## 11. Restore and Recently Deleted

`restoreEntry` is already implemented in the Phase 4 service layer.

`RecentlyDeletedView.vue` is wired in Phase 6 to show `deletedEntries.value` from `useEntries`. It renders a flat list of deleted entries sorted by deletion date descending.

Restore is owner-only. The restore button is shown only when `isOwner` is true (from `useFamily()`). Non-owner caregivers can view the Recently Deleted list but cannot restore.

No full redesign of `RecentlyDeletedView` is required. A basic flat list with restore buttons is sufficient for Phase 6.

---

## 12. How Incomplete Rows and Days are Displayed

### Entry row

An entry is incomplete when `isIncomplete(entry)` is true (from `src/utils/entryUtils.js`).

- The row gets a left-side amber dot using the existing global `.incomplete-dot` class.
- mL displays "—" when `amountMl` is null.
- Diaper displays "—" when `diaper` is null.

### Day header

When `day.hasIncomplete === true` (set by `groupEntries`):

- An amber `.incomplete-dot` appears inline next to the day label.
- `aria-label`: "Incomplete entries".

### Completion rules

- `amountMl: null` — incomplete (blank).
- `amountMl: 0` — complete (valid zero feed).
- `diaper: null` — incomplete (blank).
- `diaper: '-'` — complete (intentional no-diaper event).
- `diaper: 'W'`, `'P'`, `'WP'` — complete.
- `vitaminD`, `medication`, `tummyTime` — never affect completion status.

---

## 13. Entry Row Display

`CareEntryRow` renders inline fields and indicators:

### Left section (primary data)

- Time — `entry.entryTime` (HH:MM), bold
- mL — `entry.amountMl ?? '—'` with "mL" unit
- Diaper — coloured with `.diaper-w` / `.diaper-p` / `.diaper-wp`; shows "—" if null; shows "-" as neutral dash if `diaper === '-'`

### Indicators (icon row)

- Vitamin D — ☀ shown when `entry.vitaminD === true`
- Medication — Rx shown when `entry.medication === true`
- Tummy Time — ★ shown when `entry.tummyTime === true`
- Notes — compact indicator (e.g. a small note icon) shown when `entry.notes` is non-empty; full notes live in the detail sheet only

### Right section

- Details button — explicit tap target (i, ⋯, chevron, or initials chip with creator initials). Opens `EntryDetailSheet`.
- Initials — `entry.createdByLabel` initials, shown if space allows, hidden on narrow viewports via `overflow: hidden`

The details button must always be reachable. It must not be the only result of a row tap. The row tap area may be reserved for activating inline edit fields.

---

## 14. Row Color Scheme

Row background colours distinguish hierarchy levels. The scheme is expressed via CSS custom properties so future user-configurable themes require no template changes.

- Month rows — existing colour (unchanged)
- Week segment rows — use the current teal / day-row colour (CSS variable `--color-row-week`)
- Day rows — use the current beige / week-row colour (CSS variable `--color-row-day`)
- Entry rows — beige / off-white (CSS variable `--color-row-entry`)

New CSS variables to define (in `src/styles/tokens.css` or scoped per component):

```css
--color-row-month:   /* existing month row bg */;
--color-row-week:    /* existing teal/day-row colour */;
--color-row-day:     /* existing beige/week-row colour */;
--color-row-entry:   /* existing off-white entry row */;
```

Do not build user color settings in Phase 6. The variables are the foundation for future settings, not the settings themselves.

---

## 15. tummyTime Data Field

`tummyTime` is a new boolean field added in Phase 6. It is not present in Phase 5's data model.

### Required changes to `entryService.js`

- Add `'tummyTime'` to `MUTABLE_FIELDS`.
- Add `tummyTime: fields.tummyTime ?? false` to `createEntry`'s `setDoc` call.

### Data model values

- `true` — tummy time occurred during this session.
- `false` (default) — no tummy time, or not tracked.

### Display

- Symbol on the entry row: ★ when `true`, hidden when `false`.
- Detail sheet shows "★ Tummy Time" line when `true`.

### Completeness

`tummyTime` does not affect completion status. An entry with `tummyTime: false` and valid mL and diaper is complete.

### Legacy entries

Legacy entries migrated from `feeds` will not have `tummyTime`. The field is absent on those documents. The UI should treat `entry.tummyTime == null` as `false` for display purposes.

### Phase 5 tests

No changes to Phase 5 test files or fixtures. `isIncomplete` does not include `tummyTime`, which is correct.

---

## 16. SyncStatus Remains Wired to useEntries

`CareLedgerView` already passes `:status="syncStatus"` to `SyncStatus`. This stays unchanged.

`syncStatus` comes from `useEntries()`. No change to `useEntries.js` or `SyncStatus.vue` in Phase 6.

---

## 17. What Smoke-Test UI Gets Removed

From `CareLedgerView.vue` template — remove entirely:

```
<!-- Phase 4 smoke-test panel -->
<div class="smoke-panel">
  ...all contents...
</div>
```

From the `<script setup>` block — remove:

- `feedback` ref
- `setFeedback()` function
- `handleCreate()` function
- `handleUpdate()` function
- `handleDelete()` function
- `handleRestore()` function

`createEntry`, `updateEntry`, `softDeleteEntry`, `restoreEntry` from `useEntries()` remain in scope — they are used by inline row actions and the detail sheet.

From the `<style scoped>` block — remove all `.smoke-*` rules.

---

## 18. What Must Not Be Touched

The following files must not be modified in Phase 6, except `entryService.js` for the `tummyTime` addition described in Section 15:

- `src/entries/useEntries.js`
- `src/families/useFamily.js`
- `src/families/familyService.js`
- `src/babies/useBabies.js`
- `src/babies/babyService.js`
- `src/auth/useAuth.js`
- `src/utils/ledgerGrouper.js`
- `src/utils/statsCalculator.js`
- `src/utils/entryUtils.js`
- `src/utils/weekUtils.js`
- `src/utils/dateUtils.js`
- `src/utils/unitConverter.js`
- `src/migration/legacyFeedNormalizer.js`
- `src/migration/migrationChecks.js`
- `src/test/**` (all test files and fixtures)
- `src/ui/AppLayout.vue`
- `src/ui/AppSheet.vue`
- `src/ui/AppModal.vue`
- `src/ui/AppCard.vue`
- `src/ui/AppButton.vue`
- `src/ui/SyncStatus.vue`
- `src/entries/SummaryChips.vue`
- `src/app/router.js`
- `src/app/firebase.js`
- `firestore.indexes.json`
- All Firestore rules files
- `vitest.config.js`
- `package.json`
- `package-lock.json`

Do not add service workers, web manifests, or PWA plugins. Do not add Capacitor. Do not add new routes to `router.js`. Do not import Firebase SDK in any new Phase 6 file. Do not call `groupEntries` or `calculateStats` outside of `useLedger.js`.

---

## 19. Implementation Order

1. `useLedger.js` — pure computed + collapse state, no template dependency
2. Wire `useLedger` into `CareLedgerView.vue`: replace smoke panel with `<div class="ledger-placeholder">` temporarily, wire stats chips, confirm `npm run build` passes
3. Update `entryService.js` — add `tummyTime` to MUTABLE_FIELDS and createEntry defaults
4. `CareEntryRow.vue`
5. `CareDay.vue` (depends on `CareEntryRow`)
6. `CareWeekSegment.vue` (depends on `CareDay`)
7. `CareMonth.vue` (depends on `CareWeekSegment`)
8. `EntryDetailSheet.vue`
9. Wire all components into `CareLedgerView.vue`, add global + Day button, remove ledger placeholder and smoke CSS
10. `RecentlyDeletedView.vue` wiring (wire deletedEntries, owner-only restore)

After step 2 the app is always buildable. Each subsequent step adds one component at a time.

---

## 20. Manual Test Checklist

### Ledger rendering

- [ ] Smoke-test panel is gone. No dashed border, no action buttons, no flat list.
- [ ] Stats chips show live mL values that match the visible entries.
- [ ] Month headers appear with correct label and mL total.
- [ ] Week segment headers appear within each open month.
- [ ] Day rows appear within each open week segment.
- [ ] Entry rows are sorted earliest-to-latest within each day.
- [ ] Cross-month week: Jan 31 and Feb 1 entries appear in separate month nodes.

### Row colours

- [ ] Month row background is the existing month colour.
- [ ] Week segment row background is the teal row colour.
- [ ] Day row background is the beige row colour.
- [ ] Entry row background is off-white/beige.

### Collapse behaviour

- [ ] Current month opens on load. All other months start collapsed.
- [ ] Current week segment opens on load. Other week segments start collapsed.
- [ ] Most recent day opens on load.
- [ ] Multiple days can be open at the same time.
- [ ] Tapping a month header collapses it. Tapping again expands it.
- [ ] Tapping a week header collapses it.
- [ ] Tapping a day header toggles it independently of other open days.
- [ ] Opening a day does not create a new Firestore listener (verify in DevTools network tab).

### Incomplete indicators

- [ ] Entry with `amountMl: null` shows amber dot and "—" for mL.
- [ ] Entry with `diaper: null` shows amber dot and "—" for diaper.
- [ ] Day header shows amber dot when any entry in the day is incomplete.
- [ ] Entry with `amountMl: 0` and valid diaper shows no incomplete dot.
- [ ] Entry with `diaper: '-'` is complete (no amber dot).

### Inline editing

- [ ] Tapping the time field on a row makes it editable. Save on blur.
- [ ] Tapping the mL field makes it editable. Save on blur.
- [ ] Tapping the diaper field cycles or opens a selector. Saves immediately.
- [ ] Tapping the ☀ toggle flips vitaminD. Saves immediately.
- [ ] Tapping the Rx toggle flips medication. Saves immediately.
- [ ] Tapping the ★ toggle flips tummyTime. Saves immediately.
- [ ] After saving, the row reflects the new value. Stats chips update if mL changed.
- [ ] Provenance: `updatedByLabel` and `updatedAt` are set by the service, not the UI.

### Add Entry (per-day)

- [ ] "Add Entry" button appears at the bottom of each open day.
- [ ] Tapping "Add Entry" inserts a new inline row pre-filled with `buildNewEntryDefaults` values.
- [ ] Time pre-fill is lastEntry.entryTime + 180 min (default interval), capped at 23:59.
- [ ] If day has no entries, time defaults to current time.
- [ ] Committing fields saves the entry. It appears in the ledger immediately.

### + Day / Start Next Day (global)

- [ ] Global + Day button is present in the header or hamburger menu.
- [ ] When the most recent date is before today, tapping it creates a new day and opens it.
- [ ] When the most recent date is today, tapping it adds a new entry to today.
- [ ] The button is accessible regardless of which days are open.

### Symbols

- [ ] ☀ appears on the row when `vitaminD: true`.
- [ ] Rx appears on the row when `medication: true`.
- [ ] ★ appears on the row when `tummyTime: true`.
- [ ] All three symbols are hidden when their field is `false`.

### Notes

- [ ] Notes are NOT shown inline on the row.
- [ ] A note indicator (icon or chip) appears on the row when `entry.notes` is non-empty.
- [ ] Full notes text is visible and editable in the Entry Detail Sheet.
- [ ] Typing in the notes textarea and blurring (or waiting for debounce) saves via `updateEntry({ notes })`.
- [ ] Notes can be added to an entry that had no notes. Notes can be cleared.
- [ ] The detail sheet is not a general edit form — only notes are editable in it.

### Entry detail sheet

- [ ] Details button on each row is a clear tap target (not swipe, not long-press).
- [ ] Tapping details button opens `EntryDetailSheet`.
- [ ] Sheet shows: time, date, mL, diaper, vitD line (if true), medication line (if true), tummy time line (if true), editable notes textarea.
- [ ] Sheet shows: created by, created at, updated by (if set), updated at (if set).
- [ ] For legacy entries: created by shows "Legacy", created at shows "—", source label shows "Legacy entry".
- [ ] Tapping backdrop or × closes the sheet.
- [ ] No general Edit button is in the detail sheet — core fields are edited inline on the row.

### Soft delete

- [ ] Delete button appears in the detail sheet.
- [ ] Tapping Delete shows a confirmation step.
- [ ] Confirming soft-deletes the entry. It disappears from the ledger.
- [ ] Cancelling leaves the entry unchanged.
- [ ] Deleted entry appears in RecentlyDeletedView.

### Restore (owner-only)

- [ ] Owner sees Restore button in RecentlyDeletedView.
- [ ] Non-owner caregiver does not see Restore button.
- [ ] Restoring brings the entry back to the ledger at its original date.

### Sync status

- [ ] SyncStatus dot remains green when online.
- [ ] SyncStatus dot turns amber when offline.

### Baby switch

- [ ] Switching babies clears the ledger and shows the new baby's entries.
- [ ] Collapse state resets to current month / most recent week / most recent day.
- [ ] Stats chips update to the new baby's values.

---

## 21. Rollback Plan

All Phase 6 changes are isolated to `src/entries/`. The only shared file changed is `entryService.js` (tummyTime field addition).

To roll back Phase 6:

1. Restore `src/entries/CareLedgerView.vue` to Phase 4 state: `git checkout <phase5-commit> -- src/entries/CareLedgerView.vue`
2. Restore `src/entries/RecentlyDeletedView.vue` similarly.
3. Restore `src/entries/entryService.js` to Phase 5 state (removes tummyTime from MUTABLE_FIELDS and createEntry).
4. Delete the six new files: `useLedger.js`, `CareMonth.vue`, `CareWeekSegment.vue`, `CareDay.vue`, `CareEntryRow.vue`, `EntryDetailSheet.vue`.
5. Run `npm run build` to confirm build passes.
6. Run `npm test` to confirm all 96 Phase 5 tests still pass.

No Firestore data is affected by a UI rollback. Existing entries with `tummyTime: false` (set by the updated createEntry) are harmless if the field is removed from the UI — the old service simply ignores unknown fields.

---

## 22. Phase 7 Gates

Phase 7 (Graphs / Stats deep-dive) is unblocked once:

- Stats chips display live values from `calculateStats`.
- `useLedger.js` exists and exports `stats`.

Phase 7 may import `stats` from `useLedger.js` directly without changes to `statsCalculator.js`.

Phase 10 migration is unblocked once the ledger renders correctly for both `source: "app"` and `source: "legacy"` entries, and `EntryDetailSheet` displays the correct "Legacy entry" source label.
