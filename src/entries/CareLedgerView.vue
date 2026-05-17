<!-- Care Ledger — main screen.
     Phase 3: loads real family + baby context from composables.
     Phase 4: live entry subscription + smoke-test CRUD panel. -->
<template>
  <AppLayout>
    <template #header>
      <BabySwitcher
        :babies="activeBabies"
        :active-baby-id="activeBabyId"
        @select="selectBaby"
      />
      <SyncStatus :status="syncStatus" />
      <button class="menu-btn" aria-label="Menu" @click="menuOpen = true">☰</button>
    </template>

    <!-- Loading state while family/baby context resolves -->
    <div v-if="familyLoading || babiesLoading" class="loading-state">
      <p class="text-faint text-sm">Loading…</p>
    </div>

    <template v-else>
      <!-- Member greeting -->
      <div v-if="currentMember" class="member-greeting text-soft text-sm">
        Signed in as <strong>{{ currentMember.displayLabel }}</strong>
        <span v-if="isOwner"> · Owner</span>
      </div>

      <SummaryChips
        :today-ml="0"
        :seven-day-ml="0"
        :month-ml="0"
        :feed-count="0"
      />

      <!-- Phase 4 smoke-test panel -->
      <div class="smoke-panel">
        <div class="smoke-counts text-sm">
          <span>Active: <strong>{{ entries.length }}</strong></span>
          <span>Deleted: <strong>{{ deletedEntries.length }}</strong></span>
        </div>

        <div class="smoke-actions">
          <button class="smoke-btn" @click="handleCreate">+ Create test entry</button>
          <button class="smoke-btn" :disabled="!entries[0]" @click="handleUpdate">Edit first notes</button>
          <button class="smoke-btn smoke-btn--danger" :disabled="!entries[0]" @click="handleDelete">Soft-delete first</button>
          <button class="smoke-btn" :disabled="!deletedEntries[0]" @click="handleRestore">Restore first deleted</button>
        </div>

        <p v-if="feedback" class="smoke-feedback text-sm">{{ feedback }}</p>

        <ul class="smoke-list">
          <li v-for="entry in entries" :key="entry.id" class="smoke-entry text-sm">
            <span class="smoke-date">{{ entry.entryDate }} {{ entry.entryTime }}</span>
            <span>{{ entry.amountMl ?? '—' }} mL</span>
            <span>diaper: {{ entry.diaper ?? '—' }}</span>
            <span class="smoke-author text-faint">{{ entry.createdByLabel }}</span>
          </li>
        </ul>
      </div>
    </template>

    <!-- Hamburger menu sheet -->
    <AppSheet v-model="menuOpen" title="Menu">
      <nav class="menu-nav">
        <router-link class="menu-item" to="/graphs"            @click="menuOpen = false">Graph</router-link>
        <router-link class="menu-item" to="/recently-deleted"  @click="menuOpen = false">Recently Deleted</router-link>
        <router-link class="menu-item" to="/manage-caregivers" @click="menuOpen = false">Manage Caregivers</router-link>
        <router-link class="menu-item" to="/baby-settings"     @click="menuOpen = false">Baby Settings</router-link>
        <router-link class="menu-item" to="/settings"          @click="menuOpen = false">Settings</router-link>
        <router-link class="menu-item" to="/help"              @click="menuOpen = false">Help / Legend</router-link>
        <hr class="menu-divider" />
        <button class="menu-item menu-item--signout" @click="handleSignOut">Sign out</button>
      </nav>
    </AppSheet>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout    from '@/ui/AppLayout.vue'
import AppSheet     from '@/ui/AppSheet.vue'
import BabySwitcher from '@/babies/BabySwitcher.vue'
import SyncStatus   from '@/ui/SyncStatus.vue'
import SummaryChips from '@/entries/SummaryChips.vue'
import { useAuth }    from '@/auth/useAuth.js'
import { useFamily }  from '@/families/useFamily.js'
import { useBabies }  from '@/babies/useBabies.js'
import { useEntries } from '@/entries/useEntries.js'
import { todayString } from '@/utils/dateUtils.js'

