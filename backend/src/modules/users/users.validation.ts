import { AppError } from '../../errors/app-error.js'
import { parsePagination } from '../../utils/pagination.js'
import * as v from '../../utils/validation.js'
import type { CustomerQuery } from './users.types.js'

export function parseCustomerQuery(input: unknown): CustomerQuery {
  const query = v.object(input, ['page', 'limit', 'q', 'search', 'emailVerified', 'from', 'to', 'sortBy', 'sortOrder'])
  if (query.q !== undefined && query.search !== undefined) throw new AppError('Use q or search, not both', 400)
  const result: CustomerQuery = {
    ...parsePagination(query),
    q: v.queryText(query.q ?? query.search, 'q', 200),
    emailVerified: v.queryBoolean(query.emailVerified, 'emailVerified'),
    from: query.from === undefined ? undefined : v.date(query.from, 'from'),
    to: query.to === undefined ? undefined : v.date(query.to, 'to'),
    sortBy: query.sortBy === undefined ? 'createdAt' : v.enumeration(query.sortBy, 'sortBy', ['createdAt', 'name', 'email']),
    sortOrder: query.sortOrder === undefined ? 'desc' : v.enumeration(query.sortOrder, 'sortOrder', ['asc', 'desc']),
  }
  if (result.from && result.to && result.from > result.to) throw new AppError('from must not be after to', 400)
  return result
}
