import assert from 'node:assert/strict'
import { test, mock, after } from 'node:test'
import { cloudinary } from '../src/config/cloudinary.js'
import { adminId, adminToken, catalog, prisma, request, runId, userId, userToken } from './helpers.js'

// No real Cloudinary request is permitted from the isolated endpoint suite.
// Buffers/public IDs remain real API data; only the provider boundary is mocked.
const uploadedBuffers: Buffer[] = []
const deletedAssets: string[] = []
const uploadMock = mock.method(cloudinary.uploader, 'upload_stream', (_options: unknown, callback: (error: unknown, result?: unknown) => void) => ({
  end(buffer: Buffer) {
    uploadedBuffers.push(buffer)
    const publicId = `move/products/colour-test-${runId}-${uploadedBuffers.length}`
    callback(null, { public_id: publicId, secure_url: `https://res.cloudinary.com/test/image/upload/${publicId}.png`, width: 1, height: 1, format: 'png', bytes: buffer.length })
  },
}))
const destroyMock = mock.method(cloudinary.uploader, 'destroy', async (publicId: string) => {
  deletedAssets.push(publicId)
  return { result: 'ok' }
})
after(() => { uploadMock.mock.restore(); destroyMock.mock.restore() })

test('Products: admin gate, strict validation, atomic nested CRUD, public visibility and pagination', async () => {
  await request('/admin/products', { status: 401 })
  await request('/admin/products', { token: userToken, status: 403 })
  const { category } = await catalog('products')
  await request('/admin/products', { method: 'POST', token: adminToken, body: {}, status: 400 })
  await request('/admin/products', { method: 'POST', token: adminToken, body: { sku: 'x', name: 'x', slug: 'x', categoryId: category.id, priceCents: 100, role: 'ADMIN' }, status: 400 })
  const input = {
    name: `MOVE Training ${runId}`, sku: `MOVE-${runId}`, slug: `move-training-${runId}`, categoryId: category.id,
    priceCents: 3000, mrpCents: 4000, tags: ['FEATURED', 'NEW_ARRIVAL'], gender: 'UNISEX',
    images: [{ url: 'https://example.invalid/first.jpg' }, { url: 'https://example.invalid/second.jpg' }],
    variants: [{ sku: `MOVE-M-${runId}`, size: 'M', colorName: 'Black', colorHex: '#000000', stock: 8, priceCents: 3500 }],
  }
  const { body: created } = await request('/admin/products', { method: 'POST', token: adminToken, body: input, status: 201 })
  assert.equal(created.status, 'DRAFT')
  assert.equal(created.images.filter((image: { isPrimary: boolean }) => image.isPrimary).length, 1)
  assert.equal(created.variants[0].effectivePriceCents, 3500)
  assert.equal(created.price, 30)
  assert.equal('legacyImages' in created, false)
  assert.equal('legacyColor' in created.variants[0], false)
  const receipt = await prisma.inventoryMovement.findFirstOrThrow({ where: { variantId: created.variants[0].id } })
  assert.equal(receipt.stockAfter, 8)
  assert.equal(receipt.actorId, adminId)
  await request(`/products/${created.id}`, { status: 404 })
  await request(`/admin/products/${created.id}`, { token: adminToken })
  await request('/admin/products', { method: 'POST', token: adminToken, body: input, status: 409 })
  await request('/admin/products', { method: 'POST', token: adminToken, body: { ...input, sku: `ROLLBACK-${runId}`, slug: `rollback-${runId}`, variants: [input.variants[0]] }, status: 409 })
  assert.equal(await prisma.product.count({ where: { sku: `ROLLBACK-${runId}` } }), 0)
  await request(`/admin/products/${created.id}`, { method: 'PATCH', token: adminToken, body: { priceCents: 5000 }, status: 400 })
  await request(`/admin/products/${created.id}`, { method: 'PATCH', token: adminToken, body: { status: 'ACTIVE' } })
  await request(`/products/${created.slug}`)
  const { body: listed, headers } = await request(`/products?q=MOVE%20Training&categoryId=${category.id}&tags=FEATURED,NEW_ARRIVAL&inStock=true&size=M&colorName=Black&minPriceCents=2500&maxPriceCents=4000&sortBy=priceCents&sortOrder=asc&limit=1`)
  assert.equal(listed.length, 1)
  assert.equal(listed[0].id, created.id)
  assert.equal(headers.get('x-total-count'), '1')
  const { body: adminList } = await request(`/admin/products?categoryId=${category.id}&limit=1`, { token: adminToken })
  assert.equal(adminList.pagination.total, 2)
  assert.equal(adminList.data.length, 1)
  await request('/products?page=0', { status: 400 })
  await request('/products?inStock=1', { status: 400 })
  await request('/products?minPriceCents=5000&maxPriceCents=1', { status: 400 })
  await request('/products?sortBy=passwordHash', { status: 400 })
  await request('/products?status=DRAFT', { status: 400 })
  await request('/products?tags=INVALID', { status: 400 })

  const { body: added } = await request(`/admin/products/${created.id}/images`, { method: 'POST', token: adminToken, body: { url: 'https://example.invalid/third.jpg', isPrimary: true }, status: 201 })
  const { body: detail } = await request(`/products/${created.id}`)
  assert.equal(detail.image, added.url)
  assert.equal(detail.images.filter((image: { isPrimary: boolean }) => image.isPrimary).length, 1)
  await request(`/admin/products/${created.id}/images`, { method: 'POST', token: adminToken, body: { url: 'javascript:alert(1)' }, status: 400 })
  await request(`/admin/products/${created.id}/images/reorder`, { method: 'PATCH', token: adminToken, body: { imageIds: [added.id] }, status: 400 })
  const ids = detail.images.map((image: { id: string }) => image.id).reverse()
  const { body: reordered } = await request(`/admin/products/${created.id}/images/reorder`, { method: 'PATCH', token: adminToken, body: { imageIds: ids } })
  assert.deepEqual(reordered.map((image: { id: string }) => image.id), ids)
  await request(`/admin/products/${created.id}/images/${added.id}`, { method: 'PATCH', token: adminToken, body: { altText: 'MOVE training image' } })
  await request(`/admin/products/${created.id}/images/${added.id}`, { method: 'DELETE', token: adminToken })
  assert.equal((await prisma.productImage.findUniqueOrThrow({ where: { id: added.id } })).isActive, false)
  const { body: afterRemoval } = await request(`/products/${created.id}`)
  assert.equal(afterRemoval.images.length, 2)
  assert.equal(afterRemoval.images.filter((image: { isPrimary: boolean }) => image.isPrimary).length, 1)

  const { body: variant } = await request(`/admin/products/${created.id}/variants`, { method: 'POST', token: adminToken, body: { sku: `MOVE-L-${runId}`, size: 'L', colorName: 'Black', stock: 2 }, status: 201 })
  await request(`/admin/products/${created.id}/variants`, { method: 'POST', token: adminToken, body: { sku: `DUPLICATE-${runId}`, size: 'L', colorName: 'Black' }, status: 409 })
  await request(`/admin/products/${created.id}/variants/${variant.id}`, { method: 'PATCH', token: adminToken, body: { stock: 100 }, status: 400 })
  await request(`/admin/products/${created.id}/variants/${variant.id}`, { method: 'PATCH', token: adminToken, body: { priceCents: 4500, lowStockThreshold: 3, expectedUpdatedAt: variant.updatedAt } })
  const foreign = await catalog('foreign-products')
  await request(`/admin/products/${foreign.product.id}/variants/${variant.id}`, { method: 'PATCH', token: adminToken, body: { size: 'XL' }, status: 404 })
  const currentVariant = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } })
  await request(`/admin/products/${created.id}/variants/${variant.id}`, { method: 'DELETE', token: adminToken, body: { expectedUpdatedAt: currentVariant.updatedAt.toISOString() } })
  assert.equal((await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } })).stock, 2)
  assert.equal((await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } })).isActive, false)

  await request(`/admin/products/${created.id}`, { method: 'DELETE', token: adminToken })
  await request(`/products/${created.id}`, { status: 404 })
  assert.equal((await prisma.product.findUniqueOrThrow({ where: { id: created.id } })).status, 'ARCHIVED')
  assert.equal(await prisma.productVariant.count({ where: { productId: created.id } }), 2)
})

