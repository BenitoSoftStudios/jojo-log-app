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
            <template v-if="activeBaby">
              <AnimalAvatar :animal-key="activeBaby.animalAvatar" :size="24" class="ledger-avatar" />
              {{ activeBaby.nickname }}
            </template>
            <template v-else>No active baby</template>
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
      <!-- No active baby -->
      <div v-if="!activeBaby" class="ledger-empty">
        <p class="text-faint text-sm">No active baby.</p>
        <p v-if="isOwner" class="text-faint text-sm">Use the menu to add one.</p>
      </div>

      <template v-else>
        <!-- Today command panel -->
        <div class="today-panel">
          <div class="today-panel__top">
            <span class="today-panel__title">Today</span>
            <span
              v-if="todayIncompleteCount > 0"
              class="today-panel__incomplete"
              :aria-label="`${todayIncompleteCount} ${todayIncompleteCount === 1 ? 'entry needs' : 'entries need'} finishing`"
            >{{ todayIncompleteCount }} {{ todayIncompleteCount === 1 ? 'needs' : 'need' }} finishing</span>
            <span v-if="currentMember" class="today-panel__member text-faint">
              {{ currentMember.displayLabel }}<span v-if="isOwner"> · Owner</span>
            </span>
          </div>
          <div class="today-panel__stats">
            <span class="today-panel__stat-primary">{{ stats.todayMl }} mL today</span>
            <span class="today-panel__sep" aria-hidden="true"> · </span>
            <span class="today-panel__stat">{{ stats.feedCount }} {{ stats.feedCount === 1 ? 'feed' : 'feeds' }}</span>
          </div>
          <div v-if="lastEntryLine" class="today-panel__last text-faint">{{ lastEntryLine }}</div>
          <div class="today-panel__actions" role="group" aria-label="Quick log">
            <button class="qa-pill" type="button" aria-label="Quick log bottle" @click="openQuickAction('bottle')">Bottle</button>
            <button class="qa-pill" type="button" aria-label="Quick log diaper" @click="openQuickAction('diaper')">Diaper</button>
            <button class="qa-pill" type="button" aria-label="Quick log medication" @click="openQuickAction('rx')">Rx</button>
            <button class="qa-pill" type="button" aria-label="Quick log tummy time" @click="openQuickAction('tummy')">Tummy</button>
          </div>
          <div class="today-panel__secondary text-faint">
            <span>{{ stats.sevenDayMl }} mL · 7 days</span>
            <span class="today-panel__sep-dot" aria-hidden="true"> · </span>
            <span>{{ stats.monthMl }} mL · this month</span>
          </div>
        </div>

        <!-- Write error banner -->
        <p v-if="writeError" class="write-error text-sm" role="alert">{{ writeError }}</p>

        <!-- Early-use tips (only shown when there are entries) -->
        <EarlyUseTips v-if="displayGrouped.months.length > 0" :is-owner="isOwner" />

        <!-- Ledger hierarchy -->
        <div v-if="displayGrouped.months.length === 0" class="ledger-empty-state">
          <p class="empty-state__heading">No entries yet</p>
          <p class="empty-state__sub text-soft text-sm">Start with whatever you need to record.</p>
          <div class="empty-state__chips">
            <span class="empty-state__chip">Bottle only</span>
            <span class="empty-state__chip">Diaper only</span>
            <span class="empty-state__chip">Medication only</span>
            <span class="empty-state__chip">Tummy Time only</span>
            <span class="empty-state__chip">Vitamin D only</span>
            <span class="empty-state__chip">Note only</span>
          </div>
          <div class="empty-state__actions">
            <button class="empty-state__add-btn" type="button" @click="handleOpenDayPicker">+ Add first entry</button>
            <router-link class="empty-state__help-link" to="/help">Help and Legend</router-link>
          </div>
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

    <!-- Quick action sheet -->
    <AppSheet v-model="qaSheetOpen" :title="qaSheetTitle">

      <!-- Bottle -->
      <div v-if="qaType === 'bottle'" class="qa-body">
        <p class="qa-hint text-soft text-sm">Enter the amount. Diaper will be set to no event.</p>
        <div class="qa-amount-row">
          <input
            ref="qaBottleInputRef"
            v-model="qaBottleAmount"
            class="qa-amount-input"
            type="number"
            min="0"
            step="1"
            inputmode="numeric"
            placeholder="0"
            aria-label="Amount in mL"
          />
          <span class="qa-amount-unit text-soft">mL</span>
        </div>
        <p v-if="qaError" class="qa-error text-sm" role="alert">{{ qaError }}</p>
        <div class="qa-btns">
          <button class="qa-btn qa-btn--save" type="button" :disabled="qaCreating" @click="doQuickAction">
            {{ qaCreating ? 'Adding...' : 'Add entry' }}
          </button>
          <button class="qa-btn qa-btn--cancel" type="button" @click="qaSheetOpen = false">Cancel</button>
        </div>
      </div>

      <!-- Diaper -->
      <div v-else-if="qaType === 'diaper'" class="qa-body">
        <p class="qa-hint text-soft text-sm">0 mL logged. Choose diaper type.</p>
        <div class="qa-diaper-row" role="group" aria-label="Diaper type">
          <button
            v-for="opt in QA_DIAPER_OPTS"
            :key="opt.value"
            class="qa-diaper-btn"
            :class="{ 'qa-diaper-btn--selected': qaDiaper === opt.value }"
            type="button"
            :aria-pressed="qaDiaper === opt.value"
            :aria-label="opt.label"
            @click="qaDiaper = opt.value"
          >{{ opt.display }}</button>
        </div>
        <p v-if="qaError" class="qa-error text-sm" role="alert">{{ qaError }}</p>
        <div class="qa-btns">
          <button class="qa-btn qa-btn--save" type="button" :disabled="qaCreating || !qaDiaper" @click="doQuickAction">
            {{ qaCreating ? 'Adding...' : 'Add entry' }}
          </button>
          <button class="qa-btn qa-btn--cancel" type="button" @click="qaSheetOpen = false">Cancel</button>
        </div>
      </div>

      <!-- Rx -->
      <div v-else-if="qaType === 'rx'" class="qa-body">
        <p class="qa-hint text-soft text-sm">0 mL, no diaper event. Add medication details.</p>
        <input
          ref="qaRxInputRef"
          v-model="qaRxNote"
          class="qa-input"
          type="text"
          placeholder="Name, dosage (optional)"
          maxlength="200"
          autocomplete="off"
          aria-label="Medication name and dosage"
        />
        <p v-if="qaError" class="qa-error text-sm" role="alert">{{ qaError }}</p>
        <div class="qa-btns">
          <button class="qa-btn qa-btn--save" type="button" :disabled="qaCreating" @click="doQuickAction">
            {{ qaCreating ? 'Adding...' : 'Add entry' }}
          </button>
          <button class="qa-btn qa-btn--cancel" type="button" @click="qaSheetOpen = false">Cancel</button>
        </div>
      </div>

      <!-- Tummy Time -->
      <div v-else-if="qaType === 'tummy'" class="qa-body">
        <p class="qa-hint text-soft text-sm">0 mL, no diaper event. Enter tummy time duration.</p>
        <div class="tt-row">
          <input
            v-model.number="qaMinutes"
            class="tt-duration-input"
            type="number"
            min="0"
            max="99"
            inputmode="numeric"
            placeholder="0"
            aria-label="Minutes"
          />
          <span class="tt-duration-unit">min</span>
          <input
            v-model.number="qaSeconds"
            class="tt-duration-input"
            type="number"
            min="0"
            max="59"
            inputmode="numeric"
            placeholder="0"
            aria-label="Seconds"
          />
          <span class="tt-duration-unit">sec</span>
        </div>
        <p class="qa-subhint text-faint text-xs">Leave blank to record without a duration.</p>
        <p v-if="qaError" class="qa-error text-sm" role="alert">{{ qaError }}</p>
        <div class="qa-btns">
          <button class="qa-btn qa-btn--save qa-btn--save-tt" type="button" :disabled="qaCreating" @click="doQuickAction">
            {{ qaCreating ? 'Adding...' : 'Add entry' }}
          </button>
          <button class="qa-btn qa-btn--cancel" type="button" @click="qaSheetOpen = false">Cancel</button>
        </div>
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
        <router-link v-if="isOwner" class="menu-item" to="/admin/legacy-import" @click="menuOpen = false">Import CSV</router-link>
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
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout        from '@/ui/AppLayout.vue'
import AppSheet         from '@/ui/AppSheet.vue'
import AppButton        from '@/ui/AppButton.vue'
import EarlyUseTips     from '@/ui/EarlyUseTips.vue'
import CareMonth        from '@/entries/CareMonth.vue'
import EntryDetailSheet from '@/entries/EntryDetailSheet.vue'
import BabySwitcher     from '@/babies/BabySwitcher.vue'
import AnimalAvatar     from '@/animals/AnimalAvatar.vue'
import { useAuth }          from '@/auth/useAuth.js'
import { useFamily }        from '@/families/useFamily.js'
import { useBabies }        from '@/babies/useBabies.js'
import { useEntries }       from '@/entries/useEntries.js'
import { useLedger }        from '@/entries/useLedger.js'
import { useLedgerActions } from '@/entries/useLedgerActions.js'
import { buildStartNextDayEntry, isIncomplete } from '@/utils/entryUtils.js'
import { todayString, getTodayInTimezone, getCurrentHHMMInTimezone } from '@/utils/dateUtils.js'
import { getWeekStartForDate } from '@/utils/weekUtils.js'
import { generateCsv, downloadCsv } from '@/utils/csvExporter.js'
import { useWeeklySettings } from '@/entries/useWeeklySettings.js'

