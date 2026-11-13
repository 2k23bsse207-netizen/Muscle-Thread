import { AppError } from '../../errors/app-error.js'
import { Gender, ProductFit, ProductStatus, ProductTag } from '../../generated/prisma/enums.js'
import { MAX_IMAGE_BYTES } from '../../services/cloudinary.service.js'
import { parsePagination } from '../../utils/pagination.js'
import * as v from '../../utils/validation.js'
import type { ColorCreateInput, ColorInput, ColorUpdate, ImageInput, ImageOrder, ImageUpdate, ImageUpload, ProductInput, ProductQuery, ProductUpdate, VariantInput, VariantRemoval, VariantUpdate } from './products.types.js'

const productFields = ['sku', 'name', 'slug', 'categoryId', 'priceCents', 'description', 'mrpCents', 'collections', 'tags', 'gender', 'material', 'fit', 'features', 'careInstructions', 'status', 'seoTitle', 'seoDescription'] as const
const colorFields = ['name', 'hex', 'sortOrder', 'isActive'] as const
const imageFields = ['url', 'colorId', 'altText', 'sortOrder', 'isPrimary'] as const
const variantFields = ['sku', 'colorId', 'size', 'colorName', 'colorHex', 'priceCents', 'stock', 'lowStockThreshold'] as const

