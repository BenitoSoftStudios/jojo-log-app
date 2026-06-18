<!-- Help & Legend - parent-facing guide to using Jojo's Log.
     Available without auth (meta.requiresAuth: false). -->
<template>
  <AppLayout>
    <template #header>
      <SecondaryHeader title="Help &amp; Legend" />
    </template>

    <!-- 1. What this app is for -->
    <AppCard>
      <h2 class="section-heading">What Jojo's Log is</h2>
      <p class="text-soft text-sm">
        A shared family log for baby care. Use it to record feeds, diapers,
        vitamin D, medication, Tummy Time, and notes, so everyone looking
        after the baby is on the same page.
      </p>
      <p class="text-faint text-xs disclaimer">
        This is a descriptive log, not feeding or medical guidance.
      </p>
    </AppCard>

    <!-- 2. Quick jump hub -->
    <AppCard>
      <h2 class="section-heading">What do you want to log?</h2>
      <div class="hub-chips" role="list" aria-label="Jump to logging instructions">
        <a class="hub-chip" href="#faq-bottle" role="listitem">Bottle only</a>
        <a class="hub-chip" href="#faq-diaper" role="listitem">Diaper only</a>
        <a class="hub-chip" href="#faq-rx" role="listitem">Medication</a>
        <a class="hub-chip" href="#faq-tummy" role="listitem">Tummy Time</a>
        <a class="hub-chip" href="#faq-note" role="listitem">Note only</a>
        <a class="hub-chip" href="#faq-vitd" role="listitem">Vitamin D</a>
      </div>
    </AppCard>

    <!-- 3. Reading the ledger -->
    <AppCard>
      <h2 class="section-heading">Reading the ledger</h2>
      <ul class="help-list text-sm">
        <li>Entries are grouped by day.</li>
        <li>Each row shows time, feed amount, diaper code, and any extras.</li>
        <li>Bottle amounts are stored in mL. If your family uses fl oz, the app converts display and entry amounts for you. You can change this in Settings.</li>
        <li>Care-only entries like medication or Tummy Time use 0 mL and - to stay complete. Blank amount or blank diaper means the entry is still incomplete.</li>
        <li>The <strong>usual bottle</strong> reminder shown on each week row is a parent-entered reference. It is not advice and does not fill in entries automatically.</li>
      </ul>
    </AppCard>

    <!-- 4. Adding and editing entries -->
    <AppCard>
      <h2 class="section-heading">Adding and editing entries</h2>
      <dl class="legend-list">
        <div class="legend-row align-top">
          <dt class="legend-key">+ Day</dt>
          <dd class="legend-val">Starts a new day. Pick a date and time for the first entry.</dd>
        </div>
        <div class="legend-row align-top">
          <dt class="legend-key">+ Add Entry</dt>
          <dd class="legend-val">Adds another entry to the current open day. Time is pre-filled to the last entry plus the usual interval.</dd>
        </div>
        <div class="legend-row align-top">
          <dt class="legend-key">⋯</dt>
          <dd class="legend-val">Opens Entry Details for that row. Notes can be edited there.</dd>
        </div>
      </dl>
      <p class="text-soft text-sm" style="margin-top: var(--space-3);">
        Amount, diaper, vitamin D, Rx, and Tummy Time can all be changed directly on the row.
        Tap <strong>Save Entry</strong> in Entry Details to save your notes.
      </p>
    </AppCard>

    <!-- 5. Icon legend -->
    <AppCard>
      <h2 class="section-heading">Icon legend</h2>
      <dl class="legend-list">
        <div class="legend-row">
          <dt class="legend-key">mL</dt>
          <dd class="legend-val">Feed amount in millilitres (or fl oz if selected in Settings). Blank means not recorded.</dd>
        </div>
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
          <dd class="legend-val">Diaper not recorded. Entry is incomplete.</dd>
        </div>
        <div class="legend-row">
          <dt class="legend-key">
            <svg class="sun-icon" viewBox="0 0 20 20" aria-hidden="true" fill="none" width="16" height="16">
              <circle cx="10" cy="10" r="3.5" fill="currentColor"/>
              <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M15.78 4.22l-1.42 1.42M5.64 14.36l-1.42 1.42" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </dt>
          <dd class="legend-val">Vitamin D given</dd>
        </div>
        <div class="legend-row">
          <dt class="legend-key">Rx</dt>
          <dd class="legend-val">Medication recorded. Tap to add or edit details.</dd>
        </div>
        <div class="legend-row">
          <dt class="legend-key">★</dt>
          <dd class="legend-val">Tummy Time recorded. Tap to add or edit duration.</dd>
        </div>
        <div class="legend-row">
          <dt class="legend-key">✎</dt>
          <dd class="legend-val">Entry has notes. Tap to read.</dd>
        </div>
        <div class="legend-row">
          <dt class="legend-key">⋯</dt>
          <dd class="legend-val">Open Entry Details</dd>
        </div>
        <div class="legend-row">
          <dt class="legend-key">
            <span class="incomplete-dot-demo" aria-hidden="true"></span>
          </dt>
          <dd class="legend-val">Amber dot: incomplete entry (amount or diaper is blank)</dd>
        </div>
      </dl>

      <h3 class="sub-heading">Sync status</h3>
      <dl class="legend-list">
        <div class="legend-row">
          <dt class="legend-key">
            <span class="sync-dot-demo sync-dot-demo--synced" aria-hidden="true"></span>
          </dt>
          <dd class="legend-val">Green dot: saved and synced</dd>
        </div>
        <div class="legend-row">
          <dt class="legend-key">
            <span class="sync-dot-demo sync-dot-demo--offline" aria-hidden="true"></span>
          </dt>
          <dd class="legend-val">Amber dot: offline or pending sync</dd>
        </div>
        <div class="legend-row">
          <dt class="legend-key">
            <span class="sync-dot-demo sync-dot-demo--error" aria-hidden="true"></span>
          </dt>
          <dd class="legend-val">Red dot: sync issue. Keep screen open until it recovers.</dd>
        </div>
      </dl>
    </AppCard>

    <!-- 6. Tummy Time -->
    <AppCard>
      <h2 class="section-heading">Tummy Time</h2>
      <p class="text-soft text-sm">
        Tap the <strong>★</strong> star on an entry to record a Tummy Time session.
        A sheet opens where you can enter minutes and seconds.
      </p>
      <ul class="help-list text-sm">
        <li>Duration is optional. Leaving it blank still records that a session happened.</li>
        <li>To remove Tummy Time, tap ★ again and choose <strong>Clear Tummy Time</strong>.</li>
      </ul>
    </AppCard>

    <!-- 7. Rx Medication -->
    <AppCard>
      <h2 class="section-heading">Rx Medication</h2>
      <p class="text-soft text-sm">
        Tap <strong>Rx</strong> on an entry to record that medication was given.
        A sheet opens where you can type a name and dosage, for example:
        "Tylenol, 2.5 mL". The note is optional.
      </p>
      <ul class="help-list text-sm">
        <li>Saving without typing a note still records that medication happened.</li>
        <li>To remove medication, tap Rx and choose <strong>Clear Medication</strong>.</li>
      </ul>
      <p class="text-faint text-xs disclaimer">
        This app does not give dosage or medication advice. Follow your doctor's guidance.
      </p>
    </AppCard>

    <!-- 8. Notes and Entry Details -->
    <AppCard>
      <h2 class="section-heading">Notes and Entry Details</h2>
      <p class="text-soft text-sm">
        Notes can be anything the family wants to remember.
        Tap <strong>✎ notes</strong> or the <strong>⋯</strong> button to open Entry Details.
      </p>
      <ul class="help-list text-sm">
        <li>Notes can be edited in Entry Details.</li>
        <li>Entry Details also shows who created or last updated the entry.</li>
        <li>Tap <strong>Save Entry</strong> to keep your changes.</li>
      </ul>
    </AppCard>

    <!-- 9. How do I log... (FAQ) -->
    <AppCard>
      <h2 class="section-heading">How do I log...</h2>
      <p class="text-soft text-sm faq-intro">
        Use 0 mL when there was no feed. Use - when there was no diaper event. Blank means not recorded yet, so the entry stays incomplete.
      </p>
      <dl class="faq-list">
        <div class="faq-row" id="faq-bottle">
          <dt class="faq-q text-sm">How do I log a bottle only?</dt>
          <dd class="faq-a text-sm text-soft">Enter the amount, then tap - for no diaper event.</dd>
        </div>
        <div class="faq-row" id="faq-diaper">
          <dt class="faq-q text-sm">How do I log a diaper only?</dt>
          <dd class="faq-a text-sm text-soft">Enter 0 mL, then choose W, P, or WP.</dd>
        </div>
        <div class="faq-row" id="faq-rx">
          <dt class="faq-q text-sm">How do I log medication only?</dt>
          <dd class="faq-a text-sm text-soft">Enter 0 mL, tap - for no diaper event, tap <strong>Rx</strong>, add details if useful, then save.</dd>
        </div>
        <div class="faq-row" id="faq-tummy">
          <dt class="faq-q text-sm">How do I log Tummy Time only?</dt>
          <dd class="faq-a text-sm text-soft">Enter 0 mL, tap - for no diaper event, tap <strong>★</strong>, add duration if useful, then save.</dd>
        </div>
        <div class="faq-row" id="faq-note">
          <dt class="faq-q text-sm">How do I log a note only?</dt>
          <dd class="faq-a text-sm text-soft">Enter 0 mL, tap - for no diaper event, open Entry Details with the <strong>⋯</strong> button, add the note, and tap <strong>Save Entry</strong>.</dd>
        </div>
        <div class="faq-row" id="faq-vitd">
          <dt class="faq-q text-sm">How do I add vitamin D?</dt>
          <dd class="faq-a text-sm text-soft">Enter 0 mL, tap - for no diaper event, then tap the sun icon. It turns gold when on.</dd>
        </div>
        <div class="faq-row">
          <dt class="faq-q text-sm">How do I edit a note after saving?</dt>
          <dd class="faq-a text-sm text-soft">Tap <strong>✎ notes</strong> or the <strong>⋯</strong> button to open Entry Details, edit the note, and tap <strong>Save Entry</strong>.</dd>
        </div>
        <div class="faq-row">
          <dt class="faq-q text-sm">How do I clear medication or Tummy Time?</dt>
          <dd class="faq-a text-sm text-soft">Tap <strong>Rx</strong> or the star again to open the sheet, then tap <strong>Clear Medication</strong> or <strong>Clear Tummy Time</strong>.</dd>
        </div>
        <div class="faq-row">
          <dt class="faq-q text-sm">Why does Since birth need a birthdate?</dt>
          <dd class="faq-a text-sm text-soft">The Since birth range calculates from the baby's birthdate. Set it in Baby Settings. A nearby date works fine.</dd>
        </div>
        <div class="faq-row">
          <dt class="faq-q text-sm">Why did Import CSV block my file?</dt>
          <dd class="faq-a text-sm text-soft">Import CSV blocks files if the baby name does not match the active baby, if entries are already in the log, or if the file is not a valid Jojo export. Import is owner-only.</dd>
        </div>
      </dl>
    </AppCard>

    <!-- 9. Trends -->
    <AppCard>
      <h2 class="section-heading">Trends</h2>
      <p class="text-soft text-sm">
        Trends summarizes what was logged for the active baby: daily feed volume,
        daily feed count, and Tummy Time sessions.
      </p>
      <ul class="help-list text-sm">
        <li><strong>7 Days</strong> and <strong>30 Days</strong> work without a birthdate.</li>
        <li><strong>Since birth</strong> requires a birthdate in Baby Settings. A nearby date is fine.</li>
        <li>Trends describe what was recorded. They are not feeding guidance.</li>
      </ul>
    </AppCard>

    <!-- 10. Baby Settings and privacy -->
    <AppCard>
      <h2 class="section-heading">Baby Settings and privacy</h2>
      <p class="text-soft text-sm">
        Open <strong>Baby Settings</strong> from the menu to update the nickname,
        birthdate, and animal avatar.
      </p>
      <ul class="help-list text-sm">
        <li>Use a nickname rather than the baby's real name for extra privacy.</li>
        <li>Birthdate is optional. A nearby date works just as well as an exact one.</li>
        <li>Only the <strong>Since birth</strong> Trends range needs a birthdate.</li>
        <li>Animal avatars help identify the baby in the ledger and baby switcher without using a photo.</li>
        <li>Caregivers can view baby details but cannot edit them.</li>
      </ul>
    </AppCard>

    <!-- 11. Family members and caregivers -->
    <AppCard>
      <h2 class="section-heading">Family members and caregivers</h2>
      <ul class="help-list text-sm">
        <li>The <strong>owner</strong> can invite caregivers using an invite link from Manage Caregivers.</li>
        <li>Caregivers can log and edit entries. Some settings are owner-only.</li>
        <li>Each member has a display name and optional initials shown on entries they create or update.</li>
        <li>The owner can manage active members in <strong>Manage Caregivers</strong>.</li>
      </ul>
    </AppCard>

    <!-- 12. Import and Export CSV -->
    <AppCard>
      <h2 class="section-heading">Import and Export CSV</h2>
      <p class="text-soft text-sm">
        <strong>Export CSV</strong> (from the ledger menu) creates a backup file
        of the active baby's full log, including deleted entries.
      </p>
      <p class="text-soft text-sm">
        <strong>Import CSV</strong> reads a Jojo export file and shows a preview
        before writing anything. Import targets the active baby only.
      </p>
      <ul class="help-list text-sm">
        <li>If the baby name in the CSV doesn't match the active baby, import is blocked.</li>
        <li>Duplicate entries are detected and blocked before any data is written.</li>
        <li>The import tool is owner-only.</li>
      </ul>
    </AppCard>

    <!-- 13. Recently Deleted -->
    <AppCard>
      <h2 class="section-heading">Recently Deleted</h2>
      <p class="text-soft text-sm">
        Deleting an entry moves it to Recently Deleted instead of erasing it right away.
        The owner can restore any entry from there. It returns to the log at its original date.
      </p>
    </AppCard>

    <!-- 14. Timezone -->
    <AppCard>
      <h2 class="section-heading">Timezone</h2>
      <p class="text-soft text-sm">
        The family timezone (set in Settings) controls what "today" means in the
        ledger and Trends. Set it to where you normally log care.
        Stored entries are not changed if you update it later.
      </p>
    </AppCard>

    <!-- 15. What this app is not -->
    <AppCard class="not-card">
      <h2 class="section-heading">What this app is not</h2>
      <ul class="help-list text-sm">
        <li>It is not medical advice.</li>
        <li>It does not recommend what to feed, give, or do.</li>
        <li>It does not replace a doctor, nurse, lactation consultant, or emergency care.</li>
        <li>For health concerns, contact your healthcare provider or local emergency services.</li>
      </ul>
    </AppCard>

  </AppLayout>
