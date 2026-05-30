# Phase 9C — Caregiver Profile Self-Edit Verification + Graphs

**Date:** 2026-05-30
**Status:** COMPLETE

---

## Part 1: Caregiver profile self-edit status

### Investigation

| Item | File | Finding |
|---|---|---|
| Profile self-edit UI | `src/settings/ProfileView.vue` | Calls `updateMember(familyId, currentUser.uid, { displayLabel, initials })` |
| Update implementation | `src/families/familyService.js` | `updateDoc` with explicit fields only — never sends role, active, userId, legacyImportAdmin |
| Deployed Firestore rule for member update | (Firebase Console) | `allow update: if isOwner(familyId)` |

### Current status

| Role | Self-edit result |
|---|---|
| **Owner** | **Works** — `isOwner(familyId)` evaluates true; `displayLabel` and `initials` are updated correctly |
| **Caregiver** | **Blocked** — `isOwner(familyId)` evaluates false; Firestore returns `permission-denied` |

The Phase 9B closeout report's blocker note is **accurate and still current**. No app code changes are needed — `ProfileView.vue` already shows a clear `permission-denied` error message. The app never sends protected fields (role, active, userId, legacyImportAdmin, invite fields) in the update call.

### Security fields — verified never sent

`familyService.updateMember` uses `updateDoc` which sends only the fields explicitly passed. `ProfileView.vue` passes only:
```js
{ displayLabel: displayLabel.value.trim(), initials: initials.value.trim() }
```

Fields never sent from any profile save: `role`, `active`, `userId`, `legacyImportAdmin`, `joinedViaInviteId`, `joinedViaInviteCode`.

### Exact Firebase Console rule patch required for caregiver self-edit

In the Firebase Console → Firestore → Rules, find the member `allow update` rule and replace it with:

```
allow update: if (
    // Owner can update any member (existing behavior)
    isOwner(familyId)
    && (!('legacyImportAdmin' in request.resource.data)
        || request.resource.data.legacyImportAdmin
           == resource.data.get('legacyImportAdmin', false))

  ) || (

    // Any member may update their own displayLabel and initials only.
    // All security fields must remain unchanged.
    request.auth.uid == memberId
    && request.resource.data.userId   == resource.data.userId
    && request.resource.data.role     == resource.data.role
    && request.resource.data.active   == resource.data.active
    && (!('legacyImportAdmin' in request.resource.data)
        || request.resource.data.legacyImportAdmin
           == resource.data.get('legacyImportAdmin', false))
    && (!('joinedViaInviteId' in request.resource.data)
        || request.resource.data.joinedViaInviteId
           == resource.data.get('joinedViaInviteId', null))
    && (!('joinedViaInviteCode' in request.resource.data)
        || request.resource.data.joinedViaInviteCode
           == resource.data.get('joinedViaInviteCode', null))
  );
```

**Why this patch is safe:**
- The second branch only fires when `request.auth.uid == memberId` — a member can only update their own document.
- `userId`, `role`, `active`, and all security/invite fields are locked to their existing values.
- Only `displayLabel`, `initials`, and fields not explicitly guarded can change — the app only ever sends those two.
- The owner branch is unchanged from the current deployed rule.

**This patch has not been deployed.** It must be applied manually in the Firebase Console.

---

## Part 2: Graphs

### Files created/modified

| File | Action |
|---|---|
| `src/utils/graphData.js` | Created — pure data utilities |
| `src/test/graphData.test.js` | Created — 25 tests for graph utilities |
| `src/charts/GraphView.vue` | Rewritten — full graph implementation |

### Graph data utility (`graphData.js`)

Three exported functions:

| Function | Description |
|---|---|
| `addDays(dateStr, n)` | Add n calendar days to a YYYY-MM-DD string (n may be negative) |
| `buildDateRange(startDate, endDate)` | Return all dates in range, inclusive, oldest-first |
| `computeDailyStats(entries, startDate, endDate)` | Per-day stats for entries |
| `sevenDayRollingAvg(dailyStats)` | 7-day trailing rolling average of totalMl |

**`computeDailyStats` rules:**
- Deleted entries excluded (defensive — `useEntries` already filters them)
- Both `source: 'app'` and `source: 'legacy'` included
- `startDate: null` → uses earliest non-deleted entry date
- Every date in range is returned (zero rows for days with no entries)
- `tummyCount` uses `tummyTimeCount` field when present; falls back to `tummyTime` boolean (legacy)
- `feedCount` = number of entries where `amountMl > 0`
- 0 mL does not count as a feed

