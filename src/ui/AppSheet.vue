<!-- Bottom sheet — used for row details and other contextual panels -->
<template>
  <teleport to="body">
    <transition name="sheet">
      <div v-if="modelValue" class="sheet-backdrop" @click.self="$emit('update:modelValue', false)">
        <div class="sheet-panel" role="dialog" :aria-label="title" aria-modal="true">
          <div class="sheet-handle" aria-hidden="true" />
          <div v-if="title" class="sheet-header">
            <span class="sheet-title">{{ title }}</span>
            <button class="sheet-close" @click="$emit('update:modelValue', false)" aria-label="Close">✕</button>
          </div>
          <div class="sheet-body">
            <slot />
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
defineProps({
  modelValue: { type: Boolean, required: true },
  title:      { type: String, default: '' }
})
defineEmits(['update:modelValue'])
</script>

<style scoped>
.sheet-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(44, 42, 39, 0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 300;
}

.sheet-panel {
  background: var(--color-surface);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  width: 100%;
  max-width: var(--max-width);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  max-height: 85vh;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.sheet-handle {
  width: 36px;
  height: 4px;
  background: var(--color-border);
  border-radius: var(--radius-full);
  margin: var(--space-3) auto var(--space-2);
  flex-shrink: 0;
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-5) var(--space-3);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.sheet-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
}

.sheet-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-soft);
  font-size: var(--font-size-md);
  padding: var(--space-1);
  line-height: 1;
  border-radius: var(--radius-sm);
}

.sheet-body {
  padding: var(--space-4) var(--space-5);
  overflow-y: auto;
  flex: 1;
}

/* Transitions */
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity var(--duration-base) var(--ease-out);
}
.sheet-enter-active .sheet-panel,
.sheet-leave-active .sheet-panel {
  transition: transform var(--duration-base) var(--ease-out);
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}
.sheet-enter-from .sheet-panel,
.sheet-leave-to .sheet-panel {
  transform: translateY(100%);
}
</style>
