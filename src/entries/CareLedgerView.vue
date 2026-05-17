<!-- Care Ledger — main screen.
     Phase 3: loads real family + baby context from composables.
     Phase 4+ adds the live entry subscription and ledger hierarchy. -->
<template>
  <AppLayout>
    <template #header>
      <BabySwitcher
        :babies="activeBabies"
        :active-baby-id="activeBabyId"
        @select="selectBaby"
      />
      <SyncStatus status="synced" />
      <button class="menu-btn" aria-label="Menu" @click="menuOpen = true">☰</button>
    </template>

    <!-- Loading state while family/baby context resolves -->
    <div v-if="familyLoading || babiesLoading" class="loading-state">
      <p class="text-faint text-sm">Loading…</p>
    </div>

    <template v-else>
      <!-- Member greeting -->
      <div v-if="currentMember" class="member-greeting text-soft text-sm">
        Signed in as <strong>{{ currentMember.displayLabel }}</strong>
        <span v-if="isOwner"> · Owner</span>
      </div>

      <SummaryChips
        :today-ml="0"
        :seven-day-ml="0"
        :month-ml="0"
        :feed-count="0"
      />

      <!-- Ledger placeholder — Phase 4+ -->
      <div class="ledger-placeholder">
        <p class="text-faint text-sm">
          Care Ledger loads here in Phase 4.<br />
          Month → Week Segment → Day → Entry hierarchy.
        </p>
      </div>
    </template>

    <!-- Hamburger menu sheet -->
    <AppSheet v-model="menuOpen" title="Menu">
      <nav class="menu-nav">
        <router-link class="menu-item" to="/graphs"            @click="menuOpen = false">Graph</router-link>
        <router-link class="menu-item" to="/recently-deleted"  @click="menuOpen = false">Recently Deleted</router-link>
        <router-link class="menu-item" to="/manage-caregivers" @click="menuOpen = false">Manage Caregivers</router-link>
        <router-link class="menu-item" to="/baby-settings"     @click="menuOpen = false">Baby Settings</router-link>
        <router-link class="menu-item" to="/settings"          @click="menuOpen = false">Settings</router-link>
        <router-link class="menu-item" to="/help"              @click="menuOpen = false">Help / Legend</router-link>
        <hr class="menu-divider" />
        <button class="menu-item menu-item--signout" @click="handleSignOut">Sign out</button>
      </nav>
    </AppSheet>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout    from '@/ui/AppLayout.vue'
import AppSheet     from '@/ui/AppSheet.vue'
import BabySwitcher from '@/babies/BabySwitcher.vue'
import SyncStatus   from '@/ui/SyncStatus.vue'
import SummaryChips from '@/entries/SummaryChips.vue'
import { useAuth }   from '@/auth/useAuth.js'
import { useFamily } from '@/families/useFamily.js'
import { useBabies } from '@/babies/useBabies.js'

const router = useRouter()
const { currentUser, signOut }                          = useAuth()
const { familyId, currentMember, isOwner, loading: familyLoading, loadFamily } = useFamily()
const { activeBabies, activeBabyId, loading: babiesLoading, loadBabies, selectBaby } = useBabies()

const menuOpen = ref(false)

onMounted(async () => {
  if (!familyId.value && currentUser.value) {
    await loadFamily(currentUser.value.uid)
  }
  if (familyId.value && activeBabies.value.length === 0) {
    await loadBabies(familyId.value)
  }
})

async function handleSignOut() {
  menuOpen.value = false
  await signOut()
  await router.push('/login')
}
</script>

<style scoped>
.loading-state {
  margin-top: var(--space-8);
  text-align: center;
  padding: var(--space-8);
}

.member-greeting {
  margin-bottom: var(--space-2);
}

.menu-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--font-size-lg);
  color: var(--color-text-soft);
  padding: var(--space-1);
  line-height: 1;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
}

.ledger-placeholder {
  margin-top: var(--space-8);
  text-align: center;
  padding: var(--space-8);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-text-faint);
}

.menu-nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.menu-item {
  display: block;
  padding: var(--space-3) var(--space-2);
  text-decoration: none;
  color: var(--color-text);
  font-size: var(--font-size-md);
  border-radius: var(--radius-md);
  transition: background var(--duration-fast) var(--ease-out);
}

.menu-item:hover {
  background: var(--color-surface-alt);
}

.menu-divider {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: var(--space-2) 0;
}

.menu-item--signout {
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font-family);
  text-align: left;
  width: 100%;
  color: var(--color-error);
}
</style>
