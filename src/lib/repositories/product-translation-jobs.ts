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
  productTranslationOutputSchema,
  productTranslationPromptVersion,
  SOURCE_LOCALE,
  TranslationBusinessError,
  TranslationQualityError,
  TranslationResponseValidationError,
  type ProductTranslationOutput,
} from "@/lib/product-translation-service";
import { normalizeTranslationResult, TranslationResponseParseError } from "@/lib/translation-response-parser";
import {
  canDeleteTranslationJob,
  deriveRestoredTranslationJobStatus,
  type TranslationItemCounts,
} from "@/lib/translation-job-state";
import { getTranslationJobExecutionStatus } from "@/lib/translation-execution-status";
import {
  getTranslationProviderState,
} from "@/lib/translation-providers/config";
import {
  TranslationProviderRequestError,
  type TranslationProviderId,
} from "@/lib/translation-providers/types";
import {
  isSpecificationValueTranslatable,
  TRANSLATION_QA_VERSION,
  validateProductTranslation,
  type TranslationQaDocument,
  type TranslationQaIssue,
  type TranslationQaResult,
} from "@/lib/translation/quality";
import {
  hasTranslationContentType,
  translationContentTypes,
  translationWorkerConfig,
  type TranslationContentType,
  type TranslationExecutionStatus,
  type TranslationProcessingStep,
} from "@/lib/translation-worker-config";
import { withDataFallback } from "@/lib/server-data";
import { logError } from "@/lib/observability";

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

export class TranslationJobValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TranslationJobValidationError";
  }
}

export type CreateTranslationJobInput = {
  actorEmail: string;
  provider: TranslationProviderId;
  sourceLocale: TranslationLocale;
  targetLocales: TranslationLocale[];
  scope: TranslationJobScope;
  kind?: ProductKind;
  productIds?: string[];
  productLimit: number;
  contentTypes?: TranslationContentType[];
};

const assertDatabase = () => {
  if (!isDatabaseConfigured()) throw new Error("DATABASE_URL 尚未配置，无法管理翻译任务。");
};

export const getTranslationServiceState = (provider?: string) => getTranslationProviderState(provider);

const emptyTranslationDashboard = () => ({
  totalProducts: 0,
  coverage: Object.fromEntries(translationLocales.map((locale) => [locale, { ready: 0, review: 0, missing: 0 }])) as Record<TranslationLocale, { ready: number; review: number; missing: number }>,
  jobs: [],
});

const executionStatusWhere = (status?: TranslationExecutionStatus): Prisma.ProductTranslationJobWhereInput | undefined => {
  switch (status) {
    case "PENDING": return { status: TranslationJobStatus.PENDING, startedAt: null };
    case "QUEUED": return { status: TranslationJobStatus.PENDING, startedAt: { not: null } };
    case "PROCESSING": return { status: TranslationJobStatus.RUNNING, items: { some: { status: { in: [TranslationJobItemStatus.RUNNING, TranslationJobItemStatus.TRANSLATED] } } } };
    case "RETRYING": return { OR: [
      { status: TranslationJobStatus.PAUSED },
      { status: TranslationJobStatus.RUNNING, items: { some: { status: TranslationJobItemStatus.PENDING, retryCount: { gt: 0 } } } },
    ] };
    case "SUCCESS": return { status: TranslationJobStatus.COMPLETED };
    case "FAILED": return { status: { in: [TranslationJobStatus.FAILED, TranslationJobStatus.PARTIAL_FAILED] } };
    case "CANCELLED": return { status: { in: [TranslationJobStatus.CANCELLED, TranslationJobStatus.CLOSED] } };
    default: return undefined;
  }
};

export async function getTranslationDashboard(status?: TranslationExecutionStatus) {
  if (!isDatabaseConfigured()) {
    return emptyTranslationDashboard();
  }

  const prisma = getPrisma();
  const result = await withDataFallback("translations.dashboard", () => Promise.all([
    prisma.product.count(),
    prisma.productTranslation.groupBy({
      by: ["locale", "status"],
      where: { locale: { in: [...translationLocales] } },
      _count: { _all: true },
    }),
    prisma.productTranslationJob.findMany({
      where: executionStatusWhere(status),
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
        qaPassedItems: true,
        qaWarningItems: true,
        qaFailedItems: true,
        needsReviewItems: true,
        promptTokens: true,
        completionTokens: true,
        totalTokens: true,
        lastError: true,
        startedAt: true,
        heartbeatAt: true,
        items: {
          where: { status: { in: [TranslationJobItemStatus.RUNNING, TranslationJobItemStatus.PENDING] } },
          orderBy: { updatedAt: "desc" },
          take: 1,
          select: { status: true, processingStep: true, retryCount: true, nextAttemptAt: true },
        },
        createdAt: true,
        completedAt: true,
        cancelledAt: true,
        closedAt: true,
        requestedBy: { select: { name: true, email: true } },
      },
    }),
  ]), null, { status });
  if (!result) return emptyTranslationDashboard();
  const [totalProducts, grouped, jobs] = result;

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
  return withDataFallback("translations.product-options", () => getPrisma().product.findMany({
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
  }), [], { query: contains });
}

