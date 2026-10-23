import { ExternalLink, X } from 'lucide-react'
import { Link } from 'react-router'
import EmptyState from '../components/common/EmptyState.jsx'
import ToolLogo from '../components/common/ToolLogo.jsx'
import useCompare from '../hooks/useCompare.js'
import { getToolCategories } from '../utils/catalog.js'
import { PRICING_LABELS } from '../utils/pricing.js'
import '../styles/compare.css'

function ListRow({ items, emptyLabel }) {
  if (items.length === 0) return <p className="compare-cell__empty">{emptyLabel}</p>
  return (
    <ul className="compare-cell__list">
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  )
}

function ComparePage() {
  const { compareTools, toggleCompare, clearCompare, maxCompare } = useCompare()

  if (compareTools.length === 0) {
    return (
      <div className="compare-page">
        <h1>Compare tools</h1>
        <EmptyState
          title="Nothing selected yet"
          description={`Use the Compare button on any tool card to line up to ${maxCompare} tools side by side, feature by feature and price by price.`}
          linkTo="/tools"
          linkLabel="Explore tools"
        />
      </div>
    )
  }

  return (
    <div className="compare-page">
      <div className="compare-page__header">
        <div>
          <h1>Compare tools</h1>
          <p className="compare-page__sub">
            {compareTools.length} of {maxCompare} selected. Based on catalog features, categories, and pricing models.
          </p>
        </div>
        <button type="button" className="compare-page__clear" onClick={clearCompare}>
          Clear all
        </button>
      </div>

      <div className="compare-scroll" role="region" aria-label="Tool comparison table" tabIndex={0}>
        <table className="compare-table">
          <caption className="compare-table__caption">Side-by-side comparison of selected tools</caption>
          <colgroup>
            <col className="compare-col--label" />
            {compareTools.map((tool) => <col key={tool.id} />)}
          </colgroup>
          <thead>
            <tr>
              <th scope="col">
                <span className="sr-label">Attribute</span>
              </th>
              {compareTools.map((tool) => (
                <th key={tool.id} scope="col">
                  <div className="compare-tool-head">
                    <ToolLogo tool={tool} category={getToolCategories(tool)[0]} />
                    <div className="compare-tool-head__copy">
                      <Link to={`/tools/${tool.slug}`}>{tool.name}</Link>
                      <p>{tool.description}</p>
                    </div>
                    <button
                      type="button"
                      className="compare-tool-head__remove"
                      aria-label={`Remove ${tool.name} from compare`}
                      onClick={() => toggleCompare(tool.id)}
                    >
                      <X aria-hidden="true" size={15} strokeWidth={2.2} />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Pricing</th>
              {compareTools.map((tool) => (
                <td key={tool.id}>
                  <span className={`tool-card__pricing tool-card__pricing--${tool.pricingModel}`}>
                    {PRICING_LABELS[tool.pricingModel] ?? PRICING_LABELS.unknown}
                  </span>
                  {tool.pricingUrl && tool.pricingModel !== 'unknown' && (
                    <a
                      className="compare-cell__link"
                      href={tool.pricingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Pricing details <ExternalLink aria-hidden="true" size={13} strokeWidth={1.8} />
                    </a>
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">Categories</th>
              {compareTools.map((tool) => (
                <td key={tool.id}>
                  <ListRow
                    items={getToolCategories(tool).map((category) => category.name)}
                    emptyLabel="Uncategorized"
                  />
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">Features</th>
              {compareTools.map((tool) => (
                <td key={tool.id}>
                  <ListRow items={tool.features} emptyLabel="Not verified for this listing" />
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">Use cases</th>
              {compareTools.map((tool) => (
                <td key={tool.id}>
                  <ListRow items={tool.useCases} emptyLabel="Not listed" />
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">Tags</th>
              {compareTools.map((tool) => (
                <td key={tool.id}>
                  <ListRow items={tool.tags} emptyLabel="Not listed" />
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">Website</th>
              {compareTools.map((tool) => (
                <td key={tool.id}>
                  <a className="compare-cell__link" href={tool.websiteUrl} target="_blank" rel="noopener noreferrer">
                    {new URL(tool.websiteUrl).hostname} <ExternalLink aria-hidden="true" size={13} strokeWidth={1.8} />
                  </a>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <p className="compare-page__note">
        Sample catalog data. Confirm features and pricing on each official site before deciding.
        {' '}
        <Link className="text-link" to="/tools">Add more tools to compare</Link>
      </p>
    </div>
  )
}

export default ComparePage
