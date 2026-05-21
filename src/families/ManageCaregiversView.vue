<!-- Manage Caregivers — member list and invite code generation (Owner only). -->
<template>
  <AppLayout>
    <template #header>
      <router-link class="back-btn" to="/" aria-label="Back">←</router-link>
      <span class="header-title">Manage Caregivers</span>
    </template>

    <!-- Member list -->
    <AppCard>
      <h2 class="section-heading">Members</h2>
      <div v-if="membersLoading" class="state-msg">
        <p class="text-faint text-sm">Loading…</p>
      </div>
      <div v-else-if="members.length === 0" class="state-msg">
        <p class="text-faint text-sm">No members found.</p>
      </div>
      <ul v-else class="member-list">
        <li v-for="m in members" :key="m.userId" class="member-row">
          <div class="member-identity">
            <span class="member-label">{{ m.displayLabel }}</span>
            <span v-if="m.initials" class="member-initials text-faint text-xs">{{ m.initials }}</span>
          </div>
          <span class="member-role" :class="`member-role--${m.role}`">
            {{ m.role === 'owner' ? 'Owner' : 'Caregiver' }}
          </span>
        </li>
      </ul>
    </AppCard>

    <!-- Invite section (owner only) -->
    <AppCard v-if="isOwner">
      <h2 class="section-heading">Invite a caregiver</h2>
      <p class="text-soft text-sm invite-desc">
        Generate a one-time code. Share it with the new caregiver — they enter it
        at sign-up on the <strong>Join family</strong> screen. Codes expire in 7 days.
      </p>

      <AppButton variant="secondary" :disabled="generating" @click="handleGenerate">
        {{ generating ? 'Generating…' : 'Generate invite code' }}
      </AppButton>

      <!-- Show generated code -->
      <div v-if="latestCode" class="code-box">
        <p class="code-label text-soft text-xs">Share this code:</p>
        <div class="code-display">
          <span class="code-value">{{ latestCode }}</span>
          <button class="copy-btn" type="button" :title="copied ? 'Copied!' : 'Copy'" @click="handleCopy">
            {{ copied ? '✓' : 'Copy' }}
          </button>
        </div>
        <p class="text-faint text-xs">One-time use. Expires in 7 days.</p>
      </div>

      <p v-if="genError" class="field-error text-sm" role="alert">{{ genError }}</p>
    </AppCard>

    <!-- Active codes (owner only) -->
    <AppCard v-if="isOwner && activeCodes.length > 0">
      <h2 class="section-heading">Pending codes</h2>
      <ul class="code-list">
        <li v-for="c in activeCodes" :key="c.id" class="code-row">
          <span class="code-item-value text-sm">{{ c.code }}</span>
          <button class="revoke-btn text-xs" type="button" @click="handleRevoke(c)">Revoke</button>
        </li>
      </ul>
    </AppCard>

    <p v-if="!isOwner" class="text-faint text-sm owner-notice">
      Only owners can invite or remove caregivers.
    </p>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '@/ui/AppLayout.vue'
import AppCard   from '@/ui/AppCard.vue'
import AppButton from '@/ui/AppButton.vue'
import { useFamily } from '@/families/useFamily.js'
import { useAuth }   from '@/auth/useAuth.js'
import { getDocs, collection } from 'firebase/firestore'
import { db } from '@/app/firebase.js'
import { createInviteCode, listActiveCodes, revokeInviteCode } from '@/families/inviteService.js'

const { familyId, isOwner, currentMember } = useFamily()
const { currentUser } = useAuth()

const members        = ref([])
const membersLoading = ref(false)
const activeCodes    = ref([])

const generating = ref(false)
const latestCode = ref('')
const genError   = ref('')
const copied     = ref(false)

onMounted(async () => {
  await Promise.all([loadMembers(), loadActiveCodes()])
})

async function loadMembers() {
  if (!familyId.value) return
  membersLoading.value = true
  try {
    const snap = await getDocs(collection(db, 'families', familyId.value, 'members'))
    members.value = snap.docs.map(d => d.data()).sort((a, b) => {
      if (a.role === 'owner' && b.role !== 'owner') return -1
      if (b.role === 'owner' && a.role !== 'owner') return  1
      return (a.displayLabel ?? '').localeCompare(b.displayLabel ?? '')
    })
  } catch (e) {
    console.error('[ManageCaregiversView] loadMembers failed', e)
  } finally {
    membersLoading.value = false
  }
}

async function loadActiveCodes() {
  if (!familyId.value || !isOwner.value) return
  try {
    activeCodes.value = await listActiveCodes(familyId.value)
  } catch (e) {
    console.error('[ManageCaregiversView] listActiveCodes failed', e)
  }
}

async function handleGenerate() {
  genError.value  = ''
  generating.value = true
  try {
    const code = await createInviteCode(familyId.value, currentUser.value.uid)
    latestCode.value = code
    await loadActiveCodes()
  } catch (e) {
    console.error('[ManageCaregiversView] createInviteCode failed', e)
    genError.value = 'Could not generate code. Check your connection.'
  } finally {
    generating.value = false
  }
}

async function handleRevoke(codeObj) {
  try {
    await revokeInviteCode(familyId.value, codeObj.id)
    if (latestCode.value === codeObj.code) latestCode.value = ''
    await loadActiveCodes()
  } catch (e) {
    console.error('[ManageCaregiversView] revokeInviteCode failed', e)
  }
}

async function handleCopy() {
  try {
    await navigator.clipboard.writeText(latestCode.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // Clipboard API unavailable — user can select manually
  }
}
</script>

<style scoped>
.back-btn {
  color: var(--color-text-soft);
  text-decoration: none;
  font-size: var(--font-size-lg);
  line-height: 1;
  flex-shrink: 0;
}

.header-title {
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-md);
}

.section-heading {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-3);
}

.state-msg {
  padding: var(--space-4) 0;
  text-align: center;
}

.member-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.member-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-border-soft);
}

.member-row:last-child { border-bottom: none; }

.member-identity {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
}

.member-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.member-role {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: var(--color-surface-alt);
  color: var(--color-text-soft);
}

.member-role--owner {
  background: var(--color-mint-soft);
  color: var(--color-success);
}

.invite-desc { margin-bottom: var(--space-4); }

.code-box {
  margin-top: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface-alt);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.code-label { text-transform: uppercase; letter-spacing: 0.04em; }

.code-display {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.code-value {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.15em;
  color: var(--color-text);
}

.copy-btn {
  padding: var(--space-1) var(--space-3);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.copy-btn:hover { background: var(--color-mint-soft); border-color: var(--color-mint); }

.code-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.code-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-3);
  background: var(--color-surface-alt);
  border-radius: var(--radius-sm);
}

.code-item-value {
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.1em;
}

.revoke-btn {
  padding: 2px var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--color-error);
  cursor: pointer;
  font-size: var(--font-size-xs);
}

.field-error {
  color: var(--color-error);
  margin-top: var(--space-2);
}

.owner-notice {
  text-align: center;
  padding: var(--space-4);
}

:deep(.page-container) { display: flex; flex-direction: column; gap: var(--space-4); }
</style>
