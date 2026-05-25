<!-- Admin-only: Legacy CSV import preview tool. Preview only — no Firestore writes in this phase. -->
<template>
  <AppLayout>
    <template #header>
      <router-link class="back-btn" to="/" aria-label="Back">←</router-link>
      <span class="header-title">Legacy Import</span>
    </template>

    <!-- Admin gate -->
    <div v-if="!isLegacyImportAdmin" class="gate-denied">
      <p class="gate-denied__msg text-sm">Access denied. Admin only.</p>
      <router-link class="gate-denied__link text-sm" to="/">← Back to ledger</router-link>
    </div>

    <template v-else>

      <!-- Notice -->
      <div class="notice-banner text-sm">
        <strong>Import: preview only.</strong> No legacy entry data will be written in this phase.
        Purge test entries is available below.
        The CSV is parsed in your browser only — it is never uploaded or saved to Firestore.
      </div>

      <!-- Destination -->
      <section class="section">
        <h2 class="section-title">Destination</h2>
        <div v-if="!activeBaby" class="alert alert--error text-sm">
          No active baby selected. Go back to the ledger and select a baby first.
        </div>
        <div v-else-if="activeBaby.nickname !== 'Jojo'" class="alert alert--error text-sm">
          Active baby is <strong>{{ activeBaby.nickname }}</strong>, not Jojo.
          Switch to the Jojo baby profile before using this tool.
        </div>
        <div v-else class="destination-row">
          <span class="destination-label text-faint text-sm">Import destination:</span>
          <strong class="destination-name">{{ activeBaby.nickname }}</strong>
        </div>
      </section>

      <!-- Only show the rest when destination is valid -->
      <template v-if="activeBaby && activeBaby.nickname === 'Jojo'">

        <!-- Upload -->
        <section class="section">
          <h2 class="section-title">Upload CSV</h2>
          <p class="text-faint text-sm">Select the legacy care log CSV from your device.</p>
          <input
            class="file-input"
            type="file"
            accept=".csv,text/csv"
            @change="handleFile"
          />
          <p v-if="parseError" class="alert alert--error text-sm">{{ parseError }}</p>
        </section>

        <!-- Preview -->
        <section v-if="preview" class="section">
          <h2 class="section-title">Preview</h2>

          <ul class="preview-list text-sm">
            <li class="preview-list__row">
              <span class="preview-list__label text-faint">Destination</span>
              <strong>{{ activeBaby.nickname }}</strong>
            </li>
            <li class="preview-list__row">
              <span class="preview-list__label text-faint">Rows parsed</span>
              <span>{{ preview.rowCount }}</span>
            </li>
            <li class="preview-list__row">
              <span class="preview-list__label text-faint">Total mL</span>
              <span>{{ preview.totalMl.toLocaleString() }}</span>
            </li>
            <li class="preview-list__row">
              <span class="preview-list__label text-faint">Date range</span>
              <span>{{ preview.dateRange?.min }} → {{ preview.dateRange?.max }}</span>
            </li>
            <li class="preview-list__row">
              <span class="preview-list__label text-faint">Blank amount rows</span>
              <span>{{ preview.blankAmountRows }}</span>
            </li>
            <li class="preview-list__row">
              <span class="preview-list__label text-faint">Blank diaper rows</span>
              <span>{{ preview.blankDiaperRows }}</span>
            </li>
            <li class="preview-list__row">
              <span class="preview-list__label text-faint">Diaper none rows</span>
              <span>{{ preview.diaperNoneRows }}</span>
            </li>
            <li class="preview-list__row">
              <span class="preview-list__label text-faint">0 mL rows</span>
              <span>{{ preview.zeroMlRows }}</span>
            </li>
            <li class="preview-list__row">
              <span class="preview-list__label text-faint">VitaminD yes rows</span>
              <span>{{ preview.vitaminDYesRows }}</span>
            </li>
            <li class="preview-list__row">
              <span class="preview-list__label text-faint">Notes rows</span>
              <span>{{ preview.notesRows }}</span>
            </li>
            <li class="preview-list__row">
              <span class="preview-list__label text-faint">Duplicate Date+Time pairs</span>
              <span :class="preview.duplicates.length > 0 ? 'text-warn' : ''">
                {{ preview.duplicates.length }}
              </span>
            </li>
          </ul>

          <div v-if="preview.duplicates.length > 0" class="alert alert--warn text-sm">
            <p><strong>Duplicate Date+Time pairs</strong> (each will get a unique ID):</p>
            <ul class="dup-list">
              <li v-for="d in preview.duplicates" :key="d.entryDate + d.entryTime">
                {{ d.entryDate }} {{ d.entryTime }} — {{ d.ids.length }} rows
              </li>
            </ul>
          </div>

          <div v-if="preview.errors.length > 0" class="alert alert--error text-sm">
            <p><strong>Errors — import blocked:</strong></p>
            <ul>
              <li v-for="err in preview.errors" :key="err">{{ err }}</li>
            </ul>
          </div>

          <!-- Confirmation phrase -->
          <div class="confirm-section">
            <p class="text-sm">
              To confirm this is the right file, type:
              <strong>{{ expectedPhrase }}</strong>
            </p>
            <input
              class="confirm-input"
              type="text"
              v-model="confirmPhrase"
              :placeholder="expectedPhrase"
              autocomplete="off"
              spellcheck="false"
            />
            <div v-if="importReady" class="alert alert--ready text-sm">
              Preview confirmed. Actual import writes are not available in this phase (Phase 7C).
            </div>
          </div>
        </section>

        <!-- Purge panel -->
        <section class="section section--purge">
          <h2 class="section-title">Purge Test Entries</h2>

          <div class="alert alert--warn text-sm">
            This permanently removes test entries (source ≠ "legacy") for
            <strong>{{ activeBaby.nickname }}</strong> only.
            Legacy feeds, babies, family, members, and weekly settings are not touched.
            This action cannot be undone.
          </div>

          <div v-if="purgeSuccess" class="alert alert--ready text-sm">
            Done. Removed {{ purgeSuccess.deleted }} test
            {{ purgeSuccess.deleted === 1 ? 'entry' : 'entries' }}.
            <span v-if="purgeSuccess.skipped > 0">
              Skipped {{ purgeSuccess.skipped }} legacy
              {{ purgeSuccess.skipped === 1 ? 'entry' : 'entries' }}.
            </span>
          </div>

          <div v-else-if="purgeableCount === 0" class="text-faint text-sm" style="margin-top:var(--space-3)">
            No purgeable entries found for this baby.
          </div>

          <template v-else>
            <p class="text-sm" style="margin-top:var(--space-3)">
              Purgeable entries for <strong>{{ activeBaby.nickname }}</strong>:
              <strong>{{ purgeableCount }}</strong>
            </p>

            <ul class="purge-sample text-sm">
              <li v-for="e in purgeSample" :key="e.id" class="purge-sample__row">
                <span class="text-faint">{{ e.entryDate }}</span>
                <span class="text-faint">{{ e.entryTime }}</span>
                <span>{{ e.amountMl ?? '—' }} mL</span>
                <span class="text-faint text-xs">{{ e.source }}</span>
              </li>
            </ul>
            <p v-if="purgeableCount > 5" class="text-faint text-xs">
              … and {{ purgeableCount - 5 }} more.
            </p>

            <div class="confirm-section">
              <p class="text-sm">
                Type <strong>PURGE TEST ENTRIES</strong> to enable the button.
              </p>
              <input
                class="confirm-input"
                type="text"
                v-model="purgePhrase"
                placeholder="PURGE TEST ENTRIES"
                autocomplete="off"
                spellcheck="false"
              />
              <button
                class="purge-btn"
                type="button"
                :disabled="purgePhrase !== 'PURGE TEST ENTRIES' || purging"
                @click="handlePurge"
              >
                {{ purging ? 'Purging…' : 'Purge test entries' }}
              </button>
              <p v-if="purgeError" class="alert alert--error text-sm">{{ purgeError }}</p>
            </div>
          </template>
        </section>

      </template>
    </template>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/ui/AppLayout.vue'
