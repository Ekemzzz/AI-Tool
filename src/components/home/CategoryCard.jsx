import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import CategoryIcon from '../common/CategoryIcon.jsx'
import useCardSpotlight from '../../hooks/useCardSpotlight.js'

function CategoryCard({ category, count }) {
  const spotlight = useCardSpotlight()

  return (
    <Link
      className="category-card card-surface"
      data-reveal
      to={`/categories/${category.slug}`}
      aria-label={`Browse ${category.name}`}
      {...spotlight}
    >
      <span className={`category-icon category-icon--${category.iconKey}`} aria-hidden="true">
        <CategoryIcon iconKey={category.iconKey} size={22} strokeWidth={1.9} />
      </span>
      <span className="category-card__title">{category.name}</span>
      <span className="category-card__description">{category.description}</span>
      <span className="category-card__footer">
        <span>{count} {count === 1 ? 'tool' : 'tools'}</span>
        <ArrowUpRight aria-hidden="true" size={16} strokeWidth={1.8} />
      </span>
    </Link>
  )
}

export default CategoryCard
