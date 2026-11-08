import type { CategoryStatus } from '../../generated/prisma/enums.js'
import type { PaginationInput } from '../../utils/pagination.js'

export type CategoryInput = {
  name: string
  slug: string
  description?: string | null
  imageUrl?: string | null
  bannerUrl?: string | null
  status?: CategoryStatus
  sortOrder?: number
  seoTitle?: string | null
  seoDescription?: string | null
}
export type CategoryUpdate = Partial<CategoryInput>
export type CategoryQuery = PaginationInput & {
  q?: string
  status?: CategoryStatus
  sortBy: 'sortOrder' | 'name' | 'createdAt' | 'updatedAt'
  sortOrder: 'asc' | 'desc'
}
export type CategorySort = { id: string; sortOrder: number }
