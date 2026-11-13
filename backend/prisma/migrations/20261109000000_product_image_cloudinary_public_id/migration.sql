-- Additive only: preserve every existing image, URL, flag, order and timestamp.
-- Legacy/external URLs intentionally have no Cloudinary ownership/public ID.
BEGIN;
SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '120s';

ALTER TABLE "ProductImage" ADD COLUMN "publicId" TEXT;
CREATE INDEX "ProductImage_publicId_idx" ON "ProductImage"("publicId");

COMMIT;
