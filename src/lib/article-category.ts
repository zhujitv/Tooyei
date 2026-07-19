import { Locale as DatabaseLocale } from "@/generated/prisma/client";
import { databaseLocaleBySiteLocale } from "@/lib/database-locales";
import type { Locale } from "@/lib/site";

export type ArticleCategoryTranslationRecord = {
  locale: DatabaseLocale;
  name: string;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
};

export const localizeArticleCategory = (
  translations: ArticleCategoryTranslationRecord[],
  locale: Locale,
  slug: string,
) => {
  const byLocale = new Map(translations.map((translation) => [translation.locale, translation]));
  const candidates = [
    byLocale.get(databaseLocaleBySiteLocale[locale]),
    byLocale.get(DatabaseLocale.EN),
    byLocale.get(DatabaseLocale.ZH),
  ].filter((translation): translation is ArticleCategoryTranslationRecord => Boolean(translation));
  const first = (field: keyof Omit<ArticleCategoryTranslationRecord, "locale">) =>
    candidates.map((translation) => translation[field]?.trim()).find(Boolean) ?? "";
  const name = first("name") || slug;
  const description = first("description");
  return {
    name,
    description,
    seoTitle: first("seoTitle") || name,
    seoDescription: first("seoDescription") || description,
  };
};
