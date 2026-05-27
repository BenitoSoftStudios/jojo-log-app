<!-- Help / Legend — explains symbols, + Day, + Add Entry, indicators, sync status.
     Available without auth (meta.requiresAuth: false). -->
<template>
  <AppLayout>
    <template #header>
      <router-link class="back-btn" to="/" aria-label="Back">←</router-link>
      <span class="header-title">Help &amp; Legend</span>
    </template>

    <AppCard>
      <h2 class="section-heading">Diaper symbols</h2>
      <dl class="legend-list">
        <div class="legend-row">
          <dt class="legend-key diaper-w">W</dt>
          <dd class="legend-val">Wet diaper</dd>
        </div>
        <div class="legend-row">
          <dt class="legend-key diaper-p">P</dt>
          <dd class="legend-val">Poop</dd>
        </div>
        <div class="legend-row">
          <dt class="legend-key diaper-wp">WP</dt>
          <dd class="legend-val">Wet and poop</dd>
        </div>
        <div class="legend-row">
          <dt class="legend-key">–</dt>
          <dd class="legend-val">No diaper event</dd>
        </div>
        <div class="legend-row">
          <dt class="legend-key text-faint">blank</dt>
          <dd class="legend-val">Not recorded (entry is incomplete)</dd>
        </div>
      </dl>
    </AppCard>

    <AppCard>
      <h2 class="section-heading">Indicators</h2>
      <dl class="legend-list">
        <div class="legend-row">
          <dt class="legend-key">☀</dt>
          <dd class="legend-val">Vitamin D given</dd>
        </div>
        <div class="legend-row">
          <dt class="legend-key">Med</dt>
          <dd class="legend-val">Medication given (details in notes)</dd>
        </div>
        <div class="legend-row">
          <dt class="legend-key">★</dt>
          <dd class="legend-val">Tummy time — tap to cycle the count up. Tap again to reset.</dd>
        </div>
        <div class="legend-row">
          <dt class="legend-key">Notes</dt>
          <dd class="legend-val">Tap the notes indicator to open the entry detail and read the full note.</dd>
        </div>
        <div class="legend-row">
          <dt class="legend-key incomplete-dot-demo" aria-hidden="true"></dt>
          <dd class="legend-val">Amber dot — incomplete entry (amount or diaper is blank)</dd>
        </div>
      </dl>
    </AppCard>

    <AppCard>
      <h2 class="section-heading">Adding entries</h2>
      <dl class="legend-list">
        <div class="legend-row align-top">
          <dt class="legend-key">+ Day</dt>
          <dd class="legend-val">
            Opens a date and time picker. Choose today, tomorrow, or any past date,
            then set the time for the first entry on that day.
          </dd>
        </div>
        <div class="legend-row align-top">
          <dt class="legend-key">+ Add Entry</dt>
          <dd class="legend-val">
            Adds another entry to the current open day. The time is pre-filled
            to the last entry time plus the usual interval.
          </dd>
        </div>
      </dl>
    </AppCard>

    <AppCard>
      <h2 class="section-heading">Completion rules</h2>
      <ul class="help-list text-sm">
        <li>An entry is <strong>complete</strong> when both amount and diaper are filled in.</li>
        <li><strong>0 mL</strong> is a valid amount — the entry is not incomplete.</li>
        <li><strong>–</strong> is a valid diaper value — the entry is not incomplete.</li>
        <li>Vitamin D, Medication, and Notes do not affect completion.</li>
      </ul>
    </AppCard>

    <AppCard>
      <h2 class="section-heading">Sync status</h2>
      <dl class="legend-list">
        <div class="legend-row">
          <dt class="sync-dot-demo sync-dot-demo--synced" aria-hidden="true"></dt>
          <dd class="legend-val">Green dot — synced</dd>
        </div>
        <div class="legend-row">
          <dt class="sync-dot-demo sync-dot-demo--offline" aria-hidden="true"></dt>
          <dd class="legend-val">Amber dot — offline, changes may sync later</dd>
        </div>
        <div class="legend-row">
          <dt class="sync-dot-demo sync-dot-demo--error" aria-hidden="true"></dt>
          <dd class="legend-val">Red dot — sync issue</dd>
        </div>
      </dl>
      <p class="text-faint text-xs" style="margin-top: var(--space-3);">
        If you see a sync issue, keep the screen open until it reconnects.
        If you are worried about data, take a screenshot of the open day.
      </p>
    </AppCard>

    <AppCard>
      <h2 class="section-heading">Usual bottle</h2>
      <p class="text-soft text-sm">
        Usual bottle is an optional parent-entered reminder for the week.
        It does not calculate, recommend, or replace medical feeding guidance.
        It does not auto-fill new entries — amount fields always start blank.
      </p>
      <p class="text-soft text-sm">
        Tap <strong>Edit</strong> on any week row to set or clear the value.
        Leave blank to clear it.
      </p>
    </AppCard>

    <AppCard>
      <h2 class="section-heading">Timezone</h2>
      <p class="text-soft text-sm">
        The family timezone (set in Settings) controls what "today" means:
        the header date and time, daily stats, and the default time on new entries.
        Stored entries are not changed when the timezone is updated.
      </p>
    </AppCard>

    <AppCard>
      <h2 class="section-heading">Privacy note</h2>
      <p class="text-soft text-sm">
        Avoid entering health card numbers, addresses, or sensitive medical
        details in the notes field. This app is a care ledger, not a medical record.
      </p>
    </AppCard>
  </AppLayout>
</template>

<script setup>
import AppLayout from '@/ui/AppLayout.vue'
import AppCard from '@/ui/AppCard.vue'
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

.section-heading {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-3);
}

.legend-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.legend-row {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.legend-row.align-top { align-items: flex-start; }

.legend-key {
  min-width: 48px;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  flex-shrink: 0;
}

.legend-val {
  font-size: var(--font-size-sm);
  color: var(--color-text-soft);
}

.incomplete-dot-demo {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-incomplete);
  min-width: 48px;
}

.sync-dot-demo {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  min-width: 48px;
  flex-shrink: 0;
}
.sync-dot-demo--synced  { background: var(--color-mint); }
.sync-dot-demo--offline { background: var(--color-sand); }
.sync-dot-demo--error   { background: var(--color-error); }

.help-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-left: var(--space-4);
  color: var(--color-text-soft);
}

.help-list li { line-height: 1.5; }

:deep(.page-container) { display: flex; flex-direction: column; gap: var(--space-4); }
</style>