const router = useRouter()

const { currentUser, signOut }                                                               = useAuth()
const { familyId, currentMember, familyTimezone, isOwner,
        loading: familyLoading, loadFamily, clearFamily }                                     = useFamily()
const { activeBabies, activeBabyId, activeBaby, loading: babiesLoading, loadBabies,
        selectBaby, createBabyForFamily, clearBabies }                                       = useBabies()
const { entries, syncStatus, createEntry }                                                   = useEntries()
const { displayGrouped, stats, mostRecentDate, openMonths, openWeekKeys, openDays,
        entrySortOrder, toggleMonth, toggleWeek, toggleDay, openDay }                        = useLedger()
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

// ── Quick action state ─────────────────────────────────────────────────────

const QA_DIAPER_OPTS = [
  { value: 'W',  display: 'W',  label: 'Wet diaper' },
  { value: 'P',  display: 'P',  label: 'Poop diaper' },
  { value: 'WP', display: 'WP', label: 'Wet and poop diaper' },
]

const qaSheetOpen      = ref(false)
const qaType           = ref('')
const qaDiaper         = ref('')
const qaBottleAmount   = ref('')
const qaRxNote         = ref('')
const qaMinutes        = ref(0)
const qaSeconds        = ref(0)
const qaCreating       = ref(false)
const qaError          = ref('')
const qaBottleInputRef = ref(null)
const qaRxInputRef     = ref(null)

