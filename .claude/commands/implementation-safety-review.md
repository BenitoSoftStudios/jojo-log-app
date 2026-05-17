Review all uncommitted changes in this repo before committing. Do not commit, push, or modify any files.

Run:
- `git diff`
- `git diff --cached`
- `git status`

Check each changed file against all of the following:

1. Silent catch blocks — any `catch {}` or catch that swallows errors without logging in auth, router, Firestore, family lookup, or setup flows is not allowed. Every catch must log `e.code` and `e.message` or surface a user-facing error.
2. Route/auth regressions — does the router guard still require auth for all protected routes? Does sign-in → redirect → family recovery still work? Does sign-out clear session state correctly?
3. localStorage as source of truth — localStorage may only be used as a cache for `jojo_familyId` and `jojo_babyId`. It must always be validated against Firestore before being trusted. Invalid cache must be cleared.
4. Legacy feeds — no new reads or writes to the `feeds` collection in changed files unless explicitly approved as part of a migration.
5. Firebase credentials — all Firebase config values must use `import.meta.env.VITE_FIREBASE_*`. No hardcoded API keys, project IDs, or app IDs.
6. Sensitive files — `.env`, `.env.local`, CSV files, private screenshots, or real user data must not be staged.
7. Phase scope — changes must stay within the approved phase. No Phase 4+ code (entry service, Firestore entry reads/writes, ledger hierarchy, SummaryChips with real data) unless Phase 4 has been explicitly approved.
8. Docs — if the change introduces a new architectural constraint, Firebase rule requirement, or cross-cutting decision, does `docs/` need a corresponding update?

Report each check as PASS, FAIL, or N/A. Summarise any blockers before committing.