test('Products image ordering handles maximum integer and catalogs with more than 30 preserved images', async () => {
  const { product } = await catalog('image-order-bounds')
  const first = await request(`/admin/products/${product.id}/images`, { method: 'POST', token: adminToken, body: { url: 'https://example.invalid/max.jpg', sortOrder: 2_147_483_647 }, status: 201 })
  const second = await request(`/admin/products/${product.id}/images`, { method: 'POST', token: adminToken, body: { url: 'https://example.invalid/append.jpg' }, status: 201 })
  assert.equal(second.body.sortOrder, 1)
  assert.equal((await prisma.productImage.findUniqueOrThrow({ where: { id: first.body.id } })).sortOrder, 0)
  const preserved = await catalog('preserved-images')
  await prisma.productImage.createMany({ data: Array.from({ length: 31 }, (_, index) => ({ productId: preserved.product.id, url: `https://example.invalid/legacy-${index}.jpg`, sortOrder: index, isPrimary: index === 0 })) })
  const images = await prisma.productImage.findMany({ where: { productId: preserved.product.id }, orderBy: { sortOrder: 'desc' }, select: { id: true } })
  const ids = images.map(image => image.id)
  const reordered = await request(`/admin/products/${preserved.product.id}/images/reorder`, { method: 'PATCH', token: adminToken, body: { imageIds: ids } })
  assert.deepEqual(reordered.body.map((image: { id: string }) => image.id), ids)
  assert.equal(await prisma.productImage.count({ where: { productId: preserved.product.id, isActive: true } }), 31)
  await request(`/admin/products/${preserved.product.id}/images`, { method: 'POST', token: adminToken, body: { url: 'https://example.invalid/new.jpg' }, status: 409 })
})

type TestImage = { id: string; colorId: string | null; url: string; isPrimary: boolean; isActive: boolean; sortOrder: number; publicId: string | null }
type TestVariant = { id: string; colorId: string | null; sku: string; size: string; stock: number; priceCents: number | null; effectivePriceCents: number; lowStockThreshold: number; updatedAt: string }
type TestColor = { id: string; name: string; hex: string | null; isActive: boolean; image: string | null; usesSharedGallery: boolean; updatedAt: string; images: TestImage[]; variants: TestVariant[] }