### Graph view (`GraphView.vue`)

**Charts implemented:**
1. **Daily total mL** — bar height proportional to summed `amountMl` per day
2. **Daily feed count** — bar height proportional to feeds (`amountMl > 0`) per day
3. **Tummy time sessions** — bar height proportional to `tummyCount` per day

**Range controls:** 7 Days (last 7 calendar days) / 30 Days (last 30) / All (full history)

**7-day rolling average:** Shown as a text stat below the mL chart — `7-day rolling avg: NNN mL`

**SVG bar chart design:**
- No chart library — pure SVG rendered inline
- Scrollable horizontally (`overflow-x: auto`) for wide date ranges
- Column width adapts: 40px (≤7 days) / 16px (≤30) / 10px (≤90) / 8px (>90)
- Date labels skip intelligently to avoid overlap: every label (7d), every 5th (30d), every 14th + last (all)
- Value labels shown above bars when there is enough width/height
- Max value shown at top-left of each chart for y-axis reference
- Baseline at y=120 for visual floor
- `fill: var(--color-mint)` — consistent with app accent colour

**Timezone:** `todayDate` computed from `getTodayInTimezone(familyTimezone.value)`; date range respects family timezone. All `entryDate` strings are YYYY-MM-DD in family timezone (set at entry creation time).

**No new Firestore listeners.** The view reads `entries` from the existing module-level `useEntries` singleton subscription.

**Empty states:**
- No active baby → "No active baby selected."
- No entries in selected range → "No entries in this range."
- Tummy time zero in range → "No sessions recorded in this range." (per-chart note)

### Tests (`graphData.test.js`) — 25 tests

| Describe | Count |
|---|---|
| `addDays` | 3 |
| `buildDateRange` | 3 |
| `computeDailyStats` | 14 |
| `sevenDayRollingAvg` | 5 |

Test coverage highlights:
- Empty entries → empty result
- All-deleted entries → empty result
- Deleted entries excluded from sums
- Legacy + app entries both included
- 0 mL not counted as feed
- null amountMl excluded
- `tummyTimeCount` field summed correctly
- Legacy `tummyTime` boolean fallback
- Multi-entry grouping per day
- Date range filtering
- null startDate → earliest entry date used
- Zero-fill for missing days within range
- Oldest-first sort guaranteed
- `sevenDayRollingAvg`: windows smaller than 7 days handled correctly
- 8th-previous day correctly excluded from rolling window

---

## Validation checklist

| # | Check | Result |
|---|---|---|
| 1 | Owner profile self-edit works | ✓ (isOwner rule passes) |
| 2 | Caregiver profile self-edit works | ✗ — blocked by Firestore rules; rule patch documented above |
| 3 | No role/security fields editable through profile | ✓ (never sent in updateMember call) |
| 4 | Graphs show daily total mL | ✓ |
| 5 | Graphs show daily feed count | ✓ |
| 6 | Graphs show tummy time sessions | ✓ |
| 7 | Graphs respect active baby only | ✓ (entries subscription is baby-scoped) |
| 8 | Graphs exclude deleted entries | ✓ (filtered in computeDailyStats + already filtered in useEntries) |
| 9 | Graphs include legacy and app entries | ✓ (no source filter applied) |
| 10 | Graphs use family timezone for day grouping | ✓ (todayDate from getTodayInTimezone; entryDate set at creation with timezone) |
| 11 | No new Firestore listeners | ✓ (reads existing entries singleton) |
| 12 | No feeds path changed | ✓ |
| 13 | No deleteDoc in src/ | ✓ (grep confirms) |
| 14 | No Firestore rules/indexes changed | ✓ |
| 15 | No PWA/Capacitor/SW/manifest | ✓ |
| 16 | No chart library added | ✓ (pure SVG) |
| — | Tests | 311 / 311 |
| — | Build | Clean |

---

## Outstanding item

**Caregiver profile self-edit** requires the Firestore rules patch documented in Part 1.
The patch must be applied manually in the Firebase Console. It is safe to deploy without
any app code change — the app already sends only the correct fields and handles the
`permission-denied` error with a clear message.
