import { supabase, isSupabaseConfigured } from './supabase.js'
import { tools as staticTools } from '../data/tools.js'
import { categories as staticCategories } from '../data/categories.js'

// Supabase rows come back snake_case with nested joins. We normalize them into
// the exact camelCase shape the app already uses, with `categories` as an array
// of category NAMES (that's what catalog utils key off of) and `id === slug`.

const TOOL_SELECT = `
  id, slug, name, description, website_url, pricing_model,
  pricing_url, source_url, pricing_source_url, logo_url, featured,
  date_added, last_verified_at,
  tool_text ( use_cases, tags, features ),
  tool_categories ( categories ( slug, name, description, icon_key, sort ) )
`

function toArray(value) {
  return Array.isArray(value) ? value : []
}

export function normalizeTool(row) {
  const text = row.tool_text ?? {}
  const categoryRows = toArray(row.tool_categories)
    .map((link) => link?.categories)
    .filter(Boolean)

  return {
    id: row.slug,
    slug: row.slug,
    name: row.name,
    description: row.description ?? '',
    websiteUrl: row.website_url ?? '',
    pricingModel: row.pricing_model ?? 'unknown',
    pricingUrl: row.pricing_url ?? null,
    sourceUrl: row.source_url ?? null,
    pricingSourceUrl: row.pricing_source_url ?? null,
    logoUrl: row.logo_url ?? null,
    featured: Boolean(row.featured),
    dateAdded: row.date_added ?? null,
    lastVerifiedAt: row.last_verified_at ?? null,
    useCases: toArray(text.use_cases),
    tags: toArray(text.tags),
    features: toArray(text.features),
    categories: categoryRows.map((category) => category.name),
  }
}

export function normalizeCategory(row) {
  return {
    id: row.slug,
    slug: row.slug,
    name: row.name,
    description: row.description ?? '',
    iconKey: row.icon_key ?? undefined,
  }
}

// Loads the whole catalog once. When Supabase is not configured we resolve the
// static data synchronously-shaped through the same async contract, so pages
// behave identically during the cutover.
export async function fetchCatalog() {
  if (!isSupabaseConfigured || !supabase) {
    return { tools: staticTools, categories: staticCategories, source: 'static' }
  }

  const [toolsResult, categoriesResult] = await Promise.all([
    supabase.from('tools').select(TOOL_SELECT).order('name', { ascending: true }),
    supabase.from('categories').select('*').order('sort', { ascending: true }),
  ])

  if (toolsResult.error) throw new Error(`tools query failed: ${toolsResult.error.message}`)
  if (categoriesResult.error) throw new Error(`categories query failed: ${categoriesResult.error.message}`)

  return {
    tools: toArray(toolsResult.data).map(normalizeTool),
    categories: toArray(categoriesResult.data).map(normalizeCategory),
    source: 'supabase',
  }
}

// --- Server-side Explore search (0002_search.sql) -------------------------

// App sort values (from EXPLORE_SORT_OPTIONS) -> the `sort_by` the RPC expects.
export function mapExploreSort(sort) {
  switch (sort) {
    case 'name-asc': return 'name'
    case 'name-desc': return 'name-desc'
    case 'newest': return 'newest'
    case 'featured':
    default: return 'featured'
  }
}

// Hydrates full tool objects (with joins) for an ordered list of slugs, so the
// lightweight `returns setof tools` rows can be turned into app-shaped tools.
// The result preserves the incoming slug order.
export async function fetchToolsBySlugs(slugs) {
  if (!isSupabaseConfigured || !supabase) return []
  if (!Array.isArray(slugs) || slugs.length === 0) return []

  const { data, error } = await supabase.from('tools').select(TOOL_SELECT).in('slug', slugs)
  if (error) throw new Error(`tools lookup failed: ${error.message}`)

  const bySlug = new Map(toArray(data).map((row) => [row.slug, normalizeTool(row)]))
  return slugs.map((slug) => bySlug.get(slug)).filter(Boolean)
}

