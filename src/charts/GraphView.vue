<!-- Graphs — redesigned for mobile readability.
     Segmented range control, summary stat cards, SVG bar charts with
     7-day avg line, tap-to-inspect, feed count, tummy time, notable days.
     No new Firestore listeners — reads existing entries singleton. -->
<template>
  <AppLayout>
    <template #header>
      <router-link class="back-btn" to="/" aria-label="Back">←</router-link>
      <span class="header-title">Graph</span>
    </template>

    <!-- No active baby -->
    <div v-if="!activeBaby" class="empty-state">
      <p class="text-faint text-sm">No active baby selected.</p>
    </div>

    <template v-else>
      <!-- Segmented range control -->
      <div class="seg-control" role="group" aria-label="Date range">
        <button
          v-for="r in RANGES"
          :key="r.key"
          class="seg-btn"
          :class="{ 'seg-btn--active': selectedRange === r.key }"
          type="button"
          @click="selectedRange = r.key"
        >{{ r.label }}</button>
      </div>

      <!-- Summary stat cards -->
      <div v-if="dailyStats.length > 0" class="stats-row">
        <div class="stat-card">
          <div class="stat-value">{{ avgMl }}</div>
          <div class="stat-unit">mL / day avg</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ avgFeeds }}</div>
          <div class="stat-unit">feeds / day avg</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ totalTummy }}</div>
          <div class="stat-unit">tummy sessions</div>
        </div>
      </div>

      <!-- No entries -->
      <div v-if="dailyStats.length === 0" class="empty-state">
        <p class="text-faint text-sm">No entries in this range.</p>
      </div>

      <template v-else>
        <!-- ── Daily mL ─────────────────────────────────────────────── -->
        <AppCard>
          <div class="chart-header">
            <h2 class="chart-title">Daily mL</h2>
            <span v-if="latestRolling !== null" class="chart-avg-badge text-faint text-xs">
              7-day avg {{ latestRolling }} mL
            </span>
          </div>

          <!-- Selected-day callout -->
          <div v-if="selectedDay" class="day-callout">
            <span class="day-callout-date text-sm">{{ formatDayLabel(selectedDay.date) }}</span>
            <span class="day-callout-sep text-faint text-xs">·</span>
            <span class="day-callout-val text-sm">{{ selectedDay.totalMl }} mL</span>
            <span class="day-callout-sep text-faint text-xs">·</span>
            <span class="day-callout-val text-sm">{{ selectedDay.feedCount }} feeds</span>
            <template v-if="selectedDay.tummyCount > 0">
              <span class="day-callout-sep text-faint text-xs">·</span>
              <span class="day-callout-val text-sm">{{ selectedDay.tummyCount }} tummy</span>
            </template>
          </div>

          <div class="chart-scroll">
            <svg :width="svgWidth" height="175" class="chart-svg">
              <!-- Column highlights (selected + today) — drawn first so bars sit on top -->
              <template v-for="(row, i) in dailyStats" :key="`hl-${row.date}`">
                <rect
                  v-if="selectedIdx === i"
                  :x="i * colWidth" y="0"
                  :width="colWidth" :height="ML_FLOOR + 22"
                  class="col-selected"
                />
                <rect
                  v-else-if="i === todayIdx"
                  :x="i * colWidth" y="0"
                  :width="colWidth" :height="ML_FLOOR + 22"
                  class="col-today"
                />
              </template>

              <!-- Baseline -->
              <line x1="0" :x2="svgWidth" :y1="ML_FLOOR" :y2="ML_FLOOR" class="chart-baseline" />

              <!-- Bars -->
              <rect
                v-for="(row, i) in dailyStats"
                :key="`bar-${row.date}`"
                v-if="mlBarH(row.totalMl) > 0"
                :x="i * colWidth + barPad" :y="ML_FLOOR - mlBarH(row.totalMl)"
                :width="barInnerW" :height="mlBarH(row.totalMl)"
                :class="i === todayIdx ? 'chart-bar chart-bar--today' : 'chart-bar'"
                rx="3"
              />

              <!-- 7-day rolling avg line (dashed) -->
              <polyline
                v-if="avgLinePoints && mlMax > 0"
                :points="avgLinePoints"
                class="avg-line"
              />

              <!-- Date labels (mL chart only) -->
              <text
                v-for="(row, i) in dailyStats"
                :key="`lbl-${row.date}`"
                v-if="showDateLabel(i)"
                :x="i * colWidth + colWidth / 2"
                y="160"
                text-anchor="middle"
                class="chart-date"
              >{{ dateLabel(row.date) }}</text>

              <!-- Transparent hit areas (drawn last = on top) -->
              <rect
                v-for="(row, i) in dailyStats"
                :key="`hit-${row.date}`"
                :x="i * colWidth" y="0"
                :width="colWidth" :height="ML_FLOOR + 22"
                fill="transparent"
                style="cursor:pointer"
                @click="selectDay(i)"
              />
            </svg>
          </div>
        </AppCard>

        <!-- ── Feed count ───────────────────────────────────────────── -->
        <AppCard>
          <h2 class="chart-title">Daily feed count</h2>
          <p v-if="feedMax === 0" class="text-faint text-sm chart-empty-note">No feeds in this range.</p>
          <div v-else class="chart-scroll">
            <svg :width="svgWidth" :height="compactSvgH" class="chart-svg">
              <line x1="0" :x2="svgWidth" :y1="CT_FLOOR" :y2="CT_FLOOR" class="chart-baseline" />
              <rect
                v-for="(row, i) in dailyStats"
                :key="`fb-${row.date}`"
                v-if="feedBarH(row.feedCount) > 0"
                :x="i * colWidth + barPad" :y="CT_FLOOR - feedBarH(row.feedCount)"
                :width="barInnerW" :height="feedBarH(row.feedCount)"
                class="chart-bar"
                rx="2"
              />
              <text
                v-for="(row, i) in dailyStats"
                :key="`fdl-${row.date}`"
                v-if="showCompactDates && showDateLabel(i)"
                :x="i * colWidth + colWidth / 2"
                :y="CT_FLOOR + 14"
                text-anchor="middle"
                class="chart-date"
              >{{ dateLabel(row.date) }}</text>
            </svg>
          </div>
        </AppCard>

        <!-- ── Tummy time ───────────────────────────────────────────── -->
        <AppCard>
          <h2 class="chart-title">Tummy time sessions</h2>
          <p v-if="tummyMax === 0" class="text-faint text-sm chart-empty-note">No sessions in this range.</p>
          <div v-else class="chart-scroll">
            <svg :width="svgWidth" :height="compactSvgH" class="chart-svg">
              <line x1="0" :x2="svgWidth" :y1="CT_FLOOR" :y2="CT_FLOOR" class="chart-baseline" />
              <rect
                v-for="(row, i) in dailyStats"
                :key="`tb-${row.date}`"
                v-if="tummyBarH(row.tummyCount) > 0"
                :x="i * colWidth + barPad" :y="CT_FLOOR - tummyBarH(row.tummyCount)"
                :width="barInnerW" :height="tummyBarH(row.tummyCount)"
                class="chart-bar chart-bar--tummy"
                rx="2"
              />
              <text
                v-for="(row, i) in dailyStats"
                :key="`tdl-${row.date}`"
                v-if="showCompactDates && showDateLabel(i)"
                :x="i * colWidth + colWidth / 2"
                :y="CT_FLOOR + 14"
                text-anchor="middle"
                class="chart-date"
              >{{ dateLabel(row.date) }}</text>
            </svg>
          </div>
        </AppCard>

        <!-- ── Notable days ────────────────────────────────────────── -->
        <AppCard v-if="hasNotableData">
          <h2 class="chart-title">Notable days</h2>
          <dl class="notable-list">
            <div v-if="highestMlDay" class="notable-row">
              <dt class="notable-label text-faint text-sm">Highest mL</dt>
              <dd class="notable-val text-sm">{{ highestMlDay.totalMl }} mL — {{ formatDayLabel(highestMlDay.date) }}</dd>
            </div>
            <div v-if="mostFeedsDay" class="notable-row">
              <dt class="notable-label text-faint text-sm">Most feeds</dt>
              <dd class="notable-val text-sm">{{ mostFeedsDay.feedCount }} feeds — {{ formatDayLabel(mostFeedsDay.date) }}</dd>
            </div>
            <div v-if="mostTummyDay" class="notable-row">
              <dt class="notable-label text-faint text-sm">Most tummy time</dt>
              <dd class="notable-val text-sm">{{ mostTummyDay.tummyCount }} sessions — {{ formatDayLabel(mostTummyDay.date) }}</dd>
            </div>
          </dl>
        </AppCard>
      </template>
    </template>
  </AppLayout>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import AppLayout from '@/ui/AppLayout.vue'
