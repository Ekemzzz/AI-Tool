import useCatalog from '../../hooks/useCatalog.js'

// Site-wide notice shown only when the live catalog fetch failed and we're
// serving the bundled fallback data. Offers a retry. Renders nothing in the
// normal (healthy or static) cases.
function CatalogStatus() {
  const { error, loading, retry } = useCatalog()

  if (!error || loading) return null

  return (
    <div className="catalog-status" role="alert">
      <p className="catalog-status__message">
        We couldn&rsquo;t reach the live catalog, so we&rsquo;re showing the built-in list. Some
        entries may be out of date.
      </p>
      <button
        type="button"
        className="button button--secondary catalog-status__retry"
        onClick={retry}
      >
        Try again
      </button>
    </div>
  )
}

export default CatalogStatus
