import { ArrowUpRight, ExternalLink } from 'lucide-react'
import { Link } from 'react-router'
import CompareButton from '../common/CompareButton.jsx'
import FavoriteButton from '../common/FavoriteButton.jsx'
import ToolLogo from '../common/ToolLogo.jsx'
import { getToolCategories } from '../../utils/catalog.js'
import { PRICING_LABELS } from '../../utils/pricing.js'
import useCardSpotlight from '../../hooks/useCardSpotlight.js'

function ToolCard({ tool, compact = false }) {
  const toolCategories = getToolCategories(tool)
  const primaryCategory = toolCategories[0]
  const pricingLabel = PRICING_LABELS[tool.pricingModel] ?? PRICING_LABELS.unknown
  const spotlight = useCardSpotlight()

  return (
    <article
      className={`tool-card${compact ? ' tool-card--compact' : ''} card-surface`}
      data-reveal
      {...spotlight}
    >
      <div className="tool-card__topline">
        <ToolLogo tool={tool} category={primaryCategory} />
        <div className="tool-card__topline-actions">
          {tool.featured && <span className="tool-card__featured">Featured</span>}
          <CompareButton tool={tool} />
          <FavoriteButton tool={tool} />
        </div>
      </div>

      <h3 className="tool-card__title">
        <Link to={`/tools/${tool.slug}`}>{tool.name}</Link>
      </h3>
      <p className="tool-card__description">{tool.description}</p>

      {toolCategories.length > 0 && (
        <ul className="tool-card__categories" aria-label={`${tool.name} categories`}>
          {toolCategories.map((category) => (
            <li key={category.id}>
              <Link to={`/categories/${category.slug}`}>{category.name}</Link>
            </li>
          ))}
        </ul>
      )}

      <div className="tool-card__metadata">
        <span className={`tool-card__pricing tool-card__pricing--${tool.pricingModel}`}>
          {pricingLabel}
        </span>
        {tool.pricingUrl && tool.pricingModel !== 'unknown' && (
          <a
            className="tool-card__pricing-link"
            href={tool.pricingUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${tool.name} official pricing information (opens in a new tab)`}
          >
            Pricing details <ExternalLink aria-hidden="true" size={13} strokeWidth={1.8} />
          </a>
        )}
      </div>

      <div className="tool-card__actions">
        <Link className="tool-card__details" to={`/tools/${tool.slug}`}>
          View details <ArrowUpRight aria-hidden="true" size={15} strokeWidth={1.8} />
        </Link>
        <a
          className="tool-card__official-link"
          href={tool.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Visit ${tool.name} official website (opens in a new tab)`}
        >
          Official site <ExternalLink aria-hidden="true" size={14} strokeWidth={1.8} />
        </a>
      </div>
    </article>
  )
}

export default ToolCard