test('Product colours: exact size sets, independent prices/stock, grouped galleries and legacy responses', async () => {
  const { category } = await catalog('colour-architecture')
  const specs = [
    { name: 'White', hex: '#FFFFFF', sizes: [['S', 10], ['M', 15], ['XL', 8]] as const },
    { name: 'Grey', hex: '#888888', sizes: [['S', 5], ['L', 12]] as const },
    { name: 'Black', hex: '#000000', sizes: [['M', 20], ['L', 10], ['XL', 7]] as const },
  ]
  const input = {
    sku: `COLOURS-${runId}`, name: 'Oversized Gym T-shirt', slug: `colour-shirt-${runId}`, categoryId: category.id, status: 'ACTIVE', priceCents: 3000,
    images: [{ url: 'https://example.invalid/shared-cover.jpg' }],
    colors: specs.map((spec, sortOrder) => ({ name: spec.name, hex: spec.hex, sortOrder,
      images: ['front', 'back', 'side'].map((view, index) => ({ url: `https://example.invalid/${spec.name}-${view}.jpg`, altText: view, sortOrder: index, isPrimary: view === 'back' })),
      variants: spec.sizes.map(([size, stock]) => ({ sku: `COLOUR-${spec.name}-${size}-${runId}`, size, stock, lowStockThreshold: 3, priceCents: spec.name === 'Black' && size === 'M' ? 3500 : null })),
    })),
  }
  const { body: created } = await request('/admin/products', { method: 'POST', token: adminToken, body: input, status: 201 })
  const colors = created.colors as TestColor[]
  assert.deepEqual(colors.map(color => color.name), ['White', 'Grey', 'Black'])
  assert.equal(created.variants.length, 8)
  assert.equal(created.images.length, 10)
  assert.equal(created.sharedImages.length, 1)
  assert.equal(created.image, input.images[0].url)
  assert.equal(created.price, 30)
  assert.equal(created.stock, 87)
  for (const [index, color] of colors.entries()) {
    assert.deepEqual(color.variants.map(variant => variant.size).sort(), specs[index].sizes.map(([size]) => size).sort())
    assert.equal(color.images.length, 3)
    assert.equal(color.images.filter(image => image.isPrimary).length, 1)
    assert.equal(color.image, input.colors[index].images[1].url)
    assert.equal(color.usesSharedGallery, false)
    for (const variant of color.variants) {
      assert.equal(variant.colorId, color.id)
      const movement = await prisma.inventoryMovement.findFirstOrThrow({ where: { variantId: variant.id } })
      assert.equal(movement.stockAfter, variant.stock)
      assert.equal(movement.quantityDelta, variant.stock)
      assert.equal(movement.actorId, adminId)
    }
  }
  const blackM = colors[2].variants.find(variant => variant.size === 'M')!
  assert.equal(blackM.effectivePriceCents, 3500)
  const { body: detail } = await request(`/products/${created.slug}`)
  assert.equal(detail.variants.length, 8)
  const filtered = await request(`/products?colorId=${colors[0].id}&size=M&inStock=true`)
  assert.ok(filtered.body.some((product: { id: string }) => product.id === created.id))
  const impossible = await request(`/products?colorId=${colors[1].id}&size=XL`)
  assert.equal(impossible.body.length, 0)
  await request(`/admin/products/${created.id}/variants`, { method: 'POST', token: adminToken, body: { sku: `COLOUR-DUP-${runId}`, colorId: colors[0].id, size: 'S' }, status: 409 })

  const whiteImages = colors[0].images
  const greyBefore = await prisma.productImage.findMany({ where: { colorId: colors[1].id }, orderBy: { id: 'asc' } })
  const reverse = whiteImages.map(image => image.id).reverse()
  const { body: reordered } = await request(`/admin/products/${created.id}/colors/${colors[0].id}/images/reorder`, { method: 'PATCH', token: adminToken, body: { imageIds: reverse } })
  assert.deepEqual(reordered.map((image: TestImage) => image.id), reverse)
  await request(`/admin/products/${created.id}/colors/${colors[0].id}/images/${whiteImages[2].id}`, { method: 'PATCH', token: adminToken, body: { isPrimary: true } })
  await request(`/admin/products/${created.id}/colors/${colors[0].id}/images/${whiteImages[2].id}`, { method: 'DELETE', token: adminToken })
  const remaining = await prisma.productImage.findMany({ where: { colorId: colors[0].id, isActive: true } })
  assert.equal(remaining.filter(image => image.isPrimary).length, 1)
  assert.deepEqual(await prisma.productImage.findMany({ where: { colorId: colors[1].id }, orderBy: { id: 'asc' } }), greyBefore)
  await request(`/admin/products/${created.id}/images/reorder`, { method: 'PATCH', token: adminToken, body: { imageIds: [created.sharedImages[0].id] }, status: 409 })
  await request(`/admin/products/${created.id}/images/reorder`, { method: 'PATCH', token: adminToken, body: { colorId: null, imageIds: [created.sharedImages[0].id] } })
  await request(`/admin/products/${created.id}/colors/${colors[0].id}/images/reorder`, { method: 'PATCH', token: adminToken, body: { imageIds: colors[1].images.map(image => image.id) }, status: 400 })
  await request(`/admin/products/${created.id}/colors/${colors[0].id}/images/${colors[1].images[0].id}`, { method: 'PATCH', token: adminToken, body: { isPrimary: true }, status: 404 })

  const blackRows = await prisma.productVariant.findMany({ where: { colorId: colors[2].id }, orderBy: { id: 'asc' } })
  const movementCount = await prisma.inventoryMovement.count({ where: { variant: { productId: created.id } } })
  await request(`/admin/products/${created.id}/colors/${colors[2].id}`, { method: 'PATCH', token: adminToken, body: { name: 'Charcoal', hex: '#222222' } })
  assert.equal(await prisma.inventoryMovement.count({ where: { variant: { productId: created.id } } }), movementCount)
  for (const before of blackRows) {
    const after = await prisma.productVariant.findUniqueOrThrow({ where: { id: before.id } })
    assert.equal(after.sku, before.sku)
    assert.equal(after.stock, before.stock)
    assert.equal(after.priceCents, before.priceCents)
    assert.equal(after.lowStockThreshold, before.lowStockThreshold)
    assert.equal(after.colorName, 'Charcoal')
    assert.equal(after.colorHex, '#222222')
  }
  const grey = await prisma.productColor.findUniqueOrThrow({ where: { id: colors[1].id } })
  await request(`/admin/products/${created.id}/colors/${grey.id}`, { method: 'DELETE', token: adminToken, body: { expectedUpdatedAt: grey.updatedAt.toISOString() } })
  const hidden = await request(`/products/${created.id}`)
  assert.equal(hidden.body.colors.length, 2)
  assert.equal(hidden.body.variants.length, 6)
  assert.equal(hidden.body.stock, 70)
  const activeInventory = await request(`/admin/inventory?productId=${created.id}`, { token: adminToken })
  assert.equal(activeInventory.body.pagination.total, 6)
  assert.ok(activeInventory.body.data.every((variant: TestVariant) => variant.colorId !== grey.id))
  const activeStats = await request(`/admin/inventory/stats?productId=${created.id}`, { token: adminToken })
  assert.deepEqual(activeStats.body, { variants: 6, totalStock: 70, lowStock: 0, outOfStock: 0 })
  assert.equal(await prisma.productVariant.count({ where: { colorId: grey.id } }), 2)
  assert.equal((await prisma.productVariant.aggregate({ where: { colorId: grey.id }, _sum: { stock: true } }))._sum.stock, 17)
  const greyVariant = colors[1].variants[0]
  await request(`/admin/inventory/${greyVariant.id}/adjustments`, { method: 'POST', token: adminToken, body: { delta: 1, reason: 'Explicit count' }, status: 409 })
  await request(`/admin/products/${created.id}/colors/${grey.id}`, { method: 'PATCH', token: adminToken, body: { isActive: true } })
  assert.equal((await request(`/products/${created.id}`)).body.variants.length, 8)
})

