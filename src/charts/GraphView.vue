<!-- Graphs — daily mL total, feed count, and tummy time sessions.
     Uses the existing entries subscription (no new Firestore listeners).
     Respects family timezone for date bucketing. -->
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
      <!-- Range selector -->
      <div class="range-pills">
        <button
          v-for="r in RANGES"
          :key="r.key"
          class="range-pill"
          :class="{ 'range-pill--active': selectedRange === r.key }"
          type="button"
          @click="selectedRange = r.key"
        >{{ r.label }}</button>
      </div>

      <!-- No entries in range -->
      <div v-if="dailyStats.length === 0" class="empty-state">
        <p class="text-faint text-sm">No entries in this range.</p>
      </div>

      <template v-else>
        <!-- Daily total mL -->
        <AppCard>
          <h2 class="chart-title">Daily total mL</h2>
          <div class="chart-scroll">
            <svg :width="svgWidth" height="150" class="chart-svg">
              <!-- Baseline -->
              <line x1="0" :x2="svgWidth" y1="120" y2="120" class="chart-baseline" />
              <!-- Max value label -->
              <text x="2" y="12" class="chart-ymax">{{ mlMax }} mL</text>
              <template v-for="(row, i) in dailyStats" :key="row.date">
                <rect
                  v-if="barH(row.totalMl, mlMax) > 0"
                  :x="i * colWidth + barPad"
                  :y="120 - barH(row.totalMl, mlMax)"
                  :width="barInnerW"
                  :height="barH(row.totalMl, mlMax)"
                  class="chart-bar"
                  rx="2"
                />
                <text
                  v-if="showValueLabel(row.totalMl, barH(row.totalMl, mlMax))"
                  :x="i * colWidth + colWidth / 2"
                  :y="Math.max(10, 120 - barH(row.totalMl, mlMax) - 3)"
                  text-anchor="middle"
                  class="chart-val"
                >{{ row.totalMl }}</text>
                <text
                  v-if="showDateLabel(i)"
                  :x="i * colWidth + colWidth / 2"
                  y="138"
                  text-anchor="middle"
                  class="chart-date"
                >{{ shortDate(row.date) }}</text>
              </template>
            </svg>
          </div>
          <p v-if="latestRolling !== null" class="chart-footer text-faint text-xs">
            7-day rolling avg: {{ latestRolling }} mL
          </p>
        </AppCard>

        <!-- Daily feed count -->
        <AppCard>
          <h2 class="chart-title">Daily feed count</h2>
          <div class="chart-scroll">
            <svg :width="svgWidth" height="150" class="chart-svg">
              <line x1="0" :x2="svgWidth" y1="120" y2="120" class="chart-baseline" />
              <text x="2" y="12" class="chart-ymax">{{ feedMax }}</text>
              <template v-for="(row, i) in dailyStats" :key="row.date">
                <rect
                  v-if="barH(row.feedCount, feedMax) > 0"
                  :x="i * colWidth + barPad"
                  :y="120 - barH(row.feedCount, feedMax)"
                  :width="barInnerW"
                  :height="barH(row.feedCount, feedMax)"
                  class="chart-bar"
                  rx="2"
                />
                <text
                  v-if="showValueLabel(row.feedCount, barH(row.feedCount, feedMax))"
                  :x="i * colWidth + colWidth / 2"
                  :y="Math.max(10, 120 - barH(row.feedCount, feedMax) - 3)"
                  text-anchor="middle"
                  class="chart-val"
                >{{ row.feedCount }}</text>
                <text
                  v-if="showDateLabel(i)"
                  :x="i * colWidth + colWidth / 2"
                  y="138"
                  text-anchor="middle"
                  class="chart-date"
                >{{ shortDate(row.date) }}</text>
              </template>
            </svg>
          </div>
        </AppCard>

        <!-- Tummy time sessions -->
        <AppCard>
          <h2 class="chart-title">Tummy time sessions</h2>
          <p v-if="tummyMax === 0" class="text-faint text-sm chart-no-data">
            No sessions recorded in this range.
          </p>
          <div v-else class="chart-scroll">
            <svg :width="svgWidth" height="150" class="chart-svg">
              <line x1="0" :x2="svgWidth" y1="120" y2="120" class="chart-baseline" />
              <text x="2" y="12" class="chart-ymax">{{ tummyMax }}</text>
              <template v-for="(row, i) in dailyStats" :key="row.date">
                <rect
                  v-if="barH(row.tummyCount, tummyMax) > 0"
                  :x="i * colWidth + barPad"
                  :y="120 - barH(row.tummyCount, tummyMax)"
                  :width="barInnerW"
                  :height="barH(row.tummyCount, tummyMax)"
                  class="chart-bar"
                  rx="2"
                />
                <text
                  v-if="showValueLabel(row.tummyCount, barH(row.tummyCount, tummyMax))"
                  :x="i * colWidth + colWidth / 2"
                  :y="Math.max(10, 120 - barH(row.tummyCount, tummyMax) - 3)"
                  text-anchor="middle"
                  class="chart-val"
                >{{ row.tummyCount }}</text>
                <text
                  v-if="showDateLabel(i)"
                  :x="i * colWidth + colWidth / 2"
                  y="138"
                  text-anchor="middle"
                  class="chart-date"
                >{{ shortDate(row.date) }}</text>
              </template>
            </svg>
          </div>
        </AppCard>
      </template>
    </template>
  </AppLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppLayout from '@/ui/AppLayout.vue'
