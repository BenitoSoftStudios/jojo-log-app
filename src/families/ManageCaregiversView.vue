<!-- Manage Caregivers — live member list with owner management controls.
     Invite generation is on the separate Invite Member page (/invite).
     legacyImportAdmin cannot be changed here; it is Console-only. -->
<template>
  <AppLayout>
    <template #header>
      <router-link class="back-btn" to="/" aria-label="Back">←</router-link>
      <span class="header-title">Manage Caregivers</span>
    </template>

    <AppCard>
      <h2 class="section-heading">Family members</h2>

      <p v-if="loading" class="text-faint text-sm">Loading…</p>
      <p v-else-if="loadError" class="field-error text-sm">{{ loadError }}</p>

      <ul v-else-if="members.length" class="member-list">
        <li
          v-for="m in members"
          :key="m.userId"
          class="member-row"
          :class="{ 'member-row--inactive': !m.active }"
        >
          <!-- Summary row -->
          <div class="member-summary">
            <div class="member-info">
              <span class="member-label">{{ m.displayLabel }}</span>
              <span v-if="m.initials" class="member-meta text-faint text-xs">({{ m.initials }})</span>
              <span class="member-meta text-faint text-xs">{{ m.role }}</span>
              <span v-if="isSelf(m)" class="member-you text-xs">You</span>
            </div>
            <div class="member-right">
              <span
                class="member-status text-xs"
                :class="m.active ? 'status--active' : 'status--inactive'"
              >{{ m.active ? 'Active' : 'Inactive' }}</span>
              <button
                v-if="isOwner"
                class="manage-btn text-xs"
                type="button"
                @click="toggleExpand(m.userId)"
              >{{ expandedId === m.userId ? 'Close' : 'Manage' }}</button>
            </div>
          </div>

          <!-- Inline management panel (owner only, not self for dangerous ops) -->
          <div v-if="isOwner && expandedId === m.userId" class="manage-panel">

            <!-- Edit name/initials -->
            <form class="edit-form" @submit.prevent="saveEdit(m)">
              <div class="form-row">
                <label class="form-label text-xs text-faint" :for="`lbl-${m.userId}`">Display label</label>
                <input
                  :id="`lbl-${m.userId}`"
                  v-model="editLabel"
                  type="text"
                  class="form-input"
                  maxlength="20"
                  required
                />
              </div>
              <div class="form-row">
                <label class="form-label text-xs text-faint" :for="`ini-${m.userId}`">Initials</label>
                <input
                  :id="`ini-${m.userId}`"
                  v-model="editInitials"
                  type="text"
                  class="form-input"
                  maxlength="4"
                />
              </div>
              <button
                class="action-btn action-btn--minor"
                type="submit"
                :disabled="actionBusy"
              >Save name</button>
            </form>

            <div class="action-row">
              <!-- Role change (not for self) -->
              <template v-if="!isSelf(m)">
                <button
                  v-if="m.role === 'caregiver'"
                  class="action-btn"
                  type="button"
                  :disabled="actionBusy"
                  @click="promoteToOwner(m)"
                >Promote to owner</button>
                <button
                  v-else
                  class="action-btn"
                  type="button"
                  :disabled="actionBusy"
                  @click="demoteToCaregiver(m)"
                >Change to caregiver</button>
              </template>

              <!-- Deactivate / Reactivate (not for self) -->
              <template v-if="!isSelf(m)">
                <button
                  v-if="m.active"
                  class="action-btn action-btn--danger"
                  type="button"
                  :disabled="actionBusy"
                  @click="deactivateMember(m)"
                >Deactivate</button>
                <button
                  v-else
                  class="action-btn"
                  type="button"
                  :disabled="actionBusy"
                  @click="reactivateMember(m)"
                >Reactivate</button>
              </template>
            </div>

            <p v-if="actionError && expandedId === m.userId" class="field-error text-sm" role="alert">
              {{ actionError }}
            </p>
            <p v-if="actionSuccess && expandedId === m.userId" class="field-success text-sm" role="status">
              {{ actionSuccess }}
            </p>
          </div>
        </li>
      </ul>

      <p v-else class="text-faint text-sm">No members found.</p>
    </AppCard>

    <AppCard v-if="isOwner">
      <h2 class="section-heading">Invite a caregiver</h2>
      <p class="text-soft text-sm">
        Generate a one-time invite link from the Invite Member page.
        The caregiver signs in or creates an account and joins as a Caregiver.
      </p>
      <div class="invite-action">
        <router-link class="invite-link text-sm" to="/invite">Go to Invite Member →</router-link>
      </div>
    </AppCard>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '@/ui/AppLayout.vue'
import AppCard from '@/ui/AppCard.vue'
import { currentUser } from '@/auth/useAuth.js'
import { useFamily } from '@/families/useFamily.js'
import { listMembers, updateMember } from '@/families/familyService.js'

const { familyId, currentMember, isOwner } = useFamily()

const members     = ref([])
const loading     = ref(true)
const loadError   = ref('')

const expandedId    = ref(null)
const editLabel     = ref('')
const editInitials  = ref('')
const actionBusy    = ref(false)
const actionError   = ref('')
const actionSuccess = ref('')

onMounted(async () => {
  if (!familyId.value) {
    loadError.value = 'No family loaded.'
    loading.value   = false
    return
  }
  try {
    await reload()
  } finally {
    loading.value = false
  }
})

async function reload() {
  try {
    const all = await listMembers(familyId.value)
    members.value = all.sort((a, b) => {
      if (a.role === 'owner' && b.role !== 'owner') return -1
      if (b.role === 'owner' && a.role !== 'owner') return  1
      return (a.displayLabel ?? '').localeCompare(b.displayLabel ?? '')
    })
    loadError.value = ''
  } catch (e) {
    console.error('[ManageCaregiversView] listMembers failed | code:', e.code, '| message:', e.message, e)
    loadError.value = 'Could not load members. Please try again.'
  }
}

