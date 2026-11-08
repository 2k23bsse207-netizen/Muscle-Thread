import type { Response } from 'express'
import { queryInteger } from './validation.js'

export type PaginationInput = { page: number; limit: number }
export type Pagination = PaginationInput & { total: number; totalPages: number }
export type Page<T> = { data: T[]; pagination: Pagination }

export function parsePagination(query: Record<string, unknown>): PaginationInput {
  return {
    page: queryInteger(query.page, 'page', 1, 1_000_000) ?? 1,
    limit: queryInteger(query.limit, 'limit', 1, 100) ?? 20,
  }
}

export function offset(input: PaginationInput): { skip: number; take: number } {
  return { skip: (input.page - 1) * input.limit, take: input.limit }
}

export function page<T>(data: T[], total: number, input: PaginationInput): Page<T> {
  return { data, pagination: { ...input, total, totalPages: Math.ceil(total / input.limit) } }
}

// Existing storefront helpers expect bare arrays. Admin responses use an envelope.
export function sendPage<T>(res: Response, result: Page<T>, admin: boolean): void {
  res.set({
    'X-Total-Count': String(result.pagination.total),
    'X-Page': String(result.pagination.page),
    'X-Page-Size': String(result.pagination.limit),
    'X-Total-Pages': String(result.pagination.totalPages),
  })
  res.json(admin ? result : result.data)
}
