<!-- Care Ledger — main screen.
     Phase 6.1B: native-first header, tummy time count UI, sort order,
     row colour polish, incomplete styling, save feedback. -->
<template>
  <AppLayout>
    <template #header>
      <div class="ledger-header">
        <!-- Row 1: baby identity + action buttons -->
        <div class="ledger-header__row">
          <span class="ledger-header__baby">🦆 {{ babyLabel }}</span>
          <div class="ledger-header__actions">
            <button class="header-day-btn" type="button" @click="handleOpenDayPicker">+ Day</button>
            <button class="menu-btn" aria-label="Menu" @click="menuOpen = true">☰</button>
          </div>
        </div>
        <!-- Row 2: date / time / sync -->
        <div class="ledger-header__row ledger-header__row--sub">
          <span class="ledger-header__datetime">
            <span class="ledger-header__date text-faint">{{ headerDate }}</span>
            <span class="ledger-header__time">{{ headerTime }}</span>
          </span>
          <span class="ledger-header__sync" :class="`ledger-header__sync--${syncStatus}`">
            <span class="ledger-header__sync-dot" />
            <span class="ledger-header__sync-label">
              {{ syncStatus === 'synced' ? 'Synced' : syncStatus === 'offline' ? 'Offline' : 'Sync error' }}
            </span>
          </span>
        </div>
      </div>
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
          :sort-order="entrySortOrder"
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
            class="day-picker-btn day-picker-btn--use-date"
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
        <button class="menu-item" type="button"                @click="handleExportCsv">Export CSV</button>
        <router-link class="menu-item" to="/recently-deleted"  @click="menuOpen = false">Recently Deleted</router-link>
        <router-link class="menu-item" to="/manage-caregivers" @click="menuOpen = false">Manage Caregivers</router-link>
        <router-link class="menu-item" to="/baby-settings"     @click="menuOpen = false">Baby Settings</router-link>
        <router-link class="menu-item" to="/settings"          @click="menuOpen = false">Settings</router-link>
        <router-link class="menu-item" to="/help"              @click="menuOpen = false">Help / Legend</router-link>
        <router-link class="menu-item" to="/support"           @click="menuOpen = false">Support this app ☕</router-link>
        <hr class="menu-divider" />
        <!-- Entry sort order preference -->
        <button class="menu-item menu-sort-row" type="button" @click="toggleSortOrder">
          <span class="menu-sort-label">Entry order</span>
          <span class="menu-sort-value">{{ entrySortOrder === 'newest-first' ? 'Newest ↑' : 'Oldest ↑' }}</span>
        </button>
        <hr class="menu-divider" />
        <button class="menu-item menu-item--signout" @click="handleSignOut">Sign out</button>
      </nav>
    </AppSheet>
  </AppLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout        from '@/ui/AppLayout.vue'
import AppSheet         from '@/ui/AppSheet.vue'
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
import { buildCsvString, downloadCsv } from '@/export/csvExportService.js'

const router = useRouter()

const { currentUser, signOut }                                                               = useAuth()
const { familyId, currentMember, isOwner, loading: familyLoading, loadFamily, clearFamily } = useFamily()
const { activeBabies, activeBabyId, activeBaby, loading: babiesLoading, loadBabies,
        clearBabies }                                                                        = useBabies()
const { entries, syncStatus, createEntry, updateEntry, softDeleteEntry }                     = useEntries()
const { grouped, stats, mostRecentDate, openMonths, openWeekKeys, openDays,
        entrySortOrder, toggleMonth, toggleWeek, toggleDay, openDay }                        = useLedger()

const menuOpen         = ref(false)
const detailSheetOpen  = ref(false)
const detailEntryId    = ref(null)
const dayPickerOpen    = ref(false)
const pickedCustomDate = ref('')
const writeError       = ref('')
let   _writeErrorTimer = null

// ── Header clock ───────────────────────────────────────────────────────────

const _now = ref(new Date())
let _clockTimer = null

onMounted(async () => {
  _clockTimer = setInterval(() => { _now.value = new Date() }, 1_000)

  if (!familyId.value && currentUser.value) {
    await loadFamily(currentUser.value.uid)
  }
  if (familyId.value && activeBabies.value.length === 0) {
    await loadBabies(familyId.value)
  }
})
onUnmounted(() => clearInterval(_clockTimer))

const headerDate = computed(() =>
  _now.value.toLocaleDateString('en-CA', { weekday: 'short', day: 'numeric', month: 'short' })
)
const headerTime = computed(() => {
  const h = String(_now.value.getHours()).padStart(2, '0')
  const m = String(_now.value.getMinutes()).padStart(2, '0')
  const s = String(_now.value.getSeconds()).padStart(2, '0')
  return `${h}:${m}:${s}`
})
const babyLabel = computed(() =>
  activeBaby.value?.nickname ?? activeBaby.value?.name ?? '—'
)

