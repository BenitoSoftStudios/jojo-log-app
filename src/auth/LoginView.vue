<!-- Sign in or sign up with email/password.
     After success the router guard drives the user to the correct next screen. -->
<template>
  <div class="login-page">
    <div class="login-box">
      <h1 class="login-title">Jojo's Log</h1>
      <p class="login-sub">A shared care log for your household.</p>

      <div class="mode-toggle">
        <button
          class="mode-btn"
          :class="{ 'mode-btn--active': mode === 'signin' }"
          @click="mode = 'signin'"
        >Sign in</button>
        <button
          class="mode-btn"
          :class="{ 'mode-btn--active': mode === 'signup' }"
          @click="mode = 'signup'"
        >Create account</button>
      </div>

      <form class="login-form" @submit.prevent="handleSubmit">
        <div class="field-group">
          <label class="field-label" for="email">Email</label>
          <input
            id="email"
            ref="emailInput"
            v-model="email"
            type="email"
            class="field-input"
            autocomplete="email"
            placeholder="you@example.com"
            required
          />
        </div>

        <div class="field-group">
          <label class="field-label" for="password">Password</label>
          <input
            id="password"
            ref="passwordInput"
            v-model="password"
            type="password"
            class="field-input"
            :autocomplete="mode === 'signup' ? 'new-password' : 'current-password'"
            placeholder="••••••••"
            minlength="6"
            required
          />
        </div>

        <p v-if="error" class="login-error" role="alert">{{ error }}</p>

        <AppButton type="submit" :full="true" :disabled="loading">
          {{ loading ? '…' : mode === 'signup' ? 'Create account' : 'Sign in' }}
        </AppButton>
      </form>

      <p v-if="mode === 'signup'" class="login-note text-soft text-sm">
        After creating your account you'll set up your display label and family profile.
      </p>
      <p v-else class="login-note text-soft text-sm">
        Need to join an existing family? Ask an Owner to invite you.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '@/ui/AppButton.vue'
import { useAuth } from '@/auth/useAuth.js'

const router = useRouter()
const { signIn, signUp } = useAuth()

const mode          = ref('signin')
const email         = ref('')
const password      = ref('')
const emailInput    = ref(null)
const passwordInput = ref(null)
const loading       = ref(false)
const error         = ref('')

async function handleSubmit() {
  error.value   = ''
  loading.value = true
  // Mobile autofill sets DOM value without triggering v-model; read DOM as source of truth.
  const emailVal = (emailInput.value?.value ?? email.value).trim()
  const passVal  = passwordInput.value?.value ?? password.value
  try {
    if (mode.value === 'signup') {
      await signUp(emailVal, passVal)
    } else {
      await signIn(emailVal, passVal)
    }
    // Router guard handles all subsequent redirects (setup-profile, family-setup, or ledger)
    await router.push('/')
  } catch (e) {
    console.error('[LoginView] auth error | code:', e.code, '| message:', e.message, e)
    error.value = friendlyError(e.code)
  } finally {
    loading.value = false
  }
}

function friendlyError(code) {
  const map = {
    'auth/invalid-email':            'Please enter a valid email address.',
    'auth/user-not-found':           'No account found with that email.',
    'auth/wrong-password':           'Incorrect password.',
    'auth/invalid-credential':       'Incorrect email or password.',
    'auth/email-already-in-use':     'An account with that email already exists.',
    'auth/weak-password':            'Password must be at least 6 characters.',
    'auth/too-many-requests':        'Too many attempts. Please wait and try again.',
    'auth/network-request-failed':   'Network error. Check your connection and try again.'
  }
  return map[code] ?? 'Something went wrong. Please try again.'
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  background: var(--color-bg);
}

.login-box {
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.login-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  text-align: center;
}

.login-sub {
  text-align: center;
  color: var(--color-text-soft);
  font-size: var(--font-size-sm);
  margin-top: calc(-1 * var(--space-3));
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

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
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

.login-error {
  font-size: var(--font-size-sm);
  color: var(--color-error);
}

.login-note {
  text-align: center;
}
</style>
