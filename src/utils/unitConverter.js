const ML_PER_FL_OZ = 29.5735

export function mlToFlOz(ml) {
  if (ml === null || ml === undefined) return null
  return ml / ML_PER_FL_OZ
}

export function flOzToMl(flOz) {
  if (flOz === null || flOz === undefined) return null
  return flOz * ML_PER_FL_OZ
}

/**
 * Format an mL amount for display in the selected unit.
 * Returns a string like "90 mL" or "3.0 fl oz".
 * null → "" (incomplete entry — do not show a value)
 */
export function formatAmount(ml, unit = 'ml') {
  if (ml === null || ml === undefined) return ''
  if (unit === 'floz') {
    return (mlToFlOz(ml)).toFixed(1) + ' fl oz'
  }
  return ml + ' mL'
}

/**
 * Parse a user-entered amount string (in the given unit) to mL.
 * Returns null if the input is blank or unparseable.
 */
export function parseAmountToMl(value, unit = 'ml') {
  if (value === '' || value === null || value === undefined) return null
  const n = parseFloat(value)
  if (isNaN(n)) return null
  return unit === 'floz' ? flOzToMl(n) : n
}
