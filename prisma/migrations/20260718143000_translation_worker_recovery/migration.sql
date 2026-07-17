-- Add durable worker metadata without replacing the existing lifecycle enums,
-- so previously created jobs and deployment code remain readable during rollout.
ALTER TABLE "ProductTranslationJob"
  ADD COLUMN "heartbeatAt" TIMESTAMP(3),
  ADD COLUMN "contentTypes" TEXT[] NOT NULL DEFAULT ARRAY[
    'PRODUCT', 'MEDIA_ALT', 'MEDIA_CAPTION', 'FEATURE_TITLE',
    'FEATURE_DESCRIPTION', 'SPEC_LABEL', 'SPEC_VALUE', 'APPLICATION_TITLE',
    'APPLICATION_DESCRIPTION', 'DOWNLOAD_TITLE', 'SEO'
  ]::TEXT[];

ALTER TABLE "ProductTranslationJobItem"
  ADD COLUMN "contentTypes" TEXT[] NOT NULL DEFAULT ARRAY[
    'PRODUCT', 'MEDIA_ALT', 'MEDIA_CAPTION', 'FEATURE_TITLE',
    'FEATURE_DESCRIPTION', 'SPEC_LABEL', 'SPEC_VALUE', 'APPLICATION_TITLE',
    'APPLICATION_DESCRIPTION', 'DOWNLOAD_TITLE', 'SEO'
  ]::TEXT[],
  ADD COLUMN "processingStep" TEXT NOT NULL DEFAULT 'QUEUED',
  ADD COLUMN "heartbeatAt" TIMESTAMP(3),
  ADD COLUMN "nextAttemptAt" TIMESTAMP(3),
  ADD COLUMN "workerId" TEXT;

-- Existing active rows may have been abandoned by a browser-driven worker.
-- Mark them old so the first background worker pass safely requeues them.
UPDATE "ProductTranslationJob"
SET "heartbeatAt" = COALESCE("lockedAt", "updatedAt")
WHERE "status" = 'RUNNING';

UPDATE "ProductTranslationJobItem"
SET
  "heartbeatAt" = COALESCE("updatedAt", "startedAt"),
  "processingStep" = CASE
    WHEN "status" = 'RUNNING' THEN 'CALL_MODEL'
    WHEN "status" IN ('COMPLETED', 'SKIPPED') THEN 'DONE'
    WHEN "status" = 'FAILED' THEN 'FAILED'
    WHEN "status" = 'CANCELLED' THEN 'CANCELLED'
    ELSE 'QUEUED'
  END;

CREATE INDEX "ProductTranslationJob_status_heartbeatAt_idx"
  ON "ProductTranslationJob"("status", "heartbeatAt");
CREATE INDEX "ProductTranslationJobItem_status_nextAttemptAt_createdAt_idx"
  ON "ProductTranslationJobItem"("status", "nextAttemptAt", "createdAt");