export async function createProductTranslationJob(input: CreateTranslationJobInput) {
  assertDatabase();
  if (input.sourceLocale !== SOURCE_LOCALE) throw new TranslationJobValidationError("产品翻译任务必须以英文（EN）作为唯一源语言。");
  const service = getTranslationProviderState(input.provider);
  if (!service.configured || !service.provider || !service.model) {
    throw new Error(service.error || "翻译 Provider 配置无效。");
  }
  const targetLocales = Array.from(new Set(input.targetLocales)).filter((locale) => locale !== SOURCE_LOCALE);
  if (!targetLocales.length) throw new TranslationJobValidationError("请至少选择一种不同于源语言的目标语言。");
  const contentTypes = Array.from(new Set(input.contentTypes?.length ? input.contentTypes : translationContentTypes));
  const translatesMainRecord = contentTypes.some((type) => type === "PRODUCT" || type === "SEO");

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
          locale: SOURCE_LOCALE,
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
        where: { locale: { in: [SOURCE_LOCALE, ...targetLocales] } },
        select: { locale: true, status: true, title: true, summary: true, seoTitle: true, seoDescription: true },
      },
      media: { select: { assetId: true, alt: true, translations: { where: { locale: SOURCE_LOCALE }, select: { locale: true, alt: true } } } },
      features: { select: { id: true, translations: { where: { locale: SOURCE_LOCALE }, select: { locale: true, value: true } } } },
      specifications: { select: { id: true, translations: { where: { locale: SOURCE_LOCALE }, select: { locale: true, label: true } } } },
      applications: { select: { id: true, translations: { where: { locale: SOURCE_LOCALE }, select: { locale: true, title: true } } } },
      downloads: { select: { id: true, translations: { where: { locale: SOURCE_LOCALE }, select: { locale: true, title: true } } } },
    },
  });

  const missingEnglishSource = products.flatMap((product) => {
    const missing: string[] = [];
    const main = product.translations.find(({ locale }) => locale === SOURCE_LOCALE);
    const sourceTranslation = <T extends { locale: Locale }>(translations: T[]) =>
      translations.find(({ locale }) => locale === SOURCE_LOCALE);
    if (hasTranslationContentType(contentTypes, "SEO") && (!main?.seoTitle?.trim() || !main.seoDescription?.trim())) missing.push("SEO");
    if (hasTranslationContentType(contentTypes, "MEDIA_ALT") && product.media.some((row) => !(sourceTranslation(row.translations)?.alt ?? row.alt ?? "").trim())) missing.push("媒体 ALT");
    if (hasTranslationContentType(contentTypes, "FEATURE_TITLE") && product.features.some((row) => !sourceTranslation(row.translations)?.value.trim())) missing.push("卖点标题");
    if (hasTranslationContentType(contentTypes, "SPEC_LABEL") && product.specifications.some((row) => !sourceTranslation(row.translations)?.label.trim())) missing.push("参数名称");
    if (hasTranslationContentType(contentTypes, "APPLICATION_TITLE") && product.applications.some((row) => !sourceTranslation(row.translations)?.title.trim())) missing.push("应用场景标题");
    if (hasTranslationContentType(contentTypes, "DOWNLOAD_TITLE") && product.downloads.some((row) => !sourceTranslation(row.translations)?.title.trim())) missing.push("下载资料标题");
    return missing.length ? [`${product.sku}：${Array.from(new Set(missing)).join("、")}`] : [];
  });
  if (missingEnglishSource.length) {
    throw new TranslationJobValidationError(`以下产品缺少本次任务所需的英文源字段，已阻止创建任务：${missingEnglishSource.slice(0, 5).join("；")}${missingEnglishSource.length > 5 ? `；另有 ${missingEnglishSource.length - 5} 个产品` : ""}`);
  }

  const items = products.flatMap((product) => targetLocales.flatMap((targetLocale) => {
    const current = product.translations.find(({ locale }) => locale === targetLocale);
    // Structured rows have their own translation records. A published product title must
    // protect the main record without preventing a media/feature/spec translation job.
    if (translatesMainRecord && current?.status === TranslationStatus.PUBLISHED) return [];
    if (translatesMainRecord && input.scope === "MISSING" && current && current.status !== TranslationStatus.MISSING) return [];
    return [{
      productId: product.id,
      productSlug: product.slug,
      productSku: product.sku,
      targetLocale,
    }];
  }));
  if (!items.length) throw new TranslationJobValidationError("当前筛选范围内没有可创建的翻译任务；已发布译文不会被自动覆盖。");

  return prisma.productTranslationJob.create({
    data: {
      sourceLocale: SOURCE_LOCALE,
      targetLocales,
      provider: service.provider,
      model: service.model,
      contentTypes,
      totalItems: items.length,
      requestedById: actor.id,
      items: { create: items.map((item) => ({ ...item, sourceLocale: SOURCE_LOCALE, contentTypes })) },
    },
    select: { id: true, totalItems: true },
  });
}

export async function getProductTranslationJob(id: string) {
  if (!isDatabaseConfigured()) return null;
  return withDataFallback("translations.job-detail", () => getPrisma().productTranslationJob.findUnique({
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
      qaPassedItems: true,
      qaWarningItems: true,
      qaFailedItems: true,
      needsReviewItems: true,
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
      heartbeatAt: true,
      contentTypes: true,
      requestedBy: { select: { name: true, email: true } },
      items: {
        orderBy: [{ status: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          productId: true,
          productSlug: true,
          productSku: true,
          sourceLocale: true,
          targetLocale: true,
          status: true,
          warnings: true,
          qaStatus: true,
          qaIssues: true,
          qaErrorCount: true,
          qaWarningCount: true,
          qaAttemptCount: true,
          qaVersion: true,
          lastQaAt: true,
          savedAt: true,
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
          contentTypes: true,
          processingStep: true,
          heartbeatAt: true,
          nextAttemptAt: true,
          responseId: true,
          output: true,
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
              qaCodes: true,
              qaStatus: true,
              createdAt: true,
            },
          },
          product: {
            select: {
              translations: {
                where: { locale: { in: [...translationLocales] } },
                select: { locale: true, title: true, summary: true, seoTitle: true, seoDescription: true, status: true },
              },
              media: { select: { visible: true, translations: { select: { locale: true, alt: true, caption: true } } } },
              features: { select: { visible: true, translations: { select: { locale: true, value: true, description: true } } } },
              specifications: { select: { visible: true, value: true, unit: true, translations: { select: { locale: true, label: true, displayValue: true } } } },
              applications: { select: { visible: true, translations: { select: { locale: true, title: true, description: true, imageAlt: true } } } },
              downloads: { select: { visible: true, translations: { select: { locale: true, title: true, description: true } } } },
            },
          },
        },
      },
    },
  }), null, { id });
}

