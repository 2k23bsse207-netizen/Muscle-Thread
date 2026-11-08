import type { OrderStatus } from '../../generated/prisma/enums.js'
import type { PaginationInput } from '../../utils/pagination.js'

export type OrderQuery = PaginationInput & {
  q?: string
  status?: OrderStatus
  userId?: string
  from?: Date
  to?: Date
  sortBy: 'createdAt' | 'updatedAt' | 'totalCents' | 'orderNumber'
  sortOrder: 'asc' | 'desc'
}
export type OrderStatusInput = { status: OrderStatus; expectedStatus?: OrderStatus; note?: string | null }
export const PAID_ORDER_STATUSES: OrderStatus[] = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED']
