import { prisma } from '../../database/prisma.js'
import { transaction } from '../../database/transaction.js'
import { AppError } from '../../errors/app-error.js'
import { Prisma } from '../../generated/prisma/client.js'
import type { ProductVariant } from '../../generated/prisma/client.js'
import { offset, page } from '../../utils/pagination.js'
import { MAX_INT } from '../../utils/validation.js'
import { cleanupImageAsset, withImageUpload } from './products.images.js'
import { pickWinner, priceQuote, promotionWindowWhere, targetCandidates, type PromotionCandidate, type PromotionTargetRecord } from '../promotions/promotions.service.js'
import type { ColorInput, ColorUpdate, ImageInput, ImageOrder, ImageUpdate, ImageUpload, ProductInput, ProductQuery, ProductUpdate, VariantInput, VariantUpdate } from './products.types.js'

const imageOrder = [{ sortOrder: 'asc' as const }, { id: 'asc' as const }]
const purchasable = { isActive: true, OR: [{ colorId: null }, { color: { isActive: true } }] } satisfies Prisma.ProductVariantWhereInput

function include(admin: boolean) {
  const running = promotionWindowWhere(new Date())
  const targetScope = { where: { promotion: running }, include: { promotion: true } } as const
  return {
    category: { select: { id: true, name: true, slug: true, status: true } },
    colors: { where: admin ? {} : { isActive: true }, orderBy: imageOrder },
    images: { where: admin ? {} : { isActive: true, OR: [{ colorId: null }, { color: { isActive: true } }] }, orderBy: imageOrder },
    variants: { where: admin ? {} : purchasable, orderBy: [{ size: 'asc' as const }, { colorName: 'asc' as const }, { id: 'asc' as const }], include: { promotionTargets: targetScope } },
    promotionTargets: targetScope,
  } satisfies Prisma.ProductInclude
}

type ProductRecord = Prisma.ProductGetPayload<{ include: ReturnType<typeof include> }>
function cover(images: ProductRecord['images']): string | null {
  return images.find(image => image.isActive && image.isPrimary)?.url ?? images.find(image => image.isActive)?.url ?? null
}
/** Running promotion targets for a product (and optionally one variant), for
 * mutation responses that bypass include(). */
async function runningPromotions(tx: Prisma.TransactionClient, productId: string, variantId?: string) {
  return tx.promotionTarget.findMany({
    where: {
      OR: [{ productId }, ...(variantId ? [{ variantId }] : [])],
      promotion: promotionWindowWhere(new Date()),
    },
    include: { promotion: true },
  })
}
/** The offer most variants actually share, quoted at the base unit price.
 * Multi-variant products are usually targeted variant-by-variant, so their
 * cards need this to show promotions just like single-variant products. Ties
 * prefer the larger discount, then the deterministic pickWinner order. */
