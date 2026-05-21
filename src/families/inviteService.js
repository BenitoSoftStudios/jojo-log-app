import { db } from '@/app/firebase.js'
import {
  collection, collectionGroup, doc, addDoc, updateDoc,
  query, where, getDocs, limit, serverTimestamp, Timestamp
} from 'firebase/firestore'
import { addMember } from './familyService.js'

function inviteCodesCol(familyId) {
  return collection(db, 'families', familyId, 'inviteCodes')
}

function randomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

/**
 * Generate and store a new one-time invite code.
 * Returns the generated code string.
 */
export async function createInviteCode(familyId, ownerUserId) {
  const code = randomCode()
  const expiresAt = Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))

  await addDoc(inviteCodesCol(familyId), {
    code,
    familyId,
    role: 'caregiver',
    createdByUserId: ownerUserId,
    createdAt: serverTimestamp(),
    expiresAt,
    usedAt: null,
    usedByUserId: null,
    revokedAt: null
  })

  return code
}

/**
 * List all unused, non-expired, non-revoked invite codes for a family.
 */
export async function listActiveCodes(familyId) {
  const now = Timestamp.now()
  const q = query(
    inviteCodesCol(familyId),
    where('usedAt', '==', null),
    where('revokedAt', '==', null)
  )
  const snap = await getDocs(q)
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(c => !c.expiresAt || c.expiresAt.seconds > now.seconds)
}

/**
 * Revoke an invite code by id.
 */
export async function revokeInviteCode(familyId, codeDocId) {
  await updateDoc(doc(inviteCodesCol(familyId), codeDocId), {
    revokedAt: serverTimestamp()
  })
}

/**
 * Search all families for a valid invite code (case-insensitive).
 * Returns { familyId, codeDocId, role } or null.
 *
 * NOTE: This requires a Firestore collection group query across all inviteCodes sub-collections.
 * For MVP, we store the code globally in a top-level `inviteCodes` lookup collection instead,
 * to avoid requiring a collection group index.
 */
export async function findInviteCode(rawCode) {
  const code = rawCode.trim().toUpperCase()

  // Search all families — collection group query (needs index)
  const q = query(
    collectionGroup(db, 'inviteCodes'),
    where('code', '==', code),
    where('usedAt', '==', null),
    where('revokedAt', '==', null),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null

  const docSnap = snap.docs[0]
  const data = docSnap.data()

  const now = Date.now()
  if (data.expiresAt && data.expiresAt.toDate().getTime() < now) return null

  return {
    familyId:   data.familyId,
    codeDocId:  docSnap.id,
    role:       data.role ?? 'caregiver',
    codeDocRef: docSnap.ref
  }
}

/**
 * Redeem an invite code: mark it used and add the user as a member.
 */
export async function redeemInviteCode(code, user, displayLabel, initials) {
  const result = await findInviteCode(code)
  if (!result) throw new Error('Invalid or expired invite code.')

  const { familyId, codeDocRef, role } = result

  await addMember(familyId, {
    userId:       user.uid,
    email:        user.email,
    role,
    displayLabel,
    initials:     initials || ''
  })

  await updateDoc(codeDocRef, {
    usedAt:       serverTimestamp(),
    usedByUserId: user.uid
  })

  return familyId
}
