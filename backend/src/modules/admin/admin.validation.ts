import { AppError } from '../../errors/app-error.js'
import * as v from '../../utils/validation.js'
import type { DashboardQuery } from './admin.types.js'

export function parseDashboardQuery(input: unknown): DashboardQuery {
  const query = v.object(input, ['from', 'to', 'currency', 'groupBy', 'limit'])
  const to = query.to === undefined ? new Date() : v.date(query.to, 'to')
  const defaultFrom = new Date(to)
  defaultFrom.setUTCDate(defaultFrom.getUTCDate() - 29)
  defaultFrom.setUTCHours(0, 0, 0, 0)
  const from = query.from === undefined ? defaultFrom : v.date(query.from, 'from')
  if (from > to) throw new AppError('from must not be after to', 400)
  if (to.getTime() - from.getTime() > 366 * 24 * 60 * 60 * 1000) throw new AppError('Dashboard date range must not exceed 366 days', 400)
  const currency = query.currency === undefined ? 'USD' : v.text(query.currency, 'currency', 3).toUpperCase()
  if (!/^[A-Z]{3}$/.test(currency)) throw new AppError('currency must be a three-letter currency code', 400)
  const groupBy = query.groupBy === undefined ? 'day' : v.enumeration(query.groupBy, 'groupBy', ['day', 'week', 'month'])
  // Bucket guard: the 366-day range cap above already bounds bucket counts
  // (day ≤ 367, week ≤ 53, month ≤ 13); this pins that invariant explicitly.
  const days = Math.ceil((to.getTime() - from.getTime()) / 86_400_000) + 1
  const buckets = groupBy === 'day' ? days : groupBy === 'week' ? Math.ceil(days / 7) : Math.ceil(days / 31)
  if (buckets > 400) throw new AppError('Dashboard range must not produce more than 400 buckets; widen groupBy or narrow the range', 400)
  return {
    from, to, currency, groupBy,
    limit: v.queryInteger(query.limit, 'limit', 1, 20) ?? 5,
  }
}
