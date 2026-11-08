import { AppError } from '../errors/app-error.js'

export const MAX_INT = 2_147_483_647
export type Fields = Record<string, unknown>

export function object(input: unknown, allowed?: readonly string[]): Fields {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new AppError('Expected a JSON object', 400)
  }
  const body = input as Fields
  if (allowed) {
    const unknown = Object.keys(body).find(key => !allowed.includes(key))
    if (unknown) throw new AppError(`Unknown field: ${unknown}`, 400)
  }
  return body
}

export function text(value: unknown, name: string, max = 255, allowEmpty = false): string {
  if (typeof value !== 'string') throw new AppError(`${name} must be a string`, 400)
  const result = value.trim()
  if ((!allowEmpty && !result) || result.length > max) {
    throw new AppError(`${name} must be ${allowEmpty ? '0' : '1'}–${max} characters`, 400)
  }
  return result
}

export function nullableText(value: unknown, name: string, max = 255): string | null {
  return value === null ? null : text(value, name, max, true) || null
}

export function integer(value: unknown, name: string, min = 0, max = MAX_INT): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    throw new AppError(`${name} must be an integer between ${min} and ${max}`, 400)
  }
  return value
}

export function boolean(value: unknown, name: string): boolean {
  if (typeof value !== 'boolean') throw new AppError(`${name} must be a boolean`, 400)
  return value
}

export function enumeration<T extends string>(value: unknown, name: string, values: readonly T[]): T {
  if (typeof value !== 'string' || !values.includes(value as T)) {
    throw new AppError(`${name} must be one of: ${values.join(', ')}`, 400)
  }
  return value as T
}

export function array<T>(value: unknown, name: string, parse: (item: unknown, index: number) => T, max = 100): T[] {
  if (!Array.isArray(value) || value.length > max) {
    throw new AppError(`${name} must be an array of at most ${max} items`, 400)
  }
  return value.map(parse)
}

export function texts(value: unknown, name: string, maxItems = 50, maxLength = 120): string[] {
  const result = array(value, name, item => text(item, name, maxLength), maxItems)
  if (new Set(result).size !== result.length) throw new AppError(`${name} must not contain duplicates`, 400)
  return result
}

export function httpUrl(value: unknown, name: string): string {
  const result = text(value, name, 2048)
  try {
    const url = new URL(result)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error()
  } catch {
    throw new AppError(`${name} must be an HTTP(S) URL without credentials`, 400)
  }
  return result
}

export function slug(value: unknown): string {
  const result = text(value, 'slug', 180).toLowerCase()
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(result)) {
    throw new AppError('slug must contain lowercase letters, numbers and single hyphens', 400)
  }
  return result
}

export function date(value: unknown, name: string): Date {
  const result = text(value, name, 40)
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(result)) {
    throw new AppError(`${name} must be an ISO-8601 datetime with a timezone`, 400)
  }
  const parsed = new Date(result)
  if (!Number.isFinite(parsed.getTime())) throw new AppError(`${name} is invalid`, 400)
  return parsed
}

export function nonempty(body: Fields): void {
  if (Object.keys(body).length === 0) throw new AppError('At least one field is required', 400)
}

export function queryText(value: unknown, name: string, max = 255): string | undefined {
  return value === undefined ? undefined : text(value, name, max)
}

export function queryInteger(value: unknown, name: string, min = 0, max = MAX_INT): number | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw new AppError(`${name} must be an integer`, 400)
  }
  return integer(Number(value), name, min, max)
}

export function queryBoolean(value: unknown, name: string): boolean | undefined {
  if (value === undefined) return undefined
  if (value !== 'true' && value !== 'false') throw new AppError(`${name} must be true or false`, 400)
  return value === 'true'
}

export function id(value: unknown, name = 'id'): string {
  return text(value, name, 191)
}
