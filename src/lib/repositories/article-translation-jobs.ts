import "server-only";

import { randomUUID } from "node:crypto";
import {
  Locale,
  TranslationJobItemStatus,
  TranslationJobStatus,
  TranslationStatus,
} from "@/generated/prisma/client";
import { ArticleTranslationError, generateArticleTranslation } from "@/lib/article-translation-service";
import { articleReadingMinutes } from "@/lib/article-content";
import { validateArticleSource } from "@/lib/article-publication";
import { deriveArticleTranslationJobStatus, shouldRetryArticleTranslation } from "@/lib/article-worker-state";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import { getTranslationProviderState } from "@/lib/translation-providers/config";
import { TranslationProviderRequestError, type TranslationProviderId } from "@/lib/translation-providers/types";
import { logError, logWarn } from "@/lib/observability";
import { withDataFallback } from "@/lib/server-data";
import { TranslationResponseParseError } from "@/lib/translation-response-parser";

export const articleTranslationLocales = [
  Locale.EN, Locale.DE, Locale.FR, Locale.ES, Locale.RU, Locale.JA, Locale.IT, Locale.AR, Locale.ZH,
] as const;
export type ArticleTranslationLocale = (typeof articleTranslationLocales)[number];

const staleWorkerMs = 5 * 60 * 1000;
const maxAttempts = 3;

export class ArticleTranslationJobValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ArticleTranslationJobValidationError";
  }
}

const assertDatabase = () => {
  if (!isDatabaseConfigured()) throw new ArticleTranslationJobValidationError("DATABASE_URL 尚未配置，无法创建文章翻译任务。");
};

