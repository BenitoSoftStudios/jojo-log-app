<!-- Join Family — entered by a new caregiver after signing in.
     They enter an invite code, which adds them to the family as a Caregiver. -->
<template>
  <div class="setup-page">
    <div class="setup-box">
      <h1 class="setup-title">Join a family</h1>
      <p class="setup-desc text-soft text-sm">
        Enter the invite code from the family owner, then set your display label.
      </p>

      <form class="setup-form" @submit.prevent="handleSubmit">
        <div class="field-group">
          <label class="field-label" for="inviteCode">Invite code</label>
          <input
            id="inviteCode"
            v-model="inviteCode"
            type="text"
            class="field-input field-input--code"
            placeholder="e.g. ABC123"
            maxlength="6"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="characters"
            spellcheck="false"
            required
          />
        </div>

        <div class="field-group">
          <label class="field-label" for="displayLabel">Your display label</label>
          <input
            id="displayLabel"
            v-model="displayLabel"
            type="text"
            class="field-input"
            placeholder="e.g. Mum, Dad, Nan, JS"
            maxlength="20"
            required
          />
          <p class="field-hint text-faint text-xs">Shown on every entry you log.</p>
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

        <p v-if="error" class="field-error" role="alert">{{ error }}</p>

        <AppButton
          type="submit"
          :full="true"
          :disabled="loading || !inviteCode.trim() || !displayLabel.trim()"
        >
          {{ loading ? 'Joining…' : 'Join family' }}
        </AppButton>
      </form>

      <p class="alt-action text-soft text-sm">
        No invite code?
        <router-link to="/family-setup">Create a new family instead.</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '@/ui/AppButton.vue'
import { useAuth } from '@/auth/useAuth.js'
import { useFamily } from '@/families/useFamily.js'
import { useBabies } from '@/babies/useBabies.js'
import { redeemInviteCode } from '@/families/inviteService.js'

const router = useRouter()
const { currentUser }          = useAuth()
const { familyId, loadFamily } = useFamily()
const { loadBabies }           = useBabies()

const inviteCode   = ref('')
const displayLabel = ref('')
const initials     = ref('')
const loading      = ref(false)
const error        = ref('')

onMounted(async () => {
  if (!familyId.value && currentUser.value) {
    await loadFamily(currentUser.value.uid)
  }
  if (familyId.value) {
    router.replace('/')
  }
})

async function handleSubmit() {
  error.value   = ''
  loading.value = true
  const user    = currentUser.value
  if (!user) { error.value = 'Not signed in.'; loading.value = false; return }

  try {
    const fId = await redeemInviteCode(
      inviteCode.value,
      user,
      displayLabel.value.trim(),
      initials.value.trim()
    )

    localStorage.setItem('jojo_familyId', fId)
    await loadFamily(user.uid)
    await loadBabies(fId)
    await router.push('/')
  } catch (e) {
    console.error('[JoinFamilyView] redeemInviteCode failed', e)
    error.value = e.message?.includes('Invalid') ? e.message : 'Could not join. Check the code and try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.setup-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  background: var(--color-bg);
}

.setup-box {
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.setup-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  text-align: center;
}

.setup-desc { text-align: center; }

.setup-form {
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

.field-input--code {
  text-transform: uppercase;
  letter-spacing: 0.15em;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.field-input:focus {
  outline: none;
  border-color: var(--color-mint);
}

.field-hint  { margin-top: 0; }
.field-error { font-size: var(--font-size-sm); color: var(--color-error); }

.alt-action {
  text-align: center;
}
.alt-action a { color: var(--color-mint); }
</style>
