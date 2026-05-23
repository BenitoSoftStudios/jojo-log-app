// Module-level singleton — babies list shared across the app.
// Phase 4+ (useEntries) depends on the active baby's Firestore path.
import { ref, computed, readonly } from 'vue'
import { getBabies, createBaby, updateBaby } from './babyService.js'

const _babies       = ref([])
const _activeBabyId = ref(null)
const _loading      = ref(false)
let   _familyId     = null

export const babies = readonly(_babies)

export function useBabies() {
  const activeBabies = computed(() => _babies.value.filter(b => b.status === 'active'))
  const activeBaby   = computed(() => _babies.value.find(b => b.id === _activeBabyId.value) ?? null)

  async function loadBabies(familyId) {
    _familyId      = familyId
    _loading.value = true
    try {
      const list    = await getBabies(familyId)
      _babies.value = list
      const active  = list.filter(b => b.status === 'active')
      const stored  = localStorage.getItem('jojo_babyId')

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

  async function createBabyForFamily(fields, ownerUid) {
    if (!_familyId) return null
    const babyId  = await createBaby(_familyId, fields, ownerUid)
    const newBaby = {
      id:                              babyId,
      nickname:                        fields.nickname,
      birthdate:                       fields.birthdate || null,
      defaultNextEntryIntervalMinutes: fields.defaultNextEntryIntervalMinutes ?? 180,
      status:                          'active',
    }
    _babies.value = [..._babies.value, newBaby]
    selectBaby(babyId)
    return babyId
  }

  async function updateActiveBaby(changes) {
    if (!_activeBabyId.value || !_familyId) return
    await updateBaby(_familyId, _activeBabyId.value, changes)
    _babies.value = _babies.value.map(b =>
      b.id === _activeBabyId.value ? { ...b, ...changes } : b
    )
  }

  async function archiveActiveBaby() {
    if (!_activeBabyId.value || !_familyId) return
    const babyId = _activeBabyId.value
    await updateBaby(_familyId, babyId, { status: 'inactive' })
    _babies.value = _babies.value.map(b =>
      b.id === babyId ? { ...b, status: 'inactive' } : b
    )
    const remaining = _babies.value.filter(b => b.status === 'active')
    if (remaining.length > 0) {
      selectBaby(remaining[0].id)
    } else {
      _activeBabyId.value = null
      localStorage.removeItem('jojo_babyId')
    }
  }

  function clearBabies() {
    _babies.value       = []
    _activeBabyId.value = null
    _familyId           = null
  }

  return {
    babies,
    activeBabies,
    activeBaby,
    activeBabyId:        readonly(_activeBabyId),
    loading:             readonly(_loading),
    loadBabies,
    selectBaby,
    createBabyForFamily,
    updateActiveBaby,
    archiveActiveBaby,
    clearBabies,
  }
}
