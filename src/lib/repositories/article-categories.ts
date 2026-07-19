import "server-only";

import { cache } from "react";
import { Locale as DatabaseLocale, TranslationStatus, type Prisma } from "@/generated/prisma/client";
import { localizeArticleCategory, type ArticleCategoryTranslationRecord } from "@/lib/article-category";
import { databaseLocaleBySiteLocale, siteLocaleByDatabaseLocale } from "@/lib/database-locales";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import { contentLocales, type ContentLocale, type Locale } from "@/lib/site";
import { withDataFallback } from "@/lib/server-data";

export type ArticleCategoryTranslationFields = {
  name: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
};

export type ArticleCategoryMutationInput = {
  slug: string;
  isActive: boolean;
  sortOrder: number;
  translations: Record<ContentLocale, ArticleCategoryTranslationFields>;
};

export type AdminArticleCategory = {
  id: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  articleCount: number;
  translations: Record<ContentLocale, ArticleCategoryTranslationFields>;
  translationComplete: Record<ContentLocale, boolean>;
  createdAt: string;
  updatedAt: string;
};

export type PublicArticleCategory = {
  id: string;
  slug: string;
  name: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  sortOrder: number;
  articleCount: number;
};

type TranslationRecord = ArticleCategoryTranslationRecord;

const emptyTranslation = (): ArticleCategoryTranslationFields => ({
  name: "",
  description: "",
  seoTitle: "",
  seoDescription: "",
});

const adminTranslations = (translations: TranslationRecord[]) => {
  const result = Object.fromEntries(contentLocales.map((locale) => [locale, emptyTranslation()])) as Record<
    ContentLocale,
    ArticleCategoryTranslationFields
  >;
  for (const translation of translations) {
    const locale = siteLocaleByDatabaseLocale[translation.locale];
    if (!locale) continue;
    result[locale] = {
      name: translation.name,
      description: translation.description ?? "",
      seoTitle: translation.seoTitle ?? "",
      seoDescription: translation.seoDescription ?? "",
    };
  }
  return result;
};

const publicArticleWhere = () => ({
  status: "PUBLISHED" as const,
  publishedAt: { not: null, lte: new Date() },
});

export const getPublicArticleCategories = cache(async (locale: Locale): Promise<PublicArticleCategory[]> => {
  if (!isDatabaseConfigured()) return [];
  const records = await withDataFallback("article-categories.public.list", () => getPrisma().articleCategory.findMany({
    where: { isActive: true },
    include: {
      translations: true,
      _count: { select: { articles: { where: publicArticleWhere() } } },
    },
    orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
  }), [], { locale });
  return records.map((record) => ({
    id: record.id,
    slug: record.slug,
    ...localizeArticleCategory(record.translations, locale, record.slug),
    sortOrder: record.sortOrder,
    articleCount: record._count.articles,
  }));
});

export const getPublicArticleCategoryBySlug = cache(async (slug: string, locale: Locale): Promise<PublicArticleCategory | null> => {
  if (!isDatabaseConfigured()) return null;
  const record = await withDataFallback("article-categories.public.detail", () => getPrisma().articleCategory.findFirst({
    where: { slug, isActive: true },
    include: {
      translations: true,
      _count: { select: { articles: { where: publicArticleWhere() } } },
    },
  }), null, { slug, locale });
  return record ? {
    id: record.id,
    slug: record.slug,
    ...localizeArticleCategory(record.translations, locale, record.slug),
    sortOrder: record.sortOrder,
    articleCount: record._count.articles,
  } : null;
});

export async function getPublicArticleCategorySlugs(): Promise<string[]> {
  if (!isDatabaseConfigured()) return [];
  const records = await withDataFallback("article-categories.public.slugs", () => getPrisma().articleCategory.findMany({
    where: { isActive: true },
    select: { slug: true },
    orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
  }), []);
  return records.map((record) => record.slug);
}

