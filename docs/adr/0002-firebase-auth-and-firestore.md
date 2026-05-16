# Use Firebase Auth and Firestore as the backend; no custom API server

Firebase Auth provides identity (caregiver accounts) and Firestore provides the shared real-time data store. No custom API server is needed at MVP because Firestore security rules can enforce family-scoped access directly. This avoids the operational cost of a server and keeps the app deployable with just Vercel (frontend) and Firebase (backend). Cloud Functions may be added later for public hardening of invite-code redemption, abuse protection, or deletion workflows, but they are explicitly out of scope for the private rebuild.

## Considered options

- **Supabase** — rejected to avoid a migration from the existing Firestore data. The Feeds Collection is already in Firestore.
- **Custom Express/Node API** — rejected as unnecessary overhead for a private family app. Security rules cover the access control requirements for MVP.

## Consequences

Firebase frontend config (API key, project ID, app ID, etc.) is not secret — it is inherently public in any browser-based app and is designed to be safe to expose. The actual security boundary is Firestore security rules and Firebase Auth, not the config values themselves. That said, Firebase config must not be hardcoded into components; it is supplied via Vite environment variables so that the same codebase can be pointed at different Firebase projects (private family project now, separate public project later) by changing environment config only. Do not treat `.env` files as a security measure for Firebase config — treat them as a deployment convenience.
