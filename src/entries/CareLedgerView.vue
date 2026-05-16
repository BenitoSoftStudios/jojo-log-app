<!-- Care Ledger — main screen.
     Phase 2: full layout scaffold with real components wired to placeholder data.
     Phase 3+ replaces placeholder data with live composables. -->
<template>
  <AppLayout>
    <template #header>
      <BabySwitcher
        :babies="placeholderBabies"
        :active-baby-id="activeBabyId"
        @select="activeBabyId = $event"
      />
      <SyncStatus :status="syncStatus" />
      <button class="menu-btn" aria-label="Menu" @click="menuOpen = true">☰</button>
    </template>

    <SummaryChips
      :today-ml="0"
      :seven-day-ml="0"
      :month-ml="0"
      :feed-count="0"
    />

    <!-- Ledger placeholder -->
    <div class="ledger-placeholder">
      <p class="text-soft text-sm">
        Care Ledger loads here in Phase 4.<br />
        Month → Week Segment → Day → Entry hierarchy.
      </p>
    </div>

    <!-- Hamburger menu sheet -->
    <AppSheet v-model="menuOpen" title="Menu">
      <nav class="menu-nav">
        <router-link class="menu-item" to="/graphs" @click="menuOpen = false">Graph</router-link>
        <router-link class="menu-item" to="/recently-deleted" @click="menuOpen = false">Recently Deleted</router-link>
        <router-link class="menu-item" to="/manage-caregivers" @click="menuOpen = false">Manage Caregivers</router-link>
        <router-link class="menu-item" to="/baby-settings" @click="menuOpen = false">Baby Settings</router-link>
        <router-link class="menu-item" to="/settings" @click="menuOpen = false">Settings</router-link>
        <router-link class="menu-item" to="/help" @click="menuOpen = false">Help / Legend</router-link>
      </nav>
    </AppSheet>
  </AppLayout>
</template>

<script setup>
import { ref } from 'vue'
import AppLayout from '@/ui/AppLayout.vue'
import AppSheet from '@/ui/AppSheet.vue'
import BabySwitcher from '@/babies/BabySwitcher.vue'
import SyncStatus from '@/ui/SyncStatus.vue'
import SummaryChips from '@/entries/SummaryChips.vue'

const menuOpen    = ref(false)
const syncStatus  = ref('synced')
const activeBabyId = ref('baby-1')

// Phase 2 placeholder — replaced by useBabies in Phase 3
const placeholderBabies = [
  { id: 'baby-1', nickname: 'Jojo' }
]
</script>

<style scoped>
.menu-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--font-size-lg);
  color: var(--color-text-soft);
  padding: var(--space-1);
  line-height: 1;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
}

.ledger-placeholder {
  margin-top: var(--space-8);
  text-align: center;
  padding: var(--space-8);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-text-faint);
}

.menu-nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.menu-item {
  display: block;
  padding: var(--space-3) var(--space-2);
  text-decoration: none;
  color: var(--color-text);
  font-size: var(--font-size-md);
  border-radius: var(--radius-md);
  transition: background var(--duration-fast) var(--ease-out);
}

.menu-item:hover {
  background: var(--color-surface-alt);
}
</style>
