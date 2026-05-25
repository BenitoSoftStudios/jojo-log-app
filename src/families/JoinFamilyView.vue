<!-- Invite acceptance flow.
     Route: /join-family?familyId=&inviteId=&code=
     requiresAuth: false — auth is handled inline. Firestore is NOT touched
     until the user is authenticated, to avoid permission-denied errors. -->
<template>
  <div class="join-page">
    <div class="join-box">

      <!-- Loading -->
      <template v-if="step === 'init'">
        <p class="text-soft text-sm">Loading…</p>
      </template>

      <!-- Invalid / expired invite (only shown after auth) -->
      <template v-else-if="step === 'invalid'">
        <h1 class="join-title">Invite problem</h1>
        <p class="join-desc text-soft text-sm">{{ invalidReason }}</p>
        <router-link class="join-link text-sm" to="/">Go to app</router-link>
      </template>

      <!-- Already a member of THIS family -->
      <template v-else-if="step === 'already-joined'">
        <h1 class="join-title">Already joined!</h1>
        <p class="join-desc text-soft text-sm">You're already a member of this family. Redirecting to ledger…</p>
      </template>

      <!-- Member of a DIFFERENT family -->
      <template v-else-if="step === 'existing-member'">
        <h1 class="join-title">Already in a family</h1>
        <p class="join-desc text-soft text-sm">
          Your account is already linked to a different family on Jojo's Log.
          Sign in with a different account to accept this invite.
        </p>
        <router-link class="join-link text-sm" to="/">Go to ledger</router-link>
      </template>

      <!-- Not signed in — show auth form BEFORE any Firestore calls -->
      <template v-else-if="step === 'auth'">
        <h1 class="join-title">Accept family invite</h1>
        <p class="join-desc text-soft text-sm">
          Sign in or create an account to accept this invite and join your family on Jojo's Log.
        </p>

        <div class="mode-toggle">
          <button
            class="mode-btn"
            :class="{ 'mode-btn--active': authMode === 'signin' }"
            @click="authMode = 'signin'"
          >Sign in</button>
          <button
            class="mode-btn"
            :class="{ 'mode-btn--active': authMode === 'signup' }"
            @click="authMode = 'signup'"
          >Create account</button>
        </div>

        <form class="join-form" @submit.prevent="handleAuth">
          <div class="field-group">
            <label class="field-label" for="auth-email">Email</label>
            <input
              id="auth-email"
              ref="emailInput"
              v-model="authEmail"
              type="email"
              class="field-input"
              autocomplete="email"
              placeholder="you@example.com"
              required
            />
          </div>
          <div class="field-group">
            <label class="field-label" for="auth-password">Password</label>
            <input
              id="auth-password"
              ref="passwordInput"
              v-model="authPassword"
              type="password"
              class="field-input"
              :autocomplete="authMode === 'signup' ? 'new-password' : 'current-password'"
              placeholder="••••••••"
              minlength="6"
              required
            />
          </div>
          <p v-if="authError" class="field-error text-sm" role="alert">{{ authError }}</p>
          <AppButton type="submit" :full="true" :disabled="authLoading">
            {{ authLoading ? '…' : authMode === 'signup' ? 'Create account' : 'Sign in' }}
          </AppButton>
        </form>
      </template>

      <!-- Validating invite after auth -->
      <template v-else-if="step === 'validating'">
        <p class="text-soft text-sm">Validating invite…</p>
      </template>

      <!-- Display label form -->
      <template v-else-if="step === 'form'">
        <h1 class="join-title">Join {{ familyName || 'family' }}</h1>
        <p class="join-desc text-soft text-sm">
          Invited by {{ invite?.createdByLabel }}. Choose a display label before joining.
        </p>

        <form class="join-form" @submit.prevent="handleJoin">
          <div class="field-group">
            <label class="field-label" for="display-label">Display label</label>
            <input
              id="display-label"
              v-model="displayLabel"
              type="text"
              class="field-input"
              placeholder="e.g. Mum, Dad, Nan, JS"
              maxlength="20"
              required
              autofocus
            />
            <p class="field-hint text-faint text-xs">Short name shown on every care entry you log.</p>
          </div>
          <div class="field-group">
            <label class="field-label" for="initials">Initials (optional)</label>
            <input
              id="initials"
              v-model="initials"
              type="text"
              class="field-input"
              placeholder="e.g. JS"
              maxlength="4"
            />
          </div>
          <p v-if="joinError" class="field-error text-sm" role="alert">{{ joinError }}</p>
          <AppButton type="submit" :full="true" :disabled="joining || !displayLabel.trim()">
            {{ joining ? 'Joining…' : 'Join family' }}
          </AppButton>
        </form>
      </template>

      <!-- Done -->
      <template v-else-if="step === 'done'">
        <p class="text-soft text-sm">Joined! Redirecting…</p>
      </template>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/ui/AppButton.vue'
