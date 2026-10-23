export function parseFavoriteIds(rawValue, validIds) {
  if (typeof rawValue !== 'string') return []

  let parsed
  try {
    parsed = JSON.parse(rawValue)
  } catch {
    return []
  }

  if (!Array.isArray(parsed)) return []
  const allowedIds = validIds instanceof Set ? validIds : new Set(Array.isArray(validIds) ? validIds : [])
  return [...new Set(parsed.filter((id) => typeof id === 'string' && allowedIds.has(id)))]
}

export function toggleFavoriteId(currentIds, toolId, validIds) {
  const allowedIds = validIds instanceof Set ? validIds : new Set(Array.isArray(validIds) ? validIds : [])
  const normalized = [...new Set((Array.isArray(currentIds) ? currentIds : []).filter(
    (id) => typeof id === 'string' && allowedIds.has(id),
  ))]

  if (typeof toolId !== 'string' || !allowedIds.has(toolId)) return normalized
  return normalized.includes(toolId)
    ? normalized.filter((id) => id !== toolId)
    : [...normalized, toolId]
}

export function getFavoriteTools(favoriteIds, records = []) {
  if (!Array.isArray(favoriteIds) || !Array.isArray(records)) return []
  const selectedIds = new Set(favoriteIds.filter((id) => typeof id === 'string'))
  return records.filter((tool) => selectedIds.has(tool?.id))
}