const saveGeneratedTranslation = async (
  productId: string,
  targetLocale: Locale,
  output: ProductTranslationOutput,
  contentTypes: readonly string[],
) => {
  const prisma = getPrisma();
  return prisma.$transaction(async (tx) => {
    const current = await tx.productTranslation.findUnique({
      where: { productId_locale: { productId, locale: targetLocale } },
      select: { status: true },
    });
    let wroteTranslation = false;
    const mainRecordPublished = current?.status === TranslationStatus.PUBLISHED;

    const translateProduct = hasTranslationContentType(contentTypes, "PRODUCT");
    const translateSeo = hasTranslationContentType(contentTypes, "SEO");
    if ((translateProduct || translateSeo) && !mainRecordPublished) {
      await tx.productTranslation.upsert({
        where: { productId_locale: { productId, locale: targetLocale } },
        update: {
          title: translateProduct ? output.product.title : undefined,
          summary: translateProduct ? output.product.summary : undefined,
          seoTitle: translateSeo ? output.product.seoTitle : undefined,
          seoDescription: translateSeo ? output.product.seoDescription : undefined,
          status: TranslationStatus.MACHINE_DRAFT,
          publishedAt: null,
        },
        create: {
          productId,
          locale: targetLocale,
          title: output.product.title,
          summary: output.product.summary,
          seoTitle: translateSeo ? output.product.seoTitle : "",
          seoDescription: translateSeo ? output.product.seoDescription : "",
          status: TranslationStatus.MACHINE_DRAFT,
        },
      });
      wroteTranslation = true;
    }

    const translateMediaAlt = hasTranslationContentType(contentTypes, "MEDIA_ALT");
    const translateMediaCaption = hasTranslationContentType(contentTypes, "MEDIA_CAPTION");
    for (const item of translateMediaAlt || translateMediaCaption ? output.media : []) {
      await tx.productMediaTranslation.upsert({
        where: { productId_assetId_locale: { productId, assetId: item.id, locale: targetLocale } },
        update: {
          alt: translateMediaAlt ? item.alt : undefined,
          caption: translateMediaCaption ? item.caption || null : undefined,
        },
        create: { productId, assetId: item.id, locale: targetLocale, alt: item.alt, caption: item.caption || null },
      });
      wroteTranslation = true;
    }
    const translateFeatureTitle = hasTranslationContentType(contentTypes, "FEATURE_TITLE");
    const translateFeatureDescription = hasTranslationContentType(contentTypes, "FEATURE_DESCRIPTION");
    for (const item of translateFeatureTitle || translateFeatureDescription ? output.features : []) {
      await tx.productFeatureTranslation.upsert({
        where: { featureId_locale: { featureId: item.id, locale: targetLocale } },
        update: {
          value: translateFeatureTitle ? item.title : undefined,
          description: translateFeatureDescription ? item.description || null : undefined,
        },
        create: { featureId: item.id, locale: targetLocale, value: item.title, description: item.description || null },
      });
      wroteTranslation = true;
    }
    const translateSpecLabel = hasTranslationContentType(contentTypes, "SPEC_LABEL");
    const translateSpecValue = hasTranslationContentType(contentTypes, "SPEC_VALUE");
    for (const item of translateSpecLabel || translateSpecValue ? output.specifications : []) {
      await tx.productSpecificationTranslation.upsert({
        where: { specificationId_locale: { specificationId: item.id, locale: targetLocale } },
        update: {
          group: translateSpecLabel ? item.group || null : undefined,
          label: translateSpecLabel ? item.label : undefined,
          displayValue: translateSpecValue ? item.displayValue || null : undefined,
        },
        create: { specificationId: item.id, locale: targetLocale, group: item.group || null, label: item.label, displayValue: item.displayValue || null },
      });
      wroteTranslation = true;
    }
    const translateApplicationTitle = hasTranslationContentType(contentTypes, "APPLICATION_TITLE");
    const translateApplicationDescription = hasTranslationContentType(contentTypes, "APPLICATION_DESCRIPTION");
    for (const item of translateApplicationTitle || translateApplicationDescription ? output.applications : []) {
      await tx.productApplicationTranslation.upsert({
        where: { applicationId_locale: { applicationId: item.id, locale: targetLocale } },
        update: {
          title: translateApplicationTitle ? item.title : undefined,
          description: translateApplicationDescription ? item.description || null : undefined,
        },
        create: { applicationId: item.id, locale: targetLocale, title: item.title, description: item.description || null, imageAlt: item.imageAlt || null },
      });
      wroteTranslation = true;
    }
    for (const item of hasTranslationContentType(contentTypes, "DOWNLOAD_TITLE") ? output.downloads : []) {
      await tx.productDownloadTranslation.upsert({
        where: { downloadId_locale: { downloadId: item.id, locale: targetLocale } },
        update: { title: item.title },
        create: { downloadId: item.id, locale: targetLocale, title: item.title, description: item.description || null },
      });
      wroteTranslation = true;
    }
    return { skipped: !wroteTranslation };
  });
};

const loadTranslationQaDocument = async (
  productId: string,
  locale: Locale,
  contentTypes: readonly string[],
): Promise<TranslationQaDocument | null> => {
  const sourceDocument = locale === SOURCE_LOCALE;
  const locales = sourceDocument ? [SOURCE_LOCALE] : [SOURCE_LOCALE, locale];
  const product = await getPrisma().product.findUnique({
    where: { id: productId },
    select: {
      translations: { where: { locale: { in: locales } } },
      media: {
        orderBy: { sortOrder: "asc" },
        select: { assetId: true, alt: true, caption: true, translations: { where: { locale: { in: locales } } } },
      },
      features: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, translations: { where: { locale: { in: locales } } } },
      },
      specifications: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, group: true, value: true, unit: true, translations: { where: { locale: { in: locales } } } },
      },
      applications: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, translations: { where: { locale: { in: locales } } } },
      },
      downloads: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, translations: { where: { locale: { in: locales } } } },
      },
    },
  });
  if (!product) return null;
  const main = product.translations.find((translation) => translation.locale === locale);
  const exact = <T extends { locale: Locale }>(rows: T[], target = locale) => rows.find((row) => row.locale === target);
  return {
    product: {
      title: hasTranslationContentType(contentTypes, "PRODUCT") ? main?.title ?? "" : "",
      summary: hasTranslationContentType(contentTypes, "PRODUCT") ? main?.summary ?? "" : "",
      seoTitle: hasTranslationContentType(contentTypes, "SEO") ? main?.seoTitle ?? "" : "",
      seoDescription: hasTranslationContentType(contentTypes, "SEO") ? main?.seoDescription ?? "" : "",
    },
    media: contentTypes.some((type) => type === "MEDIA_ALT" || type === "MEDIA_CAPTION")
      ? product.media.map((row) => {
          const translation = exact(row.translations);
          return {
            id: row.assetId,
            alt: translation?.alt ?? (sourceDocument ? row.alt ?? "" : ""),
            caption: translation?.caption ?? (sourceDocument ? row.caption ?? "" : ""),
          };
        })
      : [],
    features: contentTypes.some((type) => type === "FEATURE" || type === "FEATURE_TITLE" || type === "FEATURE_DESCRIPTION")
      ? product.features.map((row) => {
          const translation = exact(row.translations);
          return { id: row.id, title: translation?.value ?? "", description: translation?.description ?? "" };
        })
      : [],
    specifications: contentTypes.some((type) => type === "SPECIFICATION" || type === "SPEC_LABEL" || type === "SPEC_VALUE")
      ? product.specifications.map((row) => {
          const translation = exact(row.translations);
          const english = exact(row.translations, SOURCE_LOCALE);
          const sourceValue = english?.displayValue?.trim() || row.value;
          const translateValue = isSpecificationValueTranslatable(sourceValue, row.unit);
          return {
            id: row.id,
            group: translation?.group ?? (sourceDocument ? row.group ?? "" : ""),
            label: translation?.label ?? "",
            displayValue: translation?.displayValue?.trim() || (sourceDocument || !translateValue ? row.value : ""),
          };
        })
      : [],
    applications: contentTypes.some((type) => type === "APPLICATION" || type === "APPLICATION_TITLE" || type === "APPLICATION_DESCRIPTION")
      ? product.applications.map((row) => {
          const translation = exact(row.translations);
          return { id: row.id, title: translation?.title ?? "", description: translation?.description ?? "", imageAlt: translation?.imageAlt ?? "" };
        })
      : [],
    downloads: contentTypes.some((type) => type === "DOWNLOAD" || type === "DOWNLOAD_TITLE")
      ? product.downloads.map((row) => {
          const translation = exact(row.translations);
          return { id: row.id, title: translation?.title ?? "", description: translation?.description ?? "" };
        })
      : [],
  };
};

