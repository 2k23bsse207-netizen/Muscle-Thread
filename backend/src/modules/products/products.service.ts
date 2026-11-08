import { prisma } from '../../database/prisma.js'
import { transaction } from '../../database/transaction.js'
import { AppError } from '../../errors/app-error.js'
import { Prisma } from '../../generated/prisma/client.js'
import { offset, page } from '../../utils/pagination.js'
import type { ImageInput, ImageUpdate, ProductInput, ProductQuery, ProductUpdate, VariantInput, VariantUpdate } from './products.types.js'

function include(admin: boolean) {
  return {
    category: { select: { id: true, name: true, slug: true, status: true } },
    images: { where: admin ? {} : { isActive: true }, orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }] },
    variants: { where: admin ? {} : { isActive: true }, orderBy: [{ size: 'asc' as const }, { colorName: 'asc' as const }, { id: 'asc' as const }] },
  } satisfies Prisma.ProductInclude
}

type ProductRecord = Prisma.ProductGetPayload<{ include: ReturnType<typeof include> }>
function serialize(product: ProductRecord) {
  const { legacyImages: _images, legacyTag: _tag, warehouse: _warehouse, ...data } = product
  return {
    ...data,
    // Compatibility aliases for existing storefront consumers; cents remain canonical.
    price: product.priceCents / 100,
    image: product.images.find(image => image.isActive && image.isPrimary)?.url ?? product.images.find(image => image.isActive)?.url ?? null,
    stock: product.variants.filter(variant => variant.isActive).reduce((sum, variant) => sum + variant.stock, 0),
    variants: product.variants.map(({ legacyColor: _color, ...variant }) => ({
      ...variant,
      color: variant.colorName,
      effectivePriceCents: variant.priceCents ?? product.priceCents,
      isLowStock: variant.isActive && variant.stock <= variant.lowStockThreshold,
    })),
  }
}

async function requireProduct(tx: Prisma.TransactionClient, productId: string) {
  const product = await tx.product.findUnique({ where: { id: productId } })
  if (!product) throw new AppError('Product not found', 404)
  return product
}

async function checkCategory(tx: Prisma.TransactionClient, categoryId: string, status: string) {
  const category = await tx.category.findUnique({ where: { id: categoryId } })
  if (!category) throw new AppError('Category not found', 404)
  if (status === 'ACTIVE' && category.status !== 'ACTIVE') throw new AppError('Active products require an active category', 409)
}

function checkPrice(priceCents: number, mrpCents: number | null | undefined) {
  if (mrpCents != null && mrpCents < priceCents) throw new AppError('mrpCents must be at least priceCents', 400)
}

export async function listProducts(query: ProductQuery, admin = false) {
  const where: Prisma.ProductWhereInput = {
    status: admin ? query.status : 'ACTIVE',
    category: {
      ...(admin ? {} : { status: 'ACTIVE' }),
      ...(query.categorySlug ? { slug: query.categorySlug } : {}),
    },
    categoryId: query.categoryId,
    gender: query.gender,
    fit: query.fit,
    ...(query.tags ? { tags: { hasEvery: query.tags } } : {}),
    ...(query.collection ? { collections: { has: query.collection } } : {}),
    ...(query.minPriceCents !== undefined || query.maxPriceCents !== undefined ? { priceCents: { gte: query.minPriceCents, lte: query.maxPriceCents } } : {}),
  }
  if (!admin && query.status && query.status !== 'ACTIVE') throw new AppError('Only active products are public', 400)
  if (query.q) {
    where.OR = ['name', 'sku', 'description'].map(field => ({ [field]: { contains: query.q, mode: 'insensitive' } }))
  }
  const variantFilter: Prisma.ProductVariantWhereInput = {
    isActive: true,
    size: query.size,
    colorName: query.colorName,
    ...(query.inStock === true ? { stock: { gt: 0 } } : {}),
  }
  if (query.size || query.colorName || query.inStock === true) where.variants = { some: variantFilter }
  if (query.inStock === false) {
    const filters: Prisma.ProductWhereInput[] = [{ variants: { none: { ...variantFilter, stock: { gt: 0 } } } }]
    if (query.size || query.colorName) filters.push({ variants: { some: variantFilter } })
    where.AND = filters
  }
  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({ where, include: include(admin), ...offset(query), orderBy: [{ [query.sortBy]: query.sortOrder }, { id: 'asc' }] }),
    prisma.product.count({ where }),
  ], { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead })
  return page(products.map(serialize), total, query)
}

export async function getProduct(identifier: string, admin = false) {
  const product = await prisma.product.findFirst({
    where: {
      OR: [{ id: identifier }, { slug: identifier }],
      ...(admin ? {} : { status: 'ACTIVE', category: { status: 'ACTIVE' } }),
    },
    include: include(admin),
  })
  if (!product) throw new AppError('Product not found', 404)
  return serialize(product)
}

export async function createProduct(input: ProductInput, actorId: string) {
  checkPrice(input.priceCents, input.mrpCents)
  return transaction(async tx => {
    await checkCategory(tx, input.categoryId, input.status ?? 'DRAFT')
    const { images = [], variants = [], ...data } = input
    const primary = Math.max(0, images.findIndex(image => image.isPrimary))
    const product = await tx.product.create({
      data: {
        ...data,
        images: { create: images.map((image, index) => ({ ...image, sortOrder: image.sortOrder ?? index, isPrimary: index === primary })) },
        variants: { create: variants },
      },
      include: include(true),
    })
    for (const variant of product.variants) {
      if (variant.stock > 0) {
        await tx.inventoryMovement.create({ data: { variantId: variant.id, actorId, type: 'RECEIPT', quantityDelta: variant.stock, stockBefore: 0, stockAfter: variant.stock, reason: 'Initial stock on product creation' } })
      }
    }
    return serialize(product)
  })
}

