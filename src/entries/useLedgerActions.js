import { ref } from 'vue'
import { useEntries } from '@/entries/useEntries.js'
import { useBabies }  from '@/babies/useBabies.js'
import { useLedger }  from '@/entries/useLedger.js'
import { buildNewEntryDefaults } from '@/utils/entryUtils.js'

const { createEntry, updateEntry: _updateEntry, softDeleteEntry } = useEntries()
const { activeBaby } = useBabies()
const { openDay }    = useLedger()

const _writeError = ref('')
let _writeErrorTimer = null

function _setWriteError(msg) {
  _writeError.value = msg
  clearTimeout(_writeErrorTimer)
  _writeErrorTimer = setTimeout(() => { _writeError.value = '' }, 5000)
}

async function createDay(date) {
  const defaults = buildNewEntryDefaults(null, activeBaby.value, null)
  try {
    await createEntry({ entryDate: date, ...defaults })
    openDay(date)
  } catch (e) {
    console.error('[useLedgerActions] createEntry (+ Day) failed', e)
    _setWriteError('Failed to add day. Check your connection and try again.')
  }
}

async function addEntry(day) {
  const lastEntry = day.entries[day.entries.length - 1] ?? null
  const defaults  = buildNewEntryDefaults(lastEntry, activeBaby.value, null)
  try {
    await createEntry({ entryDate: day.date, ...defaults })
  } catch (e) {
    console.error('[useLedgerActions] createEntry failed', e)
    _setWriteError('Failed to add entry. Check your connection.')
  }
}

async function updateEntry(entryId, changes) {
  try {
    await _updateEntry(entryId, changes)
  } catch (e) {
    console.error('[useLedgerActions] updateEntry failed', e)
    _setWriteError('Failed to save change. Check your connection.')
  }
}

async function saveNotes(entryId, notes) {
  try {
    await _updateEntry(entryId, { notes })
  } catch (e) {
    console.error('[useLedgerActions] notes save failed', e)
    _setWriteError('Failed to save notes. Check your connection.')
  }
}

async function deleteEntry(entryId) {
  try {
    await softDeleteEntry(entryId)
    return true
  } catch (e) {
    console.error('[useLedgerActions] softDeleteEntry failed', e)
    _setWriteError('Failed to delete entry. Check your connection.')
    return false
  }
}

export function useLedgerActions() {
  return {
    writeError: _writeError,
    createDay,
    addEntry,
    updateEntry,
    saveNotes,
    deleteEntry,
  }
}
