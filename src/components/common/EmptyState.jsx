import { Link } from 'react-router'

function EmptyState({ title, description, linkTo = '/categories', linkLabel = 'Browse categories' }) {
  return (
    <div className="empty-state" role="status">
      <h2>{title}</h2>
      <p>{description}</p>
      <Link className="text-link" to={linkTo}>{linkLabel}</Link>
    </div>
  )
}

export default EmptyState
