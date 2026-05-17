<!-- Settings — display unit, timezone, other family preferences.
     Phase 2: layout scaffold. Phase 7 wires familyService.updateFamily. -->
<template>
  <AppLayout>
    <template #header>
      <router-link class="back-btn" to="/" aria-label="Back">←</router-link>
      <span class="header-title">Settings</span>
    </template>

    <AppCard>
      <h2 class="section-heading">Display unit</h2>
      <div class="unit-options">
        <label class="radio-option" :class="{ active: unit === 'ml' }">
          <input v-model="unit" type="radio" value="ml" />
          mL
        </label>
        <label class="radio-option" :class="{ active: unit === 'floz' }">
          <input v-model="unit" type="radio" value="floz" />
          fl oz
        </label>
      </div>
      <p class="text-faint text-xs">
        Amounts are always stored in mL. This changes how they are displayed.
        fl oz display wires in Phase 7.
      </p>
    </AppCard>

    <AppCard>
      <h2 class="section-heading">Timezone</h2>
      <p class="text-soft text-sm">Eastern Time (America/Toronto)</p>
      <p class="text-faint text-xs">
        Timezone configuration wires in Phase 7.
      </p>
    </AppCard>
  </AppLayout>
</template>

<script setup>
import { ref } from 'vue'
import AppLayout from '@/ui/AppLayout.vue'
import AppCard from '@/ui/AppCard.vue'

// Phase 2 local placeholder — replaced by useFamily.family.unitPreference in Phase 7
const unit = ref('ml')
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

:deep(.page-container) { display: flex; flex-direction: column; gap: var(--space-4); }
</style>
