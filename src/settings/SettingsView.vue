<!-- Settings — display unit wired to Firestore via familyService.updateFamily. -->
<template>
  <AppLayout>
    <template #header>
      <router-link class="back-btn" to="/" aria-label="Back">←</router-link>
      <span class="header-title">Settings</span>
    </template>

    <AppCard>
      <h2 class="section-heading">Display unit</h2>
      <div class="unit-options">
        <label class="radio-option" :class="{ active: localUnit === 'ml' }">
          <input v-model="localUnit" type="radio" value="ml" @change="saveUnit" />
          mL
        </label>
        <label class="radio-option" :class="{ active: localUnit === 'floz' }">
          <input v-model="localUnit" type="radio" value="floz" @change="saveUnit" />
          fl oz
        </label>
      </div>
      <p v-if="saveError" class="field-error text-sm" role="alert">{{ saveError }}</p>
      <p v-if="saveSuccess" class="field-success text-sm">Saved.</p>
      <p class="text-faint text-xs">
        Amounts are always stored in mL. This changes how they are displayed and entered.
      </p>
    </AppCard>

    <AppCard>
      <h2 class="section-heading">Timezone</h2>
      <p class="text-soft text-sm">Eastern Time (America/Toronto)</p>
      <p class="text-faint text-xs">
        Timezone is set at account creation and cannot be changed here yet.
      </p>
    </AppCard>
  </AppLayout>
</template>

<script setup>
import { ref, watch } from 'vue'
import AppLayout from '@/ui/AppLayout.vue'
import AppCard   from '@/ui/AppCard.vue'
import { family, useFamily } from '@/families/useFamily.js'
import { updateFamily } from '@/families/familyService.js'

const { familyId } = useFamily()

const localUnit   = ref(family.value?.unitPreference ?? 'ml')
const saveError   = ref('')
const saveSuccess = ref(false)

watch(family, (f) => {
  if (f?.unitPreference) localUnit.value = f.unitPreference
}, { immediate: true })

async function saveUnit() {
  saveError.value   = ''
  saveSuccess.value = false
  if (!familyId.value) return

  try {
    await updateFamily(familyId.value, { unitPreference: localUnit.value })
    saveSuccess.value = true
    setTimeout(() => { saveSuccess.value = false }, 2000)
  } catch (e) {
    console.error('[SettingsView] updateFamily failed', e)
    saveError.value = 'Could not save. Check your connection.'
  }
}
</script>

<style scoped>
.back-btn {
  color: var(--color-text-soft);
  text-decoration: none;
  font-size: var(--font-size-lg);
  line-height: 1;
  flex-shrink: 0;
}

.header-title {
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-md);
}

.section-heading {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-3);
}

.unit-options {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.radio-option {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-full);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  transition: all var(--duration-fast) var(--ease-out);
}

.radio-option input { display: none; }

.radio-option.active {
  border-color: var(--color-mint);
  background: var(--color-mint-soft);
  color: var(--color-success);
}

.field-error   { color: var(--color-error); margin-bottom: var(--space-2); }
.field-success { color: var(--color-success); margin-bottom: var(--space-2); }

:deep(.page-container) { display: flex; flex-direction: column; gap: var(--space-4); }
</style>
