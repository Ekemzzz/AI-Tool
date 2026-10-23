// Generates public/sitemap.xml and public/robots.txt from the catalog data.
// Run directly (npm run sitemap) or automatically before a build via the
// correct, e.g. `SITE_URL=https://example.com npm run build`.
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { writeFileSync } from 'node:fs'
import { categories } from '../src/data/categories.js'
import { tools } from '../src/data/tools.js'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.resolve(scriptDir, '..', 'public')

const SITE_URL = (process.env.SITE_URL || 'https://example.com').replace(/\/+$/, '')
const builtDate = new Date().toISOString().slice(0, 10)

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Absolute URL for a route path. Paths here are static slugs, so encoding the
// pathname is enough; trailing slashes are omitted to match the app's routes.
function locate(pathname) {
  return `${SITE_URL}${pathname}`
}

function entry(pathname, { priority, changefreq, lastmod }) {
  const parts = [`    <loc>${escapeXml(locate(pathname))}</loc>`]
  if (lastmod) parts.push(`    <lastmod>${lastmod}</lastmod>`)
  if (changefreq) parts.push(`    <changefreq>${changefreq}</changefreq>`)
  if (priority) parts.push(`    <priority>${priority}</priority>`)
  return `  <url>\n${parts.join('\n')}\n  </url>`
}

const urlEntries = [
  entry('/', { priority: '1.0', changefreq: 'daily' }),
  entry('/tools', { priority: '0.9', changefreq: 'daily' }),
  entry('/categories', { priority: '0.8', changefreq: 'weekly' }),
  ...categories.map((category) =>
    entry(`/categories/${category.slug}`, { priority: '0.7', changefreq: 'weekly', lastmod: builtDate }),
  ),
  ...tools.map((tool) =>
    entry(`/tools/${tool.slug}`, {
      priority: '0.6',
      changefreq: 'weekly',
      lastmod: tool.lastVerifiedAt || builtDate,
    }),
  ),
]

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  urlEntries.join('\n'),
  '</urlset>',
  '',
].join('\n')

const robots = [
  'User-agent: *',
  'Allow: /',
  '',
  `Sitemap: ${locate('/sitemap.xml')}`,
  '',
].join('\n')

writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap, 'utf8')
writeFileSync(path.join(publicDir, 'robots.txt'), robots, 'utf8')

console.log(
  `Generated sitemap.xml (${urlEntries.length} URLs) and robots.txt in public/ for ${SITE_URL}.`,
)
if (SITE_URL === 'https://example.com') {
  console.warn('Note: SITE_URL is not set — using placeholder origin. Set SITE_URL to your deployed domain before building.')
}
