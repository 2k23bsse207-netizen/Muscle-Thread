import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { test } from 'node:test'
import { refresh, logout } from '../src/modules/auth/auth.service.js'
import { verifyAccessToken } from '../src/utils/jwt.js'
import { adminToken, prisma, request, runId, userId, userToken } from './helpers.js'

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex')

test('Authentication regression: signup, verification, login, role gates and existing public user shape', async () => {
  const input = { email: `signup-${runId}@example.invalid`, name: 'Regression customer', password: 'test-password-123' }
  const { body: signup } = await request('/auth/signup', { method: 'POST', body: input, status: 201 })
  assert.equal(signup.user.role, 'USER')
  assert.equal(signup.user.emailVerified, false)
  assert.equal('passwordHash' in signup.user, false)
  assert.equal(typeof signup.verificationToken, 'string')
  await request('/auth/login', { method: 'POST', body: { email: input.email, password: input.password }, status: 403 })
  await request('/auth/verify-email', { method: 'POST', body: { token: signup.verificationToken } })
  const { body: login, headers } = await request('/auth/login', { method: 'POST', body: { email: input.email, password: input.password } })
  assert.equal(login.user.emailVerified, true)
  assert.equal(typeof login.accessToken, 'string')
  assert.equal('refreshToken' in login, false)
  assert.match(headers.get('set-cookie') ?? '', /refreshToken=.*HttpOnly/)
  const me = await request('/auth/me', { token: login.accessToken })
  assert.equal(me.body.user.id, signup.user.id)
  assert.equal(JSON.stringify(me.body).includes('passwordHash'), false)
  await request('/admin/products', { token: login.accessToken, status: 403 })
  await request('/auth/admin/sessions', { token: userToken, status: 403 })
  const sessions = await request('/auth/admin/sessions', { token: adminToken })
  assert.equal(JSON.stringify(sessions.body).includes('refreshTokenHash'), false)
  await request('/auth/refresh', { method: 'POST', status: 401 })
})

test('Authentication regression: refresh-session rotation and logout preserve stored hashes and ownership', async () => {
  const rawToken = `test-refresh-${runId}`
  const original = await prisma.session.create({ data: { userId, refreshTokenHash: sha256(rawToken), expiresAt: new Date(Date.now() + 60_000) } })
  const result = await refresh({ refreshToken: rawToken }, { userAgent: 'test', ip: '127.0.0.1' })
  assert.equal((await verifyAccessToken(result.accessToken))?.sub, userId)
  const stored = await prisma.session.findUniqueOrThrow({ where: { id: original.id } })
  assert.notEqual(stored.revokedAt, null)
  assert.equal(stored.refreshTokenHash, sha256(rawToken))
  const rotated = await prisma.session.findUniqueOrThrow({ where: { refreshTokenHash: sha256(result.refreshToken) } })
  assert.equal(rotated.userId, userId)
  assert.equal(rotated.revokedAt, null)
  await assert.rejects(refresh({ refreshToken: rawToken }, {}), /Invalid refresh token/)
  assert.deepEqual(await logout({ refreshToken: result.refreshToken }), { loggedOut: true, revoked: true })
  assert.deepEqual(await logout({ refreshToken: result.refreshToken }), { loggedOut: true, revoked: false })
})
