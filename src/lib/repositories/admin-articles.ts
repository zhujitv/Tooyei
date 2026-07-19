import "server-only";

import { ContentStatus, Locale, TranslationStatus } from "@/generated/prisma/client";
import { getRequestDatabaseHealth } from "@/lib/database-health";
import { classifyDatabaseError, databaseHealthResult, type DatabaseHealthResult } from "@/lib/database-health-status";
import { logError } from "@/lib/observability";
import { articleTranslationLocales, getArticleWorkerMonitor } from "@/lib/repositories/article-translation-jobs";
import { getPrisma } from "@/lib/db";

export type AdminArticleFilters = {
  query?: string;
  status?: ContentStatus;
  categoryId?: string;
};

const emptyWorker = (database: DatabaseHealthResult) => ({
  available: false,
  status: database.status,
  pendingItems: 0,
  runningItems: 0,
  failedItems: 0,
  staleItems: 0,
  lastHeartbeatAt: null,
  jobs: [],
});

const emptyDashboard = (database: DatabaseHealthResult) => ({
  source: "unavailable" as const,
  database,
  total: 0,
  published: 0,
  drafts: 0,
  missingEnglish: 0,
  rows: [],
  worker: emptyWorker(database),
});

export async function getAdminArticleDashboard(filters: AdminArticleFilters = {}) {
  const database = await getRequestDatabaseHealth();
  if (!database.connected) return emptyDashboard(database);
  const query = filters.query?.trim();
  const prisma = getPrisma();
  let result;
  let worker;
  try {
    [result, worker] = await Promise.all([Promise.all([
      prisma.article.count(),
      prisma.article.count({ where: { status: ContentStatus.PUBLISHED } }),
      prisma.article.count({ where: { status: ContentStatus.DRAFT } }),
      prisma.article.findMany({
        where: {
          ...(filters.status ? { status: filters.status } : {}),
          ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
          ...(query ? { OR: [
            { slug: { contains: query, mode: "insensitive" } },
            { translations: { some: { title: { contains: query, mode: "insensitive" } } } },
          ] } : {}),
        },
        orderBy: [{ updatedAt: "desc" }],
        take: 100,
        select: {
          id: true, slug: true, kind: true, categoryId: true, status: true, featured: true, coverImage: true,
          publishedAt: true, updatedAt: true,
          category: { select: { slug: true, isActive: true, translations: { where: { locale: { in: [Locale.ZH, Locale.EN] } }, select: { locale: true, name: true } } } },
          translations: { select: { locale: true, status: true, title: true } },
        },
      }),
    ]), getArticleWorkerMonitor()]);
  } catch (error) {
    const status = classifyDatabaseError(error);
    logError("Admin article dashboard could not be loaded", { operation: "admin-articles.dashboard", ...filters, status }, error);
    return emptyDashboard(databaseHealthResult(status));
  }
  const [total, published, drafts, rows] = result;
  const normalizedRows = rows.map((article) => {
    const english = article.translations.find((translation) => translation.locale === Locale.EN);
    const translatedLocales = new Set(article.translations.filter((translation) => translation.status !== TranslationStatus.MISSING).map((translation) => translation.locale));
    const publishedLocales = new Set(article.translations.filter((translation) => translation.status === TranslationStatus.PUBLISHED).map((translation) => translation.locale));
    return {
      ...article,
      categoryDisplayName: article.category.translations.find((translation) => translation.locale === Locale.ZH)?.name?.trim()
        || article.category.translations.find((translation) => translation.locale === Locale.EN)?.name?.trim()
        || article.category.slug,
      displayTitle: english?.title?.trim() || article.translations.find((translation) => translation.locale === Locale.ZH)?.title?.trim() || article.slug,
      hasEnglishContent: Boolean(english),
      translatedCount: articleTranslationLocales.filter((locale) => translatedLocales.has(locale)).length,
      publishedLocaleCount: articleTranslationLocales.filter((locale) => publishedLocales.has(locale)).length,
      localeStatuses: Object.fromEntries(articleTranslationLocales.map((locale) => [
        locale,
        article.translations.find((translation) => translation.locale === locale)?.status ?? TranslationStatus.MISSING,
      ])) as Record<(typeof articleTranslationLocales)[number], TranslationStatus>,
    };
  });
  return {
    source: "database" as const,
    database,
    total,
    published,
    drafts,
    missingEnglish: normalizedRows.filter((article) => !article.hasEnglishContent).length,
    rows: normalizedRows,
    worker,
  };
}

export async function getAdminArticle(id: string, selectedLocale: Locale = Locale.EN) {
  const prisma = getPrisma();
  const [article, fullTranslations] = await Promise.all([
    prisma.article.findUnique({
        where: { id },
        include: {
          coverAsset: {
            select: {
              id: true, url: true, pathname: true, originalFilename: true, mimeType: true, sizeBytes: true,
              width: true, height: true, assetType: true, storageProvider: true, uploadedAt: true, createdAt: true,
            },
          },
          category: { include: { translations: true } },
          translations: {
            orderBy: { locale: "asc" },
            select: { id: true, locale: true, status: true, title: true, publishedAt: true, updatedAt: true },
          },
          translationJobs: {
            orderBy: { createdAt: "desc" },
            take: 10,
            select: {
              id: true, status: true, provider: true, model: true, totalItems: true, completedItems: true,
              failedItems: true, lastError: true, createdAt: true, heartbeatAt: true,
            },
          },
        },
    }),
    prisma.articleTranslation.findMany({
      where: { articleId: id, locale: { in: Array.from(new Set([Locale.EN, selectedLocale])) } },
    }),
  ]);
  if (!article) return null;
  return {
    ...article,
    selectedTranslation: fullTranslations.find((translation) => translation.locale === selectedLocale) ?? null,
    englishTranslation: fullTranslations.find((translation) => translation.locale === Locale.EN) ?? null,
  };
}