export async function updateProduct(productId: string, input: ProductUpdate) {
  return transaction(async tx => {
    const current = await requireProduct(tx, productId)
    checkPrice(input.priceCents ?? current.priceCents, input.mrpCents === undefined ? current.mrpCents : input.mrpCents)
    await checkCategory(tx, input.categoryId ?? current.categoryId, input.status ?? current.status)
    return serialize(await tx.product.update({ where: { id: productId }, data: input, include: include(true) }))
  })
}

/** Data-preserving DELETE: archive; never cascade through carts or historical orders. */
export async function archiveProduct(productId: string) {
  return updateProduct(productId, { status: 'ARCHIVED' })
}

async function normalizePrimary(tx: Prisma.TransactionClient, productId: string) {
  const active = await tx.productImage.findMany({ where: { productId, isActive: true }, orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }, { id: 'asc' }] })
  if (active.length) {
    await tx.productImage.updateMany({ where: { productId, isActive: true, id: { not: active[0].id } }, data: { isPrimary: false } })
    await tx.productImage.update({ where: { id: active[0].id }, data: { isPrimary: true } })
  }
}

export async function addImage(productId: string, input: ImageInput) {
  return transaction(async tx => {
    await requireProduct(tx, productId)
    const count = await tx.productImage.count({ where: { productId, isActive: true } })
    if (count >= 30) throw new AppError('A product may have at most 30 active images', 409)
    const max = await tx.productImage.aggregate({ where: { productId, isActive: true }, _max: { sortOrder: true } })
    if (input.isPrimary) await tx.productImage.updateMany({ where: { productId }, data: { isPrimary: false } })
    const image = await tx.productImage.create({ data: { ...input, productId, sortOrder: input.sortOrder ?? ((max._max.sortOrder ?? -1) + 1), isPrimary: input.isPrimary ?? count === 0 } })
    await normalizePrimary(tx, productId)
    await tx.product.update({ where: { id: productId }, data: { updatedAt: new Date() } })
    return tx.productImage.findUniqueOrThrow({ where: { id: image.id } })
  })
}

export async function updateImage(productId: string, imageId: string, input: ImageUpdate) {
  return transaction(async tx => {
    await requireProduct(tx, productId)
    const image = await tx.productImage.findFirst({ where: { id: imageId, productId, isActive: true } })
    if (!image) throw new AppError('Image not found for this product', 404)
    if (input.isPrimary) await tx.productImage.updateMany({ where: { productId }, data: { isPrimary: false } })
    await tx.productImage.update({ where: { id: imageId }, data: input })
    await normalizePrimary(tx, productId)
    await tx.product.update({ where: { id: productId }, data: { updatedAt: new Date() } })
    return tx.productImage.findUniqueOrThrow({ where: { id: imageId } })
  })
}

export async function removeImage(productId: string, imageId: string) {
  return transaction(async tx => {
    await requireProduct(tx, productId)
    const image = await tx.productImage.findFirst({ where: { id: imageId, productId, isActive: true } })
    if (!image) throw new AppError('Image not found for this product', 404)
    await tx.productImage.update({ where: { id: imageId }, data: { isActive: false, isPrimary: false } })
    await normalizePrimary(tx, productId)
    await tx.product.update({ where: { id: productId }, data: { updatedAt: new Date() } })
    return { removed: true, preserved: true }
  })
}

export async function reorderImages(productId: string, imageIds: string[]) {
  return transaction(async tx => {
    await requireProduct(tx, productId)
    const images = await tx.productImage.findMany({ where: { productId, isActive: true }, select: { id: true } })
    const expected = new Set(images.map(image => image.id))
    if (imageIds.length !== expected.size || imageIds.some(imageId => !expected.has(imageId))) {
      throw new AppError('imageIds must include every active image for this product exactly once', 400)
    }
    for (const [sortOrder, imageId] of imageIds.entries()) await tx.productImage.update({ where: { id: imageId }, data: { sortOrder } })
    await tx.product.update({ where: { id: productId }, data: { updatedAt: new Date() } })
    return tx.productImage.findMany({ where: { productId, isActive: true }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] })
  })
}

export async function addVariant(productId: string, input: VariantInput, actorId: string) {
  return transaction(async tx => {
    await requireProduct(tx, productId)
    const variant = await tx.productVariant.create({ data: { ...input, productId } })
    if (variant.stock > 0) await tx.inventoryMovement.create({ data: { variantId: variant.id, actorId, type: 'RECEIPT', quantityDelta: variant.stock, stockBefore: 0, stockAfter: variant.stock, reason: 'Initial stock on variant creation' } })
    await tx.product.update({ where: { id: productId }, data: { updatedAt: new Date() } })
    const { legacyColor: _color, ...result } = variant
    return result
  })
}

export async function updateVariant(productId: string, variantId: string, input: VariantUpdate) {
  return transaction(async tx => {
    await requireProduct(tx, productId)
    const variant = await tx.productVariant.findFirst({ where: { id: variantId, productId } })
    if (!variant) throw new AppError('Variant not found for this product', 404)
    const { legacyColor: _color, ...result } = await tx.productVariant.update({ where: { id: variantId }, data: input })
    await tx.product.update({ where: { id: productId }, data: { updatedAt: new Date() } })
    return result
  })
}

export async function removeVariant(productId: string, variantId: string) {
  return updateVariant(productId, variantId, { isActive: false })
}
