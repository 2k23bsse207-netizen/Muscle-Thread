import { createHash, randomBytes } from 'node:crypto'
import { env } from '../../config/env.js'
import { prisma } from '../../database/prisma.js'
import { AppError } from '../../errors/app-error.js'
import type { User } from '../../generated/prisma/client.js'
import { signAccessToken } from '../../utils/jwt.js'
import { hashPassword, verifyPassword } from '../../utils/password.js'
import type {
  LoginInput,
  PublicUser,
  RefreshInput,
  SessionMeta,
  SignupInput,
  TokenInput,
  TokenPair,
} from './auth.types.js'

// Access tokens are deliberately short-lived; refresh handles renewal.
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60
// Exported so the refresh cookie's lifetime matches the session's exactly
export const REFRESH_TOKEN_TTL_DAYS = 30
const VERIFICATION_TTL_MINUTES = 30

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex')

let dummyPasswordHash: string | null = null

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    emailVerified: user.emailVerified,
    emailVerifiedAt: user.emailVerifiedAt,
    createdAt: user.createdAt,
  }
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code?: unknown }).code === 'P2002'
}

async function issueSession(userId: string, role: User['role'], meta: SessionMeta): Promise<TokenPair> {
  const refreshToken = randomBytes(48).toString('base64url')

  await prisma.session.create({
    data: {
      userId,
      refreshTokenHash: sha256(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
      userAgent: meta.userAgent,
      ip: meta.ip,
    },
  })

  return { accessToken: await signAccessToken(userId, role, ACCESS_TOKEN_TTL_SECONDS), refreshToken }
}

async function issueVerificationToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString('base64url')

  // Keep a single active token per user
  await prisma.emailVerificationToken.deleteMany({ where: { userId, usedAt: null } })
  await prisma.emailVerificationToken.create({
    data: { userId, tokenHash: sha256(token), expiresAt: new Date(Date.now() + VERIFICATION_TTL_MINUTES * 60_000) },
  })

  return token
}

// No mail provider is configured yet: log the token in dev, discard in production.
function deliverVerification(email: string, token: string): string | undefined {
  if (env.nodeEnv === 'production') {
    console.warn(`[auth] email delivery not configured — verification token for ${email} not sent`)
    return undefined
  }
  console.log(`[auth] verification token for ${email}: ${token}`)
  return token
}

export async function signup(input: SignupInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) throw new AppError('An account with this email already exists', 409)

  let user: User
  try {
    user = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash: await hashPassword(input.password),
        role: 'USER',
      },
    })
  } catch (err) {
    if (isUniqueViolation(err)) throw new AppError('An account with this email already exists', 409)
    throw err
  }

  const token = await issueVerificationToken(user.id)
  return { user: toPublicUser(user), verificationToken: deliverVerification(user.email, token) }
}

export async function verifyEmail(input: TokenInput) {
  const record = await prisma.emailVerificationToken.findUnique({ where: { tokenHash: sha256(input.token) } })

  if (!record || record.usedAt) throw new AppError('Invalid or already used verification token', 400)
  if (record.expiresAt.getTime() <= Date.now()) throw new AppError('Verification token has expired', 400)

  const now = new Date()
  await prisma.$transaction([
    prisma.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: now } }),
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true, emailVerifiedAt: now } }),
  ])

  return { verified: true }
}

export async function resendVerification(input: { email: string }) {
  const user = await prisma.user.findUnique({ where: { email: input.email } })

  // Always report success so the endpoint cannot be used to probe registered emails
  if (!user || user.emailVerified) return { sent: true, verificationToken: undefined }

  const token = await issueVerificationToken(user.id)
  return { sent: true, verificationToken: deliverVerification(user.email, token) }
}

export async function login(input: LoginInput, meta: SessionMeta) {
  const user = await prisma.user.findUnique({ where: { email: input.email } })

  // Unknown emails still pay the hashing cost, so response time reveals nothing
  const stored = user?.passwordHash ?? (dummyPasswordHash ??= await hashPassword('timing-equalizer'))
  const passwordOk = await verifyPassword(input.password, stored)

  if (!user || !passwordOk) throw new AppError('Invalid email or password', 401)
  if (!user.emailVerified) throw new AppError('Verify your email before logging in', 403)

  return { user: toPublicUser(user), ...(await issueSession(user.id, user.role, meta)) }
}

export async function refresh(input: RefreshInput, meta: SessionMeta) {
  const session = await prisma.session.findUnique({
    where: { refreshTokenHash: sha256(input.refreshToken) },
    include: { user: true },
  })

  if (!session || session.revokedAt) throw new AppError('Invalid refresh token', 401)
  if (session.expiresAt.getTime() <= Date.now()) throw new AppError('Refresh token has expired', 401)

  // Rotation: the presented token is revoked as its replacement is issued
  await prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } })

  return { user: toPublicUser(session.user), ...(await issueSession(session.userId, session.user.role, meta)) }
}

export async function logout(input: RefreshInput) {
  const result = await prisma.session.updateMany({
    where: { refreshTokenHash: sha256(input.refreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  })

  // Idempotent: logging out twice, or with an unknown token, still succeeds
  return { loggedOut: true, revoked: result.count > 0 }
}

export async function me(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError('User not found', 404)
  return { user: toPublicUser(user) }
}

export async function listSessions() {
  const sessions = await prisma.session.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { user: { select: { id: true, email: true, name: true, role: true } } },
  })

  return {
    sessions: sessions.map((session) => ({
      id: session.id,
      user: session.user,
      userAgent: session.userAgent,
      ip: session.ip,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      revokedAt: session.revokedAt,
    })),
  }
}
