import { db } from '@/app/firebase.js'
import {
  doc, getDoc, setDoc, updateDoc,
  collection, getDocs,
  serverTimestamp
} from 'firebase/firestore'

export async function createBaby(familyId, { nickname, birthdate, defaultNextEntryIntervalMinutes }, ownerUid) {
  const ref = doc(collection(db, 'families', familyId, 'babies'))
  await setDoc(ref, {
    nickname,
    birthdate: birthdate || null,
    defaultNextEntryIntervalMinutes: defaultNextEntryIntervalMinutes ?? 180,
    status: 'active',
    createdAt: serverTimestamp(),
    createdByUserId: ownerUid,
    updatedAt: serverTimestamp()
  })
  return ref.id
}

export async function getBabies(familyId) {
  const snap = await getDocs(collection(db, 'families', familyId, 'babies'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getBaby(familyId, babyId) {
  const snap = await getDoc(doc(db, 'families', familyId, 'babies', babyId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function updateBaby(familyId, babyId, changes) {
  await updateDoc(doc(db, 'families', familyId, 'babies', babyId), {
    ...changes,
    updatedAt: serverTimestamp()
  })
}
