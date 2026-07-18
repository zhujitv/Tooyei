import {
  ContentStatus,
  Locale as DatabaseLocale,
  Prisma,
  ProductMediaRole,
  TranslationStatus,
} from "@/generated/prisma/client";
import { products as sampleProducts, type LocalizedText, type Product, type ProductMediaItem } from "@/lib/content";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import { locales, type Locale } from "@/lib/site";
import { withDataFallback } from "@/lib/server-data";

const publicCategoryWhere: Prisma.CategoryWhereInput = {
  isActive: true,
  status: { not: ContentStatus.ARCHIVED },
  OR: [
    { parentId: null },
    { parent: { is: { isActive: true, status: { not: ContentStatus.ARCHIVED } } } },
  ],
};

const categoryForSlug = (slug: string): Prisma.CategoryWhereInput => ({
  ...publicCategoryWhere,
  AND: [
    {
      OR: [
        { slug },
        { parent: { is: { slug, isActive: true, status: { not: ContentStatus.ARCHIVED } } } },
      ],
    },
  ],
});

const visibleCategoryClause: Prisma.ProductWhereInput = {
  OR: [
    { category: { is: publicCategoryWhere } },
    { categoryAssignments: { some: { category: { is: publicCategoryWhere } } } },
  ],
};

const productInclude = {
  primaryImage: true,
  category: {
    include: {
      translations: true,
      parent: { include: { translations: true } },
    },
  },
  categoryAssignments: {
    where: { category: { is: publicCategoryWhere } },
    orderBy: { sortOrder: "asc" as const },
    include: {
      category: {
        include: {
          translations: true,
          parent: { include: { translations: true } },
        },
      },
    },
  },
  media: {
    where: { visible: true },
    orderBy: [{ role: "asc" as const }, { sortOrder: "asc" as const }],
    include: { asset: true, translations: true },
  },
  translations: { where: { status: TranslationStatus.PUBLISHED } },
  features: {
    where: { visible: true },
    orderBy: { sortOrder: "asc" as const },
    include: { translations: true },
  },
  specifications: {
    where: { visible: true },
    orderBy: { sortOrder: "asc" as const },
    include: { translations: true },
  },
  applications: {
    where: { visible: true },
    orderBy: { sortOrder: "asc" as const },
    include: { imageAsset: true, translations: true },
  },
  downloads: {
    where: { visible: true },
    orderBy: { sortOrder: "asc" as const },
    include: { asset: true, translations: true },
  },
} satisfies Prisma.ProductInclude;

type DatabaseProduct = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

const databaseLocale: Record<Locale, DatabaseLocale> = {
  en: DatabaseLocale.EN,
  de: DatabaseLocale.DE,
  fr: DatabaseLocale.FR,
  es: DatabaseLocale.ES,
  ru: DatabaseLocale.RU,
  ja: DatabaseLocale.JA,
  it: DatabaseLocale.IT,
  ar: DatabaseLocale.AR,
  zh: DatabaseLocale.ZH,
};

const localizedText = <T extends { locale: DatabaseLocale }>(
  translations: T[],
  read: (translation: T) => string,
): LocalizedText => {
  const readSafe = (translation?: T) => {
    if (!translation) return "";
    try {
      const value = read(translation);
      return typeof value === "string" ? value.trim() : "";
    } catch {
      return "";
    }
  };
  const chinese = translations.find(({ locale }) => locale === DatabaseLocale.ZH);
  const english = translations.find(({ locale }) => locale === DatabaseLocale.EN);
  const fallback = readSafe(english) || readSafe(chinese);

  return Object.fromEntries(
    locales.map((locale) => {
      const translation = translations.find(({ locale: value }) => value === databaseLocale[locale]);
      return [locale, readSafe(translation) || fallback];
    }),
  ) as LocalizedText;
};

const categoryLocalizedText = <T extends { locale: DatabaseLocale; name: string }>(translations: T[], slug: string) =>
  Object.fromEntries(
    locales.map((locale) => {
      const selected =
        translations.find(({ locale: value }) => value === databaseLocale[locale]) ??
        translations.find(({ locale: value }) => value === DatabaseLocale.EN) ??
        translations.find(({ locale: value }) => value === DatabaseLocale.ZH);
      return [locale, selected?.name.trim() || slug];
    }),
  ) as LocalizedText;

const toCategoryReference = (category: DatabaseProduct["category"]) => ({
  slug: category.slug,
  name: categoryLocalizedText(category.translations, category.slug),
  parent: category.parent
    ? {
        slug: category.parent.slug,
        name: categoryLocalizedText(category.parent.translations, category.parent.slug),
      }
    : null,
});

const categoryIsPublic = (category: DatabaseProduct["category"]) =>
  category.isActive &&
  category.status !== ContentStatus.ARCHIVED &&
  (!category.parent || (category.parent.isActive && category.parent.status !== ContentStatus.ARCHIVED));

const isAllowedPublicAssetUrl = (url?: string | null) => {
  const value = url?.trim();
  if (!value) return false;
  if (value.startsWith("/")) return !value.startsWith("//");

  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
};

