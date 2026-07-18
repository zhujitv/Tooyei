ALTER TYPE "TranslationJobItemStatus" ADD VALUE IF NOT EXISTS 'TRANSLATED';
ALTER TYPE "TranslationJobItemStatus" ADD VALUE IF NOT EXISTS 'QA_PASSED';
ALTER TYPE "TranslationJobItemStatus" ADD VALUE IF NOT EXISTS 'QA_WARNING';
ALTER TYPE "TranslationJobItemStatus" ADD VALUE IF NOT EXISTS 'QA_FAILED';
ALTER TYPE "TranslationJobItemStatus" ADD VALUE IF NOT EXISTS 'NEEDS_REVIEW';

ALTER TABLE "ProductTranslationJob"
  ADD COLUMN "qaPassedItems" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "qaWarningItems" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "qaFailedItems" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "needsReviewItems" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "ProductTranslationJobItem"
  ADD COLUMN "sourceLocale" "Locale",
  ADD COLUMN "qaStatus" TEXT,
  ADD COLUMN "qaIssues" JSONB,
  ADD COLUMN "qaErrorCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "qaWarningCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "qaAttemptCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "qaVersion" TEXT,
  ADD COLUMN "lastQaAt" TIMESTAMP(3),
  ADD COLUMN "savedAt" TIMESTAMP(3);

UPDATE "ProductTranslationJobItem" AS item
SET "sourceLocale" = job."sourceLocale"
FROM "ProductTranslationJob" AS job
WHERE item."jobId" = job."id" AND item."sourceLocale" IS NULL;

ALTER TABLE "ProductTranslationJobItem"
  ALTER COLUMN "sourceLocale" SET NOT NULL;

ALTER TABLE "ProductTranslationLog"
  ADD COLUMN "qaCodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "qaStatus" TEXT;
