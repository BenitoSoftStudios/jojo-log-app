import { db } from '@/app/firebase.js'
import {
  doc, getDoc, setDoc, updateDoc,
  collection, collectionGroup,
  query, where, limit, getDocs,
  serverTimestamp
} from 'firebase/firestore'

export async function createFamily({ name, timezone = 'America/Toronto', unitPreference = 'ml' }, ownerUid) {
  const ref = doc(collection(db, 'families'))
  await setDoc(ref, {
    name: name || '',
    timezone,
    unitPreference,
    createdAt: serverTimestamp(),
    createdByUserId: ownerUid,
    updatedAt: serverTimestamp()
  })
  return ref.id
}

export async function getFamily(familyId) {
  const snap = await getDoc(doc(db, 'families', familyId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function updateFamily(familyId, changes) {
  await updateDoc(doc(db, 'families', familyId), {
    ...changes,
    updatedAt: serverTimestamp()
  })
}

export async function addMember(familyId, { userId, email, role, displayLabel, initials }) {
  await setDoc(doc(db, 'families', familyId, 'members', userId), {
    userId,
    email,
    role,
    displayLabel,
    initials: initials || '',
    joinedAt: serverTimestamp(),
    invitedByUserId: null,
    active: true
  })
}

export async function getMember(familyId, userId) {
  const snap = await getDoc(doc(db, 'families', familyId, 'members', userId))
  return snap.exists() ? snap.data() : null
}

export async function updateMember(familyId, userId, changes) {
  await updateDoc(doc(db, 'families', familyId, 'members', userId), changes)
}

// Requires a Firestore collection group index on members.userId.
// See firestore.indexes.json. Used as a fallback when jojo_familyId is not in localStorage
// (e.g. different device or cleared storage).
export async function findFamilyIdForUser(userId) {
  const q = query(
    collectionGroup(db, 'members'),
    where('userId', '==', userId),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  return snap.docs[0].ref.parent.parent.id
}
