INSERT INTO "ProductMedia" (
  "productId",
  "assetId",
  "role",
  "alt",
  "caption",
  "visible",
  "sortOrder",
  "createdAt",
  "updatedAt"
)
SELECT
  product."id",
  product."primaryImageId",
  'PRIMARY',
  COALESCE(asset."alt", product."sku"),
  NULL,
  true,
  0,
  now(),
  now()
FROM "Product" AS product
JOIN "MediaAsset" AS asset ON asset."id" = product."primaryImageId"
WHERE product."primaryImageId" IS NOT NULL
ON CONFLICT ("productId", "assetId") DO UPDATE SET
  "role" = 'PRIMARY',
  "visible" = true,
  "updatedAt" = now();
