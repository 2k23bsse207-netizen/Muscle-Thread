-- Phase: multi-target promotions. One promotion now applies to any number of
-- products and variants through PromotionTarget, and each target may override
-- the campaign-wide discount value (NULL = inherit). Every existing
-- single-scope promotion is copied into PromotionTarget rows BEFORE the old
-- scope columns are dropped, so no promotion data is lost. Product/variant
-- prices, stock, inventory movements, orders and coupon (Discount) data are
-- untouched.
BEGIN;
SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '120s';

CREATE TABLE "PromotionTarget" (
  "id" TEXT NOT NULL,
  "promotionId" TEXT NOT NULL,
  "productId" TEXT,
  "variantId" TEXT,
  "value" INTEGER,

  CONSTRAINT "PromotionTarget_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PromotionTarget_promotionId_idx" ON "PromotionTarget"("promotionId");
CREATE INDEX "PromotionTarget_productId_idx" ON "PromotionTarget"("productId");
CREATE INDEX "PromotionTarget_variantId_idx" ON "PromotionTarget"("variantId");

ALTER TABLE "PromotionTarget" ADD CONSTRAINT "PromotionTarget_promotionId_fkey"
  FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromotionTarget" ADD CONSTRAINT "PromotionTarget_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromotionTarget" ADD CONSTRAINT "PromotionTarget_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Copy existing scopes: one target row per legacy productId / variantId.
-- value stays NULL, so migrated promotions keep their campaign-wide discount.
INSERT INTO "PromotionTarget" ("id", "promotionId", "productId", "variantId", "value")
SELECT 'promotion-target-' || md5(p."id" || ':product:' || p."productId"), p."id", p."productId", NULL, NULL
FROM "Promotion" p WHERE p."productId" IS NOT NULL;
INSERT INTO "PromotionTarget" ("id", "promotionId", "productId", "variantId", "value")
SELECT 'promotion-target-' || md5(p."id" || ':variant:' || p."variantId"), p."id", NULL, p."variantId", NULL
FROM "Promotion" p WHERE p."variantId" IS NOT NULL;

ALTER TABLE "Promotion" DROP CONSTRAINT "Promotion_productId_fkey";
ALTER TABLE "Promotion" DROP CONSTRAINT "Promotion_variantId_fkey";
DROP INDEX "Promotion_productId_active_idx";
DROP INDEX "Promotion_variantId_active_idx";
ALTER TABLE "Promotion" DROP COLUMN "productId";
ALTER TABLE "Promotion" DROP COLUMN "variantId";

COMMIT;
