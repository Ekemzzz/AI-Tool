import { useEffect, useMemo, useState } from 'react'
import useCatalog from './useCatalog.js'
import { isSupabaseConfigured } from '../lib/supabase.js'
import { searchToolsServer } from '../lib/queries.js'
import { EXPLORE_PAGE_SIZE, applyExploreFilters } from '../utils/exploreFilters.js'


function useExploreResults(filters, page = 1) {
  const { tools, source, loading: catalogLoading } = useCatalog()
  const serverMode = isSupabaseConfigured && source === 'supabase'

  // In-memory result: used directly in client mode, and as the safety net if a
  // server query errors (e.g. the RPC has not been deployed yet).
  const clientResult = useMemo(() => {
    const matching = applyExploreFilters(tools, filters)
    const visible = Math.max(1, page)
    return {
      visibleTools: matching.slice(0, visible * EXPLORE_PAGE_SIZE),
      total: matching.length,
    }
  }, [tools, filters, page])

  // A stable key for the current query so we can tell whether the last server
  // result matches what's being asked for right now (loading vs settled).
  const pendingKey = useMemo(
    () => JSON.stringify([
      filters.q ?? '',
      filters.categories ?? [],
      filters.pricing ?? '',
      filters.useCase ?? '',
      filters.sort ?? 'featured',
      page,
    ]),
    [filters.q, filters.categories, filters.pricing, filters.useCase, filters.sort, page],
  )

  const [server, setServer] = useState({ key: null, tools: [], count: 0, error: null })

  useEffect(() => {
    if (!serverMode) return undefined
    let active = true

    searchToolsServer({
      q: filters.q,
      categorySlugs: filters.categories,
      pricing: filters.pricing,
      useCase: filters.useCase,
      sort: filters.sort,
      limit: Math.max(1, page) * EXPLORE_PAGE_SIZE,
      offset: 0,
    })
      .then((result) => {
        if (active) setServer({ key: pendingKey, tools: result.tools, count: result.count, error: null })
      })
      .catch((error) => {
        if (!active) return
        console.warn('Server search failed, using local filtering:', error.message)
        setServer({ key: pendingKey, tools: [], count: 0, error: error.message })
      })

    return () => {
      active = false
    }
  }, [serverMode, pendingKey, filters.q, filters.categories, filters.pricing, filters.useCase, filters.sort, page])

  // Server failed for the current query -> local fallback (never render empty).
  if (serverMode && server.key === pendingKey && server.error) {
    return { ...clientResult, loading: catalogLoading, degraded: true }
  }

  if (serverMode) {
    const settled = server.key === pendingKey
    return {
      visibleTools: server.tools,
      total: server.count,
      loading: catalogLoading || !settled,
      degraded: false,
    }
  }

  return { ...clientResult, loading: catalogLoading, degraded: false }
}

export default useExploreResults
