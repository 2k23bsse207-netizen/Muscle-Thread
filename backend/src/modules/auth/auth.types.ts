import type { Role } from '../../generated/prisma/enums.js'

export type SignupInput = { email: string; password: string; name: string }
export type LoginInput = { email: string; password: string }
export type TokenInput = { token: string }
export type RefreshInput = { refreshToken: string }

export type PublicUser = {
  id: string
  email: string
  name: string
  role: Role
  emailVerified: boolean
  emailVerifiedAt: Date | null
  createdAt: Date
}

export type TokenPair = { accessToken: string; refreshToken: string }
export type SessionMeta = { userAgent?: string; ip?: string }
