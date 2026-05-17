<!-- Care Ledger — main screen.
     Phase 3: loads real family + baby context from composables.
     Phase 4: live entry subscription + CRUD service layer.
     Phase 6: native-first ledger UI — Month › Week › Day › Entry hierarchy. -->
<template>
  <AppLayout>
    <template #header>
      <BabySwitcher
        :babies="activeBabies"
        :active-baby-id="activeBabyId"
        @select="selectBaby"
      />
      <SyncStatus :status="syncStatus" />
      <button class="header-day-btn" type="button" title="Start next day" @click="handleStartNextDay">
        + Day
      </button>
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
        :today-ml="stats.todayMl"
        :seven-day-ml="stats.sevenDayMl"
        :month-ml="stats.monthMl"
        :feed-count="stats.feedCount"
      />

      <!-- Ledger hierarchy -->
      <div v-if="grouped.months.length === 0" class="ledger-empty">
        <p class="text-faint text-sm">
          No entries yet.<br />
          Tap <strong>+ Day</strong> to create the first entry.
        </p>
      </div>
      <div v-else class="ledger">
        <CareMonth
          v-for="month in grouped.months"
          :key="month.monthKey"
          :month="month"
          :open-months="openMonths"
          :open-week-keys="openWeekKeys"
          :open-days="openDays"
          @toggle-month="toggleMonth"
          @toggle-week="(mk, ws) => toggleWeek(mk, ws)"
          @toggle-day="toggleDay"
          @add-entry="handleAddEntry"
          @update-entry="handleUpdateEntry"
          @open-detail="handleOpenDetail"
        />
      </div>
    </template>

    <!-- Entry Detail Sheet -->
    <EntryDetailSheet
      v-model="detailSheetOpen"
      :entry="detailEntry"
      @save-notes="handleSaveNotes"
      @delete="handleDeleteEntry"
    />

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
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout        from '@/ui/AppLayout.vue'
import AppSheet         from '@/ui/AppSheet.vue'
import BabySwitcher     from '@/babies/BabySwitcher.vue'
import SyncStatus       from '@/ui/SyncStatus.vue'
import SummaryChips     from '@/entries/SummaryChips.vue'
import CareMonth        from '@/entries/CareMonth.vue'
import EntryDetailSheet from '@/entries/EntryDetailSheet.vue'
import { useAuth }    from '@/auth/useAuth.js'
import { useFamily }  from '@/families/useFamily.js'
import { useBabies }  from '@/babies/useBabies.js'
import { useEntries } from '@/entries/useEntries.js'
import { useLedger }  from '@/entries/useLedger.js'
import { buildNewEntryDefaults, buildStartNextDayEntry } from '@/utils/entryUtils.js'
import { todayString } from '@/utils/dateUtils.js'

const router = useRouter()

const { currentUser, signOut }                                                             = useAuth()
const { familyId, currentMember, isOwner, loading: familyLoading, loadFamily }            = useFamily()
const { activeBabies, activeBabyId, activeBaby, loading: babiesLoading, loadBabies, selectBaby } = useBabies()
const { entries, syncStatus, createEntry, updateEntry, softDeleteEntry }                   = useEntries()
const { grouped, stats, mostRecentDate, openMonths, openWeekKeys, openDays,
        toggleMonth, toggleWeek, toggleDay, openDay }                                      = useLedger()

const menuOpen        = ref(false)
const detailSheetOpen = ref(false)
const detailEntryId   = ref(null)

// Always reflect the latest version of the entry from the live list.
const detailEntry = computed(() =>
  entries.value.find(e => e.id === detailEntryId.value) ?? null
)

// Close sheet if the entry is deleted while open.
watch(detailEntry, (e) => {
  if (!e && detailSheetOpen.value) detailSheetOpen.value = false
})

onMounted(async () => {
  if (!familyId.value && currentUser.value) {
    await loadFamily(currentUser.value.uid)
  }
  if (familyId.value && activeBabies.value.length === 0) {
    await loadBabies(familyId.value)
  }
})

// ── Entry actions ──────────────────────────────────────────────────────────────

async function handleAddEntry(day) {
  const lastEntry = day.entries[day.entries.length - 1] ?? null
  const defaults  = buildNewEntryDefaults(lastEntry, activeBaby.value, null)
  try {
    await createEntry({
      entryDate:  day.date,
      entryTime:  defaults.entryTime,
      amountMl:   defaults.amountMl,
      diaper:     defaults.diaper,
      vitaminD:   defaults.vitaminD,
      medication: defaults.medication,
      tummyTime:  false,
      notes:      '',
    })
  } catch (e) {
    console.error('[CareLedgerView] createEntry failed', e)
  }
}

async function handleStartNextDay() {
  const mrd = mostRecentDate.value
  let newDate
  let entryFields

  if (!mrd) {
    // No entries yet — create the first entry for today.
    const defaults = buildNewEntryDefaults(null, activeBaby.value, null)
    newDate     = todayString()
    entryFields = {
      entryTime:  defaults.entryTime,
      amountMl:   null,
      diaper:     null,
      vitaminD:   false,
      medication: false,
      tummyTime:  false,
      notes:      '',
    }
  } else {
    // Always advance to the next calendar day after the most recent ledger date.
    const result = buildStartNextDayEntry(mrd, activeBaby.value)
    newDate      = result.date
    entryFields  = result.entryFields
  }

  try {
    await createEntry({ entryDate: newDate, ...entryFields })
    openDay(newDate)
  } catch (e) {
    console.error('[CareLedgerView] createEntry (+ Day) failed', e)
  }
}

async function handleUpdateEntry(entryId, changes) {
  try {
    await updateEntry(entryId, changes)
  } catch (e) {
    console.error('[CareLedgerView] updateEntry failed', e)
  }
}

function handleOpenDetail(entry) {
  detailEntryId.value   = entry.id
  detailSheetOpen.value = true
}

async function handleSaveNotes(entryId, notes) {
  try {
    await updateEntry(entryId, { notes })
  } catch (e) {
    console.error('[CareLedgerView] notes save failed', e)
  }
}

async function handleDeleteEntry(entryId) {
  try {
    await softDeleteEntry(entryId)
    detailSheetOpen.value = false
  } catch (e) {
    console.error('[CareLedgerView] softDeleteEntry failed', e)
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

.header-day-btn {
  background: none;
  border: 1.5px solid var(--color-mint);
  border-radius: var(--radius-md);
  color: var(--color-mint);
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  padding: var(--space-1) var(--space-3);
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  min-height: 36px;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
.header-day-btn:active {
  background: var(--color-mint-soft);
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

.ledger-empty {
  margin-top: var(--space-8);
  text-align: center;
  padding: var(--space-8);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
}

.ledger {
  margin-top: var(--space-2);
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--color-border);
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
