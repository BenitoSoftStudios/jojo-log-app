<!-- Set Display Label and initials.
     Two paths:
     1. New user with no family → stores pending label, redirects to /family-setup.
     2. Existing member with no label → updates member doc directly, redirects to /.
     Either way, a display label is required before the user can reach the Care Ledger. -->
<template>
  <div class="setup-page">
    <div class="setup-box">
      <h1 class="setup-title">Your display label</h1>
      <p class="setup-desc text-soft text-sm">
        Your display label appears on every entry you log. It helps the household
        know who did what at a glance. Required before you can start logging.
      </p>

      <form class="setup-form" @submit.prevent="handleSubmit">
        <div class="field-group">
          <label class="field-label" for="displayLabel">Display label</label>
          <input
            id="displayLabel"
            v-model="displayLabel"
            type="text"
            class="field-input"
            placeholder="e.g. Mum, Dad, Nan, JS"
            maxlength="20"
            required
            autofocus
          />
          <p class="field-hint text-faint text-xs">Short name or initials shown on care entries.</p>
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
          <p class="field-hint text-faint text-xs">Used in tight spaces where the full label doesn't fit.</p>
        </div>

        <p v-if="error" class="field-error" role="alert">{{ error }}</p>

        <AppButton type="submit" :full="true" :disabled="loading || !displayLabel.trim()">
          {{ loading ? 'Saving…' : 'Continue' }}
        </AppButton>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '@/ui/AppButton.vue'
import { useAuth } from '@/auth/useAuth.js'
import { useFamily } from '@/families/useFamily.js'
import { updateMember } from '@/families/familyService.js'
import { pendingLabel, pendingInitials } from '@/auth/pendingSetup.js'

const router = useRouter()
const { currentUser } = useAuth()
const { familyId, hasDisplayLabel, loadFamily } = useFamily()

const displayLabel = ref('')
const initials     = ref('')
const loading      = ref(false)
const error        = ref('')

onMounted(async () => {
  // If family context not yet loaded, try to load it
  if (!familyId.value && currentUser.value) {
    await loadFamily(currentUser.value.uid)
  }
  // If user already has a display label, they shouldn't be here
  if (hasDisplayLabel.value) {
    router.replace('/')
  }
})

async function handleSubmit() {
  error.value   = ''
  loading.value = true
  const label = displayLabel.value.trim()
  const inits = initials.value.trim()

  try {
    if (familyId.value && currentUser.value) {
      // Existing family member (future Phase 8 caregiver path, or re-entry)
      await updateMember(familyId.value, currentUser.value.uid, {
        displayLabel: label,
        initials: inits
      })
      await router.push('/')
    } else {
      // New user — store pending values and proceed to family setup
      pendingLabel.value    = label
      pendingInitials.value = inits
      await router.push('/family-setup')
    }
  } catch (e) {
    error.value = 'Could not save your display label. Please try again.'
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

.setup-desc {
  text-align: center;
}

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

.field-input:focus {
  outline: none;
  border-color: var(--color-mint);
}

.field-hint  { margin-top: 0; }
.field-error { font-size: var(--font-size-sm); color: var(--color-error); }
</style>