function bestVariantPromotion(variants: { priceCents: number | null; promotionTargets: PromotionTargetRecord[] }[], basePriceCents: number) {
  const groups = new Map<string, { candidate: PromotionCandidate; covered: number; discount: number }>()
  for (const variant of variants) {
    const candidate = pickWinner(targetCandidates(variant.promotionTargets))
    if (!candidate) continue
    const key = `${candidate.id}:${candidate.value}`
    const entry = groups.get(key) ?? { candidate, covered: 0, discount: 0 }
    entry.covered += 1
    entry.discount = Math.max(entry.discount, priceQuote(candidate, variant.priceCents ?? basePriceCents).discountCents)
    groups.set(key, entry)
  }
  return [...groups.values()]
    .sort((a, b) => b.covered - a.covered || b.discount - a.discount || (a.candidate.id < b.candidate.id ? -1 : 1))[0]?.candidate ?? null
}
function serializeVariant(variant: ProductVariant & { promotionTargets?: PromotionTargetRecord[] }, priceCents: number, colorActive = true, productTargets: PromotionTargetRecord[] = []) {
  const { legacyColor: _color, promotionTargets = [], ...data } = variant
  // Variant-scoped offers beat product-level ones; prices always quote from the
  // ORIGINAL unit price so no stored price is ever overwritten.
  const promotion = pickWinner([...targetCandidates(promotionTargets), ...targetCandidates(productTargets)])
  const { originalPriceCents, discountCents, finalPriceCents } = priceQuote(promotion, variant.priceCents ?? priceCents)
  return {
    ...data, color: variant.colorName, effectivePriceCents: originalPriceCents,
    originalPriceCents, discountCents, finalPriceCents, promotion,
    isLowStock: variant.isActive && colorActive && variant.stock <= variant.lowStockThreshold,
  }
}
function serialize(product: ProductRecord) {
  const { legacyImages: _images, legacyTag: _tag, warehouse: _warehouse, promotionTargets: productTargets, ...data } = product
  const shared = product.images.filter(image => image.colorId === null)
  const variants = product.variants.map(variant => serializeVariant(variant, product.priceCents, product.colors.find(color => color.id === variant.colorId)?.isActive ?? true, productTargets))
  // Preserve the raw flat array for old consumers; new clients can distinguish
  // explicitly disabled colours without destroying per-variant activation state.
  const colors = product.colors.map(color => {
    const images = product.images.filter(image => image.colorId === color.id)
    return {
      ...color, images, variants: variants.filter(variant => variant.colorId === color.id),
      image: cover(images) ?? cover(shared), usesSharedGallery: !images.some(image => image.isActive),
    }
  })
  const activeColorIds = new Set(product.colors.filter(color => color.isActive).map(color => color.id))
  const visibleImages = product.images.filter(image => image.isActive && (image.colorId === null || activeColorIds.has(image.colorId)))
  // A product-level campaign always wins (it covers every variant); otherwise
  // surface the best variant-scoped offer so multi-variant products still show
  // their available promotion. The card quotes it from the base unit price.
  const productPromotion = pickWinner(targetCandidates(productTargets)) ?? bestVariantPromotion(product.variants, product.priceCents)
  const { originalPriceCents, discountCents, finalPriceCents } = priceQuote(productPromotion, product.priceCents)
  return {
    ...data, colors, variants,
    // Existing flat fields/aliases stay available. Shared images are the preferred
    // product cover; new colour primaries are independent, not a global flag.
    price: product.priceCents / 100,
    originalPriceCents, discountCents, finalPriceCents, promotion: productPromotion,
    image: cover(shared) ?? colors.find(color => color.isActive && color.image)?.image ?? cover(visibleImages),
    stock: variants.filter(variant => variant.isActive && (variant.colorId === null || activeColorIds.has(variant.colorId))).reduce((sum, variant) => sum + variant.stock, 0),
    sharedImages: shared,
  }
}

async function requireProduct(tx: Prisma.TransactionClient, productId: string) {
  const product = await tx.product.findUnique({ where: { id: productId } })
  if (!product) throw new AppError('Product not found', 404)
  return product
}
async function requireColor(tx: Prisma.TransactionClient, productId: string, colorId: string, active = false) {
  const color = await tx.productColor.findFirst({ where: { id: colorId, productId } })
  if (!color) throw new AppError('Colour not found for this product', 404)
  if (active && !color.isActive) throw new AppError('Cannot add or reactivate options for an inactive colour', 409)
  return color
}
async function checkCategory(tx: Prisma.TransactionClient, categoryId: string, requireActive: boolean) {
  const category = await tx.category.findUnique({ where: { id: categoryId } })
  if (!category) throw new AppError('Category not found', 404)
  if (requireActive && category.status !== 'ACTIVE') throw new AppError('Active products require an active category', 409)
}
function checkPrice(priceCents: number, mrpCents: number | null | undefined) {
  if (mrpCents != null && mrpCents < priceCents) throw new AppError('mrpCents must be at least priceCents', 400)
}
function checkRevision(current: Date, expected: Date | undefined) {
  if (expected && current.getTime() !== expected.getTime()) throw new AppError('Record changed; reload and confirm the intended edit before retrying', 409)
}
function nextRevision(current: Date): Date { return new Date(Math.max(Date.now(), current.getTime() + 1)) }

