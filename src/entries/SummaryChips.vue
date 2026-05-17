<!-- Summary Chips — today / 7-day / this-month totals and feed count.
     Phase 2: props only. Phase 3+ wires useStats composable. -->
<template>
  <div class="summary-chips">
    <div class="chip">
      <span class="chip-value">{{ todayDisplay }}</span>
      <span class="chip-label">Today</span>
    </div>
    <div class="chip">
      <span class="chip-value">{{ sevenDayDisplay }}</span>
      <span class="chip-label">7 days</span>
    </div>
    <div class="chip">
      <span class="chip-value">{{ monthDisplay }}</span>
      <span class="chip-label">This month</span>
    </div>
    <div class="chip">
      <span class="chip-value">{{ feedCount }}</span>
      <span class="chip-label">Feeds</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  todayMl:    { type: Number, default: 0 },
  sevenDayMl: { type: Number, default: 0 },
  monthMl:    { type: Number, default: 0 },
  feedCount:  { type: Number, default: 0 },
  unit:       { type: String, default: 'ml' } // ml | floz
})

function formatMl(ml) {
  if (props.unit === 'floz') {
    return (ml * 0.033814).toFixed(1) + ' fl oz'
  }
  return ml + ' mL'
}

const todayDisplay    = computed(() => formatMl(props.todayMl))
const sevenDayDisplay = computed(() => formatMl(props.sevenDayMl))
const monthDisplay    = computed(() => formatMl(props.monthMl))
</script>

<style scoped>
.summary-chips {
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
  scrollbar-width: none;
  padding: var(--space-3) 0;
}
.summary-chips::-webkit-scrollbar { display: none; }

.chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  min-width: 72px;
  flex-shrink: 0;
  gap: 2px;
}

.chip-value {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  white-space: nowrap;
}

.chip-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-faint);
}
</style>