</template>

<script setup>
import AppLayout from '@/ui/AppLayout.vue'
import SecondaryHeader from '@/ui/SecondaryHeader.vue'
import AppCard from '@/ui/AppCard.vue'
</script>

<style scoped>
.section-heading {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-3);
}

.sub-heading {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-soft);
  margin-top: var(--space-4);
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
  display: flex;
  align-items: center;
}

.legend-val {
  font-size: var(--font-size-sm);
  color: var(--color-text-soft);
}

.sun-icon {
  color: var(--color-sand, #f5c842);
  display: block;
}

.incomplete-dot-demo {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-incomplete);
}

.sync-dot-demo {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
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

.disclaimer {
  margin-top: var(--space-3);
}

/* ── FAQ list ─────────────────────────────────────────────────────────── */

.faq-intro {
  background: var(--color-mint-soft);
  border-radius: var(--radius-sm);
  padding: var(--space-3);
  margin-bottom: var(--space-3);
  line-height: 1.5;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.faq-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border-soft);
}

.faq-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.faq-q {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin: 0;
}

.faq-a {
  margin: 0;
  color: var(--color-text-soft);
  line-height: 1.5;
}

:deep(.page-container) { display: flex; flex-direction: column; gap: var(--space-4); }

/* ── Quick jump hub ─────────────────────────────────────────────────────── */

.hub-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.hub-chip {
  display: inline-flex;
  align-items: center;
  padding: var(--space-2) var(--space-3);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface-alt);
  color: var(--color-text-soft);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  min-height: 36px;
  -webkit-tap-highlight-color: transparent;
}

.hub-chip:active {
  background: var(--color-mint-soft);
  border-color: var(--color-mint);
  color: var(--color-mint);
}

/* offset for sticky header so anchors don't land underneath it */
.faq-row[id] {
  scroll-margin-top: calc(var(--header-height) + var(--space-4));
}
</style>
