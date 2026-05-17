<!-- Recently Deleted — soft-deleted entries. Owners can restore. -->
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

    <div v-if="deletedEntries.length === 0" class="empty-state">
      <p class="text-faint text-sm">No deleted entries.</p>
    </div>

    <ul v-else class="deleted-list">
      <li
        v-for="entry in deletedEntries"
        :key="entry.id"
        class="deleted-item"
      >
        <div class="deleted-item__info">
          <span class="deleted-item__date text-sm">{{ entry.entryDate }}</span>
          <span class="deleted-item__time text-soft text-sm">{{ entry.entryTime }}</span>
          <span class="deleted-item__ml text-sm">{{ entry.amountMl ?? '—' }} mL</span>
          <span class="deleted-item__diaper text-sm" :class="diaperClass(entry)">
            {{ entry.diaper ?? '—' }}
          </span>
          <span class="deleted-item__by text-faint text-xs">
            by {{ entry.deletedByLabel ?? entry.createdByLabel }}
          </span>
        </div>
        <button
          v-if="isOwner"
          class="deleted-item__restore"
          type="button"
          :disabled="restoringId === entry.id"
          @click="handleRestore(entry.id)"
        >
          {{ restoringId === entry.id ? 'Restoring…' : 'Restore' }}
        </button>
      </li>
    </ul>

    <p v-if="restoreError" class="restore-error text-sm">{{ restoreError }}</p>
  </AppLayout>
</template>

<script setup>
import { ref } from 'vue'
import AppLayout from '@/ui/AppLayout.vue'
import { useEntries } from '@/entries/useEntries.js'
import { useFamily }  from '@/families/useFamily.js'

const { deletedEntries, restoreEntry } = useEntries()
const { isOwner }                      = useFamily()

const restoringId  = ref(null)
const restoreError = ref('')

function diaperClass(entry) {
  const d = entry.diaper
  return { 'diaper-w': d === 'W', 'diaper-p': d === 'P', 'diaper-wp': d === 'WP' }
}

async function handleRestore(entryId) {
  restoringId.value  = entryId
  restoreError.value = ''
  try {
    await restoreEntry(entryId)
  } catch (e) {
    console.error('[RecentlyDeletedView] restoreEntry failed', e)
    restoreError.value = 'Restore failed. Try again.'
  } finally {
    restoringId.value = null
  }
}
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

.deleted-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.deleted-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border-soft);
  gap: var(--space-3);
}
.deleted-item:last-child {
  border-bottom: none;
}

.deleted-item__info {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
}

.deleted-item__date {
  font-weight: var(--font-weight-semibold);
  flex-shrink: 0;
}

.deleted-item__restore {
  flex-shrink: 0;
  background: none;
  border: 1.5px solid var(--color-mint);
  border-radius: var(--radius-md);
  color: var(--color-mint);
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  padding: var(--space-1) var(--space-3);
  cursor: pointer;
  min-height: 36px;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
.deleted-item__restore:disabled {
  opacity: 0.5;
  cursor: default;
}
.deleted-item__restore:not(:disabled):active {
  background: var(--color-mint-soft);
}

.restore-error {
  color: var(--color-error);
  margin-top: var(--space-3);
}
</style>
