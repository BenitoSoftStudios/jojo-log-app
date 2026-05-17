<!-- Baby Settings — edit baby profile; archive baby (Owner only).
     Phase 2: form scaffold. Phase 6 wires babyService.updateBaby + archiveBaby. -->
<template>
  <AppLayout>
    <template #header>
      <router-link class="back-btn" to="/" aria-label="Back">←</router-link>
      <span class="header-title">Baby Settings</span>
    </template>

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

      <AppButton :full="true" :disabled="true">Save — Phase 6</AppButton>
    </AppCard>

    <AppCard>
      <h2 class="section-heading danger-heading">Archive baby</h2>
      <p class="text-soft text-sm">
        Archiving hides this baby from the Baby Switcher. History remains
        exportable by Owners. This cannot be undone from the app.
      </p>
      <div class="archive-action">
        <AppButton variant="danger" :disabled="true">Archive baby — Phase 6</AppButton>
      </div>
    </AppCard>
  </AppLayout>
</template>

<script setup>
import { ref } from 'vue'
import AppLayout from '@/ui/AppLayout.vue'
import AppCard from '@/ui/AppCard.vue'
import AppButton from '@/ui/AppButton.vue'

// Phase 2 placeholder values — replaced by useBabies in Phase 6
const nickname        = ref('Jojo')
const birthdate       = ref('')
const intervalMinutes = ref(180)
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
}

.field-input:focus {
  outline: none;
  border-color: var(--color-mint);
}

.field-hint { margin-top: 0; }

.archive-action { margin-top: var(--space-4); }

:deep(.page-container) { display: flex; flex-direction: column; gap: var(--space-4); }
</style>
