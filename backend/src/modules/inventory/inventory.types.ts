import type { InventoryMovementType } from '../../generated/prisma/enums.js'
import type { PaginationInput } from '../../utils/pagination.js'

export type InventoryQuery = PaginationInput & {
  q?: string
  productId?: string
  categoryId?: string
  lowStock?: boolean
  outOfStock?: boolean
  sortBy: 'stock' | 'sku' | 'updatedAt'
  sortOrder: 'asc' | 'desc'
}
export type StockAdjustment = {
  delta?: number
  stock?: number
  expectedStock?: number
  type: InventoryMovementType
  reason: string
}
export type InventoryUpdate = { lowStockThreshold: number }
