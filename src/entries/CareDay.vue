<!-- Collapsible day row. When open shows entry rows and Add Entry button. -->
<template>
  <div class="care-day">
    <button
      class="care-day__header"
      type="button"
      :aria-expanded="isOpen"
      @click="emit('toggle')"
    >
      <span class="care-day__label">{{ day.label }}</span>
      <span
        v-if="day.hasIncomplete"
        class="incomplete-dot care-day__incomplete"
        aria-label="Incomplete entries"
      />
      <span class="care-day__ml text-soft text-sm">{{ day.totalMl }} mL</span>
      <span class="care-day__chevron" :class="{ 'care-day__chevron--open': isOpen }">›</span>
    </button>

    <div v-if="isOpen" class="care-day__body">
      <CareEntryRow
        v-for="entry in day.entries"
        :key="entry.id"
        :entry="entry"
        @update="(id, changes) => emit('update-entry', id, changes)"
        @open-detail="(e) => emit('open-detail', e)"
      />
      <button class="care-day__add-btn" type="button" @click="emit('add-entry', day)">
        + Add Entry
      </button>
    </div>
  </div>
</template>

<script setup>
import CareEntryRow from './CareEntryRow.vue'

defineProps({
  day:    { type: Object,  required: true },
  isOpen: { type: Boolean, default: false },
})
defineEmits(['toggle', 'add-entry', 'update-entry', 'open-detail'])
</script>

<style scoped>
.care-day {
  border-bottom: 1px solid var(--color-border-soft);
}

.care-day__header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: var(--color-row-day);
  border: none;
  cursor: pointer;
  text-align: left;
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  min-height: 44px;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
.care-day__header:active {
  filter: brightness(0.97);
}

.care-day__label {
  flex: 1;
  text-align: left;
}

.care-day__incomplete {
  flex-shrink: 0;
}

.care-day__ml {
  flex-shrink: 0;
}

.care-day__chevron {
  flex-shrink: 0;
  color: var(--color-text-faint);
  font-size: var(--font-size-md);
  transition: transform var(--duration-fast) var(--ease-out);
}
.care-day__chevron--open {
  transform: rotate(90deg);
}

.care-day__body {
  background: var(--color-row-entry);
}

.care-day__add-btn {
  display: block;
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: none;
  border: none;
  border-top: 1px dashed var(--color-border);
  color: var(--color-mint);
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  text-align: left;
  cursor: pointer;
  min-height: 44px;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
.care-day__add-btn:active {
  background: var(--color-mint-soft);
}
</style>
