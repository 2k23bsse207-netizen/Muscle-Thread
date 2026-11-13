import assert from 'node:assert/strict'
import { test } from 'node:test'
// TEMPORARY: coupon redemption is disabled with the /validate routes.
// import { transaction } from '../src/database/transaction.js'
// import { redeemDiscount } from '../src/modules/discounts/discounts.service.js'
import { adminToken, prisma, request, runId, userToken } from './helpers.js'

test('Discounts: admin CRUD, expiry/limits, cents math and read-only validation', async () => {
  await request('/admin/discounts', { status: 401 })
  await request('/admin/discounts', { token: userToken, status: 403 })
  // TEMPORARY: the validate route is commented out, so the path falls through to 404.
  await request('/discounts/validate', { method: 'POST', token: userToken, body: { code: 'TEST', subtotalCents: 1000 }, status: 404 })
  const input = { code: `move_${runId}`, type: 'PERCENTAGE', value: 10, usageLimit: 3 }
  const { body: discount } = await request('/admin/discounts', { method: 'POST', token: adminToken, body: input, status: 201 })
  assert.equal(discount.code, input.code.toUpperCase())
  assert.equal(discount.state, 'AVAILABLE')
  await request('/admin/discounts', { method: 'POST', token: adminToken, body: input, status: 409 })
  await request('/admin/discounts', { method: 'POST', token: adminToken, body: { ...input, code: `INVALID_${runId}`, value: 101 }, status: 400 })
  await request('/admin/discounts', { method: 'POST', token: adminToken, body: { ...input, code: `DATES_${runId}`, startsAt: '2027-01-02T00:00:00Z', endsAt: '2027-01-01T00:00:00Z' }, status: 400 })
  await request('/admin/discounts', { method: 'POST', token: adminToken, body: { ...input, code: `ZERO_${runId}`, usageLimit: 0 }, status: 400 })
  await request('/admin/discounts', { method: 'POST', token: adminToken, body: { ...input, code: `COUNT_${runId}`, usedCount: 100 }, status: 400 })
  // const quote = await request('/discounts/validate', { method: 'POST', token: userToken, body: { code: input.code.toLowerCase(), subtotalCents: 1005 } })
  // assert.equal(quote.body.discountCents, 101)
  // assert.equal(quote.body.totalCents, 904)
  // assert.equal((await prisma.discount.findUniqueOrThrow({ where: { id: discount.id } })).usedCount, 0)
  const listing = await request(`/admin/discounts?q=${discount.code}&state=AVAILABLE&limit=1`, { token: adminToken })
  assert.equal(listing.body.pagination.total, 1)
  // await request('/discounts/validate', { method: 'POST', token: userToken, body: { code: 'UNKNOWN', subtotalCents: 1000 }, status: 400 })
  // await request('/discounts/validate', { method: 'POST', token: userToken, body: { code: discount.code, subtotalCents: -1 }, status: 400 })
  await request(`/admin/discounts/${discount.id}`, { method: 'PATCH', token: adminToken, body: { startsAt: '2099-01-01T00:00:00Z' } })
  // await request('/discounts/validate', { method: 'POST', token: userToken, body: { code: discount.code, subtotalCents: 1000 }, status: 400 })
  assert.equal((await request(`/admin/discounts?q=${discount.code}&state=SCHEDULED`, { token: adminToken })).body.pagination.total, 1)
  await request(`/admin/discounts/${discount.id}`, { method: 'PATCH', token: adminToken, body: { startsAt: null, endsAt: '2020-01-01T00:00:00Z' } })
  // await request('/discounts/validate', { method: 'POST', token: userToken, body: { code: discount.code, subtotalCents: 1000 }, status: 400 })
  assert.equal((await request(`/admin/discounts/${discount.id}`, { token: adminToken })).body.state, 'EXPIRED')
  await request(`/admin/discounts/${discount.id}`, { method: 'PATCH', token: adminToken, body: { endsAt: null, type: 'FIXED', value: 5000 } })
  // const capped = await request('/discounts/validate', { method: 'POST', token: userToken, body: { code: discount.code, subtotalCents: 1000 } })
  // assert.equal(capped.body.discountCents, 1000)
  // assert.equal(capped.body.totalCents, 0)
  await request(`/admin/discounts/${discount.id}`, { method: 'DELETE', token: adminToken })
  assert.equal((await prisma.discount.findUniqueOrThrow({ where: { id: discount.id } })).active, false)
  // await request('/discounts/validate', { method: 'POST', token: userToken, body: { code: discount.code, subtotalCents: 1000 }, status: 400 })
  assert.equal((await request(`/admin/discounts?q=${discount.code}&state=INACTIVE`, { token: adminToken })).body.pagination.total, 1)
  await request('/admin/discounts?active=1', { token: adminToken, status: 400 })
  await request('/admin/discounts?state=INVALID', { token: adminToken, status: 400 })
})

