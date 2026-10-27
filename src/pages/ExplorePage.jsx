import { useMemo } from 'react'
import ExploreFilters from '../components/home/ExploreFilters.jsx'
import SearchBar from '../components/home/SearchBar.jsx'
import ToolGrid from '../components/home/ToolGrid.jsx'
import useCatalog from '../hooks/useCatalog.js'
import useExploreFilters from '../hooks/useExploreFilters.js'
import useExploreResults from '../hooks/useExploreResults.js'
import { EXPLORE_PAGE_SIZE, getUseCaseOptions } from '../utils/exploreFilters.js'

function ExplorePage() {
  const { tools } = useCatalog()
  const { filters, setQuery, setCategories, setPricing, setUseCase, setSort, setPage, clearAll } = useExploreFilters()
  const useCaseOptions = useMemo(() => getUseCaseOptions(tools), [tools])
  const { visibleTools, total, loading, degraded } = useExploreResults(filters, filters.page)
  const totalPages = Math.max(1, Math.ceil(total / EXPLORE_PAGE_SIZE))
  const visiblePage = Math.min(filters.page, totalPages)
  const countLabel = total === 1 ? 'tool' : 'tools'

  return (
    <div className="results-page explore-page">
      <header className="results-page__header explore-page__header">
        <h1>Explore AI tools</h1>
        <p>Find a tool for the task at hand. Search across names, descriptions, categories, use cases, and tags.</p>
        <SearchBar
          inputId="results-tool-search"
          value={filters.q}
          onQueryChange={setQuery}
          hideSubmit
        />
      </header>

      <div className="explore-page__layout">
        <ExploreFilters
          filters={filters}
          useCaseOptions={useCaseOptions}
          onCategoriesChange={setCategories}
          onPricingChange={setPricing}
          onUseCaseChange={setUseCase}
          onSortChange={setSort}
          onRemoveQuery={() => setQuery('')}
          onClearAll={clearAll}
        />

        <section className="explore-page__results" aria-label="Tool search results">
          {degraded && (
            <p className="explore-page__sort-note" role="status">
              Live server search is unavailable right now, so results are being filtered locally.
            </p>
          )}

          <div className="explore-results-bar">
            <p className="results-summary" aria-live="polite" aria-atomic="true">
              {total} {countLabel} found
              {visibleTools.length < total && ` · Showing ${visibleTools.length}`}
              {filters.q.trim() && <> for <strong>“{filters.q.trim()}”</strong></>}
            </p>
            <span className="explore-results-bar__range">
              {total > 0 ? `Showing 1–${visibleTools.length} of ${total}` : 'No results'}
            </span>
          </div>

          <ToolGrid
            tools={visibleTools}
            loading={loading && visibleTools.length === 0}
            emptyTitle="No tools match these filters."
            emptyDescription="Try a different search or remove one or more filters."
          />

          {(visiblePage < totalPages || visiblePage > 1) && (
            <div className="explore-load-more-wrap">
              {visiblePage > 1 && (
                <button
                  className="button button--secondary explore-load-more"
                  type="button"
                  onClick={() => setPage(visiblePage - 1)}
                >
                  Show fewer tools
                </button>
              )}
              {visiblePage < totalPages && (
                <button
                  className="button button--secondary explore-load-more"
                  type="button"
                  onClick={() => setPage(visiblePage + 1)}
                >
                  Load more tools
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default ExplorePage
