import { getWeekStartForDate } from '@/utils/weekUtils.js'

const HEADERS = [
  'babyNickname', 'entryId', 'entryDate', 'entryTime',
  'amountMl', 'diaper', 'vitaminD', 'medication',
  'tummyTimeCount', 'notes', 'source', 'createdByLabel',
  'createdAt', 'updatedByLabel', 'updatedAt',
  'deleted', 'deletedAt', 'weekStartDate', 'usualBottleAmountMl',
  'tummyTimeDurationSeconds',
]

export function escapeCell(val) {
  if (val === null || val === undefined) return ''
  const str = String(val)
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

function toIso(val) {
  if (val === null || val === undefined) return ''
  if (typeof val.toDate === 'function') return val.toDate().toISOString()
  if (val instanceof Date) return val.toISOString()
  return String(val)
}

export function buildCsvRow(entry, babyNickname, weeklyAmounts) {
  const weekStart = getWeekStartForDate(entry.entryDate)
  const usualBottle = weeklyAmounts[weekStart] ?? ''
  const values = [
    babyNickname,
    entry.id,
    entry.entryDate,
    entry.entryTime     ?? '',
    entry.amountMl      ?? '',
    entry.diaper        ?? '',
    entry.vitaminD      ?? false,
    entry.medication    ?? false,
    entry.tummyTimeCount ?? 0,
    entry.notes         ?? '',
    entry.source        ?? '',
    entry.createdByLabel ?? '',
    toIso(entry.createdAt),
    entry.updatedByLabel ?? '',
    toIso(entry.updatedAt),
    entry.deleted       ?? false,
    toIso(entry.deletedAt),
    weekStart,
    usualBottle,
    entry.tummyTimeDurationSeconds ?? '',
  ]
  return values.map(escapeCell).join(',')
}

export function generateCsv(entries, babyNickname, weeklyAmounts) {
  const rows = [HEADERS.join(',')]
  for (const entry of entries) {
    rows.push(buildCsvRow(entry, babyNickname, weeklyAmounts))
  }
  return rows.join('\r\n')
}

export function downloadCsv(csvString, filename) {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
