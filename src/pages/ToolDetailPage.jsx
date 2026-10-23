import { ArrowLeft, ExternalLink } from 'lucide-react'
import { Link, useParams } from 'react-router'
import CompareButton from '../components/common/CompareButton.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import FavoriteButton from '../components/common/FavoriteButton.jsx'
import ToolLogo from '../components/common/ToolLogo.jsx'
import ToolGrid from '../components/home/ToolGrid.jsx'
import useCatalog from '../hooks/useCatalog.js'
import usePageMeta from '../hooks/usePageMeta.js'
import { findToolBySlug, getRelatedTools, getToolCategories } from '../utils/catalog.js'
import { PRICING_LABELS } from '../utils/pricing.js'

function formatVerifiedDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return ''
  const date = new Date(`${value}T00:00:00.000Z`)
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return ''
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'long', timeZone: 'UTC' }).format(date)
}

function ToolDetailPage() {
  const { slug } = useParams()
  const { tools, loading } = useCatalog()
  const tool = findToolBySlug(slug, tools)
  usePageMeta({
    title: tool ? tool.name : 'Tool not found',
    description: tool ? `${tool.description} See features, use cases, and pricing for ${tool.name}.` : undefined,
  })

  if (loading && !tool) {
    return (
      <div className="tool-detail">
        <p className="catalog-loading" role="status">Loading tool…</p>
      </div>
    )
  }

  if (!tool) {
    return (
      <div className="tool-detail">
        <EmptyState
          title="Tool not found"
          description="That listing is not part of the catalog."
          linkTo="/tools"
          linkLabel="Explore tools"
        />
      </div>
    )
  }

  const toolCategories = getToolCategories(tool)
  const relatedTools = getRelatedTools(tool, tools, 4)
  const verifiedDate = formatVerifiedDate(tool.lastVerifiedAt)
  const primaryCategory = toolCategories[0]
  const pricingLabel = PRICING_LABELS[tool.pricingModel] ?? PRICING_LABELS.unknown

  return (
    <article className="tool-detail">
      <Link className="back-link" to="/tools">
        <ArrowLeft aria-hidden="true" size={16} /> Back to Explore
      </Link>

      <header className="tool-detail__hero">
        <ToolLogo tool={tool} category={primaryCategory} />
        <div className="tool-detail__hero-copy">
          <div className="tool-detail__hero-title">
            <h1>{tool.name}</h1>
            <FavoriteButton tool={tool} />
          </div>
          <p className="tool-detail__description">{tool.description}</p>
        </div>
      </header>

      <p className="tool-detail__pricing">{pricingLabel}</p>

      {toolCategories.length > 0 && (
        <section className="tool-detail__section" aria-labelledby="tool-categories-title">
          <h2 id="tool-categories-title">Categories</h2>
          <ul className="tool-detail__categories">
            {toolCategories.map((category) => (
              <li key={category.id}>
                <Link to={`/categories/${category.slug}`}>{category.name}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tool.useCases.length > 0 && (
        <section className="tool-detail__section" aria-labelledby="tool-use-cases-title">
          <h2 id="tool-use-cases-title">Use cases</h2>
          <ul className="tool-detail__tags">
            {tool.useCases.map((useCase) => <li key={useCase}>{useCase}</li>)}
          </ul>
        </section>
      )}

      <section className="tool-detail__section" aria-labelledby="tool-features-title">
        <h2 id="tool-features-title">Features</h2>
        {tool.features.length > 0 ? (
          <ul className="tool-detail__features">
            {tool.features.map((feature) => <li key={feature}>{feature}</li>)}
          </ul>
        ) : (
          <p className="tool-detail__related-empty">Specific features are not verified for this sample listing.</p>
        )}
      </section>

      {verifiedDate && (
        <p className="tool-detail__verified">
          Last verified <time dateTime={tool.lastVerifiedAt}>{verifiedDate}</time>
        </p>
      )}

      <div className="tool-detail__actions">
        <a className="button button--primary" href={tool.websiteUrl} target="_blank" rel="noopener noreferrer">
          Visit Official Website <ExternalLink aria-hidden="true" size={16} />
        </a>
        {tool.pricingUrl && tool.pricingModel !== 'unknown' && (
          <a className="button button--secondary" href={tool.pricingUrl} target="_blank" rel="noopener noreferrer">
            Official pricing information <ExternalLink aria-hidden="true" size={16} />
          </a>
        )}
        <CompareButton tool={tool} withLabel />
      </div>
      <p className="tool-detail__note">Sample listing. Check the official site for current product and pricing details.</p>

      <section className="tool-detail__related" aria-labelledby="related-tools-title">
        <h2 id="related-tools-title">Related tools</h2>
        {relatedTools.length > 0 ? (
          <ToolGrid tools={relatedTools} columns={2} compact />
        ) : (
          <p className="tool-detail__related-empty">No related tools yet. Try exploring the full catalog to find another listing.</p>
        )}
      </section>
    </article>
  )
}

export default ToolDetailPage
