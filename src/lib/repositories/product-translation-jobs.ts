import "server-only";

import { randomUUID } from "node:crypto";
import {
  Locale,
  Prisma,
  ProductKind,
  TranslationJobItemStatus,
  TranslationJobStatus,
  TranslationStatus,
} from "@/generated/prisma/client";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import {
  generateProductTranslation,
  productTranslationPromptVersion,
  TranslationBusinessError,
  TranslationResponseValidationError,
  type ProductTranslationOutput,
} from "@/lib/product-translation-service";
import { TranslationResponseParseError } from "@/lib/translation-response-parser";
import {
  canDeleteTranslationJob,
  deriveRestoredTranslationJobStatus,
  type TranslationItemCounts,
} from "@/lib/translation-job-state";
import {
  getTranslationProviderState,
  getTranslationProviderStates,
} from "@/lib/translation-providers/config";
import {
  TranslationProviderRequestError,
  type TranslationProviderId,
} from "@/lib/translation-providers/types";

export const translationLocales = [
  Locale.EN,
  Locale.DE,
  Locale.FR,
  Locale.ES,
  Locale.RU,
  Locale.JA,
  Locale.IT,
  Locale.AR,
  Locale.ZH,
] as const;

export type TranslationLocale = (typeof translationLocales)[number];
export type TranslationJobScope = "MISSING" | "NON_PUBLISHED";

export type CreateTranslationJobInput = {
  actorEmail: string;
  provider: TranslationProviderId;
  sourceLocale: TranslationLocale;
  targetLocales: TranslationLocale[];
  scope: TranslationJobScope;
  kind?: ProductKind;
  productIds?: string[];
  productLimit: number;
};

const assertDatabase = () => {
  if (!isDatabaseConfigured()) throw new Error("DATABASE_URL 尚未配置，无法管理翻译任务。");
};

export const getTranslationServiceState = (provider?: string) => getTranslationProviderState(provider);
export const getTranslationServiceStates = () => getTranslationProviderStates();

export async function getTranslationDashboard(status?: TranslationJobStatus) {
  if (!isDatabaseConfigured()) {
    return {
      totalProducts: 0,
      coverage: Object.fromEntries(translationLocales.map((locale) => [locale, { ready: 0, review: 0, missing: 0 }])) as Record<TranslationLocale, { ready: number; review: number; missing: number }>,
      jobs: [],
    };
  }

  const prisma = getPrisma();
  const [totalProducts, grouped, jobs] = await Promise.all([
    prisma.product.count(),
    prisma.productTranslation.groupBy({
      by: ["locale", "status"],
      where: { locale: { in: [...translationLocales] } },
      _count: { _all: true },
    }),
    prisma.productTranslationJob.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        status: true,
        sourceLocale: true,
        targetLocales: true,
        provider: true,
        model: true,
        totalItems: true,
        completedItems: true,
        failedItems: true,
        skippedItems: true,
        cancelledItems: true,
        promptTokens: true,
        completionTokens: true,
        totalTokens: true,
        lastError: true,
        createdAt: true,
        completedAt: true,
        cancelledAt: true,
        closedAt: true,
        requestedBy: { select: { name: true, email: true } },
      },
    }),
  ]);

  const coverage = Object.fromEntries(translationLocales.map((locale) => {
    const rows = grouped.filter((row) => row.locale === locale);
    const ready = rows.find((row) => row.status === TranslationStatus.PUBLISHED)?._count._all ?? 0;
    const review = rows
      .filter((row) => row.status === TranslationStatus.MACHINE_DRAFT || row.status === TranslationStatus.NEEDS_REVIEW)
      .reduce((sum, row) => sum + row._count._all, 0);
    return [locale, { ready, review, missing: Math.max(0, totalProducts - ready - review) }];
  })) as Record<TranslationLocale, { ready: number; review: number; missing: number }>;

  return { totalProducts, coverage, jobs };
}

