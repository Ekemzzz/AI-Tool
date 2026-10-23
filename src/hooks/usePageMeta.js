import { useEffect } from 'react'

const SITE_NAME = 'AI Tools Directory'
const DEFAULT_DESCRIPTION =
  'A curated directory for discovering AI tools by category, pricing model, and use case.'

// Applies per-route document titles and social/SEO metadata. Each page passes a
// short title (used as "Title — AI Tools Directory") and a description; omitting
// the title falls back to the branded home title so no route stays generic.
function upsertMeta(attr, key, value) {
  if (!value) return
  let tag = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, key)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', value)
}

function usePageMeta({ title, description } = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Discover the right AI tool`
    const metaDescription = description || DEFAULT_DESCRIPTION

    document.title = fullTitle
    upsertMeta('name', 'description', metaDescription)
    upsertMeta('property', 'og:title', fullTitle)
    upsertMeta('property', 'og:description', metaDescription)
    upsertMeta('property', 'og:url', window.location.href)
    upsertMeta('name', 'twitter:title', fullTitle)
    upsertMeta('name', 'twitter:description', metaDescription)
  }, [title, description])
}

export default usePageMeta