import AppCard   from '@/ui/AppCard.vue'
import { useEntries }         from '@/entries/useEntries.js'
import { useBabies }          from '@/babies/useBabies.js'
import { useFamily }          from '@/families/useFamily.js'
import { getTodayInTimezone } from '@/utils/dateUtils.js'
import { computeDailyStats, sevenDayRollingAvg, addDays } from '@/utils/graphData.js'

// ── Ranges ─────────────────────────────────────────────────────────────────

const RANGES = [
  { key: '7d',    label: '7 Days' },
  { key: '30d',   label: '30 Days' },
  { key: 'birth', label: 'Since birth' },
]

// ── SVG coordinate constants ────────────────────────────────────────────────

const ML_FLOOR = 140   // baseline y in mL chart (SVG height 175)
const ML_MAX_H = 125   // maximum bar height
const CT_FLOOR = 62    // baseline y in compact charts (feed / tummy)
const CT_MAX_H = 54    // max bar height in compact charts

// ── Composables ────────────────────────────────────────────────────────────

const { entries }        = useEntries()
const { activeBaby }     = useBabies()
const { familyTimezone } = useFamily()

// ── State ──────────────────────────────────────────────────────────────────

const selectedRange = ref('30d')
const selectedIdx   = ref(null)

// Clear selected bar when range changes
watch(selectedRange, () => { selectedIdx.value = null })

