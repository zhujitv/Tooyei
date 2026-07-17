-- Preserve language-neutral structure while localizing all visitor-facing fields.
ALTER TABLE "ProductSpecificationTranslation"
  ADD COLUMN "group" TEXT,
  ADD COLUMN "displayValue" TEXT;

ALTER TABLE "ProductApplicationTranslation"
  ADD COLUMN "imageAlt" TEXT;

CREATE TABLE "ProductMediaTranslation" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "locale" "Locale" NOT NULL,
  "alt" TEXT NOT NULL,
  "caption" TEXT,
  CONSTRAINT "ProductMediaTranslation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductMediaTranslation_productId_assetId_locale_key"
  ON "ProductMediaTranslation"("productId", "assetId", "locale");
CREATE INDEX "ProductMediaTranslation_locale_idx"
  ON "ProductMediaTranslation"("locale");

ALTER TABLE "ProductMediaTranslation"
  ADD CONSTRAINT "ProductMediaTranslation_productId_assetId_fkey"
  FOREIGN KEY ("productId", "assetId")
  REFERENCES "ProductMedia"("productId", "assetId")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Existing admin content was maintained in Chinese, so retain it as the ZH source.
INSERT INTO "ProductMediaTranslation" ("id", "productId", "assetId", "locale", "alt", "caption")
SELECT
  'pmt_' || md5(media."productId" || ':' || media."assetId" || ':ZH'),
  media."productId",
  media."assetId",
  'ZH'::"Locale",
  COALESCE(media."alt", asset."alt", ''),
  media."caption"
FROM "ProductMedia" media
JOIN "MediaAsset" asset ON asset."id" = media."assetId"
WHERE BTRIM(COALESCE(media."alt", asset."alt", media."caption", '')) <> ''
ON CONFLICT ("productId", "assetId", "locale") DO NOTHING;

UPDATE "ProductSpecificationTranslation" translation
SET
  "group" = specification."group",
  "displayValue" = specification."value"
FROM "ProductSpecification" specification
WHERE translation."specificationId" = specification."id"
  AND translation."locale" = 'ZH'::"Locale";

UPDATE "ProductApplicationTranslation" translation
SET "imageAlt" = asset."alt"
FROM "ProductApplication" application
JOIN "MediaAsset" asset ON asset."id" = application."imageAssetId"
WHERE translation."applicationId" = application."id"
  AND translation."locale" = 'ZH'::"Locale"
  AND asset."alt" IS NOT NULL;
