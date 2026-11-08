import assert from 'node:assert/strict'
import { before, after } from 'node:test'
import type { Server } from 'node:http'
import app from '../src/app.js'
import { prisma } from '../src/database/prisma.js'
import { signAccessToken } from '../src/utils/jwt.js'

const url = process.env.DATABASE_URL
if (!url || !['127.0.0.1', 'localhost'].includes(new URL(url).hostname) || process.env.NODE_ENV !== 'test') {
  throw new Error('Endpoint tests only run on an isolated local database with NODE_ENV=test')
}
export { prisma }
export const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
export let adminToken = ''
export let userToken = ''
export let otherToken = ''
export let adminId = ''
export let userId = ''
export let otherId = ''
let base = ''
let server: Server

before(async () => {
  const [admin, user, other] = await Promise.all([
    prisma.user.create({ data: { email: `admin-${runId}@example.invalid`, passwordHash: 'test-only', name: 'Test admin', role: 'ADMIN', emailVerified: true } }),
    prisma.user.create({ data: { email: `user-${runId}@example.invalid`, passwordHash: 'test-only', name: 'Test customer', emailVerified: true } }),
    prisma.user.create({ data: { email: `other-${runId}@example.invalid`, passwordHash: 'test-only', name: 'Other customer', emailVerified: true } }),
  ])
  ;[adminId, userId, otherId] = [admin.id, user.id, other.id]
  ;[adminToken, userToken, otherToken] = await Promise.all([
    signAccessToken(admin.id, 'ADMIN', 300), signAccessToken(user.id, 'USER', 300), signAccessToken(other.id, 'USER', 300),
  ])
  await new Promise<void>(resolve => { server = app.listen(0, '127.0.0.1', resolve) })
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Test server did not bind')
  base = `http://127.0.0.1:${address.port}/api/v1`
})

after(async () => {
  if (server) {
    server.closeAllConnections()
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  }
  await prisma.$disconnect()
})

export async function request(path: string, options: { method?: string; token?: string; body?: unknown; status?: number } = {}) {
  const response = await fetch(base + path, {
    method: options.method ?? 'GET',
    headers: {
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })
  const text = await response.text()
  const body = text ? JSON.parse(text) : null
  assert.equal(response.status, options.status ?? 200, `${options.method ?? 'GET'} ${path}: ${JSON.stringify(body)}`)
  return { body, headers: response.headers }
}

export async function catalog(suffix: string, options: { status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'; stock?: number; priceCents?: number } = {}) {
  const category = await prisma.category.create({ data: { name: `Category ${suffix}`, slug: `category-${suffix}-${runId}` } })
  const product = await prisma.product.create({
    data: {
      name: `Product ${suffix}`, slug: `product-${suffix}-${runId}`, sku: `P-${suffix}-${runId}`,
      categoryId: category.id, priceCents: options.priceCents ?? 2500, status: options.status ?? 'ACTIVE',
      variants: { create: { sku: `V-${suffix}-${runId}`, size: 'M', colorName: 'Black', stock: options.stock ?? 10 } },
    }, include: { variants: true },
  })
  return { category, product, variant: product.variants[0] }
}

export async function orderFixture(suffix: string, ownerId: string, options: { status?: 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'; totalCents?: number; payment?: 'PAID' | 'REFUNDED'; currency?: string; createdAt?: Date } = {}) {
  const { product, variant } = await catalog(`order-${suffix}`)
  const totalCents = options.totalCents ?? 5000
  const order = await prisma.order.create({
    data: {
      orderNumber: `TEST-${suffix}-${runId}`, userId: ownerId, status: options.status ?? 'PENDING',
      subtotalCents: totalCents, totalCents, currency: options.currency ?? 'USD',
      shippingName: 'Test recipient', shippingLine1: 'Test address', shippingCity: 'Test city', shippingPostal: '00000', shippingCountry: 'US',
      ...(options.createdAt ? { createdAt: options.createdAt } : {}),
      items: { create: { productId: product.id, variantId: variant.id, name: 'Immutable test snapshot', sku: 'ORIGINAL-SKU', size: 'M', color: 'Black', unitPriceCents: Math.floor(totalCents / 2), quantity: 2, lineTotalCents: totalCents } },
      ...(options.payment ? { payments: { create: { provider: 'STRIPE', status: options.payment, amountCents: totalCents, currency: options.currency ?? 'USD' } } } : {}),
    }, include: { items: true, payments: true },
  })
  return { order, product, variant }
}
