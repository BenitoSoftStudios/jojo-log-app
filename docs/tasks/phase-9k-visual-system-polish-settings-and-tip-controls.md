# Phase 9K - Visual system polish, Settings cleanup, and tip controls

**Status:** Ready for implementation  
**Created:** 2026-06-05  
**Created by:** ChatGPT with user approval  
**Expected report:** `docs/reports/phase-9k-visual-system-polish-settings-and-tip-controls.md`

## Goal

Refine Jojo's Log so it feels like one consistent, modern mobile app instead of a set of features assembled across phases.

This is a visual system and settings cleanup pass. It should keep the existing soft pastel, calm, family utility direction, but make the interface feel more polished, coherent, readable, and trustworthy.

This phase may add tip controls in Settings. Do not add new care tracking features.

## Product direction

The app should feel like a quiet health-adjacent family utility, not startup SaaS and not a noisy consumer app.

Use this direction:

- soft utility
- warm clinical
- low-noise
- large touch targets
- clear hierarchy
- calm motion
- gentle depth
- readable first
- tactile but not decorative

Do not chase trends for their own sake. The app can look current for 2026/27 without becoming gimmicky.

## Current state

Recent phases completed:

- Phase 9J added empty ledger state, Help FAQ, and early-use tips.
- Phase 9J-1 corrected partial-entry instructions and improved empty-state hierarchy.
- Tips are stored in localStorage and currently cannot be reset in-app.
- Settings exists, but it may not yet feel like a coherent control panel.
- The app's base visual language is good, but some screens still feel phase-built.
- The user wants a 2026/27 polish pass, not a full redesign.

## Required context

Read:

- `docs/agent-workflow.md`
- `docs/tasks/README.md`
- `docs/tasks/template.md`
- `docs/reports/phase-9j-empty-states-help-faq-early-use-tips.md`
- `docs/reports/phase-9j-1-partial-entry-copy-and-empty-state-polish.md`
- `src/ui/EarlyUseTips.vue`
- `src/entries/CareLedgerView.vue`
- `src/help/HelpView.vue`
- `src/settings/SettingsView.vue` or equivalent settings component
- `src/ui/AppLayout.vue`
- shared UI components such as cards, buttons, sheets, headers, and layout tokens
- menu/hamburger component if separate
- existing CSS variables and app-wide styles

## Part 1 - Add tip controls in Settings

Add a small Tips section to Settings.

Required behavior:

1. Add a Settings card or section called `Tips`.
2. Include a `Show tips` control.
3. Include a `Reset tips` action.
4. Add small copy: `Tips are stored on this device.`
5. Use localStorage only.
6. Do not add Firestore writes.
7. Do not add rules.
8. Do not add account-level tip state.

Required localStorage behavior:

- `Show tips` off sets `jojo_tips_hidden` to `true`.
- `Show tips` on removes `jojo_tips_hidden`.
- `Reset tips` removes `jojo_tips_dismissed` and `jojo_tips_hidden`.
- If localStorage is unavailable, the app must not break.

The existing keys are:

- `jojo_tips_dismissed`
- `jojo_tips_hidden`

If useful, extract these keys and helpers from `EarlyUseTips.vue` into a tiny shared utility, but do not over-engineer.

## Part 2 - Settings cleanup

Make Settings feel like an intentional control panel.

Preferred structure:

1. Your profile
2. Baby profile
3. Family and caregivers
4. Time and display
5. Tips
6. Backup and import
7. Help

Requirements:

1. Group related settings into clear cards or sections.
2. Use consistent card spacing.
3. Make owner-only actions clear without making caregiver views feel broken.
4. Use plain user-facing labels.
5. Avoid developer terms.
6. Avoid phase terms.
7. Avoid stale migration or admin language.
8. Preserve existing routing and behavior.
9. Do not move functionality if it risks breaking routes.
10. Do not change permissions.

Owner-only examples may include:

