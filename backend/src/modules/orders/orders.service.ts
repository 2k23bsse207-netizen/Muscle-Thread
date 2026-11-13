import { randomBytes } from 'node:crypto'
import { prisma } from '../../database/prisma.js'
import { transaction } from '../../database/transaction.js'
import { AppError } from '../../errors/app-error.js'
import { Prisma } from '../../generated/prisma/client.js'
import type { OrderStatus } from '../../generated/prisma/enums.js'
import { offset, page, type PaginationInput } from '../../utils/pagination.js'
import { MAX_INT } from '../../utils/validation.js'
import type { CreateOrderInput, OrderQuery, OrderStatusInput } from './orders.types.js'
import { pickWinner, priceQuote, promotionWindowWhere, targetCandidates } from '../promotions/promotions.service.js'
import { getTaxRateBps, taxCentsFor } from '../settings/settings.service.js'

function listInclude(admin: boolean) {
  return {
    _count: { select: { items: true } },
    ...(admin ? { user: { select: { id: true, name: true, email: true } } } : {}),
  } satisfies Prisma.OrderInclude
}
function detailInclude(admin: boolean) {
  return {
    items: { orderBy: { id: 'asc' as const } },
    payments: { select: { id: true, provider: true, status: true, amountCents: true, currency: true, createdAt: true, updatedAt: true }, orderBy: { createdAt: 'desc' as const } },
    ...(admin ? { user: { select: { id: true, name: true, email: true, phone: true } } } : {}),
    _count: { select: { items: true } },
  } satisfies Prisma.OrderInclude
}
function serialize<T extends { subtotalCents: number; discountCents: number; shippingCents: number; taxCents: number; totalCents: number; _count: { items: number }; items?: { unitPriceCents: number; discountCents: number }[] }>(order: T) {
  const { _count, ...data } = order
  const items = data.items?.map(item => ({ ...item, originalUnitPriceCents: item.unitPriceCents, finalUnitPriceCents: item.unitPriceCents - item.discountCents }))
  return { ...data, ...(items ? { items } : {}), itemCount: _count.items, subtotal: order.subtotalCents / 100, discount: order.discountCents / 100, shipping: order.shippingCents / 100, tax: order.taxCents / 100, total: order.totalCents / 100 }
}

export async function listOrders(query: OrderQuery, ownerId?: string, admin = false) {
  const where: Prisma.OrderWhereInput = {
    userId: ownerId ?? query.userId,
    status: query.status,
    ...(query.from || query.to ? { createdAt: { gte: query.from, lte: query.to } } : {}),
  }
  if (query.q) {
    where.OR = [
      { orderNumber: { contains: query.q, mode: 'insensitive' } },
      ...(admin ? [{ user: { OR: [{ name: { contains: query.q, mode: 'insensitive' as const } }, { email: { contains: query.q, mode: 'insensitive' as const } }] } }] : []),
    ]
  }
  const [data, total] = await prisma.$transaction([
    prisma.order.findMany({ where, include: listInclude(admin), ...offset(query), orderBy: [{ [query.sortBy]: query.sortOrder }, { id: 'asc' }] }),
    prisma.order.count({ where }),
  ], { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead })
  return page(data.map(serialize), total, query)
}

export async function getOrder(orderId: string, ownerId?: string, admin = false) {
  const order = await prisma.order.findFirst({ where: { id: orderId, userId: ownerId }, include: detailInclude(admin) })
  if (!order) throw new AppError('Order not found', 404)
  return serialize(order)
}

