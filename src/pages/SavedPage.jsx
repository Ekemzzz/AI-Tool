import EmptyState from '../components/common/EmptyState.jsx'
import ToolGrid from '../components/home/ToolGrid.jsx'
import useCatalog from '../hooks/useCatalog.js'
import useFavorites from '../hooks/useFavorites.js'
import { getFavoriteTools } from '../utils/favorites.js'

function SavedPage() {
  const { tools, loading } = useCatalog()
  const { favoriteIds } = useFavorites()
  const savedTools = getFavoriteTools(favoriteIds, tools)
  const countLabel = savedTools.length === 1 ? 'tool' : 'tools'

  return (
    <div className="results-page saved-page">
      <header className="catalog-page__header">
        <h1>Saved tools</h1>
        <p>Your saved tools are backed up to your account and reappear whenever you come back.</p>
        <p className="results-summary" aria-live="polite">{savedTools.length} saved {countLabel}</p>
      </header>
      {savedTools.length > 0 ? (
        <ToolGrid tools={savedTools} />
      ) : loading && tools.length === 0 ? (
        <ToolGrid tools={[]} loading />
      ) : (
        <EmptyState
          title="You have not saved any tools yet."
          description="Save a tool with the heart button and it will appear here."
          linkTo="/tools"
          linkLabel="Explore tools"
        />
      )}
    </div>
  )
}

export default SavedPage
