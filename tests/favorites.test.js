import assert from 'node:assert/strict'
import test from 'node:test'
import { tools } from '../src/data/tools.js'
import { getFavoriteTools, parseFavoriteIds, toggleFavoriteId } from '../src/utils/favorites.js'
import { findToolBySlug, getRelatedTools } from '../src/utils/catalog.js'

const validIds = new Set(tools.map(({ id }) => id))

function relatedFixture(overrides = {}) {
  return {
    id: 'current',
    name: 'Current tool',
    categories: ['Shared category'],
    useCases: ['Shared use case'],
    tags: ['shared tag'],
    ...overrides,
  }
}

test('favorite parser handles missing, malformed, non-array, and mixed localStorage values', () => {
  assert.deepEqual(parseFavoriteIds(null, validIds), [])
  assert.deepEqual(parseFavoriteIds('{broken', validIds), [])
  assert.deepEqual(parseFavoriteIds('{"id":"chatgpt"}', validIds), [])
  assert.deepEqual(parseFavoriteIds('["chatgpt",1,null,"unknown","chatgpt"]', validIds), ['chatgpt'])
})

test('favorite toggles are immutable, deduplicated, and reject unknown IDs', () => {
  const original = ['chatgpt']
  assert.deepEqual(toggleFavoriteId(original, 'claude', validIds), ['chatgpt', 'claude'])
  assert.deepEqual(toggleFavoriteId(original, 'chatgpt', validIds), [])
  assert.deepEqual(toggleFavoriteId(original, 'not-a-tool', validIds), original)
  assert.deepEqual(original, ['chatgpt'])
})

test('saved tool selection returns only current catalog records in catalog order', () => {
  const saved = getFavoriteTools(['claude', 'stale-id', 'chatgpt'], tools)
  assert.deepEqual(saved, [findToolBySlug('chatgpt'), findToolBySlug('claude')])
  assert.deepEqual(getFavoriteTools([], tools), [])
})

test('related tools rank shared categories, use cases, and tags and exclude the current tool', () => {
  const current = relatedFixture()
  const categoryMatch = relatedFixture({ id: 'category-match', categories: ['Shared category'], useCases: [], tags: [] })
  const useCaseMatch = relatedFixture({ id: 'use-case-match', categories: [], useCases: ['Shared use case'], tags: [] })
  const tagMatch = relatedFixture({ id: 'tag-match', categories: [], useCases: [], tags: ['shared tag'] })
  const unrelated = relatedFixture({ id: 'unrelated', categories: [], useCases: [], tags: [] })

  const related = getRelatedTools(current, [current, tagMatch, unrelated, useCaseMatch, categoryMatch], 3)
  assert.deepEqual(related.map(({ id }) => id), ['category-match', 'use-case-match', 'tag-match'])
  assert.ok(!related.some(({ id }) => id === current.id))
  assert.deepEqual(getRelatedTools(current, [current, unrelated]), [])
})

test('related tools resolve actual catalog records in deterministic score order', () => {
  const chatgpt = findToolBySlug('chatgpt')
  const related = getRelatedTools(chatgpt, tools, 4)
  assert.ok(related.length > 0)
  assert.ok(related.length <= 4)
  assert.ok(related.every((tool) => tool.id !== chatgpt.id))
  assert.equal(related[0].name, 'Claude')
  assert.deepEqual(getRelatedTools(chatgpt, tools, 0), [])
})
