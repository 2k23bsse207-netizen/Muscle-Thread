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
export type CreateOrderInput = {
  items: { variantId: string; quantity: number }[]
  shippingName: string
  shippingLine1: string
  shippingLine2?: string | null
  shippingCity: string
  shippingState?: string | null
  shippingPostal: string
  shippingCountry: string
  shippingPhone?: string | null
}
export const PAID_ORDER_STATUSES: OrderStatus[] = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED']
