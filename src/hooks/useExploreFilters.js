import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { tools as defaultTools } from '../data/tools.js'
import { clearExploreSearchParams, parseExploreFilters, updateExploreSearchParams } from '../utils/exploreFilters.js'

function useExploreFilters({ toolRecords = defaultTools } = {}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => parseExploreFilters(searchParams, toolRecords), [searchParams, toolRecords])

  const update = useCallback((values, { replace = false, resetPage = true } = {}) => {
    setSearchParams(
      (current) => updateExploreSearchParams(current, values, { resetPage, toolRecords }),
      { replace },
    )
  }, [setSearchParams, toolRecords])

  const setQuery = useCallback((q) => update({ q }, { replace: true }), [update])
  const setCategories = useCallback((categories) => update({ categories }), [update])
  const setPricing = useCallback((pricing) => update({ pricing }), [update])
  const setUseCase = useCallback((useCase) => update({ useCase }), [update])
  const setSort = useCallback((sort) => update({ sort }), [update])
  const setPage = useCallback((page, navigation = {}) => update({ page }, { ...navigation, resetPage: false }), [update])
  const clearAll = useCallback(() => {
    setSearchParams((current) => clearExploreSearchParams(current))
  }, [setSearchParams])

  return { filters, setQuery, setCategories, setPricing, setUseCase, setSort, setPage, clearAll }
}

export default useExploreFilters
