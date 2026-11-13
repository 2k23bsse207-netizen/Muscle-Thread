import { AppError } from '../../errors/app-error.js'
import { InventoryMovementType } from '../../generated/prisma/enums.js'
import { parsePagination } from '../../utils/pagination.js'
import * as v from '../../utils/validation.js'
import type { InventoryQuery, InventoryUpdate, StockAdjustment } from './inventory.types.js'

export function parseQuery(input: unknown): InventoryQuery {
  const query = v.object(input, ['page', 'limit', 'q', 'search', 'productId', 'categoryId', 'lowStock', 'outOfStock', 'sortBy', 'sortOrder'])
  if (query.q !== undefined && query.search !== undefined) throw new AppError('Use q or search, not both', 400)
  return {
    ...parsePagination(query),
    q: v.queryText(query.q ?? query.search, 'q', 200),
    productId: v.queryText(query.productId, 'productId', 191),
    categoryId: v.queryText(query.categoryId, 'categoryId', 191),
    lowStock: v.queryBoolean(query.lowStock, 'lowStock'),
    outOfStock: v.queryBoolean(query.outOfStock, 'outOfStock'),
    sortBy: query.sortBy === undefined ? 'stock' : v.enumeration(query.sortBy, 'sortBy', ['stock', 'sku', 'updatedAt']),
    sortOrder: query.sortOrder === undefined ? 'asc' : v.enumeration(query.sortOrder, 'sortOrder', ['asc', 'desc']),
  }
}
export function parseAdjustment(input: unknown): StockAdjustment {
  const body = v.object(input, ['delta', 'stock', 'expectedStock', 'type', 'reason'])
  if (('delta' in body) === ('stock' in body)) throw new AppError('Provide exactly one of delta or stock', 400)
  const result: StockAdjustment = {
    reason: v.text(body.reason, 'reason', 1000),
    type: body.type === undefined ? 'ADJUSTMENT' : v.enumeration(body.type, 'type', Object.values(InventoryMovementType)),
  }
  // Compatibility safety gate: the old drawer automatically invents this delta
  // from a stale draft even for image-only saves. Inventory must be an explicit
  // operation with its own count/reason, never a side effect of a product save.
  if (result.reason === 'Stock edited from the admin product form') {
    throw new AppError('Automatic stock changes from product saves are disabled; use an explicit inventory adjustment', 409)
  }
  if ('expectedStock' in body) result.expectedStock = v.integer(body.expectedStock, 'expectedStock')
  if ('delta' in body) {
    result.delta = v.integer(body.delta, 'delta', -v.MAX_INT, v.MAX_INT)
    if (result.delta === 0) throw new AppError('delta must not be zero', 400)
  }
  if ('stock' in body) {
    result.stock = v.integer(body.stock, 'stock')
    if (result.expectedStock === undefined) throw new AppError('Absolute stock updates require expectedStock', 400)
  }
  if (result.type === 'RECEIPT' && result.delta !== undefined && result.delta < 0) throw new AppError('A receipt must add stock', 400)
  return result
}
export function parseUpdate(input: unknown): InventoryUpdate {
  const body = v.object(input, ['lowStockThreshold'])
  return { lowStockThreshold: v.integer(body.lowStockThreshold, 'lowStockThreshold') }
}
export function parseHistoryQuery(input: unknown) {
  return parsePagination(v.object(input, ['page', 'limit']))
}
