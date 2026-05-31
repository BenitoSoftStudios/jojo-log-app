# Phase 9F - Baby settings, animal selector, and live polish

**Status:** Ready for implementation  
**Created:** 2026-05-31  
**Created by:** ChatGPT with user approval  
**Expected report:** `docs/reports/phase-9f-baby-settings-animal-selector.md`

## Goal

Add a real Baby Settings experience, introduce a privacy-safe animal avatar selector using coded inline SVGs, and include small live polish fixes from Phase 9E.

This phase should make each baby profile feel personal without using uploaded photos, cloud image storage, generated image assets, or real identifying information.

## Current state

- Jojo’s real data is migrated and live.
- Multi-user family access works.
- Owner and caregiver permissions work.
- Profile editing works.
- Manage Caregivers works.
- Timezone works.
- Trends charts now have real axes.
- Tummy Time now works as a single tracked session with optional duration.
- Rx Medication now supports an optional medication note.
- User feedback from Phase 9E:
  - Medication input placeholder should be shorter: `Name, dosage`
  - Since Birth / monthly volume chart y-axis scaling needs a clearer growth rule.
- User does not want baby photo upload.
- User does not want image generation inside the code task.
- Animal avatars should be coded inline SVGs, not uploaded image files.
- Baby nickname and birthdate should support privacy-conscious use.

## Required context

Read:

- `docs/agent-workflow.md`
- `docs/tasks/README.md`
- `docs/tasks/template.md`
- `docs/reports/phase-9e-trends-axis-and-medication-details.md`
- `src/charts/GraphView.vue`
- `src/utils/graphData.js`
- `src/entries/CareLedgerView.vue`
- `src/families/useFamily.js`
- `src/families/familyService.js`
- existing baby settings or baby service files
- existing router/menu files
- existing test patterns

## Part 1 - Small Phase 9E polish

### Medication placeholder

Change the medication detail input placeholder from:

`Name, dosage, or note`

to:

`Name, dosage`

Do not change the data model. `medicationNote` remains open text and may still contain any user-entered note. This is only a UI placeholder copy change.

### Trends y-axis scaling refinement

Refine volume chart axis scaling so large total/monthly volume charts scale with clean growth ceilings.

Required behavior:

1. Daily mL charts should keep small readable mL steps.
2. Total/monthly mL charts under `100,000 mL` should round up to the next `5,000 mL`.
3. Total/monthly mL charts at or above `100,000 mL` should round up to the next `10,000 mL`.
4. Examples:
   - `21,858 mL` -> `25,000 mL`
   - `32,000 mL` -> `35,000 mL`
   - `99,001 mL` -> `100,000 mL`
   - `103,000 mL` -> `110,000 mL`
5. Keep axis labels readable, for example:
   - `25k`
   - `35k`
   - `100k`
   - `110k`
6. Do not reintroduce floating max labels.
7. Keep proper y-axis line, x-axis baseline, 0 label, and max label.

Add or update tests for the axis helper.

## Part 2 - Baby Settings screen

Add or complete a Baby Settings screen for the active baby.

Required behavior:

1. Owner can open Baby Settings from the existing menu/settings area.
2. Caregiver can view baby profile details if the page is reachable, but cannot edit them.
3. Owner can edit:
   - baby nickname
   - birthdate
   - animal avatar
4. Baby nickname must not require a legal name.
5. Birthdate must be optional.
6. The app must not block setup or Baby Settings save if birthdate is blank.
7. Do not require first name, last name, or exact date of birth.
8. Do not move timezone into Baby Settings. Timezone remains family-level.
9. Do not add baby photo upload.
10. Do not add file upload.
11. Do not add image URL input.
12. Do not add cloud storage.
13. Do not add camera access.
14. Do not add generated images.
15. Save should show success and error state.
16. If no active baby exists, show a clear empty state.
17. Do not change historical entries when baby nickname or avatar changes.
18. Do not change import/export behavior unless baby nickname handling already depends on baby metadata.

Suggested fields:

- Nickname
- Birthdate
- Animal avatar

Optional, only if already supported and safe:

- Active/inactive status

Do not add dangerous delete behavior.

### Privacy helper text

Add short privacy helper text under the nickname field:

`For privacy, use a nickname instead of the baby’s real name.`

Add short privacy helper text under the birthdate field:

