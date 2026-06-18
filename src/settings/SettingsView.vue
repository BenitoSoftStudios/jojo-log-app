<!-- Settings — organized control panel.
     Sections: profile, baby, family, time/display, tips, backup, help. -->
<template>
  <AppLayout>
    <template #header>
      <SecondaryHeader title="Settings" />
    </template>

    <!-- Your profile -->
    <AppCard :padded="false">
      <p class="settings-group-label">Your profile</p>
      <router-link class="settings-row" to="/profile">
        <span class="settings-row__label">Name and initials</span>
        <span class="settings-row__chevron" aria-hidden="true">›</span>
      </router-link>
    </AppCard>

    <!-- Baby profile -->
    <AppCard :padded="false">
      <p class="settings-group-label">Baby profile</p>
      <router-link class="settings-row" to="/baby-settings">
        <span class="settings-row__label">Name, birthdate, and avatar</span>
        <span v-if="!isOwner" class="settings-row__badge">View only</span>
        <span class="settings-row__chevron" aria-hidden="true">›</span>
      </router-link>
    </AppCard>

    <!-- Family and caregivers -->
    <AppCard :padded="false">
      <p class="settings-group-label">Family and caregivers</p>
      <router-link class="settings-row" to="/manage-caregivers">
        <span class="settings-row__label">Manage caregivers</span>
        <span class="settings-row__chevron" aria-hidden="true">›</span>
      </router-link>
      <router-link v-if="isOwner" class="settings-row" to="/invite">
        <span class="settings-row__label">Invite a caregiver</span>
        <span class="settings-row__chevron" aria-hidden="true">›</span>
      </router-link>
    </AppCard>

    <!-- Time and display -->
    <AppCard>
      <h2 class="section-heading">Time and display</h2>

      <p class="field-sub-label">Timezone</p>
      <p class="text-soft text-sm field-note">
        Controls "today" in the ledger header, stats, and new entry times.
      </p>
      <div class="tz-row">
        <select
          v-if="isOwner"
          v-model="pendingTimezone"
          class="tz-select"
        >
          <option v-for="tz in effectiveTimezones" :key="tz.value" :value="tz.value">
            {{ tz.label }}
          </option>
        </select>
        <p v-else class="text-soft text-sm field-readonly">{{ displayTimezone }}</p>
      </div>
      <p v-if="tzError"   class="field-error text-sm" role="alert">{{ tzError }}</p>
      <p v-if="tzSuccess" class="field-success text-sm" role="status">Saved.</p>
      <AppButton
        v-if="isOwner"
        class="save-btn"
        :disabled="tzSaving || pendingTimezone === currentTimezone"
        @click="saveTimezone"
      >{{ tzSaving ? 'Saving…' : 'Save timezone' }}</AppButton>

      <hr class="settings-divider" />

      <p class="field-sub-label">Bottle units</p>
      <p class="text-soft text-sm field-note">
        Entries are stored in mL. You can display bottles in either unit.
      </p>
      <div class="unit-row">
        <select
          v-if="isOwner"
          v-model="pendingUnit"
          class="tz-select"
        >
          <option value="ml">mL</option>
          <option value="floz">fl oz</option>
        </select>
        <p v-else class="text-soft text-sm field-readonly">{{ currentUnit === 'floz' ? 'fl oz' : 'mL' }}</p>
      </div>
      <p v-if="unitError"   class="field-error text-sm" role="alert">{{ unitError }}</p>
      <p v-if="unitSuccess" class="field-success text-sm" role="status">Saved.</p>
      <AppButton
        v-if="isOwner"
        class="save-btn"
        :disabled="unitSaving || pendingUnit === currentUnit"
        @click="saveUnit"
      >{{ unitSaving ? 'Saving…' : 'Save bottle units' }}</AppButton>

    </AppCard>

    <!-- Tips -->
    <AppCard>
      <h2 class="section-heading">Tips</h2>
      <div class="tips-row">
        <div class="tips-row__text">
          <p class="field-sub-label">Show tips</p>
          <p class="text-faint text-xs">Tips appear in the ledger after your first entry.</p>
        </div>
        <button
          class="toggle"
          :class="{ 'toggle--on': tipsVisible }"
          type="button"
          :aria-pressed="tipsVisible"
          :aria-label="tipsVisible ? 'Tips on' : 'Tips off'"
          @click="toggleTips"
        >
          <span class="toggle__thumb" />
        </button>
      </div>
      <button class="reset-tips-btn" type="button" @click="resetTips">Reset tips</button>
      <p class="text-faint text-xs tips-device-note">Tips are stored on this device.</p>
    </AppCard>

    <!-- Backup and import (owner-only) -->
    <AppCard v-if="isOwner" :padded="false">
      <p class="settings-group-label">Backup and import</p>
      <router-link class="settings-row" to="/admin/legacy-import">
        <span class="settings-row__label">Import CSV</span>
        <span class="settings-row__chevron" aria-hidden="true">›</span>
      </router-link>
      <div class="settings-info-row">
        <span class="text-faint text-xs">Export CSV is in the main menu.</span>
      </div>
    </AppCard>

    <!-- Help -->
    <AppCard :padded="false">
      <p class="settings-group-label">Help</p>
      <router-link class="settings-row" to="/help">
        <span class="settings-row__label">Help and Legend</span>
        <span class="settings-row__chevron" aria-hidden="true">›</span>
      </router-link>
    </AppCard>

  </AppLayout>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import AppLayout from '@/ui/AppLayout.vue'