const qaSheetTitle = computed(() => {
  if (qaType.value === 'bottle') return 'Bottle entry'
  if (qaType.value === 'diaper') return 'Diaper entry'
  if (qaType.value === 'rx')     return 'Medication entry'
  if (qaType.value === 'tummy')  return 'Tummy Time entry'
  return 'Quick entry'
})

function openQuickAction(type) {
  qaType.value         = type
  qaDiaper.value       = ''
  qaBottleAmount.value = ''
  qaRxNote.value       = ''
  qaMinutes.value      = 0
  qaSeconds.value      = 0
  qaCreating.value     = false
  qaError.value        = ''
  qaSheetOpen.value    = true
  if (type === 'bottle') {
    nextTick(() => qaBottleInputRef.value?.focus())
  } else if (type === 'rx') {
    nextTick(() => qaRxInputRef.value?.focus())
  }
}

async function doQuickAction() {
  if (qaCreating.value) return
  qaError.value = ''
  const time = getCurrentHHMMInTimezone(familyTimezone.value)
  const date = todayDate.value
  const base = {
    vitaminD:                false,
    medication:              false,
    medicationNote:          null,
    tummyTime:               false,
    tummyTimeCount:          0,
    tummyTimeDurationSeconds: null,
    notes:                   '',
  }
  let fields = {}
  if (qaType.value === 'bottle') {
    const n = parseInt(String(qaBottleAmount.value), 10)
    if (isNaN(n) || n < 0) { qaError.value = 'Enter a valid amount in mL.'; return }
    fields = { ...base, entryDate: date, entryTime: time, amountMl: n, diaper: '-' }
  } else if (qaType.value === 'diaper') {
    if (!qaDiaper.value) { qaError.value = 'Choose a diaper type.'; return }
    fields = { ...base, entryDate: date, entryTime: time, amountMl: 0, diaper: qaDiaper.value }
  } else if (qaType.value === 'rx') {
    fields = { ...base, entryDate: date, entryTime: time, amountMl: 0, diaper: '-',
               medication: true, medicationNote: qaRxNote.value.trim() || null }
  } else if (qaType.value === 'tummy') {
    const mins  = Math.max(0, Number(qaMinutes.value) || 0)
    const secs  = Math.max(0, Math.min(59, Number(qaSeconds.value) || 0))
    const total = mins * 60 + secs
    fields = { ...base, entryDate: date, entryTime: time, amountMl: 0, diaper: '-',
               tummyTime: true, tummyTimeCount: 1, tummyTimeDurationSeconds: total > 0 ? total : null }
  }
  try {
    qaCreating.value = true
    await createEntry(fields)
    openDay(date)
    qaSheetOpen.value = false
  } catch (e) {
    console.error('[CareLedgerView] quick action failed', e)
    qaError.value = 'Failed to add entry. Check your connection.'
  } finally {
    qaCreating.value = false
  }
}

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

