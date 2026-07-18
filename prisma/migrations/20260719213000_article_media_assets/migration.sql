-- AlterTable
ALTER TABLE "Article" ADD COLUMN "coverAssetId" TEXT;

-- Backfill managed cover images that already exist in the media library.
UPDATE "Article" AS article
SET "coverAssetId" = asset."id"
FROM "MediaAsset" AS asset
WHERE article."coverImage" = asset."url"
  AND asset."deletedAt" IS NULL;

UPDATE "MediaAsset"
SET "orphanedAt" = NULL
WHERE "id" IN (SELECT "coverAssetId" FROM "Article" WHERE "coverAssetId" IS NOT NULL);

-- CreateTable
CREATE TABLE "ArticleMedia" (
    "articleId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleMedia_pkey" PRIMARY KEY ("articleId","assetId")
);

-- CreateIndex
CREATE INDEX "Article_coverAssetId_idx" ON "Article"("coverAssetId");
CREATE INDEX "ArticleMedia_assetId_idx" ON "ArticleMedia"("assetId");

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_coverAssetId_fkey" FOREIGN KEY ("coverAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ArticleMedia" ADD CONSTRAINT "ArticleMedia_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArticleMedia" ADD CONSTRAINT "ArticleMedia_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
