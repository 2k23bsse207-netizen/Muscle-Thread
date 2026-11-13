-- Phase: additive promotion support for automatic product/variant discount offers.
-- Apply only after review. This migration never rewrites product/variant prices,
-- stock, inventory movements, orders or existing discount (coupon) data: it only
-- adds the Promotion table, its enum, and per-order-item promotion snapshot columns.
BEGIN;
SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '120s';

CREATE TYPE "PromotionType" AS ENUM ('PERCENTAGE', 'FIXED');

CREATE TABLE "Promotion" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "marquee" TEXT,
  "type" "PromotionType" NOT NULL,
  "value" INTEGER NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "productId" TEXT,
  "variantId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- Original unit price and line total remain the unmodified price snapshot.
-- discountCents is the per-unit promotional discount applied at checkout.
-- promotionId/promotionName are snapshots so order history survives promotion edits.
ALTER TABLE "OrderItem" ADD COLUMN "discountCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "OrderItem" ADD COLUMN "promotionId" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "promotionName" TEXT;

CREATE INDEX "Promotion_productId_active_idx" ON "Promotion"("productId", "active");
CREATE INDEX "Promotion_variantId_active_idx" ON "Promotion"("variantId", "active");
CREATE INDEX "Promotion_active_startsAt_endsAt_idx" ON "Promotion"("active", "startsAt", "endsAt");

ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
