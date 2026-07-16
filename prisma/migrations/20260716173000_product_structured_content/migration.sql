-- CreateEnum
CREATE TYPE "ProductMediaRole" AS ENUM ('PRIMARY', 'GALLERY', 'DETAIL', 'APPLICATION', 'PACKAGING', 'VIDEO');

-- CreateEnum
CREATE TYPE "ProductDownloadKind" AS ENUM ('CATALOG', 'SPEC_SHEET', 'INSTALLATION_GUIDE', 'WARRANTY', 'CERTIFICATE', 'OTHER');

-- AlterTable
ALTER TABLE "ProductFeature"
ADD COLUMN "icon" TEXT,
ADD COLUMN "visible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "ProductFeature" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ProductFeatureTranslation"
ADD COLUMN "description" TEXT;

-- AlterTable
ALTER TABLE "ProductSpecification"
ADD COLUMN "group" TEXT,
ADD COLUMN "unit" TEXT,
ADD COLUMN "visible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "ProductSpecification" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ProductMedia"
ADD COLUMN "role" "ProductMediaRole" NOT NULL DEFAULT 'GALLERY',
ADD COLUMN "alt" TEXT,
ADD COLUMN "caption" TEXT,
ADD COLUMN "visible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "ProductMedia" ALTER COLUMN "updatedAt" DROP DEFAULT;

UPDATE "ProductMedia" AS media
SET "role" = 'PRIMARY'
FROM "Product" AS product
WHERE product."id" = media."productId"
  AND product."primaryImageId" = media."assetId";

-- CreateTable
CREATE TABLE "ProductApplication" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "imageAssetId" TEXT,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductApplicationTranslation" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "ProductApplicationTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductDownload" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "kind" "ProductDownloadKind" NOT NULL DEFAULT 'OTHER',
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductDownload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductDownloadTranslation" (
    "id" TEXT NOT NULL,
    "downloadId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "ProductDownloadTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductFeature_productId_visible_sortOrder_idx" ON "ProductFeature"("productId", "visible", "sortOrder");

-- CreateIndex
CREATE INDEX "ProductSpecification_productId_visible_sortOrder_idx" ON "ProductSpecification"("productId", "visible", "sortOrder");

-- CreateIndex
CREATE INDEX "ProductMedia_productId_role_visible_sortOrder_idx" ON "ProductMedia"("productId", "role", "visible", "sortOrder");

-- CreateIndex
CREATE INDEX "ProductApplication_productId_visible_sortOrder_idx" ON "ProductApplication"("productId", "visible", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ProductApplicationTranslation_applicationId_locale_key" ON "ProductApplicationTranslation"("applicationId", "locale");

-- CreateIndex
CREATE INDEX "ProductDownload_productId_visible_sortOrder_idx" ON "ProductDownload"("productId", "visible", "sortOrder");

-- CreateIndex
CREATE INDEX "ProductDownload_assetId_idx" ON "ProductDownload"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductDownloadTranslation_downloadId_locale_key" ON "ProductDownloadTranslation"("downloadId", "locale");

-- AddForeignKey
ALTER TABLE "ProductApplication" ADD CONSTRAINT "ProductApplication_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductApplication" ADD CONSTRAINT "ProductApplication_imageAssetId_fkey" FOREIGN KEY ("imageAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductApplicationTranslation" ADD CONSTRAINT "ProductApplicationTranslation_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ProductApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductDownload" ADD CONSTRAINT "ProductDownload_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductDownload" ADD CONSTRAINT "ProductDownload_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductDownloadTranslation" ADD CONSTRAINT "ProductDownloadTranslation_downloadId_fkey" FOREIGN KEY ("downloadId") REFERENCES "ProductDownload"("id") ON DELETE CASCADE ON UPDATE CASCADE;
