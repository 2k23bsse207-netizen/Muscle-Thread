import type { DiscountType } from '../../generated/prisma/enums.js'
import type { PaginationInput } from '../../utils/pagination.js'

export type DiscountInput = {
  code: string
  type: DiscountType
  value: number
  active?: boolean
  startsAt?: Date | null
  endsAt?: Date | null
  usageLimit?: number | null
}
export type DiscountUpdate = Partial<DiscountInput>
export type DiscountQuery = PaginationInput & {
  q?: string
  active?: boolean
  state?: 'AVAILABLE' | 'INACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'EXHAUSTED'
  sortBy: 'createdAt' | 'code' | 'endsAt' | 'usedCount'
  sortOrder: 'asc' | 'desc'
}
export type DiscountValidationInput = { code: string; subtotalCents: number }