const loadTranslationQaSource = (productId: string, contentTypes: readonly string[]) =>
  loadTranslationQaDocument(productId, SOURCE_LOCALE, contentTypes);

const needsReviewQa = (field: string, message: string): TranslationQaResult => {
  const entry: TranslationQaIssue = { code: "LEGACY_QA_UNAVAILABLE", severity: "ERROR", field, message };
  return {
    status: "NEEDS_REVIEW",
    passed: false,
    retryable: false,
    issues: [entry],
    errors: [entry],
    warnings: [],
    retryInstructions: [],
  };
};

export async function revalidateProductTranslationJobItem(jobId: string, itemId: string) {
  assertDatabase();
  const prisma = getPrisma();
  const item = await prisma.productTranslationJobItem.findFirst({
    where: { id: itemId, jobId },
    select: {
      id: true,
      jobId: true,
      productId: true,
      targetLocale: true,
      status: true,
      output: true,
      contentTypes: true,
      attemptCount: true,
      completedAt: true,
      savedAt: true,
      job: { select: { provider: true, model: true } },
    },
  });
  if (!item) throw new Error("翻译任务项不存在。");
  if (item.status === TranslationJobItemStatus.RUNNING || item.status === TranslationJobItemStatus.TRANSLATED) throw new Error("执行中的项目不能重新质检。");

  const startedAt = new Date();
  const source = await loadTranslationQaSource(item.productId, item.contentTypes);
  const shouldReadSavedTranslation = Boolean(item.savedAt) || item.status === TranslationJobItemStatus.COMPLETED;
  const savedTarget = shouldReadSavedTranslation
    ? await loadTranslationQaDocument(item.productId, item.targetLocale, item.contentTypes)
    : null;
  const parsedSnapshot = !shouldReadSavedTranslation && item.output
    ? productTranslationOutputSchema.safeParse(normalizeTranslationResult(item.output))
    : null;
  const qa: TranslationQaResult = !source
    ? needsReviewQa("product", "产品已不存在，无法重建英文源内容进行质检。")
    : shouldReadSavedTranslation && savedTarget
      ? validateProductTranslation({ source, target: savedTarget, targetLocale: item.targetLocale, contentTypes: item.contentTypes })
      : !parsedSnapshot
        ? needsReviewQa("output", "旧版任务没有保存可重新质检的结构化输出，需要人工审核或重新翻译。")
        : !parsedSnapshot.success
          ? needsReviewQa("output", `旧版输出结构不兼容新版 QA：${parsedSnapshot.error.message}`)
          : validateProductTranslation({ source, target: parsedSnapshot.data, targetLocale: item.targetLocale, contentTypes: item.contentTypes });
  const finishedAt = new Date();
  const status = qa.status === "QA_PASSED"
    ? TranslationJobItemStatus.QA_PASSED
    : qa.status === "QA_WARNING"
      ? TranslationJobItemStatus.QA_WARNING
      : qa.status === "NEEDS_REVIEW"
        ? TranslationJobItemStatus.NEEDS_REVIEW
        : TranslationJobItemStatus.QA_FAILED;

  await prisma.$transaction([
    prisma.productTranslationJobItem.update({
      where: { id: item.id },
      data: {
        status,
        qaStatus: qa.status,
        qaIssues: qa.issues as Prisma.InputJsonValue,
        qaErrorCount: qa.errors.length,
        qaWarningCount: qa.warnings.length,
        qaAttemptCount: { increment: 1 },
        qaVersion: TRANSLATION_QA_VERSION,
        lastQaAt: finishedAt,
        savedAt: item.savedAt ?? (item.status === TranslationJobItemStatus.COMPLETED ? item.completedAt : null),
        processingStep: qa.passed ? "DONE" : "FAILED",
        errorType: qa.passed ? null : "QA_VALIDATION",
        errorMessage: qa.passed ? null : qa.errors.map((entry) => entry.message).join(" ").slice(0, 1_200),
      },
    }),
    prisma.productTranslationLog.create({
      data: {
        jobId,
        itemId: item.id,
        provider: item.job.provider,
        model: item.job.model,
        targetLocale: item.targetLocale,
        promptVersion: `${productTranslationPromptVersion}:revalidate`,
        attemptNumber: item.attemptCount,
        errorType: qa.passed ? null : "QA_VALIDATION",
        errorMessage: qa.passed ? null : qa.errors.map((entry) => entry.message).join(" ").slice(0, 1_200),
        requestStartedAt: startedAt,
        requestFinishedAt: finishedAt,
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        qaCodes: qa.issues.map((entry) => entry.code),
        qaStatus: qa.status,
      },
    }),
  ]);
  await refreshProductTranslationJobSummary(jobId);
  return qa;
}

