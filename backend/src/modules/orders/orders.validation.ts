import { AppError } from '../../errors/app-error.js'
import { OrderStatus } from '../../generated/prisma/enums.js'
import { parsePagination } from '../../utils/pagination.js'
import * as v from '../../utils/validation.js'
import type { CreateOrderInput, OrderQuery, OrderStatusInput } from './orders.types.js'

export function parseQuery(input: unknown, admin = false): OrderQuery {
  const query = v.object(input, ['page', 'limit', 'q', 'search', 'status', ...(admin ? ['userId'] : []), 'from', 'to', 'sortBy', 'sortOrder'])
  if (query.q !== undefined && query.search !== undefined) throw new AppError('Use q or search, not both', 400)
  const result: OrderQuery = {
    ...parsePagination(query),
    q: v.queryText(query.q ?? query.search, 'q', 200),
    status: query.status === undefined ? undefined : v.enumeration(query.status, 'status', Object.values(OrderStatus)),
    userId: v.queryText(query.userId, 'userId', 191),
    from: query.from === undefined ? undefined : v.date(query.from, 'from'),
    to: query.to === undefined ? undefined : v.date(query.to, 'to'),
    sortBy: query.sortBy === undefined ? 'createdAt' : v.enumeration(query.sortBy, 'sortBy', ['createdAt', 'updatedAt', 'totalCents', 'orderNumber']),
    sortOrder: query.sortOrder === undefined ? 'desc' : v.enumeration(query.sortOrder, 'sortOrder', ['asc', 'desc']),
  }
  if (result.from && result.to && result.from > result.to) throw new AppError('from must not be after to', 400)
  return result
}
export function parseStatus(input: unknown): OrderStatusInput {
  const body = v.object(input, ['status', 'expectedStatus', 'note'])
  return {
    status: v.enumeration(body.status, 'status', Object.values(OrderStatus)),
    expectedStatus: body.expectedStatus === undefined ? undefined : v.enumeration(body.expectedStatus, 'expectedStatus', Object.values(OrderStatus)),
    note: body.note === undefined ? undefined : v.nullableText(body.note, 'note', 2000),
  }
}
export function parseHistoryQuery(input: unknown) {
  return parsePagination(v.object(input, ['page', 'limit']))
}
export function parseCreate(input: unknown): CreateOrderInput {
  const body = v.object(input, ['items', 'shippingName', 'shippingLine1', 'shippingLine2', 'shippingCity', 'shippingState', 'shippingPostal', 'shippingCountry', 'shippingPhone'])
  const items = v.array(body.items, 'items', (item, index) => {
    const line = v.object(item, ['variantId', 'quantity'])
    return { variantId: v.id(line.variantId, `items[${index}].variantId`), quantity: v.integer(line.quantity, `items[${index}].quantity`, 1) }
  }, 50)
  if (!items.length) throw new AppError('Order must contain at least one item', 400)
  if (new Set(items.map(item => item.variantId)).size !== items.length) throw new AppError('Order items must not repeat a variant', 400)
  return {
    items,
    shippingName: v.text(body.shippingName, 'shippingName', 120),
    shippingLine1: v.text(body.shippingLine1, 'shippingLine1', 200),
    shippingLine2: body.shippingLine2 === undefined ? undefined : v.nullableText(body.shippingLine2, 'shippingLine2', 200),
    shippingCity: v.text(body.shippingCity, 'shippingCity', 120),
    shippingState: body.shippingState === undefined ? undefined : v.nullableText(body.shippingState, 'shippingState', 120),
    shippingPostal: v.text(body.shippingPostal, 'shippingPostal', 40),
    shippingCountry: v.text(body.shippingCountry, 'shippingCountry', 60),
    shippingPhone: body.shippingPhone === undefined ? undefined : v.nullableText(body.shippingPhone, 'shippingPhone', 40),
  }
}
