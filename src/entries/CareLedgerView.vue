<!-- Care Ledger — main screen.
     Phase 6.1B: native-first header, tummy time count UI, sort order,
     row colour polish, incomplete styling, save feedback. -->
<template>
  <AppLayout>
    <template #header>
      <div class="ledger-header">
        <!-- Row 1: baby identity + action buttons -->
        <div class="ledger-header__row">
          <BabySwitcher
            v-if="activeBabies.length > 1"
            :babies="activeBabies"
            :active-baby-id="activeBabyId"
            @select="selectBaby"
          />
          <span v-else class="ledger-header__baby">
            {{ activeBaby ? '🦆 ' + activeBaby.nickname : 'No active baby' }}
          </span>
          <div class="ledger-header__actions">
            <button v-if="activeBaby" class="header-day-btn" type="button" @click="handleOpenDayPicker">+ Day</button>
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

      <!-- No active baby -->
      <div v-if="!activeBaby" class="ledger-empty">
        <p class="text-faint text-sm">No active baby.</p>
        <p v-if="isOwner" class="text-faint text-sm">Use the menu to add one.</p>
      </div>

      <template v-else>
        <SummaryChips
          :today-ml="stats.todayMl"
          :seven-day-ml="stats.sevenDayMl"
          :month-ml="stats.monthMl"
          :feed-count="stats.feedCount"
        />

        <!-- Write error banner -->
        <p v-if="writeError" class="write-error text-sm" role="alert">{{ writeError }}</p>

        <!-- Ledger hierarchy -->
        <div v-if="displayGrouped.months.length === 0" class="ledger-empty">
          <p class="text-faint text-sm">
            No entries yet.<br />
            Tap <strong>+ Day</strong> to create the first entry.
          </p>
        </div>
        <div v-else class="ledger">
          <CareMonth
            v-for="month in displayGrouped.months"
            :key="month.monthKey"
            :month="month"
            :open-months="openMonths"
            :open-week-keys="openWeekKeys"
            :open-days="openDays"
            :sort-order="entrySortOrder"
            @toggle-month="toggleMonth"
            @toggle-week="(mk, ws) => toggleWeek(mk, ws)"
            @toggle-day="toggleDay"
            @add-entry="addEntry"
            @update-entry="updateEntry"
            @open-detail="handleOpenDetail"
          />
        </div>
      </template>
    </template>

    <!-- Entry Detail Sheet -->
    <EntryDetailSheet
      v-model="detailSheetOpen"
      :entry="detailEntry"
      @save-notes="saveNotes"
      @delete="handleDeleteEntry"
    />

    <!-- Day picker sheet — shown when user taps + Day -->
    <AppSheet v-model="dayPickerOpen" title="Add Day">
      <p class="day-picker-hint text-soft text-sm">
        Choose a date and time for the new entry.
      </p>
      <div class="day-picker-options">
        <button
          class="day-picker-btn"
          :class="{ 'day-picker-btn--selected': addDayDate === todayDate }"
          type="button"
          @click="selectAddDay(todayDate, true)"
        >
          <span class="day-picker-btn__label">Today</span>
          <span class="day-picker-btn__date text-soft text-sm">{{ todayDate }}</span>
        </button>
        <button
          class="day-picker-btn"
          :class="{ 'day-picker-btn--selected': addDayDate === nextDayDate }"
          type="button"
          @click="selectAddDay(nextDayDate, false)"
        >
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
            @change="e => { pickedCustomDate = e.target.value; selectAddDay(e.target.value, false) }"
          />
          <button
            class="day-picker-btn day-picker-btn--use-date"
            type="button"
            :disabled="!pickedCustomDate"
            @click="pickedCustomDate && selectAddDay(pickedCustomDate, false)"
          >
            <span class="day-picker-btn__label">Use this date</span>
          </button>
        </div>
      </div>

      <div v-if="addDayDate" class="day-picker-time-row">
        <label class="day-picker-label text-soft text-sm" for="day-picker-time">
          Time
        </label>
        <input
          id="day-picker-time"
          class="day-picker-input"
          type="time"
          v-model="addDayTime"
        />
        <button
          class="day-picker-btn day-picker-btn--use-date"
          type="button"
          @click="doCreateDay"
        >
          <span class="day-picker-btn__label">Create entry</span>
        </button>
      </div>
    </AppSheet>

    <!-- Add baby sheet -->
    <AppSheet v-model="addBabyOpen" title="Add Baby">
      <div class="add-baby-form">
        <div class="form-group">
          <label class="form-label text-soft text-sm" for="add-nickname">Nickname</label>
          <input
            id="add-nickname"
            v-model="newNickname"
            type="text"
            class="form-input"
            placeholder="e.g. Jojo"
            maxlength="40"
          />
        </div>
        <div class="form-group">
          <label class="form-label text-soft text-sm" for="add-birthdate">Birthdate (optional)</label>
          <input
            id="add-birthdate"
            v-model="newBirthdate"
            type="date"
            class="form-input"
          />
        </div>
        <p v-if="addBabyError" class="add-baby-error text-sm">{{ addBabyError }}</p>
        <AppButton
          :full="true"
          :disabled="!newNickname.trim() || addBabySaving"
          @click="handleAddBaby"
        >{{ addBabySaving ? 'Adding…' : 'Add Baby' }}</AppButton>
      </div>
    </AppSheet>

    <!-- Hamburger menu sheet -->
    <AppSheet v-model="menuOpen" title="Menu">
      <nav class="menu-nav">
        <router-link class="menu-item" to="/graphs"            @click="menuOpen = false">Trends</router-link>
        <router-link class="menu-item" to="/recently-deleted"  @click="menuOpen = false">Recently Deleted</router-link>
        <router-link class="menu-item" to="/manage-caregivers" @click="menuOpen = false">Manage Caregivers</router-link>
        <router-link v-if="isOwner" class="menu-item" to="/invite" @click="menuOpen = false">Invite member</router-link>
        <router-link class="menu-item" to="/baby-settings"     @click="menuOpen = false">Baby Settings</router-link>
        <button v-if="isOwner" class="menu-item" type="button" @click="openAddBaby">+ Add Baby</button>
        <button v-if="isOwner" class="menu-item" type="button" :disabled="exporting" @click="handleExportCsv">{{ exporting ? 'Exporting…' : 'Export CSV' }}</button>
        <router-link v-if="isLegacyImportAdmin" class="menu-item" to="/admin/legacy-import" @click="menuOpen = false">Import CSV</router-link>
        <p v-if="isOwner && exportError" class="menu-export-error text-xs">{{ exportError }}</p>
        <router-link class="menu-item" to="/settings"          @click="menuOpen = false">Settings</router-link>
        <router-link class="menu-item" to="/profile"           @click="menuOpen = false">My Profile</router-link>
        <router-link class="menu-item" to="/help"              @click="menuOpen = false">Help / Legend</router-link>
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
import AppButton        from '@/ui/AppButton.vue'
import SummaryChips     from '@/entries/SummaryChips.vue'
import CareMonth        from '@/entries/CareMonth.vue'
import EntryDetailSheet from '@/entries/EntryDetailSheet.vue'
import BabySwitcher     from '@/babies/BabySwitcher.vue'
import { useAuth }          from '@/auth/useAuth.js'
import { useFamily }        from '@/families/useFamily.js'
import { useBabies }        from '@/babies/useBabies.js'
import { useEntries }       from '@/entries/useEntries.js'
import { useLedger }        from '@/entries/useLedger.js'
import { useLedgerActions } from '@/entries/useLedgerActions.js'
import { buildStartNextDayEntry } from '@/utils/entryUtils.js'
import { todayString, getTodayInTimezone, getCurrentHHMMInTimezone } from '@/utils/dateUtils.js'
import { getWeekStartForDate } from '@/utils/weekUtils.js'
import { generateCsv, downloadCsv } from '@/utils/csvExporter.js'
import { useWeeklySettings } from '@/entries/useWeeklySettings.js'

