# Backlog: CSV / Data Export

Phase 6.5 implemented owner-only CSV export via the menu. See docs/reports/phase-6-5-csv-export.md.

## Remaining / future items

### Include deleted entries option

Current behaviour: Export CSV exports only active (non-deleted) entries from `entries.value`.
Deleted entries are available in `deletedEntries` from `useEntries`.

To add an option:
- Add a checkbox or toggle in the menu before the Export CSV button.
- Pass `[...entries.value, ...deletedEntries.value]` when the toggle is on.
- The `deleted` and `deletedAt` columns are already present in the CSV schema — no schema changes needed.

### Date range filter

Currently exports all entries for the active baby. A date range picker (from/to) would let users export a subset.

### Non-owner access

Currently owner-only. Could be opened to all members if desired — no service-layer changes needed, only the `v-if="isOwner"` guard in the menu.
