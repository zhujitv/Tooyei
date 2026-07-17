-- Add category publishing and presentation fields without removing the legacy
-- Product.categoryId primary relation. This keeps the migration compatible with
-- the currently deployed application during a rolling release.
ALTER TABLE "Category"
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "coverImage" TEXT;

UPDATE "Category"
SET "isActive" = CASE WHEN "status" = 'ARCHIVED' THEN false ELSE true END;

CREATE TABLE "ProductCategory" (
    "productId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("productId", "categoryId")
);

-- Every existing primary category becomes the first category assignment.
INSERT INTO "ProductCategory" ("productId", "categoryId", "sortOrder")
SELECT "id", "categoryId", 0
FROM "Product"
ON CONFLICT ("productId", "categoryId") DO NOTHING;

CREATE INDEX "Category_isActive_sortOrder_idx" ON "Category"("isActive", "sortOrder");
CREATE INDEX "ProductCategory_categoryId_sortOrder_idx" ON "ProductCategory"("categoryId", "sortOrder");
CREATE INDEX "ProductCategory_productId_sortOrder_idx" ON "ProductCategory"("productId", "sortOrder");

ALTER TABLE "ProductCategory"
ADD CONSTRAINT "ProductCategory_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductCategory"
ADD CONSTRAINT "ProductCategory_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
