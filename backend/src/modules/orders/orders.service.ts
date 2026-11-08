import { prisma } from '../../database/prisma.js'
import { transaction } from '../../database/transaction.js'
import { AppError } from '../../errors/app-error.js'
import { Prisma } from '../../generated/prisma/client.js'
import type { OrderStatus } from '../../generated/prisma/enums.js'
import { offset, page, type PaginationInput } from '../../utils/pagination.js'
import type { OrderQuery, OrderStatusInput } from './orders.types.js'

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
function serialize<T extends { subtotalCents: number; discountCents: number; shippingCents: number; taxCents: number; totalCents: number; _count: { items: number } }>(order: T) {
  const { _count, ...data } = order
  return { ...data, itemCount: _count.items, subtotal: order.subtotalCents / 100, discount: order.discountCents / 100, shipping: order.shippingCents / 100, tax: order.taxCents / 100, total: order.totalCents / 100 }
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
