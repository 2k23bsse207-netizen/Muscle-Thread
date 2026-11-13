import { prisma } from '../../database/prisma.js'
import { Prisma } from '../../generated/prisma/client.js'
import { PAID_ORDER_STATUSES } from '../orders/orders.types.js'
import type { DashboardQuery, SalesBucket } from './admin.types.js'

function numeric(value: bigint | number | null): number {
  const result = Number(value ?? 0)
  if (!Number.isSafeInteger(result)) throw new Error('Aggregate exceeds safe integer precision')
  return result
}
function bucketStart(date: Date, groupBy: DashboardQuery['groupBy']): Date {
  const start = new Date(date)
  start.setUTCHours(0, 0, 0, 0)
  if (groupBy === 'week') start.setUTCDate(start.getUTCDate() - (start.getUTCDay() + 6) % 7)
  if (groupBy === 'month') start.setUTCDate(1)
  return start
}
async function salesBuckets(tx: Prisma.TransactionClient, query: DashboardQuery): Promise<SalesBucket[]> {
  const rows = await tx.$queryRaw<Array<{ date: Date; orders: bigint; paidOrders: bigint; grossRevenueCents: bigint; refundedCents: bigint }>>(Prisma.sql`
    SELECT bucket AT TIME ZONE 'UTC' AS date, SUM(order_count)::bigint AS orders, SUM(paid_count)::bigint AS "paidOrders",
           SUM(gross)::bigint AS "grossRevenueCents", SUM(refunds)::bigint AS "refundedCents"
    FROM (
      SELECT date_trunc(${query.groupBy}, o."createdAt") AS bucket,
             COUNT(*) AS order_count,
             COUNT(*) FILTER (WHERE o.status IN ('PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED')) AS paid_count,
             0::bigint AS gross, 0::bigint AS refunds
      FROM "Order" o
      WHERE o.currency = ${query.currency} AND o."createdAt" >= ${query.from} AND o."createdAt" <= ${query.to}
      GROUP BY bucket
      UNION ALL
      SELECT date_trunc(${query.groupBy}, p."createdAt"), 0, 0, SUM(p."amountCents")::bigint, 0
      FROM "Payment" p
      WHERE p.currency = ${query.currency} AND p.status IN ('PAID', 'REFUNDED')
        AND p."createdAt" >= ${query.from} AND p."createdAt" <= ${query.to}
      GROUP BY 1
      UNION ALL
      SELECT date_trunc(${query.groupBy}, p."updatedAt"), 0, 0, 0, SUM(p."amountCents")::bigint
      FROM "Payment" p
      WHERE p.currency = ${query.currency} AND p.status = 'REFUNDED'
        AND p."updatedAt" >= ${query.from} AND p."updatedAt" <= ${query.to}
      GROUP BY 1
    ) events
    GROUP BY bucket ORDER BY bucket
  `)
  const indexed = new Map(rows.map(row => [row.date.toISOString().slice(0, 10), row]))
  const result: SalesBucket[] = []
  const end = bucketStart(query.to, query.groupBy)
  for (let cursor = bucketStart(query.from, query.groupBy); cursor <= end;) {
    const date = cursor.toISOString().slice(0, 10)
    const row = indexed.get(date)
    const grossRevenueCents = numeric(row?.grossRevenueCents ?? 0)
    const refundedCents = numeric(row?.refundedCents ?? 0)
    // Zero buckets represent an absence of database events, not fabricated sales.
    result.push({ date, orders: numeric(row?.orders ?? 0), paidOrders: numeric(row?.paidOrders ?? 0), grossRevenueCents, refundedCents, revenueCents: grossRevenueCents - refundedCents })
    const next = new Date(cursor)
    if (query.groupBy === 'month') next.setUTCMonth(next.getUTCMonth() + 1)
    else next.setUTCDate(next.getUTCDate() + (query.groupBy === 'week' ? 7 : 1))
    cursor = next
  }
  return result
}
async function bestsellers(tx: Prisma.TransactionClient, query: DashboardQuery) {
  const rows = await tx.$queryRaw<Array<{ productId: string | null; name: string; sku: string | null; unitsSold: bigint; merchandiseSalesCents: bigint; orderCount: bigint }>>(Prisma.sql`
    SELECT oi."productId", COALESCE(MAX(p.name), MAX(oi.name)) AS name,
           COALESCE(MAX(p.sku), MAX(oi.sku)) AS sku,
           SUM(oi.quantity)::bigint AS "unitsSold", SUM(oi."lineTotalCents")::bigint AS "merchandiseSalesCents",
           COUNT(DISTINCT oi."orderId")::bigint AS "orderCount"
    FROM "OrderItem" oi
    JOIN "Order" o ON o.id = oi."orderId"
    LEFT JOIN "Product" p ON p.id = oi."productId"
    WHERE o.currency = ${query.currency} AND o.status IN ('PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED')
      AND o."createdAt" >= ${query.from} AND o."createdAt" <= ${query.to}
    GROUP BY oi."productId", CASE WHEN oi."productId" IS NULL THEN COALESCE(oi.sku, oi.name) ELSE oi."productId" END
    ORDER BY "unitsSold" DESC, "merchandiseSalesCents" DESC, name ASC
    LIMIT ${query.limit}
  `)
  return rows.map(row => ({ ...row, unitsSold: numeric(row.unitsSold), merchandiseSalesCents: numeric(row.merchandiseSalesCents), orderCount: numeric(row.orderCount) }))
}

