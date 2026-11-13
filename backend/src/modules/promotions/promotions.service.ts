import { prisma } from '../../database/prisma.js'
import { transaction } from '../../database/transaction.js'
import { AppError } from '../../errors/app-error.js'
import { Prisma, type Promotion, type PromotionTarget } from '../../generated/prisma/client.js'
import { offset, page } from '../../utils/pagination.js'
import { MAX_INT } from '../../utils/validation.js'
import type { DraftPromotion, PromotionInput, PromotionQuery, PromotionTargetInput, PromotionUpdate } from './promotions.types.js'

function checkConfiguration(promotion: { type: string; value: number; startsAt?: Date | null; endsAt?: Date | null; targets?: { value: number | null }[] }) {
  const invalid = (value: number) => !Number.isInteger(value) || value < 1 || value > MAX_INT || (promotion.type === 'PERCENTAGE' && value > 100)
  if (invalid(promotion.value) || promotion.targets?.some(target => target.value != null && invalid(target.value))) {
    throw new AppError('Percentage value must be 1–100; fixed value is a positive amount in cents', 400)
  }
  if (promotion.startsAt && promotion.endsAt && promotion.startsAt >= promotion.endsAt) throw new AppError('endsAt must be later than startsAt', 400)
}
function availability(promotion: Promotion, now: Date): NonNullable<PromotionQuery['state']> {
  if (!promotion.active) return 'INACTIVE'
  if (promotion.startsAt && promotion.startsAt > now) return 'SCHEDULED'
  if (promotion.endsAt && promotion.endsAt <= now) return 'EXPIRED'
  return 'ACTIVE'
}
type PromotionRecord = Promotion & { targets?: PromotionTarget[] }
function serialize(promotion: PromotionRecord, now = new Date()) {
  const { targets, ...rest } = promotion
  return {
    ...rest,
    state: availability(promotion, now),
    // Scope is a list of targets; row ids stay internal to the API.
    targets: (targets ?? []).map(({ productId, variantId, value }) => ({ productId, variantId, value })),
  }
}
function stateWhere(state: NonNullable<PromotionQuery['state']>, now: Date): Prisma.PromotionWhereInput {
  const started: Prisma.PromotionWhereInput = { OR: [{ startsAt: null }, { startsAt: { lte: now } }] }
  const unexpired: Prisma.PromotionWhereInput = { OR: [{ endsAt: null }, { endsAt: { gt: now } }] }
  if (state === 'INACTIVE') return { active: false }
  if (state === 'SCHEDULED') return { active: true, startsAt: { gt: now } }
  if (state === 'EXPIRED') return { active: true, AND: [started, { endsAt: { lte: now } }] }
  return { active: true, AND: [started, unexpired] }
}

/** Prisma filter for promotions running right now (active + within their window). */
export function promotionWindowWhere(now: Date): Prisma.PromotionWhereInput {
  return stateWhere('ACTIVE', now)
}

/** A loaded PromotionTarget row as the pricing engine sees it. */
export type PromotionTargetRecord = PromotionTarget & { promotion: Promotion }

export type PromotionCandidate = {
  id: string
  name: string
  type: Promotion['type']
  value: number
  startsAt: Date | null
  productId: string | null
  variantId: string | null
}

/** Resolve loaded targets into pricing candidates: scope comes from the target
 * row, and its value overrides the campaign-wide one when set. */
export function targetCandidates(targets: PromotionTargetRecord[]): PromotionCandidate[] {
  return targets.map(({ productId, variantId, value, promotion }) => ({
    id: promotion.id,
    name: promotion.name,
    type: promotion.type,
    value: value ?? promotion.value,
    startsAt: promotion.startsAt,
    productId,
    variantId,
  }))
}

/** The drawer's unsaved campaign as a candidate for one variant, when it
 * targets it. Priced exactly like a saved promotion (same winner rules), just
 * without window gating so a scheduled draft still previews its effect. */
export function draftCandidate(draft: DraftPromotion | null | undefined, variant: { id: string; productId: string }): PromotionCandidate | null {
  if (!draft) return null
  const target = draft.targets.find(item => item.variantId === variant.id)
    ?? draft.targets.find(item => item.productId === variant.productId)
  if (!target) return null
  return {
    id: draft.id ?? 'draft-preview',
    name: draft.name,
    type: draft.type,
    value: target.value ?? draft.value,
    startsAt: draft.startsAt,
    productId: target.productId,
    variantId: target.variantId,
  }
}

/** Variant-scoped promotions beat product-scoped promotions. Ties resolve to the
 * latest start (null = none) then the lowest id, so pricing is deterministic. */
