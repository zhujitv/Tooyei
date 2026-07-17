import {
  TranslationJobItemStatus,
  TranslationJobStatus,
} from "@/generated/prisma/client";

export type TranslationItemCounts = {
  pending: number;
  running: number;
  completed: number;
  failed: number;
  skipped: number;
  cancelled: number;
};

export const processedTranslationItemCount = (counts: TranslationItemCounts) =>
  counts.completed + counts.failed + counts.skipped + counts.cancelled;

export const canClaimTranslationItem = (status: TranslationJobItemStatus) =>
  status === TranslationJobItemStatus.PENDING;

export const canStartTranslationJob = (status: TranslationJobStatus, pendingItems: number) =>
  pendingItems > 0 && (
    status === TranslationJobStatus.PENDING
    || status === TranslationJobStatus.PAUSED
    || status === TranslationJobStatus.CANCELLED
    || status === TranslationJobStatus.PARTIAL_FAILED
    || status === TranslationJobStatus.FAILED
  );

export const canDeleteTranslationJob = (status: TranslationJobStatus, runningItems: number) =>
  status !== TranslationJobStatus.RUNNING && runningItems === 0;

export const deriveRestoredTranslationJobStatus = (counts: TranslationItemCounts) => {
  if (counts.pending) return TranslationJobStatus.PENDING;
  const successful = counts.completed + counts.skipped;
  const unsuccessful = counts.failed + counts.cancelled;
  if (unsuccessful && successful) return TranslationJobStatus.PARTIAL_FAILED;
  if (unsuccessful) return TranslationJobStatus.FAILED;
  return TranslationJobStatus.COMPLETED;
};

export const shouldContinueTranslationBatch = (status: TranslationJobStatus, counts: TranslationItemCounts) =>
  status === TranslationJobStatus.RUNNING && counts.pending > 0;

export const translationJobDeletionTables = [
  "ProductTranslationLog",
  "ProductTranslationJobItem",
  "ProductTranslationJob",
] as const;