// ── Sort order ─────────────────────────────────────────────────────────────

function toggleSortOrder() {
  entrySortOrder.value = entrySortOrder.value === 'newest-first' ? 'oldest-first' : 'newest-first'
  menuOpen.value = false
}

// ── Entry detail ───────────────────────────────────────────────────────────

// Always reflect the latest version of the entry from the live list.
const detailEntry = computed(() =>
  entries.value.find(e => e.id === detailEntryId.value) ?? null
)

// Close sheet if the entry is deleted while open.
watch(detailEntry, (e) => {
  if (!e && detailSheetOpen.value) detailSheetOpen.value = false
})

// ── Date helpers ───────────────────────────────────────────────────────────

// Stable today string (does not need to be reactive — sessions don't span midnight).
const todayDate = todayString()

// Next calendar day after the most recent ledger date (used as default in picker).
const nextDayDate = computed(() => {
  if (!mostRecentDate.value) return todayDate
  return buildStartNextDayEntry(mostRecentDate.value, activeBaby.value).date
})

// ── Write error helper ─────────────────────────────────────────────────────

function setWriteError(msg) {
  writeError.value = msg
  clearTimeout(_writeErrorTimer)
  _writeErrorTimer = setTimeout(() => { writeError.value = '' }, 5000)
}

// ── + Day picker ───────────────────────────────────────────────────────────

function handleOpenDayPicker() {
  // Cap to today in case nextDayDate is tomorrow (most recent entry is today).
  const next = nextDayDate.value
  pickedCustomDate.value = next <= todayDate ? next : todayDate
  dayPickerOpen.value    = true
}

async function doCreateDay(date) {
  if (!date) return
  dayPickerOpen.value = false
  const defaults = buildNewEntryDefaults(null, activeBaby.value, null)
  try {
    await createEntry({
      entryDate:      date,
      entryTime:      defaults.entryTime,
      amountMl:       null,
      diaper:         null,
      vitaminD:       false,
      medication:     false,
      tummyTime:      false,
      tummyTimeCount: 0,
      notes:          '',
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
      entryDate:      day.date,
      entryTime:      defaults.entryTime,
      amountMl:       defaults.amountMl,
      diaper:         defaults.diaper,
      vitaminD:       defaults.vitaminD,
      medication:     defaults.medication,
      tummyTime:      false,
      tummyTimeCount: 0,
      notes:          '',
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

function handleExportCsv() {
  menuOpen.value = false
  const baby = activeBaby.value
  const nickname = baby?.nickname ?? baby?.name ?? 'baby'
  const csv = buildCsvString(entries.value, nickname)
  const date = todayString()
  downloadCsv(csv, `jojo-log-${nickname.toLowerCase().replace(/\s+/g, '-')}-${date}.csv`)
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
/* ── Native-first header ──────────────────────────────────────────────── */

.ledger-header {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 3px;
}

.ledger-header__row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.ledger-header__row--sub {
  align-items: center;
  gap: var(--space-3);
}

.ledger-header__baby {
  flex: 1;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ledger-header__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}

.ledger-header__datetime {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: 1;
  font-size: var(--font-size-xs);
}

.ledger-header__date {
  color: var(--color-text-faint);
}

.ledger-header__time {
  color: var(--color-mint);
  font-weight: var(--font-weight-medium);
  font-variant-numeric: tabular-nums;
}

.ledger-header__sync {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.ledger-header__sync-dot {
  width: 7px;
  height: 7px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}
.ledger-header__sync--synced  .ledger-header__sync-dot { background: var(--color-mint); }
.ledger-header__sync--offline .ledger-header__sync-dot { background: var(--color-sand); }
.ledger-header__sync--error   .ledger-header__sync-dot { background: var(--color-error); }

.ledger-header__sync-label {
  font-size: var(--font-size-xs);
}
.ledger-header__sync--synced  .ledger-header__sync-label { color: var(--color-mint); }
.ledger-header__sync--offline .ledger-header__sync-label { color: var(--color-sand); }
.ledger-header__sync--error   .ledger-header__sync-label { color: var(--color-error); }

/* ── Action buttons ───────────────────────────────────────────────────── */

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
  min-height: 32px;
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

/* ── Main content ─────────────────────────────────────────────────────── */

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

/* "Use this date" — white bg, green outline, green text */
.day-picker-btn--use-date {
  background: var(--color-surface);
  border-color: var(--color-mint);
  color: var(--color-mint);
}
.day-picker-btn--use-date:active {
  background: var(--color-mint-soft);
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

/* menu-sort-row extends .menu-item — same height, same padding, same tap target */
.menu-sort-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font-family);
  text-align: left;
  width: 100%;
}

.menu-sort-label {
  color: var(--color-text-soft);
  font-size: var(--font-size-md);
}

.menu-sort-value {
  font-size: var(--font-size-sm);
  color: var(--color-mint);
  font-weight: var(--font-weight-medium);
}
</style>
