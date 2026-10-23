import { createClient } from '@supabase/supabase-js'

// The Supabase client is optional during the frontend-only phase: if the env
// vars are missing we export null and the app keeps running on its current
// static catalog + localStorage state. Callers must check `isSupabaseConfigured`
// (or that `supabase` is non-null) before issuing queries.
// Uses Supabase's newer API key: the browser-safe *publishable* key
// (sb_publishable_…), which replaces the legacy anon public key.
const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const isSupabaseConfigured = Boolean(url && publishableKey)

export const supabase = isSupabaseConfigured
  ? createClient(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null
