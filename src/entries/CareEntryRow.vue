<!-- Inline-editable entry row. Each field saves immediately on change/blur.
     Layout: two lines — no inline expanding forms.
       Line 1: incomplete dot · time · mL · diaper selector (W P WP -) · details button
       Line 2: symbol toggles ☀ Rx ★ · notes indicator · save feedback
     Rx and Tummy Time editing opens a bottom sheet (AppSheet).
     Notes are not shown inline — see EntryDetailSheet. -->
<template>
  <div class="entry-row" :class="{ 'entry-row--incomplete': incomplete }">

    <!-- ── Line 1: core data ──────────────────────────────────────────── -->
    <div class="entry-row__line1">

      <!-- Incomplete indicator -->
      <span class="entry-row__dot-area">
        <span v-if="incomplete" class="incomplete-dot" aria-label="Incomplete entry" />
      </span>

      <!-- Time -->
      <input
        class="entry-row__time"
        type="time"
        :value="entry.entryTime"
        @blur="onTimeBlur"
      />

      <!-- Amount mL -->
      <div class="entry-row__ml-wrap">
        <input
          class="entry-row__ml"
          :class="{ 'entry-row__ml--null': entry.amountMl === null }"
          type="number"
          min="0"
          step="1"
          inputmode="numeric"
          :value="mlDisplay"
          placeholder="—"
          @blur="onMlBlur"
          @keydown.enter.prevent="$event.target.blur()"
        />
        <span class="entry-row__ml-unit text-faint text-xs">mL</span>
      </div>

      <!-- Diaper selector — four visible tap buttons -->
      <div
        class="entry-row__diaper-group"
        :class="{ 'entry-row__diaper-group--null': entry.diaper === null }"
        role="group"
        aria-label="Diaper"
      >
        <button
          v-for="opt in DIAPER_OPTIONS"
          :key="opt.value"
          class="diaper-btn"
          :class="diaperBtnClass(opt.value)"
          type="button"
          :aria-label="opt.label"
          :aria-pressed="entry.diaper === opt.value"
          @click="selectDiaper(opt.value)"
        >{{ opt.display }}</button>
      </div>

      <!-- Details button — opens EntryDetailSheet -->
      <button
        class="entry-row__detail"
        type="button"
        aria-label="View entry details"
        @click="emit('open-detail', entry)"
      >⋯</button>
    </div>

    <!-- ── Line 2: symbol toggles ─────────────────────────────────────── -->
    <div class="entry-row__line2">

      <!-- Vitamin D — gold when on -->
      <button
        class="sym-btn"
        :class="{ 'sym-btn--vitd-on': entry.vitaminD }"
        type="button"
        :aria-label="entry.vitaminD ? 'Vitamin D on — tap to turn off' : 'Vitamin D off — tap to turn on'"
        @click="emitUpdate({ vitaminD: !entry.vitaminD })"
      >
        <svg class="sun-icon" viewBox="0 0 20 20" aria-hidden="true" fill="none">
          <circle cx="10" cy="10" r="3.5" fill="currentColor"/>
          <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M15.78 4.22l-1.42 1.42M5.64 14.36l-1.42 1.42" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      </button>

      <!-- Medication — mint when on; tap to open bottom sheet -->
      <button
        class="sym-btn"
        :class="{ 'sym-btn--med-on': entry.medication }"
        type="button"
        :aria-label="entry.medication ? 'Medication recorded — tap to edit' : 'Medication — tap to record'"
        @click="openMedSheet"
      >Rx<span v-if="medNoteCue" class="med-note-cue">{{ medNoteCue }}</span></button>

      <!-- Tummy Time — tap to open bottom sheet -->
      <button
        class="sym-btn sym-btn--tt"
        :class="{ 'sym-btn--tt-on': tummyActive }"
        type="button"
        :aria-label="tummyActive ? 'Tummy time recorded — tap to edit' : 'Tummy time — tap to record'"
        @click="openTtSheet"
      >★<span v-if="tummyDuration" class="tt-dur">{{ tummyDuration }}</span></button>

      <!-- Notes compact indicator — tapping opens the detail sheet -->
      <button
        v-if="hasNotes"
        class="sym-notes text-faint text-xs"
        type="button"
        aria-label="Open notes"
        @click="emit('open-detail', entry)"
      >✎ notes</button>

      <!-- Save feedback — appears briefly after each write -->
      <span
        v-if="saveFlash"
        class="sym-save"
        :class="`sym-save--${saveFlash}`"
        aria-live="polite"
      >{{ saveFlash === 'saving' ? '…' : saveFlash === 'saved' ? '✓' : '!' }}</span>

    </div>

    <!-- ── Medication bottom sheet ─────────────────────────────────────── -->
    <AppSheet v-model="medSheetOpen" title="Medication details">
      <div class="qa-body">
        <input
          ref="medInputRef"
          v-model="medNote"
          class="qa-input"
          type="text"
          placeholder="Name, dosage"
          maxlength="200"
          autocomplete="off"
        />
        <div class="qa-btns">
          <button class="qa-btn qa-btn--save" type="button" @click="saveMed">Save</button>
          <button
            v-if="entry.medication"
            class="qa-btn qa-btn--clear"
            type="button"
            @click="clearMed"
          >Clear Medication</button>
          <button class="qa-btn qa-btn--cancel" type="button" @click="cancelMed">Cancel</button>
        </div>
      </div>
    </AppSheet>

    <!-- ── Tummy Time bottom sheet ─────────────────────────────────────── -->
    <AppSheet v-model="ttSheetOpen" title="How long was Tummy Time?">
      <div class="qa-body">
        <div class="tt-row">
          <input
            v-model.number="ttMinutes"
            class="tt-duration-input"
            type="number"
            min="0"
            max="99"
            inputmode="numeric"
            placeholder="0"
          />
          <span class="tt-duration-unit">min</span>
          <input
            v-model.number="ttSeconds"
            class="tt-duration-input"
            type="number"
            min="0"
            max="59"
            inputmode="numeric"
            placeholder="0"
          />
          <span class="tt-duration-unit">sec</span>
        </div>
        <p class="qa-hint text-faint text-xs">Leave blank to record the session without a duration.</p>
        <div class="qa-btns">
          <button class="qa-btn qa-btn--save qa-btn--save-tt" type="button" @click="saveTt">Save</button>
          <button
            v-if="tummyActive"
            class="qa-btn qa-btn--clear"
            type="button"
            @click="clearTt"
          >Clear Tummy Time</button>
          <button class="qa-btn qa-btn--cancel" type="button" @click="cancelTt">Cancel</button>
        </div>
      </div>
    </AppSheet>

  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import AppSheet from '@/ui/AppSheet.vue'
