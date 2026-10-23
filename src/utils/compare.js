export const MAX_COMPARE = 3

export function parseCompareIds(rawValue, validIds, max = MAX_COMPARE) {
  if (typeof rawValue !== 'string') return []

  let parsed
  try {
    parsed = JSON.parse(rawValue)
  } catch {
    return []
  }

  if (!Array.isArray(parsed)) return []
  const allowedIds = validIds instanceof Set ? validIds : new Set(Array.isArray(validIds) ? validIds : [])
  return [...new Set(parsed.filter((id) => typeof id === 'string' && allowedIds.has(id)))].slice(0, max)
}

export function toggleCompareId(currentIds, toolId, validIds, max = MAX_COMPARE) {
  const allowedIds = validIds instanceof Set ? validIds : new Set(Array.isArray(validIds) ? validIds : [])
  const normalized = [...new Set((Array.isArray(currentIds) ? currentIds : []).filter(
    (id) => typeof id === 'string' && allowedIds.has(id),
  ))]

  if (typeof toolId !== 'string' || !allowedIds.has(toolId)) return normalized
  if (normalized.includes(toolId)) return normalized.filter((id) => id !== toolId)
  if (normalized.length >= max) return normalized
  return [...normalized, toolId]
}

export function getCompareTools(compareIds, records = []) {
  if (!Array.isArray(compareIds) || !Array.isArray(records)) return []
  const selectedIds = new Set(compareIds.filter((id) => typeof id === 'string'))
  return records.filter((tool) => selectedIds.has(tool?.id))
}
