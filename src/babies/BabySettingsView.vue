<!-- Baby Settings — edit baby profile; archive baby (Owner only). -->
<template>
  <AppLayout>
    <template #header>
      <router-link class="back-btn" to="/" aria-label="Back">←</router-link>
      <span class="header-title">Baby Settings</span>
    </template>

    <div v-if="!activeBaby" class="empty-state">
      <p class="text-faint text-sm">No active baby selected.</p>
    </div>

    <template v-else>
      <AppCard>
        <h2 class="section-heading">Baby profile</h2>

        <p v-if="ageWeeks !== null" class="age-display text-soft text-sm">
          Age: <strong>{{ ageWeeks }} week{{ ageWeeks === 1 ? '' : 's' }}</strong>
        </p>
        <p v-else class="age-display text-faint text-xs">Birthdate not set</p>

        <div class="form-group">
          <label class="field-label" for="nickname">Nickname</label>
          <input
            id="nickname"
            v-model="nickname"
            type="text"
            class="field-input"
            placeholder="e.g. Jojo"
            maxlength="40"
          />
        </div>

        <div class="form-group">
          <label class="field-label" for="birthdate">Birthdate (optional)</label>
          <input
            id="birthdate"
            v-model="birthdate"
            type="date"
            class="field-input"
          />
          <p class="field-hint text-faint text-xs">Used to show age in weeks. Not required.</p>
        </div>

        <div class="form-group">
          <label class="field-label" for="interval">Default next-entry interval</label>
          <select id="interval" v-model="intervalMinutes" class="field-input">
            <option :value="120">2 hours</option>
            <option :value="150">2.5 hours</option>
            <option :value="180">3 hours (default)</option>
            <option :value="210">3.5 hours</option>
            <option :value="240">4 hours</option>
          </select>
          <p class="field-hint text-faint text-xs">
            Prepopulates the time on New Entry (last entry time + this interval).
          </p>
        </div>

        <p v-if="saveError"   class="field-feedback field-feedback--error text-sm">{{ saveError }}</p>
        <p v-if="saveSuccess" class="field-feedback field-feedback--ok    text-sm">Saved.</p>

        <AppButton
          :full="true"
          :disabled="!nickname.trim() || saving"
          @click="handleSave"
        >{{ saving ? 'Saving…' : 'Save' }}</AppButton>
      </AppCard>

      <AppCard v-if="isOwner">
        <h2 class="section-heading danger-heading">Archive baby</h2>
        <p class="text-soft text-sm">
          Archiving hides this baby from the active list. All entries are kept.
        </p>
        <div class="archive-action">
          <template v-if="!archiveConfirming">
            <AppButton variant="danger" :full="true" @click="archiveConfirming = true">
              Archive baby
            </AppButton>
          </template>
          <template v-else>
            <p class="text-soft text-sm">
              Archive <strong>{{ activeBaby.nickname }}</strong>? This cannot be undone from the app.
            </p>
            <div class="confirm-btns">
              <AppButton variant="ghost" @click="archiveConfirming = false">Cancel</AppButton>
              <AppButton variant="danger" :disabled="archiving" @click="handleArchive">
                {{ archiving ? 'Archiving…' : 'Confirm Archive' }}
              </AppButton>
            </div>
          </template>
          <p v-if="archiveError" class="field-feedback field-feedback--error text-sm">{{ archiveError }}</p>
        </div>
      </AppCard>
    </template>
  </AppLayout>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/ui/AppLayout.vue'
import AppCard   from '@/ui/AppCard.vue'
import AppButton from '@/ui/AppButton.vue'
import { useBabies } from '@/babies/useBabies.js'
import { useFamily }  from '@/families/useFamily.js'

const router = useRouter()

const { activeBaby, updateActiveBaby, archiveActiveBaby } = useBabies()
const { isOwner } = useFamily()

const nickname        = ref('')
const birthdate       = ref('')
const intervalMinutes = ref(180)

const saving      = ref(false)
const saveError   = ref('')
const saveSuccess = ref(false)
let   _successTimer = null

const archiveConfirming = ref(false)
const archiving         = ref(false)
const archiveError      = ref('')

watch(activeBaby, (baby) => {
  if (!baby) return
  nickname.value        = baby.nickname ?? ''
  birthdate.value       = baby.birthdate ?? ''
  intervalMinutes.value = baby.defaultNextEntryIntervalMinutes ?? 180
  saveSuccess.value     = false
  saveError.value       = ''
  archiveConfirming.value = false
  archiveError.value    = ''
}, { immediate: true })

const ageWeeks = computed(() => {
  const bd = activeBaby.value?.birthdate
  if (!bd) return null
  const birth = new Date(bd + 'T12:00:00')
  const today = new Date()
  return Math.floor((today - birth) / (1000 * 60 * 60 * 24 * 7))
})

async function handleSave() {
  if (!nickname.value.trim()) return
  saving.value      = true
  saveError.value   = ''
  saveSuccess.value = false
  try {
    await updateActiveBaby({
      nickname:                        nickname.value.trim(),
      birthdate:                       birthdate.value || null,
      defaultNextEntryIntervalMinutes: intervalMinutes.value,
    })
    saveSuccess.value = true
    clearTimeout(_successTimer)
    _successTimer = setTimeout(() => { saveSuccess.value = false }, 2000)
  } catch (e) {
    console.error('[BabySettingsView] save failed', e)
    saveError.value = 'Failed to save. Check your connection.'
  } finally {
    saving.value = false
  }
}

async function handleArchive() {
  archiving.value    = true
  archiveError.value = ''
  try {
    await archiveActiveBaby()
    router.push('/')
  } catch (e) {
    console.error('[BabySettingsView] archive failed', e)
    archiveError.value = 'Failed to archive. Check your connection.'
    archiving.value    = false
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

.danger-heading { color: var(--color-error); }

.age-display { margin-bottom: var(--space-4); }

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
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
  box-sizing: border-box;
}

.field-input:focus {
  outline: none;
  border-color: var(--color-mint);
}

.field-hint { margin-top: 0; }

.field-feedback { margin-top: var(--space-2); margin-bottom: var(--space-2); }
.field-feedback--error { color: var(--color-error); }
.field-feedback--ok    { color: var(--color-mint); }

.archive-action {
  margin-top: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.confirm-btns {
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
}

.empty-state {
  margin-top: var(--space-8);
  text-align: center;
  padding: var(--space-8);
}

:deep(.page-container) { display: flex; flex-direction: column; gap: var(--space-4); }
</style>
