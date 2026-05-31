<!-- Trends page — mobile-first, readable charts.
     Segmented range control, summary stat cards, SVG bar charts with
     monthly grouping for Since birth, period-avg line, tap-to-inspect.
     No new Firestore listeners — reads existing entries singleton. -->
<template>
  <AppLayout>
    <template #header>
      <router-link class="back-btn" to="/" aria-label="Back">←</router-link>
      <span class="header-title">Trends</span>
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
          <div class="stat-unit">mL/day</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ avgFeeds }}</div>
          <div class="stat-unit">feeds/day</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ totalTummy }}</div>
          <div class="stat-unit">tummy sessions</div>
        </div>
      </div>

      <!-- Explanatory banner -->
      <div v-if="dailyStats.length > 0" class="trends-banner">
        <p class="trends-banner-body text-soft text-sm">
          Trends summarizes what was logged for this baby: daily volume, feed count, and Tummy Time.
          Tap a Daily volume bar to inspect a day.
        </p>
        <p class="trends-banner-note text-faint text-xs">Descriptive log only. Not feeding guidance.</p>
      </div>

      <!-- No entries -->
      <div v-if="dailyStats.length === 0" class="empty-state">
        <p class="text-faint text-sm">No entries in this range.</p>
      </div>

      <template v-else>
        <!-- ── Volume chart ──────────────────────────────────────────── -->
        <AppCard>
          <div class="chart-header">
            <h2 class="chart-title">{{ volumeTitle }}</h2>
            <span v-if="latestRolling !== null && !useMonthlyView" class="text-faint text-xs">
              7-day avg {{ latestRolling }} mL
            </span>
          </div>

          <!-- Callout — defaults to today or latest row -->
          <div v-if="displayRow" class="day-callout">
            <span class="day-callout-date text-sm">{{ displayRowLabel(displayRow) }}</span>
            <span class="day-callout-sep text-faint text-xs">·</span>
            <span class="day-callout-val text-sm">{{ displayRow.totalMl }} mL</span>
            <span class="day-callout-sep text-faint text-xs">·</span>
            <span class="day-callout-val text-sm">{{ displayRow.feedCount }} feeds</span>
            <template v-if="displayRow.tummyCount > 0">
              <span class="day-callout-sep text-faint text-xs">·</span>
              <span class="day-callout-val text-sm">{{ displayRow.tummyCount }} tummy</span>
            </template>
            <span v-if="selectedIdx === null" class="day-callout-hint text-faint text-xs">tap to inspect</span>
          </div>

          <div class="chart-scroll">
            <svg :width="svgWidth" height="175" class="chart-svg">
              <!-- Y-axis scale hint: max value at top-left -->
              <text v-if="chartMlMax > 0" x="3" y="12" class="chart-axis-label">{{ chartMlMax }} mL</text>

              <!-- Column highlights: today (subtle) + selected (mint) -->
              <template v-for="(row, i) in chartRows" :key="`hl-${i}`">
                <rect
                  v-if="i === todayChartIdx"
                  :x="i * colWidth" y="0"
                  :width="colWidth" height="150"
                  class="col-today"
                />
                <rect
                  v-if="selectedIdx !== null && selectedIdx === i"
                  :x="i * colWidth" y="0"
                  :width="colWidth" height="150"
                  class="col-selected"
                />
              </template>

              <!-- Baseline -->
              <line x1="0" :x2="svgWidth" :y1="ML_FLOOR" :y2="ML_FLOOR" class="chart-baseline" />

              <!-- Period average horizontal line -->
              <line
                v-if="periodAvgMlY !== null"
                x1="0" :x2="svgWidth"
                :y1="periodAvgMlY" :y2="periodAvgMlY"
                class="avg-h-line"
              />

              <!-- Bars — template wrapper avoids v-if + v-for on same element -->
              <template v-for="(row, i) in chartRows" :key="`mlb-${i}`">
                <rect
                  v-if="mlBarH(row.totalMl) > 0"
                  :x="i * colWidth + barPad" :y="ML_FLOOR - mlBarH(row.totalMl)"
                  :width="barInnerW" :height="mlBarH(row.totalMl)"
                  :class="i === todayChartIdx ? 'chart-bar chart-bar--today' : 'chart-bar'"
                  rx="3"
                />
              </template>

              <!-- 7-day rolling avg polyline (daily mode only) -->
              <polyline
                v-if="avgLinePoints && !useMonthlyView"
                :points="avgLinePoints"
                class="avg-line"
              />

              <!-- Date / month labels -->
              <template v-for="(row, i) in chartRows" :key="`lbl-${i}`">
                <text
                  v-if="showChartLabel(i)"
                  :x="i * colWidth + colWidth / 2"
                  y="160"
                  text-anchor="middle"
                  class="chart-date"
                >{{ chartLabel(row) }}</text>
              </template>

              <!-- Transparent hit areas — drawn last so they sit on top -->
              <rect
                v-for="(row, i) in chartRows"
                :key="`hit-${i}`"
                :x="i * colWidth" y="0"
                :width="colWidth" height="175"
                fill="transparent"
                style="cursor:pointer"
                @click="selectDay(i)"
              />
            </svg>
          </div>
        </AppCard>

        <!-- ── Feeds chart ──────────────────────────────────────────── -->
        <AppCard>
          <h2 class="chart-title chart-title--compact">{{ feedsTitle }}</h2>
          <p v-if="chartFeedMax === 0" class="text-faint text-xs chart-empty-note">No feeds recorded.</p>
          <div v-else class="chart-scroll">
            <svg :width="svgWidth" :height="compactSvgH" class="chart-svg">
              <!-- Y-axis scale hint -->
              <text v-if="chartFeedMax > 0" x="3" y="10" class="chart-axis-label">{{ chartFeedMax }}</text>
              <line x1="0" :x2="svgWidth" :y1="CT_FLOOR" :y2="CT_FLOOR" class="chart-baseline" />
              <template v-for="(row, i) in chartRows" :key="`fb-${i}`">
                <rect
                  v-if="feedBarH(row.feedCount) > 0"
                  :x="i * colWidth + barPad" :y="CT_FLOOR - feedBarH(row.feedCount)"
                  :width="barInnerW" :height="feedBarH(row.feedCount)"
                  class="chart-bar"
                  rx="2"
                />
              </template>
              <template v-for="(row, i) in chartRows" :key="`fdl-${i}`">
                <text
                  v-if="showChartLabel(i)"
                  :x="i * colWidth + colWidth / 2"
                  :y="CT_FLOOR + 14"
                  text-anchor="middle"
                  class="chart-date"
                >{{ chartLabel(row) }}</text>
              </template>
            </svg>
          </div>
        </AppCard>

        <!-- ── Tummy time chart ────────────────────────────────────── -->
        <AppCard>
          <h2 class="chart-title chart-title--compact">Tummy time</h2>
          <p v-if="chartTummyMax === 0" class="text-faint text-xs chart-empty-note">No sessions recorded.</p>
          <div v-else class="chart-scroll">
            <svg :width="svgWidth" :height="compactSvgH" class="chart-svg">
              <!-- Y-axis scale hint -->
              <text v-if="chartTummyMax > 0" x="3" y="10" class="chart-axis-label">{{ chartTummyMax }}</text>
              <line x1="0" :x2="svgWidth" :y1="CT_FLOOR" :y2="CT_FLOOR" class="chart-baseline" />
              <template v-for="(row, i) in chartRows" :key="`tb-${i}`">
                <rect
                  v-if="tummyBarH(row.tummyCount) > 0"
                  :x="i * colWidth + barPad" :y="CT_FLOOR - tummyBarH(row.tummyCount)"
                  :width="barInnerW" :height="tummyBarH(row.tummyCount)"
                  class="chart-bar chart-bar--tummy"
                  rx="2"
                />
              </template>
              <template v-for="(row, i) in chartRows" :key="`tdl-${i}`">
                <text
                  v-if="showChartLabel(i)"
                  :x="i * colWidth + colWidth / 2"
                  :y="CT_FLOOR + 14"
                  text-anchor="middle"
                  class="chart-date"
                >{{ chartLabel(row) }}</text>
              </template>
            </svg>
          </div>
        </AppCard>

        <!-- ── Notable days ────────────────────────────────────────── -->
        <AppCard v-if="hasNotableData">
          <h2 class="chart-title">Notable days</h2>
          <dl class="notable-list">
            <div v-if="highestMlDay" class="notable-row">
              <dt class="notable-label text-faint text-sm">Highest volume</dt>
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
import {
  computeDailyStats,
  sevenDayRollingAvg,
  addDays,
  groupByMonth,
} from '@/utils/graphData.js'