- Baby Settings
- Manage Caregivers
- Import CSV
- Recently Deleted restore if exposed from settings

Caregivers should still have a useful Settings page.

## Part 3 - Visual system polish

Refine the existing interface without replacing the brand.

### Page rhythm

Each main page should have clear hierarchy:

1. Header
2. Primary action or summary
3. Main content cards
4. Secondary actions

Look for pages where every card has equal weight and adjust spacing, section labels, or card style so the user's eye knows what matters first.

### Card hierarchy

Use three visual levels where practical:

1. Primary cards: main ledger content, empty state, active entry actions, core settings groups
2. Secondary cards: tips, Help sections, profile sections, settings groups
3. Utility cards: disclaimers, warnings, import previews, metadata

Do not create new card components unless it makes sense. Prefer using or lightly extending existing components and tokens.

### Buttons and links

Polish button hierarchy:

1. Primary actions should be confident and easy to find.
2. Secondary actions should be visible, not faint.
3. Destructive actions should be clear but not alarming.
4. Links used as key actions should not look disabled.
5. Touch targets should remain comfortable.

Review:

- Empty state buttons
- Tip card actions
- Settings action links
- Help and Legend secondary buttons
- Import/Export actions if visible
- Save buttons in forms and sheets

### Tactile surfaces

The app should feel touchable without heavy decoration.

Allowed:

- soft borders
- gentle shadows
- subtle inner borders
- surface tinting using existing tokens
- pill chips

Avoid:

- heavy drop shadows
- glassmorphism
- loud gradients
- neon colors
- harsh white cards floating on beige
- trendy animation for its own sake

### Pill and chip language

Use the new empty-state chips as a visual cue for the system.

Consider using consistent pill treatment for:

- entry examples
- owner-only labels
- role badges
- descriptive-only labels
- tips labels

Do not overuse chips where plain text is clearer.

## Part 4 - Empty states consistency

Review empty states for consistency.

Relevant empty states may include:

- no entries
- no deleted entries
- no Trends because birthdate is missing
- no caregivers
- no import file selected
- no active baby

Requirements:

1. Empty states should feel intentional, not broken.
2. Use a consistent tone.
3. Include one clear next action when appropriate.
4. Avoid long text.
5. Avoid medical guidance.
6. Do not change data behavior.

## Part 5 - Tip card refinement

Polish the tip card after 9J and 9J-1.

Requirements:

1. Keep one tip at a time.
2. Keep localStorage behavior.
3. Keep caregivers from seeing owner-only CSV tip.
4. Refine spacing and action hierarchy.
5. Make `Got it`, `Hide tips`, and `Help` feel balanced.
6. Keep the card small.
7. Do not let tips compete with the ledger.
8. No em dashes in visible tip copy.
9. Do not show tips when the active baby has no entries.

## Part 6 - Help page visual scan

Do not rewrite Help again, but review the visual presentation after 9J-1.

Requirements:

1. Help should be scannable on iPhone.
2. The `How do I log...` section should be easy to find.
3. The explanation for `0 mL`, `-`, and blank/incomplete should stand out enough.
4. Icon legend should be readable.
5. Sections should not feel like a wall of identical cards.
6. No em dashes in visible Help copy.
7. No stale admin, legacy migration, schema, or developer language.
8. Do not change core Help facts unless a clear inaccuracy is found.

## Part 7 - Mobile browser polish

Review the UI for iPhone Safari and Brave behavior.

Requirements:

1. Bottom actions should not sit behind browser chrome.
2. Long pages should have enough bottom scroll padding.
3. Sticky or fixed elements should not crowd content.
4. Secondary headers should remain consistent from 9G-1.
5. Buttons should not feel too close to the screen edge.
6. The app should work with browser address bar at top or bottom.
7. Do not add PWA or manifest work in this phase.

## Part 8 - Motion and transitions

Subtle motion is allowed only if it helps clarity.

Allowed examples:

