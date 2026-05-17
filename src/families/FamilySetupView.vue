<!-- First-run setup: create the family document, owner member document, and first baby.
     Reads the display label stored by SetupProfileView via pendingSetup.
     If the user already has a family (e.g. direct navigation), redirects to /. -->
<template>
  <div class="setup-page">
    <div class="setup-box">
      <h1 class="setup-title">Set up your family</h1>
      <p class="setup-desc text-soft text-sm">
        Create your family workspace and add the first baby profile.
        You can add more caregivers and babies later.
      </p>

      <!-- Display label recap — read-only here, set in the previous step -->
      <div class="recap-card">
        <span class="recap-label text-soft text-sm">Your display label</span>
        <span class="recap-value">{{ pendingLabel || '—' }}</span>
      </div>

      <form class="setup-form" @submit.prevent="handleSubmit">
        <!-- Family name (optional) -->
        <div class="field-group">
          <label class="field-label" for="familyName">Family name (optional)</label>
          <input
            id="familyName"
            v-model="familyName"
            type="text"
            class="field-input"
            placeholder="e.g. The Smiths"
            maxlength="60"
          />
        </div>

        <hr class="section-divider" />
        <p class="section-heading">Baby profile</p>

        <!-- Baby nickname — required -->
        <div class="field-group">
          <label class="field-label" for="babyNickname">
            Baby nickname <span class="required-mark">*</span>
          </label>
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

        <!-- Birthdate — optional -->
        <div class="field-group">
          <label class="field-label" for="birthdate">Birthdate (optional)</label>
          <input
            id="birthdate"
            v-model="birthdate"
            type="date"
            class="field-input"
          />
          <p class="field-hint text-faint text-xs">Used to show age in weeks. Not required.</p>
        </div>

        <!-- Default interval -->
        <div class="field-group">
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

        <p v-if="error" class="field-error" role="alert">{{ error }}</p>

        <AppButton
          type="submit"
          :full="true"
          :disabled="loading || !babyNickname.trim() || !pendingLabel"
        >
          {{ loading ? 'Creating…' : 'Create family' }}
        </AppButton>
      </form>

      <p v-if="!pendingLabel" class="missing-label-warn text-sm">
        Display label is missing.
        <router-link to="/setup-profile">Go back and set it.</router-link>
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
import { createFamily, addMember } from '@/families/familyService.js'
import { createBaby } from '@/babies/babyService.js'
import { pendingLabel, pendingInitials } from '@/auth/pendingSetup.js'

const router  = useRouter()
const { currentUser }             = useAuth()
const { familyId, loadFamily }    = useFamily()
const { loadBabies }              = useBabies()

const familyName      = ref('')
const babyNickname    = ref('')
const birthdate       = ref('')
const intervalMinutes = ref(180)
const loading         = ref(false)
const error           = ref('')

onMounted(async () => {
  // If this user already has a family, they have no business here
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
    // 1. Create family document
    const fId = await createFamily(
      { name: familyName.value.trim(), timezone: 'America/Toronto', unitPreference: 'ml' },
      user.uid
    )

    // 2. Create owner member document using the display label from SetupProfileView
    await addMember(fId, {
      userId:       user.uid,
      email:        user.email,
      role:         'owner',
      displayLabel: pendingLabel.value,
      initials:     pendingInitials.value
    })

    // 3. Create first baby profile
    const babyId = await createBaby(
      fId,
      {
        nickname:                       babyNickname.value.trim(),
        birthdate:                      birthdate.value || null,
        defaultNextEntryIntervalMinutes: intervalMinutes.value
      },
      user.uid
    )

    // 4. Persist familyId to localStorage and hydrate singletons
    localStorage.setItem('jojo_familyId', fId)
    localStorage.setItem('jojo_babyId', babyId)

    await loadFamily(user.uid)
    await loadBabies(fId)

    // 5. Clear transient pending state
    pendingLabel.value    = ''
    pendingInitials.value = ''

    await router.push('/')
  } catch (e) {
    error.value = 'Could not create family. Check your connection and try again.'
    console.error('[FamilySetupView]', e)
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
  max-width: 400px;
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

.recap-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
}

.recap-value {
  font-weight: var(--font-weight-semibold);
}

.setup-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.section-divider {
  border: none;
  border-top: 1px solid var(--color-border);
}

.section-heading {
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  color: var(--color-text-soft);
  text-transform: uppercase;
  letter-spacing: 0.04em;
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

.required-mark { color: var(--color-error); }

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

.missing-label-warn {
  text-align: center;
  color: var(--color-error);
}
.missing-label-warn a {
  color: var(--color-mint);
}
</style>
