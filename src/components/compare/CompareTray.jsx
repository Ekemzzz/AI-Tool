import { Scale, X } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import useCompare from '../../hooks/useCompare.js'

// Persistent bottom bar that follows the selection across pages and links
// into the comparison table. Hidden while the table itself is open.
function CompareTray() {
  const { compareTools, isFull, maxCompare, toggleCompare, clearCompare } = useCompare()
  const { pathname } = useLocation()

  if (pathname === '/compare' || compareTools.length === 0) return null

  return (
    <div className="compare-tray" role="region" aria-label="Compare selection">
      <span className="compare-tray__count">
        <Scale aria-hidden="true" size={16} strokeWidth={1.9} />
        {compareTools.length} of {maxCompare} selected
      </span>

      <ul className="compare-tray__chips">
        {compareTools.map((tool) => (
          <li key={tool.id}>
            <span className="compare-chip">
              {tool.name}
              <button
                type="button"
                className="compare-chip__remove"
                aria-label={`Remove ${tool.name} from compare`}
                onClick={() => toggleCompare(tool.id)}
              >
                <X aria-hidden="true" size={13} strokeWidth={2.2} />
              </button>
            </span>
          </li>
        ))}
      </ul>

      <div className="compare-tray__actions">
        <Link className="button button--primary compare-tray__cta" to="/compare">
          Compare
        </Link>
        <button type="button" className="compare-tray__clear" onClick={clearCompare}>
          Clear
        </button>
      </div>

      {isFull && (
        <span className="compare-tray__hint" role="status">
          Compare is full — remove one to add another.
        </span>
      )}
    </div>
  )
}

export default CompareTray
