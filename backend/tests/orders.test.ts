import assert from 'node:assert/strict'
import { test } from 'node:test'
import { adminId, adminToken, catalog, orderFixture, otherId, otherToken, prisma, request, userId, userToken } from './helpers.js'

test('Orders: owner isolation, listing/search, immutable details and audited/payment-aware status transitions', async () => {
  await request('/orders', { status: 401 })
  await request('/admin/orders', { status: 401 })
  await request('/admin/orders', { token: userToken, status: 403 })
  const { order, variant } = await orderFixture('orders', userId)
  const foreign = await orderFixture('foreign-orders', otherId)
  const initialStock = variant.stock
  const mine = await request('/orders?limit=1', { token: userToken })
  assert.equal(mine.body.length, 1)
  assert.equal(mine.body[0].id, order.id)
  assert.equal(mine.body[0].total, 50)
  assert.equal(mine.headers.get('x-total-count'), '1')
  await request(`/orders?userId=${otherId}`, { token: userToken, status: 400 })
  await request(`/orders/${foreign.order.id}`, { token: userToken, status: 404 })
  await request(`/orders/${order.id}/history`, { token: otherToken, status: 404 })
  const detail = await request(`/orders/${order.id}`, { token: userToken })
  assert.equal(detail.body.items[0].name, 'Immutable test snapshot')
  assert.equal('user' in detail.body, false)
  assert.equal(JSON.stringify(detail.body).includes('passwordHash'), false)
  const listing = await request(`/admin/orders?userId=${userId}&status=PENDING&sortBy=totalCents`, { token: adminToken })
  assert.equal(listing.body.pagination.total, 1)
  const searched = await request(`/admin/orders?q=${order.orderNumber}`, { token: adminToken })
  assert.equal(searched.body.pagination.total, 1)
  await request('/admin/orders?from=2026-11-10T00:00:00Z&to=2026-11-01T00:00:00Z', { token: adminToken, status: 400 })
  await request(`/admin/orders/${order.id}/status`, { method: 'PATCH', token: userToken, body: { status: 'PAID' }, status: 403 })
  await request(`/admin/orders/${order.id}/status`, { method: 'PATCH', token: adminToken, body: { status: 'INVALID' }, status: 400 })
  await request(`/admin/orders/${order.id}/status`, { method: 'PATCH', token: adminToken, body: { status: 'SHIPPED' }, status: 409 })
  await request(`/admin/orders/${order.id}/status`, { method: 'PATCH', token: adminToken, body: { status: 'PAID' }, status: 409 })
  await prisma.payment.create({ data: { orderId: order.id, provider: 'STRIPE', status: 'PAID', amountCents: order.totalCents } })
  await request(`/admin/orders/${order.id}/status`, { method: 'PATCH', token: adminToken, body: { status: 'PAID', expectedStatus: 'CANCELLED' }, status: 409 })
  await request(`/admin/orders/${order.id}/status`, { method: 'PATCH', token: adminToken, body: { status: 'PAID', expectedStatus: 'PENDING', note: 'Internal payment reconciliation' } })
  await request(`/admin/orders/${order.id}/status`, { method: 'PATCH', token: adminToken, body: { status: 'PAID' } })
  assert.equal(await prisma.orderStatusHistory.count({ where: { orderId: order.id } }), 1)
  for (const status of ['PROCESSING', 'SHIPPED', 'DELIVERED']) {
    await request(`/admin/orders/${order.id}/status`, { method: 'PATCH', token: adminToken, body: { status } })
  }
  await request(`/admin/orders/${order.id}/status`, { method: 'PATCH', token: adminToken, body: { status: 'REFUNDED' }, status: 409 })
  await prisma.payment.updateMany({ where: { orderId: order.id }, data: { status: 'REFUNDED' } })
  await request(`/admin/orders/${order.id}/status`, { method: 'PATCH', token: adminToken, body: { status: 'REFUNDED', note: 'Refund verified' } })
  await request(`/admin/orders/${order.id}/status`, { method: 'PATCH', token: adminToken, body: { status: 'PROCESSING' }, status: 409 })
  const history = await request(`/admin/orders/${order.id}/history?limit=2`, { token: adminToken })
  assert.equal(history.body.pagination.total, 5)
  assert.equal(history.body.data[0].actor.id, adminId)
  const publicHistory = await request(`/orders/${order.id}/history`, { token: userToken })
  assert.equal(publicHistory.body.data.length, 5)
  assert.equal('note' in publicHistory.body.data[0], false)
  assert.equal('actor' in publicHistory.body.data[0], false)
  assert.equal((await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } })).stock, initialStock)
  assert.equal((await prisma.orderItem.findUniqueOrThrow({ where: { id: order.items[0].id } })).name, 'Immutable test snapshot')
  const pending = await orderFixture('cancel-orders', userId)
  await request(`/admin/orders/${pending.order.id}/status`, { method: 'PATCH', token: adminToken, body: { status: 'CANCELLED' } })
  await request(`/admin/orders/${pending.order.id}/status`, { method: 'PATCH', token: adminToken, body: { status: 'PAID' }, status: 409 })
})

