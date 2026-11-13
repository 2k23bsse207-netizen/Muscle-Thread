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
  colorId?: string
  sortBy: 'createdAt' | 'updatedAt' | 'name' | 'priceCents'
  sortOrder: 'asc' | 'desc'
}

export type ColorInput = { name: string; hex?: string | null; sortOrder?: number; isActive?: boolean }
export type ColorUpdate = Partial<ColorInput> & { expectedUpdatedAt?: Date }
export type VariantRemoval = { expectedUpdatedAt: Date }

// Null means the retained product-level/shared gallery. IDs come from product
// colour responses, never from Cloudinary or a client-generated asset handle.
export type ImageMetadata = { colorId?: string | null; altText?: string | null; sortOrder?: number; isPrimary?: boolean }
export type ImageInput = ImageMetadata & { url: string }
export type ImageUpload = ImageMetadata & { buffer: Buffer }
export type ImageUpdate = Partial<ImageInput>
export type ImageOrder = { imageIds: string[]; colorId?: string | null }
export type VariantInput = {
  sku: string
  colorId?: string
  size?: string
  colorName?: string
  colorHex?: string
  priceCents?: number | null
  // Initial stock only; metadata updates cannot carry stock.
  stock?: number
  lowStockThreshold?: number
}
// A changed field requires the original revision. Unchanged legacy metadata can
// still round-trip without it, but cannot overwrite a concurrent edit.
export type VariantUpdate = Partial<Omit<VariantInput, 'stock'>> & { isActive?: boolean; expectedUpdatedAt?: Date }
// Nested creation creates exactly these sizes, never a Cartesian option matrix.
export type ColorCreateInput = ColorInput & {
  images?: ImageInput[]
  variants?: Omit<VariantInput, 'colorId' | 'colorName' | 'colorHex'>[]
}

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
  colors?: ColorCreateInput[]
}
// Ordinary saves are scalar-only. Explicit child routes never infer deletion
// from a missing array entry or route inventory through a product update.
export type ProductUpdate = Partial<Omit<ProductInput, 'images' | 'variants' | 'colors'>>
