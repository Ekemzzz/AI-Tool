import { categories } from '../data/categories.js'
import { tools as defaultTools } from '../data/tools.js'

const categoriesByName = new Map(categories.map((category) => [category.name, category]))
const categoriesById = new Map(categories.map((category) => [category.id, category]))

function safeArray(value) {
  return Array.isArray(value) ? value : []
}

function categoryNameFor(value) {
  if (typeof value !== 'string') return null
  return categoriesByName.get(value)?.name ?? categoriesById.get(value)?.name ?? null
}

export function findToolBySlug(slug, tools = defaultTools) {
  if (typeof slug !== 'string' || !Array.isArray(tools)) return undefined
  return tools.find((tool) => tool?.slug === slug)
}

export function findToolsByCategory(category, tools = defaultTools) {
  const name = categoryNameFor(category)
  if (!name || !Array.isArray(tools)) return []
  return tools.filter((tool) => safeArray(tool?.categories).includes(name))
}

export function getToolCategories(tool) {
  return safeArray(tool?.categories)
    .map((name) => categoriesByName.get(name))
    .filter(Boolean)
}

function normalizedValues(values) {
  return new Set(safeArray(values)
    .filter((value) => typeof value === 'string' && value.trim())
    .map((value) => value.trim().toLocaleLowerCase()))
}

export function getRelatedTools(currentTool, tools = defaultTools, limit = 4) {
  if (!currentTool || !Array.isArray(tools) || !Number.isFinite(limit) || limit <= 0) return []

  const currentCategories = normalizedValues(currentTool.categories)
  const currentUseCases = normalizedValues(currentTool.useCases)
  const currentTags = normalizedValues(currentTool.tags)

  return tools
    .map((tool, index) => {
      if (!tool || tool.id === currentTool.id) return { tool, index, score: 0 }
      const categoryScore = safeArray(tool.categories).filter((value) => currentCategories.has(String(value).trim().toLocaleLowerCase())).length * 3
      const useCaseScore = safeArray(tool.useCases).filter((value) => currentUseCases.has(String(value).trim().toLocaleLowerCase())).length * 2
      const tagScore = safeArray(tool.tags).filter((value) => currentTags.has(String(value).trim().toLocaleLowerCase())).length
      return { tool, index, score: categoryScore + useCaseScore + tagScore }
    })
    .filter(({ tool, score }) => tool && tool.id !== currentTool.id && score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, Math.floor(limit))
    .map(({ tool }) => tool)
}

export function searchTools(query, tools = defaultTools) {
  if (!Array.isArray(tools)) return []
  const normalizedQuery = typeof query === 'string' ? query.trim().toLocaleLowerCase() : ''
  if (!normalizedQuery) return tools.filter(Boolean)

  return tools.filter((tool) => {
    if (!tool || typeof tool !== 'object') return false
    const searchableText = [
      tool.name,
      tool.description,
      ...safeArray(tool.categories),
      ...safeArray(tool.useCases),
      ...safeArray(tool.tags),
      ...safeArray(tool.features),
      tool.pricingModel,
    ]
      .filter((value) => typeof value === 'string')
      .join(' ')
      .toLocaleLowerCase()

    return searchableText.includes(normalizedQuery)
  })
}

export function filterToolsByPricingModel(tools, pricingModel) {
  if (!Array.isArray(tools)) return []
  if (!pricingModel) return tools.filter(Boolean)
  return tools.filter((tool) => tool?.pricingModel === pricingModel)
}

export function sortTools(tools, { by = 'name', direction = 'asc' } = {}) {
  if (!Array.isArray(tools)) return []
  const multiplier = direction === 'desc' ? -1 : 1
  const allowedFields = new Set(['name', 'dateAdded', 'lastVerifiedAt', 'featured'])
  const field = allowedFields.has(by) ? by : 'name'

  return tools
    .map((tool, index) => ({ tool, index }))
    .filter(({ tool }) => tool && typeof tool === 'object')
    .sort((left, right) => {
      const leftValue = left.tool[field]
      const rightValue = right.tool[field]
      const leftMissing = leftValue === null || leftValue === undefined || leftValue === ''
      const rightMissing = rightValue === null || rightValue === undefined || rightValue === ''

      if (leftMissing !== rightMissing) return leftMissing ? 1 : -1
      if (leftMissing) return left.index - right.index

      if (field === 'featured') {
        const featuredComparison = Number(Boolean(leftValue)) - Number(Boolean(rightValue))
        return featuredComparison === 0 ? left.index - right.index : featuredComparison * multiplier
      }

      const comparison = String(leftValue).localeCompare(String(rightValue), undefined, {
        sensitivity: field === 'name' ? 'base' : 'variant',
      })
      return comparison === 0 ? left.index - right.index : comparison * multiplier
    })
    .map(({ tool }) => tool)
}

export function getCategoryCounts(tools = defaultTools, categoryRecords = categories) {
  const records = Array.isArray(categoryRecords) ? categoryRecords : []
  const counts = Object.fromEntries(records.filter(Boolean).map(({ id }) => [id, 0]))
  const idByName = new Map(records.filter(Boolean).map(({ id, name }) => [name, id]))

  for (const tool of Array.isArray(tools) ? tools : []) {
    for (const name of safeArray(tool?.categories)) {
      const id = idByName.get(name)
      if (id && Object.hasOwn(counts, id)) counts[id] += 1
    }
  }

  return counts
}

export function getSearchRoute(query) {
  const normalizedQuery = typeof query === 'string' ? query.trim() : ''
  if (!normalizedQuery) return '/tools'

  const params = new URLSearchParams({ q: normalizedQuery })
  return `/tools?${params.toString()}`
}
