import { getCategoryCounts } from '../../utils/catalog.js'
import CategoryCard from './CategoryCard.jsx'

function CategoryGrid({ categories, tools }) {
  const counts = getCategoryCounts(tools)

  return (
    <div className="category-grid">
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          count={counts[category.id] ?? 0}
        />
      ))}
    </div>
  )
}

export default CategoryGrid
