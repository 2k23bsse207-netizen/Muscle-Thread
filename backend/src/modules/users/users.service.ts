import { prisma } from '../../database/prisma.js'
import { AppError } from '../../errors/app-error.js'
import { Prisma } from '../../generated/prisma/client.js'
import { offset, page } from '../../utils/pagination.js'
import { listOrders } from '../orders/orders.service.js'
import { PAID_ORDER_STATUSES, type OrderQuery } from '../orders/orders.types.js'
import type { CustomerQuery } from './users.types.js'

const customerSelect = {
  id: true, email: true, name: true, phone: true, emailVerified: true, emailVerifiedAt: true,
  createdAt: true, updatedAt: true, _count: { select: { orders: true } },
} satisfies Prisma.UserSelect
function serialize(customer: Prisma.UserGetPayload<{ select: typeof customerSelect }>) {
  const { _count, ...data } = customer
  return { ...data, orderCount: _count.orders }
}

export async function listCustomers(query: CustomerQuery) {
  const where: Prisma.UserWhereInput = {
    role: 'USER', emailVerified: query.emailVerified,
    ...(query.from || query.to ? { createdAt: { gte: query.from, lte: query.to } } : {}),
    ...(query.q ? { OR: [{ name: { contains: query.q, mode: 'insensitive' } }, { email: { contains: query.q, mode: 'insensitive' } }, { phone: { contains: query.q, mode: 'insensitive' } }] } : {}),
  }
  const [customers, total] = await prisma.$transaction([
    prisma.user.findMany({ where, select: customerSelect, ...offset(query), orderBy: [{ [query.sortBy]: query.sortOrder }, { id: 'asc' }] }),
    prisma.user.count({ where }),
  ], { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead })
  return page(customers.map(serialize), total, query)
}

export async function getCustomer(customerId: string) {
  return prisma.$transaction(async tx => {
    const customer = await tx.user.findFirst({ where: { id: customerId, role: 'USER' }, select: customerSelect })
    if (!customer) throw new AppError('Customer not found', 404)
    const [spend, latestOrder] = await Promise.all([
      tx.order.groupBy({ by: ['currency'], where: { userId: customerId, status: { in: PAID_ORDER_STATUSES } }, _sum: { totalCents: true }, _count: true }),
      tx.order.findFirst({ where: { userId: customerId }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], select: { id: true, orderNumber: true, createdAt: true, status: true, totalCents: true, currency: true } }),
    ])
    return {
      ...serialize(customer),
      spending: spend.map(row => ({ currency: row.currency, totalSpentCents: row._sum.totalCents ?? 0, paidOrderCount: row._count })),
      lastOrder: latestOrder,
    }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead })
}

export async function customerOrders(customerId: string, query: OrderQuery) {
  if (!await prisma.user.findFirst({ where: { id: customerId, role: 'USER' }, select: { id: true } })) throw new AppError('Customer not found', 404)
  return listOrders(query, customerId, true)
}
