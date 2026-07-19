import { cache } from "react";
import { ContentStatus, Locale as DatabaseLocale, TranslationStatus } from "@/generated/prisma/client";
import { normalizeArticleContent, type ArticleContent } from "@/lib/article-content";
import { normalizeArticleCoverImage } from "@/lib/article-cover";
import { localizeArticleCategory } from "@/lib/article-category";
import { resolveArticleLocale } from "@/lib/article-locale";
import { validateArticleSource } from "@/lib/article-publication";
import { databaseLocaleBySiteLocale, siteLocaleByDatabaseLocale } from "@/lib/database-locales";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import { locales, type Locale } from "@/lib/site";
import { withDataFallback } from "@/lib/server-data";

const publicArticleWhere = (categorySlug?: string) => ({
  status: ContentStatus.PUBLISHED,
  publishedAt: { not: null, lte: new Date() },
  category: { is: { isActive: true, ...(categorySlug ? { slug: categorySlug } : {}) } },
} as const);

type PublicTranslation = {
  locale: DatabaseLocale;
  title: string;
  excerpt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  readingMinutes: number;
  publishedAt: Date | null;
  content?: unknown;
};

const selectTranslation = (rows: PublicTranslation[], locale: Locale, requireContent: boolean) => {
  const validRows = rows.filter((row) => requireContent
    ? validateArticleSource(row).ok
    : Boolean(row.title.trim() && row.excerpt?.trim() && row.seoTitle?.trim() && row.seoDescription?.trim()));
  const available = validRows.map((item) => siteLocaleByDatabaseLocale[item.locale]).filter((item): item is Locale => Boolean(item));
  const resolved = resolveArticleLocale(available, locale);
  return resolved ? validRows.find((item) => item.locale === databaseLocaleBySiteLocale[resolved]) ?? null : null;
};

export type PublicArticleSummary = {
  id: string;
  slug: string;
  featured: boolean;
  coverImage: string | null;
  authorName: string | null;
  publishedAt: Date;
  updatedAt: Date;
  title: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  content: ArticleContent;
  readingMinutes: number;
  requestedLocale: Locale;
  resolvedLocale: Locale;
  hasExactTranslation: boolean;
  availableLocales: Locale[];
  category: {
    id: string;
    slug: string;
    name: string;
    description: string;
    seoTitle: string;
    seoDescription: string;
  };
};

const toPublicArticle = <T extends {
  id: string;
  slug: string;
  featured: boolean;
  coverImage: string | null;
  authorName: string | null;
  publishedAt: Date | null;
  updatedAt: Date;
  category: { id: string; slug: string; translations: Parameters<typeof localizeArticleCategory>[0] };
  translations: PublicTranslation[];
}>(article: T, locale: Locale, requireContent: boolean): PublicArticleSummary | null => {
  const selected = selectTranslation(article.translations, locale, requireContent);
  if (!selected || !article.publishedAt) return null;
  const resolvedLocale = siteLocaleByDatabaseLocale[selected.locale] ?? "en";
  const content = normalizeArticleContent(selected.content);
  return {
    id: article.id,
    slug: article.slug,
    featured: article.featured,
    coverImage: normalizeArticleCoverImage(article.coverImage),
    authorName: article.authorName,
    publishedAt: article.publishedAt,
    updatedAt: article.updatedAt,
    title: selected.title.trim() || article.slug,
    excerpt: selected.excerpt?.trim() || "",
    seoTitle: selected.seoTitle?.trim() || selected.title.trim() || article.slug,
    seoDescription: selected.seoDescription?.trim() || selected.excerpt?.trim() || "",
    content,
    readingMinutes: Math.max(1, selected.readingMinutes),
    requestedLocale: locale,
    resolvedLocale,
    hasExactTranslation: selected.locale === databaseLocaleBySiteLocale[locale],
    availableLocales: article.translations
      .map((translation) => siteLocaleByDatabaseLocale[translation.locale])
      .filter((value): value is Locale => Boolean(value)),
    category: {
      id: article.category.id,
      slug: article.category.slug,
      ...localizeArticleCategory(article.category.translations, locale, article.category.slug),
    },
  };
};

const publicArticleBaseSelect = {
  id: true,
  slug: true,
  featured: true,
  coverImage: true,
  authorName: true,
  publishedAt: true,
  updatedAt: true,
  category: {
    select: { id: true, slug: true, translations: { select: { locale: true, name: true, description: true, seoTitle: true, seoDescription: true } } },
  },
  translations: {
    where: { status: TranslationStatus.PUBLISHED, publishedAt: { not: null } },
    select: {
      locale: true,
      title: true,
      excerpt: true,
      seoTitle: true,
      seoDescription: true,
      readingMinutes: true,
      publishedAt: true,
    },
  },
} as const;

export const getPublishedArticles = cache(async (locale: Locale, categorySlug?: string) => {
  if (!isDatabaseConfigured()) return [];
  const rows = await withDataFallback("articles.public-list", () => getPrisma().article.findMany({
    where: publicArticleWhere(categorySlug),
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
    select: publicArticleBaseSelect,
  }), [], { locale, categorySlug });
  return rows.map((article) => toPublicArticle(article, locale, false)).filter((article): article is PublicArticleSummary => Boolean(article));
});

export const getPublishedArticleBySlug = cache(async (slug: string, locale: Locale) => {
  if (!isDatabaseConfigured()) return null;
  const article = await withDataFallback("articles.public-detail", () => getPrisma().article.findFirst({
    where: { ...publicArticleWhere(), slug },
    select: {
      ...publicArticleBaseSelect,
      translations: {
        ...publicArticleBaseSelect.translations,
        select: { ...publicArticleBaseSelect.translations.select, content: true },
      },
    },
  }), null, { slug, locale });
  return article ? toPublicArticle(article, locale, true) : null;
});

export type ArticleSitemapRecord = {
  slug: string;
  updatedAt: Date;
  publishedAt: Date;
  locales: Locale[];
  coverImage: string | null;
};

export async function getArticleSitemapRecords(): Promise<ArticleSitemapRecord[]> {
  if (!isDatabaseConfigured()) return [];
  const rows = await withDataFallback("articles.sitemap", () => getPrisma().article.findMany({
    where: publicArticleWhere(),
    select: {
      slug: true,
      updatedAt: true,
      publishedAt: true,
      coverImage: true,
      translations: {
        where: { status: TranslationStatus.PUBLISHED, publishedAt: { not: null } },
        select: { locale: true },
      },
    },
  }), []);
  return rows.flatMap((article) => article.publishedAt ? [{
    slug: article.slug,
    updatedAt: article.updatedAt,
    publishedAt: article.publishedAt,
    coverImage: normalizeArticleCoverImage(article.coverImage),
    locales: article.translations
      .map(({ locale }) => siteLocaleByDatabaseLocale[locale])
      .filter((locale): locale is Locale => locale !== undefined && locales.includes(locale)),
  }] : []);
}