async function createColorRecord(tx: Prisma.TransactionClient, productId: string, input: ColorInput) {
  const max = await tx.productColor.aggregate({ where: { productId }, _max: { sortOrder: true } })
  const sortOrder = input.sortOrder ?? Math.min(MAX_INT, (max._max.sortOrder ?? -1) + 1)
  return tx.productColor.create({ data: { ...input, productId, sortOrder, hex: input.hex || null } })
}
async function resolveVariantColor(tx: Prisma.TransactionClient, productId: string, input: Pick<VariantInput, 'colorId' | 'colorName' | 'colorHex'>, active: boolean) {
  if (input.colorId) {
    const color = await requireColor(tx, productId, input.colorId, active)
    if (input.colorName !== undefined && input.colorName !== color.name) throw new AppError('colorName must match the selected product colour', 400)
    if (input.colorHex !== undefined && color.hex !== null && input.colorHex.toLowerCase() !== color.hex.toLowerCase()) throw new AppError('colorHex must match the selected product colour; edit colour metadata explicitly', 400)
    return { colorId: color.id, colorName: color.name, colorHex: color.hex ?? input.colorHex ?? '' }
  }
  const name = input.colorName ?? ''
  let color = await tx.productColor.findUnique({ where: { productId_name: { productId, name } } })
  if (!color) color = await createColorRecord(tx, productId, { name, hex: /^#[0-9a-fA-F]{6}$/.test(input.colorHex ?? '') ? input.colorHex : null })
  if (active && !color.isActive) throw new AppError('Cannot add or reactivate options for an inactive colour', 409)
  // Legacy writers may have contradictory swatches. Retain their explicit value;
  // never silently replace shared colour metadata or group by the hex value.
  return { colorId: color.id, colorName: color.name, colorHex: input.colorHex ?? color.hex ?? '' }
}
async function recordInitialStock(tx: Prisma.TransactionClient, variant: ProductVariant, actorId: string, reason: string) {
  if (variant.stock > 0) await tx.inventoryMovement.create({ data: { variantId: variant.id, actorId, type: 'RECEIPT', quantityDelta: variant.stock, stockBefore: 0, stockAfter: variant.stock, reason } })
}
async function createVariantRecord(tx: Prisma.TransactionClient, productId: string, input: VariantInput, actorId: string, reason: string) {
  const color = await resolveVariantColor(tx, productId, input, true)
  const variant = await tx.productVariant.create({ data: { ...input, ...color, productId } })
  await recordInitialStock(tx, variant, actorId, reason)
  return variant
}

export async function listProducts(query: ProductQuery, admin = false) {
  const where: Prisma.ProductWhereInput = {
    status: admin ? query.status : 'ACTIVE',
    category: { ...(admin ? {} : { status: 'ACTIVE' }), ...(query.categorySlug ? { slug: query.categorySlug } : {}) },
    categoryId: query.categoryId, gender: query.gender, fit: query.fit,
    ...(query.tags ? { tags: { hasEvery: query.tags } } : {}),
    ...(query.collection ? { collections: { has: query.collection } } : {}),
    ...(query.minPriceCents !== undefined || query.maxPriceCents !== undefined ? { priceCents: { gte: query.minPriceCents, lte: query.maxPriceCents } } : {}),
  }
  if (!admin && query.status && query.status !== 'ACTIVE') throw new AppError('Only active products are public', 400)
  if (query.q) where.OR = ['name', 'sku', 'description'].map(field => ({ [field]: { contains: query.q, mode: 'insensitive' } }))
  const variantFilter: Prisma.ProductVariantWhereInput = { ...purchasable, size: query.size, colorName: query.colorName, ...(query.colorId ? { colorId: query.colorId } : {}), ...(query.inStock === true ? { stock: { gt: 0 } } : {}) }
  if (query.size || query.colorName || query.colorId || query.inStock === true) where.variants = { some: variantFilter }
  if (query.inStock === false) {
    const filters: Prisma.ProductWhereInput[] = [{ variants: { none: { ...variantFilter, stock: { gt: 0 } } } }]
    if (query.size || query.colorName || query.colorId) filters.push({ variants: { some: variantFilter } })
    where.AND = filters
  }
  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({ where, include: include(admin), ...offset(query), orderBy: [{ [query.sortBy]: query.sortOrder }, { id: 'asc' }] }), prisma.product.count({ where }),
  ], { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead })
  return page(products.map(serialize), total, query)
}
export async function getProduct(identifier: string, admin = false) {
  const product = await prisma.product.findFirst({ where: { OR: [{ id: identifier }, { slug: identifier }], ...(admin ? {} : { status: 'ACTIVE', category: { status: 'ACTIVE' } }) }, include: include(admin) })
  if (!product) throw new AppError('Product not found', 404)
  return serialize(product)
}
export async function createProduct(input: ProductInput, actorId: string) {
  checkPrice(input.priceCents, input.mrpCents)
  return transaction(async tx => {
    await checkCategory(tx, input.categoryId, input.status === 'ACTIVE')
    const { images = [], variants = [], colors = [], ...data } = input
    const product = await tx.product.create({ data })
    const primary = Math.max(0, images.findIndex(image => image.isPrimary))
    for (const [index, image] of images.entries()) await tx.productImage.create({ data: { ...image, productId: product.id, colorId: null, sortOrder: image.sortOrder ?? index, isPrimary: index === primary } })
    for (const input of colors) {
      const { images = [], variants = [], ...metadata } = input
      const color = await createColorRecord(tx, product.id, metadata)
      const primary = Math.max(0, images.findIndex(image => image.isPrimary))
      for (const [index, image] of images.entries()) await tx.productImage.create({ data: { ...image, productId: product.id, colorId: color.id, sortOrder: image.sortOrder ?? index, isPrimary: index === primary } })
      for (const variant of variants) {
        const record = await tx.productVariant.create({ data: { ...variant, productId: product.id, colorId: color.id, colorName: color.name, colorHex: color.hex ?? '' } })
        await recordInitialStock(tx, record, actorId, 'Initial stock on product creation')
      }
    }
    for (const variant of variants) await createVariantRecord(tx, product.id, variant, actorId, 'Initial stock on product creation')
    return serialize(await tx.product.findUniqueOrThrow({ where: { id: product.id }, include: include(true) }))
  })
}
export async function updateProduct(productId: string, input: ProductUpdate) {
  return transaction(async tx => {
    const current = await requireProduct(tx, productId)
    checkPrice(input.priceCents ?? current.priceCents, input.mrpCents === undefined ? current.mrpCents : input.mrpCents)
    const categoryId = input.categoryId ?? current.categoryId
    const status = input.status ?? current.status
    const requireActive = status === 'ACTIVE' && (current.status !== 'ACTIVE' || categoryId !== current.categoryId)
    await checkCategory(tx, categoryId, requireActive)
    return serialize(await tx.product.update({ where: { id: productId }, data: input, include: include(true) }))
  })
}
/** Data-preserving DELETE: archive; never cascade through variants or historical orders. */
export async function archiveProduct(productId: string) { return updateProduct(productId, { status: 'ARCHIVED' }) }

