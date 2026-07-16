-- CreateEnum
CREATE TYPE "InquiryNoteKind" AS ENUM ('GENERAL', 'CALL', 'EMAIL', 'WHATSAPP', 'QUOTE', 'SAMPLE', 'MEETING', 'OTHER');

-- CreateTable
CREATE TABLE "InquiryNote" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "authorId" TEXT,
    "kind" "InquiryNoteKind" NOT NULL DEFAULT 'GENERAL',
    "body" TEXT NOT NULL,
    "nextFollowUpAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InquiryNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InquiryNote_inquiryId_createdAt_idx" ON "InquiryNote"("inquiryId", "createdAt");

-- CreateIndex
CREATE INDEX "InquiryNote_authorId_createdAt_idx" ON "InquiryNote"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "InquiryNote_nextFollowUpAt_idx" ON "InquiryNote"("nextFollowUpAt");

-- AddForeignKey
ALTER TABLE "InquiryNote" ADD CONSTRAINT "InquiryNote_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryNote" ADD CONSTRAINT "InquiryNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
