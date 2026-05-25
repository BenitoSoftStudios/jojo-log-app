<!-- Owner-only: create and revoke invite links for new caregivers. -->
<template>
  <AppLayout>
    <template #header>
      <router-link class="back-btn" to="/" aria-label="Back">←</router-link>
      <span class="header-title">Invite Member</span>
    </template>

    <AppCard>
      <div v-if="loading" class="state-msg text-soft text-sm">Loading…</div>

      <template v-else>
        <div class="create-row">
          <AppButton @click="handleCreate" :disabled="creating">
            {{ creating ? 'Creating…' : '+ New invite link' }}
          </AppButton>
          <p v-if="createError" class="field-error text-sm">{{ createError }}</p>
        </div>

        <div v-if="newLink" class="new-link-box">
          <p class="field-label">Copy and share this link — one-time use:</p>
          <div class="link-row">
            <span class="link-text">{{ newLink }}</span>
            <button class="copy-btn" type="button" @click="copyLink(newLink)">
              {{ copied ? 'Copied!' : 'Copy' }}
            </button>
          </div>
        </div>

        <div v-if="activeInvites.length" class="invite-list">
          <p class="list-label text-soft text-xs">Active invites</p>
          <div v-for="inv in activeInvites" :key="inv.inviteId" class="invite-row">
            <span class="invite-meta text-sm">By {{ inv.createdByLabel }}</span>
            <div class="invite-actions">
              <button class="copy-btn" type="button" @click="copyLink(makeLink(inv))">
                Copy link
              </button>
              <button
                class="revoke-btn"
                type="button"
                :disabled="revoking === inv.inviteId"
                @click="handleRevoke(inv)"
              >
                {{ revoking === inv.inviteId ? 'Revoking…' : 'Revoke' }}
              </button>
            </div>
          </div>
        </div>
        <p v-else class="state-msg text-faint text-sm">No active invites.</p>
      </template>
    </AppCard>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/ui/AppLayout.vue'
import AppCard from '@/ui/AppCard.vue'
import AppButton from '@/ui/AppButton.vue'
import { useFamily } from '@/families/useFamily.js'
import { useAuth } from '@/auth/useAuth.js'
import {
  createInvite,
  listActiveInvites,
  revokeInvite,
} from '@/families/familyService.js'

const router = useRouter()
const { currentUser } = useAuth()
const { familyId, isOwner, currentMember, loadFamily } = useFamily()

const loading       = ref(true)
const creating      = ref(false)
const createError   = ref('')
const newLink       = ref('')
const copied        = ref(false)
const activeInvites = ref([])
const revoking      = ref(null)

onMounted(async () => {
  if (!familyId.value && currentUser.value) {
    await loadFamily(currentUser.value.uid)
  }
  if (!isOwner.value) {
    router.replace('/')
    return
  }
  await refreshInvites()
  loading.value = false
})

async function refreshInvites() {
  activeInvites.value = await listActiveInvites(familyId.value)
}

function makeLink(inv) {
  const base = window.location.origin
  return `${base}/join-family?familyId=${familyId.value}&inviteId=${inv.inviteId}&code=${inv.code}`
}

async function handleCreate() {
  createError.value = ''
  creating.value = true
  newLink.value = ''
  copied.value = false
  try {
    const { inviteId, code } = await createInvite(familyId.value, {
      createdByUserId: currentUser.value.uid,
      createdByLabel: currentMember.value?.displayLabel ?? '',
    })
    newLink.value = makeLink({ inviteId, code })
    await refreshInvites()
  } catch (e) {
    console.error('[InviteFamilyMemberView] createInvite failed', e)
    createError.value = 'Failed to create invite. Try again.'
  } finally {
    creating.value = false
  }
}

async function copyLink(url) {
  try {
    await navigator.clipboard.writeText(url)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // Clipboard API unavailable (non-HTTPS dev) — silently ignore
  }
}

async function handleRevoke(inv) {
  revoking.value = inv.inviteId
  try {
    await revokeInvite(familyId.value, inv.inviteId, {
      revokedByUserId: currentUser.value.uid,
      revokedByLabel: currentMember.value?.displayLabel ?? '',
    })
    activeInvites.value = activeInvites.value.filter(i => i.inviteId !== inv.inviteId)
    if (newLink.value.includes(inv.inviteId)) newLink.value = ''
  } catch (e) {
    console.error('[InviteFamilyMemberView] revokeInvite failed', e)
  } finally {
    revoking.value = null
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

.state-msg {
  padding: var(--space-3) 0;
}

.create-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.new-link-box {
  margin-top: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg);
  border: 1.5px solid var(--color-mint);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.field-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-soft);
}

.link-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.link-text {
  flex: 1;
  font-size: var(--font-size-xs);
  word-break: break-all;
  color: var(--color-text);
  font-family: monospace;
}

.copy-btn {
  flex-shrink: 0;
  padding: var(--space-1) var(--space-3);
  border: 1.5px solid var(--color-mint);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-mint);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
}

.copy-btn:active {
  opacity: 0.7;
}

.invite-list {
  margin-top: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.list-label {
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-1);
}

.invite-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  gap: var(--space-3);
}

.invite-meta {
  color: var(--color-text-soft);
  flex: 1;
}

.invite-actions {
  display: flex;
  gap: var(--space-2);
  flex-shrink: 0;
}

.revoke-btn {
  padding: var(--space-1) var(--space-3);
  border: 1.5px solid var(--color-error);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-error);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
}

.revoke-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.revoke-btn:active:not(:disabled) {
  opacity: 0.7;
}

.field-error {
  color: var(--color-error);
}
</style>
