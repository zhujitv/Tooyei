-- Make product translation batches observable, retryable, cancellable and
-- safe against duplicate workers without changing saved product translations.

ALTER TYPE "TranslationJobStatus" RENAME VALUE 'QUEUED' TO 'PENDING';
ALTER TYPE "TranslationJobStatus" RENAME VALUE 'PARTIAL' TO 'PARTIAL_FAILED';
ALTER TYPE "TranslationJobStatus" ADD VALUE IF NOT EXISTS 'PAUSED';
ALTER TYPE "TranslationJobStatus" ADD VALUE IF NOT EXISTS 'CLOSED';

ALTER TYPE "TranslationJobItemStatus" RENAME VALUE 'QUEUED' TO 'PENDING';
ALTER TYPE "TranslationJobItemStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

ALTER TABLE "ProductTranslationJob"
  RENAME COLUMN "inputTokens" TO "promptTokens";
ALTER TABLE "ProductTranslationJob"
  RENAME COLUMN "outputTokens" TO "completionTokens";

ALTER TABLE "ProductTranslationJob"
  ALTER COLUMN "promptTokens" DROP DEFAULT,
  ALTER COLUMN "promptTokens" DROP NOT NULL,
  ALTER COLUMN "completionTokens" DROP DEFAULT,
  ALTER COLUMN "completionTokens" DROP NOT NULL,
  ADD COLUMN "totalTokens" INTEGER,
  ADD COLUMN "executionId" TEXT,
  ADD COLUMN "lockedAt" TIMESTAMP(3),
  ADD COLUMN "lockedBy" TEXT,
  ADD COLUMN "cancelledAt" TIMESTAMP(3),
  ADD COLUMN "closedAt" TIMESTAMP(3),
  ADD COLUMN "cancelledItems" INTEGER NOT NULL DEFAULT 0;

UPDATE "ProductTranslationJob"
SET
  "totalTokens" = CASE
    WHEN "promptTokens" = 0 AND "completionTokens" = 0 THEN NULL
    ELSE "promptTokens" + "completionTokens"
  END,
  "promptTokens" = CASE WHEN "promptTokens" = 0 AND "completionTokens" = 0 THEN NULL ELSE "promptTokens" END,
  "completionTokens" = CASE WHEN "promptTokens" = 0 AND "completionTokens" = 0 THEN NULL ELSE "completionTokens" END;

CREATE UNIQUE INDEX "ProductTranslationJob_executionId_key"
  ON "ProductTranslationJob"("executionId");

ALTER TABLE "ProductTranslationJobItem"
  RENAME COLUMN "error" TO "errorMessage";
ALTER TABLE "ProductTranslationJobItem"
  RENAME COLUMN "inputTokens" TO "promptTokens";
ALTER TABLE "ProductTranslationJobItem"
  RENAME COLUMN "outputTokens" TO "completionTokens";
ALTER TABLE "ProductTranslationJobItem"
  RENAME COLUMN "attempts" TO "attemptCount";

ALTER TABLE "ProductTranslationJobItem"
  ALTER COLUMN "promptTokens" DROP DEFAULT,
  ALTER COLUMN "promptTokens" DROP NOT NULL,
  ALTER COLUMN "completionTokens" DROP DEFAULT,
  ALTER COLUMN "completionTokens" DROP NOT NULL,
  ADD COLUMN "errorType" TEXT,
  ADD COLUMN "rawResponse" TEXT,
  ADD COLUMN "totalTokens" INTEGER,
  ADD COLUMN "retryCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "currentRunAttemptCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "durationMs" INTEGER;

UPDATE "ProductTranslationJobItem"
SET
  "totalTokens" = CASE
    WHEN "promptTokens" = 0 AND "completionTokens" = 0 THEN NULL
    ELSE "promptTokens" + "completionTokens"
  END,
  "promptTokens" = CASE WHEN "promptTokens" = 0 AND "completionTokens" = 0 THEN NULL ELSE "promptTokens" END,
  "completionTokens" = CASE WHEN "promptTokens" = 0 AND "completionTokens" = 0 THEN NULL ELSE "completionTokens" END;

CREATE TABLE "ProductTranslationLog" (
  "id" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "targetLocale" "Locale" NOT NULL,
  "promptVersion" TEXT NOT NULL,
  "attemptNumber" INTEGER NOT NULL,
  "errorType" TEXT,
  "errorMessage" TEXT,
  "rawResponse" TEXT,
  "requestStartedAt" TIMESTAMP(3) NOT NULL,
  "requestFinishedAt" TIMESTAMP(3) NOT NULL,
  "durationMs" INTEGER NOT NULL,
  "promptTokens" INTEGER,
  "completionTokens" INTEGER,
  "totalTokens" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductTranslationLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProductTranslationLog_jobId_createdAt_idx"
  ON "ProductTranslationLog"("jobId", "createdAt");
CREATE INDEX "ProductTranslationLog_itemId_createdAt_idx"
  ON "ProductTranslationLog"("itemId", "createdAt");

ALTER TABLE "ProductTranslationLog"
  ADD CONSTRAINT "ProductTranslationLog_jobId_fkey"
  FOREIGN KEY ("jobId") REFERENCES "ProductTranslationJob"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductTranslationLog"
  ADD CONSTRAINT "ProductTranslationLog_itemId_fkey"
  FOREIGN KEY ("itemId") REFERENCES "ProductTranslationJobItem"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
