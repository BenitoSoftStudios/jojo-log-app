import { watch }      from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import LoginView             from '@/auth/LoginView.vue'
import SetupProfileView      from '@/auth/SetupProfileView.vue'
import FamilySetupView       from '@/families/FamilySetupView.vue'
import CareLedgerView        from '@/entries/CareLedgerView.vue'
import GraphView             from '@/charts/GraphView.vue'
import RecentlyDeletedView   from '@/entries/RecentlyDeletedView.vue'
import ManageCaregiversView  from '@/families/ManageCaregiversView.vue'
import BabySettingsView      from '@/babies/BabySettingsView.vue'
import SettingsView          from '@/settings/SettingsView.vue'
import HelpView              from '@/help/HelpView.vue'

// Imported directly (not via useAuth()) so the guard can use them outside component setup
import { authReady, currentUser } from '@/auth/useAuth.js'
import { findFamilyIdForUser, getMember } from '@/families/familyService.js'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { requiresAuth: false }
  },
  {
    path: '/setup-profile',
    name: 'setup-profile',
    component: SetupProfileView,
    meta: { requiresAuth: true, isSetupRoute: true }
  },
  {
    path: '/family-setup',
    name: 'family-setup',
    component: FamilySetupView,
    meta: { requiresAuth: true, isSetupRoute: true }
  },
  {
    path: '/',
    name: 'ledger',
    component: CareLedgerView,
    meta: { requiresAuth: true }
  },
  {
    path: '/graphs',
    name: 'graphs',
    component: GraphView,
    meta: { requiresAuth: true }
  },
  {
    path: '/recently-deleted',
    name: 'recently-deleted',
    component: RecentlyDeletedView,
    meta: { requiresAuth: true }
  },
  {
    path: '/manage-caregivers',
    name: 'manage-caregivers',
    component: ManageCaregiversView,
    meta: { requiresAuth: true }
  },
  {
    path: '/baby-settings',
    name: 'baby-settings',
    component: BabySettingsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/help',
    name: 'help',
    component: HelpView,
    meta: { requiresAuth: false }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
  // 1. Wait for Firebase Auth to resolve the initial sign-in state on page load.
  //    Without this, every protected route would bounce to /login on hard refresh.
  if (!authReady.value) {
    await new Promise(resolve => {
      const stop = watch(authReady, ready => {
        if (ready) { stop(); resolve() }
      }, { immediate: true })
    })
  }

  const user = currentUser.value

  // 2. Public routes (requiresAuth: false) — redirect signed-in users away from /login
  if (to.meta.requiresAuth === false) {
    if (user && to.name === 'login') return '/'
    return true
  }

  // 3. All other routes require auth
  if (!user) return '/login'

  // 4. Setup routes (/setup-profile, /family-setup) are open once authenticated
  if (to.meta.isSetupRoute) return true

  // 5. All remaining protected routes require a family + display label.
  //    localStorage is a convenience cache only — Firestore is the source of truth.
  let familyId = localStorage.getItem('jojo_familyId')

  if (familyId) {
    // Fast path: validate the cached id belongs to this user before trusting it.
    try {
      const member = await getMember(familyId, user.uid)
      if (member?.displayLabel) return true
    } catch (e) {
      console.error(
        '[router] getMember failed for cached familyId:', familyId,
        '| code:', e.code, '| message:', e.message, e
      )
    }
    // Cache is stale, wrong user, or lookup failed — discard and fall through to discovery.
    localStorage.removeItem('jojo_familyId')
    familyId = null
  }

  // Discovery: collection group query across all members sub-collections.
  // REQUIRES the Firestore index defined in firestore.indexes.json.
  // If this throws, deploy it with: firebase deploy --only firestore:indexes
  try {
    familyId = await findFamilyIdForUser(user.uid)
    if (familyId) localStorage.setItem('jojo_familyId', familyId)
  } catch (e) {
    console.error(
      '[router] findFamilyIdForUser failed.',
      'If you see a "requires an index" message, deploy with: firebase deploy --only firestore:indexes',
      '| code:', e.code, '| message:', e.message, e
    )
    // familyId stays null — falls through to /setup-profile below.
  }

  if (!familyId) return '/setup-profile'

  try {
    const member = await getMember(familyId, user.uid)
    if (!member?.displayLabel) return '/setup-profile'
  } catch (e) {
    console.error(
      '[router] getMember failed after discovery, familyId:', familyId,
      '| code:', e.code, '| message:', e.message, e
    )
    return '/setup-profile'
  }

  return true
})

export default router