export async function revalidateProductTranslationJob(jobId: string) {
  assertDatabase();
  const items = await getPrisma().productTranslationJobItem.findMany({
    where: { jobId, status: { notIn: [TranslationJobItemStatus.RUNNING, TranslationJobItemStatus.TRANSLATED, TranslationJobItemStatus.PENDING] } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!items.length) throw new Error("任务没有可重新质检的项目。");
  const results = [];
  for (const item of items) results.push(await revalidateProductTranslationJobItem(jobId, item.id));
  return {
    count: results.length,
    passed: results.filter((result) => result.status === "QA_PASSED").length,
    warning: results.filter((result) => result.status === "QA_WARNING").length,
    failed: results.filter((result) => result.status === "QA_FAILED").length,
    needsReview: results.filter((result) => result.status === "NEEDS_REVIEW").length,
  };
}

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

type TranslationFailure = {
  errorType: string;
  errorMessage: string;
  retryable: boolean;
  rawResponse: string | null;
  responseId: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  qa: TranslationQaResult | null;
  output: ProductTranslationOutput | null;
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
      qa: error.errorType === "QA_VALIDATION" ? {
        status: "QA_FAILED",
        passed: false,
        retryable: true,
        issues: [{ code: "PLACEHOLDER_VALIDATION_FAILED", severity: "ERROR", field: "provider", message }],
        errors: [{ code: "PLACEHOLDER_VALIDATION_FAILED", severity: "ERROR", field: "provider", message }],
        warnings: [],
        retryInstructions: [message],
      } : null,
      output: null,
    };
  }
  if (error instanceof TranslationQualityError) {
    return {
      errorType: error.errorType,
      errorMessage: message,
      retryable: error.retryable,
      rawResponse: limitRawResponse(error.rawResponse),
      responseId: error.responseId,
      promptTokens: error.promptTokens,
      completionTokens: error.completionTokens,
      totalTokens: error.totalTokens,
      qa: error.qa,
      output: error.output,
    };
  }
  if (error instanceof TranslationResponseParseError || error instanceof TranslationResponseValidationError) {
    const qaIssue: TranslationQaIssue = {
      code: "RESPONSE_FORMAT_INVALID",
      severity: "ERROR",
      field: "response",
      message,
    };
    return {
      errorType: error.errorType,
      errorMessage: message,
      retryable: true,
      rawResponse: limitRawResponse(error.rawResponse),
      responseId: error.responseId,
      promptTokens: error.promptTokens,
      completionTokens: error.completionTokens,
      totalTokens: error.totalTokens,
      qa: {
        status: "QA_FAILED",
        passed: false,
        retryable: true,
        issues: [qaIssue],
        errors: [qaIssue],
        warnings: [],
        retryInstructions: [message],
      },
      output: null,
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
      qa: null,
      output: null,
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
    qa: null,
    output: null,
  };
};

export async function refreshProductTranslationJobSummary(jobId: string) {
  const prisma = getPrisma();
  const [job, aggregates, retryingItems] = await Promise.all([
    prisma.productTranslationJob.findUnique({ where: { id: jobId }, select: { status: true } }),
    prisma.productTranslationJobItem.groupBy({
      by: ["status"],
      where: { jobId },
      _count: { _all: true },
      _sum: { promptTokens: true, completionTokens: true, totalTokens: true },
    }),
    prisma.productTranslationJobItem.count({
      where: { jobId, status: TranslationJobItemStatus.PENDING, retryCount: { gt: 0 } },
    }),
  ]);
  if (!job) throw new Error("翻译任务不存在。");

  const count = (status: TranslationJobItemStatus) => aggregates.find((row) => row.status === status)?._count._all ?? 0;
  const legacyCompletedItems = count(TranslationJobItemStatus.COMPLETED);
  const qaPassedItems = count(TranslationJobItemStatus.QA_PASSED);
  const qaWarningItems = count(TranslationJobItemStatus.QA_WARNING);
  const qaFailedItems = count(TranslationJobItemStatus.QA_FAILED);
  const needsReviewItems = count(TranslationJobItemStatus.NEEDS_REVIEW);
  const completedItems = legacyCompletedItems + qaPassedItems + qaWarningItems;
  const failedItems = count(TranslationJobItemStatus.FAILED);
  const skippedItems = count(TranslationJobItemStatus.SKIPPED);
  const cancelledItems = count(TranslationJobItemStatus.CANCELLED);
  const pendingItems = count(TranslationJobItemStatus.PENDING);
  const runningItems = count(TranslationJobItemStatus.RUNNING) + count(TranslationJobItemStatus.TRANSLATED);
  const remaining = pendingItems + runningItems;
  const successfulItems = completedItems + skippedItems;
  const unsuccessfulItems = failedItems + qaFailedItems + needsReviewItems + cancelledItems;
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

  const updated = await prisma.productTranslationJob.update({
    where: { id: jobId },
    data: {
      status,
      completedItems,
      failedItems,
      skippedItems,
      cancelledItems,
      qaPassedItems,
      qaWarningItems,
      qaFailedItems,
      needsReviewItems,
      promptTokens: sum("promptTokens"),
      completionTokens: sum("completionTokens"),
      totalTokens: sum("totalTokens"),
      completedAt: terminal ? new Date() : preserveStatus ? undefined : null,
      executionId: status === TranslationJobStatus.RUNNING ? undefined : null,
      lockedAt: status === TranslationJobStatus.RUNNING ? undefined : null,
      lockedBy: status === TranslationJobStatus.RUNNING ? undefined : null,
      heartbeatAt: status === TranslationJobStatus.RUNNING ? undefined : null,
    },
    select: {
      id: true,
      status: true,
      totalItems: true,
      completedItems: true,
      failedItems: true,
      skippedItems: true,
      cancelledItems: true,
      qaPassedItems: true,
      qaWarningItems: true,
      qaFailedItems: true,
      needsReviewItems: true,
      promptTokens: true,
      completionTokens: true,
      totalTokens: true,
      startedAt: true,
    },
  });
  return {
    ...updated,
    pendingItems,
    runningItems,
    retryingItems,
    executionStatus: getTranslationJobExecutionStatus({
      status: updated.status,
      startedAt: updated.startedAt,
      runningItems,
      retryingItems,
    }),
  };
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
    const service = getTranslationProviderState(job.provider, job.model);
    if (!service.configured) throw new Error(service.error || "该任务的翻译 Provider 尚未配置完整。");

    const runningItems = await tx.productTranslationJobItem.count({
      where: { jobId, status: { in: [TranslationJobItemStatus.RUNNING, TranslationJobItemStatus.TRANSLATED] } },
    });
    if (runningItems) throw new Error("任务仍有正在处理的项目，请等待完成或先停止任务。");

    // “继续执行未完成任务” is intentionally server-side: a forged form or
    // stale page cannot omit failed/timeout items from the resumed batch.
    await tx.productTranslationJobItem.updateMany({
      where: {
        jobId,
        OR: [
          { status: { in: [TranslationJobItemStatus.FAILED, TranslationJobItemStatus.QA_FAILED, TranslationJobItemStatus.NEEDS_REVIEW] } },
          { errorType: "TIMEOUT", status: { notIn: [TranslationJobItemStatus.COMPLETED, TranslationJobItemStatus.QA_PASSED, TranslationJobItemStatus.QA_WARNING, TranslationJobItemStatus.SKIPPED] } },
        ],
      },
      data: {
        status: TranslationJobItemStatus.PENDING,
        processingStep: "QUEUED",
        errorType: null,
        errorMessage: null,
        startedAt: null,
        completedAt: null,
        retryCount: 0,
        currentRunAttemptCount: 0,
        qaStatus: null,
        nextAttemptAt: null,
        heartbeatAt: null,
        workerId: null,
      },
    });
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
        heartbeatAt: new Date(),
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

export async function getOrStartProductTranslationJobExecution(jobId: string, actorEmail: string) {
  assertDatabase();
  const findActive = () => getPrisma().productTranslationJob.findFirst({
    where: { id: jobId, status: TranslationJobStatus.RUNNING, executionId: { not: null } },
    select: { executionId: true },
  });
  const active = await findActive();
  if (active?.executionId) return { executionId: active.executionId };
  try {
    return await startProductTranslationJobExecution(jobId, actorEmail);
  } catch (error) {
    // A scheduled worker and an administrator may race to start the same job.
    // Reuse the winning execution instead of reporting a false failure.
    const raced = await findActive();
    if (raced?.executionId) return { executionId: raced.executionId };
    throw error;
  }
}

const executionIsActive = async (jobId: string, executionId: string) => {
  const job = await getPrisma().productTranslationJob.findFirst({
    where: { id: jobId, status: TranslationJobStatus.RUNNING, executionId },
    select: { id: true },
  });
  return Boolean(job);
};

const dueItemWhere = (now: Date): Prisma.ProductTranslationJobItemWhereInput => ({
  status: TranslationJobItemStatus.PENDING,
  OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
});

const updateTranslationItemStep = async (
  jobId: string,
  itemId: string,
  executionId: string,
  workerId: string,
  step: TranslationProcessingStep,
) => {
  const now = new Date();
  const activeStatuses = [TranslationJobItemStatus.RUNNING, TranslationJobItemStatus.TRANSLATED];
  await Promise.all([
    getPrisma().productTranslationJobItem.updateMany({
      where: { id: itemId, jobId, status: { in: activeStatuses }, workerId },
      data: {
        status: step === "QUALITY_CHECK" ? TranslationJobItemStatus.TRANSLATED : undefined,
        processingStep: step,
        heartbeatAt: now,
      },
    }),
    getPrisma().productTranslationJob.updateMany({
      where: { id: jobId, status: TranslationJobStatus.RUNNING, executionId },
      data: { heartbeatAt: now, lockedAt: now },
    }),
  ]);
};

const startTranslationItemHeartbeat = (
  jobId: string,
  itemId: string,
  executionId: string,
  workerId: string,
) => {
  const beat = () => {
    const now = new Date();
    return Promise.all([
      getPrisma().productTranslationJobItem.updateMany({
        where: { id: itemId, jobId, status: { in: [TranslationJobItemStatus.RUNNING, TranslationJobItemStatus.TRANSLATED] }, workerId },
        data: { heartbeatAt: now },
      }),
      getPrisma().productTranslationJob.updateMany({
        where: { id: jobId, status: TranslationJobStatus.RUNNING, executionId },
        data: { heartbeatAt: now, lockedAt: now },
      }),
    ]).catch((error) => logError("Translation heartbeat failed", { operation: "translation.heartbeat", jobId, itemId, executionId, workerId }, error));
  };
  const timer = setInterval(() => void beat(), translationWorkerConfig.heartbeatIntervalMs);
  return () => clearInterval(timer);
};

export async function processNextProductTranslationJobItem(jobId: string, executionId: string) {
  assertDatabase();
  const prisma = getPrisma();
  const jobConfig = await prisma.productTranslationJob.findFirst({
    where: { id: jobId, status: TranslationJobStatus.RUNNING, executionId },
    select: { provider: true, model: true },
  });
  if (!jobConfig) throw new Error("任务未运行、已停止，或执行凭证已失效。");
  const service = getTranslationProviderState(jobConfig.provider, jobConfig.model);
  if (!service.configured) {
    await prisma.productTranslationJob.updateMany({
      where: { id: jobId, status: TranslationJobStatus.RUNNING, executionId },
      data: { status: TranslationJobStatus.PAUSED, executionId: null, lockedAt: null, lockedBy: null, heartbeatAt: null },
    });
    throw new Error(service.error || "该任务的翻译 Provider 尚未配置完整，任务已暂停。");
  }
  const item = await prisma.$transaction(async (tx) => {
    const job = await tx.productTranslationJob.findFirst({
      where: { id: jobId, status: TranslationJobStatus.RUNNING, executionId },
      select: { sourceLocale: true, provider: true, model: true },
    });
    if (!job) throw new Error("任务已停止，Worker 不再领取新项目。");

    const now = new Date();
    const candidate = await tx.productTranslationJobItem.findFirst({
      where: { jobId, ...dueItemWhere(now) },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        productId: true,
        productSlug: true,
        sourceLocale: true,
        targetLocale: true,
        retryCount: true,
        contentTypes: true,
        errorMessage: true,
        qaIssues: true,
      },
    });
    if (!candidate) return null;
    const workerId = randomUUID();
    const claimed = await tx.productTranslationJobItem.updateMany({
      where: { id: candidate.id, jobId, ...dueItemWhere(now) },
      data: {
        status: TranslationJobItemStatus.RUNNING,
        processingStep: "GET_CONTENT",
        workerId,
        heartbeatAt: now,
        nextAttemptAt: null,
        startedAt: now,
        completedAt: null,
        errorType: null,
        errorMessage: null,
        qaStatus: null,
      },
    });
    if (!claimed.count) return null;
    await tx.productTranslationJob.update({
      where: { id: jobId },
      data: { lockedAt: now, heartbeatAt: now, lastError: null },
    });
    return { ...candidate, workerId, sourceLocale: candidate.sourceLocale ?? job.sourceLocale, provider: job.provider, model: job.model };
  });

  if (!item) {
    const next = await prisma.productTranslationJobItem.findFirst({
      where: { jobId, status: TranslationJobItemStatus.PENDING, nextAttemptAt: { not: null } },
      orderBy: { nextAttemptAt: "asc" },
      select: { nextAttemptAt: true },
    });
    return {
      processed: false,
      executionId,
      nextRunAt: next?.nextAttemptAt?.toISOString() ?? null,
      job: await refreshProductTranslationJobSummary(jobId),
    };
  }

  if (!await executionIsActive(jobId, executionId)) {
    const message = "任务已停止，当前项目不再执行。";
    await prisma.productTranslationJobItem.updateMany({
      where: { id: item.id, status: TranslationJobItemStatus.RUNNING, workerId: item.workerId },
      data: { status: TranslationJobItemStatus.CANCELLED, processingStep: "CANCELLED", workerId: null, errorType: "CANCELLED", errorMessage: message, completedAt: new Date() },
    });
    return { processed: true, executionId, itemId: item.id, error: message, job: await refreshProductTranslationJobSummary(jobId) };
  }

  const attempt = await prisma.productTranslationJobItem.update({
    where: { id: item.id },
    data: {
      attemptCount: { increment: 1 },
      currentRunAttemptCount: { increment: 1 },
      errorType: null,
      errorMessage: null,
    },
    select: { attemptCount: true },
  });
  const requestStartedAt = new Date();
  const stopHeartbeat = startTranslationItemHeartbeat(jobId, item.id, executionId, item.workerId);

  try {
    const previousQaIssues = Array.isArray(item.qaIssues)
      ? item.qaIssues.flatMap((entry) => {
          if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
          const row = entry as Record<string, unknown>;
          return row.severity === "ERROR" && typeof row.message === "string"
            ? [`${typeof row.field === "string" ? `${row.field}: ` : ""}${row.message}`]
            : [];
        })
      : [];
    const retryFeedback = previousQaIssues.length
      ? previousQaIssues
      : item.errorMessage ? [item.errorMessage] : undefined;
    const generated = await generateProductTranslation(
      item.productId,
      item.sourceLocale,
      item.targetLocale,
      { provider: item.provider, model: item.model, contentTypes: item.contentTypes, retryFeedback },
      (step) => updateTranslationItemStep(jobId, item.id, executionId, item.workerId, step),
    );
    await updateTranslationItemStep(jobId, item.id, executionId, item.workerId, "SAVE_RESULT");
    const saved = await saveGeneratedTranslation(item.productId, item.targetLocale, generated.output, item.contentTypes);
    const requestFinishedAt = new Date();
    const durationMs = requestFinishedAt.getTime() - requestStartedAt.getTime();
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
          qaCodes: generated.qa.issues.map((entry) => entry.code),
          qaStatus: generated.qa.status,
        },
      }),
      prisma.productTranslationJobItem.update({
        where: { id: item.id },
        data: {
          status: saved.skipped
            ? TranslationJobItemStatus.SKIPPED
            : generated.qa.status === "QA_WARNING"
              ? TranslationJobItemStatus.QA_WARNING
              : TranslationJobItemStatus.QA_PASSED,
          processingStep: "DONE",
          workerId: null,
          heartbeatAt: requestFinishedAt,
          nextAttemptAt: null,
          inputHash: generated.inputHash,
          responseId: generated.responseId,
          output: generated.output as Prisma.InputJsonValue,
          warnings: generated.warnings as Prisma.InputJsonValue,
          qaStatus: generated.qa.status,
          qaIssues: generated.qa.issues as Prisma.InputJsonValue,
          qaErrorCount: generated.qa.errors.length,
          qaWarningCount: generated.qa.warnings.length,
          qaAttemptCount: { increment: 1 },
          qaVersion: generated.qaVersion,
          lastQaAt: requestFinishedAt,
          savedAt: saved.skipped ? null : requestFinishedAt,
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
    const canRetry = failure.retryable
      && item.retryCount < translationWorkerConfig.maxRetries
      && await executionIsActive(jobId, executionId);
    const retryDelayMs = canRetry ? translationWorkerConfig.retryDelaysMs.at(item.retryCount) : null;
    const nextAttemptAt = retryDelayMs === null || retryDelayMs === undefined
      ? null
      : new Date(requestFinishedAt.getTime() + retryDelayMs);
    const terminalFailureStatus = failure.qa
      ? failure.retryable ? TranslationJobItemStatus.QA_FAILED : TranslationJobItemStatus.NEEDS_REVIEW
      : TranslationJobItemStatus.FAILED;

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
          qaCodes: failure.qa?.issues.map((entry) => entry.code) ?? [],
          qaStatus: failure.qa?.status ?? null,
        },
      }),
      prisma.productTranslationJobItem.update({
        where: { id: item.id },
        data: {
          status: canRetry ? TranslationJobItemStatus.PENDING : terminalFailureStatus,
          processingStep: canRetry ? "RETRY_WAIT" : "FAILED",
          workerId: null,
          heartbeatAt: requestFinishedAt,
          nextAttemptAt,
          retryCount: canRetry ? { increment: 1 } : undefined,
          responseId: failure.responseId,
          output: failure.output ? failure.output as Prisma.InputJsonValue : undefined,
          qaStatus: failure.qa?.status,
          qaIssues: failure.qa ? failure.qa.issues as Prisma.InputJsonValue : undefined,
          qaErrorCount: failure.qa?.errors.length ?? 0,
          qaWarningCount: failure.qa?.warnings.length ?? 0,
          qaAttemptCount: failure.qa ? { increment: 1 } : undefined,
          qaVersion: failure.qa ? TRANSLATION_QA_VERSION : undefined,
          lastQaAt: failure.qa ? requestFinishedAt : undefined,
          savedAt: null,
          errorType: failure.errorType,
          errorMessage: failure.errorMessage,
          rawResponse: failure.rawResponse,
          promptTokens: failure.promptTokens,
          completionTokens: failure.completionTokens,
          totalTokens: failure.totalTokens,
          durationMs,
          completedAt: canRetry ? null : requestFinishedAt,
        },
      }),
      prisma.productTranslationJob.update({
        where: { id: jobId },
        data: { lastError: failure.errorMessage, lockedAt: requestFinishedAt, heartbeatAt: requestFinishedAt },
      }),
    ]);
    return {
      processed: true,
      executionId,
      itemId: item.id,
      productSlug: item.productSlug,
      targetLocale: item.targetLocale,
      error: failure.errorMessage,
      retrying: canRetry,
      nextRunAt: nextAttemptAt?.toISOString() ?? null,
      job: await refreshProductTranslationJobSummary(jobId),
    };
  } finally {
    stopHeartbeat();
  }
}

