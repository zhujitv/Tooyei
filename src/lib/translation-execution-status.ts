import type { TranslationJobItemStatus, TranslationJobStatus } from "@/generated/prisma/client";
import type { TranslationExecutionStatus } from "@/lib/translation-worker-config";

export function getTranslationJobExecutionStatus(input: {
  status: TranslationJobStatus;
  startedAt?: Date | null;
  runningItems?: number;
  retryingItems?: number;
}): TranslationExecutionStatus {
  if (input.status === "COMPLETED") return "SUCCESS";
  if (input.status === "FAILED" || input.status === "PARTIAL_FAILED") return "FAILED";
  if (input.status === "CANCELLED" || input.status === "CLOSED") return "CANCELLED";
  if (input.status === "RUNNING") {
    if (!input.runningItems && input.retryingItems) return "RETRYING";
    return "PROCESSING";
  }
  if (input.status === "PAUSED") return "RETRYING";
  return input.startedAt ? "QUEUED" : "PENDING";
}

export function getTranslationItemExecutionStatus(input: {
  status: TranslationJobItemStatus;
  retryCount: number;
  nextAttemptAt?: Date | null;
}): TranslationExecutionStatus {
  if (input.status === "COMPLETED" || input.status === "QA_PASSED" || input.status === "QA_WARNING" || input.status === "SKIPPED") return "SUCCESS";
  if (input.status === "FAILED" || input.status === "QA_FAILED" || input.status === "NEEDS_REVIEW") return "FAILED";
  if (input.status === "TRANSLATED") return "PROCESSING";
  if (input.status === "CANCELLED") return "CANCELLED";
  if (input.status === "RUNNING") return "PROCESSING";
  if (input.retryCount > 0 || input.nextAttemptAt) return "RETRYING";
  return "QUEUED";
}
