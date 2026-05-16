<template>
  <div class="app-card" :class="{ 'app-card--padded': padded }">
    <slot />
  </div>
</template>

<script setup>
defineProps({
  padded: { type: Boolean, default: true }
})
</script>

<style scoped>
.app-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border-soft);
}

.app-card--padded {
  padding: var(--space-4);
}
</style>
