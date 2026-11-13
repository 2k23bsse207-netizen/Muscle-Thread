import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as v from '../src/utils/validation.js'
import { parseDashboardQuery } from '../src/modules/admin/admin.validation.js'
import { parsePagination } from '../src/utils/pagination.js'
import { parseColor, parseCreateProduct, parseImage, parseImageOrder, parseImageUpload, parseRemoval, parseUpdateProduct, parseVariant } from '../src/modules/products/products.validation.js'
import { parseAdjustment } from '../src/modules/inventory/inventory.validation.js'

test('Shared validation rejects invalid calendar dates, input shapes, duplicate query params and integer overflows', () => {
  for (const invalid of ['2026-02-30T00:00:00Z', '2025-02-29T00:00:00Z', '2026-13-01T00:00:00Z', '2026-01-01T24:00:00Z', '2026-01-01', '2026-01-01T00:00:00+24:00']) {
    assert.throws(() => v.date(invalid, 'date'))
  }
  assert.equal(v.date('2024-02-29T12:30:00+02:00', 'date').toISOString(), '2024-02-29T10:30:00.000Z')
  assert.throws(() => v.object([]))
  assert.throws(() => v.object(null))
  assert.throws(() => v.object({ forbidden: true }, ['allowed']))
  assert.throws(() => v.queryInteger(['1', '2'], 'page'))
  assert.throws(() => v.queryInteger('1e3', 'page'))
  assert.throws(() => v.integer(2_147_483_648, 'stock'))
  assert.throws(() => v.integer(1.5, 'stock'))
  assert.throws(() => v.httpUrl('https://user:password@example.invalid/photo.jpg', 'image'))
  assert.throws(() => v.texts(['same', 'same'], 'tags'))
  assert.deepEqual(parsePagination({}), { page: 1, limit: 20 })
  assert.throws(() => parsePagination({ limit: '101' }))
  const period = parseDashboardQuery({ to: '2026-11-08T12:00:00Z' })
  assert.equal(period.from.toISOString(), '2026-10-10T00:00:00.000Z')
  assert.equal(period.currency, 'USD')
})

test('Product colour validation isolates galleries, option identities and explicit inventory/removal intent', () => {
  const base = { sku: 'VALIDATION-SHIRT', name: 'Shirt', slug: 'validation-shirt', categoryId: 'category', priceCents: 2000 }
  assert.deepEqual(parseColor({ name: ' White ', hex: '' }), { name: 'White', hex: null })
  assert.throws(() => parseColor({ name: '' }))
  assert.throws(() => parseColor({ name: 'White', hex: '#zzz123' }))
  assert.throws(() => parseColor({ isActive: false }, true))
  assert.throws(() => parseRemoval({}))
  const revision = '2026-11-09T00:00:00.000Z'
  assert.equal(parseRemoval({ expectedUpdatedAt: revision }).expectedUpdatedAt.toISOString(), revision)
  assert.throws(() => parseVariant({ isActive: false }, true))
  assert.throws(() => parseVariant({ stock: 1 }, true))
  assert.deepEqual(parseVariant({ colorName: ' Black ', size: ' M ', sku: ' PADDED ' }, true), { sku: ' PADDED ', size: ' M ', colorName: ' Black ' })
  assert.throws(() => parseVariant({ colorName: 42 }, true))
  assert.throws(() => parseVariant({ colorName: 'x'.repeat(81) }, true))
  assert.deepEqual(parseVariant({ colorHex: ' #FFFFFF ' }, true), { colorHex: ' #FFFFFF ' })
  assert.deepEqual(parseVariant({ colorHex: 'not-a-hex' }, true), { colorHex: 'not-a-hex' })
  assert.throws(() => parseVariant({ colorHex: 42 }, true))
  assert.throws(() => parseVariant({ sku: 'NEW-INVALID', colorHex: 'not-a-hex' }))
  assert.throws(() => parseUpdateProduct({ variants: [] }))
  assert.throws(() => parseUpdateProduct({ stock: 1 }))
  assert.throws(() => parseImage({ url: 'https://example.invalid/image.jpg', publicId: 'untrusted' }))
  assert.throws(() => parseImageOrder({ imageIds: ['one', 'one'], colorId: 'colour' }))
  assert.deepEqual(parseImageUpload(Buffer.from([1]), { colorId: '', isPrimary: 'true' }), { buffer: Buffer.from([1]), colorId: null, isPrimary: true })
  assert.throws(() => parseImageUpload(Buffer.from([1]), { publicId: 'untrusted' }))
  assert.throws(() => parseCreateProduct({ ...base, images: [{ url: 'https://example.invalid/image.jpg', colorId: 'foreign' }] }))
  assert.throws(() => parseCreateProduct({ ...base, variants: [{ sku: 'V-1', colorId: 'foreign' }] }))
  assert.throws(() => parseCreateProduct({ ...base, colors: [{ name: 'White' }, { name: 'White' }] }))
  assert.throws(() => parseCreateProduct({ ...base, colors: [{ name: 'White', variants: [{ sku: 'ONE', size: 'S' }, { sku: 'TWO', size: 'S' }] }] }))
  assert.throws(() => parseCreateProduct({ ...base, colors: [{ name: 'White', variants: [{ sku: 'ONE', size: 'S', colorName: 'Black' }] }] }))
  assert.throws(() => parseCreateProduct({ ...base, colors: [{ name: 'White', images: [{ url: 'https://example.invalid/one.jpg', isPrimary: true }, { url: 'https://example.invalid/two.jpg', isPrimary: true }] }] }))
  const parsed = parseCreateProduct({ ...base, colors: [{ name: 'White', hex: '#FFFFFF', variants: [{ sku: 'ONE', size: 'S' }] }, { name: 'Black', hex: '#FFFFFF', variants: [{ sku: 'TWO', size: 'XL' }] }] })
  assert.equal(parsed.colors?.length, 2)
  assert.equal(parsed.colors?.[0].variants?.length, 1)
  assert.equal(parsed.colors?.[1].variants?.[0].size, 'XL')
  assert.throws(() => parseAdjustment({ delta: -1, expectedStock: 10, reason: 'Stock edited from the admin product form' }))
  assert.deepEqual(parseAdjustment({ delta: 2, reason: 'Explicit receipt', type: 'RECEIPT' }), { delta: 2, reason: 'Explicit receipt', type: 'RECEIPT' })
})