export async function getTranslationProductOptions(query = "") {
  if (!isDatabaseConfigured()) return [];
  const contains = query.trim();
  return getPrisma().product.findMany({
    where: contains
      ? { OR: [
          { sku: { contains, mode: "insensitive" } },
          { slug: { contains, mode: "insensitive" } },
          { translations: { some: { title: { contains, mode: "insensitive" } } } },
        ] }
      : undefined,
    orderBy: [{ updatedAt: "desc" }, { sku: "asc" }],
    take: 40,
    select: {
      id: true,
      sku: true,
      slug: true,
      kind: true,
      translations: { where: { locale: { in: [...translationLocales] } }, select: { locale: true, title: true, status: true } },
    },
  });
}

export async function createProductTranslationJob(input: CreateTranslationJobInput) {
  assertDatabase();
  const service = getTranslationProviderState(input.provider);
  if (!service.configured || !service.provider || !service.model) {
    throw new Error(service.error || "翻译 Provider 配置无效。");
  }
  const targetLocales = Array.from(new Set(input.targetLocales)).filter((locale) => locale !== input.sourceLocale);
  if (!targetLocales.length) throw new Error("请至少选择一种不同于源语言的目标语言。");

  const prisma = getPrisma();
  const actor = await prisma.adminUser.findUnique({
    where: { email: input.actorEmail.trim().toLowerCase() },
    select: { id: true },
  });
  if (!actor) throw new Error("当前管理员账号不存在。");

  const products = await prisma.product.findMany({
    where: {
      ...(input.kind ? { kind: input.kind } : {}),
      ...(input.productIds?.length ? { id: { in: Array.from(new Set(input.productIds)) } } : {}),
      translations: {
        some: {
          locale: input.sourceLocale,
          status: { not: TranslationStatus.MISSING },
          title: { not: "" },
          summary: { not: "" },
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }, { sku: "asc" }],
    take: Math.max(1, Math.min(50, input.productLimit)),
    select: {
      id: true,
      slug: true,
      sku: true,
      translations: {
        where: { locale: { in: targetLocales } },
        select: { locale: true, status: true },
      },
    },
  });

  const items = products.flatMap((product) => targetLocales.flatMap((targetLocale) => {
    const current = product.translations.find(({ locale }) => locale === targetLocale);
    if (current?.status === TranslationStatus.PUBLISHED) return [];
    if (input.scope === "MISSING" && current && current.status !== TranslationStatus.MISSING) return [];
    return [{
      productId: product.id,
      productSlug: product.slug,
      productSku: product.sku,
      targetLocale,
    }];
  }));
  if (!items.length) throw new Error("当前筛选范围内没有可创建的翻译任务；已发布译文不会被自动覆盖。");

  return prisma.productTranslationJob.create({
    data: {
      sourceLocale: input.sourceLocale,
      targetLocales,
      provider: service.provider,
      model: service.model,
      totalItems: items.length,
      requestedById: actor.id,
      items: { create: items },
    },
    select: { id: true, totalItems: true },
  });
}

export async function getProductTranslationJob(id: string) {
  if (!isDatabaseConfigured()) return null;
  return getPrisma().productTranslationJob.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      sourceLocale: true,
      targetLocales: true,
      provider: true,
      model: true,
      totalItems: true,
      completedItems: true,
      failedItems: true,
      skippedItems: true,
      cancelledItems: true,
      promptTokens: true,
      completionTokens: true,
      totalTokens: true,
      lastError: true,
      createdAt: true,
      startedAt: true,
      completedAt: true,
      cancelledAt: true,
      closedAt: true,
      executionId: true,
      lockedAt: true,
      requestedBy: { select: { name: true, email: true } },
      items: {
        orderBy: [{ status: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          productId: true,
          productSlug: true,
          productSku: true,
          targetLocale: true,
          status: true,
          warnings: true,
          errorType: true,
          errorMessage: true,
          rawResponse: true,
          promptTokens: true,
          completionTokens: true,
          totalTokens: true,
          attemptCount: true,
          retryCount: true,
          currentRunAttemptCount: true,
          durationMs: true,
          responseId: true,
          startedAt: true,
          completedAt: true,
          logs: {
            orderBy: { createdAt: "desc" },
            take: 10,
            select: {
              id: true,
              provider: true,
              model: true,
              targetLocale: true,
              promptVersion: true,
              attemptNumber: true,
              errorType: true,
              errorMessage: true,
              rawResponse: true,
              requestStartedAt: true,
              requestFinishedAt: true,
              durationMs: true,
              promptTokens: true,
              completionTokens: true,
              totalTokens: true,
              createdAt: true,
            },
          },
          product: {
            select: {
              translations: {
                where: { locale: { in: [...translationLocales] } },
                select: { locale: true, title: true, status: true },
              },
            },
          },
        },
      },
    },
  });
}

