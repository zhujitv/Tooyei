import { Locale as DatabaseLocale, TranslationStatus } from "@/generated/prisma/client";
import { products } from "@/lib/content";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import { contentLocales, type ContentLocale } from "@/lib/site";
import { withDataFallback } from "@/lib/server-data";

export type LocaleProgress = {
  locale: ContentLocale;
  published: number;
  review: number;
  machineDraft: number;
  missing: number;
};

export type ContentOperationsSummary = {
  source: "database" | "sample";
  products: number;
  articles: number;
  faqs: number;
  newInquiries: number;
  translations: LocaleProgress[];
};

const sampleSummary = (): ContentOperationsSummary => ({
  source: "sample",
  products: products.length,
  articles: 0,
  faqs: 0,
  newInquiries: 0,
  translations: contentLocales.map((locale) => ({
    locale,
    published: products.filter((product) => Boolean(product.title?.[locale])).length,
    review: 0,
    machineDraft: 0,
    missing: products.filter((product) => !product.title?.[locale]).length,
  })),
});

export async function getContentOperationsSummary(): Promise<ContentOperationsSummary> {
  if (!isDatabaseConfigured()) return sampleSummary();

  const prisma = getPrisma();
  const result = await withDataFallback("content-operations.summary", () => prisma.$transaction([
      prisma.product.count(),
      prisma.article.count(),
      prisma.faq.count(),
      prisma.inquiry.count({ where: { status: "NEW" } }),
      prisma.productTranslation.findMany({
        select: { locale: true, status: true },
      }),
    ]), null);

  if (!result) return sampleSummary();
  const [productCount, articleCount, faqCount, newInquiryCount, translationRecords] = result;

  const progressFor = (locale: ContentLocale): LocaleProgress => {
    const databaseLocale = {
      en: DatabaseLocale.EN,
      de: DatabaseLocale.DE,
      fr: DatabaseLocale.FR,
      es: DatabaseLocale.ES,
      ru: DatabaseLocale.RU,
      ja: DatabaseLocale.JA,
      it: DatabaseLocale.IT,
      ar: DatabaseLocale.AR,
      zh: DatabaseLocale.ZH,
    }[locale];
    const count = (status: TranslationStatus) =>
      translationRecords.filter(
        (translation) => translation.locale === databaseLocale && translation.status === status,
      ).length;

    return {
      locale,
      published: count(TranslationStatus.PUBLISHED),
      review: count(TranslationStatus.NEEDS_REVIEW),
      machineDraft: count(TranslationStatus.MACHINE_DRAFT),
      missing: count(TranslationStatus.MISSING),
    };
  };

  return {
    source: "database",
    products: productCount,
    articles: articleCount,
    faqs: faqCount,
    newInquiries: newInquiryCount,
    translations: contentLocales.map(progressFor),
  };
}