test('Colour compatibility, ownership and metadata saves do not replace variants or inventory', async () => {
  const { category } = await catalog('colour-compatibility')
  const { body: product } = await request('/admin/products', { method: 'POST', token: adminToken, status: 201, body: {
    sku: `COMPAT-${runId}`, name: 'Compatibility product', slug: `compat-colour-${runId}`, categoryId: category.id, priceCents: 2000,
    images: [{ url: 'https://example.invalid/legacy-gallery.jpg' }],
    variants: [{ sku: `COMPAT-WHITE-${runId}`, size: 'S', colorName: 'White', colorHex: '#181B15', stock: 50 }, { sku: `COMPAT-BLACK-${runId}`, size: 'M', colorName: 'Black', colorHex: '#181B15', stock: 10 }],
  } })
  const colors = product.colors as TestColor[]
  assert.equal(colors.length, 2)
  assert.ok(colors.every(color => color.usesSharedGallery && color.image === product.image))
  assert.notEqual(colors[0].id, colors[1].id)
  const variants = product.variants as TestVariant[]
  const before = await prisma.productVariant.findMany({ where: { productId: product.id }, orderBy: { id: 'asc' } })
  const history = await prisma.inventoryMovement.findMany({ where: { variant: { productId: product.id } }, orderBy: { id: 'asc' } })
  await request(`/admin/products/${product.id}`, { method: 'PATCH', token: adminToken, body: { description: 'An ordinary save' } })
  assert.deepEqual(await prisma.productVariant.findMany({ where: { productId: product.id }, orderBy: { id: 'asc' } }), before)
  assert.deepEqual(await prisma.inventoryMovement.findMany({ where: { variant: { productId: product.id } }, orderBy: { id: 'asc' } }), history)
  await request(`/admin/products/${product.id}`, { method: 'PATCH', token: adminToken, body: { variants: [] }, status: 400 })
  await request(`/admin/products/${product.id}`, { method: 'PATCH', token: adminToken, body: { colors: [] }, status: 400 })
  await request(`/admin/products/${product.id}`, { method: 'PATCH', token: adminToken, body: { stock: 0 }, status: 400 })
  await request(`/admin/products/${product.id}/variants/${variants[0].id}`, { method: 'PATCH', token: adminToken, body: { stock: 0 }, status: 400 })
  await request(`/admin/inventory/${variants[0].id}/adjustments`, { method: 'POST', token: adminToken, body: { delta: -1, expectedStock: variants[0].stock, reason: 'Stock edited from the admin product form' }, status: 409 })

  const { body: added } = await request(`/admin/products/${product.id}/variants`, { method: 'POST', token: adminToken, body: { sku: `COMPAT-NEW-${runId}`, colorName: 'White', size: 'XL', stock: 3 }, status: 201 })
  // The unchanged legacy hook tries to DELETE rows absent from its stale draft.
  await request(`/admin/products/${product.id}/variants/${added.id}`, { method: 'DELETE', token: adminToken, status: 400 })
  await request(`/admin/products/${product.id}/variants/${added.id}`, { method: 'PATCH', token: adminToken, body: { isActive: false }, status: 400 })
  assert.equal((await prisma.productVariant.findUniqueOrThrow({ where: { id: added.id } })).isActive, true)
  const stale = added.updatedAt
  const changed = await request(`/admin/products/${product.id}/variants/${added.id}`, { method: 'PATCH', token: adminToken, body: { priceCents: 2200, expectedUpdatedAt: added.updatedAt } })
  await request(`/admin/products/${product.id}/variants/${added.id}`, { method: 'DELETE', token: adminToken, body: { expectedUpdatedAt: stale }, status: 409 })
  await request(`/admin/products/${product.id}/variants/${added.id}`, { method: 'DELETE', token: adminToken, body: { expectedUpdatedAt: changed.body.updatedAt } })
  assert.equal((await prisma.productVariant.findUniqueOrThrow({ where: { id: added.id } })).stock, 3)
  assert.equal(await prisma.inventoryMovement.count({ where: { variantId: added.id } }), 1)
  const concurrentlyAdded = await prisma.productVariant.findUniqueOrThrow({ where: { id: added.id } })
  assert.equal(concurrentlyAdded.isActive, false)
  await request(`/admin/products/${product.id}/variants/${added.id}`, { method: 'PATCH', token: adminToken, body: { isActive: true, expectedUpdatedAt: concurrentlyAdded.updatedAt.toISOString() } })
  const fresh = await prisma.productVariant.findUniqueOrThrow({ where: { id: added.id } })
  await request(`/admin/inventory/${added.id}/adjustments`, { method: 'POST', token: adminToken, body: { delta: 2, expectedStock: 3, reason: 'Separate inventory receipt', type: 'RECEIPT' }, status: 201 })
  await request(`/admin/products/${product.id}/variants/${added.id}`, { method: 'DELETE', token: adminToken, body: { expectedUpdatedAt: fresh.updatedAt.toISOString() }, status: 409 })
  assert.equal((await prisma.productVariant.findUniqueOrThrow({ where: { id: added.id } })).stock, 5)
  const preThreshold = await prisma.productVariant.findUniqueOrThrow({ where: { id: added.id } })
  await request(`/admin/inventory/${added.id}`, { method: 'PATCH', token: adminToken, body: { lowStockThreshold: preThreshold.lowStockThreshold + 1 } })
  await request(`/admin/products/${product.id}/variants/${added.id}`, { method: 'DELETE', token: adminToken, body: { expectedUpdatedAt: preThreshold.updatedAt.toISOString() }, status: 409 })

  const foreign = await catalog('colour-owner')
  const { body: foreignColor } = await request(`/admin/products/${foreign.product.id}/colors`, { method: 'POST', token: adminToken, body: { name: 'Other' }, status: 201 })
  await request(`/admin/products/${product.id}/variants`, { method: 'POST', token: adminToken, body: { sku: `FOREIGN-COLOR-${runId}`, colorId: foreignColor.id, size: 'L' }, status: 404 })
  await request(`/admin/products/${product.id}/images`, { method: 'POST', token: adminToken, body: { url: 'https://example.invalid/foreign.jpg', colorId: foreignColor.id }, status: 404 })
  await request(`/admin/products/${product.id}/variants/${variants[0].id}`, { method: 'PATCH', token: adminToken, body: { colorId: foreignColor.id }, status: 404 })
  await request(`/admin/products/${product.id}/colors/${foreignColor.id}`, { method: 'PATCH', token: adminToken, body: { name: 'Stolen' }, status: 404 })
  await request(`/admin/products/${product.id}/colors`, { method: 'POST', token: userToken, body: { name: 'Forbidden' }, status: 403 })
  await request(`/admin/products/${product.id}/colors`, { method: 'POST', token: adminToken, body: { name: 'White' }, status: 409 })
  await request(`/admin/products/${product.id}/colors`, { method: 'POST', token: adminToken, body: { name: 'Bad swatch', hex: '#zzzzzz' }, status: 400 })
})

