<!-- Collapsible month accordion. When open shows CareWeekSegment components. -->
<template>
  <div class="care-month">
    <button
      class="care-month__header"
      type="button"
      :aria-expanded="isOpen"
      @click="emit('toggle-month', month.monthKey)"
    >
      <span class="care-month__label">{{ month.label }}</span>
      <span class="care-month__stats text-soft text-sm">
        {{ month.totalMl }} mL · {{ month.feedCount }} feeds
      </span>
      <span class="care-month__chevron" :class="{ 'care-month__chevron--open': isOpen }">›</span>
    </button>

    <div v-if="isOpen" class="care-month__body">
      <CareWeekSegment
        v-for="week in month.weekSegments"
        :key="week.weekStartDate"
        :week="week"
        :month-key="month.monthKey"
        :is-open="openWeekKeys.has(`${month.monthKey}:${week.weekStartDate}`)"
        :open-days="openDays"
        @toggle-week="emit('toggle-week', month.monthKey, week.weekStartDate)"
        @toggle-day="(d) => emit('toggle-day', d)"
        @add-entry="(d) => emit('add-entry', d)"
        @update-entry="(id, changes) => emit('update-entry', id, changes)"
        @open-detail="(e) => emit('open-detail', e)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import CareWeekSegment from './CareWeekSegment.vue'

const props = defineProps({
  month:        { type: Object,  required: true },
  openMonths:   { type: Object,  required: true },  // Set<monthKey>
  openWeekKeys: { type: Object,  required: true },  // Set<`${monthKey}:${weekStartDate}`>
  openDays:     { type: Object,  required: true },  // Set<date>
})
const emit = defineEmits(['toggle-month', 'toggle-week', 'toggle-day', 'add-entry', 'update-entry', 'open-detail'])

const isOpen = computed(() => props.openMonths.has(props.month.monthKey))
</script>

<style scoped>
.care-month {
  border-bottom: 2px solid var(--color-border);
}

.care-month__header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: var(--color-row-month);
  border: none;
  cursor: pointer;
  text-align: left;
  font-family: var(--font-family);
  min-height: 48px;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
.care-month__header:active {
  filter: brightness(0.97);
}

.care-month__label {
  flex: 1;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  text-align: left;
}

.care-month__stats {
  flex-shrink: 0;
  font-size: var(--font-size-sm);
}

.care-month__chevron {
  flex-shrink: 0;
  color: var(--color-text-faint);
  font-size: var(--font-size-md);
  transition: transform var(--duration-fast) var(--ease-out);
}
.care-month__chevron--open {
  transform: rotate(90deg);
}
</style>