import { isIncomplete, hasTummyTimeSession, formatTummyDuration } from '@/utils/entryUtils.js'

const props = defineProps({
  entry: { type: Object, required: true },
})
const emit = defineEmits(['update', 'open-detail'])

const DIAPER_OPTIONS = [
  { value: 'W',  display: 'W',  label: 'Wet' },
  { value: 'P',  display: 'P',  label: 'Poop' },
  { value: 'WP', display: 'WP', label: 'Wet + poop' },
  { value: '-',  display: '-',  label: 'No diaper change' },
]

const incomplete    = computed(() => isIncomplete(props.entry))
const tummyActive   = computed(() => hasTummyTimeSession(props.entry))
const tummyDuration = computed(() => formatTummyDuration(props.entry.tummyTimeDurationSeconds))
const hasNotes      = computed(() => !!(props.entry.notes))

const medNoteCue = computed(() => {
  const n = props.entry.medicationNote
  if (!n) return null
  return n.length > 10 ? n.slice(0, 10) + '…' : n
})
const mlDisplay = computed(() => props.entry.amountMl ?? '')

// ── Save feedback ──────────────────────────────────────────────────────────

const saveFlash = ref('')
let _saveTimer  = null

function emitUpdate(changes) {
  clearTimeout(_saveTimer)
  saveFlash.value = 'saving'
  emit('update', props.entry.id, changes)
}

watch(() => props.entry, () => {
  if (saveFlash.value === 'saving') {
    saveFlash.value = 'saved'
    clearTimeout(_saveTimer)
    _saveTimer = setTimeout(() => { saveFlash.value = '' }, 900)
  }
})

// ── Field handlers ─────────────────────────────────────────────────────────

function diaperBtnClass(value) {
  const active = props.entry.diaper === value
  return {
    'diaper-btn--active':      active,
    'diaper-btn--active-w':    active && value === 'W',
    'diaper-btn--active-p':    active && value === 'P',
    'diaper-btn--active-wp':   active && value === 'WP',
    'diaper-btn--active-dash': active && value === '-',
  }
}

function selectDiaper(value) {
  emitUpdate({ diaper: value })
}

