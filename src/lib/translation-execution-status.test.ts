import assert from "node:assert/strict";
import test from "node:test";

import { TranslationJobItemStatus, TranslationJobStatus } from "@/generated/prisma/client";
import { getTranslationItemExecutionStatus, getTranslationJobExecutionStatus } from "./translation-execution-status";
import { hasTranslationContentType, translationContentTypes, translationWorkerConfig } from "./translation-worker-config";

test("exposes the requested seven execution statuses without rewriting legacy rows", () => {
  assert.equal(getTranslationJobExecutionStatus({ status: TranslationJobStatus.PENDING }), "PENDING");
  assert.equal(getTranslationJobExecutionStatus({ status: TranslationJobStatus.PENDING, startedAt: new Date() }), "QUEUED");
  assert.equal(getTranslationJobExecutionStatus({ status: TranslationJobStatus.RUNNING, runningItems: 1 }), "PROCESSING");
  assert.equal(getTranslationJobExecutionStatus({ status: TranslationJobStatus.RUNNING, retryingItems: 1 }), "RETRYING");
  assert.equal(getTranslationJobExecutionStatus({ status: TranslationJobStatus.COMPLETED }), "SUCCESS");
  assert.equal(getTranslationJobExecutionStatus({ status: TranslationJobStatus.PARTIAL_FAILED }), "FAILED");
  assert.equal(getTranslationJobExecutionStatus({ status: TranslationJobStatus.CANCELLED }), "CANCELLED");
});

test("a delayed item is retrying while a fresh pending item is queued", () => {
  assert.equal(getTranslationItemExecutionStatus({ status: TranslationJobItemStatus.PENDING, retryCount: 0 }), "QUEUED");
  assert.equal(getTranslationItemExecutionStatus({ status: TranslationJobItemStatus.PENDING, retryCount: 1, nextAttemptAt: new Date() }), "RETRYING");
});

test("worker timing and structured content contract match the translation center", () => {
  assert.equal(translationWorkerConfig.providerTimeoutMs, 90_000);
  assert.equal(translationWorkerConfig.heartbeatIntervalMs, 30_000);
  assert.equal(translationWorkerConfig.staleWorkerMs, 300_000);
  assert.equal(translationWorkerConfig.maxAttempts, 3);
  assert.equal(translationWorkerConfig.maxRetries, 2);
  assert.deepEqual(translationWorkerConfig.retryDelaysMs, [10_000, 30_000]);
  assert.deepEqual(translationContentTypes, [
    "PRODUCT",
    "MEDIA_ALT",
    "MEDIA_CAPTION",
    "FEATURE_TITLE",
    "FEATURE_DESCRIPTION",
    "SPEC_LABEL",
    "SPEC_VALUE",
    "APPLICATION_TITLE",
    "APPLICATION_DESCRIPTION",
    "DOWNLOAD_TITLE",
    "SEO",
  ]);
  assert.equal(hasTranslationContentType(["FEATURE"], "FEATURE_TITLE"), true);
  assert.equal(hasTranslationContentType(["SPECIFICATION"], "SPEC_VALUE"), true);
  assert.equal(hasTranslationContentType(["DOWNLOAD"], "DOWNLOAD_TITLE"), true);
});
