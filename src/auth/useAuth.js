// Module-level singleton — one onAuthStateChanged listener for the entire app lifetime.
// currentUser and authReady are exported directly so the router guard can import them
// without calling hooks outside of component setup.
import { ref, computed, readonly } from 'vue'
import { auth } from '@/app/firebase.js'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth'

const _currentUser = ref(null)
const _authReady   = ref(false)

onAuthStateChanged(auth, user => {
  _currentUser.value = user
  _authReady.value   = true
})

export const currentUser = readonly(_currentUser)
export const authReady   = readonly(_authReady)

export function useAuth() {
  const isSignedIn = computed(() => !!_currentUser.value)

  async function signUp(email, password) {
    const { user } = await createUserWithEmailAndPassword(auth, email, password)
    return user
  }

  async function signIn(email, password) {
    const { user } = await signInWithEmailAndPassword(auth, email, password)
    return user
  }

  async function signOut() {
    await firebaseSignOut(auth)
    localStorage.removeItem('jojo_familyId')
    localStorage.removeItem('jojo_babyId')
  }

  return { currentUser, authReady, isSignedIn, signUp, signIn, signOut }
}