import { useAuth } from '@/auth/useAuth.js'
import { useFamily } from '@/families/useFamily.js'
import {
  getInvite,
  getFamily,
  addMember,
  acceptInvite,
  findFamilyIdForUser,
} from '@/families/familyService.js'

const route  = useRoute()
const router = useRouter()
const { currentUser, authReady, signIn, signUp } = useAuth()
const { loadFamily } = useFamily()

const qFamilyId = route.query.familyId
const qInviteId = route.query.inviteId
const qCode     = route.query.code

// step: 'init' | 'auth' | 'validating' | 'invalid' | 'already-joined' |
//       'existing-member' | 'form' | 'done'
const step          = ref('init')
const invite        = ref(null)
const familyName    = ref('')
const invalidReason = ref('')

const authMode      = ref('signin')
const authEmail     = ref('')
const authPassword  = ref('')
const authLoading   = ref(false)
const authError     = ref('')
const emailInput    = ref(null)
const passwordInput = ref(null)

const displayLabel = ref('')
const initials     = ref('')
const joining      = ref(false)
const joinError    = ref('')

onMounted(async () => {
  if (!authReady.value) {
    await new Promise(resolve => {
      const stop = watch(authReady, ready => {
        if (ready) { stop(); resolve() }
      }, { immediate: true })
    })
  }

  // Validate URL params first — no Firestore calls yet.
  if (!qFamilyId || !qInviteId || !qCode) {
    invalidReason.value = 'This invite link is missing required information.'
    step.value = 'invalid'
    return
  }

  // Gate Firestore on auth. Unauthenticated reads would fail with
  // permission-denied and produce a misleading "Invite invalid" message.
  if (!currentUser.value) {
    step.value = 'auth'
    return
  }

  await validateAndAdvance()
})

// Fetches and validates the invite from Firestore, then checks family
// membership. Must only be called after the user is signed in.
async function validateAndAdvance() {
  step.value = 'validating'

  // Fetch invite; surface permission-denied distinctly.
  let inv = null
  try {
    inv = await getInvite(qFamilyId, qInviteId)
  } catch (e) {
    if (e?.code === 'permission-denied') {
      invalidReason.value = 'Could not verify invite permissions. Make sure you are signed in to the right account.'
    } else {
      invalidReason.value = 'Could not load invite. Check your connection and try again.'
    }
    step.value = 'invalid'
    return
  }

  // Fetch family name opportunistically (non-blocking on failure).
  try {
    const fam = await getFamily(qFamilyId)
    familyName.value = fam?.name ?? ''
  } catch {
    familyName.value = ''
  }

  invite.value = inv

  if (!inv || inv.code !== qCode) {
    invalidReason.value = 'This invite link is not valid.'
    step.value = 'invalid'
    return
  }
  if (inv.status === 'accepted') {
    invalidReason.value = 'This invite has already been accepted.'
    step.value = 'invalid'
    return
  }
  if (inv.status === 'revoked') {
    invalidReason.value = 'This invite has been revoked by the owner.'
    step.value = 'invalid'
    return
  }
  if (inv.status !== 'active') {
    invalidReason.value = 'This invite is no longer active.'
    step.value = 'invalid'
    return
  }

  // Check existing family membership.
  let existingFamilyId = null
  try {
    existingFamilyId = await findFamilyIdForUser(currentUser.value.uid)
  } catch {
    // If lookup fails, proceed — worst case handleJoin will surface the error.
  }

  if (existingFamilyId === qFamilyId) {
    // Already a member of this exact family — redirect to ledger.
    step.value = 'already-joined'
    setTimeout(() => router.push('/'), 1500)
    return
  }
  if (existingFamilyId) {
    // Member of a different family — blocked.
    step.value = 'existing-member'
    return
  }

  step.value = 'form'
}

