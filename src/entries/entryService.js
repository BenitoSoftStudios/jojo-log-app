import { db } from '@/app/firebase.js'
import {
  collection, doc, setDoc, updateDoc,
  onSnapshot, query, serverTimestamp
} from 'firebase/firestore'

// Only these fields may be supplied by callers to updateEntry.
// All provenance, source, and delete fields are service-controlled.
const MUTABLE_FIELDS = new Set([
  'entryDate', 'entryTime', 'amountMl', 'diaper',
  'vitaminD', 'medication', 'tummyTime', 'tummyTimeCount', 'notes'
])

function entriesCol(familyId, babyId) {
  return collection(db, 'families', familyId, 'babies', babyId, 'entries')
}

function entryRef(familyId, babyId, entryId) {
  return doc(db, 'families', familyId, 'babies', babyId, 'entries', entryId)
}

// Returns an unsubscribe function. onUpdate receives a Firestore QuerySnapshot.
export function subscribeToEntries(familyId, babyId, onUpdate, onError) {
  return onSnapshot(query(entriesCol(familyId, babyId)), onUpdate, onError)
}

// Creates a complete entry document. All provenance fields are stamped here;
// the caller cannot supply or override them.
export async function createEntry(familyId, babyId, fields, member) {
  const ref = doc(entriesCol(familyId, babyId))
  await setDoc(ref, {
    entryDate:       fields.entryDate,
    entryTime:       fields.entryTime,
    amountMl:        fields.amountMl        ?? null,
    diaper:          fields.diaper          ?? null,
    vitaminD:        fields.vitaminD        ?? false,
    medication:      fields.medication      ?? false,
    tummyTime:       fields.tummyTime       ?? false,
    tummyTimeCount:  fields.tummyTimeCount  ?? 0,
    notes:           fields.notes           ?? '',
    source:          'app',
    createdByUserId: member.userId,
    createdByLabel:  member.displayLabel,
    createdAt:       serverTimestamp(),
    updatedByUserId: null,
    updatedByLabel:  null,
    updatedAt:       serverTimestamp(),
    deleted:         false,
    deletedAt:       null,
    deletedByUserId: null,
    deletedByLabel:  null,
  })
  return ref.id
}

// Updates only the mutable fields from changes. Any provenance or immutable
// field the caller passes is silently discarded before the write.
export async function updateEntry(familyId, babyId, entryId, changes, member) {
  const safe = {}
  for (const key of Object.keys(changes)) {
    if (MUTABLE_FIELDS.has(key)) safe[key] = changes[key]
  }
  await updateDoc(entryRef(familyId, babyId, entryId), {
    ...safe,
    updatedByUserId: member.userId,
    updatedByLabel:  member.displayLabel,
    updatedAt:       serverTimestamp(),
  })
}

// Soft-delete: sets deleted flag and stamps who deleted it. Hard delete is never used.
export async function softDeleteEntry(familyId, babyId, entryId, member) {
  await updateDoc(entryRef(familyId, babyId, entryId), {
    deleted:         true,
    deletedAt:       serverTimestamp(),
    deletedByUserId: member.userId,
    deletedByLabel:  member.displayLabel,
    updatedAt:       serverTimestamp(),
  })
}

// Restore: clears deleted flag and all deleted-by fields.
export async function restoreEntry(familyId, babyId, entryId, member) {
  await updateDoc(entryRef(familyId, babyId, entryId), {
    deleted:         false,
    deletedAt:       null,
    deletedByUserId: null,
    deletedByLabel:  null,
    updatedByUserId: member.userId,
    updatedByLabel:  member.displayLabel,
    updatedAt:       serverTimestamp(),
  })
}
