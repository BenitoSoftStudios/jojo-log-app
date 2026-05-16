<!-- Login screen — email/password auth.
     Phase 2: form scaffold only. Phase 3 wires Firebase Auth. -->
<template>
  <div class="login-page">
    <div class="login-box">
      <h1 class="login-title">Jojo's Log</h1>
      <p class="login-sub">A shared care log for your household.</p>

      <form class="login-form" @submit.prevent="handleSubmit">
        <label class="field-label" for="email">Email</label>
        <input
          id="email"
          v-model="email"
          type="email"
          class="field-input"
          autocomplete="email"
          placeholder="you@example.com"
          required
        />

        <label class="field-label" for="password">Password</label>
        <input
          id="password"
          v-model="password"
          type="password"
          class="field-input"
          autocomplete="current-password"
          placeholder="••••••••"
          required
        />

        <p v-if="error" class="login-error">{{ error }}</p>

        <AppButton type="submit" :full="true" :disabled="loading">
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </AppButton>
      </form>

      <p class="login-note text-soft text-sm">
        No account yet? Ask an Owner to invite you.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '@/ui/AppButton.vue'

const router = useRouter()
const email    = ref('')
const password = ref('')
const loading  = ref(false)
const error    = ref('')

async function handleSubmit() {
  error.value   = ''
  loading.value = true
  try {
    // Phase 3: replace with Firebase Auth signInWithEmailAndPassword
    console.log('[Phase 2 stub] sign in with', email.value)
    await router.push('/')
  } catch (e) {
    error.value = 'Sign-in failed. Check your email and password.'
  } finally {
    loading.value = false
  }
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
  gap: var(--space-4);
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
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
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