function parseHex(input: unknown, field: string): string {
  const hex = v.text(input, field, 7, true)
  if (hex && !/^#[0-9a-fA-F]{6}$/.test(hex)) throw new AppError(`${field} must be #RRGGBB or empty`, 400)
  return hex
}

function parseProductFields(body: v.Fields): ProductUpdate {
  const result: ProductUpdate = {}
  if ('sku' in body) result.sku = v.text(body.sku, 'sku', 120)
  if ('name' in body) result.name = v.text(body.name, 'name', 200)
  if ('slug' in body) result.slug = v.slug(body.slug)
  if ('categoryId' in body) result.categoryId = v.id(body.categoryId, 'categoryId')
  if ('priceCents' in body) result.priceCents = v.integer(body.priceCents, 'priceCents')
  if ('mrpCents' in body) result.mrpCents = body.mrpCents === null ? null : v.integer(body.mrpCents, 'mrpCents')
  if ('description' in body) result.description = v.nullableText(body.description, 'description', 10000)
  if ('collections' in body) result.collections = v.texts(body.collections, 'collections')
  if ('tags' in body) {
    result.tags = v.array(body.tags, 'tags', item => v.enumeration(item, 'tag', Object.values(ProductTag)), 4)
    if (new Set(result.tags).size !== result.tags.length) throw new AppError('tags must not contain duplicates', 400)
  }
  if ('gender' in body) result.gender = v.enumeration(body.gender, 'gender', Object.values(Gender))
  if ('fit' in body) result.fit = body.fit === null ? null : v.enumeration(body.fit, 'fit', Object.values(ProductFit))
  if ('material' in body) result.material = v.nullableText(body.material, 'material', 500)
  if ('features' in body) result.features = v.texts(body.features, 'features', 50, 500)
  if ('careInstructions' in body) result.careInstructions = v.nullableText(body.careInstructions, 'careInstructions', 5000)
  if ('status' in body) result.status = v.enumeration(body.status, 'status', Object.values(ProductStatus))
  if ('seoTitle' in body) result.seoTitle = v.nullableText(body.seoTitle, 'seoTitle', 200)
  if ('seoDescription' in body) result.seoDescription = v.nullableText(body.seoDescription, 'seoDescription', 500)
  return result
}

export function parseColor(input: unknown, partial = false): ColorInput | ColorUpdate {
  const body = v.object(input, partial ? [...colorFields, 'expectedUpdatedAt'] : colorFields)
  v.nonempty(body)
  const result: ColorUpdate = {}
  if (!partial || 'name' in body) result.name = v.text(body.name, 'name', 80)
  if ('hex' in body) result.hex = body.hex === null ? null : parseHex(body.hex, 'hex') || null
  if ('sortOrder' in body) result.sortOrder = v.integer(body.sortOrder, 'sortOrder')
  if ('isActive' in body) result.isActive = v.boolean(body.isActive, 'isActive')
  if ('expectedUpdatedAt' in body) result.expectedUpdatedAt = v.date(body.expectedUpdatedAt, 'expectedUpdatedAt')
  if (partial && result.isActive === false && !result.expectedUpdatedAt) {
    throw new AppError('Colour deactivation requires its original expectedUpdatedAt revision', 400)
  }
  if (partial && Object.keys(result).every(key => key === 'expectedUpdatedAt')) throw new AppError('At least one colour field is required', 400)
  return result
}

export function parseRemoval(input: unknown): VariantRemoval {
  const body = v.object(input ?? {}, ['expectedUpdatedAt'])
  return { expectedUpdatedAt: v.date(body.expectedUpdatedAt, 'expectedUpdatedAt') }
}

export function parseImage(input: unknown, partial = false): ImageInput | ImageUpdate {
  const body = v.object(input, imageFields)
  v.nonempty(body)
  const result: ImageUpdate = {}
  if (!partial || 'url' in body) result.url = v.httpUrl(body.url, 'url')
  if ('colorId' in body) result.colorId = body.colorId === null ? null : v.id(body.colorId, 'colorId')
  if ('altText' in body) result.altText = v.nullableText(body.altText, 'altText', 500)
  if ('sortOrder' in body) result.sortOrder = v.integer(body.sortOrder, 'sortOrder')
  if ('isPrimary' in body) result.isPrimary = v.boolean(body.isPrimary, 'isPrimary')
  return result
}

export function parseImageUpload(input: unknown, metadata: unknown): ImageUpload {
  const query = v.object(metadata, ['colorId', 'altText', 'sortOrder', 'isPrimary'])
  if (!Buffer.isBuffer(input) || input.length === 0) throw new AppError('An image file is required', 400)
  if (input.length > MAX_IMAGE_BYTES) throw new AppError('Image exceeds 5MB limit', 413)
  return {
    buffer: input,
    ...('colorId' in query ? { colorId: query.colorId === null || query.colorId === '' ? null : v.id(query.colorId, 'colorId') } : {}),
    ...('altText' in query ? { altText: v.nullableText(query.altText, 'altText', 500) } : {}),
    ...('sortOrder' in query ? { sortOrder: v.queryInteger(query.sortOrder, 'sortOrder') } : {}),
    ...('isPrimary' in query ? { isPrimary: v.queryBoolean(query.isPrimary, 'isPrimary') } : {}),
  }
}

// Existing option strings are exact identities, including legacy spacing/blank
// names and sizes. Creation keeps its existing normalization; PATCH must compare
// a returned original value without silently assigning it to a trimmed group.
function parseVariantText(input: unknown, field: string, max: number, partial: boolean, allowEmpty = false): string {
  if (!partial) return v.text(input, field, max, allowEmpty)
  if (typeof input !== 'string' || (!allowEmpty && !input) || input.length > max) {
    throw new AppError(`${field} must be ${allowEmpty ? '0' : '1'}–${max} characters`, 400)
  }
  return input
}

export function parseVariant(input: unknown, partial = false): VariantInput | VariantUpdate {
  const body = v.object(input, partial ? [...variantFields.filter(key => key !== 'stock'), 'isActive', 'expectedUpdatedAt'] : variantFields)
  v.nonempty(body)
  const result: VariantUpdate & { stock?: number } = {}
  if (!partial || 'sku' in body) result.sku = parseVariantText(body.sku, 'sku', 120, partial)
  if ('colorId' in body) result.colorId = v.id(body.colorId, 'colorId')
  if ('size' in body) result.size = parseVariantText(body.size, 'size', 40, partial, true)
  if ('colorName' in body) result.colorName = parseVariantText(body.colorName, 'colorName', 80, partial, true)
  if ('colorHex' in body) {
    // PATCH can echo an unchanged invalid/whitespace-bearing legacy swatch.
    // The service compares the original value and validates any actual edit.
    if (partial) {
      if (typeof body.colorHex !== 'string') throw new AppError('colorHex must be a string', 400)
      result.colorHex = body.colorHex
    } else result.colorHex = parseHex(body.colorHex, 'colorHex')
  }
  if ('priceCents' in body) result.priceCents = body.priceCents === null ? null : v.integer(body.priceCents, 'priceCents')
  if ('stock' in body) result.stock = v.integer(body.stock, 'stock')
  if ('lowStockThreshold' in body) result.lowStockThreshold = v.integer(body.lowStockThreshold, 'lowStockThreshold')
  if ('isActive' in body) result.isActive = v.boolean(body.isActive, 'isActive')
  if ('expectedUpdatedAt' in body) result.expectedUpdatedAt = v.date(body.expectedUpdatedAt, 'expectedUpdatedAt')
  if (partial && result.isActive === false && !result.expectedUpdatedAt) {
    throw new AppError('Variant deactivation requires its original expectedUpdatedAt revision; omission from a product draft is not deletion intent', 400)
  }
  if (partial && Object.keys(result).every(key => key === 'expectedUpdatedAt')) throw new AppError('At least one variant field is required', 400)
  return result
}

function checkPrimary(images: ImageInput[]): void {
  if (images.filter(image => image.isPrimary).length > 1) throw new AppError('Only one image per gallery may be primary', 400)
}

function parseColorCreate(input: unknown): ColorCreateInput {
  const body = v.object(input, [...colorFields, 'images', 'variants'])
  const color = parseColor(Object.fromEntries(Object.entries(body).filter(([key]) => colorFields.includes(key as typeof colorFields[number])))) as ColorInput
  const images = 'images' in body ? v.array(body.images, 'images', item => {
    const image = parseImage(item) as ImageInput
    if (image.colorId !== undefined) throw new AppError('Nested images inherit their colour; do not supply colorId', 400)
    return image
  }, 30) : undefined
  if (images) checkPrimary(images)
  const variants = 'variants' in body ? v.array(body.variants, 'variants', item => {
    const fields = v.object(item, variantFields.filter(key => !['colorId', 'colorName', 'colorHex'].includes(key)))
    return parseVariant(fields) as VariantInput
  }, 200) : undefined
  return { ...color, images, variants }
}

export function parseCreateProduct(input: unknown): ProductInput {
  const body = v.object(input, [...productFields, 'images', 'variants', 'colors'])
  const result = {
    ...parseProductFields(body),
    sku: v.text(body.sku, 'sku', 120),
    name: v.text(body.name, 'name', 200),
    slug: v.slug(body.slug),
    categoryId: v.id(body.categoryId, 'categoryId'),
    priceCents: v.integer(body.priceCents, 'priceCents'),
  }
  const images = 'images' in body ? v.array(body.images, 'images', item => parseImage(item) as ImageInput, 30) : undefined
  if (images) {
    checkPrimary(images)
    if (images.some(image => image.colorId != null)) throw new AppError('New product images cannot reference another product colour; use nested colors', 400)
  }
  const variants = 'variants' in body ? v.array(body.variants, 'variants', item => parseVariant(item) as VariantInput, 200) : undefined
  if (variants?.some(variant => variant.colorId)) throw new AppError('New product variants cannot reference another product colour; use nested colors', 400)
  const colors = 'colors' in body ? v.array(body.colors, 'colors', parseColorCreate, 200) : undefined
  if (colors && new Set(colors.map(color => color.name)).size !== colors.length) throw new AppError('Duplicate product colour names', 400)
  const allVariants = [
    ...(variants ?? []),
    ...(colors ?? []).flatMap(color => (color.variants ?? []).map(variant => ({ ...variant, colorName: color.name }))),
  ]
  if (allVariants.length > 200) throw new AppError('A product may have at most 200 initial variants', 400)
  if ((images?.length ?? 0) + (colors ?? []).reduce((sum, color) => sum + (color.images?.length ?? 0), 0) > 30) {
    throw new AppError('A product may have at most 30 initial images', 400)
  }
  const options = allVariants.map(variant => JSON.stringify([variant.size ?? '', variant.colorName ?? '']))
  if (new Set(options).size !== options.length) throw new AppError('Duplicate size/color variant options', 400)
  if (new Set(allVariants.map(variant => variant.sku)).size !== allVariants.length) throw new AppError('Duplicate variant SKUs', 400)
  return { ...result, images, variants, colors }
}

export function parseUpdateProduct(input: unknown): ProductUpdate {
  const body = v.object(input, productFields)
  v.nonempty(body)
  return parseProductFields(body)
}

export function parseProductQuery(input: unknown): ProductQuery {
  const query = v.object(input, ['page', 'limit', 'q', 'search', 'categoryId', 'categorySlug', 'status', 'tags', 'gender', 'fit', 'collection', 'minPriceCents', 'maxPriceCents', 'inStock', 'size', 'colorName', 'colorId', 'sortBy', 'sortOrder'])
  if (query.q !== undefined && query.search !== undefined) throw new AppError('Use q or search, not both', 400)
  const result: ProductQuery = {
    ...parsePagination(query),
    q: v.queryText(query.q ?? query.search, 'q', 200),
    categoryId: v.queryText(query.categoryId, 'categoryId', 191),
    categorySlug: v.queryText(query.categorySlug, 'categorySlug', 180),
    status: query.status === undefined ? undefined : v.enumeration(query.status, 'status', Object.values(ProductStatus)),
    gender: query.gender === undefined ? undefined : v.enumeration(query.gender, 'gender', Object.values(Gender)),
    fit: query.fit === undefined ? undefined : v.enumeration(query.fit, 'fit', Object.values(ProductFit)),
    collection: v.queryText(query.collection, 'collection', 120),
    minPriceCents: v.queryInteger(query.minPriceCents, 'minPriceCents'),
    maxPriceCents: v.queryInteger(query.maxPriceCents, 'maxPriceCents'),
    inStock: v.queryBoolean(query.inStock, 'inStock'),
    size: v.queryText(query.size, 'size', 40),
    colorName: v.queryText(query.colorName, 'colorName', 80),
    colorId: v.queryText(query.colorId, 'colorId', 191),
    sortBy: query.sortBy === undefined ? 'createdAt' : v.enumeration(query.sortBy, 'sortBy', ['createdAt', 'updatedAt', 'name', 'priceCents']),
    sortOrder: query.sortOrder === undefined ? 'desc' : v.enumeration(query.sortOrder, 'sortOrder', ['asc', 'desc']),
  }
  if (query.tags !== undefined) {
    result.tags = v.text(query.tags, 'tags', 100).split(',').map(tag => v.enumeration(tag.trim(), 'tag', Object.values(ProductTag)))
    if (new Set(result.tags).size !== result.tags.length) throw new AppError('Duplicate tags filter', 400)
  }
  if (result.minPriceCents !== undefined && result.maxPriceCents !== undefined && result.minPriceCents > result.maxPriceCents) {
    throw new AppError('minPriceCents must not exceed maxPriceCents', 400)
  }
  return result
}

export function parseImageOrder(input: unknown): ImageOrder {
  const body = v.object(input, ['imageIds', 'colorId'])
  const ids = v.texts(body.imageIds, 'imageIds', 1000, 191)
  if (!ids.length) throw new AppError('imageIds must not be empty', 400)
  return {
    imageIds: ids,
    ...('colorId' in body ? { colorId: body.colorId === null ? null : v.id(body.colorId, 'colorId') } : {}),
  }
}