// ── Date helpers ────────────────────────────────────────────────────────────

const todayDate = computed(() => getTodayInTimezone(familyTimezone.value))

// "Since birth" starts at the 1st of the baby's birth month if birthdate exists.
// Falls back to null so computeDailyStats uses the earliest entry date.
const sinceBirthStart = computed(() => {
  const bd = activeBaby.value?.birthdate
  if (bd && bd.length >= 7) return bd.slice(0, 7) + '-01'  // "YYYY-MM-01"
  return null
})

const startDate = computed(() => {
  const today = todayDate.value
  if (selectedRange.value === '7d')    return addDays(today, -6)
  if (selectedRange.value === '30d')   return addDays(today, -29)
  return sinceBirthStart.value  // null → earliest entry date
})

// ── Data ───────────────────────────────────────────────────────────────────

const dailyStats = computed(() =>
  computeDailyStats(entries.value, startDate.value, todayDate.value)
)

const mlMax    = computed(() => Math.max(0, ...dailyStats.value.map(d => d.totalMl)))
const feedMax  = computed(() => Math.max(0, ...dailyStats.value.map(d => d.feedCount)))
const tummyMax = computed(() => Math.max(0, ...dailyStats.value.map(d => d.tummyCount)))

const rollingAvgs   = computed(() => sevenDayRollingAvg(dailyStats.value))
const latestRolling = computed(() => {
  const a = rollingAvgs.value
  return a.length > 0 ? a[a.length - 1] : null
})

