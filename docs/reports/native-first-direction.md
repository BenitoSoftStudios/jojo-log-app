# Native-First Product Direction

**Recorded:** 2026-05-17
**Status:** Active — supersedes any earlier notes implying PWA-first.

---

## Summary

Jojo's Log is being rebuilt as a native-first mobile app experience. The stack is Vite + Vue 3, wrapped later in Capacitor for iOS and Android distribution. This document captures that decision and rules out alternatives that have come up in planning.

---

## What "Native-First" Means Here

- The UI is designed and tested as a touch-first, mobile-app experience from the start.
- The viewport, tap targets, gestures, and layout all assume a phone screen held in one hand.
- There is no browser chrome dependence. No address bar, no tab bar, no hover state as a primary affordance.
- The app will eventually be distributed as a native binary on iOS and Android via Capacitor.

It does not mean:

- Rewriting in Swift or Kotlin. The codebase stays in Vite/Vue.
- Blocking the current rebuild on native tooling. Capacitor comes after the ledger is stable.
- Avoiding the web entirely. The app runs fine in a mobile browser and in desktop browsers during development.

---

## What Is Not the Strategy

### Not PWA-first

PWA is not the primary product strategy. Reasons:

- PWA install prompts on iOS are unreliable and have historically had limited support.
- The household use case requires a reliable, always-available app icon. Native binaries provide this.
- A PWA service worker adds complexity that is not needed before Cutover.

PWA support (service worker, web manifest) may be added optionally later if there is a clear reason. It is not a Phase 6 through Phase 10 requirement and must not be added during the current rebuild phases.

Do not add:

- `public/manifest.json` or `public/manifest.webmanifest`
- Any `<link rel="manifest">` tag
- A Vite PWA plugin (`vite-plugin-pwa` or similar)
- A service worker (`sw.js`, `service-worker.js`, or Workbox)
- An `offline.html` fallback
- `registerServiceWorker` calls in `src/main.js`

### Not Swift or Kotlin

There is no plan to rewrite in a platform-native language. The Vue codebase is the product. Capacitor is a thin bridge that lets this codebase run as a native app, not a reason to abandon it.

### Not a Desktop App

The app is not designed for desktop. Desktop browsers work and are useful during development, but responsive breakpoints, mouse interactions, and wide-screen layouts are not a priority. The layout is mobile-width and centered.

---

## Capacitor — The Plan

Capacitor wraps the Vite/Vue web app in a native iOS or Android shell. It exposes native APIs (camera, haptics, push notifications) via plugins if needed.

The integration plan is:

1. Build the full ledger UI in Phase 6. Get it stable with real household data.
2. Complete migration (Phase 10) and confirm the Vue app works in daily household use.
3. Add Capacitor after Phase 10, as a separate initiative.
4. Submit to App Store and Play Store when the Capacitor integration is verified.

Do not add Capacitor during Phases 6 through 10. Do not add `@capacitor/core` or any `@capacitor/*` packages. Do not create `capacitor.config.ts` or `ios/` or `android/` directories.

The ADR is at `docs/adr/0007-capacitor-later-not-now.md`.

---

## UI Design Principles (Touch-First)

Because the app targets a phone held in one hand by a tired parent:

- Tap targets are at minimum 44×44 pt. Prefer 48×48 pt for primary actions.
- No action requires hover. Every action has a visible tap target.
- No action requires swipe as the only access method. Swipe may be used as an enhancement, but there must always be a visible alternative.
- Sheets (`AppSheet`) slide up from the bottom — a natural thumb-reach pattern.
- Modals (`AppModal`) are used sparingly, only for confirmations.
- Inline editing is preferred over navigation to a separate edit screen.
- Row heights are generous. Dense data tables are not the pattern.
- CSS variables control colors and spacing so future user-configurable themes are possible without a refactor.

---

## What Does Not Change

- Firebase Auth and Firestore remain the backend.
- The family-scoped data model is unchanged.
- The Vue 3 + Vite stack is unchanged.
- Vitest unit tests for pure logic are unchanged.
- The soft-delete and provenance model is unchanged.
- The phased rollout plan (Phases 6 through 10) is unchanged.

---

## Related Documents

- `docs/adr/0007-capacitor-later-not-now.md` — Capacitor timing rationale
- `docs/adr/0001-vue-vite-rebuild.md` — Why Vue/Vite was chosen
- `docs/reports/phase-6-plan.md` — Phase 6 ledger UI plan (reflects touch-first decisions)
- `docs/architecture-plan.md` — Module and service layer design
