-- Phase 1: additive, data-preserving product colours.
-- Apply only after review and backup. This migration does not assign ambiguous
-- images, mutate legacy option fields, recreate variants or touch inventory.
BEGIN;
SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '120s';

CREATE TABLE "ProductColor" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "hex" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductColor_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ProductVariant" ADD COLUMN "colorId" TEXT;
ALTER TABLE "ProductImage" ADD COLUMN "colorId" TEXT;

-- Group by the exact current colour NAME within each product, never by hex,
-- case folding, trimming or the stale legacy "color" column. Empty names are
-- preserved as explicit legacy groups; the new API requires names for new colours.
-- Conflicting/missing/invalid hex metadata becomes NULL rather than choosing a
-- size's swatch arbitrarily. All original variant hex values remain unchanged.
INSERT INTO "ProductColor" ("id", "productId", "name", "hex", "sortOrder", "isActive", "createdAt", "updatedAt")
SELECT 'legacy-color-' || md5(json_build_array(v."productId", v."colorName")::text),
       v."productId", v."colorName",
       CASE WHEN count(DISTINCT v."colorHex") = 1
                  AND min(v."colorHex") ~ '^#[0-9a-fA-F]{6}$'
            THEN min(v."colorHex") ELSE NULL END,
       (row_number() OVER (PARTITION BY v."productId" ORDER BY v."colorName" COLLATE "C") - 1)::integer,
       bool_or(v."isActive"), min(v."createdAt"), max(v."updatedAt")
FROM "ProductVariant" v
GROUP BY v."productId", v."colorName";

-- UPDATE only the new reference. SQL intentionally bypasses Prisma's updatedAt
-- behaviour: every original ID, SKU, option, stock, price, threshold and timestamp
-- remains byte-for-byte unchanged, as do carts, orders and inventory movements.
UPDATE "ProductVariant" v
SET "colorId" = c."id"
FROM "ProductColor" c
WHERE c."productId" = v."productId" AND c."name" = v."colorName";

-- Existing images stay colorId=NULL: no reliable colour assignment can be
-- inferred from a URL, public ID or variant order. URLs/assets are never touched.
CREATE UNIQUE INDEX "ProductColor_productId_name_key" ON "ProductColor"("productId", "name");
CREATE UNIQUE INDEX "ProductColor_id_productId_key" ON "ProductColor"("id", "productId");
CREATE INDEX "ProductColor_productId_isActive_sortOrder_idx" ON "ProductColor"("productId", "isActive", "sortOrder");
CREATE UNIQUE INDEX "ProductVariant_colorId_size_key" ON "ProductVariant"("colorId", "size");
CREATE INDEX "ProductImage_productId_colorId_sortOrder_idx" ON "ProductImage"("productId", "colorId", "sortOrder");

ALTER TABLE "ProductColor" ADD CONSTRAINT "ProductColor_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_colorId_productId_fkey"
  FOREIGN KEY ("colorId", "productId") REFERENCES "ProductColor"("id", "productId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_colorId_productId_fkey"
  FOREIGN KEY ("colorId", "productId") REFERENCES "ProductColor"("id", "productId") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
