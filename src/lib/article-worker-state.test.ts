import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveArticleTranslationJobStatus,
  isArticleWorkerMonitorHealthy,
  shouldRetryArticleTranslation,
} from "@/lib/article-worker-state";

test("article worker retries only retryable failures below the attempt limit", () => {
  assert.equal(shouldRetryArticleTranslation(true, 1), true);
  assert.equal(shouldRetryArticleTranslation(true, 3), false);
  assert.equal(shouldRetryArticleTranslation(false, 1), false);
});

test("article job status distinguishes active, partial and total failures", () => {
  assert.equal(deriveArticleTranslationJobStatus({ pending: 1, running: 0, completed: 0, failed: 0 }), "RUNNING");
  assert.equal(deriveArticleTranslationJobStatus({ pending: 0, running: 0, completed: 2, failed: 0 }), "COMPLETED");
  assert.equal(deriveArticleTranslationJobStatus({ pending: 0, running: 0, completed: 1, failed: 1 }), "PARTIAL_FAILED");
  assert.equal(deriveArticleTranslationJobStatus({ pending: 0, running: 0, completed: 0, failed: 2 }), "FAILED");
});

test("an unavailable worker monitor is never reported as healthy", () => {
  assert.equal(isArticleWorkerMonitorHealthy({ available: false, failedItems: 0, staleItems: 0 }), false);
  assert.equal(isArticleWorkerMonitorHealthy({ available: true, failedItems: 0, staleItems: 0 }), true);
  assert.equal(isArticleWorkerMonitorHealthy({ available: true, failedItems: 1, staleItems: 0 }), false);
});