export async function getAdminArticleCategories(): Promise<AdminArticleCategory[]> {
  if (!isDatabaseConfigured()) return [];
  const records = await withDataFallback("article-categories.admin.list", () => getPrisma().articleCategory.findMany({
    include: { translations: true, _count: { select: { articles: true } } },
    orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
  }), []);
  return records.map((record) => {
    const translations = adminTranslations(record.translations);
    return {
      id: record.id,
      slug: record.slug,
      isActive: record.isActive,
      sortOrder: record.sortOrder,
      articleCount: record._count.articles,
      translations,
      translationComplete: Object.fromEntries(
        contentLocales.map((locale) => [locale, Boolean(translations[locale].name.trim())]),
      ) as Record<ContentLocale, boolean>,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  });
}

const requireDatabase = () => {
  if (!isDatabaseConfigured()) throw new Error("数据库尚未配置，无法修改文章栏目。");
};

const assertRequiredTranslations = (input: ArticleCategoryMutationInput) => {
  if (!input.translations.en.name.trim()) throw new Error("英文栏目名称为必填项。");
  if (!input.translations.zh.name.trim()) throw new Error("中文栏目名称为必填项。");
};

const translationWrites = (input: ArticleCategoryMutationInput) =>
  contentLocales.flatMap((locale) => {
    const values = input.translations[locale];
    if (!values.name.trim()) return [];
    return [{
      locale: databaseLocaleBySiteLocale[locale],
      name: values.name.trim(),
      description: values.description.trim() || null,
      seoTitle: values.seoTitle.trim() || null,
      seoDescription: values.seoDescription.trim() || null,
    }];
  });

export async function createArticleCategory(input: ArticleCategoryMutationInput) {
  requireDatabase();
  assertRequiredTranslations(input);
  const slug = input.slug.trim().toLowerCase();
  const duplicate = await getPrisma().articleCategory.findUnique({ where: { slug }, select: { id: true } });
  if (duplicate) throw new Error("该文章栏目 Slug 已存在，请使用其他 Slug。");
  return getPrisma().articleCategory.create({
    data: {
      slug,
      isActive: input.isActive,
      sortOrder: input.sortOrder,
      translations: { create: translationWrites(input) },
    },
    select: { id: true, slug: true },
  });
}

export async function updateArticleCategory(categoryId: string, input: ArticleCategoryMutationInput) {
  requireDatabase();
  assertRequiredTranslations(input);
  const current = await getPrisma().articleCategory.findUnique({ where: { id: categoryId }, select: { id: true } });
  if (!current) throw new Error("文章栏目不存在或已经删除。");
  const slug = input.slug.trim().toLowerCase();
  const duplicate = await getPrisma().articleCategory.findFirst({ where: { slug, id: { not: categoryId } }, select: { id: true } });
  if (duplicate) throw new Error("该文章栏目 Slug 已存在，请使用其他 Slug。");
  const writes = translationWrites(input);
  return getPrisma().$transaction(async (transaction) => {
    await transaction.articleCategory.update({
      where: { id: categoryId },
      data: { slug, isActive: input.isActive, sortOrder: input.sortOrder },
    });
    for (const locale of contentLocales) {
      const databaseLocale = databaseLocaleBySiteLocale[locale];
      const values = writes.find((translation) => translation.locale === databaseLocale);
      if (values) {
        await transaction.articleCategoryTranslation.upsert({
          where: { categoryId_locale: { categoryId, locale: databaseLocale } },
          update: values,
          create: { categoryId, ...values },
        });
      } else {
        await transaction.articleCategoryTranslation.deleteMany({ where: { categoryId, locale: databaseLocale } });
      }
    }
    return { id: categoryId, slug };
  });
}

export async function setArticleCategoryActive(categoryId: string, isActive: boolean) {
  requireDatabase();
  const current = await getPrisma().articleCategory.findUnique({ where: { id: categoryId }, select: { id: true } });
  if (!current) throw new Error("文章栏目不存在或已经删除。");
  return getPrisma().articleCategory.update({ where: { id: categoryId }, data: { isActive }, select: { id: true, isActive: true } });
}

export async function deleteArticleCategory(categoryId: string) {
  requireDatabase();
  const category = await getPrisma().articleCategory.findUnique({
    where: { id: categoryId },
    select: { id: true, _count: { select: { articles: true } } },
  });
  if (!category) throw new Error("文章栏目不存在或已经删除。");
  if (category._count.articles) throw new Error(`该栏目已关联 ${category._count.articles} 篇文章，请先将文章迁移到其他栏目。`);
  await getPrisma().articleCategory.delete({ where: { id: categoryId } });
  return { id: categoryId };
}

export async function reorderArticleCategories(orderedIds: string[]) {
  requireDatabase();
  if (!orderedIds.length || new Set(orderedIds).size !== orderedIds.length) throw new Error("排序数据无效。");
  const records = await getPrisma().articleCategory.findMany({ select: { id: true } });
  const existingIds = new Set(records.map((record) => record.id));
  if (records.length !== orderedIds.length || orderedIds.some((id) => !existingIds.has(id))) {
    throw new Error("排序列表必须包含全部文章栏目，请刷新页面后重试。");
  }
  const prisma = getPrisma();
  await prisma.$transaction(orderedIds.map((id, sortOrder) => prisma.articleCategory.update({ where: { id }, data: { sortOrder } })));
  return { orderedIds };
}

export async function getArticleCategoryOptions() {
  if (!isDatabaseConfigured()) return [];
  return getPrisma().articleCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
    include: { translations: { where: { locale: { in: [DatabaseLocale.ZH, DatabaseLocale.EN] } } } },
  });
}

export const categoryTranslationStatus = (translation: ArticleCategoryTranslationFields) =>
  translation.name.trim() ? TranslationStatus.PUBLISHED : TranslationStatus.MISSING;

export type ArticleCategoryWithTranslations = Prisma.ArticleCategoryGetPayload<{ include: { translations: true } }>;
