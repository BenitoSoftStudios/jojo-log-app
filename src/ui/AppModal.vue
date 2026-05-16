<template>
  <teleport to="body">
    <transition name="modal">
      <div v-if="modelValue" class="modal-backdrop" @click.self="$emit('update:modelValue', false)">
        <div class="modal-box" role="dialog" :aria-label="title" aria-modal="true">
          <div class="modal-header">
            <span class="modal-title">{{ title }}</span>
            <button class="modal-close" @click="$emit('update:modelValue', false)" aria-label="Close">✕</button>
          </div>
          <div class="modal-body">
            <slot />
          </div>
          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
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
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(44, 42, 39, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: var(--space-4);
}

.modal-box {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 400px;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.modal-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-soft);
  font-size: var(--font-size-md);
  padding: var(--space-1);
  line-height: 1;
  border-radius: var(--radius-sm);
}

.modal-close:hover {
  color: var(--color-text);
}

.modal-body {
  padding: var(--space-5);
  overflow-y: auto;
}

.modal-footer {
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--color-border);
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity var(--duration-base) var(--ease-out);
}
.modal-enter-active .modal-box,
.modal-leave-active .modal-box {
  transition: transform var(--duration-base) var(--ease-out);
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal-box {
  transform: scale(0.95) translateY(8px);
}
.modal-leave-to .modal-box {
  transform: scale(0.95) translateY(8px);
}
</style>
