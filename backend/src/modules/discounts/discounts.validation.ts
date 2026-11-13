import { AppError } from '../../errors/app-error.js'
import { DiscountType } from '../../generated/prisma/enums.js'
import { parsePagination } from '../../utils/pagination.js'
import * as v from '../../utils/validation.js'
import type { DiscountInput, DiscountQuery, DiscountUpdate, DiscountValidationInput } from './discounts.types.js'

const fields = ['code', 'type', 'value', 'active', 'startsAt', 'endsAt', 'usageLimit'] as const
export function code(input: unknown): string {
  const result = v.text(input, 'code', 50)
  // Validate ASCII before normalization so Unicode case expansion cannot bypass
  // the length bound or produce a code rejected by subsequent validation.
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(result)) throw new AppError('code must use ASCII letters, numbers, hyphens or underscores', 400)
  return result.toUpperCase()
}
function parseFields(body: v.Fields): DiscountUpdate {
  const result: DiscountUpdate = {}
  if ('code' in body) result.code = code(body.code)
  if ('type' in body) result.type = v.enumeration(body.type, 'type', Object.values(DiscountType))
  if ('value' in body) result.value = v.integer(body.value, 'value', 1)
  if ('active' in body) result.active = v.boolean(body.active, 'active')
  if ('startsAt' in body) result.startsAt = body.startsAt === null ? null : v.date(body.startsAt, 'startsAt')
  if ('endsAt' in body) result.endsAt = body.endsAt === null ? null : v.date(body.endsAt, 'endsAt')
  if ('usageLimit' in body) result.usageLimit = body.usageLimit === null ? null : v.integer(body.usageLimit, 'usageLimit', 1)
  return result
}
export function parseCreate(input: unknown): DiscountInput {
  const body = v.object(input, fields)
  return { ...parseFields(body), code: code(body.code), type: v.enumeration(body.type, 'type', Object.values(DiscountType)), value: v.integer(body.value, 'value', 1) }
}
export function parseUpdate(input: unknown): DiscountUpdate {
  const body = v.object(input, fields)
  v.nonempty(body)
  return parseFields(body)
}
export function parseValidation(input: unknown): DiscountValidationInput {
  const body = v.object(input, ['code', 'subtotalCents'])
  return { code: code(body.code), subtotalCents: v.integer(body.subtotalCents, 'subtotalCents', 1) }
}
export function parseQuery(input: unknown): DiscountQuery {
  const query = v.object(input, ['page', 'limit', 'q', 'search', 'active', 'state', 'sortBy', 'sortOrder'])
  if (query.q !== undefined && query.search !== undefined) throw new AppError('Use q or search, not both', 400)
  return {
    ...parsePagination(query),
    q: v.queryText(query.q ?? query.search, 'q', 50),
    active: v.queryBoolean(query.active, 'active'),
    state: query.state === undefined ? undefined : v.enumeration(query.state, 'state', ['AVAILABLE', 'INACTIVE', 'SCHEDULED', 'EXPIRED', 'EXHAUSTED'] as const),
    sortBy: query.sortBy === undefined ? 'createdAt' : v.enumeration(query.sortBy, 'sortBy', ['createdAt', 'code', 'endsAt', 'usedCount']),
    sortOrder: query.sortOrder === undefined ? 'desc' : v.enumeration(query.sortOrder, 'sortOrder', ['asc', 'desc']),
  }
}
