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
        <div class="profile-header">
          <AnimalAvatar :animal-key="activeBaby.animalAvatar ?? DEFAULT_ANIMAL" :size="48" />
          <div class="profile-header__text">
            <h2 class="section-heading">Baby profile</h2>
            <p v-if="ageWeeks !== null" class="age-display text-soft text-sm">
              Age: <strong>{{ ageWeeks }} week{{ ageWeeks === 1 ? '' : 's' }}</strong>
            </p>
            <p v-else class="age-display text-faint text-xs">Birthdate not set</p>
          </div>
        </div>

        <!-- Read-only view for caregivers -->
        <template v-if="!isOwner">
          <div class="readonly-field">
            <span class="field-label">Nickname</span>
            <span class="readonly-val">{{ activeBaby.nickname }}</span>
          </div>
          <div class="readonly-field">
            <span class="field-label">Birthdate</span>
            <span class="readonly-val">{{ activeBaby.birthdate ?? 'Not set' }}</span>
          </div>
          <p class="text-faint text-xs caregiver-note">Only the family owner can edit baby settings.</p>
        </template>

        <!-- Editable fields for owner -->
        <template v-else>
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
            <p class="field-hint text-faint text-xs">For privacy, use a nickname instead of the baby's real name.</p>
          </div>

          <div class="form-group">
            <label class="field-label" for="birthdate">Birthdate (optional)</label>
            <input
              id="birthdate"
              v-model="birthdate"
              type="date"
              class="field-input"
            />
            <p class="field-hint text-faint text-xs">For privacy, use a nearby date rather than the exact birthday.</p>
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

          <!-- Animal avatar selector -->
          <div class="form-group">
            <span class="field-label">Animal avatar</span>
            <div class="avatar-grid">
              <button
                v-for="animal in ANIMALS"
                :key="animal.key"
                class="avatar-option"
                :class="{ 'avatar-option--selected': selectedAvatar === animal.key }"
                type="button"
                :aria-label="animal.label"
                :aria-pressed="selectedAvatar === animal.key"
                @click="selectedAvatar = animal.key"
              >
                <AnimalAvatar :animal-key="animal.key" :size="36" />
                <span class="avatar-option__label text-xs">{{ animal.label }}</span>
              </button>
            </div>
          </div>

          <p v-if="saveError"   class="field-feedback field-feedback--error text-sm">{{ saveError }}</p>
          <p v-if="saveSuccess" class="field-feedback field-feedback--ok    text-sm">Saved.</p>

          <AppButton
            :full="true"
            :disabled="!nickname.trim() || saving"
            @click="handleSave"
          >{{ saving ? 'Saving…' : 'Save' }}</AppButton>
        </template>
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
import AppLayout    from '@/ui/AppLayout.vue'
import AppCard      from '@/ui/AppCard.vue'
import AppButton    from '@/ui/AppButton.vue'
import AnimalAvatar from '@/animals/AnimalAvatar.vue'
import { ANIMALS, DEFAULT_ANIMAL } from '@/animals/animalAvatars.js'
import { useBabies } from '@/babies/useBabies.js'
import { useFamily }  from '@/families/useFamily.js'

const router = useRouter()

const { activeBaby, updateActiveBaby, archiveActiveBaby } = useBabies()
const { isOwner } = useFamily()

const nickname        = ref('')
const birthdate       = ref('')
const intervalMinutes = ref(180)
const selectedAvatar  = ref(DEFAULT_ANIMAL)

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
  selectedAvatar.value  = baby.animalAvatar ?? DEFAULT_ANIMAL
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
      animalAvatar:                    selectedAvatar.value,
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

.profile-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.profile-header__text { flex: 1; }

.section-heading {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-1);
}

.danger-heading { color: var(--color-error); margin-bottom: var(--space-3); }

.age-display { margin: 0; }

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

/* ── Avatar grid ─────────────────────────────────────────────────────── */

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-2);
}

.avatar-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-1);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  cursor: pointer;
  min-height: 64px;
  transition: border-color var(--duration-fast), background var(--duration-fast);
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.avatar-option--selected {
  border-color: var(--color-mint);
  background: var(--color-mint-soft);
}

.avatar-option__label {
  color: var(--color-text-soft);
  text-align: center;
  line-height: 1.2;
}

.avatar-option--selected .avatar-option__label {
  color: var(--color-mint);
  font-weight: var(--font-weight-medium);
}

/* ── Read-only (caregiver) view ──────────────────────────────────────── */

.readonly-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin-bottom: var(--space-3);
}

.readonly-val {
  font-size: var(--font-size-base);
  color: var(--color-text);
}

.caregiver-note { margin-top: var(--space-2); }

/* ── Archive section ─────────────────────────────────────────────────── */

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