async function handleAuth() {
  authError.value = ''
  authLoading.value = true
  const emailVal = (emailInput.value?.value ?? authEmail.value).trim()
  const passVal  = passwordInput.value?.value ?? authPassword.value
  try {
    if (authMode.value === 'signup') {
      await signUp(emailVal, passVal)
    } else {
      await signIn(emailVal, passVal)
    }
    // Invite params are preserved in the URL — validate now that we're authed.
    await validateAndAdvance()
  } catch (e) {
    authError.value = friendlyAuthError(e.code)
  } finally {
    authLoading.value = false
  }
}

async function handleJoin() {
  joinError.value = ''
  joining.value = true
  try {
    const uid   = currentUser.value.uid
    const email = currentUser.value.email ?? ''
    await addMember(qFamilyId, {
      userId: uid,
      email,
      role: invite.value.role ?? 'caregiver',
      displayLabel: displayLabel.value.trim(),
      initials: initials.value.trim(),
      joinedViaInviteId: qInviteId,
      joinedViaInviteCode: qCode,
    })
    await acceptInvite(qFamilyId, qInviteId, {
      acceptedByUserId: uid,
      acceptedByLabel: displayLabel.value.trim(),
    })
    localStorage.setItem('jojo_familyId', qFamilyId)
    await loadFamily(uid)
    step.value = 'done'
    router.push('/')
  } catch (e) {
    console.error('[JoinFamilyView] join failed | code:', e.code, '| message:', e.message, e)
    joinError.value = 'Failed to join family. Please try again.'
    joining.value = false
  }
}

function friendlyAuthError(code) {
  const map = {
    'auth/invalid-email':          'Please enter a valid email address.',
    'auth/user-not-found':         'No account found with that email.',
    'auth/wrong-password':         'Incorrect password.',
    'auth/invalid-credential':     'Incorrect email or password.',
    'auth/email-already-in-use':   'An account with that email already exists.',
    'auth/weak-password':          'Password must be at least 6 characters.',
    'auth/too-many-requests':      'Too many attempts. Please wait and try again.',
    'auth/network-request-failed': 'Network error. Check your connection and try again.',
  }
  return map[code] ?? 'Something went wrong. Please try again.'
}
</script>

<style scoped>
.join-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  background: var(--color-bg);
}

.join-box {
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.join-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  text-align: center;
}

.join-desc {
  text-align: center;
}

.join-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.join-link {
  display: block;
  text-align: center;
  color: var(--color-mint);
  text-decoration: none;
}

.mode-toggle {
  display: flex;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.mode-btn {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-soft);
  transition: all var(--duration-fast) var(--ease-out);
}

.mode-btn--active {
  background: var(--color-mint);
  color: #ffffff;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.field-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-soft);
}

.field-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-family: var(--font-family);
  background: var(--color-surface);
  color: var(--color-text);
  transition: border-color var(--duration-fast) var(--ease-out);
}

.field-input:focus {
  outline: none;
  border-color: var(--color-mint);
}

.field-hint  { margin-top: 0; }
.field-error { color: var(--color-error); }
</style>
