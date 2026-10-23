import { createContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

// Lightweight auth wrapper. During the frontend-only phase Supabase may be
// unconfigured — in that case this provider resolves to an empty session and
// the rest of the app continues on localStorage, so nothing breaks. When the
// env vars are present it establishes an anonymous session (a per-device UUID)
// that later phases use for favorites/compare persistence.
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  // When Supabase isn't configured, loading starts as already-done so the
  // effect never needs to set state synchronously.
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    let active = true

    async function bootstrap() {
      const { data } = await supabase.auth.getSession()
      if (!active) return
      if (data.session) {
        setSession(data.session)
        setLoading(false)
      } else {
        // Anonymous sign-in requires it enabled in Auth → Providers. If it is
        // disabled or errors, degrade gracefully instead of blocking the UI.
        const { error } = await supabase.auth.signInAnonymously()
        if (!active) return
        if (error) console.warn('Supabase anonymous sign-in unavailable:', error.message)
        // A successful sign-in flows through onAuthStateChange below.
        setLoading(false)
      }
    }

    bootstrap()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const value = {
    session,
    userId: session?.user?.id ?? null,
    isAnonymous: session?.user?.is_anonymous ?? true,
    loading,
    ready: isSupabaseConfigured && !loading && Boolean(session),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