test('Orders: placing an order deducts exact variant stock once, audits the movement and rejects insufficient stock', async () => {
  await request('/orders', { method: 'POST', status: 401 })
  const shipping = { shippingName: 'Test recipient', shippingLine1: 'Test address', shippingCity: 'Test city', shippingPostal: '00000', shippingCountry: 'US' }
  const { variant } = await catalog('checkout', { stock: 5 })
  const ordersBefore = await prisma.order.count({ where: { userId } })
  // Validation: empty items, duplicate variant lines, zero quantity, unknown variant.
  await request('/orders', { method: 'POST', token: userToken, body: { items: [], ...shipping }, status: 400 })
  await request('/orders', { method: 'POST', token: userToken, body: { items: [{ variantId: variant.id, quantity: 1 }, { variantId: variant.id, quantity: 1 }], ...shipping }, status: 400 })
  await request('/orders', { method: 'POST', token: userToken, body: { items: [{ variantId: variant.id, quantity: 0 }], ...shipping }, status: 400 })
  await request('/orders', { method: 'POST', token: userToken, body: { items: [{ variantId: 'missing-variant', quantity: 1 }], ...shipping }, status: 404 })
  // Insufficient stock: rejected with no order, no movement, no deduction.
  await request('/orders', { method: 'POST', token: userToken, body: { items: [{ variantId: variant.id, quantity: 6 }], ...shipping }, status: 409 })
  assert.equal((await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } })).stock, 5)
  assert.equal(await prisma.inventoryMovement.count({ where: { variantId: variant.id } }), 0)
  assert.equal(await prisma.order.count({ where: { userId } }), ordersBefore)
  // A later failing line rolls back earlier deductions in the same transaction.
  const { variant: scarce } = await catalog('checkout-b', { stock: 1 })
  await request('/orders', { method: 'POST', token: userToken, body: { items: [{ variantId: variant.id, quantity: 2 }, { variantId: scarce.id, quantity: 5 }], ...shipping }, status: 409 })
  assert.equal((await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } })).stock, 5)
  assert.equal(await prisma.inventoryMovement.count({ where: { variantId: variant.id } }), 0)
  // Accepted order: stock deducted once from the exact variant, movement carries the order reference.
  const created = await request('/orders', { method: 'POST', token: userToken, body: { items: [{ variantId: variant.id, quantity: 3 }], ...shipping }, status: 201 })
  assert.equal(created.body.items.length, 1)
  assert.equal(created.body.items[0].quantity, 3)
  assert.equal(created.body.items[0].variantId, variant.id)
  assert.equal(created.body.subtotal, 75)
  assert.equal(created.body.status, 'PENDING')
  assert.equal((await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } })).stock, 2)
  const movement = await prisma.inventoryMovement.findFirstOrThrow({ where: { variantId: variant.id } })
  assert.equal(movement.quantityDelta, -3)
  assert.equal(movement.stockBefore, 5)
  assert.equal(movement.stockAfter, 2)
  assert.equal(movement.actorId, userId)
  assert.equal(movement.reason, `Order ${created.body.orderNumber}`)
  // Status changes never deduct or restore stock for the same order.
  await request(`/admin/orders/${created.body.id}/status`, { method: 'PATCH', token: adminToken, body: { status: 'CANCELLED' } })
  assert.equal((await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } })).stock, 2)
  assert.equal(await prisma.inventoryMovement.count({ where: { variantId: variant.id } }), 1)
  // Concurrent orders for the last unit: exactly one is accepted, stock ends at 0.
  const last = await catalog('checkout-c', { stock: 1 })
  const body = { items: [{ variantId: last.variant.id, quantity: 1 }], ...shipping }
  const outcomes = await Promise.allSettled([
    request('/orders', { method: 'POST', token: userToken, body, status: 201 }),
    request('/orders', { method: 'POST', token: userToken, body, status: 201 }),
  ])
  assert.equal(outcomes.filter(outcome => outcome.status === 'fulfilled').length, 1)
  const failure = outcomes.find(outcome => outcome.status === 'rejected') as PromiseRejectedResult
  assert.match(String(failure.reason), /Insufficient stock|Stock changed|Concurrent modification/)
  assert.equal((await prisma.productVariant.findUniqueOrThrow({ where: { id: last.variant.id } })).stock, 0)
  assert.equal(await prisma.inventoryMovement.count({ where: { variantId: last.variant.id } }), 1)
})

