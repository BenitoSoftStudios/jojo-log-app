<!-- My Profile — view and edit own displayLabel and initials.
     Route: /profile, requiresAuth: true.
     Role, active, and all security fields are read-only and never sent in the update. -->
<template>
  <AppLayout>
    <template #header>
      <router-link class="back-btn" to="/" aria-label="Back">←</router-link>
      <span class="header-title">My Profile</span>
    </template>

    <AppCard v-if="currentMember">
      <form class="profile-form" @submit.prevent="handleSave">
        <div class="field-group">
          <span class="field-label">Role</span>
          <p class="field-readonly text-sm">{{ currentMember.role }}</p>
        </div>

        <div class="field-group">
          <label class="field-label" for="display-label">Display label</label>
          <input
            id="display-label"
            v-model="displayLabel"
            type="text"
            class="field-input"
            maxlength="20"
            required
            autofocus
          />
          <p class="field-hint text-faint text-xs">Short name shown on every care entry you log.</p>
        </div>

        <div class="field-group">
          <label class="field-label" for="initials">Initials (optional)</label>
          <input
            id="initials"
            v-model="initials"
            type="text"
            class="field-input"
            maxlength="4"
          />
        </div>

        <p v-if="saveError" class="field-error text-sm" role="alert">{{ saveError }}</p>
        <p v-if="saveSuccess" class="field-success text-sm" role="status">Saved.</p>

        <AppButton type="submit" :full="true" :disabled="saving || !displayLabel.trim()">
          {{ saving ? 'Saving…' : 'Save' }}
        </AppButton>
      </form>
    </AppCard>

    <p v-else class="loading-state text-faint text-sm">Loading…</p>
  </AppLayout>
</template>

<script setup>
import { ref, watch } from 'vue'
import AppLayout from '@/ui/AppLayout.vue'
import AppCard from '@/ui/AppCard.vue'
import AppButton from '@/ui/AppButton.vue'
import { currentUser } from '@/auth/useAuth.js'
import { useFamily } from '@/families/useFamily.js'
import { updateMember } from '@/families/familyService.js'

const { currentMember, familyId, refreshCurrentMember } = useFamily()

const displayLabel = ref('')
const initials     = ref('')
const saving       = ref(false)
const saveError    = ref('')
const saveSuccess  = ref(false)

watch(currentMember, (m) => {
  if (m) {
    displayLabel.value = m.displayLabel ?? ''
    initials.value     = m.initials ?? ''
  }
}, { immediate: true })

async function handleSave() {
  if (!displayLabel.value.trim()) return
  saving.value      = true
  saveError.value   = ''
  saveSuccess.value = false
  try {
    await updateMember(familyId.value, currentUser.value.uid, {
      displayLabel: displayLabel.value.trim(),
      initials:     initials.value.trim(),
    })
    await refreshCurrentMember()
    saveSuccess.value = true
  } catch (e) {
    console.error('[ProfileView] updateMember failed | code:', e.code, '| message:', e.message, e)
    if (e?.code === 'permission-denied') {
      saveError.value = 'Permission denied. This account may need a Firestore rules update before self-edit is supported.'
    } else {
      saveError.value = 'Save failed. Please try again.'
    }
  } finally {
    saving.value = false
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

.profile-form {
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

.field-readonly {
  color: var(--color-text-soft);
  padding: var(--space-1) 0;
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
  box-sizing: border-box;
}

.field-input:focus {
  outline: none;
  border-color: var(--color-mint);
}

.field-hint   { margin-top: 0; }
.field-error  { color: var(--color-error); }
.field-success { color: var(--color-success, var(--color-mint)); }

.loading-state {
  padding: var(--space-6) 0;
  text-align: center;
}

:deep(.page-container) { display: flex; flex-direction: column; gap: var(--space-4); }
</style>
