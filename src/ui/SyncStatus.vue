<template>
  <div class="sync-status" :class="`sync-status--${status}`" :title="label">
    <span class="sync-dot" aria-hidden="true" />
    <span class="sync-label">{{ label }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    default: 'synced', // synced | offline | error
    validator: (v) => ['synced', 'offline', 'error'].includes(v)
  }
})

const label = computed(() => {
  if (props.status === 'offline') return 'Offline'
  if (props.status === 'error')   return 'Sync issue'
  return 'Synced'
})
</script>

<style scoped>
.sync-status {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-xs);
  color: var(--color-text-faint);
}

.sync-dot {
  width: 7px;
  height: 7px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.sync-status--synced .sync-dot  { background: var(--color-mint); }
.sync-status--offline .sync-dot { background: var(--color-sand); }
.sync-status--error .sync-dot   { background: var(--color-error); }

.sync-status--error .sync-label {
  color: var(--color-error);
}
</style>
