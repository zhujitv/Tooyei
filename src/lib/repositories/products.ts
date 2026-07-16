import {
  ContentStatus,
  Locale as DatabaseLocale,
  Prisma,
  TranslationStatus,
} from "@/generated/prisma/client";
import { products as sampleProducts, type LocalizedText, type Product } from "@/lib/content";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import { locales, type Locale } from "@/lib/site";

const productInclude = {
  primaryImage: true,
  translations: { where: { status: TranslationStatus.PUBLISHED } },
  features: {
    orderBy: { sortOrder: "asc" as const },
    include: { translations: true },
  },
  specifications: {
    orderBy: { sortOrder: "asc" as const },
    include: { translations: true },
  },
} satisfies Prisma.ProductInclude;

type DatabaseProduct = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

const databaseLocale: Record<Locale, DatabaseLocale> = {
  en: DatabaseLocale.EN,
  es: DatabaseLocale.ES,
  de: DatabaseLocale.DE,
};

const localizedText = <T extends { locale: DatabaseLocale }>(
  translations: T[],
  read: (translation: T) => string,
): LocalizedText => {
  const english = translations.find(({ locale }) => locale === DatabaseLocale.EN);
  const fallback = english ? read(english) : "";

  return Object.fromEntries(
    locales.map((locale) => {
      const translation = translations.find(({ locale: value }) => value === databaseLocale[locale]);
      return [locale, translation ? read(translation) : fallback];
    }),
  ) as LocalizedText;
};

const toProduct = (product: DatabaseProduct): Product => ({
  slug: product.slug,
  sku: product.sku,
  category: product.kind,
  title: localizedText(product.translations, ({ title }) => title),
  summary: localizedText(product.translations, ({ summary }) => summary),
  image:
    product.primaryImage?.url ??
    sampleProducts.find(({ slug }) => slug === product.slug)?.image ??
    "/media/product-tile-spc.png",
  features: product.features.map(({ translations }) =>
    localizedText(translations, ({ value }) => value),
  ),
  specifications: product.specifications.map(({ translations, value }) => ({
    label: localizedText(translations, ({ label }) => label),
    value,
  })),
});

export async function getPublishedProducts(): Promise<Product[]> {
  if (!isDatabaseConfigured()) return sampleProducts;

  const records = await getPrisma().product.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      translations: { some: { locale: DatabaseLocale.EN, status: TranslationStatus.PUBLISHED } },
    },
    include: productInclude,
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return records.map(toProduct);
}

export async function getPublishedProduct(slug: string): Promise<Product | undefined> {
  if (!isDatabaseConfigured()) return sampleProducts.find((product) => product.slug === slug);

  const record = await getPrisma().product.findFirst({
    where: { slug, status: ContentStatus.PUBLISHED },
    include: productInclude,
  });

  return record ? toProduct(record) : undefined;
}

export async function getPublishedProductSlugs(): Promise<string[]> {
  if (!isDatabaseConfigured()) return sampleProducts.map(({ slug }) => slug);

  const records = await getPrisma().product.findMany({
    where: { status: ContentStatus.PUBLISHED },
    select: { slug: true },
    orderBy: { sortOrder: "asc" },
  });

  return records.map(({ slug }) => slug);
}