export async function createOrder(ownerId: string, input: CreateOrderInput) {
  // Deduction, movement and order commit or roll back together; the unique
  // orderNumber generated here ties every movement reason to this one order.
  const orderNumber = `GW-${Date.now().toString(36).toUpperCase()}-${randomBytes(4).toString('hex').toUpperCase()}`
  // The admin-managed rate is read once so the stored total always matches the quote.
  const taxRateBps = await getTaxRateBps()
  return transaction(async tx => {
    const running = promotionWindowWhere(new Date())
    let subtotalCents = 0
    let discountCents = 0
    const items: Prisma.OrderItemUncheckedCreateWithoutOrderInput[] = []
    for (const line of input.items) {
      const targetScope = { where: { promotion: running }, include: { promotion: true } } as const
      const variant = await tx.productVariant.findUnique({
        where: { id: line.variantId },
        include: {
          promotionTargets: targetScope,
          color: true,
          product: { select: { id: true, name: true, sku: true, priceCents: true, status: true, promotionTargets: targetScope } },
        },
      })
      if (!variant) throw new AppError('Order item variant not found', 404)
      if (!variant.isActive || variant.color?.isActive === false || variant.product.status === 'ARCHIVED') throw new AppError('Cannot order inactive or archived inventory', 409)
      const unitPriceCents = variant.priceCents ?? variant.product.priceCents
      // Variant promotions beat product promotions; prices are quoted from the
      // ORIGINAL unit price and only the discount is recorded, never rewritten.
      const promotion = pickWinner([...targetCandidates(variant.promotionTargets), ...targetCandidates(variant.product.promotionTargets)])
      const priced = priceQuote(promotion, unitPriceCents)
      const lineTotalCents = unitPriceCents * line.quantity
      const lineDiscountCents = priced.discountCents * line.quantity
      if (lineTotalCents > MAX_INT) throw new AppError('Order line total exceeds the maximum', 400)
      if (variant.stock < line.quantity) throw new AppError(`Insufficient stock for ${variant.sku}`, 409)
      // Same optimistic guard as adjustStock: a concurrent stock change makes
      // count 0, so stock can never go negative and no line is deducted twice.
      const stockAfter = variant.stock - line.quantity
      const updated = await tx.productVariant.updateMany({
        where: { id: variant.id, stock: variant.stock, isActive: true },
        data: { stock: stockAfter, updatedAt: new Date(Math.max(Date.now(), variant.updatedAt.getTime() + 1)) },
      })
      if (updated.count !== 1) throw new AppError('Stock changed while placing the order; retry', 409)
      await tx.inventoryMovement.create({
        data: {
          variantId: variant.id, actorId: ownerId, type: 'ADJUSTMENT',
          quantityDelta: -line.quantity, stockBefore: variant.stock, stockAfter,
          reason: `Order ${orderNumber}`,
        },
      })
      subtotalCents += lineTotalCents
      discountCents += lineDiscountCents
      items.push({
        productId: variant.product.id, variantId: variant.id, name: variant.product.name, sku: variant.sku,
        size: variant.size, color: variant.colorName, unitPriceCents, quantity: line.quantity, lineTotalCents,
        discountCents: priced.discountCents, promotionId: promotion?.id ?? null, promotionName: promotion?.name ?? null,
      })
    }
    const taxCents = taxCentsFor(subtotalCents, taxRateBps)
    const order = await tx.order.create({
      data: {
        orderNumber, userId: ownerId, subtotalCents, discountCents, taxCents,
        totalCents: subtotalCents - discountCents + taxCents,
        shippingName: input.shippingName, shippingLine1: input.shippingLine1, shippingLine2: input.shippingLine2 ?? null,
        shippingCity: input.shippingCity, shippingState: input.shippingState ?? null, shippingPostal: input.shippingPostal,
        shippingCountry: input.shippingCountry, shippingPhone: input.shippingPhone ?? null,
        items: { create: items },
      },
      include: { items: { orderBy: { id: 'asc' as const } }, _count: { select: { items: true } } },
    })
    return serialize(order)
  })
}

export async function orderHistory(orderId: string, query: PaginationInput, ownerId?: string, admin = false) {
  return prisma.$transaction(async tx => {
    const order = await tx.order.findFirst({ where: { id: orderId, userId: ownerId }, select: { id: true } })
    if (!order) throw new AppError('Order not found', 404)
    const data = await tx.orderStatusHistory.findMany({
      where: { orderId }, ...offset(query), orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      // Internal notes/actor identity must not leak through the customer history.
      select: admin ? { id: true, orderId: true, fromStatus: true, toStatus: true, note: true, createdAt: true, actor: { select: { id: true, name: true } } } : { id: true, orderId: true, fromStatus: true, toStatus: true, createdAt: true },
    })
    return page(data, await tx.orderStatusHistory.count({ where: { orderId } }), query)
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead })
}

const transitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['PAID', 'CANCELLED'],
  PAID: ['PROCESSING', 'REFUNDED'],
  PROCESSING: ['SHIPPED', 'REFUNDED'],
  SHIPPED: ['DELIVERED', 'REFUNDED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
}
export async function updateOrderStatus(orderId: string, input: OrderStatusInput, actorId: string) {
  return transaction(async tx => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { payments: true } })
    if (!order) throw new AppError('Order not found', 404)
    if (input.expectedStatus && input.expectedStatus !== order.status) throw new AppError('Order status changed; refresh before retrying', 409)
    if (input.status === order.status) return serialize(await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: detailInclude(true) }))
    if (!transitions[order.status].includes(input.status)) throw new AppError(`Cannot transition order from ${order.status} to ${input.status}`, 409)
    const paid = order.payments.filter(payment => payment.status === 'PAID' && payment.currency === order.currency).reduce((sum, payment) => sum + payment.amountCents, 0)
    const refunded = order.payments.filter(payment => payment.status === 'REFUNDED' && payment.currency === order.currency).reduce((sum, payment) => sum + payment.amountCents, 0)
    if (input.status === 'PAID' && paid < order.totalCents) throw new AppError('A paid order requires recorded successful payment for the full amount', 409)
    if (input.status === 'CANCELLED' && paid > 0) throw new AppError('Paid orders require a payment-provider refund, not cancellation', 409)
    if (input.status === 'REFUNDED' && refunded < order.totalCents) throw new AppError('Record a successful full refund through the payment provider before marking refunded', 409)
    const updated = await tx.order.updateMany({ where: { id: orderId, status: order.status }, data: { status: input.status } })
    if (updated.count !== 1) throw new AppError('Order status changed; retry', 409)
    await tx.orderStatusHistory.create({ data: { orderId, fromStatus: order.status, toStatus: input.status, actorId, note: input.note } })
    // No blind stock restoration: the pre-existing schema records no reservations.
    // Status changes cannot safely infer whether/how many units were deducted.
    return serialize(await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: detailInclude(true) }))
  })
}