// ── Today panel ────────────────────────────────────────────────────────────

const todayIncompleteCount = computed(() => {
  const today = todayDate.value
  return entries.value.filter(e => !e.deleted && e.entryDate === today && isIncomplete(e)).length
})

const lastEntry = computed(() => {
  const nonDeleted = entries.value.filter(e => !e.deleted)
  if (!nonDeleted.length) return null
  return nonDeleted.reduce((best, e) => {
    if (!best) return e
    if (e.entryDate > best.entryDate) return e
    if (e.entryDate === best.entryDate && e.entryTime > best.entryTime) return e
    return best
  }, null)
})

const lastEntryLine = computed(() => {
  const e = lastEntry.value
  if (!e) return null
  const parts = [e.entryTime]
  if (typeof e.amountMl === 'number') parts.push(e.amountMl + ' mL')
  if (e.diaper && e.diaper !== '-') parts.push(e.diaper)
  return 'Last logged ' + parts.join(', ')
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
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.ledger-avatar { flex-shrink: 0; }

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

/* ── Today command panel ──────────────────────────────────────────────── */

.today-panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.today-panel__top {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.today-panel__title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
}

.today-panel__incomplete {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-incomplete);
  background: rgba(232, 160, 32, 0.1);
  border-radius: var(--radius-full);
  padding: 2px var(--space-2);
}

.today-panel__member {
  margin-left: auto;
  font-size: var(--font-size-xs);
}

.today-panel__stats {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0;
  font-size: var(--font-size-sm);
}

.today-panel__stat-primary {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
}

.today-panel__stat {
  color: var(--color-text-soft);
}

.today-panel__sep {
  color: var(--color-text-faint);
}

.today-panel__last {
  font-size: var(--font-size-xs);
  line-height: 1.3;
}

.today-panel__actions {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  padding-top: var(--space-1);
}

.qa-pill {
  background: var(--color-surface-alt);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-full);
  color: var(--color-text-soft);
  font-family: var(--font-family);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  padding: var(--space-1) var(--space-3);
  min-height: 34px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  transition: background var(--duration-fast), border-color var(--duration-fast),
              color var(--duration-fast);
}
.qa-pill:active {
  background: var(--color-mint-soft);
  border-color: var(--color-mint);
  color: var(--color-mint);
}

.today-panel__secondary {
  font-size: var(--font-size-xs);
  line-height: 1.3;
  padding-top: var(--space-1);
  border-top: 1px solid var(--color-border-soft);
}

