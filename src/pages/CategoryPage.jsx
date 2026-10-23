import { useMemo } from 'react'
import { Link, useParams } from 'react-router'
import EmptyState from '../components/common/EmptyState.jsx'
import ExploreFilters from '../components/home/ExploreFilters.jsx'
import SearchBar from '../components/home/SearchBar.jsx'
import ToolGrid from '../components/home/ToolGrid.jsx'
import useCatalog from '../hooks/useCatalog.js'
import useExploreFilters from '../hooks/useExploreFilters.js'
import usePageMeta from '../hooks/usePageMeta.js'
import { findToolsByCategory } from '../utils/catalog.js'
import { applyExploreFilters, getUseCaseOptions } from '../utils/exploreFilters.js'

function CategoryPage() {
  const { slug } = useParams()
  const { tools, categories, loading } = useCatalog()
  const category = categories.find((item) => item.slug === slug)
  const categoryTools = useMemo(() => category ? findToolsByCategory(category.name, tools) : [], [category, tools])
  const { filters, setQuery, setPricing, setUseCase, setSort, clearAll } = useExploreFilters({ toolRecords: categoryTools })
  const routeScopedFilters = useMemo(
    () => ({ ...filters, categories: [], page: 1 }),
    [filters],
  )
  const matchingTools = useMemo(
    () => applyExploreFilters(categoryTools, routeScopedFilters),
    [categoryTools, routeScopedFilters],
  )
  const useCaseOptions = useMemo(() => getUseCaseOptions(categoryTools), [categoryTools])
  const countLabel = matchingTools.length === 1 ? 'tool' : 'tools'
  usePageMeta({
    title: category ? category.name : 'Category',
    description: category
      ? `${category.description} Browse ${category.name} AI tools in the directory.`
      : undefined,
  })

  if (loading && !category) {
    return (
      <div className="results-page category-results-page">
        <p className="catalog-loading" role="status">Loading category…</p>
      </div>
    )
  }

  if (!category) {
    return (
      <EmptyState
        title="Category not found"
        description="That category is not part of the catalog."
        linkTo="/categories"
        linkLabel="Browse all categories"
      />
    )
  }

  return (
    <div className="results-page category-results-page">
      <header className="catalog-page__header">
        <Link className="back-link" to="/categories">All categories</Link>
        <h1>{category.name}</h1>
        <p>{category.description}</p>
        <p className="results-summary" aria-live="polite">{matchingTools.length} {countLabel} in this category</p>
        <SearchBar
          inputId={`category-search-${category.slug}`}
          value={filters.q}
          onQueryChange={setQuery}
          hideSubmit
          searchLabel={`Search within ${category.name}`}
        />
      </header>

      <ExploreFilters
        filters={routeScopedFilters}
        useCaseOptions={useCaseOptions}
        showCategories={false}
        onPricingChange={setPricing}
        onUseCaseChange={setUseCase}
        onSortChange={setSort}
        onRemoveQuery={() => setQuery('')}
        onClearAll={clearAll}
      />

      {matchingTools.length > 0 ? (
        <ToolGrid tools={matchingTools} />
      ) : categoryTools.length === 0 ? (
        <EmptyState
          title="No tools are listed in this category yet."
          description="This category is part of the directory taxonomy, but has no sample listings yet."
          linkTo="/tools"
          linkLabel="Browse all tools"
        />
      ) : (
        <div className="empty-state" role="status">
          <h2>No tools match these filters.</h2>
          <p>Adjust the search or clear the category filters to see all {category.name} listings.</p>
          <button className="button button--secondary" type="button" onClick={clearAll}>Clear filters</button>
        </div>
      )}
    </div>
  )
}

export default CategoryPage
