import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../errors/app-error.js'
import type { Role } from '../generated/prisma/enums.js'
import { verifyAccessToken } from '../utils/jwt.js'

declare module 'express-serve-static-core' {
  interface Request {
    user?: { id: string; role: Role }
  }
}

/** Requires a valid `Authorization: Bearer <accessToken>` header. */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null
  const payload = token ? await verifyAccessToken(token) : null

  if (!payload) return next(new AppError('Missing or invalid access token', 401))

  req.user = { id: payload.sub, role: payload.role }
  next()
}

/** Role gate — always mount after requireAuth. */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError('Missing or invalid access token', 401))
    if (!roles.includes(req.user.role)) return next(new AppError('Forbidden: insufficient role', 403))
    next()
  }
}
