// Uploads a first-party logo for each tool into the public `tool-logos` Supabase
// Storage bucket and writes the resulting public URL back to tools.logo_url.
import process from 'node:process'
import { createClient } from '@supabase/supabase-js'
import { tools } from '../src/data/tools.js'
import { readCredentials } from './env.mjs'

const BUCKET = 'tool-logos'
const CONCURRENCY = 6

const { url: SUPABASE_URL, secretKey } = readCredentials()
const supabase = createClient(SUPABASE_URL, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const limitArg = process.argv.find((a) => a.startsWith('--limit='))
const limit = limitArg ? Number(limitArg.split('=')[1]) : Infinity

// Map a MIME type to a file extension for the storage object path.
function extForMime(mime) {
  if (!mime) return 'png'
  if (mime.includes('svg')) return 'svg'
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg'
  if (mime.includes('webp')) return 'webp'
  if (mime.includes('icon')) return 'ico'
  return 'png'
}

function faviconSourceUrl(tool) {
  if (tool.logoUrl) return tool.logoUrl
  try {
    const website = new URL(tool.websiteUrl)
    return `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(website.origin)}&sz=128`
  } catch {
    return null
  }
}

function publicUrl(objectPath) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${objectPath}`
}

async function processTool(tool) {
  const source = faviconSourceUrl(tool)
  if (!source) return { slug: tool.slug, status: 'skipped', reason: 'no image source' }

  let bytes
  let contentType = 'image/png'
  try {
    const res = await fetch(source, { redirect: 'follow' })
    if (!res.ok) return { slug: tool.slug, status: 'failed', reason: `download ${res.status}` }
    const type = res.headers.get('content-type') || ''
    if (!type.startsWith('image/')) return { slug: tool.slug, status: 'failed', reason: `not an image (${type || 'unknown'})` }
    contentType = type
    bytes = new Uint8Array(await res.arrayBuffer())
  } catch (error) {
    return { slug: tool.slug, status: 'failed', reason: `download error: ${error.message}` }
  }

  const objectPath = `${tool.slug}.${extForMime(contentType)}`
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, bytes, { contentType, upsert: true })
  if (uploadError) return { slug: tool.slug, status: 'failed', reason: `upload: ${uploadError.message}` }

  const logoUrl = publicUrl(objectPath)
  const { error: updateError } = await supabase
    .from('tools').update({ logo_url: logoUrl }).eq('slug', tool.slug)
  if (updateError) return { slug: tool.slug, status: 'failed', reason: `logo_url update: ${updateError.message}` }

  return { slug: tool.slug, status: 'uploaded', logoUrl }
}

async function runPool(items, size, worker) {
  let index = 0
  const results = []
  async function next() {
    while (index < items.length) {
      const current = index++
      results[current] = await worker(items[current])
    }
  }
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, next))
  return results
}

async function main() {
  // Make sure the bucket exists even if the migration wasn't run manually —
  // an empty bucket with a public read policy is created via the API too.
  const { data: bucket } = await supabase.storage.getBucket(BUCKET)
  if (!bucket) {
    const { error: createError } = await supabase.storage.createBucket(BUCKET, { public: true })
    if (createError) console.warn(`Could not auto-create bucket: ${createError.message} (run 0003_storage.sql).`)
  }

  const queue = Number.isFinite(limit) ? tools.slice(0, limit) : tools
  console.log(`Uploading logos for ${queue.length} tools into "${BUCKET}"…`)

  const results = await runPool(queue, CONCURRENCY, processTool)
  const uploaded = results.filter((r) => r.status === 'uploaded')
  const skipped = results.filter((r) => r.status === 'skipped')
  const failed = results.filter((r) => r.status === 'failed')

  for (const f of failed) console.warn(`  failed: ${f.slug} — ${f.reason}`)
  for (const s of skipped) console.warn(`  skipped: ${s.slug} — ${s.reason}`)

  console.log(`\nDone. uploaded=${uploaded.length} skipped=${skipped.length} failed=${failed.length}`)
  if (uploaded.length) console.log(`Public logo base: ${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`)
}

main().catch((error) => {
  console.error('Logo upload failed:', error)
  process.exit(1)
})
