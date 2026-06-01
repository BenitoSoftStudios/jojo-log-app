<template>
  <div class="sec-header">
    <router-link :to="backTo" class="sec-back" aria-label="Back">←</router-link>
    <span class="sec-title">{{ title }}</span>
    <span class="sec-spacer" aria-hidden="true" />
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  backTo: { type: String, default: '/' },
})
</script>

<style scoped>
.sec-header {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
}

.sec-back {
  flex-shrink: 0;
  width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-soft);
  text-decoration: none;
  font-size: var(--font-size-lg);
  line-height: 1;
  border-radius: var(--radius-sm);
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.sec-title {
  flex: 1;
  text-align: center;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-md);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sec-spacer {
  flex-shrink: 0;
  width: 44px;
}
</style>