import { useFamily }  from '@/families/useFamily.js'
import { useBabies }  from '@/babies/useBabies.js'
import { useEntries } from '@/entries/useEntries.js'
import { parseRows, transformRows, validateRows } from '@/utils/legacyCsvParser.js'
import { purgeTestEntries } from '@/entries/useAdminEntryPurge.js'

const router = useRouter()

const { isLegacyImportAdmin }                    = useFamily()
const { activeBaby }                             = useBabies()
const { entries: liveEntries, deletedEntries }   = useEntries()

onMounted(() => {
  if (!isLegacyImportAdmin.value) router.replace('/')
})

const parseError    = ref('')
const preview       = ref(null)
const confirmPhrase = ref('')

const expectedPhrase = computed(() =>
  activeBaby.value ? `IMPORT TO ${activeBaby.value.nickname.toUpperCase()}` : 'IMPORT TO JOJO'
)

const importReady = computed(() =>
  preview.value !== null &&
  preview.value.errors.length === 0 &&
  confirmPhrase.value === expectedPhrase.value
)

// Purge panel
const purgeableEntries = computed(() => {
  const all = [...liveEntries.value, ...deletedEntries.value]
  return all.filter(e => e.source !== 'legacy')
})

const purgeableCount = computed(() => purgeableEntries.value.length)
const purgeSample    = computed(() => purgeableEntries.value.slice(0, 5))