const toProduct = (product: DatabaseProduct): Product => {
  const sampleImage = sampleProducts.find(({ slug }) => slug === product.slug)?.image;
  const media: ProductMediaItem[] = product.media
    .filter(({ asset }) => isAllowedPublicAssetUrl(asset.url))
    .map(({ asset, alt, caption, role, translations }) => ({
      url: asset.url,
      alt: alt || asset.alt || product.sku,
      altLocalized: localizedText(translations, ({ alt: localizedAlt }) => localizedAlt),
      caption: caption ?? undefined,
      captionLocalized: localizedText(translations, ({ caption: localizedCaption }) => localizedCaption ?? ""),
      role,
    }));
  const hasPrimaryMedia = media.some(({ url, role }) => role === ProductMediaRole.PRIMARY && url === product.primaryImage?.url);

  if (product.primaryImage && isAllowedPublicAssetUrl(product.primaryImage.url) && !hasPrimaryMedia) {
    media.unshift({
      url: product.primaryImage.url,
      alt: product.primaryImage.alt || product.sku,
      role: ProductMediaRole.PRIMARY,
      caption: undefined,
    });
  }

  const image = media.find(({ role }) => role === ProductMediaRole.PRIMARY)?.url ?? media[0]?.url ?? sampleImage ?? "/media/product-tile-spc.jpg";
  const categories = product.categoryAssignments.map(({ category }) => toCategoryReference(category));
  const primaryCategory = categoryIsPublic(product.category)
    ? toCategoryReference(product.category)
    : categories[0];

  return {
    slug: product.slug,
    sku: product.sku,
    category: product.kind,
    primaryCategory,
    categories,
    title: localizedText(product.translations, ({ title }) => title),
    summary: localizedText(product.translations, ({ summary }) => summary),
    seoTitle: localizedText(product.translations, ({ seoTitle, title }) => seoTitle || title),
    seoDescription: localizedText(product.translations, ({ seoDescription, summary }) => seoDescription || summary),
    image,
    media,
    features: product.features.map(({ translations, icon }) =>
      Object.assign(localizedText(translations, ({ value }) => value), {
        description: localizedText(translations, ({ description }) => description ?? ""),
        icon: icon ?? undefined,
      }),
    ),
    specifications: product.specifications.map(({ translations, group, unit, value }) => ({
      group: group ?? undefined,
      groupLocalized: localizedText(translations, ({ group: localizedGroup }) => localizedGroup ?? ""),
      label: localizedText(translations, ({ label }) => label),
      value,
      displayValue: localizedText(translations, ({ displayValue }) => displayValue ?? ""),
      unit: unit ?? undefined,
    })),
    applications: product.applications.map(({ translations, imageAsset }) => ({
      title: localizedText(translations, ({ title }) => title),
      description: localizedText(translations, ({ description }) => description ?? ""),
      image: isAllowedPublicAssetUrl(imageAsset?.url) ? imageAsset?.url : undefined,
      imageAlt: imageAsset?.alt ?? undefined,
      imageAltLocalized: localizedText(translations, ({ imageAlt }) => imageAlt ?? ""),
    })),
    downloads: product.downloads
      .filter(({ asset }) => isAllowedPublicAssetUrl(asset.url))
      .map(({ translations, asset, kind }) => ({
        title: localizedText(translations, ({ title }) => title),
        description: localizedText(translations, ({ description }) => description ?? ""),
        url: asset.url,
        kind,
      })),
  };
};

const withSampleCategory = (product: Product): Product => {
  const slug = product.category.toLowerCase().replaceAll("_", "-");
  const name = Object.fromEntries(
    locales.map((locale) => [
      locale,
      locale === "zh"
        ? `${product.category} 地板`
        : locale === "es"
          ? `Suelos ${product.category}`
          : locale === "de"
            ? `${product.category}-Bodenbeläge`
            : `${product.category} Flooring`,
    ]),
  ) as LocalizedText;
  const reference = { slug, name, parent: null };
  return { ...product, primaryCategory: reference, categories: [reference] };
};

export async function getPublishedProducts(filters: { categorySlug?: string } = {}): Promise<Product[]> {
  if (!isDatabaseConfigured()) {
    const records = sampleProducts.map(withSampleCategory);
    return filters.categorySlug
      ? records.filter((product) => product.primaryCategory?.slug === filters.categorySlug)
      : records;
  }

  const records = await withDataFallback<DatabaseProduct[] | null>("products.published.list", () => getPrisma().product.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      translations: { some: { locale: DatabaseLocale.ZH, status: TranslationStatus.PUBLISHED } },
      AND: [visibleCategoryClause],
      ...(filters.categorySlug
        ? {
            OR: [
              { category: { is: categoryForSlug(filters.categorySlug) } },
              {
                categoryAssignments: {
                  some: { category: { is: categoryForSlug(filters.categorySlug) } },
                },
              },
            ],
          }
        : {}),
    },
    include: productInclude,
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  }), null, { categorySlug: filters.categorySlug });
  if (!records) {
    const samples = sampleProducts.map(withSampleCategory);
    return filters.categorySlug ? samples.filter((product) => product.primaryCategory?.slug === filters.categorySlug) : samples;
  }

  return records.map(toProduct);
}

export async function getPublishedProduct(slug: string): Promise<Product | undefined> {
  if (!isDatabaseConfigured()) {
    const product = sampleProducts.find((item) => item.slug === slug);
    return product ? withSampleCategory(product) : undefined;
  }

  const record = await withDataFallback<DatabaseProduct | null>("products.published.detail", () => getPrisma().product.findFirst({
    where: { slug, status: ContentStatus.PUBLISHED, AND: [visibleCategoryClause] },
    include: productInclude,
  }), null, { slug });
  if (!record) {
    const sample = sampleProducts.find((item) => item.slug === slug);
    return sample ? withSampleCategory(sample) : undefined;
  }

  return toProduct(record);
}

export async function getPublishedProductSlugs(): Promise<string[]> {
  if (!isDatabaseConfigured()) return sampleProducts.map(({ slug }) => slug);

  const records = await withDataFallback("products.published.slugs", () => getPrisma().product.findMany({
    where: { status: ContentStatus.PUBLISHED, AND: [visibleCategoryClause] },
    select: { slug: true },
    orderBy: { sortOrder: "asc" },
  }), () => sampleProducts.map(({ slug }) => ({ slug })));

  return records.map(({ slug }) => slug);
}
