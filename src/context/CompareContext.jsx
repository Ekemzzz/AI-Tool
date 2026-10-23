import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { tools } from '../data/tools.js'
import { MAX_COMPARE, getCompareTools, parseCompareIds, toggleCompareId } from '../utils/compare.js'
import { addCompare, clearCompares, fetchCompareSlugs, removeCompare } from '../lib/queries.js'
import useAuth from '../hooks/useAuth.js'

const CompareContext = createContext(null)
const STORAGE_KEY = 'ai-tools-directory:compare'
const validToolIds = new Set(tools.map(({ id }) => id))
const isValid = (id) => typeof id === 'string' && validToolIds.has(id)

function readCompareIds() {
  if (typeof window === 'undefined') return []

  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY)
    return parseCompareIds(storedValue, validToolIds)
  } catch {
    return []
  }
}

export function CompareProvider({ children }) {
  const { userId, ready } = useAuth()
  const [compareIds, setCompareIds] = useState(readCompareIds)
  const compareIdsRef = useRef(compareIds)
  const hydratedRef = useRef(false)

  useEffect(() => {
    compareIdsRef.current = compareIds
  }, [compareIds])

  // localStorage stays the fast, always-on cache (and the whole story when
  // Supabase isn't configured).
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(compareIds))
    } catch {
      // Keep the compare selection available in memory if storage is blocked or full.
    }
  }, [compareIds])

  // Once a session exists, treat the server selection as authoritative when it
  // has rows; otherwise migrate any local selection up (still capped at 3).
  useEffect(() => {
    if (!ready || !userId || hydratedRef.current) return undefined
    hydratedRef.current = true
    let active = true

    fetchCompareSlugs(userId)
      .then((serverIds) => {
        if (!active) return
        const local = compareIdsRef.current
        if (serverIds.length) {
          setCompareIds(serverIds.filter(isValid).slice(0, MAX_COMPARE))
        } else if (local.length) {
          const toPush = local.filter(isValid).slice(0, MAX_COMPARE)
          toPush.forEach((id) => addCompare(userId, id).catch(() => {}))
          setCompareIds(toPush)
        }
      })
      .catch((error) => console.warn('Compare sync failed:', error.message))

    return () => {
      active = false
    }
  }, [ready, userId])

  const toggleCompare = useCallback((toolId) => {
    if (!isValid(toolId)) return
    const next = toggleCompareId(compareIds, toolId, validToolIds)
    const added = !compareIds.includes(toolId) && next.includes(toolId)
    const removed = compareIds.includes(toolId) && !next.includes(toolId)
    if (!added && !removed) return

    setCompareIds(next)
    if (ready && userId) {
      const operation = added ? addCompare(userId, toolId) : removeCompare(userId, toolId)
      operation.catch(() => {})
    }
  }, [compareIds, ready, userId])

  const clearCompare = useCallback(() => {
    setCompareIds([])
    if (ready && userId) clearCompares(userId).catch(() => {})
  }, [ready, userId])

  const isComparing = useCallback((toolId) => compareIds.includes(toolId), [compareIds])
  const isFull = compareIds.length >= MAX_COMPARE
  const compareTools = useMemo(() => getCompareTools(compareIds, tools), [compareIds])
  const value = useMemo(
    () => ({ compareIds, compareTools, isComparing, isFull, toggleCompare, clearCompare, maxCompare: MAX_COMPARE }),
    [compareIds, compareTools, isComparing, isFull, toggleCompare, clearCompare],
  )

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
}

export default CompareContext
