import { SignJWT, jwtVerify } from 'jose'
import { env } from '../config/env.js'
import type { Role } from '../generated/prisma/enums.js'

export type AccessToken = {
  sub: string
  role: Role
  type: 'access'
  iat: number
  exp: number
}

const secret = new TextEncoder().encode(env.jwtSecret)

export async function signAccessToken(userId: string, role: Role, ttlSeconds: number): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  return new SignJWT({ role, type: 'access' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(userId)
    .setIssuedAt(now)
    .setExpirationTime(now + ttlSeconds)
    .sign(secret)
}

export async function verifyAccessToken(token: string): Promise<AccessToken | null> {
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] })
    if (
      payload.type !== 'access' ||
      typeof payload.sub !== 'string' ||
      typeof payload.iat !== 'number' ||
      typeof payload.exp !== 'number'
    ) {
      return null
    }
    return {
      sub: payload.sub,
      role: payload.role as Role,
      type: 'access',
      iat: payload.iat,
      exp: payload.exp,
    }
  } catch {
    return null
  }
}