export function pickWinner(promotions: PromotionCandidate[]): PromotionCandidate | null {
  return [...promotions].sort((a, b) => {
    const scope = Number(b.variantId != null) - Number(a.variantId != null)
    if (scope !== 0) return scope
    const starts = (b.startsAt?.getTime() ?? 0) - (a.startsAt?.getTime() ?? 0)
    if (starts !== 0) return starts
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
  })[0] ?? null
}

/** Per-unit discount in cents; never exceeds the original unit price, so a
 * promotion can make an item free but never negatively priced. */
export function promotionDiscount(promotion: PromotionCandidate | null, unitPriceCents: number): number {
  if (!promotion) return 0
  const raw = promotion.type === 'PERCENTAGE' ? Math.round(unitPriceCents * promotion.value / 100) : promotion.value
  return Math.min(unitPriceCents, raw)
}

/** Original price, discount amount and final price for one unit. Shared by the
 * product API, cart quote and checkout so all three agree on the math. */
export function priceQuote(promotion: PromotionCandidate | null, unitPriceCents: number) {
  const discountCents = promotionDiscount(promotion, unitPriceCents)
  return { originalPriceCents: unitPriceCents, discountCents, finalPriceCents: unitPriceCents - discountCents, promotion }
}

async function checkTargets(tx: Prisma.TransactionClient, targets: PromotionTargetInput[]) {
  const productIds = targets.flatMap(target => target.productId ?? [])
  const variantIds = targets.flatMap(target => target.variantId ?? [])
  if (productIds.length && await tx.product.count({ where: { id: { in: productIds } } }) !== productIds.length) {
    throw new AppError('Product not found', 404)
  }
  if (variantIds.length && await tx.productVariant.count({ where: { id: { in: variantIds } } }) !== variantIds.length) {
    throw new AppError('Variant not found', 404)
  }
}

export async function listPromotions(query: PromotionQuery) {
  const now = new Date()
  const where: Prisma.PromotionWhereInput = {
    active: query.active,
    ...(query.productId ? { targets: { some: { productId: query.productId } } } : {}),
    ...(query.variantId ? { targets: { some: { variantId: query.variantId } } } : {}),
    ...(query.q ? { OR: [{ name: { contains: query.q, mode: 'insensitive' } }, { marquee: { contains: query.q, mode: 'insensitive' } }] } : {}),
    ...(query.state ? { AND: [stateWhere(query.state, now)] } : {}),
  }
  const [data, total] = await prisma.$transaction([
    prisma.promotion.findMany({ where, include: { targets: true }, ...offset(query), orderBy: [{ [query.sortBy]: query.sortOrder }, { id: 'asc' }] }),
    prisma.promotion.count({ where }),
  ], { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead })
  return page(data.map(promotion => serialize(promotion, now)), total, query)
}
export async function getPromotion(promotionId: string) {
  const promotion = await prisma.promotion.findUnique({ where: { id: promotionId }, include: { targets: true } })
  if (!promotion) throw new AppError('Promotion not found', 404)
  return serialize(promotion)
}
/** Public marquee feed: every promotion running right now, oldest start first. */
export async function listActivePromotions(now = new Date()) {
  const data = await prisma.promotion.findMany({
    where: promotionWindowWhere(now),
    include: { targets: true },
    orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
  })
  return data.map(promotion => serialize(promotion, now))
}
export async function createPromotion(input: PromotionInput) {
  const { targets, ...data } = input
  checkConfiguration(input)
  return transaction(async tx => {
    await checkTargets(tx, targets)
    return serialize(await tx.promotion.create({ data: { ...data, targets: { create: targets } }, include: { targets: true } }))
  })
}
export async function updatePromotion(promotionId: string, input: PromotionUpdate) {
  return transaction(async tx => {
    const current = await tx.promotion.findUnique({ where: { id: promotionId } })
    if (!current) throw new AppError('Promotion not found', 404)
    checkConfiguration({ ...current, ...input })
    if (input.targets) await checkTargets(tx, input.targets)
    const { targets, ...data } = input
    // Sending targets replaces the whole scope in one transaction.
    return serialize(await tx.promotion.update({
      where: { id: promotionId },
      data: { ...data, ...(targets ? { targets: { deleteMany: {}, create: targets } } : {}) },
      include: { targets: true },
    }))
  })
}
/** Deactivate only: promotions are never hard-deleted, so history stays intact. */
export async function removePromotion(promotionId: string) {
  return updatePromotion(promotionId, { active: false })
}