const saveGeneratedTranslation = async (
  productId: string,
  targetLocale: Locale,
  output: ProductTranslationOutput,
) => {
  const prisma = getPrisma();
  return prisma.$transaction(async (tx) => {
    const current = await tx.productTranslation.findUnique({
      where: { productId_locale: { productId, locale: targetLocale } },
      select: { status: true },
    });
    if (current?.status === TranslationStatus.PUBLISHED) return { skipped: true };

    await tx.productTranslation.upsert({
      where: { productId_locale: { productId, locale: targetLocale } },
      update: {
        title: output.title,
        summary: output.summary,
        seoTitle: output.seoTitle,
        seoDescription: output.seoDescription,
        status: TranslationStatus.MACHINE_DRAFT,
        publishedAt: null,
      },
      create: {
        productId,
        locale: targetLocale,
        title: output.title,
        summary: output.summary,
        seoTitle: output.seoTitle,
        seoDescription: output.seoDescription,
        status: TranslationStatus.MACHINE_DRAFT,
      },
    });

    for (const item of output.media) {
      await tx.productMediaTranslation.upsert({
        where: { productId_assetId_locale: { productId, assetId: item.id, locale: targetLocale } },
        update: { alt: item.alt, caption: item.caption || null },
        create: { productId, assetId: item.id, locale: targetLocale, alt: item.alt, caption: item.caption || null },
      });
    }
    for (const item of output.features) {
      await tx.productFeatureTranslation.upsert({
        where: { featureId_locale: { featureId: item.id, locale: targetLocale } },
        update: { value: item.title, description: item.description || null },
        create: { featureId: item.id, locale: targetLocale, value: item.title, description: item.description || null },
      });
    }
    for (const item of output.specifications) {
      await tx.productSpecificationTranslation.upsert({
        where: { specificationId_locale: { specificationId: item.id, locale: targetLocale } },
        update: { group: item.group || null, label: item.label, displayValue: item.displayValue || null },
        create: { specificationId: item.id, locale: targetLocale, group: item.group || null, label: item.label, displayValue: item.displayValue || null },
      });
    }
    for (const item of output.applications) {
      await tx.productApplicationTranslation.upsert({
        where: { applicationId_locale: { applicationId: item.id, locale: targetLocale } },
        update: { title: item.title, description: item.description || null, imageAlt: item.imageAlt || null },
        create: { applicationId: item.id, locale: targetLocale, title: item.title, description: item.description || null, imageAlt: item.imageAlt || null },
      });
    }
    for (const item of output.downloads) {
      await tx.productDownloadTranslation.upsert({
        where: { downloadId_locale: { downloadId: item.id, locale: targetLocale } },
        update: { title: item.title, description: item.description || null },
        create: { downloadId: item.id, locale: targetLocale, title: item.title, description: item.description || null },
      });
    }
    return { skipped: false };
  });
};

const maxAttemptsPerRun = 3;
const retryBackoffMs = [500, 1_500] as const;
const rawResponseLimit = 64_000;
const executionStatuses = [
  TranslationJobStatus.PENDING,
  TranslationJobStatus.PAUSED,
  TranslationJobStatus.CANCELLED,
  TranslationJobStatus.PARTIAL_FAILED,
  TranslationJobStatus.FAILED,
] as const;

const limitRawResponse = (value: string | null | undefined) => {
  if (!value) return null;
  if (value.length <= rawResponseLimit) return value;
  const suffix = "\n…[响应已截断]";
  return `${value.slice(0, rawResponseLimit - suffix.length)}${suffix}`;
};

const delay = (durationMs: number) => new Promise((resolve) => setTimeout(resolve, durationMs));

