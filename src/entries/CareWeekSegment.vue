<!-- Collapsible week segment. Shows usual bottle reminder below the header. -->
<template>
  <div class="care-week">

    <!-- Toggle header -->
    <button
      class="care-week__header"
      type="button"
      :aria-expanded="isOpen"
      @click="emit('toggle-week')"
    >
      <span class="care-week__label text-soft text-sm">{{ week.label }}</span>
      <span class="care-week__ml text-faint text-xs">{{ week.totalMl }} mL</span>
      <span class="care-week__chevron" :class="{ 'care-week__chevron--open': isOpen }">›</span>
    </button>

    <!-- Usual bottle sub-row — always visible while week is rendered -->
    <div class="care-week__bottle" :class="{ 'care-week__bottle--row': !editing }">
      <template v-if="!editing">
        <span class="care-week__bottle-label text-faint text-xs">
          Usual bottle: {{ usualAmount !== null ? usualAmount + ' mL' : 'not set' }}
        </span>
        <button class="care-week__bottle-btn text-xs" type="button" @click="startEdit">
          Edit
        </button>
      </template>
      <template v-else>
        <div class="care-week__bottle-edit-row">
          <input
            ref="inputRef"
            class="care-week__bottle-input"
            type="number"
            v-model="editVal"
            min="0"
            max="500"
            step="1"
            inputmode="numeric"
            placeholder="—"
            @keydown.enter.prevent="handleSave"
            @keydown.escape.prevent="cancelEdit"
          />
          <span class="text-faint text-xs">mL</span>
          <button class="care-week__bottle-btn text-xs" type="button" :disabled="saving" @click="handleSave">
            {{ saving ? '…' : 'Save' }}
          </button>
          <button class="care-week__bottle-btn care-week__bottle-btn--cancel text-xs" type="button" @click="cancelEdit">
            ×
          </button>
        </div>
        <p class="care-week__bottle-hint text-faint" style="font-size:10px;">
          Optional reminder for this week. This does not calculate or recommend intake.
        </p>
        <p v-if="editError" class="care-week__bottle-error text-xs">{{ editError }}</p>
      </template>
    </div>

    <!-- Collapsible days body -->
    <div v-if="isOpen" class="care-week__body">
      <CareDay
        v-for="day in week.days"
        :key="day.date"
        :day="day"
        :is-open="openDays.has(day.date)"
        :sort-order="sortOrder"
        @toggle="emit('toggle-day', day.date)"
        @add-entry="(d) => emit('add-entry', d)"
        @update-entry="(id, changes) => emit('update-entry', id, changes)"
        @open-detail="(e) => emit('open-detail', e)"
      />
    </div>

  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import CareDay from './CareDay.vue'
import { useWeeklySettings } from './useWeeklySettings.js'

const props = defineProps({
  week:      { type: Object,  required: true },
  monthKey:  { type: String,  required: true },
  isOpen:    { type: Boolean, default: false },
  openDays:  { type: Set,     required: true },
  sortOrder: { type: String,  default: 'newest-first' },
})
const emit = defineEmits(['toggle-week', 'toggle-day', 'add-entry', 'update-entry', 'open-detail'])

const { loadWeekSettings, getBottleAmount, saveBottleAmount } = useWeeklySettings()

onMounted(() => loadWeekSettings(props.week.weekStartDate))

const usualAmount = computed(() => getBottleAmount(props.week.weekStartDate))

const editing   = ref(false)
const editVal   = ref('')
const saving    = ref(false)
const editError = ref('')
const inputRef  = ref(null)

function startEdit() {
  editVal.value   = usualAmount.value !== null ? String(usualAmount.value) : ''
  editError.value = ''
  editing.value   = true
  nextTick(() => inputRef.value?.focus())
}

function cancelEdit() {
  editing.value   = false
  editError.value = ''
}

async function handleSave() {
  const raw = editVal.value.trim()
  let parsed = null
  if (raw !== '') {
    parsed = parseInt(raw, 10)
    if (isNaN(parsed) || parsed < 0 || parsed > 500) {
      editError.value = 'Enter a number 0–500, or leave blank to clear.'
      return
    }
  }
  saving.value    = true
  editError.value = ''
  try {
    await saveBottleAmount(props.week.weekStartDate, parsed)
    editing.value = false
  } catch (e) {
    console.error('[CareWeekSegment] saveBottleAmount failed', e)
    editError.value = 'Failed to save. Check your connection.'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.care-week {
  border-bottom: 1px solid var(--color-border);
}

.care-week__header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2) var(--space-4);
  background: var(--color-row-week);
  border: none;
  cursor: pointer;
  text-align: left;
  font-family: var(--font-family);
  min-height: 40px;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
.care-week__header:active {
  filter: brightness(0.97);
}

.care-week__label {
  flex: 1;
  text-align: left;
}

.care-week__ml { flex-shrink: 0; }

.care-week__chevron {
  flex-shrink: 0;
  color: var(--color-text-faint);
  font-size: var(--font-size-md);
  transition: transform var(--duration-fast) var(--ease-out);
}
.care-week__chevron--open { transform: rotate(90deg); }

/* ── Usual bottle sub-row ─────────────────────────────────────────────── */

.care-week__bottle {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: var(--space-1) var(--space-4) var(--space-2);
  background: var(--color-row-week);
  border-top: 1px solid var(--color-border-soft);
}

.care-week__bottle--row {
  flex-direction: row;
  align-items: center;
}

.care-week__bottle-label {
  flex: 1;
  line-height: 1.4;
}

.care-week__bottle-edit-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.care-week__bottle-input {
  width: 56px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  font-family: var(--font-family);
  font-size: var(--font-size-xs);
  color: var(--color-text);
  padding: 2px var(--space-2);
  text-align: right;
  -moz-appearance: textfield;
}
.care-week__bottle-input::-webkit-inner-spin-button,
.care-week__bottle-input::-webkit-outer-spin-button { -webkit-appearance: none; }
.care-week__bottle-input:focus {
  outline: none;
  border-color: var(--color-mint);
}

.care-week__bottle-btn {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-family);
  color: var(--color-text-soft);
  cursor: pointer;
  padding: 2px var(--space-2);
  line-height: 1.4;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
.care-week__bottle-btn:disabled  { opacity: 0.5; cursor: default; }
.care-week__bottle-btn--cancel   { color: var(--color-text-faint); }

.care-week__bottle-hint  { line-height: 1.4; }
.care-week__bottle-error { color: var(--color-error); line-height: 1.4; }
</style>
