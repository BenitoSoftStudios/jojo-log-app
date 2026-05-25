# Phase 7D-1 — Invite Deep Link Fix (Vercel 404)

**Date:** 2026-05-25
**Status:** Complete and committed.

## Root cause

Vue Router is configured with `createWebHistory()` (HTML5 push-state mode). In this mode, every route is a real URL path (e.g. `/join-family`). On a dev server, Vite handles the fallback automatically. On Vercel's CDN, a direct request to `/join-family?familyId=...` is treated as a file request — no file exists at that path, so Vercel returns 404: NOT_FOUND.

`vercel.json` did not exist, so no SPA fallback was configured.

## Fix

Added `vercel.json` at the repo root with a catch-all rewrite:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Vercel evaluates static assets (files in `dist/assets/`, `dist/favicon.ico`, etc.) before rewrite rules, so build artifacts continue to be served correctly. Any path that doesn't match a real file is rewritten to `index.html`, allowing Vue Router to take over client-side.

## Changed files

- `vercel.json` (new, 5 lines)

## Safety confirmations

- No invite data modified
- No Firestore rules/indexes changed
- No feeds path referenced
- No deleteDoc
- No PWA/Capacitor/SW/manifest
- No route paths changed
- No invite logic changed

## Results

- Tests: 233 / 233 passing
- Build: clean (pre-existing chunk-size warning only)
- Commit: `b05b791`
- main synced with origin/main: yes
- Vercel redeploy expected: yes (triggers on push to main)
