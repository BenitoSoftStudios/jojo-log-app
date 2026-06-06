<!-- Dismissible early-use tip card. Shows one practical tip at a time.
     State is stored in localStorage only. No Firestore writes. -->
<template>
  <Transition name="tip-fade">
    <div v-if="visible" class="early-tips">
      <p class="early-tips__counter">Tip {{ position }} of {{ total }}</p>
      <p class="early-tips__text text-sm">{{ currentTip.text }}</p>
      <div class="early-tips__actions">
        <button class="tips-btn tips-btn--primary" type="button" @click="dismiss">Got it</button>
        <button class="tips-btn tips-btn--muted" type="button" @click="hideAll">Hide tips</button>
        <router-link class="tips-help-link" to="/help">Help</router-link>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  isOwner: { type: Boolean, default: false },
})

const ALL_TIPS = [
  {
    id: 1,
    text: 'Bottle only: enter the amount, then tap - for no diaper event.',
  },
  {
    id: 2,
    text: 'Diaper only: enter 0 mL, then choose W, P, or WP.',
  },
  {
    id: 3,
    text: 'Medication only: enter 0 mL, tap - for no diaper event, then tap Rx.',
  },
  {
    id: 4,
    text: 'Tummy Time only: enter 0 mL, tap - for no diaper event, then tap the star.',
  },
  {
    id: 5,
    text: 'Note only: enter 0 mL, tap - for no diaper event, then add your note in Entry Details.',
  },
  {
    id: 6,
    text: 'Vitamin D only: enter 0 mL, tap - for no diaper event, then tap the sun icon.',
  },
  {
    id: 7,
    text: 'Blank means unfinished: blank amount or blank diaper means the entry is incomplete.',
  },
  {
    id: 8,
    text: 'Tap a note indicator to open Entry Details.',
  },
  {
    id: 9,
    text: 'Trends describe what was logged. They are not feeding or medical guidance.',
  },
  {
    id: 10,
    ownerOnly: true,
    text: 'Owners can export CSV to back up the active baby\'s log.',
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
  box-shadow: var(--shadow-sm);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-3);
}

.early-tips__counter {
  margin: 0 0 var(--space-1);
  font-size: var(--font-size-xs);
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

.tips-btn--primary {
  color: var(--color-mint);
  border-color: var(--color-mint);
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

/* Tip dismissal fade */
.tip-fade-leave-active { transition: opacity var(--duration-base) var(--ease-out); }
.tip-fade-leave-to { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .tip-fade-leave-active { transition: none; }
}
</style>
