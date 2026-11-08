import { AppError } from '../../errors/app-error.js'
import type { LoginInput, SignupInput, TokenInput } from './auth.types.js'

function fields(input: unknown): Record<string, unknown> {
  return input && typeof input === 'object' ? (input as Record<string, unknown>) : {}
}

function requiredText(body: Record<string, unknown>, key: string): string {
  const value = body[key]
  if (typeof value !== 'string' || !value.trim()) throw new AppError(`${key} is required`, 400)
  return value.trim()
}

function assertEmail(address: string): string {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) throw new AppError('Invalid email address', 400)
  return address
}

export function parseSignup(input: unknown): SignupInput {
  const body = fields(input)
  const password = requiredText(body, 'password')
  if (password.length < 8) throw new AppError('Password must be at least 8 characters', 400)

  const name = requiredText(body, 'name')
  if (name.length > 120) throw new AppError('Name must be 120 characters or fewer', 400)

  return {
    email: assertEmail(requiredText(body, 'email').toLowerCase()),
    password,
    name,
  }
}

export function parseLogin(input: unknown): LoginInput {
  const body = fields(input)
  return {
    email: assertEmail(requiredText(body, 'email').toLowerCase()),
    password: requiredText(body, 'password'),
  }
}

export function parseEmail(input: unknown): { email: string } {
  return { email: assertEmail(requiredText(fields(input), 'email').toLowerCase()) }
}

export function parseToken(input: unknown): TokenInput {
  return { token: requiredText(fields(input), 'token') }
}
