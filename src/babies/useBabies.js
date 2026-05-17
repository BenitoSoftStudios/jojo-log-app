// Module-level singleton — babies list shared across the app.
// Phase 4+ (useEntries) depends on the active baby's Firestore path.
import { ref, computed, readonly } from 'vue'
import { getBabies } from './babyService.js'

const _babies       = ref([])
const _activeBabyId = ref(null)
const _loading      = ref(false)

export const babies = readonly(_babies)

export function useBabies() {
  const activeBabies = computed(() => _babies.value.filter(b => b.status === 'active'))
  const activeBaby   = computed(() => _babies.value.find(b => b.id === _activeBabyId.value) ?? null)

  async function loadBabies(familyId) {
    _loading.value = true
    try {
      const list      = await getBabies(familyId)
      _babies.value   = list
      const active    = list.filter(b => b.status === 'active')
      const stored    = localStorage.getItem('jojo_babyId')

      if (stored && active.some(b => b.id === stored)) {
        _activeBabyId.value = stored
      } else if (active.length > 0) {
        _activeBabyId.value = active[0].id
        localStorage.setItem('jojo_babyId', active[0].id)
      }
    } finally {
      _loading.value = false
    }
  }

  function selectBaby(babyId) {
    _activeBabyId.value = babyId
    localStorage.setItem('jojo_babyId', babyId)
  }

  function clearBabies() {
    _babies.value       = []
    _activeBabyId.value = null
  }

  return {
    babies,
    activeBabies,
    activeBaby,
    activeBabyId: readonly(_activeBabyId),
    loading:      readonly(_loading),
    loadBabies,
    selectBaby,
    clearBabies
  }
}