export async function createArticleTranslationJob(input: {
  articleId: string;
  actorEmail: string;
  provider: TranslationProviderId;
  targetLocales: ArticleTranslationLocale[];
}) {
  assertDatabase();
  const targets = Array.from(new Set(input.targetLocales)).filter((locale) => locale !== Locale.EN);
  if (!targets.length) throw new ArticleTranslationJobValidationError("请至少选择一种非英语目标语言。");
  const state = getTranslationProviderState(input.provider);
  if (!state.configured || !state.provider || !state.model) {
    throw new ArticleTranslationJobValidationError(state.error || "翻译 Provider 尚未配置完整。");
  }
  const provider = state.provider;
  const model = state.model;

  const prisma = getPrisma();
  return prisma.$transaction(async (transaction) => {
    await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${input.articleId}))`;
    const [article, actor, activeItems] = await Promise.all([
    transaction.article.findUnique({
      where: { id: input.articleId },
      select: {
        id: true,
        translations: {
          where: { locale: { in: [Locale.EN, ...targets] } },
          select: { locale: true, status: true, title: true, excerpt: true, content: true, seoTitle: true, seoDescription: true },
        },
      },
    }),
    transaction.adminUser.findUnique({ where: { email: input.actorEmail }, select: { id: true } }),
    transaction.articleTranslationJobItem.findMany({
      where: {
        targetLocale: { in: targets },
        status: { in: [TranslationJobItemStatus.PENDING, TranslationJobItemStatus.RUNNING] },
        job: { articleId: input.articleId, status: { in: [TranslationJobStatus.PENDING, TranslationJobStatus.RUNNING, TranslationJobStatus.PAUSED] } },
      },
      select: { targetLocale: true },
    }),
    ]);
    if (!article) throw new ArticleTranslationJobValidationError("文章不存在或已经删除。");
    const english = article.translations.find((translation) => translation.locale === Locale.EN);
    const validation = validateArticleSource(english);
    if (!english || !validation.ok) {
      throw new ArticleTranslationJobValidationError(`英文源内容不完整：${validation.missingFields.join("、") || "英文内容未创建"}`);
    }
    const activeLocales = new Set(activeItems.map((item) => item.targetLocale));
    const pendingTargets = targets.filter((locale) =>
      article.translations.find((translation) => translation.locale === locale)?.status !== TranslationStatus.PUBLISHED
      && !activeLocales.has(locale),
    );
    if (!pendingTargets.length) throw new ArticleTranslationJobValidationError("所选语言已发布或已在翻译队列中，未创建重复任务。");

    return transaction.articleTranslationJob.create({
      data: {
        articleId: article.id,
        sourceLocale: Locale.EN,
        targetLocales: pendingTargets,
        provider,
        model,
        totalItems: pendingTargets.length,
        requestedById: actor?.id,
        items: { create: pendingTargets.map((targetLocale) => ({ targetLocale })) },
      },
      select: { id: true, totalItems: true },
    });
  });
}

async function refreshArticleTranslationJob(jobId: string) {
  const prisma = getPrisma();
  const grouped = await prisma.articleTranslationJobItem.groupBy({
    by: ["status"],
    where: { jobId },
    _count: { _all: true },
    _sum: { promptTokens: true, completionTokens: true, totalTokens: true },
  });
  const count = (status: TranslationJobItemStatus) => grouped.find((row) => row.status === status)?._count._all ?? 0;
  const completed = count(TranslationJobItemStatus.COMPLETED) + count(TranslationJobItemStatus.SKIPPED);
  const failed = count(TranslationJobItemStatus.FAILED);
  const active = count(TranslationJobItemStatus.PENDING) + count(TranslationJobItemStatus.RUNNING);
  const status = deriveArticleTranslationJobStatus({
    pending: count(TranslationJobItemStatus.PENDING),
    running: count(TranslationJobItemStatus.RUNNING),
    completed,
    failed,
  });
  const sum = (field: "promptTokens" | "completionTokens" | "totalTokens") =>
    grouped.reduce((total, row) => total + (row._sum[field] ?? 0), 0);
  return prisma.articleTranslationJob.update({
    where: { id: jobId },
    data: {
      status,
      completedItems: completed,
      failedItems: failed,
      promptTokens: sum("promptTokens"),
      completionTokens: sum("completionTokens"),
      totalTokens: sum("totalTokens"),
      heartbeatAt: new Date(),
      completedAt: active === 0 ? new Date() : null,
      ...(status === TranslationJobStatus.COMPLETED ? { lastError: null } : {}),
      ...(active === 0 ? { lockedAt: null, lockedBy: null } : {}),
    },
  });
}

async function recoverStaleArticleTranslationItems(now = new Date()) {
  const staleBefore = new Date(now.getTime() - staleWorkerMs);
  const prisma = getPrisma();
  const staleItems = await prisma.articleTranslationJobItem.findMany({
    where: { status: TranslationJobItemStatus.RUNNING, heartbeatAt: { lt: staleBefore } },
    select: { jobId: true },
  });
  const recovered = await prisma.articleTranslationJobItem.updateMany({
    where: { status: TranslationJobItemStatus.RUNNING, heartbeatAt: { lt: staleBefore }, attemptCount: { lt: maxAttempts } },
    data: {
      status: TranslationJobItemStatus.PENDING,
      nextAttemptAt: now,
      workerId: null,
      errorType: "STALE_WORKER_RECOVERED",
      errorMessage: "Worker 心跳超时，任务已自动恢复到待处理队列。",
    },
  });
  const failed = await prisma.articleTranslationJobItem.updateMany({
    where: { status: TranslationJobItemStatus.RUNNING, heartbeatAt: { lt: staleBefore }, attemptCount: { gte: maxAttempts } },
    data: {
      status: TranslationJobItemStatus.FAILED,
      workerId: null,
      errorType: "STALE_WORKER_EXHAUSTED",
      errorMessage: "Worker 心跳超时且已达到最大尝试次数。",
      completedAt: now,
    },
  });
  await Promise.all(Array.from(new Set(staleItems.map((item) => item.jobId))).map(refreshArticleTranslationJob));
  if (recovered.count || failed.count) logWarn("Recovered stale article translation items", { operation: "article-translation.worker-recover", recovered: recovered.count, failed: failed.count });
  return recovered.count + failed.count;
}

async function claimNextArticleTranslationItem(now = new Date()) {
  const prisma = getPrisma();
  const workerId = randomUUID();
  const candidate = await prisma.articleTranslationJobItem.findFirst({
    where: {
      status: TranslationJobItemStatus.PENDING,
      OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
      job: {
        status: { in: [TranslationJobStatus.PENDING, TranslationJobStatus.RUNNING] },
        items: { none: { status: TranslationJobItemStatus.RUNNING } },
      },
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, jobId: true },
  });
  if (!candidate) return null;
  const claimed = await prisma.articleTranslationJobItem.updateMany({
    where: { id: candidate.id, status: TranslationJobItemStatus.PENDING },
    data: {
      status: TranslationJobItemStatus.RUNNING,
      workerId,
      heartbeatAt: now,
      startedAt: now,
      nextAttemptAt: null,
      attemptCount: { increment: 1 },
    },
  });
  if (!claimed.count) return null;
  await prisma.articleTranslationJob.updateMany({
    where: { id: candidate.jobId, startedAt: null },
    data: { startedAt: now, executionId: randomUUID() },
  });
  await prisma.articleTranslationJob.update({
    where: { id: candidate.jobId },
    data: {
      status: TranslationJobStatus.RUNNING,
      heartbeatAt: now,
      lockedAt: now,
      lockedBy: workerId,
    },
  });
  return prisma.articleTranslationJobItem.findUnique({
    where: { id: candidate.id },
    include: { job: { select: { id: true, articleId: true, sourceLocale: true, provider: true, model: true } } },
  });
}

export async function runNextArticleTranslationWorkerPass() {
  assertDatabase();
  await recoverStaleArticleTranslationItems();
  const item = await claimNextArticleTranslationItem();
  if (!item) return { processed: false, reason: "EMPTY_QUEUE" as const };
  const prisma = getPrisma();
  try {
    const generated = await generateArticleTranslation({
      articleId: item.job.articleId,
      sourceLocale: item.job.sourceLocale,
      targetLocale: item.targetLocale,
      provider: item.job.provider,
      model: item.job.model,
    });
    const saveStatus = await prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw`SELECT "id" FROM "ArticleTranslation" WHERE "id" = ${generated.sourceTranslationId} FOR SHARE`;
      const currentSource = await transaction.articleTranslation.findUnique({
        where: { id: generated.sourceTranslationId },
        select: { updatedAt: true },
      });
      if (!currentSource || currentSource.updatedAt.getTime() !== generated.sourceUpdatedAt.getTime()) {
        throw new ArticleTranslationError("英文源内容在翻译期间发生变化，已放弃旧译文并重新排队。", "SOURCE_CHANGED");
      }
      await transaction.$queryRaw`SELECT "id" FROM "ArticleTranslation" WHERE "articleId" = ${item.job.articleId} AND "locale" = ${item.targetLocale}::"Locale" FOR UPDATE`;
      const currentTarget = await transaction.articleTranslation.findUnique({
        where: { articleId_locale: { articleId: item.job.articleId, locale: item.targetLocale } },
        select: { status: true },
      });
      if (currentTarget?.status === TranslationStatus.PUBLISHED) {
        await transaction.articleTranslationJobItem.update({
          where: { id: item.id },
          data: {
            status: TranslationJobItemStatus.SKIPPED,
            inputHash: generated.inputHash,
            responseId: generated.responseId,
            warnings: ["目标语言已由运营人员发布，Worker 未覆盖现有内容。"],
            rawResponse: generated.rawResponse,
            promptTokens: generated.promptTokens,
            completionTokens: generated.completionTokens,
            totalTokens: generated.totalTokens,
            heartbeatAt: new Date(),
            completedAt: new Date(),
          },
        });
        return "SKIPPED" as const;
      }
      await transaction.articleTranslation.upsert({
        where: { articleId_locale: { articleId: item.job.articleId, locale: item.targetLocale } },
        update: {
          title: generated.output.title,
          excerpt: generated.output.excerpt,
          content: generated.output.content,
          seoTitle: generated.output.seoTitle,
          seoDescription: generated.output.seoDescription,
          readingMinutes: articleReadingMinutes(generated.output.content),
          status: TranslationStatus.NEEDS_REVIEW,
          publishedAt: null,
        },
        create: {
          articleId: item.job.articleId,
          locale: item.targetLocale,
          title: generated.output.title,
          excerpt: generated.output.excerpt,
          content: generated.output.content,
          seoTitle: generated.output.seoTitle,
          seoDescription: generated.output.seoDescription,
          readingMinutes: articleReadingMinutes(generated.output.content),
          status: TranslationStatus.NEEDS_REVIEW,
        },
      });
      await transaction.articleTranslationJobItem.update({
        where: { id: item.id },
        data: {
          status: TranslationJobItemStatus.COMPLETED,
          inputHash: generated.inputHash,
          responseId: generated.responseId,
          output: generated.output,
          warnings: generated.warnings,
          rawResponse: generated.rawResponse,
          promptTokens: generated.promptTokens,
          completionTokens: generated.completionTokens,
          totalTokens: generated.totalTokens,
          errorType: null,
          errorMessage: null,
          heartbeatAt: new Date(),
          completedAt: new Date(),
        },
      });
      return "COMPLETED" as const;
    });
    await refreshArticleTranslationJob(item.jobId);
    return { processed: true, itemId: item.id, jobId: item.jobId, status: saveStatus };
  } catch (error) {
    const retryable = error instanceof TranslationProviderRequestError
      ? error.retryable
      : error instanceof ArticleTranslationError && ["INVALID_MODEL_OUTPUT", "SOURCE_CHANGED"].includes(error.code);
    const canRetry = shouldRetryArticleTranslation(retryable, item.attemptCount, maxAttempts);
    const message = error instanceof Error ? error.message : "文章翻译失败。";
    const errorType = error instanceof TranslationProviderRequestError
      ? error.errorType
      : error instanceof ArticleTranslationError
        ? error.code
        : "UNKNOWN";
    const rawResponse = error instanceof TranslationResponseParseError
      ? error.rawResponse
      : error instanceof ArticleTranslationError
        ? error.rawResponse
        : null;
    await prisma.articleTranslationJobItem.update({
      where: { id: item.id },
      data: canRetry ? {
        status: TranslationJobItemStatus.PENDING,
        errorType,
        errorMessage: message,
        nextAttemptAt: new Date(Date.now() + 30_000 * 2 ** Math.max(0, item.attemptCount - 1)),
        workerId: null,
        heartbeatAt: new Date(),
        ...(rawResponse ? { rawResponse } : {}),
      } : {
        status: TranslationJobItemStatus.FAILED,
        errorType,
        errorMessage: message,
        completedAt: new Date(),
        heartbeatAt: new Date(),
        ...(rawResponse ? { rawResponse } : {}),
      },
    });
    await prisma.articleTranslationJob.update({ where: { id: item.jobId }, data: { lastError: message, heartbeatAt: new Date() } });
    await refreshArticleTranslationJob(item.jobId);
    logError("Article translation worker item failed", { operation: "article-translation.worker", jobId: item.jobId, itemId: item.id, retryable: canRetry }, error);
    return { processed: true, itemId: item.id, jobId: item.jobId, status: canRetry ? "RETRYING" as const : "FAILED" as const };
  }
}

export async function getArticleWorkerMonitor() {
  if (!isDatabaseConfigured()) return {
    pendingItems: 0, runningItems: 0, failedItems: 0, staleItems: 0, lastHeartbeatAt: null, jobs: [],
  };
  const prisma = getPrisma();
  const staleBefore = new Date(Date.now() - staleWorkerMs);
  const failedSince = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return withDataFallback("article-translation.worker-monitor", async () => {
    const [pendingItems, runningItems, failedItems, staleItems, latestHeartbeat, jobs] = await Promise.all([
    prisma.articleTranslationJobItem.count({ where: { status: TranslationJobItemStatus.PENDING } }),
    prisma.articleTranslationJobItem.count({ where: { status: TranslationJobItemStatus.RUNNING } }),
    prisma.articleTranslationJobItem.count({ where: { status: TranslationJobItemStatus.FAILED, updatedAt: { gte: failedSince } } }),
    prisma.articleTranslationJobItem.count({ where: { status: TranslationJobItemStatus.RUNNING, heartbeatAt: { lt: staleBefore } } }),
    prisma.articleTranslationJob.findFirst({ where: { heartbeatAt: { not: null } }, orderBy: { heartbeatAt: "desc" }, select: { heartbeatAt: true } }),
    prisma.articleTranslationJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true, status: true, provider: true, model: true, totalItems: true, completedItems: true, failedItems: true,
        lastError: true, heartbeatAt: true, createdAt: true,
        article: { select: { id: true, slug: true, translations: { where: { locale: Locale.EN }, select: { title: true } } } },
      },
    }),
    ]);
    return { pendingItems, runningItems, failedItems, staleItems, lastHeartbeatAt: latestHeartbeat?.heartbeatAt ?? null, jobs };
  }, { pendingItems: 0, runningItems: 0, failedItems: 0, staleItems: 0, lastHeartbeatAt: null, jobs: [] });
}
