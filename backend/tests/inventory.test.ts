import assert from 'node:assert/strict'
import { test } from 'node:test'
import { adminId, adminToken, catalog, prisma, request, userToken } from './helpers.js'

test('Inventory: stock audit, per-variant thresholds, filters, validation and concurrent nonnegative updates', async () => {
  await request('/admin/inventory', { status: 401 })
  await request('/admin/inventory', { token: userToken, status: 403 })
  const { variant, product } = await catalog('inventory', { stock: 4 })
  const detail = await request(`/admin/inventory/${variant.id}`, { token: adminToken })
  assert.equal(detail.body.isLowStock, true)
  await request(`/admin/inventory/${variant.id}`, { method: 'PATCH', token: adminToken, body: { lowStockThreshold: 2 } })
  const low = await request(`/admin/inventory/low-stock?productId=${product.id}`, { token: adminToken })
  assert.equal(low.body.pagination.total, 0)
  const notLow = await request(`/admin/inventory?productId=${product.id}&lowStock=false`, { token: adminToken })
  assert.equal(notLow.body.pagination.total, 1)
  await request(`/admin/inventory/${variant.id}/adjustments`, { method: 'POST', token: adminToken, body: { delta: -10, reason: 'Invalid shrinkage' }, status: 409 })
  await request(`/admin/inventory/${variant.id}/adjustments`, { method: 'POST', token: adminToken, body: { stock: 3, reason: 'Count' }, status: 400 })
  await request(`/admin/inventory/${variant.id}/adjustments`, { method: 'POST', token: adminToken, body: { delta: 0, reason: 'No change' }, status: 400 })
  await request(`/admin/inventory/${variant.id}/adjustments`, { method: 'POST', token: adminToken, body: { stock: 3, expectedStock: 0, reason: 'Stale count' }, status: 409 })
  await request(`/admin/inventory/${variant.id}/adjustments`, { method: 'POST', token: adminToken, body: { delta: -1, type: 'RECEIPT', reason: 'Invalid receipt' }, status: 400 })
  const receipt = await request(`/admin/inventory/${variant.id}/adjustments`, { method: 'POST', token: adminToken, body: { delta: 6, type: 'RECEIPT', reason: 'Shipment received' }, status: 201 })
  assert.equal(receipt.body.inventory.stock, 10)
  assert.equal(receipt.body.movement.stockBefore, 4)
  assert.equal(receipt.body.movement.stockAfter, 10)
  assert.equal(receipt.body.movement.actorId, adminId)
  await request(`/admin/inventory/${variant.id}/adjustments`, { method: 'POST', token: adminToken, body: { stock: 1, expectedStock: 10, reason: 'Physical count' }, status: 201 })
  await request(`/admin/inventory/${variant.id}`, { method: 'PATCH', token: adminToken, body: { lowStockThreshold: 5 } })
  const outcomes = await Promise.allSettled([
    request(`/admin/inventory/${variant.id}/adjustments`, { method: 'POST', token: adminToken, body: { delta: -1, reason: 'Concurrent decrement A' }, status: 201 }),
    request(`/admin/inventory/${variant.id}/adjustments`, { method: 'POST', token: adminToken, body: { delta: -1, reason: 'Concurrent decrement B' }, status: 201 }),
  ])
  assert.equal(outcomes.filter(outcome => outcome.status === 'fulfilled').length, 1)
  const failure = outcomes.find(outcome => outcome.status === 'rejected') as PromiseRejectedResult
  assert.match(String(failure.reason), /invalid or negative stock|Stock changed|Concurrent modification/)
  assert.equal((await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } })).stock, 0)
  const history = await request(`/admin/inventory/${variant.id}/history?limit=2`, { token: adminToken })
  assert.equal(history.body.pagination.total, 3)
  assert.equal(history.body.data.length, 2)
  const stats = await request(`/admin/inventory/stats?productId=${product.id}`, { token: adminToken })
  assert.deepEqual(stats.body, { variants: 1, totalStock: 0, lowStock: 1, outOfStock: 1 })
  const filtered = await request(`/admin/inventory?productId=${product.id}&outOfStock=true`, { token: adminToken })
  assert.equal(filtered.body.data.length, 1)
  await request('/admin/inventory?lowStock=invalid', { token: adminToken, status: 400 })
  await request(`/admin/inventory/${variant.id}`, { method: 'PATCH', token: adminToken, body: { lowStockThreshold: -1 }, status: 400 })
  await request('/admin/inventory/missing', { token: adminToken, status: 404 })
})
