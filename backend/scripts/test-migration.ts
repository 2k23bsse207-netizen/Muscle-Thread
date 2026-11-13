import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { Client } from 'pg'

const url = process.env.TEST_DATABASE_URL
if (!url || !['127.0.0.1', 'localhost'].includes(new URL(url).hostname)) {
  throw new Error('Migration regression requires an isolated local TEST_DATABASE_URL')
}
const client = new Client({ connectionString: url })
const schema = `migration_regression_${Date.now()}`
await client.connect()
try {
  await client.query(`CREATE SCHEMA "${schema}"`)
  await client.query(`SET search_path TO "${schema}"`)
  await client.query(await readFile(new URL('../prisma/migrations/20261107100458_init/migration.sql', import.meta.url), 'utf8'))
  await client.query(`
    INSERT INTO "User" (id, email, "passwordHash", name, "updatedAt") VALUES ('migration-user', 'migration-test@example.invalid', 'unchanged-test-hash', 'Migration test', now());
    INSERT INTO "Category" (id, name, slug, "updatedAt") VALUES ('migration-category', 'Test category', 'migration-category', now());
    INSERT INTO "Product" (id, sku, name, slug, "categoryId", "priceCents", images, tag, warehouse, "updatedAt") VALUES
      ('migration-product', 'MIGRATION-TEST', 'Test product', 'migration-product', 'migration-category', 2900, ARRAY['https://example.invalid/one.jpg','https://example.invalid/one.jpg','https://example.invalid/two.jpg'], 'FEATURED', 'Original warehouse', now()),
      ('migration-empty', 'MIGRATION-EMPTY', 'Empty images', 'migration-empty', 'migration-category', 1200, ARRAY[]::text[], NULL, NULL, now());
    INSERT INTO "ProductVariant" (id, "productId", sku, size, color, stock, "updatedAt") VALUES
      ('migration-red', 'migration-product', 'MIGRATION-RED', 'M', 'Red', 17, now()),
      ('migration-blue', 'migration-product', 'MIGRATION-BLUE', 'M', 'Blue', 8, now());
    INSERT INTO "Cart" (id, "userId", "updatedAt") VALUES ('migration-cart', 'migration-user', now());
    INSERT INTO "CartItem" (id, "cartId", "variantId", quantity) VALUES ('migration-line', 'migration-cart', 'migration-red', 2);
    INSERT INTO "WishlistItem" ("userId", "productId") VALUES ('migration-user', 'migration-product');
    INSERT INTO "Session" (id, "userId", "refreshTokenHash", "expiresAt") VALUES ('migration-session', 'migration-user', 'unchanged-session-hash', now() + interval '1 day');
    INSERT INTO "EmailVerificationToken" (id, "userId", "tokenHash", "expiresAt") VALUES ('migration-email', 'migration-user', 'unchanged-verification-hash', now() + interval '1 day');
    INSERT INTO "Order" (id, "orderNumber", "userId", status, "subtotalCents", "totalCents", "shippingName", "shippingLine1", "shippingCity", "shippingPostal", "shippingCountry", "updatedAt") VALUES
      ('migration-order', 'MIGRATION-ORDER', 'migration-user', 'SHIPPED', 5800, 5800, 'Test', 'Test street', 'Test city', '00000', 'US', now());
    INSERT INTO "OrderItem" (id, "orderId", "productId", "variantId", name, sku, size, color, image, "unitPriceCents", quantity, "lineTotalCents") VALUES
      ('migration-order-line', 'migration-order', 'migration-product', 'migration-red', 'Original snapshot', 'ORIGINAL-SKU', 'M', 'Red', 'https://example.invalid/snapshot.jpg', 2900, 2, 5800);
    INSERT INTO "Payment" (id, "orderId", provider, status, "amountCents", "updatedAt") VALUES ('migration-payment', 'migration-order', 'STRIPE', 'PAID', 5800, now());
    INSERT INTO "Discount" (id, code, type, value, "usedCount", "usageLimit") VALUES ('migration-discount', 'MIGRATION10', 'PERCENTAGE', 10, 3, 20);
  `)
  const columns = await client.query<{ table_name: string; columns: string[] }>(`
    SELECT table_name, array_agg(column_name::text ORDER BY ordinal_position) AS columns
    FROM information_schema.columns WHERE table_schema = $1
    GROUP BY table_name ORDER BY table_name
  `, [schema])
  const snapshots: Record<string, unknown[]> = {}
  for (const row of columns.rows) {
    const names = row.columns.map(column => '"' + column + '"').join(', ')
    snapshots[row.table_name] = (await client.query(`SELECT ${names} FROM "${row.table_name}" ORDER BY ${names}`)).rows
  }
  await client.query(await readFile(new URL('../prisma/migrations/20261108220000_catalog_admin_data_preserving/migration.sql', import.meta.url), 'utf8'))
  for (const row of columns.rows) {
    const names = row.columns.map(column => '"' + column + '"').join(', ')
    const current = (await client.query(`SELECT ${names} FROM "${row.table_name}" ORDER BY ${names}`)).rows
    assert.deepEqual(current, snapshots[row.table_name], `Original values changed in ${row.table_name}`)
  }
  const images = (await client.query('SELECT url, "sortOrder", "isPrimary" FROM "ProductImage" ORDER BY "sortOrder"')).rows
  assert.deepEqual(images.map(image => image.url), ['https://example.invalid/one.jpg', 'https://example.invalid/one.jpg', 'https://example.invalid/two.jpg'])
  assert.deepEqual(images.map(image => image.sortOrder), [0, 1, 2])
  assert.deepEqual(images.map(image => image.isPrimary), [true, false, false])
  assert.deepEqual((await client.query('SELECT tags::text[] AS tags FROM "Product" WHERE id = $1', ['migration-product'])).rows[0].tags, ['FEATURED'])
  assert.equal((await client.query('SELECT count(*)::int AS n FROM "ProductVariant" WHERE "colorName" = color')).rows[0].n, 2)
  const history = (await client.query('SELECT "fromStatus", "toStatus", "actorId", note FROM "OrderStatusHistory"')).rows
  assert.equal(history.length, 1)
  assert.equal(history[0].fromStatus, null)
  assert.equal(history[0].toStatus, 'SHIPPED')
  assert.equal(history[0].actorId, null)
  assert.match(history[0].note, /baseline/)
  console.log(`Migration regression passed: all original columns/rows in ${columns.rows.length} tables unchanged; images, tags, colors and order baseline copied correctly.`)
} finally {
  await client.end()
}
