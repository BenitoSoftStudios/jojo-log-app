<!-- Baby Switcher — selects the active Baby from the family's active babies list.
     Phase 2: renders with placeholder data. Phase 3 wires useBabies composable. -->
<template>
  <div class="baby-switcher">
    <button
      v-for="baby in babies"
      :key="baby.id"
      class="baby-btn"
      :class="{ 'baby-btn--active': baby.id === activeBabyId }"
      @click="$emit('select', baby.id)"
    >
      {{ baby.nickname }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  babies:       { type: Array, default: () => [] }, // [{ id, nickname }]
  activeBabyId: { type: String, default: null }
})
defineEmits(['select'])
</script>

<style scoped>
.baby-switcher {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  flex: 1;
  overflow-x: auto;
  scrollbar-width: none;
}
.baby-switcher::-webkit-scrollbar { display: none; }

.baby-btn {
  background: transparent;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-full);
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-soft);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--duration-fast) var(--ease-out);
  -webkit-tap-highlight-color: transparent;
}

.baby-btn--active {
  background: var(--color-mint);
  border-color: var(--color-mint);
  color: #ffffff;
}

.baby-btn:not(.baby-btn--active):hover {
  border-color: var(--color-mint);
  color: var(--color-mint);
}
</style>
