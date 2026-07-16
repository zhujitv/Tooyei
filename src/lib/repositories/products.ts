import {
  ContentStatus,
  Locale as DatabaseLocale,
  Prisma,
  ProductMediaRole,
  TranslationStatus,
} from "@/generated/prisma/client";
import { products as sampleProducts, type LocalizedText, type Product } from "@/lib/content";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import { locales, type Locale } from "@/lib/site";

const productInclude = {
  primaryImage: true,
  media: {
    where: { visible: true },
    orderBy: [{ role: "asc" as const }, { sortOrder: "asc" as const }],
    include: { asset: true },
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
  zh: DatabaseLocale.ZH,
  en: DatabaseLocale.EN,
  es: DatabaseLocale.ES,
  de: DatabaseLocale.DE,
};

const localizedText = <T extends { locale: DatabaseLocale }>(
  translations: T[],
  read: (translation: T) => string,
): LocalizedText => {
  const chinese = translations.find(({ locale }) => locale === DatabaseLocale.ZH);
  const english = translations.find(({ locale }) => locale === DatabaseLocale.EN);
  const fallback = chinese ? read(chinese) : english ? read(english) : "";

  return Object.fromEntries(
    locales.map((locale) => {
      const translation = translations.find(({ locale: value }) => value === databaseLocale[locale]);
      return [locale, translation ? read(translation) : fallback];
    }),
  ) as LocalizedText;
};

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
  const media = product.media
    .filter(({ asset }) => isAllowedPublicAssetUrl(asset.url))
    .map(({ asset, alt, caption, role }) => ({
      url: asset.url,
      alt: alt || asset.alt || product.sku,
      caption: caption ?? undefined,
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

  return {
    slug: product.slug,
    sku: product.sku,
    category: product.kind,
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
      label: localizedText(translations, ({ label }) => label),
      value,
      unit: unit ?? undefined,
    })),
    applications: product.applications.map(({ translations, imageAsset }) => ({
      title: localizedText(translations, ({ title }) => title),
      description: localizedText(translations, ({ description }) => description ?? ""),
      image: isAllowedPublicAssetUrl(imageAsset?.url) ? imageAsset?.url : undefined,
      imageAlt: imageAsset?.alt ?? undefined,
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

export async function getPublishedProducts(): Promise<Product[]> {
  if (!isDatabaseConfigured()) return sampleProducts;

  const records = await getPrisma().product.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      translations: { some: { locale: DatabaseLocale.ZH, status: TranslationStatus.PUBLISHED } },
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