const router = useRouter()
const { currentUser, signOut }                                                     = useAuth()
const { familyId, currentMember, isOwner, loading: familyLoading, loadFamily }    = useFamily()
const { activeBabies, activeBabyId, loading: babiesLoading, loadBabies, selectBaby } = useBabies()
const { entries, deletedEntries, syncStatus, createEntry, updateEntry, softDeleteEntry, restoreEntry } = useEntries()

const menuOpen = ref(false)
const feedback = ref('')

onMounted(async () => {
  if (!familyId.value && currentUser.value) {
    await loadFamily(currentUser.value.uid)
  }
  if (familyId.value && activeBabies.value.length === 0) {
    await loadBabies(familyId.value)
  }
})

function setFeedback(msg) {
  feedback.value = msg
  setTimeout(() => { feedback.value = '' }, 3000)
}

async function handleCreate() {
  const now = new Date()
  const hh  = String(now.getHours()).padStart(2, '0')
  const mm  = String(now.getMinutes()).padStart(2, '0')
  try {
    await createEntry({ entryDate: todayString(), entryTime: `${hh}:${mm}`, amountMl: 90, diaper: null })
    setFeedback('Test entry created')
  } catch (e) {
    console.error('[CareLedgerView] createEntry failed | code:', e.code, '| message:', e.message, e)
    setFeedback('Create failed — see console')
  }
}

async function handleUpdate() {
  const entry = entries.value[0]
  if (!entry) return
  try {
    await updateEntry(entry.id, { notes: `Smoke-tested at ${new Date().toLocaleTimeString()}` })
    setFeedback(`Updated ${entry.id.slice(-6)}`)
  } catch (e) {
    console.error('[CareLedgerView] updateEntry failed | code:', e.code, '| message:', e.message, e)
    setFeedback('Update failed — see console')
  }
}

async function handleDelete() {
  const entry = entries.value[0]
  if (!entry) return
  try {
    await softDeleteEntry(entry.id)
    setFeedback(`Deleted ${entry.id.slice(-6)}`)
  } catch (e) {
    console.error('[CareLedgerView] softDeleteEntry failed | code:', e.code, '| message:', e.message, e)
    setFeedback('Delete failed — see console')
  }
}

async function handleRestore() {
  const entry = deletedEntries.value[0]
  if (!entry) return
  try {
    await restoreEntry(entry.id)
    setFeedback(`Restored ${entry.id.slice(-6)}`)
  } catch (e) {
    console.error('[CareLedgerView] restoreEntry failed | code:', e.code, '| message:', e.message, e)
    setFeedback('Restore failed — see console')
  }
}

async function handleSignOut() {
  menuOpen.value = false
  await signOut()
  await router.push('/login')
}
</script>

<style scoped>
.loading-state {
  margin-top: var(--space-8);
  text-align: center;
  padding: var(--space-8);
}

.member-greeting {
  margin-bottom: var(--space-2);
}

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

.smoke-panel {
  margin-top: var(--space-4);
  padding: var(--space-4);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.smoke-counts {
  display: flex;
  gap: var(--space-4);
  color: var(--color-text-soft);
}

.smoke-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.smoke-btn {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-sm);
  color: var(--color-text);
  cursor: pointer;
}

.smoke-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.smoke-btn--danger {
  color: var(--color-error);
  border-color: var(--color-error);
}

.smoke-feedback {
  color: var(--color-mint);
  margin: 0;
}

.smoke-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.smoke-entry {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
  padding: var(--space-2);
  background: var(--color-surface);
  border-radius: var(--radius-sm);
}

.smoke-date {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
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

.menu-divider {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: var(--space-2) 0;
}

.menu-item--signout {
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font-family);
  text-align: left;
  width: 100%;
  color: var(--color-error);
}
</style>
