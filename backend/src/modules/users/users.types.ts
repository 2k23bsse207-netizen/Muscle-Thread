import type { PaginationInput } from '../../utils/pagination.js'

export type CustomerQuery = PaginationInput & {
  q?: string
  emailVerified?: boolean
  from?: Date
  to?: Date
  sortBy: 'createdAt' | 'name' | 'email'
  sortOrder: 'asc' | 'desc'
}
