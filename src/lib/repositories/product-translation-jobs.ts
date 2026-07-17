import "server-only";

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
  type ProductTranslationOutput,
} from "@/lib/product-translation-service";
import {
  getTranslationProviderState,
  getTranslationProviderStates,
} from "@/lib/translation-providers/config";
import type { TranslationProviderId } from "@/lib/translation-providers/types";

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

export async function getTranslationDashboard() {
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
      orderBy: { createdAt: "desc" },
      take: 12,
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
        inputTokens: true,
        outputTokens: true,
        lastError: true,
        createdAt: true,
        completedAt: true,
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
      inputTokens: true,
      outputTokens: true,
      lastError: true,
      createdAt: true,
      startedAt: true,
      completedAt: true,
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
          error: true,
          inputTokens: true,
          outputTokens: true,
          attempts: true,
          responseId: true,
          startedAt: true,
          completedAt: true,
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

async function refreshJobSummary(jobId: string) {
  const prisma = getPrisma();
  const aggregates = await prisma.productTranslationJobItem.groupBy({
    by: ["status"],
    where: { jobId },
    _count: { _all: true },
    _sum: { inputTokens: true, outputTokens: true },
  });
  const count = (status: TranslationJobItemStatus) => aggregates.find((row) => row.status === status)?._count._all ?? 0;
  const completedItems = count(TranslationJobItemStatus.COMPLETED);
  const failedItems = count(TranslationJobItemStatus.FAILED);
  const skippedItems = count(TranslationJobItemStatus.SKIPPED);
  const remaining = count(TranslationJobItemStatus.QUEUED) + count(TranslationJobItemStatus.RUNNING);
  const finished = remaining === 0;
  const status = !finished
    ? TranslationJobStatus.RUNNING
    : failedItems && completedItems + skippedItems
      ? TranslationJobStatus.PARTIAL
      : failedItems
        ? TranslationJobStatus.FAILED
        : TranslationJobStatus.COMPLETED;
  const inputTokens = aggregates.reduce((sum, row) => sum + (row._sum.inputTokens ?? 0), 0);
  const outputTokens = aggregates.reduce((sum, row) => sum + (row._sum.outputTokens ?? 0), 0);
  return prisma.productTranslationJob.update({
    where: { id: jobId },
    data: {
      status,
      completedItems,
      failedItems,
      skippedItems,
      inputTokens,
      outputTokens,
      completedAt: finished ? new Date() : null,
    },
    select: { id: true, status: true, totalItems: true, completedItems: true, failedItems: true, skippedItems: true },
  });
}

export async function processNextProductTranslationJobItem(jobId: string) {
  assertDatabase();
  const prisma = getPrisma();
  const jobConfig = await prisma.productTranslationJob.findUnique({
    where: { id: jobId },
    select: { provider: true, model: true },
  });
  if (!jobConfig) throw new Error("翻译任务不存在。");
  const service = getTranslationProviderState(jobConfig.provider);
  if (!service.configured) throw new Error(service.error || "该任务的翻译 Provider 尚未配置完整，任务已保留但不能执行。");
  if (service.model !== jobConfig.model) {
    throw new Error(`任务使用 ${jobConfig.provider} / ${jobConfig.model}，该 Provider 当前模型为 ${service.model}；请恢复模型配置或新建任务。`);
  }

  await prisma.productTranslationJobItem.updateMany({
    where: {
      jobId,
      status: TranslationJobItemStatus.RUNNING,
      updatedAt: { lt: new Date(Date.now() - 5 * 60 * 1000) },
    },
    data: { status: TranslationJobItemStatus.QUEUED, error: "上次执行中断，已自动重新排队。" },
  });

  const item = await prisma.$transaction(async (tx) => {
    const job = await tx.productTranslationJob.findUnique({
      where: { id: jobId },
      select: { id: true, status: true, sourceLocale: true, provider: true, model: true },
    });
    if (!job) throw new Error("翻译任务不存在。");
    if (job.status === TranslationJobStatus.CANCELLED) throw new Error("翻译任务已取消。");

    const candidate = await tx.productTranslationJobItem.findFirst({
      where: { jobId, status: TranslationJobItemStatus.QUEUED },
      orderBy: { createdAt: "asc" },
      select: { id: true, productId: true, productSlug: true, targetLocale: true },
    });
    if (!candidate) return null;
    const claimed = await tx.productTranslationJobItem.updateMany({
      where: { id: candidate.id, status: TranslationJobItemStatus.QUEUED },
      data: { status: TranslationJobItemStatus.RUNNING, startedAt: new Date(), error: null, attempts: { increment: 1 } },
    });
    if (!claimed.count) return null;
    await tx.productTranslationJob.update({
      where: { id: jobId },
      data: {
        status: TranslationJobStatus.RUNNING,
        startedAt: job.status === TranslationJobStatus.QUEUED ? new Date() : undefined,
        completedAt: null,
        lastError: null,
      },
    });
    return { ...candidate, sourceLocale: job.sourceLocale, provider: job.provider, model: job.model };
  });

  if (!item) return { processed: false, job: await refreshJobSummary(jobId) };

  try {
    const generated = await generateProductTranslation(
      item.productId,
      item.sourceLocale,
      item.targetLocale,
      { provider: item.provider, model: item.model },
    );
    const saved = await saveGeneratedTranslation(item.productId, item.targetLocale, generated.output);
    await prisma.productTranslationJobItem.update({
      where: { id: item.id },
      data: {
        status: saved.skipped ? TranslationJobItemStatus.SKIPPED : TranslationJobItemStatus.COMPLETED,
        inputHash: generated.inputHash,
        responseId: generated.responseId,
        output: generated.output as Prisma.InputJsonValue,
        warnings: generated.warnings as Prisma.InputJsonValue,
        inputTokens: generated.inputTokens,
        outputTokens: generated.outputTokens,
        error: null,
        completedAt: new Date(),
      },
    });
    return { processed: true, itemId: item.id, productSlug: item.productSlug, targetLocale: item.targetLocale, job: await refreshJobSummary(jobId) };
  } catch (error) {
    const message = (error instanceof Error ? error.message : "翻译执行失败。 ").slice(0, 1200);
    await prisma.$transaction([
      prisma.productTranslationJobItem.update({
        where: { id: item.id },
        data: { status: TranslationJobItemStatus.FAILED, error: message, completedAt: new Date() },
      }),
      prisma.productTranslationJob.update({ where: { id: jobId }, data: { lastError: message } }),
    ]);
    return { processed: true, itemId: item.id, productSlug: item.productSlug, targetLocale: item.targetLocale, error: message, job: await refreshJobSummary(jobId) };
  }
}

export async function retryFailedProductTranslationJobItems(jobId: string) {
  assertDatabase();
  const prisma = getPrisma();
  const result = await prisma.productTranslationJobItem.updateMany({
    where: { jobId, status: TranslationJobItemStatus.FAILED },
    data: { status: TranslationJobItemStatus.QUEUED, error: null, startedAt: null, completedAt: null },
  });
  if (result.count) {
    await prisma.productTranslationJob.update({
      where: { id: jobId },
      data: { status: TranslationJobStatus.QUEUED, failedItems: 0, completedAt: null, lastError: null },
    });
  }
  return result;
}
