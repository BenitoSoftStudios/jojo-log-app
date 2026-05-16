<!-- Setup Profile — Member must set a Display Label before first log.
     Phase 2: form scaffold. Phase 3 wires familyService.addMember / updateMember. -->
<template>
  <AppLayout>
    <template #header>
      <span class="header-title">Set up your profile</span>
    </template>

    <AppCard>
      <p class="setup-desc text-soft text-sm">
        Your display label appears on every entry you log. It helps the household
        know who did what at a glance.
      </p>

      <form class="setup-form" @submit.prevent="handleSubmit">
        <label class="field-label" for="displayLabel">Display label</label>
        <input
          id="displayLabel"
          v-model="displayLabel"
          type="text"
          class="field-input"
          placeholder="e.g. Mum, Dad, Nan, JS"
          maxlength="20"
          required
        />
        <p class="field-hint text-faint text-xs">
          Short name or initials shown on care entries. Required before logging.
        </p>

        <label class="field-label" for="initials">Initials (optional)</label>
        <input
          id="initials"
          v-model="initials"
          type="text"
          class="field-input"
          placeholder="e.g. JS"
          maxlength="4"
        />
        <p class="field-hint text-faint text-xs">
          Used in tight spaces where the full label doesn't fit.
        </p>

        <p v-if="error" class="field-error">{{ error }}</p>

        <AppButton type="submit" :full="true" :disabled="loading || !displayLabel.trim()">
          {{ loading ? 'Saving…' : 'Continue' }}
        </AppButton>
      </form>
    </AppCard>
  </AppLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/ui/AppLayout.vue'
import AppCard from '@/ui/AppCard.vue'
import AppButton from '@/ui/AppButton.vue'

const router = useRouter()
const displayLabel = ref('')
const initials     = ref('')
const loading      = ref(false)
const error        = ref('')

async function handleSubmit() {
  error.value   = ''
  loading.value = true
  try {
    // Phase 3: save displayLabel + initials to members/{uid}
    console.log('[Phase 2 stub] save profile', { displayLabel: displayLabel.value, initials: initials.value })
    await router.push('/')
  } catch (e) {
    error.value = 'Could not save your profile. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.header-title {
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-md);
}

.setup-desc {
  margin-bottom: var(--space-4);
}

.setup-form {
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

.field-hint  { margin-top: calc(-1 * var(--space-2)); }
.field-error { font-size: var(--font-size-sm); color: var(--color-error); }
</style>