// ── Summary stats (over days that have any activity) ──────────────────────

const daysWithData = computed(() =>
  dailyStats.value.filter(d => d.feedCount > 0 || d.totalMl > 0)
)
const avgMl = computed(() => {
  const n = daysWithData.value.length
  if (n === 0) return 0
  return Math.round(daysWithData.value.reduce((s, d) => s + d.totalMl, 0) / n)
})
const avgFeeds = computed(() => {
  const n = daysWithData.value.length
  if (n === 0) return 0
  const raw = daysWithData.value.reduce((s, d) => s + d.feedCount, 0) / n
  return raw % 1 === 0 ? raw : raw.toFixed(1)
})
const totalTummy = computed(() =>
  dailyStats.value.reduce((s, d) => s + d.tummyCount, 0)
)

// ── Notable days ────────────────────────────────────────────────────────────

const highestMlDay = computed(() => {
  const days = dailyStats.value.filter(d => d.totalMl > 0)
  return days.length ? days.reduce((m, d) => d.totalMl > m.totalMl ? d : m) : null
})
const mostFeedsDay = computed(() => {
  const days = dailyStats.value.filter(d => d.feedCount > 0)
  return days.length ? days.reduce((m, d) => d.feedCount > m.feedCount ? d : m) : null
})
const mostTummyDay = computed(() => {
  const days = dailyStats.value.filter(d => d.tummyCount > 0)
  return days.length ? days.reduce((m, d) => d.tummyCount > m.tummyCount ? d : m) : null
})
const hasNotableData = computed(() =>
  highestMlDay.value !== null || mostFeedsDay.value !== null || mostTummyDay.value !== null
)

// ── Selected day ────────────────────────────────────────────────────────────

const todayIdx = computed(() =>
  dailyStats.value.findIndex(d => d.date === todayDate.value)
)
const selectedDay = computed(() =>
  selectedIdx.value !== null ? (dailyStats.value[selectedIdx.value] ?? null) : null
)

function selectDay(i) {
  selectedIdx.value = selectedIdx.value === i ? null : i
}

// ── Chart geometry ─────────────────────────────────────────────────────────

// Column width adapts so 7d and 30d charts fit in ~340px (mobile card width)
// without scrolling; "since birth" scrolls horizontally.
const colWidth = computed(() => {
  const n = dailyStats.value.length
  if (n <= 7)  return 44   //  7 × 44 = 308 px — no scroll on iPhone
  if (n <= 30) return 11   // 30 × 11 = 330 px — no scroll on iPhone
  if (n <= 90) return 10
  return 8
})

const svgWidth  = computed(() => Math.max(300, dailyStats.value.length * colWidth.value))
const barPad    = computed(() => Math.max(1, Math.round(colWidth.value * 0.1)))
const barInnerW = computed(() => Math.max(1, colWidth.value - barPad.value * 2))

// Compact charts need room for date labels in "since birth" (> 30 days)
const showCompactDates = computed(() => dailyStats.value.length > 30)
const compactSvgH      = computed(() => showCompactDates.value ? 90 : 72)

// ── Bar height functions ────────────────────────────────────────────────────

function mlBarH(value) {
  if (mlMax.value === 0 || value === 0) return 0
  return Math.max(3, Math.round((value / mlMax.value) * ML_MAX_H))
}
function feedBarH(value) {
  if (feedMax.value === 0 || value === 0) return 0
  return Math.max(3, Math.round((value / feedMax.value) * CT_MAX_H))
}
function tummyBarH(value) {
  if (tummyMax.value === 0 || value === 0) return 0
  return Math.max(3, Math.round((value / tummyMax.value) * CT_MAX_H))
}

// ── Rolling average polyline ───────────────────────────────────────────────

const avgLinePoints = computed(() => {
  if (mlMax.value === 0) return ''
  return rollingAvgs.value.map((avg, i) => {
    const x = i * colWidth.value + colWidth.value / 2
    const y = ML_FLOOR - Math.round((avg / mlMax.value) * ML_MAX_H)
    return `${x},${y}`
  }).join(' ')
})

