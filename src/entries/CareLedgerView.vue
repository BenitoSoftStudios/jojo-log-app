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
      <button class="header-day-btn" type="button" title="Add a day" @click="handleOpenDayPicker">
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

      <!-- Write error banner -->
      <p v-if="writeError" class="write-error text-sm" role="alert">{{ writeError }}</p>

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

    <!-- Day picker sheet — shown when user taps + Day -->
    <AppSheet v-model="dayPickerOpen" title="Add Day">
      <p class="day-picker-hint text-soft text-sm">
        Creates a blank entry for the chosen date.
      </p>
      <div class="day-picker-options">
        <button class="day-picker-btn" type="button" @click="doCreateDay(todayDate)">
          <span class="day-picker-btn__label">Today</span>
          <span class="day-picker-btn__date text-soft text-sm">{{ todayDate }}</span>
        </button>
        <button class="day-picker-btn" type="button" @click="doCreateDay(nextDayDate)">
          <span class="day-picker-btn__label">Next day</span>
          <span class="day-picker-btn__date text-soft text-sm">{{ nextDayDate }}</span>
        </button>
        <div class="day-picker-custom">
          <label class="day-picker-label text-soft text-sm" for="day-picker-input">
            Choose date
          </label>
          <input
            id="day-picker-input"
            class="day-picker-input"
            type="date"
            :value="pickedCustomDate"
            :max="todayDate"
            @change="e => pickedCustomDate = e.target.value"
          />
          <button
            class="day-picker-btn"
            type="button"
            :disabled="!pickedCustomDate"
            @click="pickedCustomDate && doCreateDay(pickedCustomDate)"
          >
            <span class="day-picker-btn__label">Use this date</span>
          </button>
        </div>
      </div>
    </AppSheet>

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

const { currentUser, signOut }                                                               = useAuth()
const { familyId, currentMember, isOwner, loading: familyLoading, loadFamily, clearFamily } = useFamily()
const { activeBabies, activeBabyId, activeBaby, loading: babiesLoading, loadBabies,
        selectBaby, clearBabies }                                                            = useBabies()
const { entries, syncStatus, createEntry, updateEntry, softDeleteEntry }                     = useEntries()
const { grouped, stats, mostRecentDate, openMonths, openWeekKeys, openDays,
        toggleMonth, toggleWeek, toggleDay, openDay }                                        = useLedger()

const menuOpen         = ref(false)
const detailSheetOpen  = ref(false)
const detailEntryId    = ref(null)
const dayPickerOpen    = ref(false)
const pickedCustomDate = ref('')
const writeError       = ref('')
let   _writeErrorTimer = null

// Always reflect the latest version of the entry from the live list.
const detailEntry = computed(() =>
  entries.value.find(e => e.id === detailEntryId.value) ?? null
)

// Close sheet if the entry is deleted while open.
watch(detailEntry, (e) => {
  if (!e && detailSheetOpen.value) detailSheetOpen.value = false
})

// Stable today string (does not need to be reactive — sessions don't span midnight).
const todayDate = todayString()

// Next calendar day after the most recent ledger date (used as default in picker).
const nextDayDate = computed(() => {
  if (!mostRecentDate.value) return todayDate
  return buildStartNextDayEntry(mostRecentDate.value, activeBaby.value).date
})

onMounted(async () => {
  if (!familyId.value && currentUser.value) {
    await loadFamily(currentUser.value.uid)
  }
  if (familyId.value && activeBabies.value.length === 0) {
    await loadBabies(familyId.value)
  }
})

// ── Write error helper ─────────────────────────────────────────────────────

function setWriteError(msg) {
  writeError.value = msg
  clearTimeout(_writeErrorTimer)
  _writeErrorTimer = setTimeout(() => { writeError.value = '' }, 5000)
}

// ── + Day picker ───────────────────────────────────────────────────────────

function handleOpenDayPicker() {
  pickedCustomDate.value = nextDayDate.value
  dayPickerOpen.value    = true
}

async function doCreateDay(date) {
  if (!date) return
  dayPickerOpen.value = false
  const defaults = buildNewEntryDefaults(null, activeBaby.value, null)
  try {
    await createEntry({
      entryDate:  date,
      entryTime:  defaults.entryTime,
      amountMl:   null,
      diaper:     null,
      vitaminD:   false,
      medication: false,
      tummyTime:  false,
      notes:      '',
    })
    openDay(date)
  } catch (e) {
    console.error('[CareLedgerView] createEntry (+ Day) failed', e)
    setWriteError('Failed to add day. Check your connection and try again.')
  }
}

// ── Entry actions ──────────────────────────────────────────────────────────

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
    setWriteError('Failed to add entry. Check your connection.')
  }
}

async function handleUpdateEntry(entryId, changes) {
  try {
    await updateEntry(entryId, changes)
  } catch (e) {
    console.error('[CareLedgerView] updateEntry failed', e)
    setWriteError('Failed to save change. Check your connection.')
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
    setWriteError('Failed to save notes. Check your connection.')
  }
}

async function handleDeleteEntry(entryId) {
  try {
    await softDeleteEntry(entryId)
    detailSheetOpen.value = false
  } catch (e) {
    console.error('[CareLedgerView] softDeleteEntry failed', e)
    setWriteError('Failed to delete entry. Check your connection.')
  }
}

async function handleSignOut() {
  menuOpen.value = false
  await signOut()
  // Clear module-level family/baby singletons so the module-level watch in
  // useEntries sees null IDs and kills the Firestore subscription cleanly.
  clearFamily()
  clearBabies()
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

.write-error {
  color: var(--color-error);
  background: rgba(201, 64, 64, 0.07);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
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

/* ── Day picker sheet ─────────────────────────────────────────────────── */

.day-picker-hint {
  margin-bottom: var(--space-4);
}

.day-picker-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.day-picker-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface-alt);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
  cursor: pointer;
  text-align: left;
  min-height: 48px;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
.day-picker-btn:active {
  background: var(--color-mint-soft);
  border-color: var(--color-mint);
}
.day-picker-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.day-picker-btn__label {
  flex: 1;
}

.day-picker-btn__date {
  flex-shrink: 0;
}

.day-picker-custom {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-border-soft);
}

.day-picker-label {
  display: block;
}

.day-picker-input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  color: var(--color-text);
  background: var(--color-surface);
  min-height: 44px;
  box-sizing: border-box;
}
.day-picker-input:focus {
  outline: none;
  border-color: var(--color-mint);
}

/* ── Menu sheet ───────────────────────────────────────────────────────── */

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
