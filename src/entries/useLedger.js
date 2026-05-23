import { ref, computed, watch } from 'vue'
import { entries } from '@/entries/useEntries.js'
import { groupEntries } from '@/utils/ledgerGrouper.js'
import { applyLedgerSortOrder } from '@/utils/ledgerSort.js'
import { calculateStats } from '@/utils/statsCalculator.js'
import { todayString } from '@/utils/dateUtils.js'
import { weekOf } from '@/utils/weekUtils.js'

// Module-level collapse state — persists across re-renders, resets on baby switch.
const _openMonths   = ref(new Set())

// Display-only sort order — non-sensitive UI preference, safe for localStorage.
// Only 'newest-first' and 'oldest-first' are valid; anything else falls back to 'newest-first'.
const _SORT_KEY = 'jojo_entrySortOrder'
const _storedSort = localStorage.getItem(_SORT_KEY)
const _entrySortOrder = ref(_storedSort === 'oldest-first' ? 'oldest-first' : 'newest-first')
watch(_entrySortOrder, (v) => localStorage.setItem(_SORT_KEY, v))
const _openWeekKeys = ref(new Set())   // key: `${monthKey}:${weekStartDate}`
const _openDays     = ref(new Set())   // multiple days may be open simultaneously

let _initialized = false

const grouped        = computed(() => groupEntries(entries.value))
const displayGrouped = computed(() => applyLedgerSortOrder(grouped.value, _entrySortOrder.value))
const stats          = computed(() => calculateStats(entries.value, todayString()))

const mostRecentDate = computed(() => {
  const months = grouped.value.months
  if (!months.length) return null
  const firstWeek = months[0].weekSegments[0]
  if (!firstWeek?.days.length) return null
  return firstWeek.days[0].date
})

// Open current month → most recent week → most recent day on first load.
watch(grouped, (g) => {
  if (_initialized) return
  const months = g.months
  if (!months.length) return

  const todayKey    = todayString().slice(0, 7)
  const targetMonth = months.find(m => m.monthKey === todayKey) ?? months[0]

  _openMonths.value = new Set([targetMonth.monthKey])

  const targetWeek = targetMonth.weekSegments[0]
  if (!targetWeek) { _initialized = true; return }

  _openWeekKeys.value = new Set([`${targetMonth.monthKey}:${targetWeek.weekStartDate}`])

  const targetDay = targetWeek.days[0]
  if (!targetDay) { _initialized = true; return }

  _openDays.value = new Set([targetDay.date])
  _initialized    = true
})

// Reset when entries are cleared (baby switch or sign-out).
watch(entries, (e) => {
  if (e.length === 0) {
    _initialized        = false
    _openMonths.value   = new Set()
    _openWeekKeys.value = new Set()
    _openDays.value     = new Set()
  }
})

function toggleMonth(monthKey) {
  const next = new Set(_openMonths.value)
  if (next.has(monthKey)) {
    next.delete(monthKey)
    // Also close all week keys and days under this month.
    const nextWeeks = new Set(_openWeekKeys.value)
    for (const k of [...nextWeeks]) {
      if (k.startsWith(monthKey + ':')) nextWeeks.delete(k)
    }
    _openWeekKeys.value = nextWeeks
    const month = grouped.value.months.find(m => m.monthKey === monthKey)
    if (month) {
      const nextDays = new Set(_openDays.value)
      for (const week of month.weekSegments) {
        for (const day of week.days) nextDays.delete(day.date)
      }
      _openDays.value = nextDays
    }
  } else {
    next.add(monthKey)
  }
  _openMonths.value = next
}

function toggleWeek(monthKey, weekStartDate) {
  const weekKey = `${monthKey}:${weekStartDate}`
  const next    = new Set(_openWeekKeys.value)
  if (next.has(weekKey)) {
    next.delete(weekKey)
    // Also close any days in this week.
    const month = grouped.value.months.find(m => m.monthKey === monthKey)
    const week  = month?.weekSegments.find(w => w.weekStartDate === weekStartDate)
    if (week) {
      const nextDays = new Set(_openDays.value)
      for (const day of week.days) nextDays.delete(day.date)
      _openDays.value = nextDays
    }
  } else {
    next.add(weekKey)
  }
  _openWeekKeys.value = next
}

function toggleDay(date) {
  const next = new Set(_openDays.value)
  if (next.has(date)) next.delete(date)
  else next.add(date)
  _openDays.value = next
}

// Open the month, week, and day for a given date (used after creating a new entry).
function openDay(date) {
  const monthKey      = date.slice(0, 7)
  const weekStartDate = weekOf(date)
  const weekKey       = `${monthKey}:${weekStartDate}`

  _openMonths.value   = new Set([..._openMonths.value,   monthKey])
  _openWeekKeys.value = new Set([..._openWeekKeys.value, weekKey])
  _openDays.value     = new Set([..._openDays.value,     date])
}

export function useLedger() {
  return {
    displayGrouped,
    stats,
    mostRecentDate,
    openMonths:     _openMonths,
    openWeekKeys:   _openWeekKeys,
    openDays:       _openDays,
    entrySortOrder: _entrySortOrder,
    toggleMonth,
    toggleWeek,
    toggleDay,
    openDay,
  }
}