- tip dismissal fade
- bottom sheet transition refinement
- accordion opening if already present

Do not add:

- confetti
- bounce animation
- cute mascots
- onboarding animation
- noisy transitions

If motion is added, respect reduced-motion preferences if practical.

## Part 9 - Copy guardrails

Visible copy changed in this phase must follow these rules:

1. No em dash characters.
2. No developer terms.
3. No phase terms.
4. No migration language.
5. No Firebase or Firestore language.
6. No medical advice.
7. No feeding recommendations.
8. Use short, plain labels.
9. Prefer calm over cute.

Do not do a risky global copy rewrite. Only touch copy on screens affected by this phase.

## Part 10 - What not to change

Do not implement:

- new tracking features
- new entry fields
- chart redesign
- graph logic changes
- import/export logic changes
- Firestore rules changes
- Firestore indexes
- PWA install flow
- manifest or service worker changes
- public launch flow
- donations
- landing page
- onboarding modals
- coach marks
- image upload
- new animal avatars
- new color palette overhaul
- new dependencies

## Allowed files

Likely files:

- `src/settings/SettingsView.vue` or equivalent
- `src/ui/EarlyUseTips.vue`
- `src/entries/CareLedgerView.vue`
- `src/help/HelpView.vue`
- shared UI components if needed
- shared CSS/tokens if needed
- menu component if needed for consistency
- `docs/reports/phase-9k-visual-system-polish-settings-and-tip-controls.md`

Touch other files only if necessary for UI consistency. Keep the scope tight.

## Safety restrictions

- Do not touch feeds calculations.
- Do not change entry write behavior.
- Do not change import/export logic.
- Do not run migration.
- Do not bulk modify Firestore data.
- Do not modify imported legacy entries.
- Do not change Firestore rules.
- Do not change Firestore indexes.
- Do not add new Firestore listeners.
- Do not add PWA/Capacitor/service worker/manifest work.
- Do not add image upload.
- Do not add Firebase Storage.
- Do not add external image assets.
- Do not add image generation.
- Do not use `deleteDoc`.
- Do not add dependencies.

## Validation checklist

Run:

- `npm test`
- `npm run build`
- `git status`
- `git diff --stat`
- `grep deleteDoc src/`

Confirm:

1. Settings has a Tips section.
2. Show tips off hides tips by setting localStorage state.
3. Show tips on re-enables tips by clearing hidden state.
4. Reset tips clears dismissed and hidden tip state.
5. Tips still do not show when active baby has zero entries.
6. Tips still show after first entry exists unless hidden or completed.
7. Caregivers still do not see owner-only CSV tip.
8. Settings feels more organized and understandable.
9. Caregiver Settings view still feels usable.
10. Owner-only actions are clear.
11. Empty states look intentional and consistent.
12. Tip card is less bulky and does not compete with ledger.
13. Help remains accurate after 9J-1.
14. Help has no em dash characters in visible copy.
15. New visible copy has no em dash characters.
16. No broad color palette overhaul was done.
17. No glassmorphism, heavy shadows, or noisy gradients were added.
18. No modal onboarding was added.
19. No entry write behavior changed.
20. No import/export logic changed.
21. No Firestore rules/indexes changed.
22. No migration or bulk data mutation.
23. No deleteDoc.
24. No PWA/Capacitor/SW/manifest.
25. No new dependencies.

## Claude reporting requirements

After implementation, create:

`docs/reports/phase-9k-visual-system-polish-settings-and-tip-controls.md`

The report must include:

- Summary
- Changed files
- Settings cleanup summary
- Tip controls summary
- Visual system polish summary
- Empty states summary
- Help page scan summary
- Mobile browser spacing summary
- No em dash confirmation
- Tests result
- Build result
- Safety confirmations
- Manual QA checklist
- Known issues or follow-ups
- Commit hash
- Main synced with origin/main: yes/no
- Vercel redeploy expected: yes/no
