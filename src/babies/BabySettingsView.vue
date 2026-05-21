<!-- Baby Settings — edit baby profile; archive baby (Owner only). -->
<template>
  <AppLayout>
    <template #header>
      <router-link class="back-btn" to="/" aria-label="Back">←</router-link>
      <span class="header-title">Baby Settings</span>
    </template>

    <div v-if="!activeBaby" class="loading-state">
      <p class="text-faint text-sm">Loading baby profile…</p>
    </div>

    <template v-else>
      <AppCard>
        <h2 class="section-heading">Baby profile</h2>

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
          <p class="field-hint text-faint text-xs">
            Used to show age in weeks.
            <span v-if="ageWeeks !== null">Currently {{ ageWeeks }} week{{ ageWeeks === 1 ? '' : 's' }} old.</span>
          </p>
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

        <p v-if="saveError" class="field-error text-sm" role="alert">{{ saveError }}</p>
        <p v-if="saveSuccess" class="field-success text-sm">Saved.</p>

        <AppButton :full="true" :disabled="saving || !nickname.trim()" @click="handleSave">
          {{ saving ? 'Saving…' : 'Save profile' }}
        </AppButton>
      </AppCard>

      <AppCard v-if="isOwner">
        <h2 class="section-heading danger-heading">Archive baby</h2>
        <p class="text-soft text-sm">
          Archiving hides this baby from the Baby Switcher. History remains
          exportable by Owners.
        </p>
        <div class="archive-action">
          <AppButton variant="danger" :disabled="archiving" @click="confirmArchive = true">
            Archive baby
          </AppButton>
        </div>

        <div v-if="confirmArchive" class="confirm-box">
          <p class="text-sm">Archive <strong>{{ activeBaby.nickname }}</strong>? This hides them from the switcher.</p>
          <div class="confirm-actions">
            <AppButton variant="secondary" @click="confirmArchive = false">Cancel</AppButton>
            <AppButton variant="danger" :disabled="archiving" @click="handleArchive">
              {{ archiving ? 'Archiving…' : 'Confirm archive' }}
            </AppButton>
          </div>
        </div>

        <p v-if="archiveError" class="field-error text-sm" role="alert">{{ archiveError }}</p>
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
import { useBabies }  from '@/babies/useBabies.js'
import { useFamily }  from '@/families/useFamily.js'
import { updateBaby } from '@/babies/babyService.js'

const router                         = useRouter()
const { activeBaby, activeBabyId, loadBabies } = useBabies()
const { familyId, isOwner }          = useFamily()

const nickname        = ref('')
const birthdate       = ref('')
const intervalMinutes = ref(180)
const saving          = ref(false)
const saveError       = ref('')
const saveSuccess     = ref(false)
const archiving       = ref(false)
const archiveError    = ref('')
const confirmArchive  = ref(false)

watch(activeBaby, (baby) => {
  if (!baby) return
  nickname.value        = baby.nickname ?? ''
  birthdate.value       = baby.birthdate ?? ''
  intervalMinutes.value = baby.defaultNextEntryIntervalMinutes ?? 180
}, { immediate: true })

const ageWeeks = computed(() => {
  if (!birthdate.value) return null
  const birth = new Date(birthdate.value + 'T12:00:00')
  const now   = new Date()
  const diff  = now - birth
  return Math.max(0, Math.floor(diff / (7 * 24 * 60 * 60 * 1000)))
})

async function handleSave() {
  saveError.value   = ''
  saveSuccess.value = false
  saving.value      = true
  try {
    await updateBaby(familyId.value, activeBabyId.value, {
      nickname:                       nickname.value.trim(),
      birthdate:                      birthdate.value || null,
      defaultNextEntryIntervalMinutes: Number(intervalMinutes.value)
    })
    await loadBabies(familyId.value)
    saveSuccess.value = true
    setTimeout(() => { saveSuccess.value = false }, 2500)
  } catch (e) {
    console.error('[BabySettingsView] updateBaby failed', e)
    saveError.value = 'Could not save. Check your connection.'
  } finally {
    saving.value = false
  }
}

async function handleArchive() {
  archiveError.value = ''
  archiving.value    = true
  try {
    await updateBaby(familyId.value, activeBabyId.value, { status: 'inactive' })
    await loadBabies(familyId.value)
    confirmArchive.value = false
    await router.push('/')
  } catch (e) {
    console.error('[BabySettingsView] archive failed', e)
    archiveError.value = 'Could not archive. Check your connection.'
  } finally {
    archiving.value = false
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

.loading-state { padding: var(--space-8); text-align: center; }

.section-heading {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-3);
}

.danger-heading { color: var(--color-error); }

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
  transition: border-color var(--duration-fast) var(--ease-out);
}

.field-input:focus {
  outline: none;
  border-color: var(--color-mint);
}

.field-hint    { margin-top: 0; }
.field-error   { color: var(--color-error); margin-bottom: var(--space-2); }
.field-success { color: var(--color-success); margin-bottom: var(--space-2); }

.archive-action { margin-top: var(--space-4); }

.confirm-box {
  margin-top: var(--space-4);
  padding: var(--space-4);
  background: var(--color-surface-alt);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.confirm-actions {
  display: flex;
  gap: var(--space-3);
}

:deep(.page-container) { display: flex; flex-direction: column; gap: var(--space-4); }
</style>