const router = useRouter()

const { currentUser, signOut }                                                               = useAuth()
const { familyId, currentMember, familyTimezone, isOwner, isLegacyImportAdmin,
        loading: familyLoading, loadFamily, clearFamily }                                     = useFamily()
const { activeBabies, activeBabyId, activeBaby, loading: babiesLoading, loadBabies,
        selectBaby, createBabyForFamily, clearBabies }                                       = useBabies()
const { entries, syncStatus }                                                                = useEntries()
const { displayGrouped, stats, mostRecentDate, openMonths, openWeekKeys, openDays,
        entrySortOrder, toggleMonth, toggleWeek, toggleDay }                                 = useLedger()
const { writeError, createDay, addEntry, updateEntry, saveNotes, deleteEntry }               = useLedgerActions()
const { loadWeekSettings, getBottleAmount }                                                  = useWeeklySettings()

const menuOpen         = ref(false)
const detailSheetOpen  = ref(false)
const detailEntryId    = ref(null)
const dayPickerOpen    = ref(false)
const pickedCustomDate = ref('')
const addDayDate       = ref('')
const addDayTime       = ref('')
const addBabyOpen      = ref(false)
const newNickname      = ref('')
const newBirthdate     = ref('')
const addBabySaving    = ref(false)
const addBabyError     = ref('')
const exporting        = ref(false)
const exportError      = ref('')

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
  _now.value.toLocaleDateString('en-CA', {
    weekday: 'short', day: 'numeric', month: 'short',
    timeZone: familyTimezone.value,
  })
)
const headerTime = computed(() => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false, timeZone: familyTimezone.value,
  }).formatToParts(_now.value)
  const h = parts.find(p => p.type === 'hour').value.padStart(2, '0')
  const m = parts.find(p => p.type === 'minute').value.padStart(2, '0')
  const s = parts.find(p => p.type === 'second').value.padStart(2, '0')
  return `${h}:${m}:${s}`
})
// ── CSV export ─────────────────────────────────────────────────────────────

