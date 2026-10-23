import { useState } from 'react'
import { Search } from 'lucide-react'
import { useNavigate } from 'react-router'
import { getSearchRoute } from '../../utils/catalog.js'

function SearchBar({
  initialQuery = '',
  inputId = 'tool-search',
  value,
  onQueryChange,
  hideSubmit = false,
  searchLabel = 'Search the sample catalog',
}) {
  const [query, setQuery] = useState(initialQuery)
  const navigate = useNavigate()
  const isControlled = typeof onQueryChange === 'function'
  const currentQuery = isControlled ? value ?? '' : query

  function handleSubmit(event) {
    event.preventDefault()
    if (!isControlled) navigate(getSearchRoute(query))
  }

  function handleChange(event) {
    if (isControlled) onQueryChange(event.target.value)
    else setQuery(event.target.value)
  }

  return (
    <form className="search-form" role="search" onSubmit={handleSubmit}>
      <label className="search-form__label" htmlFor={inputId}>
        {searchLabel}
      </label>
      <div className="search-form__controls">
        <div className="search-form__input-wrap">
          <Search aria-hidden="true" className="search-form__icon" size={20} strokeWidth={1.8} />
          <input
            id={inputId}
            className="search-form__input"
            type="search"
            value={currentQuery}
            onChange={handleChange}
            placeholder="Try writing, coding, or data analysis"
          />
        </div>
        {!hideSubmit && (
          <button className="button button--primary search-form__submit" type="submit">
            Search tools
          </button>
        )}
      </div>
    </form>
  )
}

export default SearchBar
