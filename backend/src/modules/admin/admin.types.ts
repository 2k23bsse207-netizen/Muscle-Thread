export type DashboardQuery = {
  from: Date
  to: Date
  currency: string
  groupBy: 'day' | 'week' | 'month'
  limit: number
}
export type SalesBucket = {
  date: string
  orders: number
  paidOrders: number
  grossRevenueCents: number
  refundedCents: number
  revenueCents: number
}
