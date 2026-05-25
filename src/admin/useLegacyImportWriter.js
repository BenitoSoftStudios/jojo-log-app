// Admin-only legacy CSV import write utility.
// writeBatch + setDoc are used here to write deterministic legacy-csv-* entry docs.
// Import is idempotent: re-running overwrites the same doc IDs, no duplicates.
import { db } from '@/app/firebase.js'
import { doc, collection, writeBatch, serverTimestamp } from 'firebase/firestore'
import { useFamily }  from '@/families/useFamily.js'
import { useBabies }  from '@/babies/useBabies.js'

const { familyId }     = useFamily()
const { activeBabyId } = useBabies()

const BATCH_SIZE = 450

/**
 * Write transformed legacy CSV entries into Firestore under the active baby.
 * Uses deterministic entry IDs (legacy-csv-NNNNNN) so the operation is idempotent.
 *
 * @param {Array}    entries    - from legacyCsvParser.transformRows()
 * @param {function} onProgress - optional; called with { batchIndex, batchCount, written }
 * @returns {{ written: number, batchCount: number }}
 */
export async function writeLegacyEntries(entries, onProgress) {
  if (!familyId.value || !activeBabyId.value) {
    throw new Error('No active family or baby')
  }
  if (entries.length === 0) return { written: 0, batchCount: 0 }

  const entriesCol = collection(
    db, 'families', familyId.value, 'babies', activeBabyId.value, 'entries'
  )

  const chunks = []
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    chunks.push(entries.slice(i, i + BATCH_SIZE))
  }

  const createdAt = serverTimestamp()
  let written = 0

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const batch = writeBatch(db)

    for (const entry of chunk) {
      batch.set(doc(entriesCol, entry.id), {
        entryDate:       entry.entryDate,
        entryTime:       entry.entryTime,
        amountMl:        entry.amountMl,
        diaper:          entry.diaper,
        vitaminD:        entry.vitaminD,
        medication:      entry.medication,
        tummyTimeCount:  entry.tummyTimeCount,
        notes:           entry.notes,
        source:          entry.source,
        createdByLabel:  entry.createdByLabel,
        createdByUserId: entry.createdByUserId,
        createdAt,
        updatedAt:       null,
        updatedByLabel:  null,
        updatedByUserId: null,
        deleted:         entry.deleted,
        deletedAt:       entry.deletedAt,
        deletedByLabel:  entry.deletedByLabel,
        deletedByUserId: entry.deletedByUserId,
      })
    }

    await batch.commit()
    written += chunk.length

    if (onProgress) {
      onProgress({ batchIndex: i + 1, batchCount: chunks.length, written })
    }
  }

  return { written, batchCount: chunks.length }
}

/**
 * Write app-export CSV entries into Firestore under the active baby.
 * Uses entryId from the CSV as the doc ID — idempotent.
 * Timestamps (createdAt, updatedAt, deletedAt) are preserved as strings.
 *
 * @param {Array}    entries    - from appCsvImporter.parseAppCsv().entries
 * @param {function} onProgress - optional; called with { batchIndex, batchCount, written }
 * @returns {{ written: number, batchCount: number }}
 */
export async function writeAppCsvEntries(entries, onProgress) {
  if (!familyId.value || !activeBabyId.value) {
    throw new Error('No active family or baby')
  }
  if (entries.length === 0) return { written: 0, batchCount: 0 }

  const entriesCol = collection(
    db, 'families', familyId.value, 'babies', activeBabyId.value, 'entries'
  )

  const chunks = []
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    chunks.push(entries.slice(i, i + BATCH_SIZE))
  }

  let written = 0

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const batch = writeBatch(db)

    for (const entry of chunk) {
      batch.set(doc(entriesCol, entry.id), {
        entryDate:      entry.entryDate,
        entryTime:      entry.entryTime      ?? null,
        amountMl:       entry.amountMl,
        diaper:         entry.diaper,
        vitaminD:       entry.vitaminD       ?? false,
        medication:     entry.medication     ?? false,
        tummyTimeCount: entry.tummyTimeCount ?? 0,
        notes:          entry.notes          ?? '',
        source:         entry.source         ?? null,
        createdByLabel: entry.createdByLabel ?? null,
        createdAt:      entry.createdAt      ?? null,
        updatedByLabel: entry.updatedByLabel ?? null,
        updatedAt:      entry.updatedAt      ?? null,
        deleted:        entry.deleted        ?? false,
        deletedAt:      entry.deletedAt      ?? null,
      })
    }

    await batch.commit()
    written += chunk.length

    if (onProgress) {
      onProgress({ batchIndex: i + 1, batchCount: chunks.length, written })
    }
  }

  return { written, batchCount: chunks.length }
}