.today-panel__sep-dot {
  color: var(--color-text-faint);
}

/* ── Quick action sheet content ─────────────────────────────────────── */

.qa-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.qa-hint {
  margin: 0;
}

.qa-subhint {
  text-align: center;
  margin-top: calc(-1 * var(--space-2));
}

.qa-error {
  color: var(--color-error);
  margin: 0;
}

.qa-amount-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  justify-content: center;
  padding: var(--space-2) 0;
}

.qa-amount-input {
  width: 96px;
  padding: var(--space-3) var(--space-2);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xl);
  font-family: var(--font-family);
  color: var(--color-text);
  background: var(--color-surface);
  text-align: center;
  -moz-appearance: textfield;
}
.qa-amount-input::-webkit-inner-spin-button,
.qa-amount-input::-webkit-outer-spin-button { -webkit-appearance: none; }
.qa-amount-input:focus { outline: none; border-color: var(--color-mint); }

.qa-amount-unit {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
}

.qa-diaper-row {
  display: flex;
  gap: var(--space-3);
  justify-content: center;
  padding: var(--space-2) 0;
}

.qa-diaper-btn {
  flex: 1;
  max-width: 96px;
  min-height: 56px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-alt);
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-soft);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  transition: background var(--duration-fast), border-color var(--duration-fast),
              color var(--duration-fast);
}
.qa-diaper-btn--selected {
  border-color: var(--color-mint);
  background: var(--color-mint-soft);
  color: var(--color-mint);
  font-weight: var(--font-weight-semibold);
}

.qa-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-family: var(--font-family);
  color: var(--color-text);
  background: var(--color-surface);
  box-sizing: border-box;
}
.qa-input:focus { outline: none; border-color: var(--color-mint); }

.tt-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  justify-content: center;
  padding: var(--space-2) 0;
}

.tt-duration-input {
  width: 72px;
  padding: var(--space-3) var(--space-2);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xl);
  font-family: var(--font-family);
  color: var(--color-text);
  background: var(--color-surface);
  text-align: center;
  -moz-appearance: textfield;
}
.tt-duration-input::-webkit-inner-spin-button,
.tt-duration-input::-webkit-outer-spin-button { -webkit-appearance: none; }
.tt-duration-input:focus { outline: none; border-color: var(--color-lavender); }

.tt-duration-unit {
  font-size: var(--font-size-sm);
  color: var(--color-text-soft);
  font-weight: var(--font-weight-medium);
  min-width: 28px;
}

.qa-btns {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.qa-btn {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  border: none;
  min-height: 48px;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  transition: opacity var(--duration-fast);
}
.qa-btn:active { opacity: 0.82; }
.qa-btn:disabled { opacity: 0.5; cursor: default; }

.qa-btn--save    { background: var(--color-mint);     color: #fff; }
.qa-btn--save-tt { background: var(--color-lavender); color: #fff; }

.qa-btn--cancel {
  background: none;
  color: var(--color-text-faint);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-normal);
  min-height: 40px;
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

/* ── Rich empty ledger state ──────────────────────────────────────────── */

.ledger-empty-state {
  margin-top: var(--space-4);
  text-align: center;
  padding: var(--space-6);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
}

.empty-state__heading {
  margin: 0;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
}

.empty-state__sub {
  margin: 0;
}

.empty-state__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  justify-content: center;
}

.empty-state__chip {
  font-size: var(--font-size-xs);
  color: var(--color-text-faint);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-full);
  padding: 3px var(--space-3);
  white-space: nowrap;
}

.empty-state__actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.empty-state__add-btn {
  background: none;
  border: 1.5px solid var(--color-mint);
  border-radius: var(--radius-md);
  color: var(--color-mint);
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  padding: var(--space-2) var(--space-5);
  cursor: pointer;
  min-height: 44px;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
.empty-state__add-btn:active {
  background: var(--color-mint-soft);
}

.empty-state__help-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-mint);
  border-radius: var(--radius-md);
  color: var(--color-mint);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  padding: var(--space-2) var(--space-4);
  min-height: 36px;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
.empty-state__help-link:active {
  background: var(--color-mint-soft);
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
