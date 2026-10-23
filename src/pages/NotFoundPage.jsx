import { Link } from 'react-router'
import RoutePlaceholder from './RoutePlaceholder.jsx'

function NotFoundPage() {
  return (
    <RoutePlaceholder
      title="Page not found"
      description="That address does not match a page in the directory."
    >
      <p>
        <Link to="/tools">Return to Explore</Link>
      </p>
    </RoutePlaceholder>
  )
}

export default NotFoundPage
