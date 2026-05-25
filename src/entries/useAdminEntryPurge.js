// Admin-only hard-delete utility for test/dummy entries.
// deleteDoc and writeBatch are used ONLY here — this is the single hard-delete path.
// Normal app deletes remain soft-delete (deleted: true) via softDeleteEntry.
import { db } from '@/app/firebase.js'
import { doc, collection, writeBatch } from 'firebase/firestore'
import { useFamily }  from '@/families/useFamily.js'
import { useBabies }  from '@/babies/useBabies.js'

const { familyId }    = useFamily()
const { activeBabyId } = useBabies()

const BATCH_SIZE = 450

/**
 * Hard-delete entries where source !== "legacy" for the active baby.
 *
 * @param {Array} entries - entries to purge (should already be filtered to source !== "legacy")
 * @returns {{ deleted: number, skipped: number }}
 */
export async function purgeTestEntries(entries) {
  if (!familyId.value || !activeBabyId.value) {
    throw new Error('No active family or baby')
  }

  // Safety: skip any entry that has source === "legacy" even if caller passed it
  const toDelete = entries.filter(e => e.source !== 'legacy')
  const skipped  = entries.length - toDelete.length

  if (toDelete.length === 0) return { deleted: 0, skipped }

  const entriesCol = collection(
    db, 'families', familyId.value, 'babies', activeBabyId.value, 'entries'
  )

  let deleted = 0
  for (let i = 0; i < toDelete.length; i += BATCH_SIZE) {
    const chunk = toDelete.slice(i, i + BATCH_SIZE)
    const batch = writeBatch(db)
    for (const entry of chunk) {
      batch.delete(doc(entriesCol, entry.id))
    }
    await batch.commit()
    deleted += chunk.length
  }

  return { deleted, skipped }
}
