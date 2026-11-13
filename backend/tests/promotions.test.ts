import assert from 'node:assert/strict'
import { test } from 'node:test'
import { adminToken, catalog, prisma, request, runId, userToken } from './helpers.js'

const shipping = { shippingName: 'Test buyer', shippingLine1: '1 Test Street', shippingCity: 'Testville', shippingPostal: '00000', shippingCountry: 'US' }

test('Promotions: admin CRUD, multi-target scope rules, validation and deactivation', async () => {
  await request('/admin/promotions', { status: 401 })
  await request('/admin/promotions', { token: userToken, status: 403 })
  const { product, variant } = await catalog(`promo-${runId}`)
  const input = { name: `Summer sale ${runId}`, marquee: 'Up to 20% off', type: 'PERCENTAGE', value: 15, targets: [{ productId: product.id }] }
  const { body: promotion } = await request('/admin/promotions', { method: 'POST', token: adminToken, body: input, status: 201 })
  assert.equal(promotion.state, 'ACTIVE')
  assert.equal(promotion.marquee, input.marquee)
  assert.deepEqual(promotion.targets, [{ productId: product.id, variantId: null, value: null }])
  // Scope rules: at least one target, and each target is exactly one of product or variant.
  await request('/admin/promotions', { method: 'POST', token: adminToken, body: { ...input, targets: [{ productId: product.id, variantId: variant.id }] }, status: 400 })
  await request('/admin/promotions', { method: 'POST', token: adminToken, body: { ...input, targets: [] }, status: 400 })
  await request('/admin/promotions', { method: 'POST', token: adminToken, body: { name: `No target ${runId}`, type: 'FIXED', value: 500 }, status: 400 })
  await request('/admin/promotions', { method: 'POST', token: adminToken, body: { ...input, targets: [{ productId: 'missing-product-id' }] }, status: 404 })
  await request('/admin/promotions', { method: 'POST', token: adminToken, body: { ...input, targets: [{ productId: product.id }, { productId: product.id }] }, status: 400 })
  // Configuration rules mirror discounts: percentages 1–100, sane window — the
  // campaign value and every per-target override obey the same bounds.
  await request('/admin/promotions', { method: 'POST', token: adminToken, body: { ...input, value: 101 }, status: 400 })
  await request('/admin/promotions', { method: 'POST', token: adminToken, body: { ...input, value: 0 }, status: 400 })
  await request('/admin/promotions', { method: 'POST', token: adminToken, body: { ...input, targets: [{ productId: product.id, value: 101 }] }, status: 400 })
  await request('/admin/promotions', { method: 'POST', token: adminToken, body: { ...input, startsAt: '2027-01-02T00:00:00Z', endsAt: '2027-01-01T00:00:00Z' }, status: 400 })
  await request('/admin/promotions', { method: 'POST', token: adminToken, body: { ...input, unknown: true }, status: 400 })
  // Update: fields and the target list both change.
  await request(`/admin/promotions/${promotion.id}`, { method: 'PATCH', token: adminToken, body: { productId: variant.id }, status: 400 })
  const { body: updated } = await request(`/admin/promotions/${promotion.id}`, { method: 'PATCH', token: adminToken, body: { name: `Renamed ${runId}`, value: 20 } })
  assert.equal(updated.name, `Renamed ${runId}`)
  assert.equal(updated.value, 20)
  assert.deepEqual(updated.targets, [{ productId: product.id, variantId: null, value: null }])
  // Sending targets replaces the whole scope: now variant-scoped with an override
  // that shares the campaign's type (percent for PERCENTAGE, cents for FIXED).
  const { body: retargeted } = await request(`/admin/promotions/${promotion.id}`, { method: 'PATCH', token: adminToken, body: { targets: [{ variantId: variant.id, value: 50 }] } })
  assert.deepEqual(retargeted.targets, [{ productId: null, variantId: variant.id, value: 50 }])
  await request(`/admin/promotions/${promotion.id}`, { method: 'PATCH', token: adminToken, body: { targets: [{ variantId: 'missing-variant-id' }] }, status: 404 })
  await request(`/admin/promotions/${promotion.id}`, { method: 'PATCH', token: adminToken, body: {}, status: 400 })
  await request('/admin/promotions/missing-promotion-id', { token: adminToken, status: 404 })
  // List with filters.
  const listing = await request(`/admin/promotions?q=${updated.name}&state=ACTIVE`, { token: adminToken })
  assert.equal(listing.body.pagination.total, 1)
  assert.equal(listing.body.data[0].id, promotion.id)
  // Scheduled and expired states.
  await request(`/admin/promotions/${promotion.id}`, { method: 'PATCH', token: adminToken, body: { startsAt: '2099-01-01T00:00:00Z' } })
  assert.equal((await request(`/admin/promotions/${promotion.id}`, { token: adminToken })).body.state, 'SCHEDULED')
  await request(`/admin/promotions/${promotion.id}`, { method: 'PATCH', token: adminToken, body: { startsAt: null, endsAt: '2020-01-01T00:00:00Z' } })
  assert.equal((await request(`/admin/promotions/${promotion.id}`, { token: adminToken })).body.state, 'EXPIRED')
  // Deactivate = soft delete; the row and its data remain.
  await request(`/admin/promotions/${promotion.id}`, { method: 'DELETE', token: adminToken })
  assert.equal((await prisma.promotion.findUniqueOrThrow({ where: { id: promotion.id } })).active, false)
  assert.equal((await request(`/admin/promotions?q=${updated.name}&state=INACTIVE`, { token: adminToken })).body.pagination.total, 1)
  await request('/admin/promotions?state=INVALID', { token: adminToken, status: 400 })
})