// Runs the search_tools + count_tools RPCs in parallel and returns the current
// accumulated page plus the total matching count. Callers are responsible for
// checking `isSupabaseConfigured` / catalog source before using this path.
export async function searchToolsServer({
  q,
  categorySlugs,
  pricing,
  useCase,
  sort,
  limit,
  offset,
} = {}) {
  if (!isSupabaseConfigured || !supabase) {
    return { tools: [], count: 0 }
  }

  const slugs = Array.isArray(categorySlugs) && categorySlugs.length ? categorySlugs : null
  const args = {
    q: typeof q === 'string' && q.trim() ? q.trim() : null,
    category_slugs: slugs,
    pricing: pricing || null,
    use_case: useCase || null,
    sort_by: mapExploreSort(sort),
    lim: Number.isSafeInteger(limit) && limit > 0 ? limit : 9,
    off: Number.isSafeInteger(offset) && offset > 0 ? offset : 0,
  }

  const [rowsResult, countResult] = await Promise.all([
    supabase.rpc('search_tools', args),
    supabase.rpc('count_tools', {
      q: args.q,
      category_slugs: args.category_slugs,
      pricing: args.pricing,
      use_case: args.use_case,
    }),
  ])

  if (rowsResult.error) throw new Error(`search_tools failed: ${rowsResult.error.message}`)
  if (countResult.error) throw new Error(`count_tools failed: ${countResult.error.message}`)

  const orderedSlugs = toArray(rowsResult.data).map((row) => row.slug).filter(Boolean)
  const tools = await fetchToolsBySlugs(orderedSlugs)
  return { tools, count: Number(countResult.data) || 0 }
}

// --- Per-user favorites / compare (0001 tables, owner-only RLS) -----------
// The app identifies tools by slug, but favorites/compares store the tool's
// uuid, so we resolve slug <-> id through the public `tools` read.

// Resolve a tool slug to its uuid, or null when it isn't in the catalog.
export async function resolveToolId(slug) {
  if (!isSupabaseConfigured || !supabase) return null
  const { data, error } = await supabase
    .from('tools').select('id').eq('slug', slug).maybeSingle()
  if (error) throw new Error(`resolveToolId failed: ${error.message}`)
  return data?.id ?? null
}

async function listUserToolSlugs(table, userId) {
  if (!isSupabaseConfigured || !supabase || !userId) return []
  const { data, error } = await supabase
    .from(table)
    .select('created_at, tools(slug)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(`read ${table} failed: ${error.message}`)
  return toArray(data).map((row) => row?.tools?.slug).filter(Boolean)
}

async function upsertUserTool(table, userId, slug) {
  if (!isSupabaseConfigured || !supabase || !userId) return false
  const toolId = await resolveToolId(slug)
  if (!toolId) return false
  const { error } = await supabase
    .from(table)
    .upsert({ user_id: userId, tool_id: toolId }, { onConflict: 'user_id,tool_id' })
  if (error) { console.warn(`upsert ${table} failed:`, error.message); return false }
  return true
}

async function deleteUserTool(table, userId, slug) {
  if (!isSupabaseConfigured || !supabase || !userId) return false
  const toolId = await resolveToolId(slug)
  if (!toolId) return false
  const { error } = await supabase
    .from(table).delete().eq('user_id', userId).eq('tool_id', toolId)
  if (error) { console.warn(`delete ${table} failed:`, error.message); return false }
  return true
}

export const fetchFavoriteSlugs = (userId) => listUserToolSlugs('favorites', userId)
export const addFavorite = (userId, slug) => upsertUserTool('favorites', userId, slug)
export const removeFavorite = (userId, slug) => deleteUserTool('favorites', userId, slug)

export const fetchCompareSlugs = (userId) => listUserToolSlugs('compares', userId)
export const addCompare = (userId, slug) => upsertUserTool('compares', userId, slug)
export const removeCompare = (userId, slug) => deleteUserTool('compares', userId, slug)

export async function clearCompares(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) return false
  const { error } = await supabase.from('compares').delete().eq('user_id', userId)
  if (error) { console.warn('clear compares failed:', error.message); return false }
  return true
}

// --- Waitlist (/submit notify-me) ----------------------------------------
// Goes through the `join_waitlist` RPC (Phase 9), which validates the email,
// enforces a per-device rate limit, and treats a duplicate as a non-error.
// Raw table inserts are revoked at the DB, so this function is the only path.
// Returns { status: 'ok' | 'duplicate' | 'invalid' | 'rate_limited' | 'local' }
// and throws only on unexpected failures (missing function, network, etc.).
export async function joinWaitlist(email, source = 'submit-page') {
  const clean = String(email ?? '').trim()
  if (!clean) return { status: 'invalid' }

  if (!isSupabaseConfigured || !supabase) return { status: 'local' }

  const { data, error } = await supabase.rpc('join_waitlist', { p_email: clean, p_source: source })
  if (error) throw new Error(`join_waitlist failed: ${error.message}`)
  return { status: typeof data === 'string' ? data : 'ok' }
}
