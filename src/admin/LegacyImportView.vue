<!-- Admin-only: Import CSV tool. Accepts Jojo app export CSV format only. -->
<template>
  <AppLayout>
    <template #header>
      <router-link class="back-btn" to="/" aria-label="Back">←</router-link>
      <span class="header-title">Import CSV</span>
    </template>

    <!-- Admin gate -->
    <div v-if="!isLegacyImportAdmin" class="gate-denied">
      <p class="gate-denied__msg text-sm">Access denied. Admin only.</p>
      <router-link class="gate-denied__link text-sm" to="/">← Back to ledger</router-link>
    </div>

    <template v-else>

      <!-- Destination -->
      <section class="section">
        <h2 class="section-title">Destination</h2>
        <div v-if="!activeBaby" class="alert alert--error text-sm">
          No active baby selected. Go back to the ledger and select a baby first.
        </div>
        <div v-else class="destination-row">
          <span class="destination-label text-faint text-sm">Import destination:</span>
          <strong class="destination-name">{{ activeBaby.nickname }}</strong>
        </div>
      </section>

      <!-- Only show rest when destination is valid -->
      <template v-if="activeBaby">

        <!-- Upload -->
        <section class="section">
          <h2 class="section-title">Upload CSV</h2>
          <p class="text-faint text-sm">Select a Jojo app export CSV from your device.</p>
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
              <span class="preview-list__label text-faint">Row count</span>
              <span>{{ preview.rowCount }}</span>
            </li>
            <li class="preview-list__row">
              <span class="preview-list__label text-faint">Valid rows</span>
              <span>{{ preview.validRows }}</span>
            </li>
            <li v-if="dupCheck" class="preview-list__row">
              <span class="preview-list__label text-faint">New entries</span>
              <span>{{ dupCheck.newCount }}</span>
            </li>
            <li v-if="dupCheck && dupCheck.overlapCount > 0" class="preview-list__row">
              <span class="preview-list__label text-faint">Already in log</span>
              <span class="text-warn">{{ dupCheck.overlapCount }}</span>
            </li>
            <li v-if="preview.skippedRows > 0" class="preview-list__row">
              <span class="preview-list__label text-faint">Skipped (blank ID)</span>
              <span class="text-warn">{{ preview.skippedRows }}</span>
            </li>
            <li class="preview-list__row">
              <span class="preview-list__label text-faint">Deleted rows</span>
              <span>{{ preview.deletedCount }}</span>
            </li>
            <li class="preview-list__row">
              <span class="preview-list__label text-faint">Total mL (non-deleted)</span>
              <span>{{ preview.totalMl.toLocaleString() }}</span>
            </li>
            <li class="preview-list__row">
              <span class="preview-list__label text-faint">Date range</span>
              <span>{{ preview.dateRange?.min ?? '—' }} → {{ preview.dateRange?.max ?? '—' }}</span>
            </li>
            <li class="preview-list__row">
              <span class="preview-list__label text-faint">Baby name in CSV</span>
              <span>{{ preview.babyNames.length ? preview.babyNames.join(', ') : (preview.hasBlankBabyName ? '(blank)' : '—') }}</span>
            </li>
            <li class="preview-list__row">
              <span class="preview-list__label text-faint">Sources</span>
              <span>{{ preview.sources.length ? preview.sources.join(', ') : '—' }}</span>
            </li>
          </ul>

          <div v-if="parseErrors.length > 0" class="alert alert--error text-sm">
            <p><strong>Errors — import blocked:</strong></p>
            <ul>
              <li v-for="err in parseErrors" :key="err">{{ err }}</li>
            </ul>
          </div>

          <!-- Confirmation phrase + import -->
          <div class="confirm-section">
            <p class="text-sm">
              To confirm, type: <strong>{{ expectedPhrase }}</strong>
            </p>
            <input
              class="confirm-input"
              type="text"
              v-model="confirmPhrase"
              :placeholder="expectedPhrase"
              autocomplete="off"
              spellcheck="false"
              :disabled="importing || !!importResult"
            />

            <button
              v-if="importReady && !importResult"
              class="import-btn"
              type="button"
              :disabled="importing"
              @click="handleImport"
            >
              {{ importing ? 'Importing…' : `Import ${preview.rowCount} rows into ${activeBaby.nickname}` }}
            </button>

            <div v-if="importing && importProgress" class="alert alert--info text-sm">
              Writing batch {{ importProgress.batchIndex }} of {{ importProgress.batchCount }}
              ({{ importProgress.written }} rows written)…
            </div>

            <div v-if="importResult" class="alert alert--ready text-sm">
              <p><strong>Import complete.</strong></p>
              <ul class="import-result-list">
                <li>Rows imported: <strong>{{ importResult.written }}</strong></li>
                <li>Date range: {{ preview.dateRange?.min }} → {{ preview.dateRange?.max }}</li>
                <li>Total mL: {{ preview.totalMl.toLocaleString() }}</li>
                <li>Sources: {{ preview.sources.join(', ') || '—' }}</li>
              </ul>
            </div>

            <p v-if="importError" class="alert alert--error text-sm">{{ importError }}</p>
          </div>
        </section>

      </template>
    </template>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/ui/AppLayout.vue'
