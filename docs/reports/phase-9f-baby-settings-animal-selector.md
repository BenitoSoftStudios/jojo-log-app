# Phase 9F — Baby Settings, animal selector, and live polish

## Summary

Eight-part implementation: medication placeholder copy fix, niceMax large-volume axis refinement, Baby Settings with privacy hints and animal avatar selector, Since birth empty state for missing birthdate, 8 coded inline SVG animal avatars, animal display in ledger header and baby switcher, caregiver read-only protection on baby settings, and Help & Legend baby profile section.

---

## Changed files

| File | Change |
|------|--------|
| `src/utils/graphData.js` | Fixed `niceMax` fallback for ml > 30000 (5k steps < 100k, 10k steps ≥ 100k) |
| `src/entries/CareEntryRow.vue` | Medication input placeholder changed to `Name, dosage` |
| `src/animals/animalAvatars.js` | New — SVG registry for 8 animals; `ANIMALS`, `DEFAULT_ANIMAL`, `getAnimalSvg()` |
| `src/animals/AnimalAvatar.vue` | New — Vue component rendering coded inline SVG by `animalKey` |
| `src/babies/BabySettingsView.vue` | Privacy hints, animal avatar selector, caregiver read-only gating |
| `src/babies/BabySwitcher.vue` | Added `AnimalAvatar` beside each baby name |
| `src/charts/GraphView.vue` | `sinceBirthMissingBirthdate` computed, banner when no birthdate |
| `src/entries/CareLedgerView.vue` | `AnimalAvatar` in ledger header replaces 🦆 emoji |
| `src/help/HelpView.vue` | New "Baby profile" section |
| `src/test/graphData.test.js` | 4 new `niceMax` tests for large-volume ranges |

---

## Baby settings summary

- Owner can edit nickname, birthdate, interval, and animal avatar from `/baby-settings`.
- Save sends all four fields (plus existing `defaultNextEntryIntervalMinutes`) via `updateActiveBaby`.
- Birthdate is optional; saving with a blank birthdate stores `null`.
- Nickname is the only required field (existing constraint).
- Caregiver view shows nickname and birthdate as read-only text with a note explaining edit is owner-only.
- Edit controls (inputs, avatar grid, Save button) are hidden from caregivers.
- Archive section remains owner-only (unchanged).

---

## Privacy behavior summary

- Nickname field hint: "For privacy, use a nickname instead of the baby's real name."
- Birthdate field hint: "For privacy, use a nearby date rather than the exact birthday."
- Birthdate is never required by the app.
- Copy is calm and short; no fear-based language.

---

## Since birth behavior summary

- `sinceBirthStart` computed: if `activeBaby.birthdate` is set, returns `YYYY-MM-01` (first of birth month); otherwise returns `null`.
- New `sinceBirthMissingBirthdate` computed: `true` when `selectedRange === 'birth'` and `sinceBirthStart` is `null`.
- `dailyStats` returns `[]` when `sinceBirthMissingBirthdate` is true — no fallback to earliest entry date.
- Template shows a soft banner: "Add a birthdate in Baby Settings to use Since birth trends. For privacy, a nearby date is fine."
- Summary stats card and explanatory banner are hidden when the Since birth banner is shown.
- `7 Days` and `30 Days` ranges are unaffected.
- No birthdate backfill, inference, or historical entry mutation.

---

## Animal avatar implementation summary

- `src/animals/animalAvatars.js`: exports `ANIMALS` (8 items), `DEFAULT_ANIMAL = 'duck'`, and `getAnimalSvg(key)`.
- `src/animals/AnimalAvatar.vue`: `<svg viewBox="0 0 40 40" v-html="svgBody" />` pattern — no image files, no external URLs.
- Unknown or missing `animalKey` falls back to `DEFAULT_ANIMAL` via `SVG_REGISTRY[key] ?? SVG_REGISTRY[DEFAULT_ANIMAL]`.
- Selector grid in Baby Settings is 4-column responsive; each tile shows the avatar + animal name.
- Selected tile gets mint border + mint-soft background.
- Avatars appear in: ledger header (24px), baby switcher (20px), Baby Settings profile header (48px), avatar selector grid (36px).