export async function recoverStaleProductTranslationWorkers(now = new Date()) {
  assertDatabase();
  const prisma = getPrisma();
  const cutoff = new Date(now.getTime() - translationWorkerConfig.staleWorkerMs);
  const staleJobs = await prisma.productTranslationJob.findMany({
    where: {
      status: TranslationJobStatus.RUNNING,
      OR: [
        { heartbeatAt: { lt: cutoff } },
        { heartbeatAt: null, lockedAt: { lt: cutoff } },
        { heartbeatAt: null, lockedAt: null, updatedAt: { lt: cutoff } },
      ],
    },
    select: { id: true },
    take: 20,
  });

  let recoveredItems = 0;
  for (const job of staleJobs) {
    await prisma.$transaction(async (tx) => {
      const items = await tx.productTranslationJobItem.findMany({
        where: { jobId: job.id, status: { in: [TranslationJobItemStatus.RUNNING, TranslationJobItemStatus.TRANSLATED] } },
        select: { id: true, retryCount: true },
      });
      for (const item of items) {
        const canRetry = item.retryCount < translationWorkerConfig.maxRetries;
        await tx.productTranslationJobItem.update({
          where: { id: item.id },
          data: {
            status: canRetry ? TranslationJobItemStatus.PENDING : TranslationJobItemStatus.FAILED,
            processingStep: canRetry ? "QUEUED" : "FAILED",
            workerId: null,
            heartbeatAt: now,
            nextAttemptAt: canRetry ? now : null,
            retryCount: canRetry ? { increment: 1 } : undefined,
            errorType: "TIMEOUT",
            errorMessage: "Worker 心跳超过 5 分钟未更新，已自动释放锁并重新排队。",
            completedAt: canRetry ? null : now,
          },
        });
        recoveredItems += 1;
      }
      await tx.productTranslationJob.updateMany({
        where: { id: job.id, status: TranslationJobStatus.RUNNING },
        data: {
          status: TranslationJobStatus.PENDING,
          executionId: null,
          lockedAt: null,
          lockedBy: null,
          heartbeatAt: null,
          lastError: "Worker 心跳超时，任务已自动恢复队列。",
        },
      });
    });
    await refreshProductTranslationJobSummary(job.id);
  }
  return { recoveredJobs: staleJobs.length, recoveredItems };
}

