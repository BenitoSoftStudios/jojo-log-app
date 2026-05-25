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

export async function addMember(familyId, { userId, email, role, displayLabel, initials, joinedViaInviteId = null }) {
  await setDoc(doc(db, 'families', familyId, 'members', userId), {
    userId,
    email,
    role,
    displayLabel,
    initials: initials || '',
    joinedAt: serverTimestamp(),
    invitedByUserId: null,
    joinedViaInviteId,
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

export async function createInvite(familyId, { createdByUserId, createdByLabel, role = 'caregiver' }) {
  const code = Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  const inviteRef = doc(collection(db, 'families', familyId, 'invites'))
  const inviteId = inviteRef.id
  await setDoc(inviteRef, {
    inviteId,
    code,
    role,
    status: 'active',
    createdAt: serverTimestamp(),
    createdByUserId,
    createdByLabel,
    acceptedAt: null,
    acceptedByUserId: null,
    acceptedByLabel: null,
    revokedAt: null,
    revokedByUserId: null,
    revokedByLabel: null,
  })
  return { inviteId, code }
}

export async function getInvite(familyId, inviteId) {
  const snap = await getDoc(doc(db, 'families', familyId, 'invites', inviteId))
  return snap.exists() ? snap.data() : null
}

export async function listActiveInvites(familyId) {
  const q = query(
    collection(db, 'families', familyId, 'invites'),
    where('status', '==', 'active')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data())
}

export async function revokeInvite(familyId, inviteId, { revokedByUserId, revokedByLabel }) {
  await updateDoc(doc(db, 'families', familyId, 'invites', inviteId), {
    status: 'revoked',
    revokedAt: serverTimestamp(),
    revokedByUserId,
    revokedByLabel,
  })
}

export async function acceptInvite(familyId, inviteId, { acceptedByUserId, acceptedByLabel }) {
  await updateDoc(doc(db, 'families', familyId, 'invites', inviteId), {
    status: 'accepted',
    acceptedAt: serverTimestamp(),
    acceptedByUserId,
    acceptedByLabel,
  })
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