test('Variant metadata round-trips preserve legacy identities and reject stale drawer overwrites', async () => {
  const { product } = await catalog('colour-metadata-regressions')
  const [padded, plain, conflicting] = await Promise.all([
    prisma.productColor.create({ data: { productId: product.id, name: ' Black ', hex: '#111111' } }),
    prisma.productColor.create({ data: { productId: product.id, name: 'Black', hex: '#000000' } }),
    prisma.productColor.create({ data: { productId: product.id, name: 'White', hex: null } }),
  ])
  const legacy = await prisma.productVariant.create({ data: { productId: product.id, colorId: padded.id, colorName: padded.name, colorHex: ' #111111 ', size: ' M ', sku: `PADDED-${runId}`, stock: 9, priceCents: 2700, lowStockThreshold: 2, legacyColor: 'Old snapshot colour' } })
  const swatch = await prisma.productVariant.create({ data: { productId: product.id, colorId: conflicting.id, colorName: conflicting.name, colorHex: '#FFFFFF', size: 'S', sku: `SWATCH-S-${runId}`, stock: 11, lowStockThreshold: 4 } })
  await prisma.productVariant.create({ data: { productId: product.id, colorId: conflicting.id, colorName: conflicting.name, colorHex: '#EEEEEE', size: 'L', sku: `SWATCH-L-${runId}`, stock: 6 } })
  const unlinked = await prisma.productVariant.create({ data: { productId: product.id, colorName: conflicting.name, colorHex: '#DDDDDD', size: 'XL', sku: `UNLINKED-${runId}`, stock: 5 } })
  const explicitlyLinked = await prisma.productVariant.create({ data: { productId: product.id, colorName: conflicting.name, colorHex: '#CCCCCC', size: 'XS', sku: `UNLINKED-ID-${runId}`, stock: 4 } })
  const gallery = await prisma.productImage.create({ data: { productId: product.id, colorId: conflicting.id, url: 'https://example.invalid/original-white.jpg', isPrimary: true } })
  const movement = await prisma.inventoryMovement.create({ data: { variantId: swatch.id, actorId: adminId, type: 'RECEIPT', quantityDelta: swatch.stock, stockBefore: 0, stockAfter: swatch.stock, reason: 'Original fixture receipt' } })
  const cart = await prisma.cart.upsert({ where: { userId }, create: { userId }, update: {} })
  const cartItem = await prisma.cartItem.create({ data: { cartId: cart.id, variantId: swatch.id, quantity: 2 } })
  const order = await prisma.order.create({ data: {
    orderNumber: `COLOUR-SNAPSHOT-${runId}`, userId, status: 'PAID', subtotalCents: 5000, totalCents: 5000,
    shippingName: 'Test recipient', shippingLine1: 'Test address', shippingCity: 'Test city', shippingPostal: '00000', shippingCountry: 'US',
    items: { create: { productId: product.id, variantId: swatch.id, name: 'Original product snapshot', sku: swatch.sku, size: swatch.size, color: swatch.colorName, image: gallery.url, unitPriceCents: 2500, quantity: 2, lineTotalCents: 5000 } },
  }, include: { items: true } })
  const metadata = (variant: { sku: string; size: string; colorName: string; colorHex: string; priceCents: number | null; lowStockThreshold: number }) => ({ sku: variant.sku, size: variant.size, colorName: variant.colorName, colorHex: variant.colorHex, priceCents: variant.priceCents, lowStockThreshold: variant.lowStockThreshold })

  await request(`/admin/products/${product.id}/variants/${legacy.id}`, { method: 'PATCH', token: adminToken, body: metadata(legacy) })
  await request(`/admin/products/${product.id}/variants/${legacy.id}`, { method: 'PATCH', token: adminToken, body: { ...metadata(legacy), colorId: legacy.colorId } })
  assert.deepEqual(await prisma.productVariant.findUniqueOrThrow({ where: { id: legacy.id } }), legacy)
  const priced = await request(`/admin/products/${product.id}/variants/${legacy.id}`, { method: 'PATCH', token: adminToken, body: { ...metadata(legacy), colorId: legacy.colorId, priceCents: 2800, expectedUpdatedAt: legacy.updatedAt.toISOString() } })
  assert.equal(priced.body.colorName, ' Black ')
  assert.equal(priced.body.size, ' M ')
  assert.equal(priced.body.colorId, padded.id)
  assert.equal(priced.body.colorHex, legacy.colorHex)
  assert.equal(await prisma.productColor.count({ where: { productId: product.id } }), 3)
  assert.notEqual(padded.id, plain.id)

  const invalid = await prisma.productVariant.create({ data: { productId: product.id, colorId: padded.id, colorName: padded.name, colorHex: 'not-a-hex', size: 'XXL', sku: `INVALID-LEGACY-${runId}`, stock: 2 } })
  await request(`/admin/products/${product.id}/variants/${invalid.id}`, { method: 'PATCH', token: adminToken, body: metadata(invalid) })
  assert.deepEqual(await prisma.productVariant.findUniqueOrThrow({ where: { id: invalid.id } }), invalid)
  const invalidPrice = await request(`/admin/products/${product.id}/variants/${invalid.id}`, { method: 'PATCH', token: adminToken, body: { ...metadata(invalid), colorId: invalid.colorId, priceCents: 2600, expectedUpdatedAt: invalid.updatedAt.toISOString() } })
  assert.equal(invalidPrice.body.colorHex, 'not-a-hex')
  await request(`/admin/products/${product.id}/variants/${invalid.id}`, { method: 'PATCH', token: adminToken, body: { colorHex: 'new-invalid-swatch', expectedUpdatedAt: invalidPrice.body.updatedAt }, status: 400 })
  assert.equal((await prisma.productVariant.findUniqueOrThrow({ where: { id: invalid.id } })).colorHex, invalid.colorHex)
  const invalidUnlinked = await prisma.productVariant.create({ data: { productId: product.id, colorName: 'Older invalid group', colorHex: 'original invalid swatch', size: 'S', sku: `INVALID-UNLINKED-${runId}` } })
  const associatedInvalid = await request(`/admin/products/${product.id}/variants/${invalidUnlinked.id}`, { method: 'PATCH', token: adminToken, body: metadata(invalidUnlinked) })
  assert.equal(associatedInvalid.body.colorHex, invalidUnlinked.colorHex)
  assert.equal((await prisma.productColor.findUniqueOrThrow({ where: { id: associatedInvalid.body.colorId } })).hex, null)

  await request(`/admin/products/${product.id}/variants/${swatch.id}`, { method: 'PATCH', token: adminToken, body: { colorId: swatch.colorId } })
  assert.deepEqual(await prisma.productVariant.findUniqueOrThrow({ where: { id: swatch.id } }), swatch)
  const override = await request(`/admin/products/${product.id}/variants/${swatch.id}`, { method: 'PATCH', token: adminToken, body: { colorId: swatch.colorId, priceCents: 3100, expectedUpdatedAt: swatch.updatedAt.toISOString() } })
  assert.equal(override.body.colorHex, '#FFFFFF')
  assert.equal((await prisma.productColor.findUniqueOrThrow({ where: { id: conflicting.id } })).hex, null)
  const linked = await request(`/admin/products/${product.id}/variants/${unlinked.id}`, { method: 'PATCH', token: adminToken, body: { priceCents: 3200, expectedUpdatedAt: unlinked.updatedAt.toISOString() } })
  assert.equal(linked.body.colorId, conflicting.id)
  assert.equal(linked.body.colorHex, '#DDDDDD')
  const linkedById = await request(`/admin/products/${product.id}/variants/${explicitlyLinked.id}`, { method: 'PATCH', token: adminToken, body: { colorId: conflicting.id, priceCents: 3300, expectedUpdatedAt: explicitlyLinked.updatedAt.toISOString() } })
  assert.equal(linkedById.body.colorHex, '#CCCCCC')

  const stale = await prisma.productVariant.findUniqueOrThrow({ where: { id: swatch.id } })
  await request(`/admin/products/${product.id}/colors/${conflicting.id}`, { method: 'PATCH', token: adminToken, body: { name: 'Ivory' } })
  const afterRename = await prisma.productVariant.findUniqueOrThrow({ where: { id: swatch.id } })
  await request(`/admin/products/${product.id}`, { method: 'PATCH', token: adminToken, body: { description: 'Only the description was changed in the old drawer' } })
  await request(`/admin/products/${product.id}/variants/${swatch.id}`, { method: 'PATCH', token: adminToken, body: metadata(stale), status: 409 })
  await request(`/admin/products/${product.id}/variants/${swatch.id}`, { method: 'PATCH', token: adminToken, body: { ...metadata(stale), expectedUpdatedAt: stale.updatedAt.toISOString() }, status: 409 })
  assert.deepEqual(await prisma.productVariant.findUniqueOrThrow({ where: { id: swatch.id } }), afterRename)
  assert.equal(await prisma.productColor.count({ where: { productId: product.id, name: 'White' } }), 0)
  assert.deepEqual(await prisma.productImage.findUniqueOrThrow({ where: { id: gallery.id } }), gallery)

  await request(`/admin/products/${product.id}/variants/${swatch.id}`, { method: 'PATCH', token: adminToken, body: { priceCents: 3400, lowStockThreshold: 7, expectedUpdatedAt: afterRename.updatedAt.toISOString() } })
  const afterConcurrentEdit = await prisma.productVariant.findUniqueOrThrow({ where: { id: swatch.id } })
  await request(`/admin/products/${product.id}/variants/${swatch.id}`, { method: 'PATCH', token: adminToken, body: metadata(afterRename), status: 409 })
  assert.deepEqual(await prisma.productVariant.findUniqueOrThrow({ where: { id: swatch.id } }), afterConcurrentEdit)
  await request(`/admin/products/${product.id}/variants/${swatch.id}`, { method: 'PATCH', token: adminToken, body: metadata(afterConcurrentEdit) })
  assert.deepEqual(await prisma.productVariant.findUniqueOrThrow({ where: { id: swatch.id } }), afterConcurrentEdit)

  const individual = await prisma.productVariant.findUniqueOrThrow({ where: { id: explicitlyLinked.id } })
  await request(`/admin/products/${product.id}/variants/${individual.id}`, { method: 'DELETE', token: adminToken, body: { expectedUpdatedAt: individual.updatedAt.toISOString() } })
  const children = await prisma.productVariant.findMany({ where: { colorId: conflicting.id }, orderBy: { id: 'asc' } })
  const colourImages = await prisma.productImage.findMany({ where: { colorId: conflicting.id }, orderBy: { id: 'asc' } })
  const revision = await prisma.productColor.findUniqueOrThrow({ where: { id: conflicting.id } })
  await request(`/admin/products/${product.id}/colors/${conflicting.id}`, { method: 'DELETE', token: adminToken, body: { expectedUpdatedAt: revision.updatedAt.toISOString() } })
  assert.ok((await request(`/products/${product.id}`)).body.variants.every((variant: TestVariant) => variant.colorId !== conflicting.id))
  assert.deepEqual(await prisma.productVariant.findMany({ where: { colorId: conflicting.id }, orderBy: { id: 'asc' } }), children)
  assert.deepEqual(await prisma.productImage.findMany({ where: { colorId: conflicting.id }, orderBy: { id: 'asc' } }), colourImages)
  await request(`/admin/products/${product.id}/colors/${conflicting.id}`, { method: 'PATCH', token: adminToken, body: { isActive: true } })
  const restored = (await request(`/products/${product.id}`)).body
  assert.ok(restored.variants.some((variant: TestVariant) => variant.id === swatch.id))
  assert.ok(!restored.variants.some((variant: TestVariant) => variant.id === individual.id))
  assert.deepEqual(await prisma.productVariant.findMany({ where: { colorId: conflicting.id }, orderBy: { id: 'asc' } }), children)
  assert.deepEqual(await prisma.productImage.findMany({ where: { colorId: conflicting.id }, orderBy: { id: 'asc' } }), colourImages)
  assert.deepEqual(await prisma.inventoryMovement.findUniqueOrThrow({ where: { id: movement.id } }), movement)
  assert.equal(await prisma.inventoryMovement.count({ where: { variantId: swatch.id } }), 1)
  assert.deepEqual(await prisma.cart.findUniqueOrThrow({ where: { id: cart.id } }), cart)
  assert.deepEqual(await prisma.cartItem.findUniqueOrThrow({ where: { id: cartItem.id } }), cartItem)
  assert.deepEqual(await prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: { items: true } }), order)
})

