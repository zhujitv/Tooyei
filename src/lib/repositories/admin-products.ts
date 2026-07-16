import {
  Locale as DatabaseLocale,
  TranslationStatus,
} from "@/generated/prisma/client";
import { products as sampleProducts } from "@/lib/content";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import { locales, type Locale } from "@/lib/site";

export type AdminProductSummary = {
  slug: string;
  sku: string;
  category: string;
  title: string;
  translationStates: Record<Locale, string>;
};

export type AdminProductTranslation = {
  locale: Locale;
  title: string;
  summary: string;
  status: "MISSING" | "MACHINE_DRAFT" | "NEEDS_REVIEW" | "PUBLISHED";
};

export type AdminEditableProduct = {
  slug: string;
  sku: string;
  category: string;
  translations: AdminProductTranslation[];
};

const localeMap: Record<Locale, DatabaseLocale> = {
  en: DatabaseLocale.EN,
  es: DatabaseLocale.ES,
  de: DatabaseLocale.DE,
};

const sampleEditableProduct = (slug: string): AdminEditableProduct | undefined => {
  const product = sampleProducts.find((candidate) => candidate.slug === slug);
  if (!product) return undefined;
  return {
    slug: product.slug,
    sku: product.sku,
    category: product.category,
    translations: locales.map((locale) => ({
      locale,
      title: product.title[locale],
      summary: product.summary[locale],
      status: "PUBLISHED",
    })),
  };
};

export async function getAdminProducts(): Promise<AdminProductSummary[]> {
  if (!isDatabaseConfigured()) {
    return sampleProducts.map((product) => ({
      slug: product.slug,
      sku: product.sku,
      category: product.category,
      title: product.title.en,
      translationStates: { en: "PUBLISHED", es: "PUBLISHED", de: "PUBLISHED" },
    }));
  }

  const records = await getPrisma().product.findMany({
    include: { translations: true },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
  });

  return records.map((product) => {
    const translationFor = (locale: Locale) =>
      product.translations.find((translation) => translation.locale === localeMap[locale]);
    return {
      slug: product.slug,
      sku: product.sku,
      category: product.kind,
      title: translationFor("en")?.title ?? product.sku,
      translationStates: Object.fromEntries(
        locales.map((locale) => [locale, translationFor(locale)?.status ?? TranslationStatus.MISSING]),
      ) as Record<Locale, string>,
    };
  });
}

export async function getAdminProduct(slug: string): Promise<AdminEditableProduct | undefined> {
  if (!isDatabaseConfigured()) return sampleEditableProduct(slug);

  const product = await getPrisma().product.findUnique({
    where: { slug },
    include: { translations: true },
  });
  if (!product) return undefined;

  return {
    slug: product.slug,
    sku: product.sku,
    category: product.kind,
    translations: locales.map((locale) => {
      const translation = product.translations.find(({ locale: value }) => value === localeMap[locale]);
      return {
        locale,
        title: translation?.title ?? "",
        summary: translation?.summary ?? "",
        status: translation?.status ?? "MISSING",
      };
    }),
  };
}