test('Promotions: variant beats product scope, windows gate pricing, quote and product APIs agree', async () => {
  const { product, variant } = await catalog(`quote-${runId}`, { priceCents: 2500 })
  // Baseline: no promotion running.
  const baseline = await request('/cart/quote', { method: 'POST', body: { items: [{ variantId: variant.id, quantity: 2 }] } })
  assert.equal(baseline.body.subtotalCents, 5000)
  assert.equal(baseline.body.discountCents, 0)
  assert.equal(baseline.body.totalCents, 5000)
  assert.equal(baseline.body.items[0].originalPriceCents, 2500)
  assert.equal(baseline.body.items[0].finalPriceCents, 2500)
  assert.equal(baseline.body.items[0].promotion, null)
  // Product-level 10% applies to every variant.
  const { body: productPromo } = await request('/admin/promotions', {
    method: 'POST', token: adminToken,
    body: { name: `Product promo ${runId}`, marquee: '10% off everything', type: 'PERCENTAGE', value: 10, targets: [{ productId: product.id }] },
    status: 201,
  })
  const afterProduct = await request('/cart/quote', { method: 'POST', body: { items: [{ variantId: variant.id, quantity: 2 }] } })
  assert.equal(afterProduct.body.items[0].discountCents, 250)
  assert.equal(afterProduct.body.items[0].finalPriceCents, 2250)
  assert.equal(afterProduct.body.items[0].promotion.id, productPromo.id)
  assert.equal(afterProduct.body.discountCents, 500)
  assert.equal(afterProduct.body.totalCents, 4500)
  // Variant-level 500c beats the product percentage.
  const { body: variantPromo } = await request('/admin/promotions', {
    method: 'POST', token: adminToken,
    body: { name: `Variant promo ${runId}`, type: 'FIXED', value: 500, targets: [{ variantId: variant.id }] },
    status: 201,
  })
  const afterVariant = await request('/cart/quote', { method: 'POST', body: { items: [{ variantId: variant.id, quantity: 1 }] } })
  assert.equal(afterVariant.body.items[0].discountCents, 500)
  assert.equal(afterVariant.body.items[0].finalPriceCents, 2000)
  assert.equal(afterVariant.body.items[0].promotion.id, variantPromo.id)
  // Product API returns the same original/discount/final triple. The product row
  // reflects the product-scoped promo; the variant row reflects the winner.
  const { body: detail } = await request(`/products/${product.id}`)
  assert.equal(detail.originalPriceCents, 2500)
  assert.equal(detail.discountCents, 250)
  assert.equal(detail.finalPriceCents, 2250)
  const detailVariant = detail.variants.find((item: { id: string }) => item.id === variant.id)
  assert.equal(detailVariant.originalPriceCents, 2500)
  assert.equal(detailVariant.discountCents, 500)
  assert.equal(detailVariant.finalPriceCents, 2000)
  // Scheduled promotion is invisible to pricing but listed as SCHEDULED.
  const { body: scheduled } = await request('/admin/promotions', {
    method: 'POST', token: adminToken,
    body: { name: `Future promo ${runId}`, type: 'PERCENTAGE', value: 50, targets: [{ productId: product.id }], startsAt: '2099-01-01T00:00:00Z' },
    status: 201,
  })
  assert.equal(scheduled.state, 'SCHEDULED')
  const afterScheduled = await request('/cart/quote', { method: 'POST', body: { items: [{ variantId: variant.id, quantity: 1 }] } })
  assert.equal(afterScheduled.body.items[0].discountCents, 500)
  // Deactivating the variant promo falls back to the product promo.
  await request(`/admin/promotions/${variantPromo.id}`, { method: 'DELETE', token: adminToken })
  const afterDeactivate = await request('/cart/quote', { method: 'POST', body: { items: [{ variantId: variant.id, quantity: 1 }] } })
  assert.equal(afterDeactivate.body.items[0].discountCents, 250)
  assert.equal(afterDeactivate.body.items[0].promotion.id, productPromo.id)
  // Public active feed shows running promotions only.
  const { body: active } = await request('/promotions')
  assert.ok(active.some((item: { id: string }) => item.id === productPromo.id))
  assert.ok(!active.some((item: { id: string }) => item.id === scheduled.id))
  assert.ok(!active.some((item: { id: string }) => item.id === variantPromo.id))
  assert.ok(active.every((item: { state: string }) => item.state === 'ACTIVE'))
})