export async function addColor(productId: string, input: ColorInput) {
  return transaction(async tx => {
    await requireProduct(tx, productId)
    const color = await createColorRecord(tx, productId, input)
    await tx.product.update({ where: { id: productId }, data: { updatedAt: new Date() } })
    return color
  })
}
export async function updateColor(productId: string, colorId: string, input: ColorUpdate) {
  return transaction(async tx => {
    await requireProduct(tx, productId)
    const current = await requireColor(tx, productId, colorId)
    const { expectedUpdatedAt, ...data } = input
    if (data.isActive === false && !expectedUpdatedAt) throw new AppError('Colour deactivation requires its original expectedUpdatedAt revision', 400)
    checkRevision(current.updatedAt, expectedUpdatedAt)
    const color = await tx.productColor.update({ where: { id: colorId }, data: { ...data, updatedAt: nextRevision(current.updatedAt) } })
    // Synchronize compatibility aliases only on an explicit shared-metadata edit.
    // No identity, SKU, stock, threshold, override or movement is changed.
    if (data.name !== undefined || data.hex !== undefined) {
      const revisions = await tx.productVariant.aggregate({ where: { productId, colorId }, _max: { updatedAt: true } })
      await tx.productVariant.updateMany({ where: { productId, colorId }, data: { ...(data.name !== undefined ? { colorName: color.name } : {}), ...(data.hex !== undefined ? { colorHex: color.hex ?? '' } : {}), updatedAt: nextRevision(revisions._max.updatedAt ?? new Date(0)) } })
    }
    await tx.product.update({ where: { id: productId }, data: { updatedAt: new Date() } })
    return color
  })
}
export async function removeColor(productId: string, colorId: string, expectedUpdatedAt: Date) {
  return updateColor(productId, colorId, { isActive: false, expectedUpdatedAt })
}

