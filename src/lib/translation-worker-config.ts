export const translationContentTypes = [
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
] as const;

export type TranslationContentType = (typeof translationContentTypes)[number];

export const structuredTranslationContentTypes = [
  "MEDIA_ALT",
  "MEDIA_CAPTION",
  "FEATURE_TITLE",
  "FEATURE_DESCRIPTION",
  "SPEC_LABEL",
  "SPEC_VALUE",
  "APPLICATION_TITLE",
  "APPLICATION_DESCRIPTION",
  "DOWNLOAD_TITLE",
] as const satisfies readonly TranslationContentType[];

export const hasTranslationContentType = (
  values: readonly string[],
  type: TranslationContentType,
) => values.includes(type) || (
  (type === "FEATURE_TITLE" || type === "FEATURE_DESCRIPTION") && values.includes("FEATURE")
) || (
  (type === "SPEC_LABEL" || type === "SPEC_VALUE") && values.includes("SPECIFICATION")
) || (
  (type === "APPLICATION_TITLE" || type === "APPLICATION_DESCRIPTION") && values.includes("APPLICATION")
) || (type === "DOWNLOAD_TITLE" && values.includes("DOWNLOAD"));

export const translationProcessingSteps = [
  "QUEUED",
  "GET_CONTENT",
  "BUILD_PROMPT",
  "CALL_MODEL",
  "SAVE_RESULT",
  "RETRY_WAIT",
  "DONE",
  "FAILED",
  "CANCELLED",
] as const;

export type TranslationProcessingStep = (typeof translationProcessingSteps)[number];

export const translationProcessingStepLabels: Record<TranslationProcessingStep, string> = {
  QUEUED: "等待队列",
  GET_CONTENT: "获取内容",
  BUILD_PROMPT: "生成 Prompt",
  CALL_MODEL: "调用模型",
  SAVE_RESULT: "保存结果",
  RETRY_WAIT: "等待重试",
  DONE: "处理完成",
  FAILED: "处理失败",
  CANCELLED: "已取消",
};

export const translationExecutionStatuses = [
  "PENDING",
  "QUEUED",
  "PROCESSING",
  "SUCCESS",
  "FAILED",
  "RETRYING",
  "CANCELLED",
] as const;

export type TranslationExecutionStatus = (typeof translationExecutionStatuses)[number];

export const translationWorkerConfig = {
  providerTimeoutMs: 90_000,
  heartbeatIntervalMs: 30_000,
  staleWorkerMs: 5 * 60_000,
  maxRetries: 3,
  retryDelaysMs: [10_000, 30_000, 120_000] as const,
} as const;

export const isTranslationProcessingStep = (value: string): value is TranslationProcessingStep =>
  translationProcessingSteps.includes(value as TranslationProcessingStep);
