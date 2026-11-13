import { prisma } from '../../database/prisma.js'
import { transaction } from '../../database/transaction.js'
import { AppError } from '../../errors/app-error.js'
import { Prisma, type Discount } from '../../generated/prisma/client.js'
import { offset, page } from '../../utils/pagination.js'
import { MAX_INT } from '../../utils/validation.js'
import type { DiscountInput, DiscountQuery, DiscountUpdate, DiscountValidationInput } from './discounts.types.js'

function checkConfiguration(discount: { type: string; value: number; startsAt?: Date | null; endsAt?: Date | null; usageLimit?: number | null; usedCount?: number }) {
  if (!Number.isInteger(discount.value) || discount.value < 1 || discount.value > MAX_INT || (discount.type === 'PERCENTAGE' && discount.value > 100)) {
    throw new AppError('Percentage value must be 1–100; fixed value is a positive amount in cents', 400)
  }
  if (discount.startsAt && discount.endsAt && discount.startsAt >= discount.endsAt) throw new AppError('endsAt must be later than startsAt', 400)
  if (discount.usageLimit != null && (discount.usageLimit < 1 || discount.usageLimit < (discount.usedCount ?? 0))) {
    throw new AppError('usageLimit must be positive and at least usedCount', 400)
  }
}
function availability(discount: Discount, now: Date): NonNullable<DiscountQuery['state']> {
  if (!discount.active) return 'INACTIVE'
  if (discount.startsAt && discount.startsAt > now) return 'SCHEDULED'
  if (discount.endsAt && discount.endsAt <= now) return 'EXPIRED'
  if (discount.usageLimit != null && discount.usedCount >= discount.usageLimit) return 'EXHAUSTED'
  return 'AVAILABLE'
}
function serialize(discount: Discount, now = new Date()) {
  return { ...discount, state: availability(discount, now), remainingUses: discount.usageLimit == null ? null : Math.max(0, discount.usageLimit - discount.usedCount) }
}
function stateWhere(state: NonNullable<DiscountQuery['state']>, now: Date): Prisma.DiscountWhereInput {
  const started: Prisma.DiscountWhereInput = { OR: [{ startsAt: null }, { startsAt: { lte: now } }] }
  const unexpired: Prisma.DiscountWhereInput = { OR: [{ endsAt: null }, { endsAt: { gt: now } }] }
  const unused: Prisma.DiscountWhereInput = { OR: [{ usageLimit: null }, { usedCount: { lt: prisma.discount.fields.usageLimit } }] }
  if (state === 'INACTIVE') return { active: false }
  if (state === 'SCHEDULED') return { active: true, startsAt: { gt: now } }
  if (state === 'EXPIRED') return { active: true, AND: [started, { endsAt: { lte: now } }] }
  if (state === 'EXHAUSTED') return { active: true, AND: [started, unexpired, { usageLimit: { not: null }, usedCount: { gte: prisma.discount.fields.usageLimit } }] }
  return { active: true, AND: [started, unexpired, unused] }
}
export async function listDiscounts(query: DiscountQuery) {
  const now = new Date()
  const where: Prisma.DiscountWhereInput = {
    active: query.active,
    ...(query.q ? { code: { contains: query.q, mode: 'insensitive' } } : {}),
    ...(query.state ? { AND: [stateWhere(query.state, now)] } : {}),
  }
  const [data, total] = await prisma.$transaction([
    prisma.discount.findMany({ where, ...offset(query), orderBy: [{ [query.sortBy]: query.sortOrder }, { id: 'asc' }] }),
    prisma.discount.count({ where }),
  ], { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead })
  return page(data.map(discount => serialize(discount, now)), total, query)
}
export async function getDiscount(discountId: string) {
  const discount = await prisma.discount.findUnique({ where: { id: discountId } })
  if (!discount) throw new AppError('Discount not found', 404)
  return serialize(discount)
}
async function checkUniqueCode(tx: Prisma.TransactionClient, code: string, excludingId?: string) {
  const existing = await tx.discount.findFirst({
    where: { code: { equals: code, mode: 'insensitive' }, ...(excludingId ? { id: { not: excludingId } } : {}) },
    select: { id: true },
  })
  if (existing) throw new AppError('Discount code already exists (case-insensitive)', 409)
}
export async function createDiscount(input: DiscountInput) {
  checkConfiguration(input)
  return transaction(async tx => {
    await checkUniqueCode(tx, input.code)
    return serialize(await tx.discount.create({ data: input }))
  })
}
export async function updateDiscount(discountId: string, input: DiscountUpdate) {
  return transaction(async tx => {
    const current = await tx.discount.findUnique({ where: { id: discountId } })
    if (!current) throw new AppError('Discount not found', 404)
    checkConfiguration({ ...current, ...input })
    if (input.code !== undefined) await checkUniqueCode(tx, input.code, discountId)
    return serialize(await tx.discount.update({ where: { id: discountId }, data: input }))
  })
}
export async function removeDiscount(discountId: string) {
  return updateDiscount(discountId, { active: false })
}

export async function validateDiscount(input: DiscountValidationInput, tx: Prisma.TransactionClient = prisma, now = new Date()) {
  const matches = await tx.discount.findMany({ where: { code: { equals: input.code, mode: 'insensitive' } }, take: 2, orderBy: { id: 'asc' } })
  if (matches.length > 1) throw new AppError('Discount code is ambiguous; contact support', 409)
  const discount = matches[0]
  if (!discount) throw new AppError('Discount code is invalid', 400)
  checkConfiguration(discount)
  const state = availability(discount, now)
  if (state !== 'AVAILABLE') throw new AppError(`Discount is ${state.toLowerCase()}`, 400)
  const discountCents = Math.min(input.subtotalCents, discount.type === 'PERCENTAGE' ? Math.round(input.subtotalCents * discount.value / 100) : discount.value)
  return { valid: true, discountId: discount.id, code: discount.code, type: discount.type, value: discount.value, subtotalCents: input.subtotalCents, discountCents, totalCents: input.subtotalCents - discountCents }
}

/** Internal checkout helper ONLY. Call inside the transaction that commits an order.
 * Validation endpoints never increment usage, and no public redemption endpoint exists.
 * Rolling back order creation rolls back the usage increment as well.
 */
export async function redeemDiscount(tx: Prisma.TransactionClient, input: DiscountValidationInput) {
  const now = new Date()
  const result = await validateDiscount(input, tx, now)
  const updated = await tx.discount.updateMany({
    where: { id: result.discountId, usedCount: { lt: MAX_INT }, AND: [stateWhere('AVAILABLE', now)] },
    data: { usedCount: { increment: 1 } },
  })
  if (updated.count !== 1) throw new AppError('Discount usage limit reached or availability changed', 409)
  return result
}