function onTimeBlur(e) {
  const val = e.target.value
  if (val && val !== props.entry.entryTime) {
    emitUpdate({ entryTime: val })
  }
}

function onMlBlur(e) {
  const raw = e.target.value.trim()
  if (raw === '') {
    if (props.entry.amountMl !== null) {
      emitUpdate({ amountMl: null })
    }
  } else {
    const n = parseInt(raw, 10)
    if (!isNaN(n) && n !== props.entry.amountMl) {
      emitUpdate({ amountMl: n })
    }
  }
}

// ── Medication bottom sheet ────────────────────────────────────────────────

const medSheetOpen = ref(false)
const medNote      = ref('')
const medInputRef  = ref(null)

function openMedSheet() {
  if (medSheetOpen.value) return
  ttSheetOpen.value = false
  medNote.value = props.entry.medicationNote ?? ''
  medSheetOpen.value = true
  nextTick(() => medInputRef.value?.focus())
}

function saveMed() {
  emitUpdate({ medication: true, medicationNote: medNote.value.trim() || null })
  medSheetOpen.value = false
}

function clearMed() {
  emitUpdate({ medication: false, medicationNote: null })
  medSheetOpen.value = false
}

function cancelMed() {
  medSheetOpen.value = false
}

// ── Tummy Time bottom sheet ────────────────────────────────────────────────

const ttSheetOpen = ref(false)
const ttMinutes   = ref(0)
const ttSeconds   = ref(0)

function openTtSheet() {
  if (ttSheetOpen.value) return
  medSheetOpen.value = false
  const existing = props.entry.tummyTimeDurationSeconds ?? 0
  ttMinutes.value = Math.floor(existing / 60)
  ttSeconds.value = existing % 60
  ttSheetOpen.value = true
}

function saveTt() {
  const mins  = Math.max(0, Number(ttMinutes.value) || 0)
  const secs  = Math.max(0, Math.min(59, Number(ttSeconds.value) || 0))
  const total = mins * 60 + secs
  emitUpdate({
    tummyTime:                true,
    tummyTimeCount:           1,
    tummyTimeDurationSeconds: total > 0 ? total : null,
  })
  ttSheetOpen.value = false
}

function clearTt() {
  emitUpdate({
    tummyTime:                false,
    tummyTimeCount:           0,
    tummyTimeDurationSeconds: null,
  })
  ttSheetOpen.value = false
}

function cancelTt() {
  ttSheetOpen.value = false
}
</script>

<style scoped>
.entry-row {
  display: flex;
  flex-direction: column;
  background: var(--color-row-entry);
  border-bottom: 1px solid var(--color-border-soft);
  -webkit-user-select: none;
  user-select: none;
}

/* ── Line 1 ───────────────────────────────────────────────────────────── */

.entry-row__line1 {
  display: flex;
  align-items: center;
  min-height: 48px;
  padding: var(--space-2) var(--space-3) 0;
  gap: var(--space-2);
}

.entry-row__dot-area {
  width: 10px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.entry-row__time {
  width: 68px;
  min-width: 68px;
  flex-shrink: 0;
  border: none;
  background: transparent;
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  padding: var(--space-1) 0;
  -webkit-tap-highlight-color: transparent;
}

.entry-row__ml-wrap {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.entry-row__ml {
  width: 42px;
  border: none;
  background: transparent;
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  color: var(--color-text);
  padding: var(--space-1) 0;
  text-align: right;
  -moz-appearance: textfield;
  border-radius: var(--radius-sm);
  transition: border-color var(--duration-fast), background var(--duration-fast);
}
.entry-row__ml::-webkit-inner-spin-button,
.entry-row__ml::-webkit-outer-spin-button {
  -webkit-appearance: none;
}
.entry-row__ml--null {
  border: 1.5px solid var(--color-incomplete);
  background: rgba(232, 160, 32, 0.06);
  padding: var(--space-1) 2px;
}

.entry-row__ml-unit {
  flex-shrink: 0;
  line-height: 1;
}

/* ── Diaper selector ──────────────────────────────────────────────────── */

.entry-row__diaper-group {
  display: flex;
  gap: 3px;
  flex-shrink: 0;
  border-radius: var(--radius-sm);
  transition: outline var(--duration-fast);
}
.entry-row__diaper-group--null {
  outline: 1.5px solid var(--color-incomplete);
  outline-offset: 2px;
}

.diaper-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  min-height: 36px;
  padding: 4px 6px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: none;
  font-family: var(--font-family);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-faint);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  transition: background var(--duration-fast), border-color var(--duration-fast),
              color var(--duration-fast);
}

