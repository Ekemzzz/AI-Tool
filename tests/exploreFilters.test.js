import assert from 'node:assert/strict'
import test from 'node:test'
import { tools } from '../src/data/tools.js'
import { sortTools } from '../src/utils/catalog.js'
import {
  EXPLORE_PAGE_SIZE,
  applyExploreFilters,
  clearExploreSearchParams,
  getUseCaseOptions,
  parseExploreFilters,
  updateExploreSearchParams,
} from '../src/utils/exploreFilters.js'

function filter(overrides = {}) {
  return { q: '', categories: [], pricing: '', useCase: '', sort: 'featured', page: 1, ...overrides }
}

function names(records) {
  return records.map(({ name }) => name)
}

test('search alone matches case-insensitive metadata and trims surrounding spaces', () => {
  const results = applyExploreFilters(tools, filter({ q: '  gRaMmArLy  ' }))
  assert.deepEqual(names(results), ['Grammarly'])
  assert.ok(applyExploreFilters(tools, filter({ q: 'writing' })).some((tool) => tool.name === 'Grammarly'))
})

test('category-only filters accept category slugs and multi-select categories use OR', () => {
  const writing = applyExploreFilters(tools, filter({ categories: ['ai-writing'] }))
  assert.ok(writing.length > 0)
  assert.ok(writing.every((tool) => tool.categories.includes('AI Writing and Content')))

  const writingOrCoding = applyExploreFilters(tools, filter({ categories: ['ai-writing', 'ai-coding'] }))
  assert.ok(writingOrCoding.length > writing.length)
  assert.ok(writingOrCoding.some((tool) => tool.categories.includes('AI Coding and Development')))
})

test('pricing-only filter returns only the selected supported pricing model', () => {
  const results = applyExploreFilters(tools, filter({ pricing: 'paid' }))
  assert.ok(results.length > 0)
  assert.ok(results.every((tool) => tool.pricingModel === 'paid'))
})

test('search plus category uses AND between groups', () => {
  const results = applyExploreFilters(tools, filter({ q: 'grammarly', categories: ['ai-writing'] }))
  assert.deepEqual(names(results), ['Grammarly'])
  assert.deepEqual(applyExploreFilters(tools, filter({ q: 'grammarly', categories: ['ai-coding'] })), [])
})

test('category plus pricing uses AND between groups', () => {
  const results = applyExploreFilters(tools, filter({ categories: ['ai-writing'], pricing: 'paid' }))
  assert.ok(results.length > 0)
  assert.ok(results.every((tool) => tool.categories.includes('AI Writing and Content') && tool.pricingModel === 'paid'))
})

test('search, category, and pricing combine together', () => {
  assert.deepEqual(
    names(applyExploreFilters(tools, filter({ q: 'jasper', categories: ['ai-writing'], pricing: 'paid' }))),
    ['Jasper'],
  )
  assert.deepEqual(applyExploreFilters(tools, filter({ q: 'jasper', categories: ['ai-writing'], pricing: 'freemium' })), [])
})

test('use case combines with the other filter groups and no-match queries stay empty', () => {
  const results = applyExploreFilters(tools, filter({ categories: ['ai-writing'], pricing: 'freemium', useCase: 'Draft text' }))
  assert.ok(results.length > 0)
  assert.ok(results.every((tool) => tool.categories.includes('AI Writing and Content') && tool.pricingModel === 'freemium'))
  assert.deepEqual(applyExploreFilters(tools, filter({ q: 'no matching product exists' })), [])
  assert.ok(getUseCaseOptions(tools).includes('Draft text'))
})

test('query params restore filters and ignore invalid values safely', () => {
  const direct = parseExploreFilters(new URLSearchParams('q=writing&category=ai-writing&category=ai-coding&pricing=freemium&useCase=Draft+text&sort=name-asc&page=2'))
  assert.deepEqual(direct, {
    q: 'writing',
    categories: ['ai-writing', 'ai-coding'],
    pricing: 'freemium',
    useCase: 'Draft text',
    sort: 'name-asc',
    page: 2,
  })

  const invalid = parseExploreFilters(new URLSearchParams('category=not-real&pricing=not-a-model&useCase=not-a-use-case&sort=popular&page=0'))
  assert.deepEqual(invalid, { q: '', categories: [], pricing: '', useCase: '', sort: 'featured', page: 1 })
})

test('one filter can be cleared independently and clear-all preserves unrelated params', () => {
  const current = new URLSearchParams('q=writing&category=ai-writing&category=ai-coding&pricing=freemium&useCase=Draft+text&sort=name-asc&page=3&campaign=summer')
  const afterPricingClear = updateExploreSearchParams(current, { pricing: '' })
  assert.equal(afterPricingClear.get('pricing'), null)
  assert.equal(afterPricingClear.get('q'), 'writing')
  assert.deepEqual(afterPricingClear.getAll('category'), ['ai-writing', 'ai-coding'])
  assert.equal(afterPricingClear.get('useCase'), 'Draft text')
  assert.equal(afterPricingClear.get('sort'), 'name-asc')
  assert.equal(afterPricingClear.get('page'), null)

  const afterAll = clearExploreSearchParams(current)
  assert.deepEqual([...afterAll.entries()], [['campaign', 'summer']])
})

test('sort modes delegate to sortTools, newest orders by dateAdded, and paging does not mutate', () => {
  const originalOrder = tools.map((tool) => tool.id)
  const featuredFirst = applyExploreFilters(tools, filter({ sort: 'featured' }))
  assert.equal(featuredFirst[0].featured, true)
  assert.deepEqual(names(applyExploreFilters(tools, filter({ sort: 'name-asc' }))), names(sortTools(tools, { by: 'name', direction: 'asc' })))
  assert.deepEqual(names(applyExploreFilters(tools, filter({ sort: 'name-desc' })),), names(sortTools(tools, { by: 'name', direction: 'desc' })))
  assert.ok(tools.every((tool) => /^\d{4}-\d{2}-\d{2}$/.test(tool.dateAdded)), 'every tool has a dateAdded')
  assert.deepEqual(names(applyExploreFilters(tools, filter({ sort: 'newest' }))), names(sortTools(tools, { by: 'dateAdded', direction: 'desc' })))
  assert.deepEqual(tools.map((tool) => tool.id), originalOrder)
  assert.ok(tools.length > EXPLORE_PAGE_SIZE)
  assert.equal(applyExploreFilters(tools).slice(0, EXPLORE_PAGE_SIZE).length, EXPLORE_PAGE_SIZE)
})

test('filter updates preserve unrelated query params and normalize invalid controls', () => {
  const current = new URLSearchParams('campaign=summer&pricing=paid&sort=name-desc')
  const next = updateExploreSearchParams(current, { pricing: 'not-a-model', sort: 'popular', categories: ['not-a-category'], useCase: 'invalid' })
  assert.equal(next.get('campaign'), 'summer')
  assert.equal(next.get('pricing'), null)
  assert.equal(next.get('sort'), null)
  assert.deepEqual(next.getAll('category'), [])
  assert.equal(next.get('useCase'), null)
})
