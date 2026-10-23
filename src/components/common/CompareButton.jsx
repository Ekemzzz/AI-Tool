import { Scale } from 'lucide-react'
import useCompare from '../../hooks/useCompare.js'

function CompareButton({ tool, withLabel = false }) {
  const { isComparing, isFull, toggleCompare, maxCompare } = useCompare()
  const selected = isComparing(tool.id)
  const blocked = !selected && isFull

  if (withLabel) {
    return (
      <button
        className={`compare-button compare-button--labeled${selected ? ' is-compare' : ''}`}
        type="button"
        aria-pressed={selected}
        disabled={blocked}
        title={blocked ? `Compare list is full (${maxCompare} max). Remove one first.` : undefined}
        onClick={() => toggleCompare(tool.id)}
      >
        <Scale aria-hidden="true" size={16} strokeWidth={1.9} />
        {selected ? 'Remove from compare' : 'Add to compare'}
      </button>
    )
  }

  return (
    <button
      className={`compare-button${selected ? ' is-compare' : ''}`}
      type="button"
      aria-pressed={selected}
      disabled={blocked}
      title={blocked ? `Compare list is full (${maxCompare} max). Remove one first.` : undefined}
      aria-label={`${selected ? 'Remove' : 'Add'} ${tool.name} ${selected ? 'from' : 'to'} compare`}
      onClick={() => toggleCompare(tool.id)}
    >
      <Scale aria-hidden="true" size={18} strokeWidth={1.8} />
    </button>
  )
}

export default CompareButton