import SecondaryHeader from '@/ui/SecondaryHeader.vue'
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

const TIPS_HIDDEN_KEY    = 'jojo_tips_hidden'
const TIPS_DISMISSED_KEY = 'jojo_tips_dismissed'

const { familyId, familyTimezone, unitPreference, isOwner, refreshFamily } = useFamily()

// ── Timezone ──────────────────────────────────────────────────────────────────

const currentTimezone = computed(() => familyTimezone.value)
const displayTimezone = computed(() => {
  const match = TIMEZONES.find(t => t.value === currentTimezone.value)
  return match ? match.label : currentTimezone.value
})

const effectiveTimezones = computed(() => {
  const current = currentTimezone.value
  if (!current || TIMEZONES.some(t => t.value === current)) return TIMEZONES
  return [{ value: current, label: current }, ...TIMEZONES]
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

// ── Bottle units ──────────────────────────────────────────────────────────────

const currentUnit  = computed(() => unitPreference.value)
const pendingUnit  = ref(currentUnit.value)
const unitSaving   = ref(false)
const unitError    = ref('')
const unitSuccess  = ref(false)

watch(currentUnit, (u) => { pendingUnit.value = u }, { immediate: true })

async function saveUnit() {
  if (!familyId.value) return
  unitSaving.value  = true
  unitError.value   = ''
  unitSuccess.value = false
  try {
    await updateFamily(familyId.value, { unitPreference: pendingUnit.value })
    await refreshFamily()
    unitSuccess.value = true
  } catch (e) {
    console.error('[SettingsView] updateFamily (unitPreference) failed | code:', e.code, '| message:', e.message, e)
    unitError.value = e?.code === 'permission-denied'
      ? 'Only owners can change bottle units.'
      : 'Save failed. Please try again.'
  } finally {
    unitSaving.value = false
  }
}

// ── Tips ───────────────────────────────────────────────────────────────────────

function readTipsHidden() {
  try { return localStorage.getItem(TIPS_HIDDEN_KEY) === 'true' } catch { return false }
}

const tipsHidden  = ref(readTipsHidden())
const tipsVisible = computed(() => !tipsHidden.value)

function toggleTips() {
  const next = !tipsHidden.value
  tipsHidden.value = next
  try {
    if (next) {
      localStorage.setItem(TIPS_HIDDEN_KEY, 'true')
    } else {
      localStorage.removeItem(TIPS_HIDDEN_KEY)
    }
  } catch { /* ignore */ }
}

function resetTips() {
  tipsHidden.value = false
  try {
    localStorage.removeItem(TIPS_DISMISSED_KEY)
    localStorage.removeItem(TIPS_HIDDEN_KEY)
  } catch { /* ignore */ }
}
</script>

<style scoped>
/* ── Layout ──────────────────────────────────────────────────────────────────*/

:deep(.page-container) { display: flex; flex-direction: column; gap: var(--space-4); }

/* ── Settings nav cards ──────────────────────────────────────────────────────*/

.settings-group-label {
  padding: var(--space-3) var(--space-4) var(--space-2);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-faint);
  letter-spacing: 0.03em;
  margin: 0;
}

.settings-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  min-height: 46px;
  border-top: 1px solid var(--color-border-soft);
  text-decoration: none;
  color: var(--color-text);
  font-size: var(--font-size-base);
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  transition: background var(--duration-fast) var(--ease-out);
}
.settings-row:active { background: var(--color-surface-alt); }