export async function runNextProductTranslationWorkerPass() {
  assertDatabase();
  const prisma = getPrisma();
  const recovery = await recoverStaleProductTranslationWorkers();
  const now = new Date();
  const running = await prisma.productTranslationJob.findFirst({
    where: {
      status: TranslationJobStatus.RUNNING,
      executionId: { not: null },
      items: { some: dueItemWhere(now) },
    },
    orderBy: { updatedAt: "asc" },
    select: { id: true, executionId: true },
  });
  if (running?.executionId) {
    return { recovery, jobId: running.id, result: await processNextProductTranslationJobItem(running.id, running.executionId) };
  }

  const queued = await prisma.productTranslationJob.findFirst({
    where: {
      status: TranslationJobStatus.PENDING,
      items: { some: dueItemWhere(now) },
    },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!queued) return { recovery, jobId: null, result: null };
  const execution = await getOrStartProductTranslationJobExecution(queued.id, "translation-worker");
  return { recovery, jobId: queued.id, result: await processNextProductTranslationJobItem(queued.id, execution.executionId) };
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
      where: {
        jobId,
        status: { in: [TranslationJobItemStatus.FAILED, TranslationJobItemStatus.QA_FAILED, TranslationJobItemStatus.NEEDS_REVIEW] },
      },
      data: {
        status: TranslationJobItemStatus.PENDING,
        processingStep: "QUEUED",
        workerId: null,
        heartbeatAt: null,
        nextAttemptAt: null,
        errorType: null,
        errorMessage: null,
        startedAt: null,
        completedAt: null,
        retryCount: 0,
        currentRunAttemptCount: 0,
        qaStatus: null,
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
          heartbeatAt: null,
        },
      });
    }
    return result;
  });
}