type TranslationFailure = {
  errorType: string;
  errorMessage: string;
  retryable: boolean;
  rawResponse: string | null;
  responseId: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
};

const classifyTranslationFailure = (error: unknown): TranslationFailure => {
  const message = (error instanceof Error ? error.message : "翻译执行失败。").slice(0, 1_200);
  if (error instanceof TranslationProviderRequestError) {
    return {
      errorType: error.errorType,
      errorMessage: message,
      retryable: error.retryable,
      rawResponse: null,
      responseId: null,
      promptTokens: null,
      completionTokens: null,
      totalTokens: null,
    };
  }
  if (error instanceof TranslationResponseParseError || error instanceof TranslationResponseValidationError) {
    return {
      errorType: error.errorType,
      errorMessage: message,
      retryable: true,
      rawResponse: limitRawResponse(error.rawResponse),
      responseId: error.responseId,
      promptTokens: error.promptTokens,
      completionTokens: error.completionTokens,
      totalTokens: error.totalTokens,
    };
  }
  if (error instanceof TranslationBusinessError) {
    return {
      errorType: error.errorType,
      errorMessage: message,
      retryable: false,
      rawResponse: null,
      responseId: null,
      promptTokens: null,
      completionTokens: null,
      totalTokens: null,
    };
  }
  return {
    errorType: "UNKNOWN",
    errorMessage: message,
    retryable: false,
    rawResponse: null,
    responseId: null,
    promptTokens: null,
    completionTokens: null,
    totalTokens: null,
  };
};

export async function refreshProductTranslationJobSummary(jobId: string) {
  const prisma = getPrisma();
  const [job, aggregates] = await Promise.all([
    prisma.productTranslationJob.findUnique({ where: { id: jobId }, select: { status: true } }),
    prisma.productTranslationJobItem.groupBy({
      by: ["status"],
      where: { jobId },
      _count: { _all: true },
      _sum: { promptTokens: true, completionTokens: true, totalTokens: true },
    }),
  ]);
  if (!job) throw new Error("翻译任务不存在。");

  const count = (status: TranslationJobItemStatus) => aggregates.find((row) => row.status === status)?._count._all ?? 0;
  const completedItems = count(TranslationJobItemStatus.COMPLETED);
  const failedItems = count(TranslationJobItemStatus.FAILED);
  const skippedItems = count(TranslationJobItemStatus.SKIPPED);
  const cancelledItems = count(TranslationJobItemStatus.CANCELLED);
  const pendingItems = count(TranslationJobItemStatus.PENDING);
  const runningItems = count(TranslationJobItemStatus.RUNNING);
  const remaining = pendingItems + runningItems;
  const successfulItems = completedItems + skippedItems;
  const unsuccessfulItems = failedItems + cancelledItems;
  const preserveStatus = job.status === TranslationJobStatus.CANCELLED || job.status === TranslationJobStatus.CLOSED;
  const status = preserveStatus
    ? job.status
    : remaining
      ? job.status === TranslationJobStatus.RUNNING ? TranslationJobStatus.RUNNING : TranslationJobStatus.PENDING
      : unsuccessfulItems && successfulItems
        ? TranslationJobStatus.PARTIAL_FAILED
        : unsuccessfulItems
          ? TranslationJobStatus.FAILED
          : TranslationJobStatus.COMPLETED;
  const sum = (field: "promptTokens" | "completionTokens" | "totalTokens") => {
    const values = aggregates.map((row) => row._sum[field]).filter((value): value is number => value !== null);
    return values.length ? values.reduce((total, value) => total + value, 0) : null;
  };
  const terminal = remaining === 0 && status !== TranslationJobStatus.CANCELLED && status !== TranslationJobStatus.CLOSED;

  return prisma.productTranslationJob.update({
    where: { id: jobId },
    data: {
      status,
      completedItems,
      failedItems,
      skippedItems,
      cancelledItems,
      promptTokens: sum("promptTokens"),
      completionTokens: sum("completionTokens"),
      totalTokens: sum("totalTokens"),
      completedAt: terminal ? new Date() : preserveStatus ? undefined : null,
      executionId: status === TranslationJobStatus.RUNNING ? undefined : null,
      lockedAt: status === TranslationJobStatus.RUNNING ? undefined : null,
      lockedBy: status === TranslationJobStatus.RUNNING ? undefined : null,
    },
    select: {
      id: true,
      status: true,
      totalItems: true,
      completedItems: true,
      failedItems: true,
      skippedItems: true,
      cancelledItems: true,
      promptTokens: true,
      completionTokens: true,
      totalTokens: true,
    },
  });
}

