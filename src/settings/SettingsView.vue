<!-- Settings — family timezone (functional) and display unit (placeholder). -->
<template>
  <AppLayout>
    <template #header>
      <router-link class="back-btn" to="/" aria-label="Back">←</router-link>
      <span class="header-title">Settings</span>
    </template>

    <AppCard>
      <h2 class="section-heading">Timezone</h2>
      <p class="text-soft text-sm">
        Controls "today" in the ledger header, stats, and new entry time defaults.
      </p>

      <div class="tz-row">
        <select
          v-if="isOwner"
          v-model="pendingTimezone"
          class="tz-select"
        >
          <option v-for="tz in TIMEZONES" :key="tz.value" :value="tz.value">
            {{ tz.label }}
          </option>
        </select>
        <p v-else class="text-soft text-sm field-readonly">{{ displayTimezone }}</p>
      </div>

      <p v-if="tzError" class="field-error text-sm" role="alert">{{ tzError }}</p>
      <p v-if="tzSuccess" class="field-success text-sm" role="status">Saved.</p>

      <AppButton
        v-if="isOwner"
        class="save-btn"
        :disabled="tzSaving || pendingTimezone === currentTimezone"
        @click="saveTimezone"
      >
        {{ tzSaving ? 'Saving…' : 'Save timezone' }}
      </AppButton>
    </AppCard>

    <AppCard>
      <h2 class="section-heading">Display unit</h2>
      <p class="text-faint text-sm">fl oz display coming later. Amounts are stored in mL.</p>
    </AppCard>
  </AppLayout>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import AppLayout from '@/ui/AppLayout.vue'
import AppCard from '@/ui/AppCard.vue'
import AppButton from '@/ui/AppButton.vue'
import { useFamily } from '@/families/useFamily.js'
import { updateFamily } from '@/families/familyService.js'

const TIMEZONES = [
  { value: 'America/Toronto',     label: 'Eastern — Toronto / New York' },
  { value: 'America/New_York',    label: 'Eastern — New York' },
  { value: 'America/Chicago',     label: 'Central — Chicago' },
  { value: 'America/Denver',      label: 'Mountain — Denver' },
  { value: 'America/Los_Angeles', label: 'Pacific — Los Angeles' },
  { value: 'America/Vancouver',   label: 'Pacific — Vancouver' },
  { value: 'UTC',                 label: 'UTC' },
]

const { familyId, familyTimezone, isOwner, refreshFamily } = useFamily()

const currentTimezone = computed(() => familyTimezone.value)
const displayTimezone = computed(() => {
  const match = TIMEZONES.find(t => t.value === currentTimezone.value)
  return match ? match.label : currentTimezone.value
})

const pendingTimezone = ref(currentTimezone.value)
const tzSaving        = ref(false)
const tzError         = ref('')
const tzSuccess       = ref(false)

watch(currentTimezone, (tz) => { pendingTimezone.value = tz }, { immediate: true })

async function saveTimezone() {
  if (!familyId.value) return
  tzSaving.value  = true
  tzError.value   = ''
  tzSuccess.value = false
  try {
    await updateFamily(familyId.value, { timezone: pendingTimezone.value })
    await refreshFamily()
    tzSuccess.value = true
  } catch (e) {
    console.error('[SettingsView] updateFamily (timezone) failed | code:', e.code, '| message:', e.message, e)
    tzError.value = e?.code === 'permission-denied'
      ? 'Only owners can change the timezone.'
      : 'Save failed. Please try again.'
  } finally {
    tzSaving.value = false
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

.tz-row { margin: var(--space-3) 0; }

.tz-select {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-family: var(--font-family);
  background: var(--color-surface);
  color: var(--color-text);
  box-sizing: border-box;
}

.tz-select:focus {
  outline: none;
  border-color: var(--color-mint);
}

.field-readonly { padding: var(--space-1) 0; }
.field-error    { color: var(--color-error); margin-bottom: var(--space-2); }
.field-success  { color: var(--color-mint);  margin-bottom: var(--space-2); }

.save-btn { margin-top: var(--space-3); }

:deep(.page-container) { display: flex; flex-direction: column; gap: var(--space-4); }
</style>
