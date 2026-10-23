import { categories as defaultCategories } from '../data/categories.js'
import { tools as defaultTools } from '../data/tools.js'
import { PRICING_MODELS } from './validateTools.js'
import { searchTools, sortTools } from './catalog.js'

export const EXPLORE_PAGE_SIZE = 9
export const EXPLORE_QUERY_KEYS = ['q', 'category', 'pricing', 'useCase', 'sort', 'page']
export const EXPLORE_SORT_OPTIONS = [
  { value: 'featured', label: 'Featured first' },
  { value: 'name-asc', label: 'Alphabetical: A–Z' },
  { value: 'name-desc', label: 'Alphabetical: Z–A' },
  { value: 'newest', label: 'Newest first' },
]

const sortValues = new Set(EXPLORE_SORT_OPTIONS.map(({ value }) => value))

export function getUseCaseOptions(records = defaultTools) {
  const options = new Map()
  for (const tool of Array.isArray(records) ? records : []) {
    for (const value of Array.isArray(tool?.useCases) ? tool.useCases : []) {
      if (typeof value !== 'string' || !value.trim()) continue
      const label = value.trim()
      const key = label.toLocaleLowerCase()
      if (!options.has(key)) options.set(key, label)
    }
  }
  return [...options.values()].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
}

export function parseExploreFilters(params, records = defaultTools, categoryRecords = defaultCategories) {
  const searchParams = params instanceof URLSearchParams ? params : new URLSearchParams(params ?? '')
  const categoriesBySlug = new Map(categoryRecords.map(({ slug }) => [slug, slug]))
  const selectedCategories = new Set(searchParams.getAll('category').filter((slug) => categoriesBySlug.has(slug)))
  const useCases = getUseCaseOptions(records)
  const requestedUseCase = searchParams.get('useCase')?.trim().toLocaleLowerCase()
  const useCase = useCases.find((option) => option.toLocaleLowerCase() === requestedUseCase) ?? ''
  const pageValue = searchParams.get('page') ?? ''
  const page = /^\d+$/.test(pageValue) && Number(pageValue) > 0 ? Number(pageValue) : 1

  return {
    q: searchParams.get('q') ?? '',
    categories: categoryRecords.map(({ slug }) => slug).filter((slug) => selectedCategories.has(slug)),
    pricing: PRICING_MODELS.includes(searchParams.get('pricing')) ? searchParams.get('pricing') : '',
    useCase,
    sort: sortValues.has(searchParams.get('sort')) ? searchParams.get('sort') : 'featured',
    page: Number.isSafeInteger(page) ? page : 1,
  }
}

export function applyExploreFilters(records = defaultTools, filters = {}, categoryRecords = defaultCategories) {
  if (!Array.isArray(records)) return []
  const namesBySlug = new Map(categoryRecords.map(({ slug, name }) => [slug, name]))
  const categoryNames = (filters.categories ?? []).map((slug) => namesBySlug.get(slug)).filter(Boolean)

  const filtered = searchTools(filters.q ?? '', records).filter((tool) => {
    const matchesCategory = !categoryNames.length || categoryNames.some((name) => tool.categories?.includes(name))
    const matchesPricing = !PRICING_MODELS.includes(filters.pricing) || tool.pricingModel === filters.pricing
    const matchesUseCase = !filters.useCase || tool.useCases?.some(
      (value) => value.toLocaleLowerCase() === filters.useCase.toLocaleLowerCase(),
    )
    return matchesCategory && matchesPricing && matchesUseCase
  })

  if (filters.sort === 'name-asc') return sortTools(filtered, { by: 'name', direction: 'asc' })
  if (filters.sort === 'name-desc') return sortTools(filtered, { by: 'name', direction: 'desc' })
  if (filters.sort === 'newest') return sortTools(filtered, { by: 'dateAdded', direction: 'desc' })
  return sortTools(filtered, { by: 'featured', direction: 'desc' })
}

export function updateExploreSearchParams(currentParams, updates, { resetPage = true, toolRecords = defaultTools } = {}) {
  const next = new URLSearchParams(currentParams)
  const has = (key) => Object.hasOwn(updates, key)

  if (resetPage && !has('page')) next.delete('page')
  if (has('q')) {
    if (typeof updates.q === 'string' && updates.q.length) next.set('q', updates.q)
    else next.delete('q')
  }
  if (has('categories')) {
    next.delete('category')
    const selected = new Set(Array.isArray(updates.categories) ? updates.categories : [])
    for (const { slug } of defaultCategories) if (selected.has(slug)) next.append('category', slug)
  }
  if (has('pricing')) {
    if (PRICING_MODELS.includes(updates.pricing)) next.set('pricing', updates.pricing)
    else next.delete('pricing')
  }
  if (has('useCase')) {
    const option = getUseCaseOptions(toolRecords).find((value) => value.toLocaleLowerCase() === String(updates.useCase ?? '').trim().toLocaleLowerCase())
    if (option) next.set('useCase', option)
    else next.delete('useCase')
  }
  if (has('sort')) {
    if (sortValues.has(updates.sort) && updates.sort !== 'featured') next.set('sort', updates.sort)
    else next.delete('sort')
  }
  if (has('page')) {
    const page = Number(updates.page)
    if (Number.isSafeInteger(page) && page > 1) next.set('page', String(page))
    else next.delete('page')
  }
  return next
}

export function clearExploreSearchParams(currentParams) {
  const next = new URLSearchParams(currentParams)
  for (const key of EXPLORE_QUERY_KEYS) next.delete(key)
  return next
}
