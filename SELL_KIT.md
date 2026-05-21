# Jojo's Log — Business Transfer Kit

This document covers everything a new owner needs to take over, run, and grow
Jojo's Log.

---

## What you are buying

**Jojo's Log** is a complete, production-ready Vue 3 web app for baby care
logging. It targets new parents who want a shared, private care ledger that
every household caregiver can see in real time.

**Category**: Parenting / Productivity SaaS  
**Tech stack**: Vue 3 + Vite + Firebase Auth + Firestore + Vercel  
**Monetization model**: Free with optional Ko-fi donations (zero infrastructure
cost to collect; swap Ko-fi username in one env variable)  
**Hosting cost**: Near-zero on Firebase Spark plan + Vercel free tier for low
traffic; Firebase Blaze pay-as-you-go for scale  
**Code quality**: Fully separated concerns — UI, Firestore services, stats,
migration, and export are independent modules with 125 passing unit tests  

---

## Revenue model

Current: optional Ko-fi tip link. Set `VITE_KOFI_URL` in your Vercel env to
activate.

Simple paths to increase revenue:
1. **Stripe one-time purchase** — charge $4.99 for a Pro badge (cosmetic) or
   unlock extra baby slots. Stripe integration takes ~1 day.
2. **App Store** — wrap with Capacitor (already compatible), submit as iOS/Android
   app. $99/year Apple fee, $25 one-time Google fee. Charge $3.99 one-time.
3. **Yearly subscription** — $15–20/year for family plan. Add Firebase custom
   claims + Stripe Billing.

---

## Asset inventory

| Asset | Location | Notes |
|---|---|---|
| Full Vue source code | this repo | MIT-licensable, no third-party lock-in |
| Domain (none yet) | — | Buyer registers; e.g. jojoslog.app |
| Firebase project | buyer creates new one | Takes 10 min, free |
| Vercel project | buyer creates new one | Free tier covers most traffic |
| Ko-fi page | ko-fi.com | Create free, paste URL in env var |
| Firestore data | buyer's Firebase project | No user data transfers — buyers start fresh |

---

## Stack overview

```
src/
  app/           Vue app shell, router, Firebase init
  auth/          Email/password sign-in, display label setup
  families/      Family CRUD, member management, invite codes
  babies/        Baby profile CRUD, baby switcher
  entries/       Care ledger — entries, grouping, stats, detail sheet
  charts/        SVG bar charts (daily + monthly volume)
  export/        CSV export service
  migration/     Legacy feed normalizer (for private Jojo data only)
  settings/      Unit preference (mL / fl oz) persisted to Firestore
  support/       Donation / Ko-fi page
  landing/       Public marketing landing page
  help/          Legend and help text
  ui/            AppButton, AppCard, AppModal, AppSheet, AppLayout, SyncStatus
  utils/         dateUtils, entryUtils, ledgerGrouper, statsCalculator,
                 unitConverter, weekUtils
  styles/        Design tokens (CSS custom properties)
```

---

## Deployment (new owner checklist)

### 1. Firebase project

1. Go to console.firebase.google.com → New project
2. Enable Firebase Authentication → Email/Password
3. Enable Firestore → Start in production mode
4. Copy project config from Project Settings → Web app
5. Deploy Firestore indexes: `firebase deploy --only firestore:indexes`
6. (Later) Secure Firestore rules (see `docs/firebase-private-test-rules.md`)

### 2. Vercel

1. Fork or clone this repo to your GitHub account
2. Import into Vercel (vercel.com → New Project)
3. Set environment variables in Vercel dashboard:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_KOFI_URL    (optional — your ko-fi.com/yourname URL)
```

4. Deploy. The `vite build` command produces a static site — Vercel auto-detects it.

### 3. Ko-fi donation link

1. Create free account at ko-fi.com
2. Set your Ko-fi page URL as `VITE_KOFI_URL` in Vercel env vars
3. Redeploy

Total setup time: ~30 minutes for a complete new deployment.

---

## Running locally

```bash
git clone <repo>
cd jojo-log-app
npm install
cp .env.example .env.local   # fill in Firebase config
npm run dev                  # http://localhost:5173
npm test                     # 125 unit tests
npm run build                # production build
```

---

## Codebase health

- **125 unit tests** covering entry utils, ledger grouping, stats calculation,
  week utils, and legacy feed normalizer
- No external UI library — all components are custom, lightweight, and
  maintainable
- No backend server — Firebase handles auth, database, and real-time sync
- One env file controls the entire Firebase deployment target
- Clean module boundaries: UI components contain no Firestore logic

---

## What is NOT included

- Jojo family personal data (the original private Firebase project is separate)
- Apple Developer Program membership
- Google Play account
- Domain name
- Ko-fi account

---

## Growth opportunities

- **iOS / Android** via Capacitor (codebase is already structured for it)
- **Nurse / NICU mode** — track vitals, feedings, and medication for hospital stays
- **Multi-baby families** — already supported in the data model
- **Sleep tracking** — minimal addition to the existing entry model
- **Doctor export** — PDF summary of the last 30 days
- **Localization** — date formatting and unit handling are already centralized

---

## Support after sale

Seller can offer:
- 30-day email Q&A (arrange directly)
- Paid consulting for new features

---

## Valuation factors

The app generates value through:
- A complete, working codebase with no major stubs remaining
- Zero ongoing server cost for small user bases
- Clear, documented architecture that a mid-level developer can maintain
- A privacy-first positioning that parents trust
- An audience (new parents) with high product loyalty and word-of-mouth potential

Comparable micro-SaaS sales in the parenting niche: $5,000–$50,000 depending
on monthly revenue and user count at time of sale. A version with even
50 paying users at $3/month ($150 MRR) typically sells for 24–36x MRR
($3,600–$5,400) on Acquire.com or Flippa.
