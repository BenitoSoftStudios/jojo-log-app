<template>
  <div class="app-layout">
    <header class="app-header">
      <div class="page-container header-inner">
        <slot name="header" />
      </div>
    </header>

    <main class="app-main">
      <div class="page-container">
        <slot />
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  height: var(--header-height);
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
}

.header-inner {
  display: flex;
  align-items: center;
  height: 100%;
  gap: var(--space-3);
}

.app-main {
  flex: 1;
  padding: var(--space-4) 0 var(--space-12);
}
</style>
