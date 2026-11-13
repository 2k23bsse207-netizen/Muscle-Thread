import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { Client } from 'pg'

const rawUrl = process.env.TEST_DATABASE_URL
if (!rawUrl || process.env.NODE_ENV !== 'test') throw new Error('Colour migration tests require NODE_ENV=test and an isolated local TEST_DATABASE_URL')
const url = new URL(rawUrl)
if (!['postgres:', 'postgresql:'].includes(url.protocol) || !['127.0.0.1', 'localhost'].includes(url.hostname)) {
  throw new Error('Colour migration tests refuse non-loopback database URLs')
}

// Use explicit connection fields, not connectionString: URL query parameters must
// never override the already-checked loopback host or turn on remote connections.
const client = new Client({
  host: '127.0.0.1', port: Number(url.port || 5432),
  user: decodeURIComponent(url.username), password: decodeURIComponent(url.password),
  database: decodeURIComponent(url.pathname.slice(1)), ssl: false,
  connectionTimeoutMillis: 5000, query_timeout: 120_000,
})
const quote = (identifier: string) => '"' + identifier.replaceAll('"', '""') + '"'
const schema = `product_colours_${Date.now()}_${randomUUID().replaceAll('-', '')}`
const migration = (name: string) => readFile(new URL(`../prisma/migrations/${name}/migration.sql`, import.meta.url), 'utf8')

type OriginalVariant = {
  id: string; productId: string; sku: string; size: string; colorName: string; colorHex: string;
  createdAt: string; updatedAt: string; isActive: boolean;
}
type Colour = {
  id: string; productId: string; name: string; hex: string | null; sortOrder: number;
  isActive: boolean; createdAt: string; updatedAt: string;
}