// ── Ranges ─────────────────────────────────────────────────────────────────

const RANGES = [
  { key: '7d',    label: '7 Days' },
  { key: '30d',   label: '30 Days' },
  { key: 'birth', label: 'Since birth' },
]

// ── SVG coordinate constants ────────────────────────────────────────────────

const ML_FLOOR = 140   // baseline y in mL chart (SVG height 175)
const ML_MAX_H = 120   // maximum bar height above baseline
const CT_FLOOR = 62    // baseline y in compact charts
const CT_MAX_H = 54    // max bar height in compact charts

// ── Composables ────────────────────────────────────────────────────────────

const { entries }        = useEntries()
const { activeBaby }     = useBabies()
const { familyTimezone } = useFamily()

// ── State ──────────────────────────────────────────────────────────────────

const selectedRange = ref('30d')
const selectedIdx   = ref(null)

watch(selectedRange, () => { selectedIdx.value = null })

// ── Date helpers ────────────────────────────────────────────────────────────

const todayDate = computed(() => getTodayInTimezone(familyTimezone.value))

// "Since birth" starts at the 1st of the baby's birth month if birthdate exists.
// Falls back to null so computeDailyStats uses the earliest entry date.
const sinceBirthStart = computed(() => {
  const bd = activeBaby.value?.birthdate
  if (bd && bd.length >= 7) return bd.slice(0, 7) + '-01'
  return null
})