// TEMPORARY: coupon redemption disabled with the /validate routes. Restore the
// imports above and uncomment this test to re-enable coupon codes.
// test('Discount redemption: single last use under concurrency and usage rollback with failed order transaction', async () => {
//   const discount = await prisma.discount.create({ data: { code: `LAST_${runId}`.toUpperCase(), type: 'PERCENTAGE', value: 20, usageLimit: 1 } })
//   const input = { code: discount.code, subtotalCents: 5000 }
//   await assert.rejects(transaction(async tx => { await redeemDiscount(tx, input); throw new Error('Order creation failed') }), /Order creation failed/)
//   assert.equal((await prisma.discount.findUniqueOrThrow({ where: { id: discount.id } })).usedCount, 0)
//   const outcomes = await Promise.allSettled([
//     transaction(tx => redeemDiscount(tx, input)),
//     transaction(tx => redeemDiscount(tx, input)),
//   ])
//   assert.equal(outcomes.filter(outcome => outcome.status === 'fulfilled').length, 1)
//   assert.equal((await prisma.discount.findUniqueOrThrow({ where: { id: discount.id } })).usedCount, 1)
//   await request('/discounts/validate', { method: 'POST', token: userToken, body: input, status: 400 })
//   assert.equal((await request(`/admin/discounts?q=${discount.code}&state=EXHAUSTED`, { token: adminToken })).body.pagination.total, 1)
//   await request(`/admin/discounts/${discount.id}`, { method: 'PATCH', token: adminToken, body: { usageLimit: 0 }, status: 400 })
//   await request(`/admin/discounts/${discount.id}`, { method: 'PATCH', token: adminToken, body: { usedCount: 0 }, status: 400 })
// })

test('Discounts preserve legacy case variants without arbitrary selection and reject Unicode normalization expansion', async () => {
  const lowerCode = `legacy_${runId}`.toLowerCase()
  const legacy = await prisma.discount.create({ data: { code: lowerCode, type: 'PERCENTAGE', value: 15, active: true } })
  await request('/admin/discounts', { method: 'POST', token: adminToken, body: { code: lowerCode.toUpperCase(), type: 'PERCENTAGE', value: 50 }, status: 409 })
  const target = await prisma.discount.create({ data: { code: `TARGET_${runId}`.toUpperCase(), type: 'FIXED', value: 500 } })
  await request(`/admin/discounts/${target.id}`, { method: 'PATCH', token: adminToken, body: { code: lowerCode.toUpperCase() }, status: 409 })
  // const quote = await request('/discounts/validate', { method: 'POST', token: userToken, body: { code: lowerCode.toUpperCase(), subtotalCents: 1000 } })
  // assert.equal(quote.body.discountId, legacy.id)
  // assert.equal(quote.body.discountCents, 150)
  const conflicting = await prisma.discount.create({ data: { code: lowerCode.toUpperCase(), type: 'PERCENTAGE', value: 50, active: false } })
  // await request('/discounts/validate', { method: 'POST', token: userToken, body: { code: lowerCode, subtotalCents: 1000 }, status: 409 })
  assert.equal((await prisma.discount.findUniqueOrThrow({ where: { id: legacy.id } })).code, lowerCode)
  assert.equal((await prisma.discount.findUniqueOrThrow({ where: { id: conflicting.id } })).active, false)
  await request('/admin/discounts', { method: 'POST', token: adminToken, body: { code: 'ß'.repeat(50), type: 'PERCENTAGE', value: 10 }, status: 400 })
  // await request('/discounts/validate', { method: 'POST', token: userToken, body: { code: 'ß'.repeat(50), subtotalCents: 1000 }, status: 400 })
  const boundaryCode = 'A'.repeat(50)
  await request('/admin/discounts', { method: 'POST', token: adminToken, body: { code: boundaryCode, type: 'PERCENTAGE', value: 10 }, status: 201 })
  // await request('/discounts/validate', { method: 'POST', token: userToken, body: { code: boundaryCode, subtotalCents: 1000 } })
  const concurrentCode = `RACE_${runId}`.toUpperCase()
  const results = await Promise.allSettled([
    request('/admin/discounts', { method: 'POST', token: adminToken, body: { code: concurrentCode, type: 'PERCENTAGE', value: 10 }, status: 201 }),
    request('/admin/discounts', { method: 'POST', token: adminToken, body: { code: concurrentCode.toLowerCase(), type: 'PERCENTAGE', value: 20 }, status: 201 }),
  ])
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1)
  assert.equal(await prisma.discount.count({ where: { code: { equals: concurrentCode, mode: 'insensitive' } } }), 1)
})
