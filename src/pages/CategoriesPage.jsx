import CategoryGrid from '../components/home/CategoryGrid.jsx'
import SectionHeading from '../components/home/SectionHeading.jsx'
import useCatalog from '../hooks/useCatalog.js'

function CategoriesPage() {
  const { tools, categories, loading } = useCatalog()

  return (
    <div className="catalog-page">
      <header className="catalog-page__header">
        <h1>AI tool categories</h1>
        <p>
          Looking for help with writing, coding, design, research, or customer support? Pick a category to find AI tools for the work you need to get done.
        </p>
      </header>
      <section aria-labelledby="all-categories-title">
        <SectionHeading id="all-categories-title" title="All categories" />
        {loading && categories.length === 0 ? (
          <p className="catalog-loading" role="status">Loading categories…</p>
        ) : (
          <CategoryGrid categories={categories} tools={tools} />
        )}
      </section>
    </div>
  )
}

export default CategoriesPage
