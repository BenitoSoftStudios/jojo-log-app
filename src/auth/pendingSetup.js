// Transient module-level state for the multi-step new-user setup flow.
// Set by SetupProfileView, consumed by FamilySetupView, cleared after member creation.
// Survives component remounts but not page refresh — by design.
// If a user refreshes on /family-setup with empty pending state, the router guard
// sends them back to /setup-profile to re-enter their display label.
import { ref } from 'vue'

export const pendingLabel    = ref('')
export const pendingInitials = ref('')