const purgePhrase  = ref('')
const purging      = ref(false)
const purgeError   = ref('')
const purgeSuccess = ref(null)

async function handlePurge() {
  if (purgePhrase.value !== 'PURGE TEST ENTRIES') return
  purging.value    = true
  purgeError.value = ''
  purgeSuccess.value = null
  try {
    const result = await purgeTestEntries(purgeableEntries.value)
    purgeSuccess.value = result
    purgePhrase.value  = ''
  } catch (e) {
    console.error('[LegacyImportView] purge failed', e)
    purgeError.value = `Purge failed: ${e.message}`
  } finally {
    purging.value = false
  }
}

async function handleFile(event) {
  parseError.value    = ''
  preview.value       = null
  confirmPhrase.value = ''

  const file = event.target.files?.[0]
  if (!file) return

  try {
    const text       = await file.text()
    const rawRows    = parseRows(text)
    const transformed = transformRows(rawRows)
    preview.value    = validateRows(transformed)
  } catch (e) {
    console.error('[LegacyImportView] parse failed', e)
    parseError.value = `Parse failed: ${e.message}`
  }
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

/* ── Gate ──────────────────────────────────────────────────────────────────── */

.gate-denied {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-6) 0;
}

.gate-denied__link {
  color: var(--color-mint);
}

/* ── Notice ────────────────────────────────────────────────────────────────── */

.notice-banner {
  background: var(--color-row-week);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-4);
  line-height: 1.5;
}

/* ── Sections ──────────────────────────────────────────────────────────────── */

.section {
  margin-bottom: var(--space-6);
}

.section-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-soft);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: var(--space-3);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.section-title__badge {
  font-weight: normal;
  text-transform: none;
  letter-spacing: 0;
  color: var(--color-text-faint);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 1px 6px;
}

.section--purge {
  border-top: 1px solid var(--color-border);
  padding-top: var(--space-4);
}

/* ── Destination ───────────────────────────────────────────────────────────── */

.destination-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.destination-name {
  font-size: var(--font-size-md);
}

/* ── Alerts ────────────────────────────────────────────────────────────────── */

.alert {
  border-radius: var(--radius-sm);
  padding: var(--space-3) var(--space-4);
  margin-top: var(--space-3);
  line-height: 1.5;
}

.alert--error {
  background: color-mix(in srgb, var(--color-error) 10%, transparent);
  border: 1px solid var(--color-error);
  color: var(--color-error);
}

.alert--warn {
  background: color-mix(in srgb, var(--color-warn, #f59e0b) 10%, transparent);
  border: 1px solid var(--color-warn, #f59e0b);
  color: var(--color-text);
}

.alert--ready {
  background: color-mix(in srgb, var(--color-mint) 10%, transparent);
  border: 1px solid var(--color-mint);
  color: var(--color-text);
}

/* ── File input ────────────────────────────────────────────────────────────── */

.file-input {
  display: block;
  margin-top: var(--space-3);
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
}

/* ── Preview list ──────────────────────────────────────────────────────────── */

.preview-list {
  list-style: none;
  padding: 0;
  margin: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.preview-list__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2) var(--space-4);
  border-bottom: 1px solid var(--color-border-soft);
}

.preview-list__row:last-child { border-bottom: none; }

.preview-list__label { flex: 1; }

.text-warn { color: var(--color-warn, #f59e0b); }

.dup-list {
  margin-top: var(--space-2);
  padding-left: var(--space-4);
}

/* ── Confirmation ──────────────────────────────────────────────────────────── */

.confirm-section {
  margin-top: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.confirm-input {
  width: 100%;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  color: var(--color-text);
  padding: var(--space-2) var(--space-3);
  box-sizing: border-box;
}

.confirm-input:focus {
  outline: none;
  border-color: var(--color-mint);
}

/* ── Purge panel ───────────────────────────────────────────────────────────── */

.purge-sample {
  list-style: none;
  padding: 0;
  margin: var(--space-2) 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.purge-sample__row {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-4);
  border-bottom: 1px solid var(--color-border-soft);
}

.purge-sample__row:last-child { border-bottom: none; }

.purge-btn {
  margin-top: var(--space-2);
  background: none;
  border: 1px solid var(--color-error);
  border-radius: var(--radius-sm);
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  color: var(--color-error);
  cursor: pointer;
  padding: var(--space-2) var(--space-4);
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
.purge-btn:disabled { opacity: 0.4; cursor: default; }
.purge-btn:not(:disabled):active { filter: brightness(0.9); }
</style>
