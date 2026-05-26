// Module-level singleton — family and member state shared across the entire app.
// family and currentMember are also exported directly so Phase 4+ service layers
// (useEntries) can access currentMember for provenance without prop-drilling.
import { ref, computed, readonly } from 'vue'
import { getFamily, getMember, findFamilyIdForUser } from './familyService.js'
import { currentUser } from '@/auth/useAuth.js'

const _family        = ref(null)
const _currentMember = ref(null)
const _loading       = ref(false)
const _error         = ref('')

export const family        = readonly(_family)
export const currentMember = readonly(_currentMember)

export function useFamily() {
  const familyId              = computed(() => _family.value?.id ?? null)
  const isOwner               = computed(() => _currentMember.value?.role === 'owner')
  const isLegacyImportAdmin   = computed(() =>
    _currentMember.value?.role === 'owner' &&
    _currentMember.value?.legacyImportAdmin === true
  )
  const hasDisplayLabel       = computed(() => !!_currentMember.value?.displayLabel)

  async function loadFamily(uid) {
    _loading.value = true
    _error.value   = ''
    try {
      let fId = localStorage.getItem('jojo_familyId')
      if (!fId) {
        fId = await findFamilyIdForUser(uid)
        if (fId) localStorage.setItem('jojo_familyId', fId)
      }
      if (!fId) {
        _family.value        = null
        _currentMember.value = null
        return null
      }

      const [familyData, memberData] = await Promise.all([
        getFamily(fId),
        getMember(fId, uid)
      ])
      _family.value        = familyData
      _currentMember.value = memberData
      return fId
    } catch (e) {
      console.error('[useFamily] loadFamily failed | code:', e.code, '| message:', e.message, e)
      _error.value = e.message
      return null
    } finally {
      _loading.value = false
    }
  }

  async function refreshCurrentMember() {
    const fId = _family.value?.id
    const uid = currentUser.value?.uid
    if (!fId || !uid) return
    try {
      _currentMember.value = await getMember(fId, uid)
    } catch (e) {
      console.error('[useFamily] refreshCurrentMember failed | code:', e.code, '| message:', e.message, e)
    }
  }

  function clearFamily() {
    _family.value        = null
    _currentMember.value = null
    _error.value         = ''
  }

  return {
    family,
    currentMember,
    familyId,
    isOwner,
    isLegacyImportAdmin,
    hasDisplayLabel,
    loading: readonly(_loading),
    error:   readonly(_error),
    loadFamily,
    refreshCurrentMember,
    clearFamily
  }
}
