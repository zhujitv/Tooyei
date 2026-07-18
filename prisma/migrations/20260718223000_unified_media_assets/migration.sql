-- Extend the existing media table without changing or removing historical URL fields.
CREATE TYPE "AssetType" AS ENUM (
  'IMAGE', 'VIDEO', 'DOCUMENT', 'CERTIFICATE', 'CATALOG',
  'SPEC_SHEET', 'INSTALLATION_GUIDE', 'WARRANTY', 'OTHER'
);

CREATE TYPE "StorageProvider" AS ENUM ('VERCEL_BLOB', 'EXTERNAL', 'LOCAL');

ALTER TABLE "MediaAsset"
  ADD COLUMN "assetType" "AssetType" NOT NULL DEFAULT 'OTHER',
  ADD COLUMN "originalFilename" TEXT,
  ADD COLUMN "storageProvider" "StorageProvider" NOT NULL DEFAULT 'EXTERNAL',
  ADD COLUMN "uploadedAt" TIMESTAMP(3),
  ADD COLUMN "orphanedAt" TIMESTAMP(3),
  ADD COLUMN "deletedAt" TIMESTAMP(3),
  ADD COLUMN "blobDeletedAt" TIMESTAMP(3),
  ADD COLUMN "uploadedById" TEXT;

UPDATE "MediaAsset"
SET
  "assetType" = CASE
    WHEN "kind" = 'IMAGE' THEN 'IMAGE'::"AssetType"
    WHEN "kind" = 'VIDEO' THEN 'VIDEO'::"AssetType"
    WHEN "kind" = 'DOCUMENT' THEN 'DOCUMENT'::"AssetType"
    ELSE 'OTHER'::"AssetType"
  END,
  "originalFilename" = regexp_replace(split_part("pathname", '?', 1), '^.*/', ''),
  "storageProvider" = CASE
    WHEN "url" LIKE 'https://%.public.blob.vercel-storage.com/%' THEN 'VERCEL_BLOB'::"StorageProvider"
    WHEN "url" LIKE '/%' THEN 'LOCAL'::"StorageProvider"
    ELSE 'EXTERNAL'::"StorageProvider"
  END;

-- Preserve the more specific business type already recorded on product downloads.
UPDATE "MediaAsset" AS asset
SET "assetType" = CASE download."kind"
  WHEN 'CATALOG' THEN 'CATALOG'::"AssetType"
  WHEN 'SPEC_SHEET' THEN 'SPEC_SHEET'::"AssetType"
  WHEN 'INSTALLATION_GUIDE' THEN 'INSTALLATION_GUIDE'::"AssetType"
  WHEN 'WARRANTY' THEN 'WARRANTY'::"AssetType"
  WHEN 'CERTIFICATE' THEN 'CERTIFICATE'::"AssetType"
  ELSE 'DOCUMENT'::"AssetType"
END
FROM "ProductDownload" AS download
WHERE download."assetId" = asset."id";

ALTER TABLE "Category" ADD COLUMN "coverAssetId" TEXT;

CREATE INDEX "MediaAsset_assetType_createdAt_idx" ON "MediaAsset"("assetType", "createdAt");
CREATE INDEX "MediaAsset_storageProvider_orphanedAt_deletedAt_idx" ON "MediaAsset"("storageProvider", "orphanedAt", "deletedAt");
CREATE INDEX "MediaAsset_uploadedById_createdAt_idx" ON "MediaAsset"("uploadedById", "createdAt");
CREATE INDEX "Category_coverAssetId_idx" ON "Category"("coverAssetId");

ALTER TABLE "MediaAsset"
  ADD CONSTRAINT "MediaAsset_uploadedById_fkey"
  FOREIGN KEY ("uploadedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Category"
  ADD CONSTRAINT "Category_coverAssetId_fkey"
  FOREIGN KEY ("coverAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
