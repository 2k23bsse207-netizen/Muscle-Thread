import { prisma } from '../../database/prisma.js'
import { transaction } from '../../database/transaction.js'
import { AppError } from '../../errors/app-error.js'
import { Prisma } from '../../generated/prisma/client.js'
import { offset, page, type PaginationInput } from '../../utils/pagination.js'
import { MAX_INT } from '../../utils/validation.js'
import type { InventoryQuery, InventoryUpdate, StockAdjustment } from './inventory.types.js'

const include = { product: { select: { id: true, name: true, slug: true, sku: true, status: true, priceCents: true, category: { select: { id: true, name: true, slug: true } } } } } satisfies Prisma.ProductVariantInclude
function serialize(variant: Prisma.ProductVariantGetPayload<{ include: typeof include }>) {
  const { legacyColor: _color, ...data } = variant
  return { ...data, isLowStock: variant.isActive && variant.stock <= variant.lowStockThreshold, effectivePriceCents: variant.priceCents ?? variant.product.priceCents }
}
function where(query: InventoryQuery): Prisma.ProductVariantWhereInput {
  return {
    isActive: true,
    productId: query.productId,
    product: { status: { not: 'ARCHIVED' }, categoryId: query.categoryId },
    ...(query.lowStock === undefined ? {} : { stock: query.lowStock ? { lte: prisma.productVariant.fields.lowStockThreshold } : { gt: prisma.productVariant.fields.lowStockThreshold } }),
    ...(query.q ? { OR: [{ sku: { contains: query.q, mode: 'insensitive' } }, { product: { name: { contains: query.q, mode: 'insensitive' } } }, { colorName: { contains: query.q, mode: 'insensitive' } }] } : {}),
    ...(query.outOfStock === undefined ? {} : { AND: [{ stock: query.outOfStock ? { equals: 0 } : { gt: 0 } }] }),
  }
}
export async function listInventory(query: InventoryQuery) {
  const filter = where(query)
  const [variants, total] = await prisma.$transaction([
    prisma.productVariant.findMany({ where: filter, include, ...offset(query), orderBy: [{ [query.sortBy]: query.sortOrder }, { id: 'asc' }] }),
    prisma.productVariant.count({ where: filter }),
  ], { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead })
  return page(variants.map(serialize), total, query)
}
export async function getInventory(variantId: string) {
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId }, include })
  if (!variant) throw new AppError('Inventory variant not found', 404)
  return serialize(variant)
}
export async function inventoryStats(query: InventoryQuery) {
  const filter = where({ ...query, lowStock: undefined, outOfStock: undefined })
  const [all, lowStock, outOfStock] = await prisma.$transaction([
    prisma.productVariant.aggregate({ where: filter, _count: true, _sum: { stock: true } }),
    prisma.productVariant.count({ where: { AND: [filter, { stock: { lte: prisma.productVariant.fields.lowStockThreshold } }] } }),
    prisma.productVariant.count({ where: { AND: [filter, { stock: 0 }] } }),
  ], { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead })
  return { variants: all._count, totalStock: all._sum.stock ?? 0, lowStock, outOfStock }
}
export async function adjustStock(variantId: string, input: StockAdjustment, actorId: string) {
  return transaction(async tx => {
    const variant = await tx.productVariant.findUnique({ where: { id: variantId }, include })
    if (!variant) throw new AppError('Inventory variant not found', 404)
    if (!variant.isActive || variant.product.status === 'ARCHIVED') throw new AppError('Cannot adjust inactive or archived inventory', 409)
    if (input.expectedStock !== undefined && input.expectedStock !== variant.stock) throw new AppError('Stock changed; refresh inventory before retrying', 409)
    const next = input.stock ?? variant.stock + input.delta!
    if (!Number.isInteger(next) || next < 0 || next > MAX_INT) throw new AppError('Adjustment would produce invalid or negative stock', 409)
    const delta = next - variant.stock
    if (delta === 0) throw new AppError('Adjustment must change stock', 400)
    if (input.type === 'RECEIPT' && delta < 0) throw new AppError('A receipt must add stock', 400)
    const updated = await tx.productVariant.updateMany({ where: { id: variantId, stock: variant.stock, isActive: true }, data: { stock: next } })
    if (updated.count !== 1) throw new AppError('Stock changed; retry the adjustment', 409)
    const movement = await tx.inventoryMovement.create({ data: { variantId, actorId, type: input.type, quantityDelta: delta, stockBefore: variant.stock, stockAfter: next, reason: input.reason } })
    return { inventory: serialize(await tx.productVariant.findUniqueOrThrow({ where: { id: variantId }, include })), movement }
  })
}
export async function updateInventory(variantId: string, input: InventoryUpdate) {
  return serialize(await prisma.productVariant.update({ where: { id: variantId }, data: input, include }))
}
export async function stockHistory(variantId: string, query: PaginationInput) {
  return prisma.$transaction(async tx => {
    if (!await tx.productVariant.findUnique({ where: { id: variantId }, select: { id: true } })) throw new AppError('Inventory variant not found', 404)
    const data = await tx.inventoryMovement.findMany({ where: { variantId }, ...offset(query), orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], include: { actor: { select: { id: true, name: true } } } })
    const total = await tx.inventoryMovement.count({ where: { variantId } })
    return page(data, total, query)
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead })
}
