import "server-only";

import { ContentStatus, Locale, TranslationStatus } from "@/generated/prisma/client";
import { articleTranslationLocales, getArticleWorkerMonitor } from "@/lib/repositories/article-translation-jobs";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import { withDataFallback } from "@/lib/server-data";

export type AdminArticleFilters = {
  query?: string;
  status?: ContentStatus;
};

const emptyDashboard = async () => ({
  source: "sample" as const,
  total: 0,
  published: 0,
  drafts: 0,
  missingEnglish: 0,
  rows: [],
  worker: await getArticleWorkerMonitor(),
});

export async function getAdminArticleDashboard(filters: AdminArticleFilters = {}) {
  if (!isDatabaseConfigured()) return emptyDashboard();
  const query = filters.query?.trim();
  const prisma = getPrisma();
  const [result, worker] = await Promise.all([withDataFallback("admin-articles.dashboard", () => Promise.all([
    prisma.article.count(),
    prisma.article.count({ where: { status: ContentStatus.PUBLISHED } }),
    prisma.article.count({ where: { status: ContentStatus.DRAFT } }),
    prisma.article.findMany({
      where: {
        ...(filters.status ? { status: filters.status } : {}),
        ...(query ? { OR: [
          { slug: { contains: query, mode: "insensitive" } },
          { translations: { some: { title: { contains: query, mode: "insensitive" } } } },
        ] } : {}),
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 100,
      select: {
        id: true, slug: true, kind: true, status: true, featured: true, coverImage: true,
        publishedAt: true, updatedAt: true,
        translations: { select: { locale: true, status: true, title: true } },
      },
    }),
  ]), null, filters), getArticleWorkerMonitor()]);
  if (!result) return emptyDashboard();
  const [total, published, drafts, rows] = result;
  const normalizedRows = rows.map((article) => {
    const english = article.translations.find((translation) => translation.locale === Locale.EN);
    const translatedLocales = new Set(article.translations.filter((translation) => translation.status !== TranslationStatus.MISSING).map((translation) => translation.locale));
    const publishedLocales = new Set(article.translations.filter((translation) => translation.status === TranslationStatus.PUBLISHED).map((translation) => translation.locale));
    return {
      ...article,
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
    total,
    published,
    drafts,
    missingEnglish: normalizedRows.filter((article) => !article.hasEnglishContent).length,
    rows: normalizedRows,
    worker,
  };
}

export async function getAdminArticle(id: string, selectedLocale: Locale = Locale.EN) {
  if (!isDatabaseConfigured()) return null;
  return withDataFallback("admin-articles.detail", async () => {
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
  }, null, { id, selectedLocale });
}
