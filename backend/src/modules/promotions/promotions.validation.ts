import { AppError } from '../../errors/app-error.js'
import { PromotionType } from '../../generated/prisma/enums.js'
import { parsePagination } from '../../utils/pagination.js'
import * as v from '../../utils/validation.js'
import type { DraftPromotion, PromotionInput, PromotionQuery, PromotionUpdate } from './promotions.types.js'

const createFields = ['name', 'marquee', 'type', 'value', 'active', 'startsAt', 'endsAt', 'targets'] as const
const updateFields = createFields

// A promotion targets at least one product or variant. Each target is exactly
// one of the two, never both, and may override the campaign-wide value.
function targets(body: v.Fields): PromotionInput['targets'] {
  if (!('targets' in body)) throw new AppError('targets must be provided', 400)
  const items = v.array(body.targets, 'targets', item => {
    const target = v.object(item, ['productId', 'variantId', 'value'])
    const productId = 'productId' in target && target.productId != null ? v.id(target.productId, 'targets.productId') : null
    const variantId = 'variantId' in target && target.variantId != null ? v.id(target.variantId, 'targets.variantId') : null
    if ((productId ? 1 : 0) + (variantId ? 1 : 0) !== 1) {
      throw new AppError('Each target must be exactly one product or variant', 400)
    }
    const value = 'value' in target && target.value != null ? v.integer(target.value, 'targets.value', 1) : null
    return { productId, variantId, value }
  })
  if (items.length === 0) throw new AppError('A promotion must target at least one product or variant', 400)
  const keys = items.map(target => `${target.productId ? 'product' : 'variant'}:${target.productId ?? target.variantId}`)
  if (new Set(keys).size !== keys.length) throw new AppError('targets must not contain duplicates', 400)
  return items
}
function value(body: v.Fields): number {
  return v.integer(body.value, 'value', 1)
}
export function parseCreate(input: unknown): PromotionInput {
  const body = v.object(input, createFields)
  return {
    name: v.text(body.name, 'name', 200),
    marquee: 'marquee' in body ? v.nullableText(body.marquee, 'marquee', 300) : null,
    type: v.enumeration(body.type, 'type', Object.values(PromotionType)),
    value: value(body),
    active: 'active' in body ? v.boolean(body.active, 'active') : true,
    startsAt: 'startsAt' in body ? (body.startsAt === null ? null : v.date(body.startsAt, 'startsAt')) : null,
    endsAt: 'endsAt' in body ? (body.endsAt === null ? null : v.date(body.endsAt, 'endsAt')) : null,
    targets: targets(body),
  }
}
export function parseUpdate(input: unknown): PromotionUpdate {
  const body = v.object(input, updateFields)
  v.nonempty(body)
  const result: PromotionUpdate = {}
  if ('name' in body) result.name = v.text(body.name, 'name', 200)
  if ('marquee' in body) result.marquee = v.nullableText(body.marquee, 'marquee', 300)
  if ('type' in body) result.type = v.enumeration(body.type, 'type', Object.values(PromotionType))
  if ('value' in body) result.value = value(body)
  if ('active' in body) result.active = v.boolean(body.active, 'active')
  if ('startsAt' in body) result.startsAt = body.startsAt === null ? null : v.date(body.startsAt, 'startsAt')
  if ('endsAt' in body) result.endsAt = body.endsAt === null ? null : v.date(body.endsAt, 'endsAt')
  if ('targets' in body) result.targets = targets(body)
  return result
}
export function parseDraft(input: unknown): DraftPromotion {
  const body = v.object(input, ['id', 'name', 'type', 'value', 'startsAt', 'targets'])
  const draft: DraftPromotion = {
    name: 'name' in body && body.name ? v.text(body.name, 'draft.name', 200) : 'Draft campaign',
    type: v.enumeration(body.type, 'draft.type', Object.values(PromotionType)),
    value: v.integer(body.value, 'draft.value', 1),
    startsAt: 'startsAt' in body ? (body.startsAt === null ? null : v.date(body.startsAt, 'draft.startsAt')) : null,
    targets: targets(body),
  }
  if ('id' in body && body.id != null) draft.id = v.id(body.id, 'draft.id')
  // Same bounds as a saved promotion, enforced at the trust boundary.
  const invalid = (value: number) => value > v.MAX_INT || (draft.type === 'PERCENTAGE' && value > 100)
  if (invalid(draft.value) || draft.targets.some(target => target.value != null && invalid(target.value))) {
    throw new AppError('Percentage value must be 1–100; fixed value is a positive amount in cents', 400)
  }
  return draft
}
export function parseQuery(input: unknown): PromotionQuery {
  const query = v.object(input, ['page', 'limit', 'q', 'search', 'active', 'state', 'productId', 'variantId', 'sortBy', 'sortOrder'])
  if (query.q !== undefined && query.search !== undefined) throw new AppError('Use q or search, not both', 400)
  return {
    ...parsePagination(query),
    q: v.queryText(query.q ?? query.search, 'q', 200),
    active: v.queryBoolean(query.active, 'active'),
    state: query.state === undefined ? undefined : v.enumeration(query.state, 'state', ['ACTIVE', 'INACTIVE', 'SCHEDULED', 'EXPIRED'] as const),
    productId: query.productId === undefined ? undefined : v.id(query.productId, 'productId'),
    variantId: query.variantId === undefined ? undefined : v.id(query.variantId, 'variantId'),
    sortBy: query.sortBy === undefined ? 'createdAt' : v.enumeration(query.sortBy, 'sortBy', ['createdAt', 'name', 'endsAt']),
    sortOrder: query.sortOrder === undefined ? 'desc' : v.enumeration(query.sortOrder, 'sortOrder', ['asc', 'desc']),
  }
}
