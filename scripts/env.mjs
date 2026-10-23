// Shared helpers for the Node maintenance scripts (seed, logo upload).
// Keeps the tiny .env loader and credential checks in one place so both scripts
// behave identically. No third-party dependency.
import { readFileSync, existsSync } from 'node:fs'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
export const rootDir = path.resolve(here, '..')

// Load .env.local then .env into process.env (existing vars win).
export function loadEnv() {
  for (const name of ['.env.local', '.env']) {
    const file = path.join(rootDir, name)
    if (!existsSync(file)) continue
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      let value = trimmed.slice(eq + 1).trim()
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      if (!(key in process.env)) process.env[key] = value
    }
  }
}

// Catch both "not set" and "still the template placeholder" so failures are
// obvious instead of a cryptic `fetch failed` against a fake host.
export const looksPlaceholder = (value) =>
  !value || /YOUR-PROJECT-REF|your-anon|your-service|your-publishable|your-secret|CHANGE_ME|<.*>/i.test(value)

export function readCredentials({ requireSecretKey = true } = {}) {
  loadEnv()
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY
  const problems = []
  if (looksPlaceholder(url)) problems.push('VITE_SUPABASE_URL')
  if (requireSecretKey && looksPlaceholder(secretKey)) problems.push('SUPABASE_SECRET_KEY')

  if (problems.length) {
    console.error(
      `Supabase credentials missing or still placeholders (${problems.join(', ')}).\n` +
        'Open .env.local and set real values from Dashboard → Project Settings → API Keys:\n' +
        '  VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co\n' +
        '  SUPABASE_SECRET_KEY=<the secret key, sb_secret_…>',
    )
    process.exit(1)
  }

  return { url, secretKey }
}
