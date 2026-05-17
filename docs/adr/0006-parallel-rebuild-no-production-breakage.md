# The Vue rebuild runs in parallel with the live HTML app; no production breakage is acceptable

The household uses the HTML app daily. It must not break at any point during the rebuild. The Vue app runs on a separate Vercel preview URL while the household continues using the production URL. The old Firestore `feeds` collection is never modified, moved, or locked down until the HTML app is no longer needed. Firestore security rules are not tightened until after Cutover. Migration is copy-only: reads from `feeds`, writes Legacy Entries to the new path, and stops there.

Cutover sequence:
1. Vue app passes the full feature parity checklist
2. Both parents test the Vue app on the preview URL for several days
3. A CSV backup exists
4. Old `feeds` is verified as untouched
5. Household switches to the Vue URL
6. HTML app kept accessible briefly as fallback
7. Rules tightened and `feeds` archived only after HTML app is retired

This is recorded as an ADR because the temptation to "just migrate" and "just tighten rules" in one step is real. This decision makes the safer, slower path explicit and non-negotiable.
