import type { PromotionType } from '../../generated/prisma/enums.js'
import type { PaginationInput } from '../../utils/pagination.js'

/** One row of a promotion's scope: exactly one of productId / variantId, with
 * an optional discount override (null = use the campaign-wide value). */
export type PromotionTargetInput = { productId: string | null; variantId: string | null; value: number | null }
export type PromotionInput = {
  name: string
  marquee: string | null
  type: PromotionType
  value: number
  active: boolean
  startsAt: Date | null
  endsAt: Date | null
  targets: PromotionTargetInput[]
}
// Targets are editable after creation: sending them replaces the whole scope.
export type PromotionUpdate = Partial<Omit<PromotionInput, 'targets'>> & { targets?: PromotionTargetInput[] }
export type PromotionQuery = PaginationInput & {
  q?: string
  active?: boolean
  state?: 'ACTIVE' | 'INACTIVE' | 'SCHEDULED' | 'EXPIRED'
  productId?: string
  variantId?: string
  sortBy: 'createdAt' | 'name' | 'endsAt'
  sortOrder: 'asc' | 'desc'
}
export type QuoteInput = {
  items: { variantId: string; quantity: number }[]
  /** Unsaved campaign from the drawer, priced as if it were running. */
  draft?: DraftPromotion
}
/** The campaign being composed in the drawer: same pricing rules as a saved
 * promotion, without a name requirement or window gating. */
export type DraftPromotion = {
  id?: string
  name: string
  type: PromotionType
  value: number
  startsAt: Date | null
  targets: PromotionTargetInput[]
}
