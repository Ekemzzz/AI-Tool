import { X } from 'lucide-react'
import { categories as categoryOptions } from '../../data/categories.js'
import { tools } from '../../data/tools.js'
import { getCategoryCounts } from '../../utils/catalog.js'
import { EXPLORE_SORT_OPTIONS } from '../../utils/exploreFilters.js'
import { PRICING_LABELS } from '../../utils/pricing.js'
import { PRICING_MODELS } from '../../utils/validateTools.js'

const categoryCounts = getCategoryCounts(tools, categoryOptions)

function ExploreFilters({
  filters,
  useCaseOptions,
  onCategoriesChange,
  onPricingChange,
  onUseCaseChange,
  onSortChange,
  onClearAll,
  onRemoveQuery,
  showCategories = true,
}) {
  const selectedCategoryNames = new Set(filters.categories.map((slug) => categoryOptions.find((category) => category.slug === slug)?.name).filter(Boolean))
  const hasFilters = Boolean(
    filters.q.trim()
    || filters.categories.length
    || filters.pricing
    || filters.useCase
    || filters.sort !== 'featured',
  )

  function toggleCategory(slug) {
    const selected = new Set(filters.categories)
    if (selected.has(slug)) selected.delete(slug)
    else selected.add(slug)
    onCategoriesChange(categoryOptions.map(({ slug: categorySlug }) => categorySlug).filter((categorySlug) => selected.has(categorySlug)))
  }

  return (
    <section className={`explore-filters${showCategories ? '' : ' explore-filters--category-scoped'}`} aria-label="Filter and sort tools">
      <div className="explore-filters__controls">
        {showCategories && (
          <details className="explore-category-filter">
            <summary aria-label="Choose tool categories">
              Categories
              {filters.categories.length > 0 && <span className="explore-category-filter__count">{filters.categories.length}</span>}
            </summary>
            <fieldset className="explore-category-filter__options">
              <legend>Show tools in any selected category</legend>
              {categoryOptions.map((category) => (
                <label className="explore-category-filter__option" key={category.id}>
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(category.slug)}
                    onChange={() => toggleCategory(category.slug)}
                  />
                  <span>{category.name}</span>
                  <span className="explore-category-filter__option-count">{categoryCounts[category.id] ?? 0}</span>
                </label>
              ))}
            </fieldset>
          </details>
        )}

        <label className="explore-select">
          <span>Pricing</span>
          <select value={filters.pricing} onChange={(event) => onPricingChange(event.target.value)}>
            <option value="">Any pricing</option>
            {PRICING_MODELS.map((pricingModel) => (
              <option key={pricingModel} value={pricingModel}>{PRICING_LABELS[pricingModel]}</option>
            ))}
          </select>
        </label>

        <label className="explore-select">
          <span>Use case</span>
          <select value={filters.useCase} onChange={(event) => onUseCaseChange(event.target.value)}>
            <option value="">Any use case</option>
            {useCaseOptions.map((useCase) => <option key={useCase} value={useCase}>{useCase}</option>)}
          </select>
        </label>

        <label className="explore-select explore-select--sort">
          <span>Sort by</span>
          <select value={filters.sort} onChange={(event) => onSortChange(event.target.value)}>
            {EXPLORE_SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      </div>

      {hasFilters && (
        <div className="explore-active-filters">
          <div className="explore-active-filters__chips" aria-label="Active filters">
            {filters.q.trim() && (
              <button className="explore-filter-chip" type="button" onClick={onRemoveQuery} aria-label="Remove search filter">
                Search: “{filters.q.trim()}” <X aria-hidden="true" size={14} />
              </button>
            )}
            {filters.categories.map((slug) => {
              const category = categoryOptions.find((item) => item.slug === slug)
              if (!category) return null
              return (
                <button
                  className="explore-filter-chip"
                  type="button"
                  key={slug}
                  aria-label={`Remove category filter: ${category.name}`}
                  onClick={() => onCategoriesChange(filters.categories.filter((value) => value !== slug))}
                >
                  {category.name} <X aria-hidden="true" size={14} />
                </button>
              )
            })}
            {filters.pricing && (
              <button className="explore-filter-chip" type="button" onClick={() => onPricingChange('')} aria-label="Remove pricing filter">
                {PRICING_LABELS[filters.pricing]} <X aria-hidden="true" size={14} />
              </button>
            )}
            {filters.useCase && (
              <button className="explore-filter-chip" type="button" onClick={() => onUseCaseChange('')} aria-label="Remove use-case filter">
                {filters.useCase} <X aria-hidden="true" size={14} />
              </button>
            )}
            {filters.sort !== 'featured' && (
              <button className="explore-filter-chip" type="button" onClick={() => onSortChange('featured')} aria-label="Remove sort filter">
                {EXPLORE_SORT_OPTIONS.find(({ value }) => value === filters.sort)?.label} <X aria-hidden="true" size={14} />
              </button>
            )}
          </div>
          <button className="explore-clear-filters" type="button" onClick={onClearAll}>Clear all filters</button>
        </div>
      )}

      {selectedCategoryNames.size > 1 && (
        <p className="explore-filters__logic">Matching any selected category; other filters combine with AND.</p>
      )}
    </section>
  )
}

export default ExploreFilters