`For privacy, use a nearby date rather than the exact birthday.`

Copy rules:

1. Keep the copy calm and short.
2. Do not use fear-based privacy language.
3. Do not make birthdate required.
4. Do not imply parents must provide real identifying information.

## Part 3 - Since birth Trends behavior

The `Since birth` range depends on birthdate.

Required behavior:

1. If the active baby has a birthdate, `Since birth` starts from the baby’s birth month.
2. If the active baby has no birthdate, do not guess from earliest entry.
3. If the active baby has no birthdate, the `Since birth` range should show a soft empty-state banner instead of a chart.
4. Banner copy:

`Add a birthdate in Baby Settings to use Since birth trends. For privacy, a nearby date is fine.`

5. `7 Days` and `30 Days` should still work without birthdate.
6. Do not make birthdate required.
7. Do not modify historical entries.
8. Do not infer or backfill birthdate from imported entries.
9. Do not use earliest entry as fallback for `Since birth`.

## Part 4 - Animal avatar selector

Add a small set of coded inline SVG animal avatars for babies.

Required animal set:

1. Duck
2. Bunny
3. Bear
4. Lamb
5. Cat
6. Dog
7. Fox
8. Frog

Implementation requirement:

- Use coded inline SVG components or a coded SVG registry.
- Do not use PNG, JPG, GIF, WebP, uploaded files, remote images, base64 image blobs, or generated image assets.
- Do not call any image generation tools.
- Do not add user uploads.
- Do not add Firebase Storage.
- Do not add external asset URLs.

Data model:

Store a simple stable key on the baby document, for example:

`animalAvatar: "duck"`

or:

`avatarKey: "duck"`

Pick the name that best matches existing baby model conventions. Use one name across the app.

Default behavior:

- If a baby has no avatar key, use `duck` or another gentle default.
- Existing baby documents do not need backfill.
- Missing or unknown avatar keys should fall back to the default avatar.

Selector behavior:

1. Show animal choices in a clean grid.
2. Each option shows the avatar and animal name.
3. Selected avatar is clear.
4. Owner can select and save.
5. Caregiver cannot change selection.
6. Keep the selector mobile-first.
7. Tap targets must be comfortable on iPhone.

## Part 5 - Animal visual style

The animal avatars must match the product tone.

Style direction:

- Soft pastel nursery palette.
- Classical children’s book feeling.
- Gentle, traditional, parent-friendly.
- Rounded forms.
- Calm expressions.
- Minimal facial detail.
- Subtle outlines or no harsh outlines.
- Warm and cute without feeling loud.

Suggested palette:

- cream
- butter yellow
- dusty blue
- sage
- blush
- soft lavender
- warm tan
- muted mint
- soft peach

Avoid:

- neon colors
- harsh black outlines
- sticker-pack style
- glossy mascot style
- flat corporate tech mascot style
- aggressive kawaii style
- 3D effects
- busy detail
- shadows that feel like marketing graphics

The avatars should feel charming, calm, and suitable for a baby log app.

## Part 6 - Show selected animal in the app

Show the selected baby avatar in key places.

Required:

1. Ledger header near the active baby name.
2. Baby Settings screen.
3. Baby switcher if the app already has one.
4. Any baby profile card if one exists.

Do not clutter entry rows with the animal avatar.

If the header becomes cramped on mobile, prioritize:

1. baby avatar
2. baby nickname
3. age/week detail if already shown
4. secondary metadata

## Part 7 - Permissions and Firestore safety

Owner edit behavior must respect existing hardened rules.

Required:

1. Owner can edit baby nickname, birthdate, and avatar.
2. Caregiver cannot edit baby fields.
3. Caregiver should not see edit controls.
4. If current Firestore rules block owner baby update, stop and report the exact rule patch needed. Do not claim complete.
5. Do not weaken rules.
6. Do not deploy rules.
7. Do not change Firestore rules in repo unless the task stops and documents the patch.

Expected current behavior:

- Existing rules likely allow owner create/update on baby docs.
- If so, no rules patch should be needed.

## Part 8 - Help and settings copy

Update Help & Legend or Settings copy only where needed.

Required:

