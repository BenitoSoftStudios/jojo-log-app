<!-- Manage Caregivers — live member list. Owner-only actions are gated in template.
     Invite generation is on the separate Invite Member page (/invite). -->
<template>
  <AppLayout>
    <template #header>
      <router-link class="back-btn" to="/" aria-label="Back">←</router-link>
      <span class="header-title">Manage Caregivers</span>
    </template>

    <AppCard>
      <h2 class="section-heading">Members</h2>

      <p v-if="loading" class="text-faint text-sm">Loading…</p>
      <p v-else-if="loadError" class="text-error text-sm">{{ loadError }}</p>

      <ul v-else-if="members.length" class="member-list">
        <li v-for="m in members" :key="m.userId" class="member-row">
          <div class="member-info">
            <span class="member-label">{{ m.displayLabel }}</span>
            <span v-if="m.initials" class="member-initials text-faint text-xs">({{ m.initials }})</span>
            <span class="member-role text-faint text-xs">{{ m.role }}</span>
          </div>
          <span
            class="member-status text-xs"
            :class="m.active ? 'status--active' : 'status--inactive'"
          >{{ m.active ? 'Active' : 'Inactive' }}</span>
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
import { useFamily } from '@/families/useFamily.js'
import { listMembers } from '@/families/familyService.js'

const { familyId, isOwner } = useFamily()

const members   = ref([])
const loading   = ref(true)
const loadError = ref('')

onMounted(async () => {
  if (!familyId.value) {
    loadError.value = 'No family loaded.'
    loading.value   = false
    return
  }
  try {
    const all = await listMembers(familyId.value)
    members.value = all.sort((a, b) => {
      if (a.role === 'owner' && b.role !== 'owner') return -1
      if (b.role === 'owner' && a.role !== 'owner') return  1
      return (a.displayLabel ?? '').localeCompare(b.displayLabel ?? '')
    })
  } catch (e) {
    console.error('[ManageCaregiversView] listMembers failed | code:', e.code, '| message:', e.message, e)
    loadError.value = 'Could not load members. Please try again.'
  } finally {
    loading.value = false
  }
})
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

.member-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.member-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.member-initials,
.member-role {
  font-size: var(--font-size-xs);
  color: var(--color-text-faint, var(--color-text-soft));
}

.member-status {
  flex-shrink: 0;
  padding: 2px var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
}

.status--active   { color: var(--color-mint); }
.status--inactive { color: var(--color-text-soft); }

.text-error { color: var(--color-error); }

.invite-action { margin-top: var(--space-3); }

.invite-link {
  color: var(--color-mint);
  text-decoration: none;
}

:deep(.page-container) { display: flex; flex-direction: column; gap: var(--space-4); }
</style>