export async function startProductTranslationJobExecution(jobId: string, actorEmail: string) {
  assertDatabase();
  const prisma = getPrisma();
  const executionId = randomUUID();
  return prisma.$transaction(async (tx) => {
    const job = await tx.productTranslationJob.findUnique({
      where: { id: jobId },
      select: { id: true, status: true, startedAt: true, provider: true, model: true },
    });
    if (!job) throw new Error("翻译任务不存在。");
    if (job.status === TranslationJobStatus.CLOSED) throw new Error("已关闭任务不能继续执行，请先恢复任务。");
    if (job.status === TranslationJobStatus.COMPLETED) throw new Error("任务已全部完成，没有待执行项目。");
    if (job.status === TranslationJobStatus.RUNNING) throw new Error("任务已由另一个执行器运行，请勿重复启动。");
    const service = getTranslationProviderState(job.provider);
    if (!service.configured) throw new Error(service.error || "该任务的翻译 Provider 尚未配置完整。");
    if (service.model !== job.model) {
      throw new Error(`任务使用 ${job.provider} / ${job.model}，该 Provider 当前模型为 ${service.model}；请恢复模型配置或新建任务。`);
    }

    const runningItems = await tx.productTranslationJobItem.count({
      where: { jobId, status: TranslationJobItemStatus.RUNNING },
    });
    if (runningItems) throw new Error("任务仍有正在处理的项目，请等待完成或先停止任务。");
    const pendingItems = await tx.productTranslationJobItem.count({
      where: { jobId, status: TranslationJobItemStatus.PENDING },
    });
    if (!pendingItems) {
      throw new Error(job.status === TranslationJobStatus.FAILED || job.status === TranslationJobStatus.PARTIAL_FAILED
        ? "没有待执行项目，请先将失败项重新排队。"
        : "任务没有待执行项目。");
    }

    const claimed = await tx.productTranslationJob.updateMany({
      where: { id: jobId, status: { in: [...executionStatuses] }, executionId: null },
      data: {
        status: TranslationJobStatus.RUNNING,
        executionId,
        lockedAt: new Date(),
        lockedBy: actorEmail,
        startedAt: job.startedAt ?? new Date(),
        completedAt: null,
        closedAt: null,
        lastError: null,
      },
    });
    if (!claimed.count) throw new Error("任务状态已变化，未启动重复 Worker。");
    return { executionId, pendingItems };
  });
}

const executionIsActive = async (jobId: string, executionId: string) => {
  const job = await getPrisma().productTranslationJob.findFirst({
    where: { id: jobId, status: TranslationJobStatus.RUNNING, executionId },
    select: { id: true },
  });
  return Boolean(job);
};

