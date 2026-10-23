import { categories as defaultCategories } from '../data/categories.js'

export const PRICING_MODELS = Object.freeze([
  'free',
  'freemium',
  'paid',
  'open-source',
  'contact-for-pricing',
  'unknown',
])

const requiredStringFields = ['id', 'name', 'slug', 'description']
const optionalArrayFields = ['useCases', 'tags', 'features']
const optionalUrlFields = ['logoUrl', 'sourceUrl', 'pricingUrl', 'pricingSourceUrl']
const optionalDateFields = ['dateAdded', 'lastVerifiedAt']

function addIssue(target, index, toolId, field, code, message) {
  target.push({ index, toolId: toolId ?? null, field, code, message })
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isHttpUrl(value) {
  if (typeof value !== 'string' || value.trim() === '') return false

  try {
    const parsed = new URL(value)
    return ['http:', 'https:'].includes(parsed.protocol) && Boolean(parsed.hostname)
  } catch {
    return false
  }
}

function isCalendarDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const parsed = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

function normalizeStringArray(value, field, index, toolId, warnings) {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) {
    addIssue(warnings, index, toolId, field, 'optional-array-defaulted', `${field} must be an array; it was replaced with an empty array.`)
    return []
  }

  const normalized = value.filter(isNonEmptyString).map((item) => item.trim())
  if (normalized.length !== value.length) {
    addIssue(warnings, index, toolId, field, 'optional-array-items-removed', `${field} contained non-string or empty values; those values were removed.`)
  }
  return normalized
}

function normalizeOptionalUrl(value, field, index, toolId, warnings) {
  if (value === undefined || value === null || value === '') return null
  if (isHttpUrl(value)) return value.trim()

  addIssue(warnings, index, toolId, field, 'optional-url-defaulted', `${field} is not a valid HTTP(S) URL; it was set to null.`)
  return null
}

function normalizeOptionalDate(value, field, index, toolId, warnings) {
  if (value === undefined || value === null || value === '') return null
  if (isCalendarDate(value)) return value

  addIssue(warnings, index, toolId, field, 'optional-date-defaulted', `${field} is not a valid YYYY-MM-DD date; it was set to null.`)
  return null
}

