import { AppError } from '../../errors/app-error.js'
import { Gender, ProductFit, ProductStatus, ProductTag } from '../../generated/prisma/enums.js'
import { parsePagination } from '../../utils/pagination.js'
import * as v from '../../utils/validation.js'
import type { ImageInput, ImageUpdate, ProductInput, ProductQuery, ProductUpdate, VariantInput, VariantUpdate } from './products.types.js'

const productFields = ['sku', 'name', 'slug', 'categoryId', 'priceCents', 'description', 'mrpCents', 'collections', 'tags', 'gender', 'material', 'fit', 'features', 'careInstructions', 'status', 'seoTitle', 'seoDescription'] as const
const imageFields = ['url', 'altText', 'sortOrder', 'isPrimary'] as const
const variantFields = ['sku', 'size', 'colorName', 'colorHex', 'priceCents', 'stock', 'lowStockThreshold'] as const

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

export function parseImage(input: unknown, partial = false): ImageInput | ImageUpdate {
  const body = v.object(input, imageFields)
  v.nonempty(body)
  const result: ImageUpdate = {}
  if (!partial || 'url' in body) result.url = v.httpUrl(body.url, 'url')
  if ('altText' in body) result.altText = v.nullableText(body.altText, 'altText', 500)
  if ('sortOrder' in body) result.sortOrder = v.integer(body.sortOrder, 'sortOrder')
  if ('isPrimary' in body) result.isPrimary = v.boolean(body.isPrimary, 'isPrimary')
  return result
}

export function parseVariant(input: unknown, partial = false): VariantInput | VariantUpdate {
  const body = v.object(input, partial ? [...variantFields.filter(key => key !== 'stock'), 'isActive'] : variantFields)
  v.nonempty(body)
  const result: Partial<VariantInput> & { isActive?: boolean } = {}
  if (!partial || 'sku' in body) result.sku = v.text(body.sku, 'sku', 120)
  if ('size' in body) result.size = v.text(body.size, 'size', 40, true)
  if ('colorName' in body) result.colorName = v.text(body.colorName, 'colorName', 80, true)
  if ('colorHex' in body) {
    const hex = v.text(body.colorHex, 'colorHex', 7, true)
    if (hex && !/^#[0-9a-fA-F]{6}$/.test(hex)) throw new AppError('colorHex must be #RRGGBB or empty', 400)
    result.colorHex = hex
  }
  if ('priceCents' in body) result.priceCents = body.priceCents === null ? null : v.integer(body.priceCents, 'priceCents')
  if ('stock' in body) result.stock = v.integer(body.stock, 'stock')
  if ('lowStockThreshold' in body) result.lowStockThreshold = v.integer(body.lowStockThreshold, 'lowStockThreshold')
  if ('isActive' in body) result.isActive = v.boolean(body.isActive, 'isActive')
  return result
}

export function parseCreateProduct(input: unknown): ProductInput {
  const body = v.object(input, [...productFields, 'images', 'variants'])
  const result = {
    ...parseProductFields(body),
    sku: v.text(body.sku, 'sku', 120),
    name: v.text(body.name, 'name', 200),
    slug: v.slug(body.slug),
    categoryId: v.id(body.categoryId, 'categoryId'),
    priceCents: v.integer(body.priceCents, 'priceCents'),
  }
  const images = 'images' in body ? v.array(body.images, 'images', item => parseImage(item) as ImageInput, 30) : undefined
  if (images && images.filter(image => image.isPrimary).length > 1) throw new AppError('Only one image may be primary', 400)
  const variants = 'variants' in body ? v.array(body.variants, 'variants', item => parseVariant(item) as VariantInput, 200) : undefined
  if (variants) {
    const options = variants.map(variant => JSON.stringify([variant.size ?? '', variant.colorName ?? '']))
    if (new Set(options).size !== options.length) throw new AppError('Duplicate size/color variant options', 400)
    if (new Set(variants.map(variant => variant.sku)).size !== variants.length) throw new AppError('Duplicate variant SKUs', 400)
  }
  return { ...result, images, variants }
}

export function parseUpdateProduct(input: unknown): ProductUpdate {
  const body = v.object(input, productFields)
  v.nonempty(body)
  return parseProductFields(body)
}

export function parseProductQuery(input: unknown): ProductQuery {
  const query = v.object(input, ['page', 'limit', 'q', 'search', 'categoryId', 'categorySlug', 'status', 'tags', 'gender', 'fit', 'collection', 'minPriceCents', 'maxPriceCents', 'inStock', 'size', 'colorName', 'sortBy', 'sortOrder'])
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

export function parseImageOrder(input: unknown): string[] {
  const body = v.object(input, ['imageIds'])
  const ids = v.texts(body.imageIds, 'imageIds', 30, 191)
  if (!ids.length) throw new AppError('imageIds must not be empty', 400)
  return ids
}