const startDate = computed(() => {
  const today = todayDate.value
  if (selectedRange.value === '7d')    return addDays(today, -6)
  if (selectedRange.value === '30d')   return addDays(today, -29)
  return sinceBirthStart.value  // null → earliest entry date
})

// ── Daily data ─────────────────────────────────────────────────────────────

const dailyStats = computed(() =>
  computeDailyStats(entries.value, startDate.value, todayDate.value)
)

// ── Monthly grouping for Since birth with many days ────────────────────────

const useMonthlyView = computed(() =>
  selectedRange.value === 'birth' && dailyStats.value.length > 30
)

const monthlyStats = computed(() =>
  useMonthlyView.value ? groupByMonth(dailyStats.value) : []
)

// chartRows: what the SVG charts iterate over (daily or monthly)
const chartRows = computed(() =>
  useMonthlyView.value ? monthlyStats.value : dailyStats.value
)

// Max values scale bars — always based on chartRows
const chartMlMax    = computed(() => Math.max(0, ...chartRows.value.map(d => d.totalMl)))
const chartFeedMax  = computed(() => Math.max(0, ...chartRows.value.map(d => d.feedCount)))
const chartTummyMax = computed(() => Math.max(0, ...chartRows.value.map(d => d.tummyCount)))

// ── Rolling average (daily mode only) ─────────────────────────────────────

const rollingAvgs   = computed(() => sevenDayRollingAvg(dailyStats.value))
const latestRolling = computed(() => {
  const a = rollingAvgs.value
  return a.length > 0 ? a[a.length - 1] : null
})

// ── Summary stats (over days with activity — avoids zero-fill inflation) ──

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

// ── Notable days (always from dailyStats for day-level precision) ──────────

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

// ── Today index in chartRows ────────────────────────────────────────────────

const todayChartIdx = computed(() => {
  if (useMonthlyView.value) {
    const mk = todayDate.value.slice(0, 7)
    return monthlyStats.value.findIndex(m => m.monthKey === mk)
  }
  return dailyStats.value.findIndex(d => d.date === todayDate.value)
})

// displayIdx: explicit tap or default to today/latest
const displayIdx = computed(() => {
  if (selectedIdx.value !== null) return selectedIdx.value
  const t = todayChartIdx.value
  if (t >= 0) return t
  return chartRows.value.length > 0 ? chartRows.value.length - 1 : -1
})
const displayRow = computed(() =>
  displayIdx.value >= 0 ? (chartRows.value[displayIdx.value] ?? null) : null
)

function selectDay(i) {
  selectedIdx.value = selectedIdx.value === i ? null : i
}

// ── Chart geometry ─────────────────────────────────────────────────────────

// Column width: 7d/30d fit on iPhone (no scroll); birth scrolls
const colWidth = computed(() => {
  if (useMonthlyView.value) {
    return monthlyStats.value.length <= 12 ? 48 : 36
  }
  const n = dailyStats.value.length
  if (n <= 7)  return 44   //  7 × 44 = 308 px
  if (n <= 30) return 11   // 30 × 11 = 330 px
  if (n <= 90) return 10
  return 8
})

const svgWidth  = computed(() => Math.max(300, chartRows.value.length * colWidth.value))
const barPad    = computed(() => Math.max(2, Math.round(colWidth.value * 0.1)))
const barInnerW = computed(() => Math.max(1, colWidth.value - barPad.value * 2))

// Show date labels below compact charts in monthly mode or long daily ranges
const compactSvgH = 90  // always include room for x-axis labels

// ── Bar height functions ────────────────────────────────────────────────────