test('Promotions: one campaign covers multiple products and variants with per-target overrides', async () => {
  const first = await catalog(`multi-a-${runId}`, { priceCents: 2000 })
  const second = await catalog(`multi-b-${runId}`, { priceCents: 4000 })
  // A second variant on the first product proves "all variants" coverage.
  const extra = await prisma.productVariant.create({
    data: { productId: first.product.id, sku: `V2-multi-${runId}`, size: 'L', colorName: 'Blue', stock: 5 },
  })
  const { body: promo } = await request('/admin/promotions', {
    method: 'POST', token: adminToken,
    body: {
      name: `Multi ${runId}`, type: 'FIXED', value: 500,
      targets: [
        { productId: first.product.id },
        { productId: second.product.id },
        { variantId: second.variant.id, value: 1000 },
      ],
    },
    status: 201,
  })
  assert.equal(promo.targets.length, 3)
  const override = promo.targets.find((target: { variantId: string | null }) => target.variantId === second.variant.id)
  assert.deepEqual(override, { productId: null, variantId: second.variant.id, value: 1000 })
  // The campaign-wide $5 covers every variant of the first product…
  const quote = await request('/cart/quote', {
    method: 'POST',
    body: { items: [{ variantId: first.variant.id, quantity: 1 }, { variantId: extra.id, quantity: 2 }, { variantId: second.variant.id, quantity: 1 }] },
  })
  const lineFor = (variantId: string) => quote.body.items.find((item: { variantId: string }) => item.variantId === variantId)
  assert.equal(lineFor(first.variant.id).discountCents, 500)
  assert.equal(lineFor(extra.id).discountCents, 500)
  // …while the variant target's $10 override beats its product's $5.
  assert.equal(lineFor(second.variant.id).discountCents, 1000)
  assert.equal(lineFor(second.variant.id).finalPriceCents, 3000)
  assert.equal(quote.body.discountCents, 2500)
  // The product API quotes the same targets the same way.
  const { body: firstDetail } = await request(`/products/${first.product.id}`)
  assert.equal(firstDetail.discountCents, 500)
  assert.equal(firstDetail.variants.find((item: { id: string }) => item.id === extra.id).discountCents, 500)
  const { body: secondDetail } = await request(`/products/${second.product.id}`)
  assert.equal(secondDetail.variants.find((item: { id: string }) => item.id === second.variant.id).discountCents, 1000)
  // Target filters still narrow the admin list.
  const listing = await request(`/admin/promotions?variantId=${second.variant.id}`, { token: adminToken })
  assert.equal(listing.body.pagination.total, 1)
  assert.equal(listing.body.data[0].id, promo.id)
  const productListing = await request(`/admin/promotions?productId=${first.product.id}`, { token: adminToken })
  assert.ok(productListing.body.data.some((item: { id: string }) => item.id === promo.id))
})