export async function getDashboard(query: DashboardQuery) {
  return prisma.$transaction(async tx => {
    const orderWhere: Prisma.OrderWhereInput = { currency: query.currency, createdAt: { gte: query.from, lte: query.to } }
    const paidWhere: Prisma.OrderWhereInput = { ...orderWhere, status: { in: PAID_ORDER_STATUSES } }
    const byStatus = await tx.order.groupBy({ by: ['status'], where: orderWhere, _count: true })
    const statuses = { PENDING: 0, PAID: 0, PROCESSING: 0, SHIPPED: 0, DELIVERED: 0, CANCELLED: 0, REFUNDED: 0 }
    for (const row of byStatus) statuses[row.status] = row._count
    const paid = await tx.order.aggregate({ where: paidWhere, _count: true, _sum: { totalCents: true } })
    const sales = await tx.orderItem.aggregate({ where: { order: paidWhere }, _sum: { quantity: true, lineTotalCents: true } })
    const customers = await tx.user.count({ where: { role: 'USER' } })
    const newCustomers = await tx.user.count({ where: { role: 'USER', createdAt: { gte: query.from, lte: query.to } } })
    const purchasingCustomers = await tx.user.count({ where: { role: 'USER', orders: { some: paidWhere } } })
    const productsByStatus = await tx.product.groupBy({ by: ['status'], _count: true })
    const products = { total: 0, active: 0, draft: 0, archived: 0 }
    for (const row of productsByStatus) { products[row.status.toLowerCase() as 'active' | 'draft' | 'archived'] = row._count; products.total += row._count }
    const inventoryWhere: Prisma.ProductVariantWhereInput = { isActive: true, NOT: { color: { isActive: false } }, product: { status: { not: 'ARCHIVED' } } }
    const inventory = await tx.productVariant.aggregate({ where: inventoryWhere, _count: true, _sum: { stock: true } })
    const lowStockWhere: Prisma.ProductVariantWhereInput = { ...inventoryWhere, stock: { lte: tx.productVariant.fields.lowStockThreshold } }
    const lowStockCount = await tx.productVariant.count({ where: lowStockWhere })
    const outOfStock = await tx.productVariant.count({ where: { ...inventoryWhere, stock: 0 } })
    const lowStockRows = await tx.productVariant.findMany({
      where: lowStockWhere, take: query.limit, orderBy: [{ stock: 'asc' }, { id: 'asc' }],
      select: { id: true, sku: true, size: true, colorName: true, stock: true, lowStockThreshold: true, product: { select: { id: true, name: true, slug: true } } },
    })
    const salesSeries = await salesBuckets(tx, query)
    const ranked = await bestsellers(tx, query)
    const grossCents = salesSeries.reduce((sum, row) => sum + row.grossRevenueCents, 0)
    const refundedCents = salesSeries.reduce((sum, row) => sum + row.refundedCents, 0)
    const netCents = grossCents - refundedCents
    // Previous window: same length as the current one, ending 1 ms before it
    // starts so the two windows never share an event. Reuses salesBuckets so
    // the comparison is computed on exactly the same payment basis.
    const span = query.to.getTime() - query.from.getTime()
    const previousFrom = new Date(query.from.getTime() - span)
    const previousTo = new Date(query.from.getTime() - 1)
    const previousSeries = await salesBuckets(tx, { ...query, from: previousFrom, to: previousTo })
    const previousGross = previousSeries.reduce((sum, row) => sum + row.grossRevenueCents, 0)
    const previousRefunded = previousSeries.reduce((sum, row) => sum + row.refundedCents, 0)
    const previousNet = previousGross - previousRefunded
    const previousPaid = await tx.order.count({
      where: { currency: query.currency, status: { in: PAID_ORDER_STATUSES }, createdAt: { gte: previousFrom, lte: previousTo } },
    })
    const recentOrders = await tx.order.findMany({
      // Same currency + period scope as the rest of the dashboard.
      where: orderWhere,
      take: query.limit,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true, orderNumber: true, status: true, totalCents: true, createdAt: true,
        user: { select: { name: true } },
        _count: { select: { items: true } },
      },
    })
    return {
      period: { from: query.from, to: query.to, currency: query.currency, timezone: 'UTC', groupBy: query.groupBy },
      orders: { total: byStatus.reduce((sum, row) => sum + row._count, 0), paid: paid._count, byStatus: statuses },
      revenue: {
        grossCents, refundedCents, netCents,
        averageOrderValueCents: paid._count ? Math.round(netCents / paid._count) : 0,
        basis: 'Recorded successful payment amounts at createdAt; full refunds at updatedAt. REFUNDED payments represent captured payments subsequently refunded in full. Average order value = net revenue / paid orders in the period.',
      },
      sales: { unitsSold: sales._sum.quantity ?? 0, merchandiseSalesCents: sales._sum.lineTotalCents ?? 0, basis: 'Order-item snapshots from PAID, PROCESSING, SHIPPED and DELIVERED orders created in the period; excludes cancelled/refunded orders.' },
      customers: { total: customers, new: newCustomers, purchasing: purchasingCustomers },
      products,
      inventory: { variants: inventory._count, totalStock: inventory._sum.stock ?? 0, lowStock: lowStockCount, outOfStock, basis: 'Current active variants on non-archived products; independent of the sales date range.' },
      salesSeries,
      bestsellers: ranked,
      lowStock: lowStockRows,
      recentOrders: recentOrders.map(row => ({
        id: row.id,
        orderNumber: row.orderNumber,
        customerName: row.user.name,
        itemCount: row._count.items,
        totalCents: row.totalCents,
        status: row.status,
        createdAt: row.createdAt,
      })),
      previous: {
        from: previousFrom,
        to: previousTo,
        grossCents: previousGross,
        refundedCents: previousRefunded,
        netCents: previousNet,
        paidOrders: previousPaid,
        averageOrderValueCents: previousPaid ? Math.round(previousNet / previousPaid) : 0,
      },
    }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, timeout: 15000 })
}
