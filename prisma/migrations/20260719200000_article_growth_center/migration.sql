-- AlterTable
ALTER TABLE "Article"
ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "coverImage" TEXT,
ADD COLUMN "authorName" TEXT;

-- AlterTable
ALTER TABLE "ArticleTranslation"
ADD COLUMN "readingMinutes" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "ArticleTranslationJob" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "status" "TranslationJobStatus" NOT NULL DEFAULT 'PENDING',
    "sourceLocale" "Locale" NOT NULL DEFAULT 'EN',
    "targetLocales" "Locale"[] NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "completedItems" INTEGER NOT NULL DEFAULT 0,
    "failedItems" INTEGER NOT NULL DEFAULT 0,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "totalTokens" INTEGER,
    "lastError" TEXT,
    "executionId" TEXT,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "heartbeatAt" TIMESTAMP(3),
    "requestedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArticleTranslationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleTranslationJobItem" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "targetLocale" "Locale" NOT NULL,
    "status" "TranslationJobItemStatus" NOT NULL DEFAULT 'PENDING',
    "inputHash" TEXT,
    "responseId" TEXT,
    "output" JSONB,
    "warnings" JSONB,
    "errorType" TEXT,
    "errorMessage" TEXT,
    "rawResponse" TEXT,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "totalTokens" INTEGER,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3),
    "workerId" TEXT,
    "heartbeatAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArticleTranslationJobItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Article_status_featured_publishedAt_idx" ON "Article"("status", "featured", "publishedAt");
CREATE UNIQUE INDEX "ArticleTranslationJob_executionId_key" ON "ArticleTranslationJob"("executionId");
CREATE INDEX "ArticleTranslationJob_status_createdAt_idx" ON "ArticleTranslationJob"("status", "createdAt");
CREATE INDEX "ArticleTranslationJob_status_heartbeatAt_idx" ON "ArticleTranslationJob"("status", "heartbeatAt");
CREATE INDEX "ArticleTranslationJob_articleId_createdAt_idx" ON "ArticleTranslationJob"("articleId", "createdAt");
CREATE INDEX "ArticleTranslationJob_requestedById_createdAt_idx" ON "ArticleTranslationJob"("requestedById", "createdAt");
CREATE UNIQUE INDEX "ArticleTranslationJobItem_jobId_targetLocale_key" ON "ArticleTranslationJobItem"("jobId", "targetLocale");
CREATE INDEX "ArticleTranslationJobItem_jobId_status_createdAt_idx" ON "ArticleTranslationJobItem"("jobId", "status", "createdAt");
CREATE INDEX "ArticleTranslationJobItem_status_nextAttemptAt_createdAt_idx" ON "ArticleTranslationJobItem"("status", "nextAttemptAt", "createdAt");

-- AddForeignKey
ALTER TABLE "ArticleTranslationJob" ADD CONSTRAINT "ArticleTranslationJob_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArticleTranslationJob" ADD CONSTRAINT "ArticleTranslationJob_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ArticleTranslationJobItem" ADD CONSTRAINT "ArticleTranslationJobItem_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ArticleTranslationJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
