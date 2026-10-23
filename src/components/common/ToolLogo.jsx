import { useMemo, useState } from 'react'
import CategoryIcon from './CategoryIcon.jsx'

// Candidate image sources, tried in order: the first-party Supabase Storage
// logo (tool.logoUrl), then the website favicon proxy. If every candidate
// fails to load we fall back to the category icon / initials.
function ToolLogo({ tool, category }) {
  const candidates = useMemo(() => {
    const list = []
    if (tool.logoUrl) list.push(tool.logoUrl)
    try {
      const website = new URL(tool.websiteUrl)
      list.push(`https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(website.origin)}&sz=128`)
    } catch {
      // No valid website URL: keep only any explicit logo, then fall back.
    }
    return list
  }, [tool.logoUrl, tool.websiteUrl])

  const [failedCount, setFailedCount] = useState(0)
  const logoUrl = candidates[failedCount] ?? null
  const initials = tool.name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

  return (
    <span className="tool-card__mark" aria-hidden="true">
      {logoUrl ? (
        <img
          className="tool-card__logo-image"
          src={logoUrl}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailedCount((count) => count + 1)}
        />
      ) : category ? (
        <CategoryIcon iconKey={category.iconKey} size={22} />
      ) : (
        <span className="tool-card__initials" aria-hidden="true">{initials}</span>
      )}
    </span>
  )
}

export default ToolLogo
