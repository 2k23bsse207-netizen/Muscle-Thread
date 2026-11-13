-- Storefront settings: a single row holding the admin-managed tax rate.
-- Tax stays in basis points (800 = 8.00%) so quotes and orders keep exact
-- integer math. No product, order or promotion data is touched.
BEGIN;
SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '120s';

CREATE TABLE "StoreSettings" (
  "id" INTEGER NOT NULL,
  "taxRateBps" INTEGER NOT NULL DEFAULT 800,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "StoreSettings_pkey" PRIMARY KEY ("id")
);

COMMIT;