// ── Date label helpers ─────────────────────────────────────────────────────

function showDateLabel(i) {
  const n = dailyStats.value.length
  const w = colWidth.value
  if (w >= 30) return true                          // 7d: show all
  if (w >= 10) return i % 5  === 0 || i === n - 1  // 30d: every 5th + last
  return        i % 14 === 0 || i === n - 1         // birth: every 2 weeks + last
}

function dateLabel(dateStr) {
  if (colWidth.value >= 30) {
    // 7d: weekday abbreviation ("Mon", "Tue" …)
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-CA', { weekday: 'short' })
  }
  // 30d / since birth: day number or M/D
  const [, m, d] = dateStr.split('-')
  return colWidth.value >= 10 ? String(Number(d)) : `${Number(m)}/${Number(d)}`
}

function formatDayLabel(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-CA', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}
</script>

<style scoped>
/* ── Layout ──────────────────────────────────────────────────────────────── */

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
:deep(.page-container) { display: flex; flex-direction: column; gap: var(--space-4); }

/* ── Segmented control ───────────────────────────────────────────────────── */

.seg-control {
  display: flex;
  background: var(--color-surface-alt);
  border-radius: var(--radius-lg);
  padding: 3px;
  gap: 2px;
}
.seg-btn {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  color: var(--color-text-soft);
  background: none;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background var(--duration-fast), color var(--duration-fast);
}
.seg-btn--active {
  background: var(--color-mint);
  color: #fff;
  font-weight: var(--font-weight-medium);
}

/* ── Summary stat cards ─────────────────────────────────────────────────── */

.stats-row {
  display: flex;
  gap: var(--space-3);
}
.stat-card {
  flex: 1;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-2);
  text-align: center;
}
.stat-value {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  line-height: 1.2;
}
.stat-unit {
  font-size: var(--font-size-xs);
  color: var(--color-text-faint);
  margin-top: 2px;
}

/* ── Chart cards ─────────────────────────────────────────────────────────── */

.chart-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
}
.chart-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-soft);
  margin: 0;
}
.chart-avg-badge {
  flex-shrink: 0;
}
.chart-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  width: 100%;
  margin-top: var(--space-2);
}
.chart-svg {
  display: block;
}
.chart-empty-note {
  margin-top: var(--space-1);
}

/* ── Day callout (tapped bar) ────────────────────────────────────────────── */

.day-callout {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--color-mint-soft);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-2);
}
.day-callout-date {
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
}
.day-callout-sep { line-height: 1; }
.day-callout-val { color: var(--color-text-soft); }

/* ── SVG element styles ──────────────────────────────────────────────────── */

.chart-bar        { fill: var(--color-mint); }
.chart-bar--today { fill: var(--color-success); }
.chart-bar--tummy { fill: var(--color-lavender); }
.chart-baseline   { stroke: var(--color-border); stroke-width: 1; }

/* Column highlights */
.col-selected { fill: var(--color-mint-soft); }
.col-today    { fill: var(--color-surface-alt); }

/* Rolling average line */
.avg-line {
  stroke: var(--color-mint);
  stroke-width: 1.5;
  fill: none;
  stroke-dasharray: 4 3;
  opacity: 0.55;
}

/* Text elements */
.chart-date {
  font-size: 9px;
  fill: var(--color-text-faint);
  font-family: var(--font-family);
}

/* ── Notable days ────────────────────────────────────────────────────────── */

.notable-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: var(--space-2);
}
.notable-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.notable-label { margin: 0; }
.notable-val   { color: var(--color-text); font-weight: var(--font-weight-medium); margin: 0; }

/* ── Empty states ────────────────────────────────────────────────────────── */

.empty-state {
  padding: var(--space-8) var(--space-4);
  text-align: center;
}
</style>