function mlBarH(value) {
  if (chartMlMax.value === 0 || value === 0) return 0
  return Math.max(3, Math.round((value / chartMlMax.value) * ML_MAX_H))
}
function feedBarH(value) {
  if (chartFeedMax.value === 0 || value === 0) return 0
  return Math.max(3, Math.round((value / chartFeedMax.value) * CT_MAX_H))
}
function tummyBarH(value) {
  if (chartTummyMax.value === 0 || value === 0) return 0
  return Math.max(3, Math.round((value / chartTummyMax.value) * CT_MAX_H))
}

// ── Period average horizontal line ─────────────────────────────────────────

const periodAvgMlY = computed(() => {
  const withData = chartRows.value.filter(r => r.feedCount > 0 || r.totalMl > 0)
  if (!withData.length || chartMlMax.value === 0) return null
  const avg = withData.reduce((s, d) => s + d.totalMl, 0) / withData.length
  const y = ML_FLOOR - Math.round((avg / chartMlMax.value) * ML_MAX_H)
  return y < ML_FLOOR - 4 ? y : null  // skip if it would sit on the baseline
})

// ── Rolling average polyline (daily mode only) ─────────────────────────────

const avgLinePoints = computed(() => {
  if (useMonthlyView.value || chartMlMax.value === 0) return ''
  return rollingAvgs.value.map((avg, i) => {
    const x = i * colWidth.value + colWidth.value / 2
    const y = ML_FLOOR - Math.round((avg / chartMlMax.value) * ML_MAX_H)
    return `${x},${y}`
  }).join(' ')
})

// ── Chart label helpers ─────────────────────────────────────────────────────

const volumeTitle = computed(() => useMonthlyView.value ? 'Monthly volume' : 'Daily volume')
const feedsTitle  = computed(() => useMonthlyView.value ? 'Monthly feeds'  : 'Daily feeds')

function showChartLabel(i) {
  if (useMonthlyView.value) return true  // always show all month labels
  return showDateLabel(i)
}

function chartLabel(row) {
  if (useMonthlyView.value) return row.label.slice(0, 3)  // "Mar"
  return dateLabel(row.date)
}

function showDateLabel(i) {
  const n = dailyStats.value.length
  const w = colWidth.value
  if (w >= 30) return true                          // 7d: every column
  if (w >= 10) return i % 5  === 0 || i === n - 1  // 30d: every 5th + last
  return        i % 14 === 0 || i === n - 1         // birth daily: every 2w + last
}

function dateLabel(dateStr) {
  if (colWidth.value >= 30) {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-CA', { weekday: 'short' })
  }
  const [, m, d] = dateStr.split('-')
  return colWidth.value >= 10 ? String(Number(d)) : `${Number(m)}/${Number(d)}`
}

function displayRowLabel(row) {
  if (useMonthlyView.value) return row.label  // "Mar 2026"
  return formatDayLabel(row.date)
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

/* ── Explanatory banner ──────────────────────────────────────────────────── */

.trends-banner {
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.trends-banner-body { margin: 0; line-height: 1.5; }
.trends-banner-note { margin: 0; }

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
.chart-title--compact {
  font-size: var(--font-size-xs);
  margin-bottom: var(--space-2);
}
.chart-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  width: 100%;
}
.chart-svg {
  display: block;
}
.chart-empty-note {
  margin-top: var(--space-1);
}

/* ── Day / month callout ─────────────────────────────────────────────────── */

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
.day-callout-date  { font-weight: var(--font-weight-medium); color: var(--color-text); }
.day-callout-sep   { line-height: 1; }
.day-callout-val   { color: var(--color-text-soft); }
.day-callout-hint  { margin-left: auto; }

/* ── SVG element styles ──────────────────────────────────────────────────── */

.chart-bar        { fill: var(--color-mint); }
.chart-bar--today { fill: var(--color-success); }
.chart-bar--tummy { fill: var(--color-lavender); }
.chart-baseline   { stroke: var(--color-border); stroke-width: 1; }

/* Column highlights */
.col-selected { fill: var(--color-mint-soft); }
.col-today    { fill: var(--color-surface-alt); }

/* 7-day rolling average polyline */
.avg-line {
  stroke: var(--color-mint);
  stroke-width: 1.5;
  fill: none;
  stroke-dasharray: 4 3;
  opacity: 0.55;
}

/* Period average horizontal line */
.avg-h-line {
  stroke: var(--color-text-faint);
  stroke-width: 1;
  stroke-dasharray: 3 4;
  opacity: 0.6;
}

/* Date / month text */
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
