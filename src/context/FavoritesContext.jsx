import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { tools } from '../data/tools.js'
import { parseFavoriteIds, toggleFavoriteId } from '../utils/favorites.js'
import { addFavorite, fetchFavoriteSlugs, removeFavorite } from '../lib/queries.js'
import useAuth from '../hooks/useAuth.js'

const FavoritesContext = createContext(null)
const STORAGE_KEY = 'ai-tools-directory:favorites'
const validToolIds = new Set(tools.map(({ id }) => id))
const isValid = (id) => typeof id === 'string' && validToolIds.has(id)

function readFavorites() {
  if (typeof window === 'undefined') return []

  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY)
    return parseFavoriteIds(storedValue, validToolIds)
  } catch {
    return []
  }
}

export function FavoritesProvider({ children }) {
  const { userId, ready } = useAuth()
  const [favoriteIds, setFavoriteIds] = useState(readFavorites)
  const favoriteIdsRef = useRef(favoriteIds)
  const hydratedRef = useRef(false)

  useEffect(() => {
    favoriteIdsRef.current = favoriteIds
  }, [favoriteIds])

  // localStorage stays the fast, always-on cache (and the whole story when
  // Supabase isn't configured).
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteIds))
    } catch {
      // Keep favorites available in memory if storage is blocked or full.
    }
  }, [favoriteIds])

  // Once a session exists, merge server favorites with any local ones and push
  // local-only items up, so the account stays in sync across devices.
  useEffect(() => {
    if (!ready || !userId || hydratedRef.current) return undefined
    hydratedRef.current = true
    let active = true

    fetchFavoriteSlugs(userId)
      .then((serverIds) => {
        if (!active) return
        const local = favoriteIdsRef.current
        const merged = [...new Set([...local, ...serverIds])].filter(isValid)
        setFavoriteIds(merged)
        for (const id of local) {
          if (!serverIds.includes(id)) addFavorite(userId, id).catch(() => {})
        }
      })
      .catch((error) => console.warn('Favorites sync failed:', error.message))

    return () => {
      active = false
    }
  }, [ready, userId])

  const toggleFavorite = useCallback((toolId) => {
    if (!isValid(toolId)) return
    const next = toggleFavoriteId(favoriteIds, toolId, validToolIds)
    const added = !favoriteIds.includes(toolId) && next.includes(toolId)
    const removed = favoriteIds.includes(toolId) && !next.includes(toolId)
    if (!added && !removed) return

    setFavoriteIds(next)
    if (ready && userId) {
      const operation = added ? addFavorite(userId, toolId) : removeFavorite(userId, toolId)
      operation.catch(() => {})
    }
  }, [favoriteIds, ready, userId])

  const isFavorite = useCallback((toolId) => favoriteIds.includes(toolId), [favoriteIds])
  const value = useMemo(
    () => ({ favoriteIds, isFavorite, toggleFavorite }),
    [favoriteIds, isFavorite, toggleFavorite],
  )

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export default FavoritesContext
