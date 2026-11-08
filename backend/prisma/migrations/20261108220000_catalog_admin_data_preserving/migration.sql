-- Additive, data-preserving migration. Legacy columns remain mapped in Prisma.
-- Apply atomically: any backfill or constraint failure rolls back all changes.
BEGIN;
SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '120s';

CREATE TYPE "Gender" AS ENUM ('MEN', 'WOMEN', 'UNISEX');
CREATE TYPE "ProductFit" AS ENUM ('SLIM', 'REGULAR', 'RELAXED', 'OVERSIZED', 'COMPRESSION');
CREATE TYPE "CategoryStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "InventoryMovementType" AS ENUM ('ADJUSTMENT', 'RECEIPT');

ALTER TABLE "Category"
  ADD COLUMN "bannerUrl" TEXT,
  ADD COLUMN "description" TEXT,
  ADD COLUMN "seoDescription" TEXT,
  ADD COLUMN "seoTitle" TEXT,
  ADD COLUMN "status" "CategoryStatus" NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE "Product"
  ADD COLUMN "careInstructions" TEXT,
  ADD COLUMN "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "fit" "ProductFit",
  ADD COLUMN "gender" "Gender" NOT NULL DEFAULT 'UNISEX',
  ADD COLUMN "material" TEXT,
  ADD COLUMN "seoDescription" TEXT,
  ADD COLUMN "seoTitle" TEXT,
  ADD COLUMN "tags" "ProductTag"[] DEFAULT ARRAY[]::"ProductTag"[];

-- Copy the original tag without changing/removing it or touching updatedAt.
UPDATE "Product" SET "tags" = ARRAY["tag"] WHERE "tag" IS NOT NULL;

ALTER TABLE "ProductVariant"
  ADD COLUMN "colorHex" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "colorName" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "priceCents" INTEGER;

-- Preserve option identity (including case/spacing), SKUs, stock and timestamps.
UPDATE "ProductVariant" SET "colorName" = "color";
CREATE UNIQUE INDEX "ProductVariant_productId_size_colorName_key"
  ON "ProductVariant"("productId", "size", "colorName");
DROP INDEX "ProductVariant_productId_size_color_key";

CREATE TABLE "ProductImage" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "altText" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- Keep original arrays intact; create a row for every non-null array entry.
-- Duplicate URLs and their order are preserved, not deduplicated.
INSERT INTO "ProductImage" ("id", "productId", "url", "sortOrder", "isPrimary", "createdAt")
SELECT 'legacy-image-' || md5(p."id" || ':' || image.ordinality::text),
       p."id", image.url, (image.ordinality - 1)::integer,
       image.ordinality = (
         SELECT min(first_image.ordinality)
         FROM unnest(p."images") WITH ORDINALITY AS first_image(url, ordinality)
         WHERE first_image.url IS NOT NULL
       ), p."createdAt"
FROM "Product" p
CROSS JOIN LATERAL unnest(p."images") WITH ORDINALITY AS image(url, ordinality)
WHERE image.url IS NOT NULL;

CREATE TABLE "InventoryMovement" (
  "id" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "type" "InventoryMovementType" NOT NULL,
  "quantityDelta" INTEGER NOT NULL,
  "stockBefore" INTEGER NOT NULL,
  "stockAfter" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderStatusHistory" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "fromStatus" "OrderStatus",
  "toStatus" "OrderStatus" NOT NULL,
  "actorId" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

-- This is an explicitly labelled snapshot, not fabricated historical transitions.
INSERT INTO "OrderStatusHistory" ("id", "orderId", "toStatus", "note", "createdAt")
SELECT 'legacy-status-' || md5("id"), "id", "status",
       'Migration baseline: earlier status transitions were not recorded.', "updatedAt"
FROM "Order";

CREATE INDEX "ProductImage_productId_sortOrder_idx" ON "ProductImage"("productId", "sortOrder");
CREATE INDEX "InventoryMovement_variantId_createdAt_idx" ON "InventoryMovement"("variantId", "createdAt");
CREATE INDEX "OrderStatusHistory_orderId_createdAt_idx" ON "OrderStatusHistory"("orderId", "createdAt");
CREATE INDEX "Category_status_sortOrder_idx" ON "Category"("status", "sortOrder");
CREATE INDEX "Product_gender_idx" ON "Product"("gender");
CREATE INDEX "Product_createdAt_idx" ON "Product"("createdAt");

ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