async function uploadRequest(path: string, method: 'POST' | 'PATCH', fields: Record<string, string> = {}, status = 201) {
  return request(path, { method, token: adminToken, file: { buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]), fields }, status })
}

test('Colour image uploads, replacements, explicit reassignment and cleanup preserve asset ownership', async () => {
  const { product } = await catalog('colour-assets')
  const white = await request(`/admin/products/${product.id}/colors`, { method: 'POST', token: adminToken, body: { name: 'Asset White' }, status: 201 })
  const black = await request(`/admin/products/${product.id}/colors`, { method: 'POST', token: adminToken, body: { name: 'Asset Black' }, status: 201 })
  const shared = await request(`/admin/products/${product.id}/images`, { method: 'POST', token: adminToken, body: { url: 'https://example.invalid/fallback.jpg' }, status: 201 })
  const startUploads = uploadedBuffers.length
  const uploaded = await uploadRequest(`/admin/products/${product.id}/colors/${white.body.id}/images`, 'POST', { altText: 'White front', isPrimary: 'true' })
  assert.equal(uploadedBuffers.length, startUploads + 1)
  assert.equal(uploaded.body.colorId, white.body.id)
  assert.ok(uploaded.body.publicId.startsWith('move/products/'))
  const originalId = uploaded.body.id
  const originalPublicId = uploaded.body.publicId
  const move = await request(`/admin/products/${product.id}/images/${originalId}`, { method: 'PATCH', token: adminToken, body: { colorId: black.body.id } })
  assert.equal(move.body.id, originalId)
  assert.equal(move.body.publicId, originalPublicId)
  assert.equal(move.body.colorId, black.body.id)
  assert.equal(uploadedBuffers.length, startUploads + 1)
  assert.ok(!deletedAssets.includes(originalPublicId))
  const copy = await prisma.productImage.create({ data: { productId: product.id, colorId: white.body.id, url: move.body.url, publicId: originalPublicId, isPrimary: true } })
  const replacement = await uploadRequest(`/admin/products/${product.id}/colors/${black.body.id}/images/${originalId}`, 'PATCH', {}, 200)
  assert.equal(replacement.body.id, originalId)
  assert.notEqual(replacement.body.publicId, originalPublicId)
  assert.equal(replacement.body.assetCleanup, 'retained')
  assert.ok(replacement.body.previousImageId)
  const retained = await prisma.productImage.findUniqueOrThrow({ where: { id: replacement.body.previousImageId } })
  assert.equal(retained.colorId, black.body.id)
  assert.equal(retained.publicId, originalPublicId)
  assert.equal(retained.isActive, false)
  assert.ok(!deletedAssets.includes(originalPublicId))
  assert.equal((await prisma.productImage.findUniqueOrThrow({ where: { id: copy.id } })).isPrimary, true)
  assert.equal((await prisma.productImage.findUniqueOrThrow({ where: { id: shared.body.id } })).isPrimary, true)
  const newPublicId = replacement.body.publicId
  const remove = await request(`/admin/products/${product.id}/colors/${black.body.id}/images/${originalId}`, { method: 'DELETE', token: adminToken })
  assert.equal(remove.body.assetCleanup, 'deleted')
  assert.ok(deletedAssets.includes(newPublicId))
  assert.equal((await prisma.productImage.findUniqueOrThrow({ where: { id: originalId } })).publicId, newPublicId)
  await request(`/admin/products/${product.id}/colors/${white.body.id}/images/${originalId}`, { method: 'DELETE', token: adminToken, status: 404 })
  const foreign = await catalog('colour-upload-owner')
  const foreignColor = await request(`/admin/products/${foreign.product.id}/colors`, { method: 'POST', token: adminToken, body: { name: 'Foreign' }, status: 201 })
  const count = uploadedBuffers.length
  await uploadRequest(`/admin/products/${product.id}/colors/${foreignColor.body.id}/images`, 'POST', {}, 404)
  assert.equal(uploadedBuffers.length, count)

  const legacy = await request(`/admin/products/${product.id}/colors/${black.body.id}/images`, { method: 'POST', token: adminToken, body: { url: 'https://example.invalid/external-original.jpg', altText: 'Original external image', sortOrder: 9, isPrimary: true }, status: 201 })
  const legacyBefore = await prisma.productImage.findUniqueOrThrow({ where: { id: legacy.body.id } })
  const deletesBefore = deletedAssets.length
  const changedExternal = await request(`/admin/products/${product.id}/colors/${black.body.id}/images/${legacy.body.id}`, { method: 'PATCH', token: adminToken, body: { url: 'https://example.invalid/external-new.jpg', altText: 'Replacement external image' } })
  assert.equal(changedExternal.body.id, legacyBefore.id)
  assert.equal(changedExternal.body.assetCleanup, 'not-managed')
  assert.ok(changedExternal.body.previousImageId)
  const externalAudit = await prisma.productImage.findUniqueOrThrow({ where: { id: changedExternal.body.previousImageId } })
  assert.deepEqual(externalAudit, { ...legacyBefore, id: externalAudit.id, isActive: false })
  assert.equal(deletedAssets.length, deletesBefore)
  assert.equal(uploadedBuffers.length, count)
  const newLegacy = await prisma.productImage.findUniqueOrThrow({ where: { id: legacyBefore.id } })
  const uploadedExternal = await uploadRequest(`/admin/products/${product.id}/colors/${black.body.id}/images/${legacyBefore.id}`, 'PATCH', {}, 200)
  assert.equal(uploadedExternal.body.assetCleanup, 'not-managed')
  const secondAudit = await prisma.productImage.findUniqueOrThrow({ where: { id: uploadedExternal.body.previousImageId } })
  assert.deepEqual(secondAudit, { ...newLegacy, id: secondAudit.id, isActive: false })
  assert.deepEqual(await prisma.productImage.findUniqueOrThrow({ where: { id: externalAudit.id } }), externalAudit)
  assert.equal(deletedAssets.length, deletesBefore)
  assert.equal(uploadedBuffers.length, count + 1)
  assert.equal((await prisma.productImage.findUniqueOrThrow({ where: { id: shared.body.id } })).isPrimary, true)
})
