<!-- Recently Deleted — soft-deleted entries; Owners can restore.
     Phase 2: layout scaffold. Phase 6 wires useEntries.deletedEntries. -->
<template>
  <AppLayout>
    <template #header>
      <router-link class="back-btn" to="/" aria-label="Back">←</router-link>
      <span class="header-title">Recently Deleted</span>
    </template>

    <p class="section-desc text-soft text-sm">
      Deleted entries appear here. Owners can restore any entry.
      Restored entries return to the Care Ledger at their original date.
    </p>

    <div class="empty-state">
      <p class="text-faint text-sm">
        No deleted entries yet.<br />
        (Live list loads here in Phase 6.)
      </p>
    </div>
  </AppLayout>
</template>

<script setup>
import AppLayout from '@/ui/AppLayout.vue'
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

.section-desc {
  margin-bottom: var(--space-4);
}

.empty-state {
  margin-top: var(--space-8);
  text-align: center;
  padding: var(--space-8);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
}
</style>