async function imageScope(tx: Prisma.TransactionClient, productId: string, colorId: string | null, active = true) {
  if (colorId !== null) await requireColor(tx, productId, colorId, active)
  return { productId, colorId }
}
async function normalizePrimary(tx: Prisma.TransactionClient, productId: string, colorId: string | null) {
  const scope = { productId, colorId, isActive: true }
  const active = await tx.productImage.findMany({ where: scope, orderBy: [{ isPrimary: 'desc' }, ...imageOrder] })
  if (active.length) {
    await tx.productImage.updateMany({ where: { ...scope, id: { not: active[0].id } }, data: { isPrimary: false } })
    await tx.productImage.update({ where: { id: active[0].id }, data: { isPrimary: true } })
  }
}
async function appendImageOrder(tx: Prisma.TransactionClient, productId: string, colorId: string | null) {
  const where = { productId, colorId, isActive: true }
  const max = await tx.productImage.aggregate({ where, _max: { sortOrder: true } })
  if (max._max.sortOrder !== MAX_INT) return (max._max.sortOrder ?? -1) + 1
  const images = await tx.productImage.findMany({ where, select: { id: true }, orderBy: imageOrder })
  for (const [sortOrder, image] of images.entries()) await tx.productImage.update({ where: { id: image.id }, data: { sortOrder } })
  return images.length
}
async function checkImageCapacity(tx: Prisma.TransactionClient, productId: string) {
  if (await tx.productImage.count({ where: { productId, isActive: true } }) >= 30) throw new AppError('A product may have at most 30 active images', 409)
}
export async function addImage(productId: string, input: ImageInput | ImageUpload, routeColorId?: string) {
  if (routeColorId && input.colorId !== undefined && input.colorId !== routeColorId) throw new AppError('colorId must match the colour route', 400)
  const colorId = routeColorId ?? input.colorId ?? null
  if ('buffer' in input) {
    await requireProduct(prisma, productId)
    await imageScope(prisma, productId, colorId)
    await checkImageCapacity(prisma, productId)
  }
  return withImageUpload(input, data => transaction(async tx => {
    await requireProduct(tx, productId)
    await imageScope(tx, productId, colorId)
    await checkImageCapacity(tx, productId)
    const count = await tx.productImage.count({ where: { productId, colorId, isActive: true } })
    const sortOrder = data.sortOrder ?? await appendImageOrder(tx, productId, colorId)
    if (!data.url) throw new AppError('An image URL or file is required', 400)
    if (data.isPrimary) await tx.productImage.updateMany({ where: { productId, colorId, isActive: true }, data: { isPrimary: false } })
    const image = await tx.productImage.create({ data: { ...data, url: data.url, productId, colorId, sortOrder, isPrimary: data.isPrimary ?? count === 0 } })
    await normalizePrimary(tx, productId, colorId)
    await tx.product.update({ where: { id: productId }, data: { updatedAt: new Date() } })
    return tx.productImage.findUniqueOrThrow({ where: { id: image.id } })
  }))
}
export async function updateImage(productId: string, imageId: string, input: ImageUpdate | ImageUpload, routeColorId?: string) {
  const preflight = async (tx: Prisma.TransactionClient) => {
    await requireProduct(tx, productId)
    const image = await tx.productImage.findFirst({ where: { id: imageId, productId, isActive: true } })
    if (!image || (routeColorId && image.colorId !== routeColorId)) throw new AppError('Image not found for this product colour', 404)
    if (routeColorId && input.colorId !== undefined && input.colorId !== routeColorId) throw new AppError('Use the product image route to explicitly move an image between galleries', 400)
    const colorId = input.colorId === undefined ? image.colorId : input.colorId
    await imageScope(tx, productId, colorId)
    return { image, colorId }
  }
  if ('buffer' in input) await preflight(prisma)
  const { image: updated, previous } = await withImageUpload(input, data => transaction(async tx => {
    const { image, colorId } = await preflight(tx)
    const moving = colorId !== image.colorId
    const replacing = data.url !== undefined && (data.url !== image.url || data.publicId !== undefined)
    const previous = replacing
      ? await tx.productImage.create({ data: { productId, colorId: image.colorId, url: image.url, publicId: image.publicId, altText: image.altText, sortOrder: image.sortOrder, isPrimary: image.isPrimary, isActive: false, createdAt: image.createdAt } })
      : null
    const count = moving ? await tx.productImage.count({ where: { productId, colorId, isActive: true } }) : 0
    const isPrimary = data.isPrimary ?? (moving ? count === 0 : image.isPrimary)
    if (isPrimary) await tx.productImage.updateMany({ where: { productId, colorId, isActive: true }, data: { isPrimary: false } })
    await tx.productImage.update({ where: { id: imageId }, data: { ...data, colorId, isPrimary, ...(moving && data.sortOrder === undefined ? { sortOrder: await appendImageOrder(tx, productId, colorId) } : {}), ...(replacing ? { publicId: data.publicId ?? null } : {}) } })
    await normalizePrimary(tx, productId, colorId)
    if (moving) await normalizePrimary(tx, productId, image.colorId)
    await tx.product.update({ where: { id: productId }, data: { updatedAt: new Date() } })
    return { image: await tx.productImage.findUniqueOrThrow({ where: { id: imageId } }), previous }
  }))
  if (!previous) return updated
  return { ...updated, assetCleanup: await cleanupImageAsset(previous, previous.id), previousImageId: previous.id }
}
export async function removeImage(productId: string, imageId: string, routeColorId?: string) {
  const image = await transaction(async tx => {
    await requireProduct(tx, productId)
    const image = await tx.productImage.findFirst({ where: { id: imageId, productId } })
    if (!image || (routeColorId && image.colorId !== routeColorId)) throw new AppError('Image not found for this product colour', 404)
    if (image.isActive) {
      await tx.productImage.update({ where: { id: imageId }, data: { isActive: false, isPrimary: false } })
      await normalizePrimary(tx, productId, image.colorId)
      await tx.product.update({ where: { id: productId }, data: { updatedAt: new Date() } })
    }
    return image
  })
  return { removed: true, preserved: true, assetCleanup: await cleanupImageAsset(image, imageId) }
}
export async function reorderImages(productId: string, input: ImageOrder, routeColorId?: string) {
  return transaction(async tx => {
    await requireProduct(tx, productId)
    if (routeColorId && input.colorId !== undefined && input.colorId !== routeColorId) throw new AppError('colorId must match the colour route', 400)
    // An old product-wide request is accepted only while there are no active
    // colour-specific images. Reject mixed galleries rather than corrupt order.
    if (routeColorId === undefined && input.colorId === undefined && await tx.productImage.count({ where: { productId, colorId: { not: null }, isActive: true } })) {
      throw new AppError('Colour galleries require an explicit colorId or colour-scoped reorder route', 409)
    }
    const colorId = routeColorId ?? input.colorId ?? null
    await imageScope(tx, productId, colorId, false)
    const images = await tx.productImage.findMany({ where: { productId, colorId, isActive: true }, select: { id: true } })
    const expected = new Set(images.map(image => image.id))
    if (input.imageIds.length !== expected.size || new Set(input.imageIds).size !== expected.size || input.imageIds.some(imageId => !expected.has(imageId))) {
      throw new AppError('imageIds must include every active image for this gallery exactly once', 400)
    }
    for (const [sortOrder, imageId] of input.imageIds.entries()) await tx.productImage.update({ where: { id: imageId }, data: { sortOrder } })
    await tx.product.update({ where: { id: productId }, data: { updatedAt: new Date() } })
    return tx.productImage.findMany({ where: { productId, colorId, isActive: true }, orderBy: imageOrder })
  })
}

