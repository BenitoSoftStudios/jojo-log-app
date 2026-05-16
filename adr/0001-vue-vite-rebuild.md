# Rebuild the app in Vue/Vite rather than extending the HTML app

The current app is a single `index.html` file with embedded CSS and JS. It works well as a private family tool but cannot support Firebase Auth, a family/member model, role-based access, or a public release without a complete rewrite. We chose Vue/Vite as the rebuild target because it gives a clear component model, a scalable module structure, and a direct path to wrapping with Capacitor later if native distribution becomes worth it — without picking a heavier framework like React or Next that would add unnecessary complexity for this use case. This is a full rebuild, not a patch; the HTML app remains the reference implementation for behaviour, not the foundation.

## Considered options

- **Extend the HTML app** — rejected because the single-file structure has no seam for Auth, routing, or component reuse; every addition becomes spaghetti.
- **React/Next.js** — rejected as overkill for a logged-in family app with no SSR or SEO requirements. Vue's single-file component model is a better fit for a small, focused team.
- **SvelteKit** — was considered briefly but Vue has stronger Firebase ecosystem examples and the author is more familiar with it.

## Consequences

The HTML app must remain live and untouched until the Vue version passes feature parity. The HTML app is the product reference, not the codebase reference.