import { useFamily } from '@/families/useFamily.js'
import { useBabies } from '@/babies/useBabies.js'
import { parseAppCsv, checkForExistingIds } from '@/utils/appCsvImporter.js'
import { writeAppCsvEntries }               from '@/admin/useLegacyImportWriter.js'
import { entries, deletedEntries }          from '@/entries/useEntries.js'

const router = useRouter()

const { isLegacyImportAdmin } = useFamily()
const { activeBaby }          = useBabies()

onMounted(() => {
  if (!isLegacyImportAdmin.value) router.replace('/')
})

const parseError    = ref('')
const parseErrors   = ref([])
const preview       = ref(null)
const parsedEntries = ref([])
const dupCheck      = ref(null)
const confirmPhrase = ref('')

const importing      = ref(false)
const importProgress = ref(null)
const importError    = ref('')
const importResult   = ref(null)

const expectedPhrase = computed(() =>
  activeBaby.value ? `IMPORT CSV TO ${activeBaby.value.nickname.toUpperCase()}` : 'IMPORT CSV TO BABY'
)

const importReady = computed(() =>
  preview.value !== null &&
  parseErrors.value.length === 0 &&
  confirmPhrase.value === expectedPhrase.value
)

async function handleFile(event) {
  parseError.value     = ''
  parseErrors.value    = []
  preview.value        = null
  parsedEntries.value  = []
  dupCheck.value       = null
  confirmPhrase.value  = ''
  importResult.value   = null
  importError.value    = ''
  importProgress.value = null

  const file = event.target.files?.[0]
  if (!file) return

  try {
    const text   = await file.text()
    const result = parseAppCsv(text)
    parsedEntries.value = result.entries
    parseErrors.value   = [...result.errors]
    preview.value       = result.preview
    if (!result.preview) {
      parseError.value = result.errors[0] ?? 'Could not parse file.'
    } else {
      const { babyNames, hasBlankBabyName } = result.preview
      const expectedName = activeBaby.value?.nickname ?? ''
      if (hasBlankBabyName || babyNames.length !== 1 || babyNames[0] !== expectedName) {
        parseErrors.value.push('CSV baby does not match the active baby.')
      }

      // Check for entry IDs already in Firestore (active + deleted) for this baby.
      const existingIds = new Set([
        ...entries.value.map(e => e.id),
        ...deletedEntries.value.map(e => e.id),
      ])
      const check = checkForExistingIds(result.entries, existingIds)
      dupCheck.value = check
      if (check.overlapCount > 0) {
        const sample = check.overlapIds.slice(0, 3).join(', ')
        parseErrors.value.push(
          `${check.overlapCount} entries already exist in this baby's log: ${sample}${check.overlapCount > 3 ? '…' : ''} — import blocked. Overwrite support coming later.`
        )
      }
    }
  } catch (e) {
    console.error('[LegacyImportView] parse failed', e)
    parseError.value = `Parse failed: ${e.message}`
  }
}

async function handleImport() {
  if (!importReady.value) return
  importing.value      = true
  importProgress.value = null
  importError.value    = ''
  importResult.value   = null
  try {
    const result = await writeAppCsvEntries(parsedEntries.value, (progress) => {
      importProgress.value = progress
    })
    importResult.value = result
  } catch (e) {
    console.error('[LegacyImportView] import failed', e)
    importError.value = importProgress.value
      ? `Import failed after ${importProgress.value.written} rows (batch ${importProgress.value.batchIndex}/${importProgress.value.batchCount}). ${e.message}`
      : `Import failed: ${e.message}`
  } finally {
    importing.value = false
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

.alert--ready {
  background: color-mix(in srgb, var(--color-mint) 10%, transparent);
  border: 1px solid var(--color-mint);
  color: var(--color-text);
}

.alert--info {
  background: var(--color-row-week);
  border: 1px solid var(--color-border);
  color: var(--color-text-soft);
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

.import-btn {
  margin-top: var(--space-2);
  background: none;
  border: 1px solid var(--color-mint);
  border-radius: var(--radius-sm);
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-mint);
  cursor: pointer;
  padding: var(--space-2) var(--space-4);
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
.import-btn:disabled { opacity: 0.4; cursor: default; }
.import-btn:not(:disabled):active { filter: brightness(0.9); }

.import-result-list {
  margin: var(--space-2) 0 0 var(--space-4);
}
</style>