.diaper-btn:nth-child(3) {
  min-width: 40px;
}

.diaper-btn--active-w {
  background: #d4eaf5;
  border-color: var(--color-diaper-w);
  color: var(--color-diaper-w);
  font-weight: var(--font-weight-semibold);
}
.diaper-btn--active-p {
  background: #f5e8d4;
  border-color: var(--color-diaper-p);
  color: var(--color-diaper-p);
  font-weight: var(--font-weight-semibold);
}
.diaper-btn--active-wp {
  background: #e8e3f5;
  border-color: var(--color-diaper-wp);
  color: var(--color-diaper-wp);
  font-weight: var(--font-weight-semibold);
}
.diaper-btn--active-dash {
  background: var(--color-surface-alt);
  border-color: var(--color-text-soft);
  color: var(--color-text-soft);
  font-weight: var(--font-weight-semibold);
}

/* Details button */
.entry-row__detail {
  margin-left: auto;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-faint);
  font-size: var(--font-size-lg);
  letter-spacing: 0.05em;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
.entry-row__detail:active {
  background: var(--color-surface-alt);
}

/* ── Line 2: symbol toggles ───────────────────────────────────────────── */

.entry-row__line2 {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3) var(--space-2);
  padding-left: calc(var(--space-3) + 10px + var(--space-2));
}

.sym-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font-family);
  font-size: var(--font-size-xs);
  color: var(--color-text-faint);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  min-width: 36px;
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1px;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  transition: color var(--duration-fast);
}

.sun-icon {
  width: 15px;
  height: 15px;
  display: block;
  flex-shrink: 0;
}

.sym-btn--vitd-on { color: var(--color-gold); }

.sym-btn--med-on {
  color: var(--color-mint);
  font-weight: var(--font-weight-semibold);
}

.sym-btn--tt-on {
  color: var(--color-lavender);
  font-weight: var(--font-weight-semibold);
}

.tt-dur {
  font-size: 9px;
  font-weight: var(--font-weight-semibold);
  line-height: 1;
  margin-left: 1px;
}

.sym-notes {
  padding: var(--space-1);
  line-height: 1;
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font-family);
  font-size: var(--font-size-xs);
  color: var(--color-text-faint);
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.sym-save {
  margin-left: auto;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  transition: color var(--duration-fast);
}
.sym-save--saving { color: var(--color-text-faint); }
.sym-save--saved  { color: var(--color-success); }
.sym-save--error  { color: var(--color-error); }

.med-note-cue {
  font-size: 8px;
  font-weight: var(--font-weight-semibold);
  line-height: 1;
  margin-left: 1px;
}

/* ── Quick-action sheet content (shared by Rx and TT sheets) ─────────── */

.qa-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.qa-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-family: var(--font-family);
  color: var(--color-text);
  background: var(--color-surface);
  box-sizing: border-box;
}
.qa-input:focus {
  outline: none;
  border-color: var(--color-mint);
}

/* TT duration row */
.tt-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  justify-content: center;
  padding: var(--space-2) 0;
}

.tt-duration-input {
  width: 72px;
  padding: var(--space-3) var(--space-2);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xl);
  font-family: var(--font-family);
  color: var(--color-text);
  background: var(--color-surface);
  text-align: center;
  -moz-appearance: textfield;
}
.tt-duration-input::-webkit-inner-spin-button,
.tt-duration-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
}
.tt-duration-input:focus {
  outline: none;
  border-color: var(--color-lavender);
}

.tt-duration-unit {
  font-size: var(--font-size-sm);
  color: var(--color-text-soft);
  font-weight: var(--font-weight-medium);
  min-width: 28px;
}

.qa-hint {
  text-align: center;
  margin-top: calc(-1 * var(--space-2));
}

/* Buttons */
.qa-btns {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.qa-btn {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  border: none;
  min-height: 48px;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  transition: opacity var(--duration-fast);
}
.qa-btn:active { opacity: 0.82; }

.qa-btn--save    { background: var(--color-mint);     color: #fff; }
.qa-btn--save-tt { background: var(--color-lavender); color: #fff; }

.qa-btn--clear {
  background: none;
  border: 1.5px solid var(--color-border);
  color: var(--color-text-soft);
}

.qa-btn--cancel {
  background: none;
  color: var(--color-text-faint);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-normal);
  min-height: 40px;
}
</style>
