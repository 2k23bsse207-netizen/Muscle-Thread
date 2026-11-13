// Request validation schemas for the cart module.
import { AppError } from '../../errors/app-error.js'
import * as v from '../../utils/validation.js'
import { parseDraft } from '../promotions/promotions.validation.js'
import type { QuoteInput } from './cart.types.js'

export function parseQuote(input: unknown): QuoteInput {
  const body = v.object(input, ['items', 'draft'])
  const items = v.array(body.items, 'items', (item, index) => {
    const line = v.object(item, ['variantId', 'quantity'])
    return { variantId: v.id(line.variantId, `items[${index}].variantId`), quantity: v.integer(line.quantity, `items[${index}].quantity`, 1) }
  }, 50)
  if (!items.length) throw new AppError('Quote must contain at least one item', 400)
  if (new Set(items.map(item => item.variantId)).size !== items.length) throw new AppError('Quote items must not repeat a variant', 400)
  return { items, ...(body.draft !== undefined ? { draft: parseDraft(body.draft) } : {}) }
}
