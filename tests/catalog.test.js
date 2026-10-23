import assert from 'node:assert/strict'
import test from 'node:test'
import { categories } from '../src/data/categories.js'
import { rawTools, validationReport, tools } from '../src/data/tools.js'
import {
  filterToolsByPricingModel,
  findToolBySlug,
  findToolsByCategory,
  getCategoryCounts,
  searchTools,
  sortTools,
} from '../src/utils/catalog.js'
import { PRICING_MODELS, validateTools } from '../src/utils/validateTools.js'
import { getToolGridState } from '../src/utils/toolGrid.js'

function fixture(overrides = {}) {
  return {
    id: 'fixture-tool',
    name: 'Fixture Tool',
    slug: 'fixture-tool',
    description: 'A tool used by unit tests.',
    logoUrl: null,
    websiteUrl: 'https://example.com/',
    pricingModel: 'unknown',
    categories: ['AI Writing and Content'],
    useCases: ['Writing'],
    tags: ['fixture'],
    features: [],
    featured: false,
    dateAdded: null,
    lastVerifiedAt: '2026-10-15',
    sourceUrl: 'https://example.com/about',
    pricingUrl: null,
    pricingSourceUrl: null,
    ...overrides,
  }
}

test('source-backed catalog has at least 30 valid records and no validation errors', () => {
  assert.ok(rawTools.length >= 30)
  assert.equal(validationReport.errors.length, 0)
  assert.equal(tools.length, rawTools.length)
  assert.equal(new Set(tools.map((tool) => tool.id)).size, tools.length)
  assert.equal(new Set(tools.map((tool) => tool.slug)).size, tools.length)
  assert.ok(tools.every((tool) => tool.websiteUrl.startsWith('https://')))
})

test('tool grid state handles loading, empty, and populated arrays', () => {
  assert.equal(getToolGridState([], false), 'empty')
  assert.equal(getToolGridState(undefined, false), 'empty')
  assert.equal(getToolGridState([], true), 'loading')
  assert.equal(getToolGridState([fixture()], false), 'ready')
})

test('duplicate IDs and slugs are reported and the earlier record is retained', () => {
  const report = validateTools([
    fixture(),
    fixture({ id: 'another-id', slug: 'fixture-tool' }),
    fixture({ id: 'fixture-tool', slug: 'another-slug' }),
  ], categories)

  assert.equal(report.tools.length, 1)
  assert.ok(report.errors.some((issue) => issue.code === 'duplicate-id'))
  assert.ok(report.errors.some((issue) => issue.code === 'duplicate-slug'))
})

test('invalid website links and missing required fields reject only the invalid record', () => {
  const report = validateTools([
    fixture({ id: 'invalid-link', slug: 'invalid-link', websiteUrl: 'javascript:alert(1)' }),
    fixture({ id: 'missing-name', slug: 'missing-name', name: '' }),
    fixture({ id: 'valid-neighbor', slug: 'valid-neighbor' }),
  ], categories)

  assert.deepEqual(report.tools.map((tool) => tool.id), ['valid-neighbor'])
  assert.ok(report.errors.some((issue) => issue.field === 'websiteUrl'))
  assert.ok(report.errors.some((issue) => issue.field === 'name'))
})

test('all six supported pricing models are accepted', () => {
  const report = validateTools(
    PRICING_MODELS.map((pricingModel) => fixture({
      id: `model-${pricingModel}`,
      slug: `model-${pricingModel}`,
      pricingModel,
    })),
    categories,
  )

  assert.deepEqual(report.errors, [])
  assert.equal(report.tools.length, 6)
})

test('unsupported pricing model and unknown category are rejected', () => {
  const report = validateTools([
    fixture({ id: 'bad-pricing', slug: 'bad-pricing', pricingModel: 'maybe-free' }),
    fixture({ id: 'bad-category', slug: 'bad-category', categories: ['Invented category'] }),
  ], categories)

  assert.equal(report.tools.length, 0)
  assert.ok(report.errors.some((issue) => issue.code === 'invalid-pricing-model'))
  assert.ok(report.errors.some((issue) => issue.code === 'unknown-category'))
})

test('malformed optional fields are defaulted and reported without discarding the record', () => {
  const report = validateTools([
    fixture({ logoUrl: 'not a URL', features: 'should be an array', lastVerifiedAt: '2026-02-30' }),
    fixture({ id: 'missing-optional', slug: 'missing-optional', tags: undefined, dateAdded: undefined }),
  ], categories)

  assert.equal(report.tools.length, 2)
  assert.equal(report.tools[0].logoUrl, null)
  assert.deepEqual(report.tools[0].features, [])
  assert.equal(report.tools[0].lastVerifiedAt, null)
  assert.deepEqual(report.tools[1].tags, [])
  assert.ok(report.warnings.length >= 5)
})

test('missing logo and unknown pricing use safe defaults', () => {
  const report = validateTools([
    fixture({ logoUrl: undefined, pricingModel: 'unknown', pricingUrl: undefined }),
  ], categories)

  assert.equal(report.tools.length, 1)
  assert.equal(report.tools[0].logoUrl, null)
  assert.equal(report.tools[0].pricingModel, 'unknown')
  assert.equal(report.tools[0].pricingUrl, null)
})

test('catalog lookups, metadata search, pricing filter, sorting, and category counts work', () => {
  assert.equal(findToolBySlug('chatgpt')?.name, 'ChatGPT')
  assert.equal(findToolBySlug('no-such-tool'), undefined)
  assert.ok(findToolsByCategory('AI Coding and Development').some((tool) => tool.name === 'GitHub Copilot'))
  assert.ok(searchTools('writing', tools).some((tool) => tool.name === 'Grammarly'))
  assert.ok(searchTools('citations', tools).some((tool) => tool.name === 'Perplexity'))
  assert.ok(searchTools('open-source', tools).some((tool) => tool.name === 'Ollama'))
  assert.ok(filterToolsByPricingModel(tools, 'unknown').some((tool) => tool.name === 'Eightfold AI'))
  assert.deepEqual(sortTools([{ name: 'B', slug: 'b' }, { name: 'A', slug: 'a' }]).map((tool) => tool.name), ['A', 'B'])
  assert.ok(sortTools([{ name: 'No date', slug: 'a', dateAdded: null }, { name: 'Dated', slug: 'b', dateAdded: '2026-01-01' }], { by: 'dateAdded' })[1].dateAdded === null)
  assert.equal(getCategoryCounts([], categories)['ai-human-resources'], 0)
  assert.equal(getCategoryCounts(tools, [...categories, { id: 'unlisted', name: 'Unlisted' }]).unlisted, 0)
  assert.equal(
    getCategoryCounts(tools, categories)['ai-coding'],
    findToolsByCategory('AI Coding and Development').length,
  )
})

