<!-- Graph View — monthly daily bar chart + year-by-month chart.
     Phase 7: pure SVG charts, no external library. -->
<template>
  <AppLayout>
    <template #header>
      <router-link class="back-btn" to="/" aria-label="Back">←</router-link>
      <span class="header-title">Graph</span>
    </template>

    <!-- Daily chart -->
    <AppCard>
      <div class="chart-header">
        <h2 class="chart-heading">Daily volume — {{ currentMonthLabel }}</h2>
        <span class="chart-unit text-faint text-xs">{{ unitLabel }}</span>
      </div>

      <div v-if="dailyBars.length === 0" class="chart-empty">
        <p class="text-faint text-sm">No entries this month.</p>
      </div>
      <div v-else class="chart-wrap" aria-hidden="true">
        <svg
          class="bar-chart"
          :viewBox="`0 0 ${svgW} ${svgH}`"
          preserveAspectRatio="none"
        >
          <g v-for="bar in dailyBars" :key="bar.date">
            <rect
              :x="bar.x"
              :y="bar.y"
              :width="bar.w"
              :height="bar.h"
              :class="bar.isToday ? 'bar bar--today' : 'bar'"
              rx="2"
            />
            <text
              v-if="bar.showLabel"
              :x="bar.x + bar.w / 2"
              :y="svgH - 2"
              class="bar-label"
              text-anchor="middle"
            >{{ bar.dayNum }}</text>
          </g>
          <!-- Zero line -->
          <line :x1="0" :y1="chartBottom" :x2="svgW" :y2="chartBottom" class="zero-line" />
        </svg>
        <p class="chart-max text-faint text-xs">Max: {{ formatAmt(dailyMax) }}</p>
      </div>
    </AppCard>

    <!-- Monthly chart -->
    <AppCard>
      <div class="chart-header">
        <h2 class="chart-heading">Monthly volume — {{ currentYear }}</h2>
        <span class="chart-unit text-faint text-xs">{{ unitLabel }}</span>
      </div>

      <div v-if="monthlyBars.length === 0" class="chart-empty">
        <p class="text-faint text-sm">No entries this year.</p>
      </div>
      <div v-else class="chart-wrap" aria-hidden="true">
        <svg
          class="bar-chart"
          :viewBox="`0 0 ${svgW} ${svgH}`"
          preserveAspectRatio="none"
        >
          <g v-for="bar in monthlyBars" :key="bar.month">
            <rect
              :x="bar.x"
              :y="bar.y"
              :width="bar.w"
              :height="bar.h"
              :class="bar.isCurrent ? 'bar bar--today' : 'bar'"
              rx="2"
            />
            <text
              :x="bar.x + bar.w / 2"
              :y="svgH - 2"
              class="bar-label"
              text-anchor="middle"
            >{{ bar.abbr }}</text>
          </g>
          <line :x1="0" :y1="chartBottom" :x2="svgW" :y2="chartBottom" class="zero-line" />
        </svg>
        <p class="chart-max text-faint text-xs">Max: {{ formatAmt(monthlyMax) }}</p>
      </div>
    </AppCard>
  </AppLayout>
</template>

<script setup>
import { computed } from 'vue'
import AppLayout from '@/ui/AppLayout.vue'
import AppCard   from '@/ui/AppCard.vue'
import { entries }    from '@/entries/useEntries.js'
import { family }     from '@/families/useFamily.js'
import { todayString } from '@/utils/dateUtils.js'
import { formatAmount, mlToFlOz } from '@/utils/unitConverter.js'

// ── Chart dimensions ────────────────────────────────────────────────────────
const svgW        = 300
const svgH        = 120
const chartTop    = 10
const chartBottom = 105   // bottom of bars; label text lives 105–120
const chartH      = chartBottom - chartTop
const barGap      = 1

// ── Unit ────────────────────────────────────────────────────────────────────
const unit      = computed(() => family.value?.unitPreference ?? 'ml')
const unitLabel = computed(() => unit.value === 'floz' ? 'fl oz' : 'mL')

function toDisplay(ml) {
  return unit.value === 'floz' ? mlToFlOz(ml) : ml
}

