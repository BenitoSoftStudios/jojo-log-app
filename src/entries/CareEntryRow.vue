<!-- Inline-editable entry row. Each field saves immediately on change/blur.
     Layout: two lines.
       Line 1: incomplete dot · time · mL · diaper selector (W P WP -) · details button
       Line 2: symbol toggles ☀ Rx ★ · notes indicator
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
      <div class="entry-row__diaper-group" role="group" aria-label="Diaper">
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
      <button
        class="sym-btn"
        :class="{ 'sym-btn--on': entry.vitaminD }"
        type="button"
        :aria-label="entry.vitaminD ? 'Vitamin D on — tap to turn off' : 'Vitamin D off — tap to turn on'"
        @click="emit('update', entry.id, { vitaminD: !entry.vitaminD })"
      >☀</button>
      <button
        class="sym-btn"
        :class="{ 'sym-btn--on': entry.medication }"
        type="button"
        :aria-label="entry.medication ? 'Medication on — tap to turn off' : 'Medication off — tap to turn on'"
        @click="emit('update', entry.id, { medication: !entry.medication })"
      >Rx</button>
      <button
        class="sym-btn"
        :class="{ 'sym-btn--on': tummyTime }"
        type="button"
        :aria-label="tummyTime ? 'Tummy time on — tap to turn off' : 'Tummy time off — tap to turn on'"
        @click="emit('update', entry.id, { tummyTime: !tummyTime })"
      >★</button>
      <span
        v-if="hasNotes"
        class="sym-notes text-faint text-xs"
        aria-label="Has notes"
      >✎ notes</span>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { isIncomplete } from '@/utils/entryUtils.js'

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

const incomplete = computed(() => isIncomplete(props.entry))
const tummyTime  = computed(() => props.entry.tummyTime ?? false)
const hasNotes   = computed(() => !!(props.entry.notes))
const mlDisplay  = computed(() => props.entry.amountMl ?? '')

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
  emit('update', props.entry.id, { diaper: value })
}

function onTimeBlur(e) {
  const val = e.target.value
  if (val && val !== props.entry.entryTime) {
    emit('update', props.entry.id, { entryTime: val })
  }
}

function onMlBlur(e) {
  const raw = e.target.value.trim()
  if (raw === '') {
    if (props.entry.amountMl !== null) {
      emit('update', props.entry.id, { amountMl: null })
    }
  } else {
    const n = parseInt(raw, 10)
    if (!isNaN(n) && n !== props.entry.amountMl) {
      emit('update', props.entry.id, { amountMl: n })
    }
  }
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
}
.entry-row__ml::-webkit-inner-spin-button,
.entry-row__ml::-webkit-outer-spin-button {
  -webkit-appearance: none;
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
}

.diaper-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  min-height: 28px;
  padding: 2px 4px;
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

/* WP needs a bit more room for 2 characters */
.diaper-btn:nth-child(3) {
  min-width: 32px;
}

/* Active states — colour-coded per value */
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
  /* indent to align with line 1 content (past dot area) */
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
  min-width: 32px;
  min-height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.sym-btn--on {
  color: var(--color-mint);
  font-weight: var(--font-weight-semibold);
}

.sym-notes {
  padding: var(--space-1);
  line-height: 1;
}
</style>
