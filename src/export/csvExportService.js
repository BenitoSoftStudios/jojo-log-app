import { mlToFlOz } from '@/utils/unitConverter.js'

function formatDate(isoTimestamp) {
  if (!isoTimestamp) return ''
  const d = isoTimestamp.toDate ? isoTimestamp.toDate() : new Date(isoTimestamp)
  return d.toISOString().replace('T', ' ').slice(0, 19)
}

function escape(value) {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

/**
 * Generates a CSV string from a flat entries array.
 *
 * @param {object[]} entries - non-deleted entries for the active baby
 * @param {string}   babyNickname
 * @param {string}   unitPreference - 'ml' | 'floz'
 * @param {Map<string, number|null>} weeklyUsualMap - weekStartDate → usualBottleAmountMl
 */
export function buildCsvString(entries, babyNickname, unitPreference = 'ml', weeklyUsualMap = new Map()) {
  const headers = [
    'Date', 'Time', 'Baby',
    'Amount (mL)', 'Amount (fl oz)', 'Display Unit',
    'Diaper', 'Vitamin D', 'Medication', 'Tummy Time',
    'Notes', 'Logged By', 'Created At', 'Updated At',
    'Usual Bottle This Week'
  ]

  const rows = entries
    .filter(e => !e.deleted)
    .sort((a, b) => {
      if (a.entryDate < b.entryDate) return -1
      if (a.entryDate > b.entryDate) return  1
      return a.entryTime < b.entryTime ? -1 : a.entryTime > b.entryTime ? 1 : 0
    })
    .map(e => {
      const ml    = typeof e.amountMl === 'number' ? e.amountMl : ''
      const floz  = typeof e.amountMl === 'number' ? mlToFlOz(e.amountMl).toFixed(2) : ''
      const usual = weeklyUsualMap.has(e.entryDate)
        ? (weeklyUsualMap.get(e.entryDate) !== null ? weeklyUsualMap.get(e.entryDate) : '')
        : ''

      return [
        e.entryDate,
        e.entryTime,
        babyNickname,
        ml,
        floz,
        unitPreference,
        e.diaper ?? '',
        e.vitaminD ? 'Yes' : 'No',
        e.medication ? 'Yes' : 'No',
        e.tummyTime ? 'Yes' : 'No',
        e.notes ?? '',
        e.createdByLabel ?? '',
        formatDate(e.createdAt),
        formatDate(e.updatedAt),
        usual
      ].map(escape).join(',')
    })

  return [headers.map(escape).join(','), ...rows].join('\n')
}

/**
 * Triggers a browser download of the given CSV string.
 *
 * @param {string} csvString
 * @param {string} filename - e.g. "jojo-log-2025-05-21.csv"
 */
export function downloadCsv(csvString, filename) {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href  = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
