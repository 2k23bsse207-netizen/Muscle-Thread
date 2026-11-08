import { AppError } from '../../errors/app-error.js'
import { CategoryStatus } from '../../generated/prisma/enums.js'
import { parsePagination } from '../../utils/pagination.js'
import * as v from '../../utils/validation.js'
import type { CategoryInput, CategoryQuery, CategorySort, CategoryUpdate } from './categories.types.js'

const fields = ['name', 'slug', 'description', 'imageUrl', 'bannerUrl', 'status', 'sortOrder', 'seoTitle', 'seoDescription'] as const
function parseFields(body: v.Fields): CategoryUpdate {
  const result: CategoryUpdate = {}
  if ('name' in body) result.name = v.text(body.name, 'name', 200)
  if ('slug' in body) result.slug = v.slug(body.slug)
  if ('description' in body) result.description = v.nullableText(body.description, 'description', 5000)
  if ('imageUrl' in body) result.imageUrl = body.imageUrl === null ? null : v.httpUrl(body.imageUrl, 'imageUrl')
  if ('bannerUrl' in body) result.bannerUrl = body.bannerUrl === null ? null : v.httpUrl(body.bannerUrl, 'bannerUrl')
  if ('status' in body) result.status = v.enumeration(body.status, 'status', Object.values(CategoryStatus))
  if ('sortOrder' in body) result.sortOrder = v.integer(body.sortOrder, 'sortOrder')
  if ('seoTitle' in body) result.seoTitle = v.nullableText(body.seoTitle, 'seoTitle', 200)
  if ('seoDescription' in body) result.seoDescription = v.nullableText(body.seoDescription, 'seoDescription', 500)
  return result
}
export function parseCreate(input: unknown): CategoryInput {
  const body = v.object(input, fields)
  return { ...parseFields(body), name: v.text(body.name, 'name', 200), slug: v.slug(body.slug) }
}
export function parseUpdate(input: unknown): CategoryUpdate {
  const body = v.object(input, fields)
  v.nonempty(body)
  return parseFields(body)
}
export function parseQuery(input: unknown): CategoryQuery {
  const query = v.object(input, ['page', 'limit', 'q', 'search', 'status', 'sortBy', 'sortOrder'])
  if (query.q !== undefined && query.search !== undefined) throw new AppError('Use q or search, not both', 400)
  return {
    ...parsePagination(query),
    q: v.queryText(query.q ?? query.search, 'q', 200),
    status: query.status === undefined ? undefined : v.enumeration(query.status, 'status', Object.values(CategoryStatus)),
    sortBy: query.sortBy === undefined ? 'sortOrder' : v.enumeration(query.sortBy, 'sortBy', ['sortOrder', 'name', 'createdAt', 'updatedAt']),
    sortOrder: query.sortOrder === undefined ? 'asc' : v.enumeration(query.sortOrder, 'sortOrder', ['asc', 'desc']),
  }
}
export function parseSort(input: unknown): CategorySort[] {
  const body = v.object(input, ['categories'])
  const categories = v.array(body.categories, 'categories', item => {
    const row = v.object(item, ['id', 'sortOrder'])
    return { id: v.id(row.id), sortOrder: v.integer(row.sortOrder, 'sortOrder') }
  }, 100)
  if (!categories.length || new Set(categories.map(row => row.id)).size !== categories.length) {
    throw new AppError('categories must contain 1–100 distinct category IDs', 400)
  }
  return categories
}