export async function addVariant(productId: string, input: VariantInput, actorId: string) {
  return transaction(async tx => {
    const product = await requireProduct(tx, productId)
    const variant = await createVariantRecord(tx, productId, input, actorId, 'Initial stock on variant creation')
    await tx.product.update({ where: { id: productId }, data: { updatedAt: new Date() } })
    return serializeVariant(variant, product.priceCents, true, await runningPromotions(tx, productId, variant.id))
  })
}
export async function updateVariant(productId: string, variantId: string, input: VariantUpdate) {
  return transaction(async tx => {
    const product = await requireProduct(tx, productId)
    const current = await tx.productVariant.findFirst({ where: { id: variantId, productId } })
    if (!current) throw new AppError('Variant not found for this product', 404)
    const { expectedUpdatedAt, ...data } = input
    if (data.isActive === false && !expectedUpdatedAt) throw new AppError('Variant deactivation requires its original expectedUpdatedAt revision', 400)
    checkRevision(current.updatedAt, expectedUpdatedAt)
    if (data.colorHex !== undefined && data.colorHex !== current.colorHex && data.colorHex !== '' && !/^#[0-9a-fA-F]{6}$/.test(data.colorHex)) {
      throw new AppError('New colorHex values must be #RRGGBB or empty; unchanged legacy swatches are retained', 400)
    }
    // Validate ownership even for an unversioned request, without creating colours
    // or mutating a preserved association before the concurrency gate below.
    const selectedColor = data.colorId === undefined ? undefined : await requireColor(tx, productId, data.colorId)
    const changesMetadata = (Object.keys(data) as (keyof typeof data)[]).some(key => data[key] !== undefined && data[key] !== current[key])
    if (changesMetadata && !expectedUpdatedAt) {
      throw new AppError('Variant edits require their original expectedUpdatedAt revision; unchanged legacy metadata is accepted, but a stale product draft cannot overwrite current options', 409)
    }
    const changingId = data.colorId !== undefined && data.colorId !== current.colorId
    const sameName = data.colorName === undefined || data.colorName === current.colorName
    const sameSelection = sameName && (current.colorId === null
      ? selectedColor?.name === current.colorName
      : data.colorId === undefined || data.colorId === current.colorId)
    const requireActive = (data.isActive === true && !current.isActive) || ((!sameSelection || current.colorId === null) && (data.isActive ?? current.isActive))
    const color = sameSelection
      ? await requireColor(tx, productId, current.colorId ?? selectedColor!.id, requireActive).then(color => ({
        colorId: color.id, colorName: current.colorName, colorHex: data.colorHex ?? current.colorHex,
      }))
      : await resolveVariantColor(tx, productId, {
        colorId: data.colorId,
        colorName: data.colorName ?? (data.colorId === undefined ? current.colorName : undefined),
        // Linking/renaming a legacy row must not erase its retained swatch. A
        // deliberate different-colour association can inherit its destination.
        colorHex: data.colorHex ?? (changingId ? undefined : current.colorHex),
      }, requireActive)
    const colorActive = (await requireColor(tx, productId, color.colorId)).isActive
    const promotions = await runningPromotions(tx, productId, variantId)
    // Ordinary legacy drawer saves resend every field. Idempotent round-trips
    // leave both the variant and its revision untouched, including old swatches.
    if (!changesMetadata && current.colorId !== null) return serializeVariant(current, product.priceCents, colorActive, promotions)
    const updated = await tx.productVariant.update({ where: { id: variantId }, data: { ...data, ...color, updatedAt: nextRevision(current.updatedAt) } })
    await tx.product.update({ where: { id: productId }, data: { updatedAt: new Date() } })
    return serializeVariant(updated, product.priceCents, colorActive, promotions)
  })
}
export async function removeVariant(productId: string, variantId: string, expectedUpdatedAt: Date) {
  return updateVariant(productId, variantId, { isActive: false, expectedUpdatedAt })
}
