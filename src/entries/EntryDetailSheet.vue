<!-- Entry detail bottom sheet. Notes are editable here (the only writable field).
     All other core fields are edited inline on the row.
     Delete requires confirmation; the parent handles the actual call and closes the sheet. -->
<template>
  <AppSheet v-model="sheetOpen" title="Entry Details">
    <div v-if="entry" class="detail">

      <!-- Primary fields (read-only) -->
      <div class="detail-section">
        <div class="detail-row">
          <span class="detail-label text-soft text-sm">Date</span>
          <span>{{ entry.entryDate }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label text-soft text-sm">Time</span>
          <span>{{ entry.entryTime }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label text-soft text-sm">Amount</span>
          <span>{{ entry.amountMl != null ? formatAmount(entry.amountMl, unitPreference) : '—' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label text-soft text-sm">Diaper</span>
          <span :class="diaperClass">{{ entry.diaper ?? '—' }}</span>
        </div>
      </div>

      <!-- Indicators (shown only when active) -->
      <div
        v-if="entry.vitaminD || entry.medication || tummyActive"
        class="detail-section detail-section--indicators"
      >
        <span v-if="entry.vitaminD"   class="detail-indicator detail-indicator--vitd">☀ Vitamin D</span>
        <span v-if="entry.medication" class="detail-indicator detail-indicator--med">{{ medicationDisplayText }}</span>
        <span v-if="tummyActive"      class="detail-indicator detail-indicator--tt">★ {{ tummyDisplayText }}</span>
      </div>

      <!-- Notes — the one editable field in this sheet -->
      <div class="detail-section">
        <label class="detail-label text-soft text-sm" for="detail-notes">Notes</label>
        <textarea
          id="detail-notes"
          class="detail-notes"
          :value="localNotes"
          placeholder="Add notes…"
          rows="3"
          @input="onNotesInput"
          @blur="flushNotes"
        />
      </div>

      <!-- Provenance -->
      <div class="detail-section detail-section--provenance text-sm">
        <div class="detail-row">
          <span class="detail-label text-soft">Created by</span>
          <span>{{ entry.createdByLabel }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label text-soft">Created at</span>
          <span class="text-soft">{{ formatTs(entry.createdAt) }}</span>
        </div>
        <template v-if="entry.updatedByLabel">
          <div class="detail-row">
            <span class="detail-label text-soft">Updated by</span>
            <span>{{ entry.updatedByLabel }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label text-soft">Updated at</span>
            <span class="text-soft">{{ formatTs(entry.updatedAt) }}</span>
          </div>
        </template>
        <div v-if="entry.source === 'legacy'" class="detail-row">
          <span class="detail-label text-soft">Source</span>
          <span class="text-faint">Legacy entry</span>
        </div>
      </div>

      <!-- Save Entry -->
      <div class="detail-section detail-section--save">
        <AppButton :full="true" :disabled="saveState === 'saving'" @click="saveEntry">
          {{ saveStateLabel }}
        </AppButton>
      </div>

      <!-- Delete action with confirmation -->
      <div class="detail-section detail-section--actions">
        <template v-if="!deleteConfirming">
          <AppButton variant="danger" :full="true" @click="deleteConfirming = true">
            Delete Entry
          </AppButton>
        </template>
        <template v-else>
          <p class="detail-confirm-msg text-soft text-sm">Delete this entry?</p>
          <div class="detail-confirm-btns">
            <AppButton variant="ghost" @click="deleteConfirming = false">Cancel</AppButton>
            <AppButton variant="danger" @click="onConfirmDelete">Confirm Delete</AppButton>
          </div>
        </template>
      </div>
    </div>
  </AppSheet>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import AppSheet  from '@/ui/AppSheet.vue'
import AppButton         from '@/ui/AppButton.vue'
import { hasTummyTimeSession, formatTummyDuration } from '@/utils/entryUtils.js'
import { unitPreference } from '@/families/useFamily.js'
import { formatAmount } from '@/utils/unitConverter.js'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  entry:      { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'save-notes', 'delete'])

// Two-way binding proxy for AppSheet v-model.
const sheetOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const tummyActive = computed(() => props.entry ? hasTummyTimeSession(props.entry) : false)
const tummyDisplayText = computed(() => {
  if (!props.entry) return 'Tummy Time'
  const dur = formatTummyDuration(props.entry.tummyTimeDurationSeconds)
  return dur ? `Tummy Time: ${dur}` : 'Tummy Time: session tracked'
})

const medicationDisplayText = computed(() => {
  if (!props.entry) return 'Rx Medication'
  const note = props.entry.medicationNote
  return note ? `Rx Medication: ${note}` : 'Rx Medication: recorded'
})

const diaperClass = computed(() => {
  const d = props.entry?.diaper
  return { 'diaper-w': d === 'W', 'diaper-p': d === 'P', 'diaper-wp': d === 'WP' }
})

// Notes — local copy, saved via debounce or blur.
const localNotes = ref('')
let   notesTimer = null

watch(
  () => props.entry,
  (e) => {
    clearTimeout(notesTimer)
    localNotes.value      = e?.notes ?? ''
    deleteConfirming.value = false
  },
  { immediate: true }
)

function onNotesInput(e) {
  localNotes.value = e.target.value
  clearTimeout(notesTimer)
  notesTimer = setTimeout(flushNotes, 800)
}

function flushNotes() {
  clearTimeout(notesTimer)
  if (!props.entry) return
  if (localNotes.value !== (props.entry.notes ?? '')) {
    emit('save-notes', props.entry.id, localNotes.value)
  }
}

// Save Entry button.
const saveState     = ref('')
let   saveStateTimer = null

const saveStateLabel = computed(() => {
  if (saveState.value === 'saving') return 'Saving…'
  if (saveState.value === 'saved')  return 'Saved ✓'
  return 'Save Entry'
})

function saveEntry() {
  flushNotes()
  clearTimeout(saveStateTimer)
  saveState.value = 'saved'
  saveStateTimer = setTimeout(() => { saveState.value = '' }, 1800)
}

// Delete flow.
const deleteConfirming = ref(false)

function onConfirmDelete() {
  if (!props.entry) return
  deleteConfirming.value = false
  emit('delete', props.entry.id)
}

function formatTs(ts) {
  if (!ts) return '—'
  try {
    const d = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts)
    return d.toLocaleString('en-CA', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch (e) {
    console.warn('[EntryDetailSheet] formatTs failed', e)
    return '—'
  }
}
</script>

<style scoped>
.detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border-soft);
}
.detail-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--space-2);
}

.detail-label {
  flex-shrink: 0;
  min-width: 90px;
}

.detail-section--indicators {
  flex-direction: row;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.detail-indicator {
  font-size: var(--font-size-sm);
  color: var(--color-text-soft);
  background: var(--color-surface-alt);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
}
.detail-indicator--vitd { color: var(--color-gold); }
.detail-indicator--med  { color: var(--color-mint); }
.detail-indicator--tt   { color: var(--color-lavender); }

.detail-notes {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  color: var(--color-text);
  background: var(--color-surface);
  resize: vertical;
  line-height: 1.5;
}
.detail-notes:focus {
  outline: none;
  border-color: var(--color-mint);
}

.detail-section--provenance {
  color: var(--color-text-soft);
}

.detail-section--actions {
  gap: var(--space-3);
}

.detail-confirm-msg {
  margin: 0;
}

.detail-confirm-btns {
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
}
</style>
