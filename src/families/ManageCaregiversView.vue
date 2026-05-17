<!-- Manage Caregivers — member list and invite code generation (Owner only).
     Phase 2: layout scaffold. Phase 8 wires inviteService + familyService.getMembers. -->
<template>
  <AppLayout>
    <template #header>
      <router-link class="back-btn" to="/" aria-label="Back">←</router-link>
      <span class="header-title">Manage Caregivers</span>
    </template>

    <AppCard>
      <h2 class="section-heading">Members</h2>
      <div class="member-placeholder">
        <p class="text-faint text-sm">Member list loads here in Phase 8.</p>
      </div>
    </AppCard>

    <AppCard>
      <h2 class="section-heading">Invite a caregiver</h2>
      <p class="text-soft text-sm">
        Owners can invite caregivers with a one-time invite link.
        The caregiver signs up or signs in, enters the code, and joins
        your family as a Caregiver. Owners can promote them later.
      </p>
      <div class="invite-action">
        <AppButton variant="secondary" :disabled="true">
          Generate invite link — Phase 8
        </AppButton>
      </div>
    </AppCard>
  </AppLayout>
</template>

<script setup>
import AppLayout from '@/ui/AppLayout.vue'
import AppCard from '@/ui/AppCard.vue'
import AppButton from '@/ui/AppButton.vue'
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

.member-placeholder {
  padding: var(--space-4) 0;
  text-align: center;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
}

.invite-action {
  margin-top: var(--space-4);
}

:deep(.page-container) { display: flex; flex-direction: column; gap: var(--space-4); }
</style>
