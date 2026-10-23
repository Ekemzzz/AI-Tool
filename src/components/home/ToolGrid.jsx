import EmptyState from '../common/EmptyState.jsx'
import { getToolGridState } from '../../utils/toolGrid.js'
import ToolCard from './ToolCard.jsx'

function normalizeColumns(columns) {
  const parsed = Number.parseInt(columns, 10)
  return Number.isInteger(parsed) ? Math.min(4, Math.max(1, parsed)) : 3
}

function ToolGrid({
  tools = [],
  loading = false,
  columns = 3,
  emptyTitle = 'No tools to display',
  emptyDescription = 'Try a different search or browse another category.',
  compact = false,
}) {
  const columnCount = normalizeColumns(columns)
  const gridClassName = `tool-grid tool-grid--columns-${columnCount}${compact ? ' tool-grid--compact' : ''}`
  const state = getToolGridState(tools, loading)

  if (state === 'loading') {
    return (
      <div className={`${gridClassName} tool-grid--loading`} role="status" aria-label="Loading tools" aria-busy="true">
        {Array.from({ length: Math.max(3, columnCount * 2) }, (_, index) => (
          <div className="tool-skeleton" key={index} aria-hidden="true">
            <span className="tool-skeleton__mark" />
            <span className="tool-skeleton__line tool-skeleton__line--title" />
            <span className="tool-skeleton__line" />
            <span className="tool-skeleton__line tool-skeleton__line--short" />
          </div>
        ))}
      </div>
    )
  }

  if (state === 'empty') {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        linkTo="/categories"
        linkLabel="Browse categories"
      />
    )
  }

  return (
    <div className={gridClassName}>
      {tools.map((tool) => (
        <ToolCard key={tool.id} tool={tool} compact={compact} />
      ))}
    </div>
  )
}

export default ToolGrid