import AppCard   from '@/ui/AppCard.vue'
import { useEntries }              from '@/entries/useEntries.js'
import { useBabies }               from '@/babies/useBabies.js'
import { useFamily }               from '@/families/useFamily.js'
import { getTodayInTimezone }      from '@/utils/dateUtils.js'
import { computeDailyStats, sevenDayRollingAvg, addDays } from '@/utils/graphData.js'

const RANGES = [
  { key: '7d',  label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: 'all', label: 'All' },
]

// Bar area constants (SVG coordinate space, height="150")
const BAR_FLOOR = 120  // y position of the baseline
const BAR_MAX_H = 108  // maximum bar height in px

const { entries }     = useEntries()
const { activeBaby }  = useBabies()
const { familyTimezone } = useFamily()

const selectedRange = ref('30d')

const todayDate = computed(() => getTodayInTimezone(familyTimezone.value))

const startDate = computed(() => {
  const today = todayDate.value
  if (selectedRange.value === '7d')  return addDays(today, -6)
  if (selectedRange.value === '30d') return addDays(today, -29)
  return null  // 'all' → computeDailyStats uses earliest entry date
})

const dailyStats = computed(() =>
  computeDailyStats(entries.value, startDate.value, todayDate.value)
)

const mlMax    = computed(() => Math.max(0, ...dailyStats.value.map(d => d.totalMl)))
const feedMax  = computed(() => Math.max(0, ...dailyStats.value.map(d => d.feedCount)))
const tummyMax = computed(() => Math.max(0, ...dailyStats.value.map(d => d.tummyCount)))

const rollingAvgs   = computed(() => sevenDayRollingAvg(dailyStats.value))
const latestRolling = computed(() => {
  const avgs = rollingAvgs.value
  return avgs.length > 0 ? avgs[avgs.length - 1] : null
})

// Column width adapts to number of data points so bars are readable on mobile
const colWidth = computed(() => {
  const n = dailyStats.value.length
  if (n <=  7) return 40
  if (n <= 30) return 16
  if (n <= 90) return 10
  return 8
})

const svgWidth  = computed(() => Math.max(300, dailyStats.value.length * colWidth.value))
const barPad    = computed(() => Math.max(1, Math.floor(colWidth.value * 0.1)))
const barInnerW = computed(() => Math.max(1, colWidth.value - barPad.value * 2))

function barH(value, maxVal) {
  if (maxVal === 0 || value === 0) return 0
  return Math.max(3, Math.round((value / maxVal) * BAR_MAX_H))
}

// Show the numeric value label above a bar when there's enough width and height
function showValueLabel(value, bh) {
  if (value === 0) return false
  if (colWidth.value >= 30) return true       // 7d: always
  if (colWidth.value >= 14) return bh >= 18   // 30d: tall bars only
  return false                                // narrow: never
}

// Skip date labels to avoid overlap at narrow column widths
function showDateLabel(i) {
  const n = dailyStats.value.length
  const w = colWidth.value
  if (w >= 30) return true                          // 7d
  if (w >= 14) return i % 5  === 0 || i === n - 1  // 30d: every 5th + last
  return        i % 14 === 0 || i === n - 1         // all: every 2 weeks + last
}

function shortDate(dateStr) {
  const [, m, d] = dateStr.split('-')
  return `${Number(m)}/${Number(d)}`
}
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

/* ── Range pills ─────────────────────────────────────────────────────────── */

.range-pills {
  display: flex;
  gap: var(--space-2);
  padding: 0 var(--space-1);
}

.range-pill {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  color: var(--color-text-soft);
  background: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background var(--duration-fast, 0.15s), color var(--duration-fast, 0.15s),
              border-color var(--duration-fast, 0.15s);
}

.range-pill--active {
  background: var(--color-mint);
  color: #fff;
  border-color: var(--color-mint);
}

/* ── Charts ──────────────────────────────────────────────────────────────── */

.chart-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-soft);
  margin-bottom: var(--space-3);
}

.chart-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  width: 100%;
}

.chart-svg {
  display: block;
}

/* SVG element styles */
.chart-bar      { fill: var(--color-mint); }
.chart-baseline { stroke: var(--color-border); stroke-width: 1; }
.chart-ymax     { font-size: 9px; fill: var(--color-text-faint); font-family: var(--font-family); }
.chart-val      { font-size: 9px; fill: var(--color-text-soft); font-family: var(--font-family); }
.chart-date     { font-size: 9px; fill: var(--color-text-faint); font-family: var(--font-family); }

.chart-footer {
  margin-top: var(--space-2);
}

.chart-no-data {
  margin-top: var(--space-1);
}

/* ── Empty states ────────────────────────────────────────────────────────── */

.empty-state {
  padding: var(--space-8) var(--space-4);
  text-align: center;
}

/* Card spacing */
:deep(.page-container) { display: flex; flex-direction: column; gap: var(--space-4); }
</style>