.settings-row__label   { flex: 1; }
.settings-row__chevron {
  color: var(--color-text-faint);
  font-size: var(--font-size-lg);
  line-height: 1;
  flex-shrink: 0;
}
.settings-row__badge {
  font-size: var(--font-size-xs);
  color: var(--color-text-faint);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-full);
  padding: 2px var(--space-2);
  flex-shrink: 0;
}

.settings-info-row {
  padding: var(--space-2) var(--space-4);
  border-top: 1px solid var(--color-border-soft);
}

/* ── Inline-control cards ────────────────────────────────────────────────────*/

.section-heading {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-4);
}

.field-sub-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-soft);
  margin-bottom: var(--space-1);
}

.field-note { margin-bottom: var(--space-2); }

/* ── Timezone ────────────────────────────────────────────────────────────────*/

.tz-row { margin: var(--space-2) 0 var(--space-3); }

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
.tz-select:focus { outline: none; border-color: var(--color-mint); }

.field-readonly { padding: var(--space-1) 0; }
.field-error    { color: var(--color-error); margin-bottom: var(--space-2); }
.field-success  { color: var(--color-mint);  margin-bottom: var(--space-2); }

.save-btn { margin-top: var(--space-3); }
.unit-row { margin: var(--space-2) 0 var(--space-3); }

.settings-divider {
  border: none;
  border-top: 1px solid var(--color-border-soft);
  margin: var(--space-4) 0;
}

/* ── Tips card ───────────────────────────────────────────────────────────────*/

.tips-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}
.tips-row__text { flex: 1; }

/* Toggle switch */
.toggle {
  position: relative;
  width: 44px;
  height: 26px;
  background: var(--color-border);
  border: none;
  border-radius: var(--radius-full);
  cursor: pointer;
  flex-shrink: 0;
  transition: background var(--duration-base) var(--ease-out);
  -webkit-tap-highlight-color: transparent;
}
.toggle--on { background: var(--color-mint); }

.toggle__thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  background: #fff;
  border-radius: var(--radius-full);
  transition: transform var(--duration-base) var(--ease-out);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  pointer-events: none;
}
.toggle--on .toggle__thumb { transform: translateX(18px); }

@media (prefers-reduced-motion: reduce) {
  .toggle, .toggle__thumb { transition: none; }
}

.reset-tips-btn {
  width: 100%;
  padding: var(--space-2) var(--space-4);
  background: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-soft);
  cursor: pointer;
  min-height: 40px;
  -webkit-tap-highlight-color: transparent;
  transition: background var(--duration-fast) var(--ease-out);
}
.reset-tips-btn:active { background: var(--color-surface-alt); }

.tips-device-note {
  display: block;
  margin-top: var(--space-3);
}
</style>