export async function processNextProductTranslationJobItem(jobId: string, executionId: string) {
  assertDatabase();
  const prisma = getPrisma();
  const jobConfig = await prisma.productTranslationJob.findFirst({
    where: { id: jobId, status: TranslationJobStatus.RUNNING, executionId },
    select: { provider: true, model: true },
  });
  if (!jobConfig) throw new Error("任务未运行、已停止，或执行凭证已失效。");
  const service = getTranslationProviderState(jobConfig.provider);
  if (!service.configured) {
    await prisma.productTranslationJob.updateMany({
      where: { id: jobId, status: TranslationJobStatus.RUNNING, executionId },
      data: { status: TranslationJobStatus.PAUSED, executionId: null, lockedAt: null, lockedBy: null },
    });
    throw new Error(service.error || "该任务的翻译 Provider 尚未配置完整，任务已暂停。");
  }
  if (service.model !== jobConfig.model) {
    await prisma.productTranslationJob.updateMany({
      where: { id: jobId, status: TranslationJobStatus.RUNNING, executionId },
      data: { status: TranslationJobStatus.PAUSED, executionId: null, lockedAt: null, lockedBy: null },
    });
    throw new Error(`任务使用 ${jobConfig.provider} / ${jobConfig.model}，该 Provider 当前模型为 ${service.model}；请恢复模型配置或新建任务。`);
  }

  const item = await prisma.$transaction(async (tx) => {
    const job = await tx.productTranslationJob.findFirst({
      where: { id: jobId, status: TranslationJobStatus.RUNNING, executionId },
      select: { sourceLocale: true, provider: true, model: true },
    });
    if (!job) throw new Error("任务已停止，Worker 不再领取新项目。");

    const candidate = await tx.productTranslationJobItem.findFirst({
      where: { jobId, status: TranslationJobItemStatus.PENDING },
      orderBy: { createdAt: "asc" },
      select: { id: true, productId: true, productSlug: true, targetLocale: true },
    });
    if (!candidate) return null;
    const claimed = await tx.productTranslationJobItem.updateMany({
      where: { id: candidate.id, jobId, status: TranslationJobItemStatus.PENDING },
      data: {
        status: TranslationJobItemStatus.RUNNING,
        startedAt: new Date(),
        completedAt: null,
        errorType: null,
        errorMessage: null,
        currentRunAttemptCount: 0,
        retryCount: 0,
      },
    });
    if (!claimed.count) return null;
    await tx.productTranslationJob.update({
      where: { id: jobId },
      data: { lockedAt: new Date(), lastError: null },
    });
    return { ...candidate, sourceLocale: job.sourceLocale, provider: job.provider, model: job.model };
  });

  if (!item) return { processed: false, executionId, job: await refreshProductTranslationJobSummary(jobId) };

  for (let attemptIndex = 0; attemptIndex < maxAttemptsPerRun; attemptIndex += 1) {
    if (attemptIndex > 0 && !await executionIsActive(jobId, executionId)) {
      const message = "任务已停止，当前项目不再重试。";
      await prisma.productTranslationJobItem.update({
        where: { id: item.id },
        data: {
          status: TranslationJobItemStatus.CANCELLED,
          errorType: "CANCELLED",
          errorMessage: message,
          completedAt: new Date(),
        },
      });
      return { processed: true, executionId, itemId: item.id, error: message, job: await refreshProductTranslationJobSummary(jobId) };
    }

    const attempt = await prisma.productTranslationJobItem.update({
      where: { id: item.id },
      data: {
        attemptCount: { increment: 1 },
        currentRunAttemptCount: { increment: 1 },
        retryCount: attemptIndex,
        errorType: null,
        errorMessage: null,
      },
      select: { attemptCount: true },
    });
    const requestStartedAt = new Date();

    try {
      const generated = await generateProductTranslation(
        item.productId,
        item.sourceLocale,
        item.targetLocale,
        { provider: item.provider, model: item.model },
      );
      const requestFinishedAt = new Date();
      const durationMs = requestFinishedAt.getTime() - requestStartedAt.getTime();
      const saved = await saveGeneratedTranslation(item.productId, item.targetLocale, generated.output);
      await prisma.$transaction([
        prisma.productTranslationLog.create({
          data: {
            jobId,
            itemId: item.id,
            provider: item.provider,
            model: item.model,
            targetLocale: item.targetLocale,
            promptVersion: generated.promptVersion,
            attemptNumber: attempt.attemptCount,
            rawResponse: limitRawResponse(generated.rawResponse),
            requestStartedAt,
            requestFinishedAt,
            durationMs,
            promptTokens: generated.promptTokens,
            completionTokens: generated.completionTokens,
            totalTokens: generated.totalTokens,
          },
        }),
        prisma.productTranslationJobItem.update({
          where: { id: item.id },
          data: {
            status: saved.skipped ? TranslationJobItemStatus.SKIPPED : TranslationJobItemStatus.COMPLETED,
            inputHash: generated.inputHash,
            responseId: generated.responseId,
            output: generated.output as Prisma.InputJsonValue,
            warnings: generated.warnings as Prisma.InputJsonValue,
            rawResponse: limitRawResponse(generated.rawResponse),
            promptTokens: generated.promptTokens,
            completionTokens: generated.completionTokens,
            totalTokens: generated.totalTokens,
            durationMs,
            errorType: null,
            errorMessage: null,
            completedAt: requestFinishedAt,
          },
        }),
      ]);
      return {
        processed: true,
        executionId,
        itemId: item.id,
        productSlug: item.productSlug,
        targetLocale: item.targetLocale,
        job: await refreshProductTranslationJobSummary(jobId),
      };
    } catch (error) {
      const requestFinishedAt = new Date();
      const durationMs = requestFinishedAt.getTime() - requestStartedAt.getTime();
      const failure = classifyTranslationFailure(error);
      await prisma.$transaction([
        prisma.productTranslationLog.create({
          data: {
            jobId,
            itemId: item.id,
            provider: item.provider,
            model: item.model,
            targetLocale: item.targetLocale,
            promptVersion: productTranslationPromptVersion,
            attemptNumber: attempt.attemptCount,
            errorType: failure.errorType,
            errorMessage: failure.errorMessage,
            rawResponse: failure.rawResponse,
            requestStartedAt,
            requestFinishedAt,
            durationMs,
            promptTokens: failure.promptTokens,
            completionTokens: failure.completionTokens,
            totalTokens: failure.totalTokens,
          },
        }),
        prisma.productTranslationJobItem.update({
          where: { id: item.id },
          data: {
            responseId: failure.responseId,
            errorType: failure.errorType,
            errorMessage: failure.errorMessage,
            rawResponse: failure.rawResponse,
            promptTokens: failure.promptTokens,
            completionTokens: failure.completionTokens,
            totalTokens: failure.totalTokens,
            durationMs,
          },
        }),
      ]);

      const canRetry = failure.retryable
        && attemptIndex < maxAttemptsPerRun - 1
        && await executionIsActive(jobId, executionId);
      if (canRetry) {
        await delay(retryBackoffMs[attemptIndex] ?? retryBackoffMs.at(-1)!);
        continue;
      }

      await prisma.$transaction([
        prisma.productTranslationJobItem.update({
          where: { id: item.id },
          data: { status: TranslationJobItemStatus.FAILED, completedAt: new Date() },
        }),
        prisma.productTranslationJob.update({
          where: { id: jobId },
          data: { lastError: failure.errorMessage, lockedAt: new Date() },
        }),
      ]);
      return {
        processed: true,
        executionId,
        itemId: item.id,
        productSlug: item.productSlug,
        targetLocale: item.targetLocale,
        error: failure.errorMessage,
        job: await refreshProductTranslationJobSummary(jobId),
      };
    }
  }

  throw new Error("翻译任务重试状态异常。");
}

