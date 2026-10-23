import { Heart } from 'lucide-react'
import useFavorites from '../../hooks/useFavorites.js'

function FavoriteButton({ tool }) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const saved = isFavorite(tool.id)

  return (
    <button
      className={`favorite-button${saved ? ' is-favorite' : ''}`}
      type="button"
      aria-pressed={saved}
      aria-label={`${saved ? 'Remove' : 'Add'} ${tool.name} ${saved ? 'from' : 'to'} favorites`}
      onClick={() => toggleFavorite(tool.id)}
    >
      <Heart aria-hidden="true" size={18} strokeWidth={1.8} fill={saved ? 'currentColor' : 'none'} />
    </button>
  )
}

export default FavoriteButton