test('ProductColor migration preserves every original value and exact option identity on populated data', { timeout: 120_000 }, async () => {
  await client.connect()
  try {
    await client.query(`CREATE SCHEMA ${quote(schema)}`)
    await client.query(`SET search_path TO ${quote(schema)}`)
    for (const name of ['20261107100458_init', '20261108220000_catalog_admin_data_preserving', '20261109000000_product_image_cloudinary_public_id']) {
      await client.query(await migration(name))
    }
    // Seed the fully populated PRE-colour schema, including fields absent from
    // init. These are synthetic records; no application database is accessed.
    await client.query(`
      INSERT INTO "User" (id, email, "passwordHash", name, role, "emailVerified", "createdAt", "updatedAt") VALUES
        ('colour-owner', 'colour-owner@example.invalid', 'synthetic-owner-hash', 'Test customer', 'USER', true, '2021-01-01 01:02:03.123', '2023-02-01 04:05:06.456'),
        ('colour-actor', 'colour-actor@example.invalid', 'synthetic-admin-hash', 'Test administrator', 'ADMIN', true, '2021-01-02 01:02:03.123', '2023-02-02 04:05:06.456');
      INSERT INTO "Category" (id, name, slug, "imageUrl", "bannerUrl", description, "sortOrder", "createdAt", "updatedAt") VALUES
        ('colour-category', 'Original category', 'colour-category', 'https://example.invalid/category.jpg', 'https://example.invalid/banner.jpg', 'Original description', 7, '2021-04-01 01:02:03.123', '2023-04-01 04:05:06.456');
      INSERT INTO "Product" (id, sku, name, slug, "categoryId", "priceCents", "mrpCents", images, tag, tags, warehouse, collections, status, gender, fit, features, "createdAt", "updatedAt") VALUES
        ('colour-product', 'ORIGINAL-PRODUCT', 'Original shirt', 'colour-product', 'colour-category', 3000, 4500, ARRAY['https://example.invalid/shared.jpg', 'https://example.invalid/shared.jpg'], 'FEATURED', ARRAY['FEATURED','NEW_ARRIVAL']::"ProductTag"[], 'Original warehouse', ARRAY['Training'], 'ACTIVE', 'UNISEX', 'OVERSIZED', ARRAY['Original feature'], '2021-05-01 01:02:03.123', '2023-05-01 04:05:06.456'),
        ('other-product', 'OTHER-PRODUCT', 'Other shirt', 'other-product', 'colour-category', 2000, NULL, ARRAY['https://example.invalid/other.jpg'], NULL, ARRAY[]::"ProductTag"[], NULL, ARRAY[]::text[], 'DRAFT', 'MEN', NULL, ARRAY[]::text[], '2021-06-01 01:02:03.123', '2023-06-01 04:05:06.456'),
        ('empty-product', 'EMPTY-PRODUCT', 'No options yet', 'empty-product', 'colour-category', 1000, NULL, ARRAY[]::text[], NULL, ARRAY[]::"ProductTag"[], NULL, ARRAY[]::text[], 'DRAFT', 'WOMEN', NULL, ARRAY[]::text[], '2021-07-01 01:02:03.123', '2023-07-01 04:05:06.456');
    `)
    const options = [
      { id: 'white-s', name: 'White', size: 'S', hex: '#181B15', stock: 10, active: true },
      { id: 'white-m', name: 'White', size: 'M', hex: '#181B15', stock: 15, active: false },
      { id: 'black-m', name: 'Black', size: 'M', hex: '#181B15', stock: 20, active: true },
      { id: 'grey-s', name: 'Grey', size: 'S', hex: '#888888', stock: 5, active: true },
      { id: 'grey-l', name: 'Grey', size: 'L', hex: '#999999', stock: 12, active: false },
      { id: 'padded', name: ' Black ', size: ' M ', hex: '#000000', stock: 8, active: true },
      { id: 'lowercase', name: 'black', size: 'L', hex: '#000000', stock: 7, active: true },
      { id: 'empty', name: '', size: '', hex: '', stock: 0, active: false },
      { id: 'space', name: ' ', size: 'XL', hex: '', stock: 4, active: true },
      { id: 'invalid', name: 'Invalid', size: 'XS', hex: 'not-a-hex', stock: 3, active: true },
      { id: 'padded-hex', name: 'Spaced hex', size: 'S', hex: ' #FFFFFF ', stock: 4, active: true },
      { id: 'retired-s', name: 'Retired', size: 'S', hex: '#AAAAAA', stock: 6, active: false },
      { id: 'retired-l', name: 'Retired', size: 'L', hex: '#AAAAAA', stock: 2, active: false },
      { id: 'missing-xs', name: 'Missing hex', size: 'XS', hex: '', stock: 1, active: true },
      { id: 'missing-l', name: 'Missing hex', size: 'L', hex: '#123456', stock: 8, active: true },
      { id: 'other-white', name: 'White', size: 'S', hex: '#181B15', stock: 7, active: true, productId: 'other-product' },
    ]
    for (const [index, option] of options.entries()) {
      const day = String(index + 1).padStart(2, '0')
      await client.query(`INSERT INTO "ProductVariant" (id, "productId", sku, size, color, "colorName", "colorHex", stock, "priceCents", "lowStockThreshold", "isActive", "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`, [
        option.id, option.productId ?? 'colour-product', `ORIGINAL-${option.id}`, option.size,
        `Different legacy colour ${index}`, option.name, option.hex, option.stock,
        index % 3 === 0 ? 0 : index % 3 === 1 ? null : 3100 + index,
        index + 2, option.active, `2022-03-${day} 08:11:12.123`, `2024-08-${day} 19:20:21.456`,
      ])
      await client.query(`INSERT INTO "InventoryMovement" (id,"variantId","actorId",type,"quantityDelta","stockBefore","stockAfter",reason,"createdAt") VALUES ($1,$2,'colour-actor','RECEIPT',$3,0,$3,'Original synthetic receipt','2022-04-01 01:02:03.123')`, [`receipt-${option.id}`, option.id, option.stock])
    }
    await client.query(`
      INSERT INTO "InventoryMovement" (id,"variantId","actorId",type,"quantityDelta","stockBefore","stockAfter",reason,"createdAt") VALUES
        ('original-adjustment','white-s','colour-actor','ADJUSTMENT',-2,12,10,'Original synthetic adjustment','2022-04-02 01:02:03.123');
      INSERT INTO "ProductImage" (id,"productId",url,"publicId","altText","sortOrder","isPrimary","isActive","createdAt") VALUES
        ('managed-image','colour-product','https://res.cloudinary.com/test/image/upload/move/products/original.jpg','move/products/original','Original front',23,true,true,'2022-06-01 01:02:03.123'),
        ('inactive-image','colour-product','https://res.cloudinary.com/test/image/upload/v1/move/products/original.jpg','move/products/original',NULL,42,true,false,'2022-06-02 01:02:03.123'),
        ('external-image','colour-product','https://example.invalid/shared.jpg',NULL,'External image',-3,false,true,'2022-06-03 01:02:03.123'),
        ('duplicate-url','colour-product','https://example.invalid/shared.jpg',NULL,NULL,7,false,true,'2022-06-04 01:02:03.123'),
        ('other-image','other-product','https://example.invalid/other.jpg',NULL,'Other cover',0,true,true,'2022-06-05 01:02:03.123');
      INSERT INTO "Cart" (id,"userId","createdAt","updatedAt") VALUES ('original-cart','colour-owner','2022-07-01 01:02:03.123','2023-07-01 04:05:06.456');
      INSERT INTO "CartItem" (id,"cartId","variantId",quantity,"addedAt") VALUES ('original-cart-line','original-cart','white-s',3,'2022-07-02 01:02:03.123');
      INSERT INTO "WishlistItem" ("userId","productId","addedAt") VALUES ('colour-owner','colour-product','2022-07-03 01:02:03.123');
      INSERT INTO "Session" (id,"userId","refreshTokenHash","userAgent",ip,"expiresAt","createdAt") VALUES ('original-session','colour-owner','synthetic-session-hash','Test agent','127.0.0.1','2027-01-01 00:00:00','2022-07-04 01:02:03.123');
      INSERT INTO "EmailVerificationToken" (id,"userId","tokenHash","expiresAt","usedAt","createdAt") VALUES ('original-token','colour-owner','synthetic-verification-hash','2027-01-01 00:00:00','2022-07-05 01:02:03.123','2022-07-04 01:02:03.123');
      INSERT INTO "Order" (id,"orderNumber","userId",status,"subtotalCents","discountCents","shippingCents","taxCents","totalCents",currency,"promoCode","shippingName","shippingLine1","shippingCity","shippingPostal","shippingCountry","createdAt","updatedAt") VALUES ('original-order','ORIGINAL-ORDER','colour-owner','SHIPPED',6000,500,200,100,5800,'USD','ORIGINAL10','Test recipient','Test street','Test city','00000','US','2022-08-01 01:02:03.123','2023-08-01 04:05:06.456');
      INSERT INTO "OrderItem" (id,"orderId","productId","variantId",name,sku,size,color,image,"unitPriceCents",quantity,"lineTotalCents") VALUES
        ('original-order-line','original-order','colour-product','white-s','Immutable historical name','IMMUTABLE-SKU','Original M','Historical red','https://res.cloudinary.com/test/image/upload/move/products/original.jpg',3000,2,6000),
        ('detached-order-line','original-order',NULL,NULL,'Detached historical snapshot',NULL,NULL,NULL,'https://example.invalid/historical.jpg',0,1,0);
      INSERT INTO "Payment" (id,"orderId",provider,status,"amountCents",currency,"externalId","createdAt","updatedAt") VALUES ('original-payment','original-order','STRIPE','PAID',5800,'USD','synthetic-payment-reference','2022-08-02 01:02:03.123','2023-08-02 04:05:06.456');
      INSERT INTO "OrderStatusHistory" (id,"orderId","fromStatus","toStatus","actorId",note,"createdAt") VALUES ('original-history','original-order','PAID','SHIPPED','colour-actor','Original stored transition','2022-08-03 01:02:03.123');
      INSERT INTO "Discount" (id,code,type,value,active,"startsAt","endsAt","usageLimit","usedCount","createdAt") VALUES ('original-discount','ORIGINAL10','PERCENTAGE',10,true,'2021-01-01 00:00:00','2027-01-01 00:00:00',20,3,'2022-08-04 01:02:03.123');
    `)

    const columns = (await client.query<{ table_name: string; columns: string[] }>(`
      SELECT c.table_name, array_agg(c.column_name::text ORDER BY c.ordinal_position) AS columns
      FROM information_schema.columns c JOIN information_schema.tables t
        ON t.table_schema=c.table_schema AND t.table_name=c.table_name AND t.table_type='BASE TABLE'
      WHERE c.table_schema=$1 GROUP BY c.table_name ORDER BY c.table_name
    `, [schema])).rows
    assert.equal(columns.length, 16)
    const snapshot = async (table: typeof columns[number]) => (await client.query(`SELECT to_jsonb(original) AS value FROM (SELECT ${table.columns.map(quote).join(',')} FROM ${quote(table.table_name)}) original ORDER BY to_jsonb(original)::text`)).rows
    const before = new Map<string, unknown>()
    for (const table of columns) {
      const rows = await snapshot(table)
      assert.ok(rows.length > 0, `Fixture missing for ${table.table_name}`)
      before.set(table.table_name, rows)
    }
    const originalVariants = (await client.query<{ value: OriginalVariant }>('SELECT to_jsonb(v) AS value FROM "ProductVariant" v ORDER BY id')).rows.map(row => row.value)
    await client.query(await migration('20261109180000_product_colors'))
    for (const table of columns) assert.deepEqual(await snapshot(table), before.get(table.table_name), `Original columns/rows changed in ${table.table_name}`)

    const colours = (await client.query<{ value: Colour }>('SELECT to_jsonb(c) AS value FROM "ProductColor" c ORDER BY "productId","sortOrder"')).rows.map(row => row.value)
    const groups = new Map<string, OriginalVariant[]>()
    for (const variant of originalVariants) {
      const key = JSON.stringify([variant.productId, variant.colorName])
      groups.set(key, [...(groups.get(key) ?? []), variant])
    }
    assert.equal(colours.length, groups.size)
    for (const colour of colours) {
      const members = groups.get(JSON.stringify([colour.productId, colour.name]))
      assert.ok(members, 'Backfill used legacy colour or hex instead of the exact name')
      const hexes = new Set(members.map(variant => variant.colorHex))
      const hex = members[0].colorHex
      assert.equal(colour.hex, hexes.size === 1 && /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : null)
      assert.equal(colour.isActive, members.some(variant => variant.isActive))
      assert.equal(colour.createdAt, members.map(variant => variant.createdAt).sort()[0])
      assert.equal(colour.updatedAt, members.map(variant => variant.updatedAt).sort().at(-1))
      const names = [...groups.values()].filter(group => group[0].productId === colour.productId).map(group => group[0].colorName).sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)))
      assert.equal(colour.sortOrder, names.indexOf(colour.name))
    }
    const links = (await client.query<{ id: string; colorId: string; productId: string; colorName: string }>('SELECT id,"colorId","productId","colorName" FROM "ProductVariant"')).rows
    assert.equal(links.length, originalVariants.length)
    for (const variant of links) {
      const colour = colours.find(colour => colour.id === variant.colorId)
      assert.ok(colour)
      assert.equal(colour.productId, variant.productId)
      assert.equal(colour.name, variant.colorName)
    }
    assert.ok((await client.query<{ stable: boolean }>(`SELECT id = 'legacy-color-' || md5(json_build_array("productId",name)::text) AS stable FROM "ProductColor"`)).rows.every(row => row.stable))
    assert.equal((await client.query<{ n: number }>('SELECT count(*)::int AS n FROM "ProductImage" WHERE "colorId" IS NOT NULL')).rows[0].n, 0)
    assert.equal(colours.some(colour => colour.productId === 'empty-product'), false)
    const white = colours.find(colour => colour.productId === 'colour-product' && colour.name === 'White')!
    const black = colours.find(colour => colour.productId === 'colour-product' && colour.name === 'Black')!
    const otherWhite = colours.find(colour => colour.productId === 'other-product' && colour.name === 'White')!
    assert.notEqual(white.id, black.id, 'Equal hex values must not merge different names')
    assert.notEqual(white.id, otherWhite.id, 'Colours must remain product-scoped')
    assert.ok(colours.some(colour => colour.name === ' Black '))
    assert.ok(colours.some(colour => colour.name === 'black'))
    assert.ok(colours.some(colour => colour.name === ''))
    assert.ok(colours.some(colour => colour.name === ' '))
    assert.equal(colours.find(colour => colour.name === 'Grey')!.hex, null)
    assert.equal(colours.find(colour => colour.name === 'Retired')!.isActive, false)

    // Negative constraints and valid assignments are rolled back, preserving the
    // original fixture even in the retained test cluster. Never drop its schema.
    await client.query('BEGIN')
    try {
      const rejects = async (sql: string, values: unknown[], code: string, constraint: string) => {
        await client.query('SAVEPOINT constraint_probe')
        try {
          await assert.rejects(client.query(sql, values), (error: unknown) => {
            assert.ok(error && typeof error === 'object' && 'code' in error && 'constraint' in error)
            assert.equal(error.code, code)
            assert.equal(error.constraint, constraint)
            return true
          })
        } finally {
          await client.query('ROLLBACK TO SAVEPOINT constraint_probe')
          await client.query('RELEASE SAVEPOINT constraint_probe')
        }
      }
      await rejects('UPDATE "ProductVariant" SET "colorId"=$1 WHERE id=$2', [otherWhite.id, 'grey-l'], '23503', 'ProductVariant_colorId_productId_fkey')
      await rejects('UPDATE "ProductImage" SET "colorId"=$1 WHERE id=$2', [otherWhite.id, 'managed-image'], '23503', 'ProductImage_colorId_productId_fkey')
      await rejects('UPDATE "ProductVariant" SET "colorId"=$1 WHERE id=$2', [white.id, 'black-m'], '23505', 'ProductVariant_colorId_size_key')
      await rejects('INSERT INTO "ProductColor" (id,"productId",name,"updatedAt") VALUES ($1,$2,$3,$4)', ['duplicate-white', white.productId, white.name, '2024-01-01'], '23505', 'ProductColor_productId_name_key')
      await client.query('UPDATE "ProductImage" SET "colorId"=$1 WHERE id=$2', [white.id, 'managed-image'])
      assert.equal((await client.query<{ colorId: string }>('SELECT "colorId" FROM "ProductImage" WHERE id=$1', ['managed-image'])).rows[0].colorId, white.id)
      await client.query('INSERT INTO "ProductVariant" (id,"productId","colorId",sku,size,"colorName","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7)', ['same-size-other-colour', black.productId, black.id, 'SYNTHETIC-BLACK-S', 'S', black.name, '2024-01-01'])
      assert.equal((await client.query<{ n: number }>('SELECT count(*)::int AS n FROM "ProductVariant" WHERE size=$1 AND "colorId" IN ($2,$3)', ['S', white.id, black.id])).rows[0].n, 2)
    } finally {
      await client.query('ROLLBACK')
    }
    for (const table of columns) assert.deepEqual(await snapshot(table), before.get(table.table_name), `Constraint checks changed ${table.table_name}`)
    console.log(`ProductColor preservation passed: ${columns.length} populated original tables, ${originalVariants.length} variants and exact-name/hex/ownership constraints verified.`)
  } finally {
    await client.end()
  }
})
