import { createRouter, createWebHistory } from 'vue-router'

import LoginView from '@/auth/LoginView.vue'
import SetupProfileView from '@/auth/SetupProfileView.vue'
import FamilySetupView from '@/families/FamilySetupView.vue'
import CareLedgerView from '@/entries/CareLedgerView.vue'
import GraphView from '@/charts/GraphView.vue'
import RecentlyDeletedView from '@/entries/RecentlyDeletedView.vue'
import ManageCaregiversView from '@/families/ManageCaregiversView.vue'
import BabySettingsView from '@/babies/BabySettingsView.vue'
import SettingsView from '@/settings/SettingsView.vue'
import HelpView from '@/help/HelpView.vue'

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
    meta: { requiresAuth: true }
  },
  {
    path: '/family-setup',
    name: 'family-setup',
    component: FamilySetupView,
    meta: { requiresAuth: true }
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

// Phase 2: auth guard is a stub — Phase 3 wires real Firebase Auth state
router.beforeEach((to) => {
  if (to.meta.requiresAuth === false) return true
  // Phase 3 will replace this with a real auth check
  return true
})

export default router