export async function retryFailedProductTranslationJobItems(jobId: string) {
  assertDatabase();
  const prisma = getPrisma();
  return prisma.$transaction(async (tx) => {
    const job = await tx.productTranslationJob.findUnique({ where: { id: jobId }, select: { status: true } });
    if (!job) throw new Error("翻译任务不存在。");
    if (job.status === TranslationJobStatus.RUNNING) throw new Error("执行中的任务不能重新排队，请先停止任务。");
    if (job.status === TranslationJobStatus.CLOSED) throw new Error("已关闭任务不能重新排队，请先恢复任务。");
    const result = await tx.productTranslationJobItem.updateMany({
      where: { jobId, status: TranslationJobItemStatus.FAILED },
      data: {
        status: TranslationJobItemStatus.PENDING,
        errorType: null,
        errorMessage: null,
        startedAt: null,
        completedAt: null,
        retryCount: 0,
        currentRunAttemptCount: 0,
        durationMs: null,
      },
    });
    if (result.count) {
      await tx.productTranslationJob.update({
        where: { id: jobId },
        data: {
          status: TranslationJobStatus.PENDING,
          failedItems: 0,
          completedAt: null,
          lastError: null,
          executionId: null,
          lockedAt: null,
          lockedBy: null,
        },
      });
    }
    return result;
  });
}