test('Promotions: quote previews an unsaved draft with per-target overrides and edit semantics', async () => {
  const { product, variant } = await catalog(`draft-${runId}`, { priceCents: 2000 })
  const items = [{ variantId: variant.id, quantity: 1 }]
  // Baseline: nothing running, nothing discounted.
  const base = await request('/cart/quote', { method: 'POST', body: { items } })
  assert.equal(base.body.items[0].discountCents, 0)
  // An unsaved 25% campaign previews its own discount — no save required.
  const draft = { name: 'Draft campaign', type: 'PERCENTAGE', value: 25, targets: [{ productId: product.id }] }
  const preview = await request('/cart/quote', { method: 'POST', body: { items, draft } })
  assert.equal(preview.body.items[0].originalPriceCents, 2000)
  assert.equal(preview.body.items[0].discountCents, 500)
  assert.equal(preview.body.items[0].finalPriceCents, 1500)
  assert.equal(preview.body.items[0].promotion.name, 'Draft campaign')
  // The draft writes nothing: a fresh quote without it stays undiscounted.
  assert.equal((await request('/cart/quote', { method: 'POST', body: { items } })).body.items[0].discountCents, 0)
  // Window gating is skipped for drafts, so a scheduled campaign still previews.
  const scheduled = await request('/cart/quote', {
    method: 'POST',
    body: { items, draft: { ...draft, startsAt: '2099-01-01T00:00:00Z' } },
  })
  assert.equal(scheduled.body.items[0].discountCents, 500)
  // Per-target override: the variant target's 75% beats the campaign's 25%.
  const overridden = await request('/cart/quote', {
    method: 'POST',
    body: { items, draft: { ...draft, targets: [{ productId: product.id }, { variantId: variant.id, value: 75 }] } },
  })
  assert.equal(overridden.body.items[0].discountCents, 1500)
  assert.equal(overridden.body.items[0].finalPriceCents, 500)
  // Editing: the draft stands in for the saved campaign of the same id, so the
  // preview shows the edited value instead of the stored one.
  const { body: saved } = await request('/admin/promotions', {
    method: 'POST', token: adminToken,
    body: { name: `Saved ${runId}`, type: 'PERCENTAGE', value: 10, targets: [{ productId: product.id }] },
    status: 201,
  })
  assert.equal((await request('/cart/quote', { method: 'POST', body: { items } })).body.items[0].discountCents, 200)
  const edited = await request('/cart/quote', {
    method: 'POST',
    body: { items, draft: { ...draft, id: saved.id, name: `Saved ${runId}`, value: 40 } },
  })
  assert.equal(edited.body.items[0].discountCents, 800)
  assert.equal(edited.body.items[0].promotion.id, saved.id)
  // Invalid drafts are rejected exactly like create payloads.
  await request('/cart/quote', { method: 'POST', body: { items, draft: { ...draft, value: 150 } }, status: 400 })
  await request('/cart/quote', { method: 'POST', body: { items, draft: { ...draft, targets: [] } }, status: 400 })
  await request('/cart/quote', { method: 'POST', body: { items, draft: { ...draft, targets: [{ productId: product.id, value: 0 }] } }, status: 400 })
})