export function validateTools(records, categoryRecords = defaultCategories) {
  const sourceRecords = Array.isArray(records) ? records : []
  const knownCategories = new Set(
    Array.isArray(categoryRecords)
      ? categoryRecords.map((category) => category?.name).filter(isNonEmptyString)
      : [],
  )
  const tools = []
  const errors = []
  const warnings = []
  const seenIds = new Set()
  const seenSlugs = new Set()

  if (!Array.isArray(records)) {
    errors.push({ index: null, toolId: null, field: 'tools', code: 'invalid-dataset', message: 'The tool dataset must be an array.' })
  }

  sourceRecords.forEach((record, index) => {
    const recordErrors = []
    const recordWarnings = []
    const isRecord = Boolean(record) && typeof record === 'object' && !Array.isArray(record)
    const input = isRecord ? record : {}
    const toolId = isNonEmptyString(input.id) ? input.id.trim() : null

    if (!isRecord) {
      addIssue(recordErrors, index, null, 'record', 'invalid-record', 'Each tool entry must be an object.')
    }

    for (const field of requiredStringFields) {
      if (!isNonEmptyString(input[field])) {
        addIssue(recordErrors, index, toolId, field, 'required-string', `${field} is required and must be a non-empty string.`)
      }
    }

    if (isNonEmptyString(input.slug) && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug.trim())) {
      addIssue(recordErrors, index, toolId, 'slug', 'invalid-slug', 'slug must use lowercase letters, numbers, and single hyphens.')
    }

    if (!isHttpUrl(input.websiteUrl)) {
      addIssue(recordErrors, index, toolId, 'websiteUrl', 'invalid-website-url', 'websiteUrl must be a valid HTTP or HTTPS URL.')
    }

    if (!PRICING_MODELS.includes(input.pricingModel)) {
      addIssue(recordErrors, index, toolId, 'pricingModel', 'invalid-pricing-model', `pricingModel must be one of: ${PRICING_MODELS.join(', ')}.`)
    }

    if (!Array.isArray(input.categories) || input.categories.length === 0) {
      addIssue(recordErrors, index, toolId, 'categories', 'invalid-categories', 'categories must be a non-empty array of known category names.')
    } else {
      const invalidCategories = input.categories.filter((category) => !isNonEmptyString(category) || !knownCategories.has(category.trim()))
      if (invalidCategories.length > 0) {
        addIssue(recordErrors, index, toolId, 'categories', 'unknown-category', `categories contains unknown values: ${invalidCategories.map(String).join(', ')}.`)
      }
    }

    const candidateSlug = isNonEmptyString(input.slug) ? input.slug.trim() : null
    if (toolId && seenIds.has(toolId)) {
      addIssue(recordErrors, index, toolId, 'id', 'duplicate-id', 'id must be unique; the earlier valid record is retained.')
    }
    if (candidateSlug && seenSlugs.has(candidateSlug)) {
      addIssue(recordErrors, index, toolId, 'slug', 'duplicate-slug', 'slug must be unique; the earlier valid record is retained.')
    }

    if (recordErrors.length > 0) {
      errors.push(...recordErrors)
      warnings.push(...recordWarnings)
      return
    }

    const normalized = {
      id: input.id.trim(),
      name: input.name.trim(),
      slug: input.slug.trim(),
      description: input.description.trim(),
      logoUrl: normalizeOptionalUrl(input.logoUrl, 'logoUrl', index, toolId, recordWarnings),
      websiteUrl: input.websiteUrl.trim(),
      pricingModel: input.pricingModel,
      categories: input.categories.map((category) => category.trim()),
      useCases: normalizeStringArray(input.useCases, 'useCases', index, toolId, recordWarnings),
      tags: normalizeStringArray(input.tags, 'tags', index, toolId, recordWarnings),
      features: normalizeStringArray(input.features, 'features', index, toolId, recordWarnings),
      featured: typeof input.featured === 'boolean' ? input.featured : false,
      dateAdded: normalizeOptionalDate(input.dateAdded, 'dateAdded', index, toolId, recordWarnings),
      lastVerifiedAt: normalizeOptionalDate(input.lastVerifiedAt, 'lastVerifiedAt', index, toolId, recordWarnings),
      sourceUrl: normalizeOptionalUrl(input.sourceUrl, 'sourceUrl', index, toolId, recordWarnings),
      pricingUrl: normalizeOptionalUrl(input.pricingUrl, 'pricingUrl', index, toolId, recordWarnings),
      pricingSourceUrl: normalizeOptionalUrl(input.pricingSourceUrl, 'pricingSourceUrl', index, toolId, recordWarnings),
    }

    if (typeof input.featured !== 'boolean') {
      addIssue(recordWarnings, index, toolId, 'featured', 'optional-boolean-defaulted', 'featured was missing or invalid; it was set to false.')
    }

    for (const field of optionalArrayFields) {
      if (input[field] === undefined || input[field] === null) {
        addIssue(recordWarnings, index, toolId, field, 'optional-array-defaulted', `${field} was missing and defaulted to an empty array.`)
      }
    }
    for (const field of optionalUrlFields) {
      if (input[field] === undefined) {
        addIssue(recordWarnings, index, toolId, field, 'optional-url-defaulted', `${field} was missing and defaulted to null.`)
      }
    }
    for (const field of optionalDateFields) {
      if (input[field] === undefined) {
        addIssue(recordWarnings, index, toolId, field, 'optional-date-defaulted', `${field} was missing and defaulted to null.`)
      }
    }

    seenIds.add(normalized.id)
    seenSlugs.add(normalized.slug)
    tools.push(normalized)
    warnings.push(...recordWarnings)
  })

  return { tools, errors, warnings }
}
