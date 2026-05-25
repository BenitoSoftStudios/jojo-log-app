<!-- Invite acceptance flow.
     Route: /join-family?familyId=&inviteId=&code=
     requiresAuth: false — auth is handled inside this component. -->
<template>
  <div class="join-page">
    <div class="join-box">

      <!-- Loading / validating -->
      <template v-if="step === 'init'">
        <p class="text-soft text-sm">Validating invite…</p>
      </template>

      <!-- Invalid invite -->
      <template v-else-if="step === 'invalid'">
        <h1 class="join-title">Invite invalid</h1>
        <p class="join-desc text-soft text-sm">{{ invalidReason }}</p>
        <router-link class="join-link text-sm" to="/login">Go to sign in</router-link>
      </template>

      <!-- Already a member of a family -->
      <template v-else-if="step === 'existing-member'">
        <h1 class="join-title">Already in a family</h1>
        <p class="join-desc text-soft text-sm">
          Your account is already linked to a family on Jojo's Log.
          Sign in to a different account to accept this invite.
        </p>
        <router-link class="join-link text-sm" to="/">Go to ledger</router-link>
      </template>

      <!-- Sign in / create account inline -->
      <template v-else-if="step === 'auth'">
        <h1 class="join-title">Join {{ familyName || 'family' }}</h1>
        <p class="join-desc text-soft text-sm">
          You've been invited to join as a caregiver.
          Sign in or create an account to continue.
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

      <!-- Joining in progress (non-form state) -->
      <template v-else-if="step === 'joining'">
        <p class="text-soft text-sm">Joining…</p>
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

const step          = ref('init')
const invite        = ref(null)
const familyName    = ref('')
const invalidReason = ref('')

const authMode     = ref('signin')
const authEmail    = ref('')
const authPassword = ref('')
const authLoading  = ref(false)
const authError    = ref('')
const emailInput   = ref(null)
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

  if (!qFamilyId || !qInviteId || !qCode) {
    invalidReason.value = 'This invite link is incomplete or invalid.'
    step.value = 'invalid'
    return
  }

  try {
    const [inv, fam] = await Promise.allSettled([
      getInvite(qFamilyId, qInviteId),
      getFamily(qFamilyId),
    ])
    invite.value = inv.status === 'fulfilled' ? inv.value : null
    familyName.value = fam.status === 'fulfilled' ? (fam.value?.name ?? '') : ''
  } catch {
    invalidReason.value = 'Could not load invite.'
    step.value = 'invalid'
    return
  }

  if (!invite.value || invite.value.code !== qCode) {
    invalidReason.value = 'This invite link is not valid.'
    step.value = 'invalid'
    return
  }
  if (invite.value.status === 'accepted') {
    invalidReason.value = 'This invite has already been accepted.'
    step.value = 'invalid'
    return
  }
  if (invite.value.status === 'revoked') {
    invalidReason.value = 'This invite has been revoked by the owner.'
    step.value = 'invalid'
    return
  }
  if (invite.value.status !== 'active') {
    invalidReason.value = 'This invite is no longer active.'
    step.value = 'invalid'
    return
  }

  await advanceFromAuth()
})

async function advanceFromAuth() {
  if (!currentUser.value) {
    step.value = 'auth'
    return
  }
  let existingFamilyId = null
  try {
    existingFamilyId = await findFamilyIdForUser(currentUser.value.uid)
  } catch {
    // If lookup fails, assume no family and proceed — worst case the join will fail
  }
  if (existingFamilyId) {
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
    await advanceFromAuth()
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
