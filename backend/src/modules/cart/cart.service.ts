// Business logic for the cart module.
import { prisma } from '../../database/prisma.js'
import { AppError } from '../../errors/app-error.js'
import { MAX_INT } from '../../utils/validation.js'
import { draftCandidate, pickWinner, priceQuote, promotionWindowWhere, targetCandidates } from '../promotions/promotions.service.js'
import { getTaxRateBps, taxCentsFor } from '../settings/settings.service.js'
import type { QuoteInput } from './cart.types.js'

/** Stateless pricing preview: applies running promotions — plus the unsaved
 * `draft` campaign when given — to the given lines and returns
 * original/discount/final prices plus totals. Writes nothing. */
export async function quoteCart(input: QuoteInput) {
  const now = new Date()
  const running = promotionWindowWhere(now)
  const draft = input.draft
  const targetScope = { where: { promotion: running }, include: { promotion: true } } as const
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: input.items.map(item => item.variantId) } },
    include: {
      promotionTargets: targetScope,
      color: { select: { isActive: true } },
      product: { select: { id: true, name: true, sku: true, priceCents: true, status: true, promotionTargets: targetScope } },
    },
  })
  const byId = new Map(variants.map(variant => [variant.id, variant]))
  let subtotalCents = 0
  let discountCents = 0
  const items = input.items.map(line => {
    const variant = byId.get(line.variantId)
    if (!variant) throw new AppError('Cart item variant not found', 404)
    if (!variant.isActive || variant.color?.isActive === false || variant.product.status === 'ARCHIVED') throw new AppError('Cart contains inactive or archived inventory', 409)
    // The draft replaces the saved campaign of the same id, then contests the
    // winner like any other promotion, so the preview matches post-save pricing.
    const stored = targetCandidates([...variant.promotionTargets, ...variant.product.promotionTargets])
      .filter(candidate => candidate.id !== draft?.id)
    const draftForVariant = draftCandidate(draft, variant)
    const promotion = pickWinner(draftForVariant ? [...stored, draftForVariant] : stored)
    const priced = priceQuote(promotion, variant.priceCents ?? variant.product.priceCents)
    const lineOriginalCents = priced.originalPriceCents * line.quantity
    if (lineOriginalCents > MAX_INT) throw new AppError('Quote line total exceeds the maximum', 400)
    subtotalCents += lineOriginalCents
    discountCents += priced.discountCents * line.quantity
    return {
      variantId: variant.id, quantity: line.quantity,
      name: variant.product.name, sku: variant.sku, size: variant.size, color: variant.colorName,
      ...priced,
      lineOriginalCents, lineDiscountCents: priced.discountCents * line.quantity, lineFinalCents: lineOriginalCents - priced.discountCents * line.quantity,
    }
  })
  const taxRateBps = await getTaxRateBps()
  return {
    items, subtotalCents, discountCents, totalCents: subtotalCents - discountCents,
    // Tax follows the admin-managed rate so the quote matches checkout and the order.
    taxCents: taxCentsFor(subtotalCents, taxRateBps),
  }
}
