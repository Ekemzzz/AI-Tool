export function getToolGridState(tools, loading = false) {
  if (loading) return 'loading'
  if (!Array.isArray(tools) || tools.length === 0) return 'empty'
  return 'ready'
}