---

## Animal style summary

- Palette: butter yellow (#F5E3A0), cream/blush (#F5EDE4, #F2B8C8), warm tan (#D4A882), ivory (#F5F0E8), dusty lavender (#C8BCCF), caramel (#D4884A), terracotta (#D46030), sage green (#8DC880).
- All avatars: rounded forms, minimal facial detail, calm expressions.
- Two-tone bodies (main fill + slightly darker accent for muzzle/ears).
- Soft eye highlight dot for gentle depth.
- No harsh outlines; no 3D effects; no neon colors.
- Animals: Duck (butter yellow, orange bill), Bunny (cream, blush inner ears), Bear (warm tan, darker muzzle), Lamb (ivory face, wool-puff body), Cat (dusty lavender, sage green eyes), Dog (caramel, floppy ears), Fox (terracotta, cream muzzle), Frog (sage green, large eye bumps).

---

## Data model summary

- New field `animalAvatar: string` on the baby Firestore document.
- Stored as a stable key: `"duck"`, `"bunny"`, `"bear"`, `"lamb"`, `"cat"`, `"dog"`, `"fox"`, `"frog"`.
- Saved via existing `updateActiveBaby()` → `updateBaby()` → `updateDoc` (no allowlist; safe to add new fields).
- Existing baby documents with no `animalAvatar` field fall back to `DEFAULT_ANIMAL = 'duck'` at render time.
- No migration or backfill required.
- `babyService.createBaby` not changed; newly created babies also fall back to duck until saved.

---

## Trends axis scaling summary

`niceMax(rawMax, 'ml')` updated:
- rawMax within `ML_STEPS` (≤ 30000): finds the first step >= rawMax (unchanged).
- rawMax > 30000 and < 100000: `Math.ceil(rawMax / 5000) * 5000`.
- rawMax >= 100000: `Math.ceil(rawMax / 10000) * 10000`.

Examples verified:
- `21858 mL` → `25000` (ML_STEPS lookup) ✓
- `32000 mL` → `35000` (5k fallback) ✓
- `99001 mL` → `100000` (5k fallback) ✓
- `103000 mL` → `110000` (10k fallback) ✓
- `100000 mL` → `100000` (10k fallback, exact) ✓

---

## Permission behavior

- Owner: full edit access (nickname, birthdate, interval, avatar). Save, Archive visible.
- Caregiver: read-only view of nickname and birthdate. No form controls shown.
- No Firestore rules changed. Existing rules are expected to allow owner update on baby docs.

---

## Tests result

**354 tests passing** (`npm test`). New tests added in `graphData.test.js`:

- `returns 35000 for 32000 mL`
- `returns 100000 for 99001 mL`
- `returns 110000 for 103000 mL`
- `returns 100000 for 100000 mL exactly`

---

## Build result

`npm run build` — clean (0 errors). Pre-existing chunk size advisory unchanged.

---

## Safety confirmations

- No feeds path changed ✓
- No Firestore rules/indexes changed ✓
- No migration or bulk data mutation ✓
- No new Firestore listeners ✓
- `grep -r "deleteDoc" src/` — no matches ✓
- No PWA/Capacitor/SW/manifest ✓
- No image upload, Firebase Storage, or external image URLs ✓
- No generated image assets ✓
- No medical recommendation language ✓
- No `deleteDoc` ✓
- Historical entries not changed ✓
- Import/export behavior not changed ✓

---

## Known issues or follow-ups

- The `v-html` SVG approach in `AnimalAvatar.vue` is safe because all SVG strings come from the trusted internal `SVG_REGISTRY`; no user input ever reaches `v-html`.
- Avatar selector grid on very small screens (< 320px) may benefit from 2-column layout; acceptable at standard iPhone widths (375px+).

---

## Commit hash

See `git log` after push.

## Main synced with origin/main

Yes (merged before implementing).

## Vercel redeploy expected

Yes — 10 source files changed, 2 new files added.
