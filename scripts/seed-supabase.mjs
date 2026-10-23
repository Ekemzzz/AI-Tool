// Seeds the Supabase catalog from the app's current static data.
// Usage: npm run seed   (loads .env.local / .env first)
// Requires: VITE_SUPABASE_URL + SUPABASE_SECRET_KEY.
import { readFileSync, existsSync } from 'node:fs'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { categories } from '../src/data/categories.js'
import { tools } from '../src/data/tools.js'

// --- Minimal .env loader (no extra dependency) -----------------------------
const here = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(here, '..')

function loadEnvFile(name) {
  const file = path.join(rootDir, name)
  if (!existsSync(file)) return
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
loadEnvFile('.env.local')
loadEnvFile('.env')

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY


const looksPlaceholder = (value) =>
  !value || /YOUR-PROJECT-REF|your-anon|your-service|your-publishable|your-secret|CHANGE_ME|<.*>/i.test(value)

if (looksPlaceholder(SUPABASE_URL) || looksPlaceholder(SECRET_KEY)) {
  console.error(
    'Supabase credentials are missing or still placeholders.\n' +
      'Open .env.local and set real values from Dashboard → Project Settings → API Keys:\n' +
      '  VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co\n' +
      '  SUPABASE_SECRET_KEY=<the secret key, sb_secret_…>',
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const ZERO_UUID = '00000000-0000-0000-0000-000000000000'

function must(condition, message) {
  if (!condition) {
    console.error(message)
    process.exit(1)
  }
}

async function seed() {
  console.log(`Seeding ${SUPABASE_URL} — ${tools.length} tools, ${categories.length} categories`)

  // 1. Categories (upsert by slug), preserving source order via `sort`.
  const categoryRows = categories.map((category, index) => ({
    slug: category.slug,
    name: category.name,
    description: category.description ?? null,
    icon_key: category.iconKey ?? null,
    sort: index,
  }))
  const { error: catError } = await supabase
    .from('categories')
    .upsert(categoryRows, { onConflict: 'slug' })
  must(!catError, `categories upsert failed: ${catError?.message}`)

  // 2. Resolve DB ids for categories (name -> id, and slug -> id).
  const { data: dbCategories, error: catFetchError } = await supabase
    .from('categories')
    .select('id, slug, name')
  must(!catFetchError, `category fetch failed: ${catFetchError?.message}`)
  const idByName = new Map(dbCategories.map((c) => [c.name, c.id]))

  // 3. Tools (upsert by slug).
  // logo_url is owned by the upload pipeline (npm run upload:logos), not the
  // static data, so we only send it when the source actually has one —
  // otherwise a re-seed would null out logos already stored in Supabase.
  const toolRows = tools.map((tool) => {
    const row = {
      slug: tool.slug,
      name: tool.name,
      description: tool.description ?? null,
      website_url: tool.websiteUrl ?? null,
      pricing_model: tool.pricingModel ?? 'unknown',
      pricing_url: tool.pricingUrl ?? null,
      source_url: tool.sourceUrl ?? null,
      pricing_source_url: tool.pricingSourceUrl ?? null,
      featured: Boolean(tool.featured),
      date_added: tool.dateAdded ?? null,
      last_verified_at: tool.lastVerifiedAt ?? null,
    }
    if (tool.logoUrl) row.logo_url = tool.logoUrl
    return row
  })
  const { error: toolError } = await supabase
    .from('tools')
    .upsert(toolRows, { onConflict: 'slug' })
  must(!toolError, `tools upsert failed: ${toolError?.message}`)

  // 4. Resolve DB ids for tools by slug.
  const { data: dbTools, error: toolFetchError } = await supabase
    .from('tools')
    .select('id, slug')
  must(!toolFetchError, `tool fetch failed: ${toolFetchError?.message}`)
  const toolIdBySlug = new Map(dbTools.map((t) => [t.slug, t.id]))

  // 5. Reset relational data so re-running the seed is idempotent.
  await supabase.from('tool_categories').delete().neq('tool_id', ZERO_UUID)
  await supabase.from('tool_text').delete().neq('tool_id', ZERO_UUID)

  // 6. Build tool_categories links (tools[].categories are category names).
  const linkRows = []
  const unmapped = new Set()
  for (const tool of tools) {
    const toolId = toolIdBySlug.get(tool.slug)
    if (!toolId) continue
    for (const categoryName of tool.categories || []) {
      const categoryId = idByName.get(categoryName)
      if (!categoryId) {
        unmapped.add(categoryName)
        continue
      }
      linkRows.push({ tool_id: toolId, category_id: categoryId })
    }
  }
  if (unmapped.size > 0) {
    console.warn(`Warning: ${unmapped.size} category name(s) had no match: ${[...unmapped].join(', ')}`)
  }

  // 7. Build tool_text rows.
  const textRows = tools.map((tool) => ({
    tool_id: toolIdBySlug.get(tool.slug),
    use_cases: tool.useCases ?? [],
    tags: tool.tags ?? [],
    features: tool.features ?? [],
  })).filter((row) => row.tool_id)

  const { error: linkError } = await supabase.from('tool_categories').insert(linkRows)
  must(!linkError, `tool_categories insert failed: ${linkError?.message}`)

  const { error: textError } = await supabase.from('tool_text').insert(textRows)
  must(!textError, `tool_text insert failed: ${textError?.message}`)

  // 8. Verify.
  const { count: toolCount } = await supabase
    .from('tools').select('*', { count: 'exact', head: true })
  const { count: catCount } = await supabase
    .from('categories').select('*', { count: 'exact', head: true })
  const { count: linkCount } = await supabase
    .from('tool_categories').select('*', { count: 'exact', head: true })

  console.log(
    `Seed complete — tools: ${toolCount}, categories: ${catCount}, links: ${linkCount}.`,
  )
}

seed().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