async function handleExportCsv() {
  exporting.value   = true
  exportError.value = ''
  try {
    const allEntries = entries.value
    const weekStarts = [...new Set(allEntries.map(e => getWeekStartForDate(e.entryDate)))]
    await Promise.all(weekStarts.map(ws => loadWeekSettings(ws)))
    const weeklyAmounts = Object.fromEntries(weekStarts.map(ws => [ws, getBottleAmount(ws)]))
    const nickname = activeBaby.value?.nickname ?? 'baby'
    const csv      = generateCsv(allEntries, nickname, weeklyAmounts)
    downloadCsv(csv, `jojo-log-${nickname}-${todayString()}.csv`)
    menuOpen.value = false
  } catch (e) {
    console.error('[CareLedgerView] export failed', e)
    exportError.value = 'Export failed. Try again.'
  } finally {
    exporting.value = false
  }
}

// ── Sort order ─────────────────────────────────────────────────────────────

function toggleSortOrder() {
  entrySortOrder.value = entrySortOrder.value === 'newest-first' ? 'oldest-first' : 'newest-first'
  menuOpen.value = false
}

// ── Add baby ───────────────────────────────────────────────────────────────

function openAddBaby() {
  menuOpen.value     = false
  newNickname.value  = ''
  newBirthdate.value = ''
  addBabyError.value = ''
  addBabyOpen.value  = true
}

async function handleAddBaby() {
  if (!newNickname.value.trim()) return
  addBabySaving.value = true
  addBabyError.value  = ''
  try {
    await createBabyForFamily(
      { nickname: newNickname.value.trim(), birthdate: newBirthdate.value || null },
      currentUser.value?.uid
    )
    addBabyOpen.value = false
  } catch (e) {
    console.error('[CareLedgerView] addBaby failed', e)
    addBabyError.value = 'Failed to add baby. Check your connection.'
  } finally {
    addBabySaving.value = false
  }
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

// Reactive today in family timezone — recomputes when timezone setting changes.
const todayDate = computed(() => getTodayInTimezone(familyTimezone.value))

// Next calendar day after the most recent ledger date (used as default in picker).
const nextDayDate = computed(() => {
  if (!mostRecentDate.value) return todayDate.value
  return buildStartNextDayEntry(mostRecentDate.value, activeBaby.value).date
})

// ── + Day picker ───────────────────────────────────────────────────────────

function handleOpenDayPicker() {
  const next = nextDayDate.value
  pickedCustomDate.value = next <= todayDate.value ? next : todayDate.value
  addDayDate.value       = ''
  addDayTime.value       = ''
  dayPickerOpen.value    = true
}

function selectAddDay(date, isToday) {
  if (!date) return
  addDayDate.value = date
  addDayTime.value = isToday
    ? getCurrentHHMMInTimezone(familyTimezone.value)
    : '00:00'
}

async function doCreateDay() {
  if (!addDayDate.value) return
  dayPickerOpen.value = false
  await createDay(addDayDate.value, addDayTime.value)
}

// ── Entry actions ──────────────────────────────────────────────────────────

function handleOpenDetail(entry) {
  detailEntryId.value   = entry.id
  detailSheetOpen.value = true
}

async function handleDeleteEntry(entryId) {
  const ok = await deleteEntry(entryId)
  if (ok) detailSheetOpen.value = false
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
  justify-content: center;
  font-weight: var(--font-weight-semibold);
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

.day-picker-btn--selected {
  border-color: var(--color-mint);
  background: var(--color-mint-soft);
}

.day-picker-custom {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-border-soft);
}

.day-picker-time-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border-soft);
  margin-top: var(--space-1);
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

.menu-export-error {
  padding: 0 var(--space-4) var(--space-2);
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

/* ── Add baby form ─────────────────────────────────────────────────────── */

.add-baby-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.form-label {
  display: block;
}

.form-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-family: var(--font-family);
  background: var(--color-surface);
  color: var(--color-text);
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-mint);
}

.add-baby-error {
  color: var(--color-error);
  margin: 0;
}
</style>
