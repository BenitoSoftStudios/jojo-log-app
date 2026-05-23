# Backlog: CSV / Data Export

A future phase should let caregivers export their entry data as CSV or another portable format.

Design notes:
- **Timing**: implement after ledger stability — data model and entry fields should be finalized first.
- **Scope**: export all entries for the active baby within a selectable date range (e.g., last 7 days, last 30 days, all time).
- **Format**: CSV with one row per entry. Columns: date, time, amountMl, diaper, vitaminD, medication, tummyTimeCount, notes. Include `usualBottleAmountMl` from `weeklySettings` for the entry's week (join by weekStartDate).
- **Delivery**: generate client-side (no server needed); trigger a file download via a Blob URL.
- **Entry point**: Settings or a dedicated Export screen — not in the main ledger header.
- **No backend required**: all data is already loaded in memory from Firestore on the active session.

Do not implement before ledger data model is stable.
