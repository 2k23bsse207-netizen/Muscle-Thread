import type { Request, Response } from 'express'
import { env } from '../../config/env.js'
import { AppError } from '../../errors/app-error.js'
import * as authService from './auth.service.js'
import { parseEmail, parseLogin, parseSignup, parseToken } from './auth.validation.js'

const REFRESH_COOKIE = 'refreshToken'

// httpOnly: token invisible to JS; SameSite=Lax blocks cross-site POSTs (CSRF)
// but still sends the cookie on top-level navigation; secure only under HTTPS
const refreshCookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: 'lax' as const,
  path: '/api/v1/auth',
  maxAge: authService.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
}

function sessionMeta(req: Request) {
  const userAgent = req.headers['user-agent']
  return { userAgent: typeof userAgent === 'string' ? userAgent : undefined, ip: req.ip }
}

function authUserId(req: Request): string {
  if (!req.user) throw new AppError('Missing or invalid access token', 401)
  return req.user.id
}

function refreshCookie(req: Request): string {
  return req.cookies[REFRESH_COOKIE] ?? ''
}

export async function signup(req: Request, res: Response) {
  res.status(201).json(await authService.signup(parseSignup(req.body)))
}

export async function verifyEmail(req: Request, res: Response) {
  res.json(await authService.verifyEmail(parseToken(req.body)))
}

export async function resendVerification(req: Request, res: Response) {
  res.json(await authService.resendVerification(parseEmail(req.body)))
}

export async function login(req: Request, res: Response) {
  const { user, accessToken, refreshToken } = await authService.login(
    parseLogin(req.body),
    sessionMeta(req),
  )
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions)
  res.json({ user, accessToken })
}

export async function refresh(req: Request, res: Response) {
  const token = refreshCookie(req)
  if (!token) throw new AppError('Missing refresh token', 401)

  const { user, accessToken, refreshToken } = await authService.refresh(
    { refreshToken: token },
    sessionMeta(req),
  )
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions)
  res.json({ user, accessToken })
}

export async function logout(req: Request, res: Response) {
  // An empty token matches no session, so logout stays idempotent without a cookie
  const { loggedOut, revoked } = await authService.logout({ refreshToken: refreshCookie(req) })
  res.clearCookie(REFRESH_COOKIE, refreshCookieOptions)
  res.json({ loggedOut, revoked })
}

export async function me(req: Request, res: Response) {
  res.json(await authService.me(authUserId(req)))
}

export async function adminSessions(_req: Request, res: Response) {
  res.json(await authService.listSessions())
}
