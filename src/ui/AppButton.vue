<template>
  <button
    :class="['app-btn', `app-btn--${variant}`, { 'app-btn--full': full }]"
    :disabled="disabled"
    :type="type"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>

<script setup>
defineProps({
  variant: { type: String, default: 'primary' }, // primary | secondary | ghost | danger
  type:    { type: String, default: 'button' },
  disabled:{ type: Boolean, default: false },
  full:    { type: Boolean, default: false }
})
</script>

<style scoped>
.app-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  border: none;
  border-radius: var(--radius-md);
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  line-height: 1;
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out),
              opacity    var(--duration-fast) var(--ease-out);
  white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.app-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.app-btn--full {
  width: 100%;
}

/* primary — mint */
.app-btn--primary {
  background: var(--color-mint);
  color: #ffffff;
}
.app-btn--primary:not(:disabled):hover,
.app-btn--primary:not(:disabled):focus-visible {
  background: var(--color-success);
}

/* secondary — outlined */
.app-btn--secondary {
  background: transparent;
  color: var(--color-mint);
  border: 1.5px solid var(--color-mint);
}
.app-btn--secondary:not(:disabled):hover,
.app-btn--secondary:not(:disabled):focus-visible {
  background: var(--color-mint-soft);
}

/* ghost — no border */
.app-btn--ghost {
  background: transparent;
  color: var(--color-text-soft);
}
.app-btn--ghost:not(:disabled):hover,
.app-btn--ghost:not(:disabled):focus-visible {
  background: var(--color-surface-alt);
}

/* danger */
.app-btn--danger {
  background: transparent;
  color: var(--color-error);
  border: 1.5px solid var(--color-error);
}
.app-btn--danger:not(:disabled):hover,
.app-btn--danger:not(:disabled):focus-visible {
  background: #fdf0f0;
}

.app-btn:focus-visible {
  outline: 2px solid var(--color-mint);
  outline-offset: 2px;
}
</style>
