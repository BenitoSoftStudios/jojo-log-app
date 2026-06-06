<!-- Dismissible early-use tip card. Shows one practical tip at a time.
     State is stored in localStorage only. No Firestore writes. -->
<template>
  <div v-if="visible" class="early-tips">
    <p class="early-tips__counter">Tip {{ position }} of {{ total }}</p>
    <p class="early-tips__text text-sm">{{ currentTip.text }}</p>
    <div class="early-tips__actions">
      <button class="tips-btn" type="button" @click="dismiss">Got it</button>
      <button class="tips-btn tips-btn--muted" type="button" @click="hideAll">Hide tips</button>
      <router-link class="tips-help-link" to="/help">Help</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  isOwner: { type: Boolean, default: false },
})

const ALL_TIPS = [
  {
    id: 1,
    text: 'You can log a bottle-only entry by entering an amount and leaving diaper blank.',
  },
  {
    id: 2,
    text: 'You can log a diaper-only entry by leaving amount blank and choosing a diaper result.',
  },
  {
    id: 3,
    text: 'For a bottle with no diaper, enter the amount and tap - for no diaper change.',
  },
  {
    id: 4,
    text: 'You can log medication-only by tapping Rx, then saving in the medication sheet.',
  },
  {
    id: 5,
    text: 'You can log Tummy Time-only by tapping the star, then saving in the Tummy Time sheet.',
  },
  {
    id: 6,
    text: 'You can add a note-only entry from Entry Details.',
  },
  {
    id: 7,
    text: 'Tap a note indicator in the ledger to open Entry Details for that entry.',
  },
  {
    id: 8,
    text: 'Save Entry is for peace of mind. Closing Entry Details also keeps your changes.',
  },
  {
    id: 9,
    text: 'Trends describe what was logged. They are not feeding or medical guidance.',
  },
  {
    id: 10,
    ownerOnly: true,
    text: 'Export CSV creates a backup of the active baby\'s log. Owner only.',
  },
]

const STORAGE_KEY_DISMISSED = 'jojo_tips_dismissed'
const STORAGE_KEY_HIDDEN    = 'jojo_tips_hidden'

function readDismissed() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DISMISSED)
    if (!raw) return new Set()
    const arr = JSON.parse(raw)
    return new Set(Array.isArray(arr) ? arr : [])
  } catch {
    return new Set()
  }
}

function readHidden() {
  try {
    return localStorage.getItem(STORAGE_KEY_HIDDEN) === 'true'
  } catch {
    return false
  }
}

const dismissed = ref(readDismissed())
const hidden    = ref(readHidden())

const availableTips = computed(() =>
  props.isOwner ? ALL_TIPS : ALL_TIPS.filter(t => !t.ownerOnly)
)

const currentTip = computed(() => {
  if (hidden.value) return null
  return availableTips.value.find(t => !dismissed.value.has(t.id)) ?? null
})

const visible  = computed(() => !!currentTip.value)
const position = computed(() => {
  if (!currentTip.value) return 0
  return availableTips.value.findIndex(t => t.id === currentTip.value.id) + 1
})
const total = computed(() => availableTips.value.length)

function dismiss() {
  if (!currentTip.value) return
  const next = new Set(dismissed.value)
  next.add(currentTip.value.id)
  dismissed.value = next
  try {
    localStorage.setItem(STORAGE_KEY_DISMISSED, JSON.stringify([...next]))
  } catch { /* ignore */ }
}

function hideAll() {
  hidden.value = true
  try {
    localStorage.setItem(STORAGE_KEY_HIDDEN, 'true')
  } catch { /* ignore */ }
}
</script>

<style scoped>
.early-tips {
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-3);
}

.early-tips__counter {
  margin: 0 0 var(--space-1);
  font-size: 10px;
  color: var(--color-text-faint);
  line-height: 1;
}

.early-tips__text {
  margin: 0 0 var(--space-3);
  color: var(--color-text-soft);
  font-size: var(--font-size-sm);
  line-height: 1.45;
}

.early-tips__actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.tips-btn {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-family);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-soft);
  cursor: pointer;
  padding: var(--space-1) var(--space-2);
  min-height: 28px;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.tips-btn--muted {
  color: var(--color-text-faint);
  border-color: transparent;
}

.tips-help-link {
  margin-left: auto;
  color: var(--color-mint);
  text-decoration: none;
  font-size: var(--font-size-xs);
}
</style>