function isSelf(m) {
  return m.userId === currentUser.value?.uid
}

function activeOwnerCount() {
  return members.value.filter(m => m.role === 'owner' && m.active).length
}

function toggleExpand(userId) {
  if (expandedId.value === userId) {
    expandedId.value = null
    return
  }
  const m = members.value.find(m => m.userId === userId)
  editLabel.value    = m?.displayLabel ?? ''
  editInitials.value = m?.initials ?? ''
  actionError.value   = ''
  actionSuccess.value = ''
  expandedId.value    = userId
}

async function saveEdit(m) {
  if (!editLabel.value.trim()) return
  actionBusy.value    = true
  actionError.value   = ''
  actionSuccess.value = ''
  try {
    await updateMember(familyId.value, m.userId, {
      displayLabel: editLabel.value.trim(),
      initials:     editInitials.value.trim(),
    })
    await reload()
    actionSuccess.value = 'Name updated.'
  } catch (e) {
    console.error('[ManageCaregiversView] saveEdit failed | code:', e.code, '| message:', e.message, e)
    actionError.value = 'Save failed. Please try again.'
  } finally {
    actionBusy.value = false
  }
}

async function promoteToOwner(m) {
  actionBusy.value    = true
  actionError.value   = ''
  actionSuccess.value = ''
  try {
    await updateMember(familyId.value, m.userId, { role: 'owner' })
    await reload()
    actionSuccess.value = `${m.displayLabel} is now an owner.`
  } catch (e) {
    console.error('[ManageCaregiversView] promoteToOwner failed | code:', e.code, '| message:', e.message, e)
    actionError.value = 'Could not promote member. Please try again.'
  } finally {
    actionBusy.value = false
  }
}

async function demoteToCaregiver(m) {
  if (activeOwnerCount() <= 1) {
    actionError.value = 'Cannot change role — this is the last active owner.'
    return
  }
  actionBusy.value    = true
  actionError.value   = ''
  actionSuccess.value = ''
  try {
    await updateMember(familyId.value, m.userId, { role: 'caregiver' })
    await reload()
    actionSuccess.value = `${m.displayLabel} changed to caregiver.`
  } catch (e) {
    console.error('[ManageCaregiversView] demoteToCaregiver failed | code:', e.code, '| message:', e.message, e)
    actionError.value = 'Could not change role. Please try again.'
  } finally {
    actionBusy.value = false
  }
}

async function deactivateMember(m) {
  if (m.role === 'owner' && activeOwnerCount() <= 1) {
    actionError.value = 'Cannot deactivate — this is the last active owner.'
    return
  }
  actionBusy.value    = true
  actionError.value   = ''
  actionSuccess.value = ''
  try {
    await updateMember(familyId.value, m.userId, { active: false })
    await reload()
    actionSuccess.value = `${m.displayLabel} deactivated.`
  } catch (e) {
    console.error('[ManageCaregiversView] deactivateMember failed | code:', e.code, '| message:', e.message, e)
    actionError.value = 'Could not deactivate member. Please try again.'
  } finally {
    actionBusy.value = false
  }
}

async function reactivateMember(m) {
  actionBusy.value    = true
  actionError.value   = ''
  actionSuccess.value = ''
  try {
    await updateMember(familyId.value, m.userId, { active: true })
    await reload()
    actionSuccess.value = `${m.displayLabel} reactivated.`
  } catch (e) {
    console.error('[ManageCaregiversView] reactivateMember failed | code:', e.code, '| message:', e.message, e)
    actionError.value = 'Could not reactivate member. Please try again.'
  } finally {
    actionBusy.value = false
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

.member-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.member-row {
  border-bottom: 1px solid var(--color-border-soft);
  padding: var(--space-3) 0;
}

.member-row:last-child { border-bottom: none; }

.member-row--inactive .member-label,
.member-row--inactive .member-meta { opacity: 0.5; }

.member-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.member-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
}

.member-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.member-meta {
  font-size: var(--font-size-xs);
  color: var(--color-text-soft);
}

.member-you {
  font-size: var(--font-size-xs);
  color: var(--color-mint);
  font-weight: var(--font-weight-medium);
}

.member-right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}

.member-status {
  padding: 2px var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
}

.status--active   { color: var(--color-mint); }
.status--inactive { color: var(--color-text-soft); }

.manage-btn {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-family);
  font-size: var(--font-size-xs);
  color: var(--color-text-soft);
  cursor: pointer;
  padding: 2px var(--space-2);
  -webkit-tap-highlight-color: transparent;
}

/* ── Inline management panel ─────────────────────────────────────────────── */

.manage-panel {
  margin-top: var(--space-3);
  padding: var(--space-3) var(--space-3);
  background: var(--color-row-week, var(--color-surface));
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-soft);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-soft);
}

.form-input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-family: var(--font-family);
  background: var(--color-surface);
  color: var(--color-text);
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-mint);
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.action-btn {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-family);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-soft);
  background: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.action-btn:disabled { opacity: 0.4; cursor: default; }

.action-btn--danger {
  color: var(--color-error);
  border-color: var(--color-error);
}

.action-btn--minor {
  color: var(--color-mint);
  border-color: var(--color-mint);
}

.field-error   { color: var(--color-error); }
.field-success { color: var(--color-mint); }

.invite-action { margin-top: var(--space-3); }

.invite-link {
  color: var(--color-mint);
  text-decoration: none;
}

:deep(.page-container) { display: flex; flex-direction: column; gap: var(--space-4); }
</style>
