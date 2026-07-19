import type { TranslationJobStatus } from "@/generated/prisma/client";

export function shouldRetryArticleTranslation(retryable: boolean, attemptCount: number, maxAttempts = 3) {
  return retryable && attemptCount < maxAttempts;
}

export function deriveArticleTranslationJobStatus(counts: {
  pending: number;
  running: number;
  completed: number;
  failed: number;
}): TranslationJobStatus {
  if (counts.pending + counts.running > 0) return "RUNNING";
  if (counts.failed === 0) return "COMPLETED";
  if (counts.completed > 0) return "PARTIAL_FAILED";
  return "FAILED";
}

export function isArticleWorkerMonitorHealthy(monitor: {
  available: boolean;
  failedItems: number;
  staleItems: number;
}) {
  return monitor.available && monitor.failedItems === 0 && monitor.staleItems === 0;
}