1. Mention Baby Settings if it has a visible page.
2. Mention that animal avatars are for quick baby recognition and privacy-friendly personalization.
3. Mention that nickname is preferred over real name for privacy.
4. Mention that a nearby date can be used instead of exact birthday.
5. Do not mention photo upload.
6. Do not mention generated images.
7. Keep copy short.
8. No phase language.

## Out of scope

Do not implement:

- baby photo upload
- camera upload
- Firebase Storage
- remote image URLs
- generated images
- animal animation
- GIF avatars
- public avatar marketplace
- broad styling redesign
- new onboarding flow
- PWA
- Capacitor
- Firestore rules deployment
- Firestore indexes
- migration
- bulk data cleanup
- entry history mutation
- import/export redesign
- medical guidance
- reminder notifications

## Allowed files

Likely files:

- `src/settings/SettingsView.vue`
- `src/settings/BabySettingsView.vue` or equivalent
- `src/babies/*` if baby service/store files exist
- `src/families/useFamily.js`
- `src/families/familyService.js`
- `src/entries/CareLedgerView.vue`
- `src/charts/GraphView.vue`
- `src/utils/graphData.js`
- `src/test/graphData.test.js`
- `src/components/animals/*` or equivalent inline SVG registry
- `src/app/router.js`
- `src/help/HelpView.vue`
- relevant tests
- `docs/reports/phase-9f-baby-settings-animal-selector.md`

## Safety restrictions

- Do not touch feeds.
- Do not run migration.
- Do not bulk modify Firestore data.
- Do not modify imported legacy entries.
- Do not change Firestore rules.
- Do not change Firestore indexes.
- Do not add new Firestore listeners unless an existing baby settings listener already exists and the need is explained.
- Do not add PWA/Capacitor/service worker/manifest work.
- Do not add image upload.
- Do not add Firebase Storage.
- Do not add external image assets.
- Do not add image generation.
- Do not use `deleteDoc`.
- Do not add medical recommendation language.

## Validation checklist

Run:

- `npm test`
- `npm run build`
- `git status`
- `git diff --stat`
- `grep deleteDoc src/`

Confirm:

1. Medication placeholder says `Name, dosage`.
2. Monthly/total mL axis scaling under `100,000 mL` rounds to next `5,000 mL`.
3. Monthly/total mL axis scaling at or above `100,000 mL` rounds to next `10,000 mL`.
4. `21,858 mL` scales to `25,000 mL`.
5. `32,000 mL` scales to `35,000 mL`.
6. `103,000 mL` scales to `110,000 mL`.
7. Daily mL charts still use readable smaller scale steps.
8. Baby Settings page exists or existing settings now includes baby settings.
9. Owner can edit baby nickname.
10. Owner can save Baby Settings with birthdate blank.
11. Owner can edit baby birthdate.
12. Owner can select animal avatar.
13. Caregiver cannot edit baby settings.
14. Nickname helper text recommends using a nickname, not the baby’s real name.
15. Birthdate helper text recommends using a nearby date for privacy.
16. `7 Days` Trends works with no birthdate.
17. `30 Days` Trends works with no birthdate.
18. `Since birth` shows a soft banner when birthdate is missing.
19. `Since birth` starts from birth month when birthdate exists.
20. No birthdate backfill or inference occurs.
21. Selected animal appears in ledger header.
22. Selected animal appears in Baby Settings.
23. Selected animal appears in baby switcher if applicable.
24. Missing avatar key falls back to default avatar.
25. Unknown avatar key falls back to default avatar.
26. Animal avatars are inline SVG/code-based, not uploaded image files.
27. No Firebase Storage added.
28. No image upload flow added.
29. No external image URLs added.
30. No generated image assets added.
31. Help/settings copy is short and has no phase language.
32. No feeds path changed.
33. No Firestore rules/indexes changed.
34. No migration or bulk data mutation.
35. No deleteDoc.
36. No PWA/Capacitor/SW/manifest.

## Claude reporting requirements

After implementation, create:

`docs/reports/phase-9f-baby-settings-animal-selector.md`

The report must include:

- Summary
- Changed files
- Baby settings summary
- Privacy behavior summary
- Since birth behavior summary
- Animal avatar implementation summary
- Animal style summary
- Data model summary
- Trends axis scaling summary
- Permission behavior
- Tests result
- Build result
- Safety confirmations
- Known issues or follow-ups
- Commit hash
- Main synced with origin/main: yes/no
- Vercel redeploy expected: yes/no
