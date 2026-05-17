<!-- Graph View — monthly daily bar chart + year-by-month chart.
     Phase 2: layout scaffold. Phase 7 implements volumeChartService + SVG charts. -->
<template>
  <AppLayout>
    <template #header>
      <router-link class="back-btn" to="/" aria-label="Back">←</router-link>
      <span class="header-title">Graph</span>
    </template>

    <AppCard>
      <h2 class="chart-heading">Daily volume — this month</h2>
      <div class="chart-placeholder">
        <p class="text-faint text-sm">Monthly daily bar chart — Phase 7</p>
      </div>
    </AppCard>

    <AppCard>
      <h2 class="chart-heading">Monthly volume — this year</h2>
      <div class="chart-placeholder">
        <p class="text-faint text-sm">Year-by-month chart — Phase 7</p>
      </div>
    </AppCard>
  </AppLayout>
</template>

<script setup>
import AppLayout from '@/ui/AppLayout.vue'
import AppCard from '@/ui/AppCard.vue'
</script>

<style scoped>
.back-btn {
  color: var(--color-text-soft);
  text-decoration: none;
  font-size: var(--font-size-lg);
  line-height: 1;
  flex-shrink: 0;
}

.header-title {
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-md);
}

.chart-heading {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-soft);
  margin-bottom: var(--space-4);
}

.chart-placeholder {
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
}

/* Space between cards via AppLayout gap */
:deep(.page-container) { display: flex; flex-direction: column; gap: var(--space-4); }
</style>