test('Settings: the admin tax rate drives cart quotes and order totals', async () => {
  const shipping = { shippingName: 'Tax buyer', shippingLine1: '1 Tax Street', shippingCity: 'Taxville', shippingPostal: '00000', shippingCountry: 'US' }
  await request('/settings')
  await request('/admin/settings', { method: 'PATCH', token: userToken, body: { taxRatePercent: 10 }, status: 403 })
  await request('/admin/settings', { method: 'PATCH', token: adminToken, body: { taxRatePercent: 150 }, status: 400 })
  await request('/admin/settings', { method: 'PATCH', token: adminToken, body: { taxRatePercent: -1 }, status: 400 })
  await request('/admin/settings', { method: 'PATCH', token: adminToken, body: { taxRatePercent: '10' }, status: 400 })
  const { body: defaults } = await request('/settings')
  const { body: updated } = await request('/admin/settings', { method: 'PATCH', token: adminToken, body: { taxRatePercent: 10 } })
  const { variant } = await catalog('tax-setting', { priceCents: 2500, stock: 5 })
  const quote = await request('/cart/quote', { method: 'POST', body: { items: [{ variantId: variant.id, quantity: 2 }] } })
  const { body: order } = await request('/orders', { method: 'POST', token: userToken, body: { items: [{ variantId: variant.id, quantity: 1 }], ...shipping }, status: 201 })
  // The default rate is restored before asserting, so a failed assertion below
  // can never leave a changed tax rate for the tests that run after this file.
  const { body: restored } = await request('/admin/settings', { method: 'PATCH', token: adminToken, body: { taxRatePercent: 8 } })
  const after = await request('/cart/quote', { method: 'POST', body: { items: [{ variantId: variant.id, quantity: 1 }] } })
  assert.equal(defaults.taxRatePercent, 8)
  assert.equal(updated.taxRateBps, 1000)
  assert.equal(updated.taxRatePercent, 10)
  assert.equal(restored.taxRateBps, 800)
  // Quote and order use the same rate and rounding: subtotal × rate.
  assert.equal(quote.body.subtotalCents, 5000)
  assert.equal(quote.body.taxCents, 500)
  assert.equal(order.subtotal, 25)
  assert.equal(order.tax, 2.5)
  assert.equal(order.total, 27.5)
  assert.equal(after.body.taxCents, 200)
})