export async function retryProductTranslationJobItem(jobId: string, itemId: string) {
  assertDatabase();
  const prisma = getPrisma();
  return prisma.$transaction(async (tx) => {
    const job = await tx.productTranslationJob.findUnique({ where: { id: jobId }, select: { status: true } });
    if (!job) throw new Error("翻译任务不存在。");
    if (job.status === TranslationJobStatus.RUNNING) throw new Error("执行中的任务不能重新排队，请先停止任务。");
    if (job.status === TranslationJobStatus.CLOSED) throw new Error("已关闭任务不能重新排队，请先恢复任务。");
    const result = await tx.productTranslationJobItem.updateMany({
      where: {
        id: itemId,
        jobId,
        status: { in: [TranslationJobItemStatus.FAILED, TranslationJobItemStatus.QA_FAILED, TranslationJobItemStatus.NEEDS_REVIEW] },
      },
      data: {
        status: TranslationJobItemStatus.PENDING,
        processingStep: "QUEUED",
        workerId: null,
        heartbeatAt: null,
        nextAttemptAt: null,
        errorType: null,
        errorMessage: null,
        startedAt: null,
        completedAt: null,
        retryCount: 0,
        currentRunAttemptCount: 0,
        qaStatus: null,
        durationMs: null,
      },
    });
    if (!result.count) throw new Error("只有执行失败、质检失败或需人工审核的项目可以重新翻译。");
    await tx.productTranslationJob.update({
      where: { id: jobId },
      data: {
        status: TranslationJobStatus.PENDING,
        completedAt: null,
        lastError: null,
        executionId: null,
        lockedAt: null,
        lockedBy: null,
        heartbeatAt: null,
      },
    });
    return { count: result.count };
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
      heartbeatAt: null,
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
      where: { jobId, status: { in: [TranslationJobItemStatus.RUNNING, TranslationJobItemStatus.TRANSLATED] } },
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
        heartbeatAt: null,
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
      qaPassed: count(TranslationJobItemStatus.QA_PASSED),
      qaWarning: count(TranslationJobItemStatus.QA_WARNING),
      qaFailed: count(TranslationJobItemStatus.QA_FAILED),
      needsReview: count(TranslationJobItemStatus.NEEDS_REVIEW),
      failed,
      skipped: count(TranslationJobItemStatus.SKIPPED),
      cancelled: count(TranslationJobItemStatus.CANCELLED),
    } satisfies TranslationItemCounts);
    await tx.productTranslationJob.update({
      where: { id: jobId },
      data: { status, closedAt: null, executionId: null, lockedAt: null, lockedBy: null, heartbeatAt: null },
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
      where: { jobId, status: { in: [TranslationJobItemStatus.RUNNING, TranslationJobItemStatus.TRANSLATED] } },
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
