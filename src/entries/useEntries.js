import { ref, readonly, watch } from 'vue'
import { useFamily, currentMember } from '@/families/useFamily.js'
import { useBabies } from '@/babies/useBabies.js'
import {
  subscribeToEntries,
  createEntry   as _createEntry,
  updateEntry   as _updateEntry,
  softDeleteEntry as _softDeleteEntry,
  restoreEntry  as _restoreEntry,
} from './entryService.js'

// Module-level singleton — one Firestore listener shared across the entire app lifetime.
const _entries        = ref([])
const _deletedEntries = ref([])
const _syncStatus     = ref('synced')

let _unsubscribe    = null
let _activeFamilyId = null
let _activeBabyId   = null

export const entries        = readonly(_entries)
export const deletedEntries = readonly(_deletedEntries)
export const syncStatus     = readonly(_syncStatus)

function handleSnapshot(snap) {
  const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))

  // entryDate DESC, entryTime ASC within each date
  all.sort((a, b) => {
    if (a.entryDate > b.entryDate) return -1
    if (a.entryDate < b.entryDate) return  1
    return a.entryTime < b.entryTime ? -1 : a.entryTime > b.entryTime ? 1 : 0
  })

  _entries.value        = all.filter(e => !e.deleted)
  _deletedEntries.value = all.filter(e =>  e.deleted)
  _syncStatus.value     = snap.metadata.fromCache ? 'offline' : 'synced'
}

function handleError(e) {
  console.error('[useEntries] snapshot error | code:', e.code, '| message:', e.message, e)
  _syncStatus.value = 'error'
}

function resubscribe(familyId, babyId) {
  if (_unsubscribe) {
    _unsubscribe()
    _unsubscribe = null
  }
  _entries.value        = []
  _deletedEntries.value = []
  _syncStatus.value     = 'synced'
  _activeFamilyId       = null
  _activeBabyId         = null

  if (!familyId || !babyId) return

  _activeFamilyId = familyId
  _activeBabyId   = babyId
  _unsubscribe    = subscribeToEntries(familyId, babyId, handleSnapshot, handleError)
}

// Module-level watch manages the subscription for the entire app lifetime.
// Moving this out of useEntries() prevents any single component's unmount from
// killing the shared singleton subscription.
const { familyId }     = useFamily()
const { activeBabyId } = useBabies()

watch(
  [familyId, activeBabyId],
  ([fid, bid]) => {
    if (fid !== _activeFamilyId || bid !== _activeBabyId) {
      resubscribe(fid, bid)
    }
  },
  { immediate: true }
)

export function useEntries() {
  async function createEntry(fields) {
    await _createEntry(_activeFamilyId, _activeBabyId, fields, currentMember.value)
  }

  async function updateEntry(entryId, changes) {
    await _updateEntry(_activeFamilyId, _activeBabyId, entryId, changes, currentMember.value)
  }

  async function softDeleteEntry(entryId) {
    await _softDeleteEntry(_activeFamilyId, _activeBabyId, entryId, currentMember.value)
  }

  async function restoreEntry(entryId) {
    await _restoreEntry(_activeFamilyId, _activeBabyId, entryId, currentMember.value)
  }

  return {
    entries,
    deletedEntries,
    syncStatus,
    createEntry,
    updateEntry,
    softDeleteEntry,
    restoreEntry,
  }
}
