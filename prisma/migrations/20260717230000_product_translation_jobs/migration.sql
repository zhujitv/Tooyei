-- Persist every product translation run so large multilingual batches can be
-- resumed safely and reviewed after generation.
CREATE TYPE "TranslationJobStatus" AS ENUM (
  'QUEUED', 'RUNNING', 'COMPLETED', 'PARTIAL', 'FAILED', 'CANCELLED'
);

CREATE TYPE "TranslationJobItemStatus" AS ENUM (
  'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED'
);

CREATE TABLE "ProductTranslationJob" (
  "id" TEXT NOT NULL,
  "status" "TranslationJobStatus" NOT NULL DEFAULT 'QUEUED',
  "sourceLocale" "Locale" NOT NULL,
  "targetLocales" "Locale"[] NOT NULL,
  "model" TEXT NOT NULL,
  "totalItems" INTEGER NOT NULL DEFAULT 0,
  "completedItems" INTEGER NOT NULL DEFAULT 0,
  "failedItems" INTEGER NOT NULL DEFAULT 0,
  "skippedItems" INTEGER NOT NULL DEFAULT 0,
  "inputTokens" INTEGER NOT NULL DEFAULT 0,
  "outputTokens" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "requestedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductTranslationJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductTranslationJobItem" (
  "id" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "productSlug" TEXT NOT NULL,
  "productSku" TEXT NOT NULL,
  "targetLocale" "Locale" NOT NULL,
  "status" "TranslationJobItemStatus" NOT NULL DEFAULT 'QUEUED',
  "inputHash" TEXT,
  "responseId" TEXT,
  "output" JSONB,
  "warnings" JSONB,
  "error" TEXT,
  "inputTokens" INTEGER NOT NULL DEFAULT 0,
  "outputTokens" INTEGER NOT NULL DEFAULT 0,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductTranslationJobItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProductTranslationJob_status_createdAt_idx"
  ON "ProductTranslationJob"("status", "createdAt");
CREATE INDEX "ProductTranslationJob_requestedById_createdAt_idx"
  ON "ProductTranslationJob"("requestedById", "createdAt");
CREATE UNIQUE INDEX "ProductTranslationJobItem_jobId_productId_targetLocale_key"
  ON "ProductTranslationJobItem"("jobId", "productId", "targetLocale");
CREATE INDEX "ProductTranslationJobItem_jobId_status_createdAt_idx"
  ON "ProductTranslationJobItem"("jobId", "status", "createdAt");
CREATE INDEX "ProductTranslationJobItem_productId_targetLocale_createdAt_idx"
  ON "ProductTranslationJobItem"("productId", "targetLocale", "createdAt");

ALTER TABLE "ProductTranslationJob"
  ADD CONSTRAINT "ProductTranslationJob_requestedById_fkey"
  FOREIGN KEY ("requestedById") REFERENCES "AdminUser"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProductTranslationJobItem"
  ADD CONSTRAINT "ProductTranslationJobItem_jobId_fkey"
  FOREIGN KEY ("jobId") REFERENCES "ProductTranslationJob"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductTranslationJobItem"
  ADD CONSTRAINT "ProductTranslationJobItem_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