function formatAmt(ml) {
  return formatAmount(ml, unit.value)
}

// ── Date helpers ─────────────────────────────────────────────────────────────
const today       = todayString()
const currentMonth = today.slice(0, 7)   // 'YYYY-MM'
const currentYear  = today.slice(0, 4)

const currentMonthLabel = computed(() => {
  const d = new Date(currentMonth + '-15')
  return d.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })
})

// Days in the current month
function daysInMonth(ym) {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

// ── Active (non-deleted) entries ─────────────────────────────────────────────
const activeEntries = computed(() => entries.value.filter(e => !e.deleted))

// ── Daily chart data ─────────────────────────────────────────────────────────
const dailyTotals = computed(() => {
  const map = new Map()
  for (const e of activeEntries.value) {
    if (e.entryDate.slice(0, 7) !== currentMonth) continue
    const ml = typeof e.amountMl === 'number' ? e.amountMl : 0
    map.set(e.entryDate, (map.get(e.entryDate) ?? 0) + ml)
  }
  return map
})

const dailyMax = computed(() => {
  let max = 0
  for (const v of dailyTotals.value.values()) if (v > max) max = v
  return max
})

const dailyBars = computed(() => {
  const totalDays = daysInMonth(currentMonth)
  const barW = (svgW - barGap * (totalDays - 1)) / totalDays
  const maxMl = dailyMax.value || 1

  return Array.from({ length: totalDays }, (_, i) => {
    const dayNum = i + 1
    const dateStr = `${currentMonth}-${String(dayNum).padStart(2, '0')}`
    const ml  = dailyTotals.value.get(dateStr) ?? 0
    const h   = Math.max(ml > 0 ? 2 : 0, (ml / maxMl) * chartH)
    const x   = i * (barW + barGap)
    const y   = chartBottom - h

    return {
      date: dateStr,
      dayNum,
      x, y,
      w: barW,
      h,
      isToday:   dateStr === today,
      showLabel: totalDays <= 31 && dayNum % (totalDays > 20 ? 5 : 3) === 1
    }
  })
})

// ── Monthly chart data ────────────────────────────────────────────────────────
const MONTH_ABBRS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const monthlyTotals = computed(() => {
  const map = new Map()
  for (const e of activeEntries.value) {
    if (!e.entryDate.startsWith(currentYear)) continue
    const ym = e.entryDate.slice(0, 7)
    const ml = typeof e.amountMl === 'number' ? e.amountMl : 0
    map.set(ym, (map.get(ym) ?? 0) + ml)
  }
  return map
})

const monthlyMax = computed(() => {
  let max = 0
  for (const v of monthlyTotals.value.values()) if (v > max) max = v
  return max
})

const monthlyBars = computed(() => {
  const months = 12
  const barW = (svgW - barGap * (months - 1)) / months
  const maxMl = monthlyMax.value || 1

  return Array.from({ length: 12 }, (_, i) => {
    const ym  = `${currentYear}-${String(i + 1).padStart(2, '0')}`
    const ml  = monthlyTotals.value.get(ym) ?? 0
    const h   = Math.max(ml > 0 ? 2 : 0, (ml / maxMl) * chartH)
    const x   = i * (barW + barGap)
    const y   = chartBottom - h

    return {
      month:     ym,
      abbr:      MONTH_ABBRS[i],
      x, y,
      w:         barW,
      h,
      isCurrent: ym === currentMonth
    }
  })
})
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

.chart-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.chart-heading {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-soft);
}

.chart-unit { margin-left: var(--space-2); }

.chart-empty {
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-wrap {
  position: relative;
}

.bar-chart {
  width: 100%;
  height: 120px;
  display: block;
  overflow: visible;
}

.bar {
  fill: var(--color-mint);
  opacity: 0.7;
}

.bar--today {
  fill: var(--color-mint);
  opacity: 1;
}

.bar-label {
  font-size: 7px;
  fill: var(--color-text-faint);
}

.zero-line {
  stroke: var(--color-border);
  stroke-width: 0.5;
}

.chart-max {
  text-align: right;
  margin-top: var(--space-1);
}

:deep(.page-container) { display: flex; flex-direction: column; gap: var(--space-4); }
</style>
