// Module-level singleton — caches weekly settings by (familyId:babyId:weekStartDate).
// Uses one-time getDoc reads (no listeners). Cache survives baby switches safely
// because keys embed babyId — stale entries are never accessed after a switch.
import { reactive } from 'vue'
import { useFamily, currentMember } from '@/families/useFamily.js'
import { useBabies } from '@/babies/useBabies.js'
import { getWeeklySettings, setWeeklySettings } from '@/babies/babyService.js'

const _cache   = reactive({})  // key → { usualBottleAmountMl: number | null }
const _pending = new Set()

const { familyId }    = useFamily()
const { activeBabyId } = useBabies()

function _key(weekStartDate) {
  return `${familyId.value}:${activeBabyId.value}:${weekStartDate}`
}

async function loadWeekSettings(weekStartDate) {
  if (!familyId.value || !activeBabyId.value) return
  const key = _key(weekStartDate)
  if (key in _cache || _pending.has(key)) return
  _pending.add(key)
  try {
    const data   = await getWeeklySettings(familyId.value, activeBabyId.value, weekStartDate)
    _cache[key]  = { usualBottleAmountMl: data?.usualBottleAmountMl ?? null }
  } catch (e) {
    console.error('[useWeeklySettings] load failed', weekStartDate, e)
  } finally {
    _pending.delete(key)
  }
}

function getBottleAmount(weekStartDate) {
  if (!familyId.value || !activeBabyId.value) return null
  return _cache[_key(weekStartDate)]?.usualBottleAmountMl ?? null
}

async function saveBottleAmount(weekStartDate, amountMl) {
  if (!familyId.value || !activeBabyId.value) return
  await setWeeklySettings(
    familyId.value, activeBabyId.value, weekStartDate,
    { usualBottleAmountMl: amountMl },
    currentMember.value
  )
  _cache[_key(weekStartDate)] = { usualBottleAmountMl: amountMl }
}

export function useWeeklySettings() {
  return { loadWeekSettings, getBottleAmount, saveBottleAmount }
}
