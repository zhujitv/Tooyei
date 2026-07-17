import assert from "node:assert/strict";
import test from "node:test";

import { TranslationJobItemStatus, TranslationJobStatus } from "@/generated/prisma/client";
import {
  canClaimTranslationItem,
  canDeleteTranslationJob,
  canStartTranslationJob,
  deriveRestoredTranslationJobStatus,
  processedTranslationItemCount,
  shouldContinueTranslationBatch,
  translationJobDeletionTables,
} from "./translation-job-state";

const counts = (overrides: Partial<Parameters<typeof processedTranslationItemCount>[0]> = {}) => ({
  pending: 0,
  running: 0,
  completed: 0,
  failed: 0,
  skipped: 0,
  cancelled: 0,
  ...overrides,
});

test("processed progress excludes RUNNING but includes cancelled items", () => {
  assert.equal(processedTranslationItemCount(counts({ running: 2, completed: 3, failed: 1, skipped: 1, cancelled: 1 })), 6);
});

test("only pending items can be claimed", () => {
  assert.equal(canClaimTranslationItem(TranslationJobItemStatus.PENDING), true);
  assert.equal(canClaimTranslationItem(TranslationJobItemStatus.COMPLETED), false);
  assert.equal(canClaimTranslationItem(TranslationJobItemStatus.FAILED), false);
});

test("a running job cannot start a second worker", () => {
  assert.equal(canStartTranslationJob(TranslationJobStatus.RUNNING, 2), false);
});

test("a closed job cannot continue", () => {
  assert.equal(canStartTranslationJob(TranslationJobStatus.CLOSED, 2), false);
});

test("a cancelled job can resume pending items", () => {
  assert.equal(canStartTranslationJob(TranslationJobStatus.CANCELLED, 2), true);
});

test("a running job or running item blocks deletion", () => {
  assert.equal(canDeleteTranslationJob(TranslationJobStatus.RUNNING, 0), false);
  assert.equal(canDeleteTranslationJob(TranslationJobStatus.CANCELLED, 1), false);
  assert.equal(canDeleteTranslationJob(TranslationJobStatus.CANCELLED, 0), true);
});

test("closed job restoration derives the correct status", () => {
  assert.equal(deriveRestoredTranslationJobStatus(counts({ pending: 1, failed: 1 })), TranslationJobStatus.PENDING);
  assert.equal(deriveRestoredTranslationJobStatus(counts({ completed: 1, failed: 1 })), TranslationJobStatus.PARTIAL_FAILED);
  assert.equal(deriveRestoredTranslationJobStatus(counts({ failed: 2 })), TranslationJobStatus.FAILED);
  assert.equal(deriveRestoredTranslationJobStatus(counts({ completed: 1, cancelled: 1 })), TranslationJobStatus.PARTIAL_FAILED);
  assert.equal(deriveRestoredTranslationJobStatus(counts({ completed: 2 })), TranslationJobStatus.COMPLETED);
});

test("one failed item does not stop a running batch with pending work", () => {
  assert.equal(shouldContinueTranslationBatch(TranslationJobStatus.RUNNING, counts({ failed: 1, pending: 2 })), true);
});

test("task deletion scope excludes saved product translations", () => {
  assert.deepEqual(translationJobDeletionTables, ["ProductTranslationLog", "ProductTranslationJobItem", "ProductTranslationJob"]);
  assert.equal(translationJobDeletionTables.includes("ProductTranslation" as never), false);
});