export async function cancelProductTranslationJob(jobId: string) {
  assertDatabase();
  const result = await getPrisma().productTranslationJob.updateMany({
    where: { id: jobId, status: TranslationJobStatus.RUNNING },
    data: {
      status: TranslationJobStatus.CANCELLED,
      cancelledAt: new Date(),
      executionId: null,
      lockedAt: null,
      lockedBy: null,
    },
  });
  if (!result.count) throw new Error("只有执行中的任务可以停止。");
  return { stopped: true };
}

export async function closeProductTranslationJob(jobId: string) {
  assertDatabase();
  const prisma = getPrisma();
  return prisma.$transaction(async (tx) => {
    const job = await tx.productTranslationJob.findUnique({ where: { id: jobId }, select: { status: true } });
    if (!job) throw new Error("翻译任务不存在。");
    if (job.status === TranslationJobStatus.RUNNING) throw new Error("执行中的任务不能关闭，请先停止任务。");
    if (job.status === TranslationJobStatus.CLOSED) return { closed: true };
    const runningItems = await tx.productTranslationJobItem.count({
      where: { jobId, status: TranslationJobItemStatus.RUNNING },
    });
    if (runningItems) throw new Error("当前单项仍在完成中，请稍后再关闭任务。");
    await tx.productTranslationJob.update({
      where: { id: jobId },
      data: {
        status: TranslationJobStatus.CLOSED,
        closedAt: new Date(),
        executionId: null,
        lockedAt: null,
        lockedBy: null,
      },
    });
    return { closed: true };
  });
}

export async function restoreProductTranslationJob(jobId: string) {
  assertDatabase();
  const prisma = getPrisma();
  return prisma.$transaction(async (tx) => {
    const job = await tx.productTranslationJob.findUnique({ where: { id: jobId }, select: { status: true } });
    if (!job) throw new Error("翻译任务不存在。");
    if (job.status !== TranslationJobStatus.CLOSED) throw new Error("只有已关闭任务可以恢复。");
    const groups = await tx.productTranslationJobItem.groupBy({
      by: ["status"],
      where: { jobId },
      _count: { _all: true },
    });
    const count = (status: TranslationJobItemStatus) => groups.find((row) => row.status === status)?._count._all ?? 0;
    const pending = count(TranslationJobItemStatus.PENDING);
    const failed = count(TranslationJobItemStatus.FAILED);
    const status = deriveRestoredTranslationJobStatus({
      pending,
      running: count(TranslationJobItemStatus.RUNNING),
      completed: count(TranslationJobItemStatus.COMPLETED),
      failed,
      skipped: count(TranslationJobItemStatus.SKIPPED),
      cancelled: count(TranslationJobItemStatus.CANCELLED),
    } satisfies TranslationItemCounts);
    await tx.productTranslationJob.update({
      where: { id: jobId },
      data: { status, closedAt: null, executionId: null, lockedAt: null, lockedBy: null },
    });
    return { status };
  });
}

export async function deleteProductTranslationJob(jobId: string) {
  assertDatabase();
  const prisma = getPrisma();
  return prisma.$transaction(async (tx) => {
    const job = await tx.productTranslationJob.findUnique({ where: { id: jobId }, select: { status: true } });
    if (!job) throw new Error("翻译任务不存在。");
    const runningItems = await tx.productTranslationJobItem.count({
      where: { jobId, status: TranslationJobItemStatus.RUNNING },
    });
    if (!canDeleteTranslationJob(job.status, runningItems)) {
      throw new Error(job.status === TranslationJobStatus.RUNNING
        ? "执行中的任务不能删除，请先停止任务。"
        : "任务仍有正在执行的单项，暂时不能删除。");
    }
    const [logs, items] = await Promise.all([
      tx.productTranslationLog.count({ where: { jobId } }),
      tx.productTranslationJobItem.count({ where: { jobId } }),
    ]);
    await tx.productTranslationLog.deleteMany({ where: { jobId } });
    await tx.productTranslationJobItem.deleteMany({ where: { jobId } });
    await tx.productTranslationJob.delete({ where: { id: jobId } });
    return { deleted: true, logs, items };
  });
}