test('Promotions: checkout snapshots discounts onto order items without touching prices or stock', async () => {
  const { product, variant } = await catalog(`checkout-${runId}`, { priceCents: 3000, stock: 5 })
  await request('/admin/promotions', {
    method: 'POST', token: adminToken,
    body: { name: `Checkout promo ${runId}`, marquee: '15% off', type: 'PERCENTAGE', value: 15, targets: [{ productId: product.id }] },
    status: 201,
  })
  const productBefore = await prisma.product.findUniqueOrThrow({ where: { id: product.id } })
  const variantBefore = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } })
  const { body: order } = await request('/orders', {
    method: 'POST', token: userToken,
    body: { items: [{ variantId: variant.id, quantity: 2 }], ...shipping },
    status: 201,
  })
  // 3000c × 2 = 6000 subtotal; 15% = 450c/unit → 900c discount; the default 8%
  // tax (480c) applies to the subtotal, so total = 6000 − 900 + 480 = 5580c.
  assert.equal(order.subtotal, 60)
  assert.equal(order.discount, 9)
  assert.equal(order.tax, 4.8)
  assert.equal(order.total, 55.8)
  const item = order.items[0]
  assert.equal(item.unitPriceCents, 3000)
  assert.equal(item.lineTotalCents, 6000)
  assert.equal(item.discountCents, 450)
  assert.equal(item.promotionName, `Checkout promo ${runId}`)
  assert.ok(item.promotionId)
  assert.equal(item.originalUnitPriceCents, 3000)
  assert.equal(item.finalUnitPriceCents, 2550)
  // Persistence: originals unchanged, discount snapshot stored, stock decremented only.
  const stored = await prisma.orderItem.findUniqueOrThrow({ where: { id: item.id } })
  assert.equal(stored.unitPriceCents, 3000)
  assert.equal(stored.discountCents, 450)
  assert.ok(stored.promotionId)
  assert.equal(stored.promotionName, `Checkout promo ${runId}`)
  const productAfter = await prisma.product.findUniqueOrThrow({ where: { id: product.id } })
  const variantAfter = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } })
  assert.equal(productAfter.priceCents, productBefore.priceCents)
  assert.equal(variantAfter.priceCents, variantBefore.priceCents)
  assert.equal(variantAfter.stock, 3)
  // Order history keeps the snapshot after the promotion is deactivated.
  await request(`/admin/promotions/${item.promotionId}`, { method: 'DELETE', token: adminToken })
  const { body: detail } = await request(`/orders/${order.id}`, { token: userToken })
  assert.equal(detail.items[0].promotionName, `Checkout promo ${runId}`)
  assert.equal(detail.items[0].discountCents, 450)
  assert.equal(detail.discount, 9)
})

test('Promotions: a variant-only campaign still surfaces on the product card payload of a multi-variant product', async () => {
  const { product, variant } = await catalog(`card-${runId}`, { priceCents: 2500 })
  const sibling = await prisma.productVariant.create({
    data: { productId: product.id, sku: `V2-card-${runId}`, size: 'L', colorName: 'Blue', stock: 5 },
  })
  await request('/admin/promotions', {
    method: 'POST', token: adminToken,
    body: { name: `Card promo ${runId}`, type: 'PERCENTAGE', value: 20, targets: [{ variantId: variant.id }] },
    status: 201,
  })
  // The homepage card reads the product row: it must show the available offer
  // even though only one variant carries the campaign.
  const { body: detail } = await request(`/products/${product.id}`)
  assert.equal(detail.promotion.type, 'PERCENTAGE')
  assert.equal(detail.discountCents, 500)
  assert.equal(detail.finalPriceCents, 2000)
  // Variant rows stay authoritative: discounted target, untouched sibling.
  assert.equal(detail.variants.find((item: { id: string }) => item.id === variant.id).discountCents, 500)
  assert.equal(detail.variants.find((item: { id: string }) => item.id === sibling.id).discountCents, 0)
  // The list endpoint the storefront grid uses agrees with the detail payload.
  const { body: list } = await request(`/products?q=card-${runId}`)
  const row = list.find((item: { id: string }) => item.id === product.id)
  assert.equal(row.discountCents, 500)
  assert.equal(row.promotion.type, 'PERCENTAGE')
})

test('Promotions: fixed discount never exceeds the unit price and quote rejects bad input', async () => {
  const { product, variant } = await catalog(`fixed-${runId}`, { priceCents: 1000 })
  await request('/admin/promotions', {
    method: 'POST', token: adminToken,
    body: { name: `Overreach ${runId}`, type: 'FIXED', value: 5000, targets: [{ productId: product.id }] },
    status: 201,
  })
  const { body: quote } = await request('/cart/quote', { method: 'POST', body: { items: [{ variantId: variant.id, quantity: 1 }] } })
  assert.equal(quote.items[0].discountCents, 1000)
  assert.equal(quote.items[0].finalPriceCents, 0)
  assert.equal(quote.totalCents, 0)
  // Quote input validation mirrors order item validation.
  await request('/cart/quote', { method: 'POST', body: { items: [] }, status: 400 })
  await request('/cart/quote', { method: 'POST', body: { items: [{ variantId: variant.id, quantity: 0 }] }, status: 400 })
  await request('/cart/quote', { method: 'POST', body: { items: [{ variantId: variant.id, quantity: 1 }, { variantId: variant.id, quantity: 2 }] }, status: 400 })
  await request('/cart/quote', { method: 'POST', body: { items: [{ variantId: 'missing-variant-id', quantity: 1 }] }, status: 404 })
  await request('/cart/quote', { method: 'POST', body: {}, status: 400 })
})
