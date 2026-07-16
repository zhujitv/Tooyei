import { Locale as DatabaseLocale, TranslationStatus } from "@/generated/prisma/client";
import { products } from "@/lib/content";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import type { Locale } from "@/lib/site";

export type LocaleProgress = {
  locale: Locale;
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

export async function getContentOperationsSummary(): Promise<ContentOperationsSummary> {
  if (!isDatabaseConfigured()) {
    return {
      source: "sample",
      products: products.length,
      articles: 0,
      faqs: 0,
      newInquiries: 0,
      translations: [
        { locale: "en", published: products.length, review: 0, machineDraft: 0, missing: 0 },
        { locale: "es", published: products.length, review: 0, machineDraft: 0, missing: 0 },
        { locale: "de", published: products.length, review: 0, machineDraft: 0, missing: 0 },
      ],
    };
  }

  const prisma = getPrisma();
  const [productCount, articleCount, faqCount, newInquiryCount, translationRecords] =
    await prisma.$transaction([
      prisma.product.count(),
      prisma.article.count(),
      prisma.faq.count(),
      prisma.inquiry.count({ where: { status: "NEW" } }),
      prisma.productTranslation.findMany({
        select: { locale: true, status: true },
      }),
    ]);

  const progressFor = (locale: Locale): LocaleProgress => {
    const databaseLocale = {
      en: DatabaseLocale.EN,
      es: DatabaseLocale.ES,
      de: DatabaseLocale.DE,
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
    translations: [progressFor("en"), progressFor("es"), progressFor("de")],
  };
}
