# Backlog: Weekly Usual Bottle Amount

A future phase should let caregivers record the usual bottle amount for a given week
as a reminder when logging feeds — not as a medical recommendation or hard target.

Design notes:
- **Label**: "Usual bottle amount" — avoid the word "target".
- **Scope**: per baby, per week. Keyed by `weekStartDate` (Monday ISO date, e.g. `2026-05-18`).
- **Likely Firestore path**: `families/{familyId}/babies/{babyId}/weeklySettings/{weekStartDate}`
- **Field**: `usualBottleAmountMl: number | null`
- **UI**: editable inline on the week segment header, or in a compact sheet.
- **Pre-populate**: `buildNewEntryDefaults` already reads `weeklySettings?.usualBottleAmountMl`
  — wire it up once the service layer exists.

Required before shipping:
1. New `weeklySettingsService.js` — read/write weeklySettings documents.
2. Firestore rules update to allow family members to read/write their baby's weeklySettings.
3. Unit tests for the service and any pure helpers.
4. UI integration in `CareWeekSegment.vue` or a settings sheet.

Do not implement in Phase 6.1B.
