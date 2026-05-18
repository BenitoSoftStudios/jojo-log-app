<!-- Collapsible week segment. When open shows CareDay components. -->
<template>
  <div class="care-week">
    <button
      class="care-week__header"
      type="button"
      :aria-expanded="isOpen"
      @click="emit('toggle-week')"
    >
      <span class="care-week__label text-soft text-sm">{{ week.label }}</span>
      <span class="care-week__ml text-faint text-xs">{{ week.totalMl }} mL</span>
      <span class="care-week__chevron" :class="{ 'care-week__chevron--open': isOpen }">›</span>
    </button>

    <div v-if="isOpen" class="care-week__body">
      <CareDay
        v-for="day in week.days"
        :key="day.date"
        :day="day"
        :is-open="openDays.has(day.date)"
        :sort-order="sortOrder"
        @toggle="emit('toggle-day', day.date)"
        @add-entry="(d) => emit('add-entry', d)"
        @update-entry="(id, changes) => emit('update-entry', id, changes)"
        @open-detail="(e) => emit('open-detail', e)"
      />
    </div>
  </div>
</template>

<script setup>
import CareDay from './CareDay.vue'

defineProps({
  week:      { type: Object,  required: true },
  monthKey:  { type: String,  required: true },
  isOpen:    { type: Boolean, default: false },
  openDays:  { type: Set,     required: true },
  sortOrder: { type: String,  default: 'newest-first' },
})
const emit = defineEmits(['toggle-week', 'toggle-day', 'add-entry', 'update-entry', 'open-detail'])
</script>

<style scoped>
.care-week {
  border-bottom: 1px solid var(--color-border);
}

.care-week__header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2) var(--space-4);
  background: var(--color-row-week);
  border: none;
  cursor: pointer;
  text-align: left;
  font-family: var(--font-family);
  min-height: 40px;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
.care-week__header:active {
  filter: brightness(0.97);
}

.care-week__label {
  flex: 1;
  text-align: left;
}

.care-week__ml {
  flex-shrink: 0;
}

.care-week__chevron {
  flex-shrink: 0;
  color: var(--color-text-faint);
  font-size: var(--font-size-md);
  transition: transform var(--duration-fast) var(--ease-out);
}
.care-week__chevron--open {
  transform: rotate(90deg);
}
</style>
