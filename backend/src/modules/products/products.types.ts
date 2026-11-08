import type { Gender, ProductFit, ProductStatus, ProductTag } from '../../generated/prisma/enums.js'
import type { PaginationInput } from '../../utils/pagination.js'

export type ProductQuery = PaginationInput & {
  q?: string
  categoryId?: string
  categorySlug?: string
  status?: ProductStatus
  tags?: ProductTag[]
  gender?: Gender
  fit?: ProductFit
  collection?: string
  minPriceCents?: number
  maxPriceCents?: number
  inStock?: boolean
  size?: string
  colorName?: string
  sortBy: 'createdAt' | 'updatedAt' | 'name' | 'priceCents'
  sortOrder: 'asc' | 'desc'
}

export type ImageInput = { url: string; altText?: string | null; sortOrder?: number; isPrimary?: boolean }
export type ImageUpdate = Partial<ImageInput>
export type VariantInput = {
  sku: string
  size?: string
  colorName?: string
  colorHex?: string
  priceCents?: number | null
  stock?: number
  lowStockThreshold?: number
}
export type VariantUpdate = Partial<Omit<VariantInput, 'stock'>> & { isActive?: boolean }

export type ProductInput = {
  sku: string
  name: string
  slug: string
  categoryId: string
  priceCents: number
  description?: string | null
  mrpCents?: number | null
  collections?: string[]
  tags?: ProductTag[]
  gender?: Gender
  material?: string | null
  fit?: ProductFit | null
  features?: string[]
  careInstructions?: string | null
  status?: ProductStatus
  seoTitle?: string | null
  seoDescription?: string | null
  images?: ImageInput[]
  variants?: VariantInput[]
}
export type ProductUpdate = Partial<Omit<ProductInput, 'images' | 'variants'>>
