import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { fetchCatalog } from '../lib/queries.js'
import { isSupabaseConfigured } from '../lib/supabase.js'
import { tools as staticTools } from '../data/tools.js'
import { categories as staticCategories } from '../data/categories.js'

// Single source of truth for the catalog. When Supabase is configured we load it
// once and share it; when it isn't (or the fetch fails) we serve the bundled
// static catalog so the app never renders empty. `error` is set when the live
// fetch failed, and `retry()` re-attempts it (used by the status banner). Value:
//   { tools, categories, loading, error, source, retry }
const CatalogContext = createContext(null)

export function CatalogProvider({ children }) {
  const [state, setState] = useState(() => ({
    tools: isSupabaseConfigured ? [] : staticTools,
    categories: isSupabaseConfigured ? [] : staticCategories,
    loading: isSupabaseConfigured,
    error: null,
    source: isSupabaseConfigured ? 'supabase' : 'static',
  }))

  // Runs the fetch and resolves into state. `isActive` lets the mount effect skip
  // state updates after unmount; the manual retry passes nothing.
  const load = useCallback((isActive) => {
    if (!isSupabaseConfigured) return
    const alive = () => (isActive ? isActive() : true)

    fetchCatalog()
      .then((catalog) => {
        if (alive()) setState({ ...catalog, loading: false, error: null })
      })
      .catch((error) => {
        if (!alive()) return
        console.warn('Catalog load failed, using bundled data:', error.message)
        setState({
          tools: staticTools,
          categories: staticCategories,
          loading: false,
          error: error.message,
          source: 'static',
        })
      })
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined
    let active = true
    load(() => active)
    return () => {
      active = false
    }
  }, [load])

  const retry = useCallback(() => {
    if (!isSupabaseConfigured) return
    setState((current) => ({ ...current, loading: true, error: null }))
    load()
  }, [load])

  const value = useMemo(() => ({ ...state, retry }), [state, retry])

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export default CatalogContext
