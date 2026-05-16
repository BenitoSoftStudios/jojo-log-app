<!-- Family Setup — first-run: create Family document + first Baby.
     Phase 2: form scaffold. Phase 3 wires familyService.createFamily + babyService.createBaby. -->
<template>
  <AppLayout>
    <template #header>
      <span class="header-title">Set up your family</span>
    </template>

    <div class="setup-stack">
      <AppCard>
        <h2 class="section-heading">Family</h2>
        <div class="form-group">
          <label class="field-label" for="familyName">Family name</label>
          <input
            id="familyName"
            v-model="familyName"
            type="text"
            class="field-input"
            placeholder="e.g. The Smiths"
            maxlength="60"
          />
        </div>
      </AppCard>

      <AppCard>
        <h2 class="section-heading">Baby</h2>
        <div class="form-group">
          <label class="field-label" for="babyNickname">Baby nickname</label>
          <input
            id="babyNickname"
            v-model="babyNickname"
            type="text"
            class="field-input"
            placeholder="e.g. Jojo"
            maxlength="40"
            required
          />
          <p class="field-hint text-faint text-xs">No full legal name needed.</p>
        </div>

        <div class="form-group">
          <label class="field-label" for="birthdate">Birthdate (optional)</label>
          <input
            id="birthdate"
            v-model="birthdate"
            type="date"
            class="field-input"
          />
          <p class="field-hint text-faint text-xs">Used to show baby's age in weeks. Not required.</p>
        </div>
      </AppCard>

      <p v-if="error" class="field-error">{{ error }}</p>

      <AppButton :full="true" :disabled="loading || !babyNickname.trim()" @click="handleSubmit">
        {{ loading ? 'Creating…' : 'Create family' }}
      </AppButton>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/ui/AppLayout.vue'
import AppCard from '@/ui/AppCard.vue'
import AppButton from '@/ui/AppButton.vue'

const router      = useRouter()
const familyName  = ref('')
const babyNickname = ref('')
const birthdate   = ref('')
const loading     = ref(false)
const error       = ref('')

async function handleSubmit() {
  error.value   = ''
  loading.value = true
  try {
    // Phase 3: familyService.createFamily + babyService.createBaby
    console.log('[Phase 2 stub] create family', { familyName: familyName.value, babyNickname: babyNickname.value, birthdate: birthdate.value })
    await router.push('/')
  } catch (e) {
    error.value = 'Could not create family. Please try again.'
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

.setup-stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.section-heading {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-3);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}
.form-group:last-child { margin-bottom: 0; }

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
}

.field-input:focus {
  outline: none;
  border-color: var(--color-mint);
}

.field-hint  { margin-top: 0; }
.field-error { font-size: var(--font-size-sm); color: var(--color-error); }
</style>
