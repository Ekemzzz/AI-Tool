import assert from 'node:assert/strict'
import test from 'node:test'
import { tools } from '../src/data/tools.js'
import { MAX_COMPARE, getCompareTools, parseCompareIds, toggleCompareId } from '../src/utils/compare.js'

const validIds = new Set(tools.map(({ id }) => id))

test('compare parser handles missing, malformed, non-array, and mixed localStorage values', () => {
  assert.deepEqual(parseCompareIds(null, validIds), [])
  assert.deepEqual(parseCompareIds('{broken', validIds), [])
  assert.deepEqual(parseCompareIds('{"id":"chatgpt"}', validIds), [])
  assert.deepEqual(parseCompareIds('["chatgpt",1,null,"unknown","chatgpt"]', validIds), ['chatgpt'])
})

test('compare parser caps stored lists at the compare limit', () => {
  const stored = JSON.stringify(['chatgpt', 'claude', 'gemini', 'perplexity', 'grok'])
  assert.deepEqual(parseCompareIds(stored, validIds), ['chatgpt', 'claude', 'gemini'])
})

test('compare toggles add, remove, deduplicate, reject unknown IDs, and respect the limit', () => {
  const original = ['chatgpt']
  assert.deepEqual(toggleCompareId(original, 'claude', validIds), ['chatgpt', 'claude'])
  assert.deepEqual(toggleCompareId(original, 'chatgpt', validIds), [])
  assert.deepEqual(toggleCompareId(original, 'not-a-tool', validIds), ['chatgpt'])

  const full = ['chatgpt', 'claude', 'gemini']
  assert.deepEqual(toggleCompareId(full, 'perplexity', validIds), full)
  assert.deepEqual(toggleCompareId(full, 'perplexity', validIds, 4), [...full, 'perplexity'])

  const duplicated = ['chatgpt', 'chatgpt']
  assert.deepEqual(toggleCompareId(duplicated, 'claude', validIds), ['chatgpt', 'claude'])
  assert.deepEqual(original, ['chatgpt'])
})

test('selected compare tools resolve to current catalog records in catalog order', () => {
  const selected = getCompareTools(['gemini', 'chatgpt', 'unknown-id'], tools)
  assert.deepEqual(selected.map((tool) => tool.id), ['chatgpt', 'gemini'])
  assert.deepEqual(getCompareTools([], tools), [])
  assert.deepEqual(getCompareTools(null, tools), [])
})

test('compare limit is exported and positive', () => {
  assert.equal(MAX_COMPARE, 3)
})
